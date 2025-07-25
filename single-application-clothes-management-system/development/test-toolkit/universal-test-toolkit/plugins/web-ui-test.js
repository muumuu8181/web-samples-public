/**
 * Web UI Test Plugin - Tests web interface components
 * 
 * Comprehensive web UI testing without external dependencies
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

class WebUiTestPlugin {
    constructor(config) {
        this.config = config;
        this.timeout = config.timeout || 15000;
    }

    // Execute Web UI test
    async execute(test) {
        const result = {
            status: 'unknown',
            message: '',
            data: {},
            errors: []
        };

        try {
            // Validate test configuration
            if (!test.ui) {
                throw new Error('Missing UI test configuration');
            }

            const uiTest = test.ui;
            const url = this.buildUrl(uiTest.path || '/');
            
            console.log(`    🖥️  Testing UI: ${url}`);

            // Fetch page content
            const response = await this.fetchPage(url);
            
            // Analyze page content
            const analysis = this.analyzePageContent(response, uiTest);
            
            result.status = analysis.success ? 'passed' : 'failed';
            result.message = analysis.message;
            result.data = {
                url: url,
                statusCode: response.statusCode,
                responseTime: response.responseTime,
                contentType: response.headers['content-type'] || '',
                pageSize: response.body ? response.body.length : 0,
                elementsFound: analysis.elementsFound || 0,
                scriptsFound: analysis.scriptsFound || 0,
                stylesFound: analysis.stylesFound || 0
            };

            if (!analysis.success) {
                result.errors = analysis.errors;
            }

        } catch (error) {
            result.status = 'failed';
            result.message = `UI test failed: ${error.message}`;
            result.errors.push({
                type: 'ui_test_error',
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

    // Fetch page content
    async fetchPage(url) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const urlObj = new URL(url);
            const isHttps = urlObj.protocol === 'https:';
            const httpModule = isHttps ? https : http;

            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || (isHttps ? 443 : 80),
                path: urlObj.pathname + urlObj.search,
                method: 'GET',
                headers: {
                    'User-Agent': 'Universal-Test-Toolkit/1.0 (UI-Testing)',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Cache-Control': 'no-cache'
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
                reject(new Error(`Page fetch timeout after ${this.timeout}ms`));
            });

            req.end();
        });
    }

    // Analyze page content
    analyzePageContent(response, expectations) {
        const analysis = {
            success: true,
            message: '',
            errors: [],
            elementsFound: 0,
            scriptsFound: 0,
            stylesFound: 0
        };

        const html = response.body;

        // Check if page loaded successfully
        if (response.statusCode !== 200) {
            analysis.success = false;
            analysis.errors.push({
                type: 'page_load_error',
                statusCode: response.statusCode,
                message: `Page failed to load with status ${response.statusCode}`
            });
            analysis.message = `Page load failed (HTTP ${response.statusCode})`;
            return analysis;
        }

        // Check if content is HTML
        const contentType = response.headers['content-type'] || '';
        if (!contentType.includes('text/html')) {
            analysis.success = false;
            analysis.errors.push({
                type: 'content_type_error',
                expected: 'text/html',
                actual: contentType,
                message: 'Response is not HTML content'
            });
        }

        // Count page elements
        analysis.elementsFound = this.countElements(html);
        analysis.scriptsFound = this.countScripts(html);
        analysis.stylesFound = this.countStyles(html);

        // Check required elements
        if (expectations.requiredElements) {
            for (const element of expectations.requiredElements) {
                if (!this.findElement(html, element)) {
                    analysis.success = false;
                    analysis.errors.push({
                        type: 'missing_element',
                        element: element,
                        message: `Required element not found: ${element}`
                    });
                }
            }
        }

        // Check page title
        if (expectations.title) {
            const title = this.extractTitle(html);
            if (!title.includes(expectations.title)) {
                analysis.success = false;
                analysis.errors.push({
                    type: 'title_mismatch',
                    expected: expectations.title,
                    actual: title,
                    message: `Page title does not contain expected text`
                });
            }
        }

        // Check text content
        if (expectations.containsText) {
            const textToFind = Array.isArray(expectations.containsText) 
                ? expectations.containsText 
                : [expectations.containsText];
            
            for (const text of textToFind) {
                if (!html.includes(text)) {
                    analysis.success = false;
                    analysis.errors.push({
                        type: 'missing_text',
                        expected: text,
                        message: `Page does not contain required text: ${text}`
                    });
                }
            }
        }

        // Check form elements
        if (expectations.forms) {
            for (const form of expectations.forms) {
                if (!this.validateForm(html, form)) {
                    analysis.success = false;
                    analysis.errors.push({
                        type: 'form_validation_error',
                        form: form,
                        message: `Form validation failed: ${form.name || 'unnamed'}`
                    });
                }
            }
        }

        // Check JavaScript presence
        if (expectations.requiresJavaScript && analysis.scriptsFound === 0) {
            analysis.success = false;
            analysis.errors.push({
                type: 'javascript_missing',
                message: 'Page requires JavaScript but no scripts found'
            });
        }

        // Check response time
        if (expectations.maxLoadTime && response.responseTime > expectations.maxLoadTime) {
            analysis.success = false;
            analysis.errors.push({
                type: 'slow_page_load',
                expected: `<${expectations.maxLoadTime}ms`,
                actual: `${response.responseTime}ms`,
                message: 'Page load time exceeds maximum allowed'
            });
        }

        // Generate summary message
        if (analysis.success) {
            analysis.message = `UI page loaded successfully (${response.responseTime}ms, ${analysis.elementsFound} elements)`;
        } else {
            const errorCount = analysis.errors.length;
            analysis.message = `UI test failed with ${errorCount} error(s): ${analysis.errors.map(e => e.type).join(', ')}`;
        }

        return analysis;
    }

    // Count HTML elements
    countElements(html) {
        const matches = html.match(/<[^/][^>]*>/g);
        return matches ? matches.length : 0;
    }

    // Count script tags
    countScripts(html) {
        const matches = html.match(/<script[^>]*>/gi);
        return matches ? matches.length : 0;
    }

    // Count style elements
    countStyles(html) {
        const styleMatches = html.match(/<style[^>]*>/gi) || [];
        const linkMatches = html.match(/<link[^>]*rel=["\']stylesheet["\'][^>]*>/gi) || [];
        return styleMatches.length + linkMatches.length;
    }

    // Find specific element
    findElement(html, element) {
        // Simple element finding - can be enhanced
        if (element.id) {
            return html.includes(`id="${element.id}"`) || html.includes(`id='${element.id}'`);
        }
        if (element.class) {
            return html.includes(`class="${element.class}"`) || html.includes(`class='${element.class}'`);
        }
        if (element.tag) {
            return html.includes(`<${element.tag}`);
        }
        if (element.text) {
            return html.includes(element.text);
        }
        return false;
    }

    // Extract page title
    extractTitle(html) {
        const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
        return match ? match[1].trim() : '';
    }

    // Validate form structure
    validateForm(html, formConfig) {
        // Basic form validation
        if (formConfig.id && !html.includes(`<form[^>]*id="${formConfig.id}"`)) {
            return false;
        }
        
        if (formConfig.fields) {
            for (const field of formConfig.fields) {
                if (!this.findElement(html, field)) {
                    return false;
                }
            }
        }
        
        return true;
    }
}

module.exports = WebUiTestPlugin;