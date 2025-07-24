# Universal Test Toolkit

🚀 **AI-Friendly Universal Web Application Test Toolkit**

A plugin-based, extensible testing framework designed for AI automation and comprehensive web application testing.

## 🌟 Features

- **🔌 Plugin Architecture**: Easily extensible with custom test types
- **🤖 AI-Optimized**: Single-command execution perfect for AI automation  
- **🌐 Universal**: Works with any web application
- **📊 Comprehensive**: API, UI, and Performance testing in one tool
- **📋 Configuration-Based**: JSON configs for easy test definition
- **📈 Detailed Reports**: Rich JSON reports with insights and recommendations

## 🚦 Quick Start for AI

**One command to test everything:**

```bash
node test-runner.js --config configs/money-app.json
```

**See available configs:**

```bash
node test-runner.js --list-configs
```

**Get help:**

```bash
node test-runner.js --help
```

## 📁 Project Structure

```
universal-test-toolkit/
├── test-runner.js          # Main entry point (AI runs this)
├── core/
│   ├── test-engine.js      # Test execution engine
│   └── report-generator.js # Report generation
├── plugins/
│   ├── api-test.js         # API endpoint testing
│   ├── web-ui-test.js      # Web UI testing
│   └── performance-test.js # Performance testing
├── configs/
│   ├── money-app.json      # Money management app config
│   └── template.json       # Universal template
├── reports/                # Generated test reports
└── README.md
```

## 🧪 Test Types (Plugins)

### 1. API Testing (`api-test`)
- REST endpoint validation
- Response time monitoring
- Status code verification
- JSON schema validation
- Header validation

### 2. Web UI Testing (`web-ui-test`)
- Page structure validation
- Element presence checking
- Text content verification
- Form validation
- Load time monitoring

### 3. Performance Testing (`performance-test`)
- Response time analysis
- Load testing (concurrent requests)
- Resource analysis
- Performance scoring
- Memory usage tracking

## ⚙️ Configuration

### Basic Structure

```json
{
  "appName": "Your App Name",
  "targetUrl": "http://localhost:3000",
  "timeout": 15000,
  "testSuites": [
    {
      "name": "Test Suite Name",
      "description": "Description",
      "tests": [
        {
          "name": "Test Name",
          "type": "api-test|web-ui-test|performance-test",
          "// ... specific config"
        }
      ]
    }
  ]
}
```

### API Test Example

```json
{
  "name": "Health Check",
  "type": "api-test",
  "endpoint": {
    "path": "/api/health",
    "method": "GET",
    "expect": {
      "statusCode": 200,
      "maxResponseTime": 2000,
      "contentType": "application/json"
    }
  }
}
```

### UI Test Example

```json
{
  "name": "Homepage UI",
  "type": "web-ui-test", 
  "ui": {
    "path": "/",
    "title": "Welcome",
    "requiredElements": [
      { "id": "main-content" },
      { "class": "navigation" }
    ],
    "containsText": ["Welcome", "Home"]
  }
}
```

### Performance Test Example

```json
{
  "name": "Load Test",
  "type": "performance-test",
  "performance": {
    "path": "/",
    "concurrency": 5,
    "requests": 20,
    "thresholds": {
      "maxResponseTime": 3000,
      "maxFailureRate": 5,
      "minPerformanceScore": 70
    }
  }
}
```

## 📊 Reports

Reports are automatically generated in `reports/` directory:

- **Comprehensive JSON reports** with detailed results
- **Performance metrics** and scoring
- **Failure analysis** and error details
- **Recommendations** for improvements
- **Insights** based on test results

## 🔧 Extending with Plugins

Create new test types by adding plugins to `plugins/` directory:

```javascript
class YourTestPlugin {
    constructor(config) {
        this.config = config;
    }

    async execute(test) {
        return {
            status: 'passed|failed|warning',
            message: 'Test result message',
            data: {}, // Test-specific data
            errors: [] // Error details if failed
        };
    }
}

module.exports = YourTestPlugin;
```

## 🤖 AI Integration Guide

### For AI Systems:

1. **Simple Execution**: Always use `node test-runner.js --config [file]`
2. **No Complex Setup**: Single command handles everything
3. **Clear Output**: Status icons and structured messages
4. **Automatic Reports**: Results saved to `reports/` directory
5. **Error Handling**: Clear error messages for debugging

### Example AI Workflow:

```bash
# 1. Run comprehensive tests
node test-runner.js --config configs/money-app.json

# 2. Check results (automatic)
# Report saved to: reports/test-report-2025-07-24T15-30-45-123Z.json

# 3. Read report for analysis
# Use Claude Code Read tool on the generated report file
```

## 📋 Pre-configured Applications

### Money Management App (`configs/money-app.json`)
- Complete test suite for money management application
- API endpoint testing (Firebase, data operations)
- UI component validation (Kanban board, forms)
- Performance benchmarks

### Universal Template (`configs/template.json`)
- Generic template for any web application
- Customizable test patterns
- Best practice examples
- Easy adaptation guide

## ✅ Best Practices

1. **Start with Template**: Copy `template.json` and customize
2. **Comprehensive Coverage**: Include API, UI, and performance tests
3. **Realistic Thresholds**: Set achievable performance targets
4. **Incremental Testing**: Add tests gradually as features develop
5. **Regular Execution**: Run tests frequently during development

## 🔍 Troubleshooting

### Common Issues:

- **Connection Refused**: Ensure target application is running
- **Timeout Errors**: Increase timeout in config or check app performance
- **Missing Elements**: Update UI selectors after interface changes
- **Plugin Not Found**: Ensure plugin file exists in `plugins/` directory

## 📝 Version History

- **v1.0.0**: Initial release with plugin architecture
- Core test types: API, UI, Performance
- Configuration-based testing
- AI-optimized interface

---

**🎯 Perfect for AI-driven development workflows and continuous testing automation!**