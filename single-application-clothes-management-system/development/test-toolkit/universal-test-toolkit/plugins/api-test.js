/**
 * API Test Plugin - Tests REST API endpoints
 * 
 * Comprehensive API endpoint testing
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

class ApiTestPlugin {
    constructor(config) {
        this.config = config;
        this.timeout = config.timeout || 10000;
    }

    // Execute API test
    async execute(test) {
        const result = {
            status: 'unknown',
            message: '',
            data: {},
            errors: []
        };

        try {
            // Validate test configuration
            if (!test.endpoint) {
                throw new Error('Missing endpoint configuration');
            }

            const endpoint = test.endpoint;
            const method = endpoint.method || 'GET';
            const url = this.buildUrl(endpoint.path);
            
            console.log(`    🌐 Testing ${method} ${url}`);

            // Make HTTP request
            const response = await this.makeRequest(method, url, endpoint);
            
            // Analyze response
            const analysis = this.analyzeResponse(response, endpoint.expect || {});
            
            result.status = analysis.success ? 'passed' : 'failed';
            result.message = analysis.message;
            result.data = {
                method: method,
                url: url,
                statusCode: response.statusCode,
                responseTime: response.responseTime,
                contentType: response.headers['content-type'] || '',
                responseSize: response.body ? response.body.length : 0
            };

            if (!analysis.success) {
                result.errors = analysis.errors;
            }

        } catch (error) {
            result.status = 'failed';
            result.message = `API test failed: ${error.message}`;
            result.errors.push({
                type: 'request_error',
                message: error.message
            });
        }

        return result;
    }

    // Build full URL
    buildUrl(path) {
        const baseUrl = this.config.targetUrl.replace(/\/$/, '');
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${baseUrl}${cleanPath}`;
    }

    // Make HTTP/HTTPS request
    async makeRequest(method, url, config) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const urlObj = new URL(url);
            const isHttps = urlObj.protocol === 'https:';
            const httpModule = isHttps ? https : http;

            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || (isHttps ? 443 : 80),
                path: urlObj.pathname + urlObj.search,
                method: method,
                headers: {
                    'User-Agent': 'Universal-Test-Toolkit/1.0',
                    'Accept': 'application/json, text/plain, */*',
                    ...config.headers
                },
                timeout: this.timeout
            };

            const req = httpModule.request(options, (res) => {
                let body = '';
                
                res.on('data', (chunk) => {
                    body += chunk;
                });

                res.on('end', () => {
                    const responseTime = Date.now() - startTime;
                    
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: body,
                        responseTime: responseTime
                    });
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error(`Request timeout after ${this.timeout}ms`));
            });

            // Send request body if provided
            if (config.body && (method === 'POST' || method === 'PUT')) {
                req.write(typeof config.body === 'string' ? config.body : JSON.stringify(config.body));
            }

            req.end();
        });
    }

    // Analyze response against expectations
    analyzeResponse(response, expectations) {
        const analysis = {
            success: true,
            message: '',
            errors: []
        };

        // Check status code
        if (expectations.statusCode) {
            if (response.statusCode !== expectations.statusCode) {
                analysis.success = false;
                analysis.errors.push({
                    type: 'status_code_mismatch',
                    expected: expectations.statusCode,
                    actual: response.statusCode
                });
            }
        } else {
            // Default: any 2xx status is success
            if (response.statusCode < 200 || response.statusCode >= 300) {
                analysis.success = false;
                analysis.errors.push({
                    type: 'http_error',
                    statusCode: response.statusCode,
                    message: `HTTP ${response.statusCode}`
                });
            }
        }

        // Check response time
        if (expectations.maxResponseTime && response.responseTime > expectations.maxResponseTime) {
            analysis.success = false;
            analysis.errors.push({
                type: 'slow_response',
                expected: `<${expectations.maxResponseTime}ms`,
                actual: `${response.responseTime}ms`
            });
        }

        // Check content type
        if (expectations.contentType) {
            const actualContentType = response.headers['content-type'] || '';
            if (!actualContentType.includes(expectations.contentType)) {
                analysis.success = false;
                analysis.errors.push({
                    type: 'content_type_mismatch',
                    expected: expectations.contentType,
                    actual: actualContentType
                });
            }
        }

        // Check response body
        if (expectations.bodyContains) {
            const contains = Array.isArray(expectations.bodyContains) 
                ? expectations.bodyContains 
                : [expectations.bodyContains];
            
            for (const text of contains) {
                if (!response.body.includes(text)) {
                    analysis.success = false;
                    analysis.errors.push({
                        type: 'body_content_missing',
                        expected: text,
                        message: `Response body does not contain: ${text}`
                    });
                }
            }
        }

        // Check JSON structure
        if (expectations.jsonSchema && response.headers['content-type']?.includes('application/json')) {
            try {
                const jsonData = JSON.parse(response.body);
                const schemaValidation = this.validateJsonSchema(jsonData, expectations.jsonSchema);
                if (!schemaValidation.valid) {
                    analysis.success = false;
                    analysis.errors.push({
                        type: 'json_schema_validation',
                        errors: schemaValidation.errors
                    });
                }
            } catch (error) {
                analysis.success = false;
                analysis.errors.push({
                    type: 'json_parse_error',
                    message: 'Response is not valid JSON'
                });
            }
        }

        // Generate summary message
        if (analysis.success) {
            analysis.message = `API endpoint responded successfully (${response.statusCode}, ${response.responseTime}ms)`;
        } else {
            const errorCount = analysis.errors.length;
            analysis.message = `API test failed with ${errorCount} error(s): ${analysis.errors.map(e => e.type).join(', ')}`;
        }

        return analysis;
    }

    // Basic JSON schema validation
    validateJsonSchema(data, schema) {
        const result = { valid: true, errors: [] };
        
        // Simple validation - can be extended
        if (schema.required) {
            for (const field of schema.required) {
                if (!(field in data)) {
                    result.valid = false;
                    result.errors.push(`Missing required field: ${field}`);
                }
            }
        }

        if (schema.properties) {
            for (const [field, definition] of Object.entries(schema.properties)) {
                if (data[field] !== undefined && definition.type) {
                    const actualType = typeof data[field];
                    if (actualType !== definition.type) {
                        result.valid = false;
                        result.errors.push(`Field ${field} should be ${definition.type}, got ${actualType}`);
                    }
                }
            }
        }

        return result;
    }
}

module.exports = ApiTestPlugin;