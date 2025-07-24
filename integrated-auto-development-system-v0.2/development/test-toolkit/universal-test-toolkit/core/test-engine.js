/**
 * Universal Test Engine - Core Testing Engine
 * 
 * Orchestrates plugin execution and test flow
 */

const fs = require('fs');
const path = require('path');

class TestEngine {
    constructor(config) {
        this.config = config;
        this.plugins = new Map();
        this.results = {
            appName: config.appName,
            targetUrl: config.targetUrl,
            startTime: new Date().toISOString(),
            testSuites: [],
            summary: {
                totalTests: 0,
                passed: 0,
                failed: 0,
                warnings: 0,
                pluginsExecuted: 0,
                endpointsTested: 0,
                uiComponentsTested: 0
            }
        };
        
        this.loadPlugins();
    }

    // Load All Available Plugins
    loadPlugins() {
        const pluginsDir = path.join(__dirname, '../plugins');
        
        try {
            const files = fs.readdirSync(pluginsDir)
                .filter(file => file.endsWith('.js'));
            
            for (const file of files) {
                try {
                    const pluginName = file.replace('.js', '');
                    const pluginPath = path.join(pluginsDir, file);
                    const PluginClass = require(pluginPath);
                    this.plugins.set(pluginName, PluginClass);
                    console.log(`  ✓ Loaded plugin: ${pluginName}`);
                } catch (pluginError) {
                    console.warn(`  ⚠️  Failed to load plugin ${file}: ${pluginError.message}`);
                }
            }
            
            console.log(`🔌 Loaded ${this.plugins.size} plugins: ${Array.from(this.plugins.keys()).join(', ')}`);
            
        } catch (error) {
            console.warn(`⚠️  Warning: Could not load plugins directory: ${error.message}`);
        }
    }

    // Run All Test Suites
    async runAllTests() {
        console.log(`\n🧪 Starting test execution...\n`);
        
        for (let i = 0; i < this.config.testSuites.length; i++) {
            const suite = this.config.testSuites[i];
            console.log(`📋 Test Suite ${i + 1}/${this.config.testSuites.length}: ${suite.name}`);
            
            const suiteResult = await this.runTestSuite(suite);
            this.results.testSuites.push(suiteResult);
            
            // Update summary
            this.updateSummary(suiteResult);
        }
        
        this.results.endTime = new Date().toISOString();
        this.results.duration = Date.now() - new Date(this.results.startTime).getTime();
        
        return this.results;
    }

    // Run Individual Test Suite
    async runTestSuite(suite) {
        const suiteResult = {
            name: suite.name,
            description: suite.description || '',
            startTime: new Date().toISOString(),
            tests: [],
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                warnings: 0
            }
        };

        for (const test of suite.tests) {
            console.log(`  🔍 Running: ${test.name}`);
            
            const testResult = await this.runSingleTest(test);
            suiteResult.tests.push(testResult);
            
            // Update suite summary
            suiteResult.summary.total++;
            if (testResult.status === 'passed') {
                suiteResult.summary.passed++;
            } else if (testResult.status === 'failed') {
                suiteResult.summary.failed++;
            } else if (testResult.status === 'warning') {
                suiteResult.summary.warnings++;
            }
            
            // Display immediate result
            const statusIcon = this.getStatusIcon(testResult.status);
            console.log(`    ${statusIcon} ${testResult.message}`);
        }
        
        suiteResult.endTime = new Date().toISOString();
        return suiteResult;
    }

    // Run Single Test
    async runSingleTest(test) {
        const testResult = {
            name: test.name,
            type: test.type,
            startTime: new Date().toISOString(),
            status: 'unknown',
            message: '',
            data: {},
            errors: []
        };

        try {
            // Get appropriate plugin
            const PluginClass = this.plugins.get(test.type);
            if (!PluginClass) {
                throw new Error(`Plugin not found for type: ${test.type}`);
            }

            // Execute plugin
            const plugin = new PluginClass(this.config);
            const result = await plugin.execute(test);
            
            testResult.status = result.status;
            testResult.message = result.message;
            testResult.data = result.data || {};
            
            if (result.errors && result.errors.length > 0) {
                testResult.errors = result.errors;
            }
            
        } catch (error) {
            testResult.status = 'failed';
            testResult.message = `Test execution failed: ${error.message}`;
            testResult.errors.push({
                type: 'execution_error',
                message: error.message,
                stack: error.stack
            });
        }

        testResult.endTime = new Date().toISOString();
        return testResult;
    }

    // Update Overall Summary
    updateSummary(suiteResult) {
        this.results.summary.totalTests += suiteResult.summary.total;
        this.results.summary.passed += suiteResult.summary.passed;
        this.results.summary.failed += suiteResult.summary.failed;
        this.results.summary.warnings += suiteResult.summary.warnings;
        this.results.summary.pluginsExecuted++;
        
        // Count endpoints and UI components
        for (const test of suiteResult.tests) {
            if (test.type === 'api-test') {
                this.results.summary.endpointsTested++;
            } else if (test.type === 'web-ui-test') {
                this.results.summary.uiComponentsTested++;
            }
        }
    }

    // Get Status Icon
    getStatusIcon(status) {
        const icons = {
            'passed': '✅',
            'failed': '❌',
            'warning': '⚠️',
            'unknown': '❓'
        };
        return icons[status] || icons.unknown;
    }

    // Check Target Application Availability
    async checkTargetAvailability() {
        // This will be implemented to ping the target URL
        return true;
    }
}

module.exports = TestEngine;