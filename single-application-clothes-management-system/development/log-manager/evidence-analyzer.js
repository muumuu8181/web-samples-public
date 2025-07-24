// ================================================================
// evidence-analyzer.js v1.0 - エビデンス検証GUI・ログ解析システム
// 
// 📋 機能概要:
// - 3000件ログLIKE検索機能
// - テスト結果カバレッジ表示
// - 視覚的なエビデンス確認GUI
// - 最新ログ自動取得
// - 基本3機能保護状況監視
//
// 🔍 検索・解析機能:
// - LIKE検索による該当箇所抽出
// - テスト成功/失敗フィルタリング
// - カバレッジ率計算・表示
// - リアルタイム結果更新
// ================================================================

const fs = require('fs');
const path = require('path');

class EvidenceAnalyzer {
    constructor(config = {}) {
        this.version = '1.0.0';
        this.config = {
            maxLogEntries: 10000, // 最大ログ保持数
            searchLimit: 3000,    // 検索対象最大件数
            autoRefreshInterval: 30000, // 30秒
            ...config
        };
        
        // 解析データ
        this.currentLogs = [];
        this.latestLogFile = null;
        this.analysisResults = {
            totalEntries: 0,
            searchResults: [],
            testResults: {
                passed: 0,
                failed: 0,
                total: 0,
                coverage: 0
            },
            criticalFunctions: {
                googleAuth: { status: 'unknown', tests: [] },
                realtimeDB: { status: 'unknown', tests: [] },
                logDownload: { status: 'unknown', tests: [] }
            }
        };
        
        // 検索パターン定義
        this.searchPatterns = {
            success: ['✅', '成功', '完了', 'success', 'passed', 'OK'],
            error: ['❌', 'エラー', '失敗', 'error', 'failed', 'ERROR'],
            warning: ['⚠️', '警告', 'warning', 'WARN'],
            googleAuth: ['Google認証', 'Firebase認証', 'google認証', 'firebase認証', 'authentication'],
            realtimeDB: ['RealtimeDB', 'Realtime Database', 'Firebase DB', 'データベース'],
            logDownload: ['ログDL', 'ログダウンロード', 'log download', 'generate-log', 'ログ生成']
        };
        
        this.log('🔍 エビデンス検証アナライザー v1.0 初期化完了');
        this.log(`📊 最大検索対象: ${this.config.searchLimit}件`);
        this.log('🛡️ 基本3機能監視: 有効');
    }
    
    // ================================================================
    // メインGUI生成
    // ================================================================
    generateEvidenceGUI() {
        return `
            <div class="evidence-analyzer" id="evidence-analyzer">
                <!-- ヘッダー -->
                <div class="analyzer-header">
                    <h2>🔍 エビデンス検証システム v${this.version}</h2>
                    <div class="header-actions">
                        <button onclick="EvidenceAnalyzer.refreshLogs()" class="btn-refresh" id="refresh-btn">
                            🔄 最新ログ取得
                        </button>
                        <button onclick="EvidenceAnalyzer.autoRefreshToggle()" class="btn-toggle" id="auto-refresh-btn">
                            ⏰ 自動更新: OFF
                        </button>
                    </div>
                </div>
                
                <!-- ステータス表示 -->
                <div class="status-overview" id="status-overview">
                    <div class="status-card critical-functions">
                        <h3>🛡️ 基本3機能保護状況</h3>
                        <div class="function-status">
                            <div class="function-item" id="google-auth-status">
                                <span class="function-name">Google認証</span>
                                <span class="status-indicator unknown">確認中</span>
                                <span class="test-count">0件</span>
                            </div>
                            <div class="function-item" id="realtime-db-status">
                                <span class="function-name">RealtimeDB</span>
                                <span class="status-indicator unknown">確認中</span>
                                <span class="test-count">0件</span>
                            </div>
                            <div class="function-item" id="log-download-status">
                                <span class="function-name">ログDL機能</span>
                                <span class="status-indicator unknown">確認中</span>
                                <span class="test-count">0件</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="status-card test-coverage">
                        <h3>📊 テスト結果カバレッジ</h3>
                        <div class="coverage-display">
                            <div class="coverage-circle" id="coverage-circle">
                                <div class="coverage-text">
                                    <span class="coverage-percentage" id="coverage-percentage">0%</span>
                                    <span class="coverage-label">カバレッジ</span>
                                </div>
                            </div>
                            <div class="coverage-details">
                                <div class="detail-item">
                                    <span class="label">成功:</span>
                                    <span class="value success" id="tests-passed">0</span>
                                </div>
                                <div class="detail-item">
                                    <span class="label">失敗:</span>
                                    <span class="value error" id="tests-failed">0</span>
                                </div>
                                <div class="detail-item">
                                    <span class="label">総計:</span>
                                    <span class="value total" id="tests-total">0</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="status-card log-info">
                        <h3>📄 ログ情報</h3>
                        <div class="log-summary">
                            <div class="summary-item">
                                <span class="label">最新ログファイル:</span>
                                <span class="value" id="latest-log-file">未取得</span>
                            </div>
                            <div class="summary-item">
                                <span class="label">総ログ件数:</span>
                                <span class="value" id="total-log-entries">0</span>
                            </div>
                            <div class="summary-item">
                                <span class="label">最終更新:</span>
                                <span class="value" id="last-updated">未更新</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 検索・フィルタ機能 -->
                <div class="search-section">
                    <h3>🔍 ログ検索・フィルタ</h3>
                    <div class="search-controls">
                        <div class="search-input-group">
                            <input type="text" id="search-input" placeholder="検索キーワード（LIKE検索対応）" class="search-input">
                            <button onclick="EvidenceAnalyzer.performSearch()" class="btn-search">🔍 検索</button>
                            <button onclick="EvidenceAnalyzer.clearSearch()" class="btn-clear">🗑️ クリア</button>
                        </div>
                        
                        <div class="filter-buttons">
                            <button onclick="EvidenceAnalyzer.filterBy('all')" class="filter-btn active" data-filter="all">
                                📋 全て
                            </button>
                            <button onclick="EvidenceAnalyzer.filterBy('success')" class="filter-btn" data-filter="success">
                                ✅ 成功のみ
                            </button>
                            <button onclick="EvidenceAnalyzer.filterBy('error')" class="filter-btn" data-filter="error">
                                ❌ 失敗のみ
                            </button>
                            <button onclick="EvidenceAnalyzer.filterBy('warning')" class="filter-btn" data-filter="warning">
                                ⚠️ 警告のみ
                            </button>
                            <button onclick="EvidenceAnalyzer.filterBy('critical')" class="filter-btn" data-filter="critical">
                                🛡️ 基本3機能
                            </button>
                        </div>
                        
                        <div class="search-options">
                            <label>
                                <input type="checkbox" id="case-sensitive" onchange="EvidenceAnalyzer.updateSearch()">
                                大文字小文字を区別
                            </label>
                            <label>
                                <input type="checkbox" id="regex-mode" onchange="EvidenceAnalyzer.updateSearch()">
                                正規表現モード
                            </label>
                            <label>
                                <input type="checkbox" id="highlight-matches" checked onchange="EvidenceAnalyzer.updateSearch()">
                                マッチ箇所ハイライト
                            </label>
                        </div>
                    </div>
                </div>
                
                <!-- 検索結果表示 -->
                <div class="results-section">
                    <div class="results-header">
                        <h3>📊 検索結果</h3>
                        <div class="results-info">
                            <span id="results-count">0件の結果</span>
                            <span class="separator">|</span>
                            <span id="search-time">検索時間: 0ms</span>
                        </div>
                    </div>
                    
                    <div class="results-container" id="results-container">
                        <!-- 検索結果がここに表示されます -->
                        <div class="no-results" id="no-results">
                            <p>🔍 検索キーワードを入力して検索を実行してください</p>
                            <p>または、フィルタボタンでログを絞り込んでください</p>
                        </div>
                    </div>
                    
                    <div class="results-pagination" id="results-pagination" style="display: none;">
                        <!-- ページネーションがここに表示されます -->
                    </div>
                </div>
                
                <!-- 詳細分析結果 -->
                <div class="analysis-section">
                    <h3>📈 詳細分析結果</h3>
                    <div class="analysis-tabs">
                        <button class="tab-btn active" onclick="EvidenceAnalyzer.switchTab('timeline')" data-tab="timeline">
                            📅 タイムライン
                        </button>
                        <button class="tab-btn" onclick="EvidenceAnalyzer.switchTab('categories')" data-tab="categories">
                            📊 カテゴリ別
                        </button>
                        <button class="tab-btn" onclick="EvidenceAnalyzer.switchTab('functions')" data-tab="functions">
                            🛡️ 機能別
                        </button>
                        <button class="tab-btn" onclick="EvidenceAnalyzer.switchTab('export')" data-tab="export">
                            📤 エクスポート
                        </button>
                    </div>
                    
                    <div class="tab-content">
                        <div class="tab-panel active" id="timeline-panel">
                            <div class="timeline-chart" id="timeline-chart">
                                <!-- タイムラインチャートがここに表示 -->
                            </div>
                        </div>
                        
                        <div class="tab-panel" id="categories-panel">
                            <div class="category-breakdown" id="category-breakdown">
                                <!-- カテゴリ別分析がここに表示 -->
                            </div>
                        </div>
                        
                        <div class="tab-panel" id="functions-panel">
                            <div class="function-analysis" id="function-analysis">
                                <!-- 機能別分析がここに表示 -->
                            </div>
                        </div>
                        
                        <div class="tab-panel" id="export-panel">
                            <div class="export-options">
                                <h4>📤 エクスポートオプション</h4>
                                <div class="export-buttons">
                                    <button onclick="EvidenceAnalyzer.exportResults('csv')" class="btn-export">
                                        📊 CSV形式でエクスポート
                                    </button>
                                    <button onclick="EvidenceAnalyzer.exportResults('json')" class="btn-export">
                                        📋 JSON形式でエクスポート
                                    </button>
                                    <button onclick="EvidenceAnalyzer.exportResults('report')" class="btn-export">
                                        📄 レポート形式でエクスポート
                                    </button>
                                </div>
                                <div class="export-options-detail">
                                    <label>
                                        <input type="checkbox" id="include-raw-logs"> 生ログを含める
                                    </label>
                                    <label>
                                        <input type="checkbox" id="include-analysis"> 分析結果を含める
                                    </label>
                                    <label>
                                        <input type="checkbox" id="include-timestamp"> タイムスタンプを含める
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <style>
            .evidence-analyzer {
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
                font-family: 'Helvetica Neue', Arial, sans-serif;
            }
            
            .analyzer-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 30px;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 12px;
            }
            
            .status-overview {
                display: grid;
                grid-template-columns: 1fr 300px 300px;
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .status-card {
                background: white;
                border-radius: 12px;
                padding: 20px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                border: 1px solid #e1e5e9;
            }
            
            .function-status {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .function-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 12px;
                background: #f8f9fa;
                border-radius: 8px;
            }
            
            .status-indicator {
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: bold;
            }
            
            .status-indicator.success { background: #d4edda; color: #155724; }
            .status-indicator.error { background: #f8d7da; color: #721c24; }
            .status-indicator.unknown { background: #e2e3e5; color: #383d41; }
            
            .coverage-display {
                display: flex;
                align-items: center;
                gap: 20px;
            }
            
            .coverage-circle {
                width: 100px;
                height: 100px;
                border-radius: 50%;
                background: conic-gradient(#28a745 0deg, #28a745 0deg, #e9ecef 0deg);
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
            }
            
            .coverage-circle::before {
                content: '';
                position: absolute;
                width: 70px;
                height: 70px;
                background: white;
                border-radius: 50%;
            }
            
            .coverage-text {
                z-index: 1;
                text-align: center;
            }
            
            .coverage-percentage {
                display: block;
                font-size: 18px;
                font-weight: bold;
                color: #28a745;
            }
            
            .search-section {
                background: white;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            
            .search-input-group {
                display: flex;
                gap: 10px;
                margin-bottom: 15px;
            }
            
            .search-input {
                flex: 1;
                padding: 10px 15px;
                border: 2px solid #e1e5e9;
                border-radius: 8px;
                font-size: 14px;
            }
            
            .search-input:focus {
                outline: none;
                border-color: #667eea;
            }
            
            .filter-buttons {
                display: flex;
                gap: 10px;
                margin-bottom: 15px;
                flex-wrap: wrap;
            }
            
            .filter-btn {
                padding: 8px 16px;
                border: 2px solid #e1e5e9;
                background: white;
                border-radius: 20px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .filter-btn:hover, .filter-btn.active {
                background: #667eea;
                color: white;
                border-color: #667eea;
            }
            
            .results-container {
                background: white;
                border-radius: 12px;
                min-height: 200px;
                max-height: 600px;
                overflow-y: auto;
                border: 1px solid #e1e5e9;
            }
            
            .result-item {
                padding: 15px;
                border-bottom: 1px solid #f1f3f4;
                transition: background-color 0.2s ease;
            }
            
            .result-item:hover {
                background: #f8f9fa;
            }
            
            .result-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 5px;
            }
            
            .result-timestamp {
                font-size: 12px;
                color: #6c757d;
            }
            
            .result-content {
                font-family: 'Monaco', 'Consolas', monospace;
                font-size: 13px;
                line-height: 1.4;
                white-space: pre-wrap;
            }
            
            .highlight {
                background: #fff3cd;
                padding: 1px 3px;
                border-radius: 3px;
            }
            
            .analysis-section {
                background: white;
                border-radius: 12px;
                padding: 20px;
                margin-top: 20px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            
            .analysis-tabs {
                display: flex;
                border-bottom: 2px solid #e1e5e9;
                margin-bottom: 20px;
            }
            
            .tab-btn {
                padding: 10px 20px;
                border: none;
                background: none;
                cursor: pointer;
                border-bottom: 3px solid transparent;
                transition: all 0.3s ease;
            }
            
            .tab-btn.active {
                border-bottom-color: #667eea;
                color: #667eea;
            }
            
            .tab-panel {
                display: none;
            }
            
            .tab-panel.active {
                display: block;
            }
            
            .btn-refresh, .btn-toggle, .btn-search, .btn-clear, .btn-export {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 14px;
            }
            
            .btn-refresh { background: #28a745; color: white; }
            .btn-toggle { background: #ffc107; color: black; }
            .btn-search { background: #007bff; color: white; }
            .btn-clear { background: #6c757d; color: white; }
            .btn-export { background: #17a2b8; color: white; }
            
            .no-results {
                text-align: center;
                padding: 40px;
                color: #6c757d;
            }
            </style>
        `;
    }
    
    // ================================================================
    // ログ取得・解析機能
    // ================================================================
    async getLatestLogFile() {
        try {
            const logsDir = path.join(process.cwd(), 'logs');
            
            if (!fs.existsSync(logsDir)) {
                throw new Error('logsディレクトリが存在しません');
            }
            
            const files = fs.readdirSync(logsDir)
                .filter(file => file.endsWith('.json'))
                .map(file => {
                    const filepath = path.join(logsDir, file);
                    const stats = fs.statSync(filepath);
                    return {
                        name: file,
                        path: filepath,
                        modified: stats.mtime,
                        size: stats.size
                    };
                })
                .sort((a, b) => b.modified - a.modified);
            
            if (files.length === 0) {
                throw new Error('ログファイルが見つかりません');
            }
            
            this.latestLogFile = files[0];
            this.log(`📄 最新ログファイル取得: ${this.latestLogFile.name}`);
            
            return this.latestLogFile;
            
        } catch (error) {
            this.log(`❌ ログファイル取得エラー: ${error.message}`);
            throw error;
        }
    }
    
    async loadAndAnalyzeLogs() {
        try {
            const startTime = Date.now();
            
            // 最新ログファイル取得
            await this.getLatestLogFile();
            
            // ログファイル読み込み
            const logContent = fs.readFileSync(this.latestLogFile.path, 'utf8');
            const logData = JSON.parse(logContent);
            
            // ログエントリ抽出
            this.currentLogs = this.extractLogEntries(logData);
            
            // 基本分析実行
            this.performBasicAnalysis();
            
            // 基本3機能分析
            this.analyzeCriticalFunctions();
            
            // テストカバレッジ計算
            this.calculateTestCoverage();
            
            const duration = Date.now() - startTime;
            this.log(`✅ ログ解析完了: ${this.currentLogs.length}件 (${duration}ms)`);
            
            return {
                success: true,
                logCount: this.currentLogs.length,
                analysisTime: duration,
                results: this.analysisResults
            };
            
        } catch (error) {
            this.log(`❌ ログ解析エラー: ${error.message}`);
            throw error;
        }
    }
    
    extractLogEntries(logData) {
        const entries = [];
        
        // 様々な形式のログデータに対応
        if (logData.logs && Array.isArray(logData.logs)) {
            entries.push(...logData.logs.map(log => ({
                timestamp: this.extractTimestamp(log),
                content: log,
                type: this.classifyLogEntry(log),
                source: 'main'
            })));
        }
        
        if (logData.systemInfo) {
            entries.push({
                timestamp: new Date(logData.timestamp || Date.now()),
                content: `System Info: ${JSON.stringify(logData.systemInfo)}`,
                type: 'system',
                source: 'system'
            });
        }
        
        if (logData.request) {
            entries.push({
                timestamp: new Date(logData.timestamp || Date.now()),
                content: `Request: ${JSON.stringify(logData.request)}`,
                type: 'request',
                source: 'api'
            });
        }
        
        // タイムスタンプでソート
        entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // 最大件数制限
        return entries.slice(0, this.config.searchLimit);
    }
    
    extractTimestamp(logEntry) {
        // ログエントリからタイムスタンプを抽出
        if (typeof logEntry === 'string') {
            const timestampMatch = logEntry.match(/\\[(\\d{4}-\\d{2}-\\d{2}[^\\]]+)\\]/);
            if (timestampMatch) {
                return new Date(timestampMatch[1]);
            }
        }
        
        return new Date();
    }
    
    classifyLogEntry(logEntry) {
        const content = typeof logEntry === 'string' ? logEntry : JSON.stringify(logEntry);
        
        if (this.matchesPatterns(content, this.searchPatterns.success)) {
            return 'success';
        } else if (this.matchesPatterns(content, this.searchPatterns.error)) {
            return 'error';
        } else if (this.matchesPatterns(content, this.searchPatterns.warning)) {
            return 'warning';
        }
        
        return 'info';
    }
    
    // ================================================================
    // 検索・フィルタ機能
    // ================================================================
    performSearch(searchTerm, options = {}) {
        const startTime = Date.now();
        
        if (!searchTerm || searchTerm.trim() === '') {
            return {
                results: this.currentLogs.slice(0, 100), // 最初の100件を返す
                count: this.currentLogs.length,
                searchTime: Date.now() - startTime
            };
        }
        
        const {
            caseSensitive = false,
            regexMode = false,
            highlightMatches = true
        } = options;
        
        let searchPattern;
        
        try {
            if (regexMode) {
                searchPattern = new RegExp(searchTerm, caseSensitive ? 'g' : 'gi');
            } else {
                // LIKE検索（ワイルドカード対応）
                const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
                const likePattern = escapedTerm.replace(/%/g, '.*').replace(/_/g, '.');
                searchPattern = new RegExp(likePattern, caseSensitive ? 'g' : 'gi');
            }
        } catch (error) {
            // 正規表現エラーの場合は通常の文字列検索
            searchPattern = new RegExp(
                searchTerm.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'), 
                caseSensitive ? 'g' : 'gi'
            );
        }
        
        const results = this.currentLogs.filter(entry => {
            const content = typeof entry.content === 'string' 
                ? entry.content 
                : JSON.stringify(entry.content);
            
            return searchPattern.test(content);
        }).map(entry => {
            if (highlightMatches) {
                const content = typeof entry.content === 'string' 
                    ? entry.content 
                    : JSON.stringify(entry.content);
                
                return {
                    ...entry,
                    highlightedContent: content.replace(searchPattern, '<span class="highlight">$&</span>')
                };
            }
            return entry;
        });
        
        const searchTime = Date.now() - startTime;
        
        this.log(`🔍 検索実行: "${searchTerm}" → ${results.length}件 (${searchTime}ms)`);
        
        return {
            results,
            count: results.length,
            searchTime,
            searchTerm
        };
    }
    
    filterByType(filterType) {
        const startTime = Date.now();
        
        let filtered;
        
        switch (filterType) {
            case 'success':
                filtered = this.currentLogs.filter(entry => entry.type === 'success');
                break;
            case 'error':
                filtered = this.currentLogs.filter(entry => entry.type === 'error');
                break;
            case 'warning':
                filtered = this.currentLogs.filter(entry => entry.type === 'warning');
                break;
            case 'critical':
                filtered = this.currentLogs.filter(entry => this.isCriticalFunction(entry));
                break;
            default:
                filtered = this.currentLogs;
        }
        
        const filterTime = Date.now() - startTime;
        
        this.log(`🔍 フィルタ実行: ${filterType} → ${filtered.length}件 (${filterTime}ms)`);
        
        return {
            results: filtered,
            count: filtered.length,
            filterTime,
            filterType
        };
    }
    
    // ================================================================
    // 分析機能
    // ================================================================
    performBasicAnalysis() {
        const types = { success: 0, error: 0, warning: 0, info: 0 };
        
        this.currentLogs.forEach(entry => {
            types[entry.type] = (types[entry.type] || 0) + 1;
        });
        
        this.analysisResults.totalEntries = this.currentLogs.length;
        this.analysisResults.typeBreakdown = types;
        
        this.log(`📊 基本分析完了: 成功${types.success}、エラー${types.error}、警告${types.warning}、情報${types.info}`);
    }
    
    analyzeCriticalFunctions() {
        const functions = ['googleAuth', 'realtimeDB', 'logDownload'];
        
        functions.forEach(funcName => {
            const patterns = this.searchPatterns[funcName];
            const relatedEntries = this.currentLogs.filter(entry => 
                this.matchesPatterns(entry.content, patterns)
            );
            
            const successes = relatedEntries.filter(entry => entry.type === 'success').length;
            const errors = relatedEntries.filter(entry => entry.type === 'error').length;
            
            let status = 'unknown';
            if (relatedEntries.length > 0) {
                if (errors === 0) status = 'success';
                else if (successes > errors) status = 'warning';
                else status = 'error';
            }
            
            this.analysisResults.criticalFunctions[funcName] = {
                status,
                tests: relatedEntries,
                successCount: successes,
                errorCount: errors,
                totalCount: relatedEntries.length
            };
        });
        
        this.log('🛡️ 基本3機能分析完了');
    }
    
    calculateTestCoverage() {
        const testEntries = this.currentLogs.filter(entry => 
            this.isTestEntry(entry)
        );
        
        const passed = testEntries.filter(entry => entry.type === 'success').length;
        const failed = testEntries.filter(entry => entry.type === 'error').length;
        const total = testEntries.length;
        
        const coverage = total > 0 ? Math.round((passed / total) * 100) : 0;
        
        this.analysisResults.testResults = {
            passed,
            failed,
            total,
            coverage
        };
        
        this.log(`📊 テストカバレッジ計算完了: ${coverage}% (${passed}/${total})`);
    }
    
    // ================================================================
    // ユーティリティ
    // ================================================================
    matchesPatterns(content, patterns) {
        if (!content || !patterns) return false;
        
        const text = typeof content === 'string' ? content : JSON.stringify(content);
        return patterns.some(pattern => 
            text.toLowerCase().includes(pattern.toLowerCase())
        );
    }
    
    isCriticalFunction(entry) {
        const allCriticalPatterns = [
            ...this.searchPatterns.googleAuth,
            ...this.searchPatterns.realtimeDB,
            ...this.searchPatterns.logDownload
        ];
        
        return this.matchesPatterns(entry.content, allCriticalPatterns);
    }
    
    isTestEntry(entry) {
        const content = typeof entry.content === 'string' ? entry.content : JSON.stringify(entry.content);
        const testKeywords = ['test', 'テスト', 'step', 'ステップ', 'validation', '検証', '確認'];
        
        return testKeywords.some(keyword => 
            content.toLowerCase().includes(keyword.toLowerCase())
        );
    }
    
    // ================================================================
    // エクスポート機能
    // ================================================================
    async exportResults(format, options = {}) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            let filename, content;
            
            switch (format) {
                case 'csv':
                    filename = `evidence-analysis-${timestamp}.csv`;
                    content = this.generateCSVExport(options);
                    break;
                case 'json':
                    filename = `evidence-analysis-${timestamp}.json`;
                    content = JSON.stringify(this.generateJSONExport(options), null, 2);
                    break;
                case 'report':
                    filename = `evidence-report-${timestamp}.html`;
                    content = this.generateHTMLReport(options);
                    break;
                default:
                    throw new Error(`未対応のエクスポート形式: ${format}`);
            }
            
            // ファイル保存
            const filepath = path.join('logs', 'safety-reports', filename);
            fs.mkdirSync(path.dirname(filepath), { recursive: true });
            fs.writeFileSync(filepath, content);
            
            this.log(`📤 エクスポート完了: ${filename}`);
            
            return {
                success: true,
                filename,
                filepath,
                size: content.length
            };
            
        } catch (error) {
            this.log(`❌ エクスポートエラー: ${error.message}`);
            throw error;
        }
    }
    
    generateCSVExport(options) {
        const headers = ['タイムスタンプ', 'タイプ', 'ソース', '内容'];
        const rows = [headers.join(',')];
        
        this.currentLogs.forEach(entry => {
            const row = [
                entry.timestamp.toISOString(),
                entry.type,
                entry.source,
                `"${String(entry.content).replace(/"/g, '""')}"`
            ];
            rows.push(row.join(','));
        });
        
        return rows.join('\\n');
    }
    
    generateJSONExport(options) {
        return {
            exportInfo: {
                timestamp: new Date().toISOString(),
                version: this.version,
                logFile: this.latestLogFile?.name
            },
            analysisResults: this.analysisResults,
            logs: options.includeRawLogs ? this.currentLogs : undefined
        };
    }
    
    generateHTMLReport(options) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>エビデンス検証レポート</title>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    .header { border-bottom: 2px solid #333; padding-bottom: 20px; }
                    .summary { background: #f5f5f5; padding: 20px; margin: 20px 0; }
                    .coverage { font-size: 24px; color: #28a745; font-weight: bold; }
                    .critical-functions { margin: 20px 0; }
                    .function-status { display: inline-block; margin: 10px; padding: 10px; border-radius: 5px; }
                    .success { background: #d4edda; }
                    .error { background: #f8d7da; }
                    .warning { background: #fff3cd; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🔍 エビデンス検証レポート</h1>
                    <p>生成日時: ${new Date().toLocaleString('ja-JP')}</p>
                    <p>解析ログファイル: ${this.latestLogFile?.name || '不明'}</p>
                </div>
                
                <div class="summary">
                    <h2>📊 サマリー</h2>
                    <p>総ログ件数: ${this.analysisResults.totalEntries}件</p>
                    <p class="coverage">テストカバレッジ: ${this.analysisResults.testResults.coverage}%</p>
                    <p>成功: ${this.analysisResults.testResults.passed}件 / 失敗: ${this.analysisResults.testResults.failed}件</p>
                </div>
                
                <div class="critical-functions">
                    <h2>🛡️ 基本3機能保護状況</h2>
                    ${Object.entries(this.analysisResults.criticalFunctions).map(([name, data]) => `
                        <div class="function-status ${data.status}">
                            <strong>${name}</strong>: ${data.status} (${data.totalCount}件のテスト)
                        </div>
                    `).join('')}
                </div>
                
                ${options.includeRawLogs ? `
                    <div class="raw-logs">
                        <h2>📄 生ログ</h2>
                        <pre>${this.currentLogs.map(log => log.content).join('\\n')}</pre>
                    </div>
                ` : ''}
            </body>
            </html>
        `;
    }
    
    // ================================================================
    // ログ機能
    // ================================================================
    log(message) {
        const timestamp = new Date().toLocaleString('ja-JP');
        const logEntry = `[${timestamp}] ${message}`;
        console.log(logEntry);
    }
    
    getStatus() {
        return {
            version: this.version,
            config: this.config,
            latestLogFile: this.latestLogFile,
            analysisResults: this.analysisResults,
            logCount: this.currentLogs.length
        };
    }
}

module.exports = EvidenceAnalyzer;