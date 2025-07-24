#!/usr/bin/env node

/**
 * Universal Test Toolkit - Main Entry Point
 * 
 * AI-Friendly Single Command Test Runner
 * Usage: node test-runner.js --config configs/your-app.json
 */

const fs = require('fs');
const path = require('path');
const TestEngine = require('./core/test-engine');
const ReportGenerator = require('./core/report-generator');

class TestRunner {
    constructor() {
        this.version = require('./package.json').version;
        this.startTime = Date.now();
    }

    // AI-Friendly Help Display
    showHelp() {
        console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                 Universal Test Toolkit v${this.version}                 ║
║                    AI-Friendly Test Runner                    ║
╚═══════════════════════════════════════════════════════════════╝

🚀 SIMPLE USAGE FOR AI:
   node test-runner.js --config configs/money-app.json

📋 AVAILABLE COMMANDS:
   --config [file]     Run tests with specified config
   --list-configs      Show available config files
   --help              Show this help
   --version           Show version

📁 AVAILABLE CONFIGS:
`);
        this.listConfigs();
        console.log(`
✨ FEATURES:
   • Plugin-based architecture
   • Comprehensive testing
   • Automatic report generation
   • AI-optimized interface

📊 OUTPUT:
   All results saved to: reports/test-report-YYYY-MM-DD-HH-MM-SS.json
`);
    }

    // List Available Configurations
    listConfigs() {
        const configsDir = path.join(__dirname, 'configs');
        try {
            const files = fs.readdirSync(configsDir)
                .filter(file => file.endsWith('.json'))
                .map(file => `   • ${file.replace('.json', '')}`);
            
            if (files.length > 0) {
                console.log(files.join('\n'));
            } else {
                console.log('   No configuration files found.');
            }
        } catch (error) {
            console.log('   Unable to list configs:', error.message);
        }
    }

    // Parse Command Line Arguments
    parseArgs() {
        const args = process.argv.slice(2);
        const parsed = { action: 'help' };

        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            switch (arg) {
                case '--config':
                    parsed.action = 'test';
                    parsed.configFile = args[i + 1];
                    i++; // Skip next argument
                    break;
                case '--list-configs':
                    parsed.action = 'list-configs';
                    break;
                case '--help':
                    parsed.action = 'help';
                    break;
                case '--version':
                    parsed.action = 'version';
                    break;
            }
        }

        return parsed;
    }

    // Load and Validate Configuration
    loadConfig(configFile) {
        const configPath = path.resolve(__dirname, configFile);
        
        if (!fs.existsSync(configPath)) {
            throw new Error(`Configuration file not found: ${configPath}`);
        }

        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            this.validateConfig(config);
            return config;
        } catch (error) {
            throw new Error(`Invalid configuration file: ${error.message}`);
        }
    }

    // Validate Configuration Schema
    validateConfig(config) {
        const required = ['appName', 'targetUrl', 'testSuites'];
        for (const field of required) {
            if (!config[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        if (!Array.isArray(config.testSuites)) {
            throw new Error('testSuites must be an array');
        }
    }

    // Main Test Execution
    async runTests(config) {
        console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    🚀 TEST EXECUTION STARTED                  ║
╚═══════════════════════════════════════════════════════════════╝

📱 App: ${config.appName}
🌐 Target: ${config.targetUrl}
🧪 Test Suites: ${config.testSuites.length}
⏰ Started: ${new Date().toLocaleString()}

`);

        try {
            // Initialize Test Engine
            const engine = new TestEngine(config);
            
            // Run All Tests
            const results = await engine.runAllTests();
            
            // Generate Report
            const reportGenerator = new ReportGenerator();
            const report = await reportGenerator.generate(results, config);
            
            // Display Summary
            this.displaySummary(results, report);
            
            console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                     ✅ TEST EXECUTION COMPLETED               ║
╚═══════════════════════════════════════════════════════════════╝

📊 Report saved: ${report.filePath}
⏱️  Duration: ${((Date.now() - this.startTime) / 1000).toFixed(2)}s
`);

            return report;
            
        } catch (error) {
            console.error(`
╔═══════════════════════════════════════════════════════════════╗
║                       ❌ TEST EXECUTION FAILED                ║
╚═══════════════════════════════════════════════════════════════╝

Error: ${error.message}
`);
            throw error;
        }
    }

    // Display Test Summary
    displaySummary(results, report) {
        const { summary } = report;
        
        console.log(`
📊 TEST SUMMARY:
   Total Tests: ${summary.totalTests}
   ✅ Passed: ${summary.passed}
   ❌ Failed: ${summary.failed}
   ⚠️  Warnings: ${summary.warnings}
   Success Rate: ${summary.successRate}%

🔍 COVERAGE:
   Plugins Executed: ${summary.pluginsExecuted}
   Endpoints Tested: ${summary.endpointsTested}
   UI Components: ${summary.uiComponentsTested}
`);
    }

    // Main Entry Point
    async run() {
        try {
            const args = this.parseArgs();

            switch (args.action) {
                case 'version':
                    console.log(`Universal Test Toolkit v${this.version}`);
                    break;
                    
                case 'list-configs':
                    this.listConfigs();
                    break;
                    
                case 'test':
                    if (!args.configFile) {
                        throw new Error('Configuration file required. Use --config option.');
                    }
                    const config = this.loadConfig(args.configFile);
                    await this.runTests(config);
                    break;
                    
                default:
                    this.showHelp();
            }
            
        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
            process.exit(1);
        }
    }
}

// Execute if run directly
if (require.main === module) {
    const runner = new TestRunner();
    runner.run().catch(console.error);
}

module.exports = TestRunner;