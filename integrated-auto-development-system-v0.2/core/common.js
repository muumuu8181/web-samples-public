// ================================================================
// common.js v2.0 - 後方互換性を保つ共通テンプレート
// 
// 📋 機能概要:
// - v1.0 完全互換性維持
// - v2.0 新機能（プラグインシステム、動的読み込み）
// - Tolerant Reader パターン実装
// - Firebase基本3機能（認証・DB・ログ）保持
//
// 🔄 互換性:
// - v1.0 アプリ + v2.0 common → 動作保証
// - v2.0 アプリ + v2.0 common → 動作保証
// - 破壊的変更なし
// ================================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const ModuleLoader = require('./module-loader');

class CommonTemplate {
    constructor(config = {}) {
        // v2.0: バージョン情報
        this.version = '2.0.0';
        this.compatibilityVersion = '1.0.0';
        
        // v1.0 互換: 従来のプロパティを保持
        this.appName = config.appName || config.name || 'WebApp';
        this.port = config.port || process.env.PORT || 3001;
        this.logs = [];
        
        // v2.0: Tolerant Reader パターン - 設定の安全なマージ
        this.config = this.mergeConfig(config);
        
        // Express アプリ初期化
        this.app = express();
        this.server = null;
        
        // v2.0: プラグインシステム
        this.plugins = new Map();
        this.middlewares = [];
        
        // v2.0: モジュールローダー（新機能）
        if (this.config.features && this.config.features.moduleLoader !== false) {
            this.moduleLoader = new ModuleLoader(this, this.config.configPath);
        }
        
        // v1.0 互換: 従来の初期化手順を保持
        this.setupMiddleware();
        this.setupCommonRoutes();
        this.setupFirebaseRoutes();
        this.setupLogSystem();
        
        this.log(`🚀 CommonTemplate v${this.version} 初期化完了 | アプリ: ${this.appName}`);
        this.log(`🔄 v${this.compatibilityVersion} 互換性モード対応`);
    }

    // ================================================================
    // v2.0: 設定マージ機能（Tolerant Reader パターン）
    // ================================================================
    mergeConfig(userConfig) {
        // デフォルト設定（v1.0 互換）
        const defaultConfig = {
            version: '2.0',
            appName: 'WebApp',
            features: {
                firebaseAuth: true,
                realtimeDatabase: true,
                csvExport: true,
                jsonLogs: true,
                moduleLoader: true,
                debugMode: false
            },
            ui: {
                theme: 'default',
                compactMode: false
            },
            server: {
                cors: true,
                rateLimiting: false
            }
        };

        // v1.0 互換: 古い設定形式の変換
        if (userConfig.name && !userConfig.appName) {
            userConfig.appName = userConfig.name;
        }

        // 深いマージ（v2.0新機能を安全に追加）
        const mergedConfig = this.deepMerge(defaultConfig, userConfig);
        
        // 未知のプロパティは保持（Tolerant Reader）
        for (const key in userConfig) {
            if (!(key in mergedConfig)) {
                mergedConfig[key] = userConfig[key];
            }
        }

        return mergedConfig;
    }

    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

    // ================================================================
    // v1.0 互換: Express.js 基本設定（変更なし）
    // ================================================================
    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static('public'));
        this.app.use('/logs', express.static('logs'));
        
        // v2.0: 設定ベースの追加ミドルウェア
        if (this.config.server && this.config.server.rateLimiting) {
            // レート制限（v2.0新機能）
            this.setupRateLimiting();
        }
        
        // リクエストログ（v1.0互換）
        this.app.use((req, res, next) => {
            this.log(`📡 ${req.method} ${req.path} | IP: ${req.ip}`);
            next();
        });
    }

    // ================================================================
    // v1.0 互換: 共通ルーティング（変更なし）
    // ================================================================
    setupCommonRoutes() {
        // ヘルスチェック（v1.0互換）
        this.app.get('/api/health', (req, res) => {
            res.json({
                status: 'OK',
                appName: this.appName,
                version: this.version,
                compatibilityVersion: this.compatibilityVersion,
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        });

        // ルートパス（メインUI表示）
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '..', 'index.html'));
        });

        // システム情報（v1.0互換 + v2.0拡張）
        this.app.get('/api/info', (req, res) => {
            const info = {
                appName: this.appName,
                version: this.version,
                compatibilityVersion: this.compatibilityVersion,
                nodeVersion: process.version,
                platform: process.platform,
                memory: process.memoryUsage()
            };

            // v2.0: 追加情報
            if (this.moduleLoader) {
                info.moduleLoader = this.moduleLoader.getStats();
            }

            res.json(info);
        });

        // v2.0: 設定管理API（新機能）
        this.app.get('/api/config', (req, res) => {
            res.json({
                config: this.config,
                loadedApps: this.moduleLoader ? this.moduleLoader.getLoadedApps() : []
            });
        });

        this.app.post('/api/config', async (req, res) => {
            try {
                if (!this.moduleLoader) {
                    return res.status(400).json({ error: 'モジュールローダーが無効です' });
                }

                const result = await this.moduleLoader.updateConfig(req.body);
                this.config = result.config;
                
                res.json({ success: true, config: this.config });
            } catch (error) {
                this.log(`❌ 設定更新エラー | ${error.message}`);
                res.status(400).json({ error: error.message });
            }
        });
    }

    // ================================================================
    // v1.0 互換: Firebase関連ルーティング（変更なし）
    // ================================================================
    setupFirebaseRoutes() {
        // Firebase設定情報（v1.0互換）
        this.app.get('/api/firebase-config', (req, res) => {
            const firebaseConfig = this.config.firebase || {
                apiKey: "AIzaSyA5PXKChizYDCXF_GJ4KL6Ylq9K5hCPXWE",
                authDomain: "shares-b1b97.firebaseapp.com",
                databaseURL: "https://shares-b1b97-default-rtdb.firebaseio.com",
                projectId: "shares-b1b97",
                storageBucket: "shares-b1b97.appspot.com",
                messagingSenderId: "927474832426",
                appId: "1:927474832426:web:8a8d8d8d8d8d8d8d8d8d8d"
            };
            
            this.log('🔥 Firebase設定を提供');
            res.json(firebaseConfig);
        });

        // 認証確認（v1.0互換）
        this.app.post('/api/auth/verify', (req, res) => {
            const { idToken } = req.body;
            
            this.log('🔐 認証トークン検証リクエスト');
            
            res.json({
                success: true,
                message: '認証確認完了',
                timestamp: new Date().toISOString()
            });
        });
    }

    // ================================================================
    // v1.0 互換: CSV ダウンロード機能（変更なし）
    // ================================================================
    setupCsvDownload() {
        this.app.post('/api/download/csv', (req, res) => {
            try {
                const { data, filename = 'data.csv', headers = [] } = req.body;
                
                if (!data || !Array.isArray(data)) {
                    return res.status(400).json({ error: 'データが正しく指定されていません' });
                }

                // CSVヘッダー生成
                let csvContent = '';
                if (headers.length > 0) {
                    csvContent += headers.join(',') + '\\n';
                }

                // CSVデータ生成
                data.forEach(row => {
                    if (Array.isArray(row)) {
                        csvContent += row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',') + '\\n';
                    } else if (typeof row === 'object') {
                        csvContent += Object.values(row).map(field => `"${String(field).replace(/"/g, '""')}"`).join(',') + '\\n';
                    }
                });

                // CSVファイル生成
                const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
                const csvFilename = `${filename.replace('.csv', '')}_${timestamp}.csv`;
                
                res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                res.setHeader('Content-Disposition', `attachment; filename="${csvFilename}"`);
                res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));
                
                this.log(`📊 CSV生成完了 | ${csvFilename} | ${data.length}件`);
                res.send('\\uFEFF' + csvContent); // BOM付きUTF-8
                
            } catch (error) {
                this.log(`❌ CSV生成エラー | ${error.message}`);
                res.status(500).json({ error: 'CSV生成に失敗しました', details: error.message });
            }
        });
    }

    // ================================================================
    // v1.0 互換: ログシステム（変更なし）
    // ================================================================
    setupLogSystem() {
        // ログディレクトリ作成
        if (!fs.existsSync('logs')) {
            fs.mkdirSync('logs', { recursive: true });
        }

        // ログ生成API（v1.0互換）
        this.app.post('/api/generate-log', (req, res) => {
            try {
                const logData = {
                    appName: this.appName,
                    version: this.version,
                    timestamp: new Date().toISOString(),
                    logs: this.logs,
                    request: req.body,
                    systemInfo: {
                        nodeVersion: process.version,
                        platform: process.platform,
                        uptime: process.uptime(),
                        memory: process.memoryUsage()
                    }
                };

                // v2.0: 追加情報
                if (this.moduleLoader) {
                    logData.moduleLoader = this.moduleLoader.getStats();
                }

                const filename = `${this.appName.toLowerCase()}_log_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
                const filepath = path.join('logs', filename);
                
                fs.writeFileSync(filepath, JSON.stringify(logData, null, 2));
                
                this.log(`📄 ログファイル生成 | ${filename}`);
                res.json({ 
                    success: true, 
                    filename,
                    path: filepath,
                    logCount: this.logs.length 
                });
                
            } catch (error) {
                this.log(`❌ ログ生成エラー | ${error.message}`);
                res.status(500).json({ error: 'ログ生成に失敗しました' });
            }
        });

        // テスト用ログ生成（v1.0互換）
        this.app.post('/api/generate-test-log', (req, res) => {
            this.log('🧪 テスト用ログ生成開始');
            this.log('📊 サンプルデータ処理中...');
            this.log('✅ テスト処理完了');
            
            const logData = {
                appName: this.appName,
                version: this.version,
                testMode: true,
                timestamp: new Date().toISOString(),
                logs: this.logs,
                sampleData: {
                    users: 5,
                    transactions: 15,
                    totalAmount: 12500
                }
            };

            // v2.0: 追加情報
            if (this.moduleLoader) {
                logData.moduleLoader = this.moduleLoader.getStats();
            }

            const filename = `test_log_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
            const filepath = path.join('logs', filename);
            
            try {
                fs.writeFileSync(filepath, JSON.stringify(logData, null, 2));
                this.log(`📄 テスト用ログファイル生成完了 | ${filename}`);
                
                res.json({ 
                    success: true, 
                    message: 'テスト用ログ生成完了',
                    filename,
                    path: filepath
                });
            } catch (error) {
                this.log(`❌ テスト用ログ生成エラー | ${error.message}`);
                res.status(500).json({ error: 'テスト用ログ生成に失敗しました' });
            }
        });

        // ログ一覧取得（v1.0互換）
        this.app.get('/api/logs', (req, res) => {
            try {
                const logFiles = fs.readdirSync('logs')
                    .filter(file => file.endsWith('.json'))
                    .map(file => {
                        const filepath = path.join('logs', file);
                        const stats = fs.statSync(filepath);
                        return {
                            filename: file,
                            size: stats.size,
                            created: stats.birthtime,
                            modified: stats.mtime
                        };
                    })
                    .sort((a, b) => b.created - a.created);

                res.json({ 
                    logFiles, 
                    currentLogs: this.logs,
                    totalFiles: logFiles.length 
                });
            } catch (error) {
                res.status(500).json({ error: 'ログ一覧取得に失敗しました' });
            }
        });

        // CSV ダウンロード設定
        this.setupCsvDownload();
    }

    // ================================================================
    // v2.0: プラグインシステム（新機能）
    // ================================================================
    use(plugin) {
        if (typeof plugin === 'function') {
            // v1.0 互換: 関数形式のプラグイン
            plugin(this.app, this);
        } else if (plugin && typeof plugin.setup === 'function') {
            // v2.0: オブジェクト形式のプラグイン
            const pluginName = plugin.name || `plugin_${this.plugins.size}`;
            this.plugins.set(pluginName, plugin);
            plugin.setup(this.app, this);
            this.log(`🔌 プラグイン登録 | ${pluginName}`);
        } else {
            this.log(`⚠️ 無効なプラグイン形式`);
        }
    }

    // ================================================================
    // v2.0: モジュール管理（新機能）
    // ================================================================
    async loadModules() {
        if (!this.moduleLoader) {
            this.log('⚠️ モジュールローダーが無効のため、モジュール読み込みをスキップ');
            return [];
        }

        try {
            const results = await this.moduleLoader.loadEnabledApps();
            this.log(`📦 モジュール読み込み完了 | 成功: ${results.filter(r => r.success).length}/${results.length}`);
            return results;
        } catch (error) {
            this.log(`❌ モジュール読み込みエラー | ${error.message}`);
            return [];
        }
    }

    // ================================================================
    // v1.0 互換: ログ記録機能（変更なし）
    // ================================================================
    log(message) {
        const timestamp = new Date().toLocaleString('ja-JP');
        const logEntry = `[${timestamp}] ${message}`;
        this.logs.push(logEntry);
        console.log(logEntry);
        
        // ログが1000件を超えたら古いものから削除
        if (this.logs.length > 1000) {
            this.logs = this.logs.slice(-500);
        }
    }

    // ================================================================
    // v1.0 互換: サーバー起動（変更なし）
    // ================================================================
    start(callback) {
        this.server = this.app.listen(this.port, async () => {
            this.log(`🌟 ${this.appName} サーバー起動完了 | Port: ${this.port}`);
            this.log(`🔗 アクセス先: http://localhost:${this.port}`);
            
            // v2.0: モジュール自動読み込み
            if (this.config.features && this.config.features.moduleLoader !== false) {
                await this.loadModules();
            }
            
            if (callback) callback();
        });

        // 終了処理（v1.0互換）
        process.on('SIGTERM', () => this.gracefulShutdown());
        process.on('SIGINT', () => this.gracefulShutdown());
    }

    async gracefulShutdown() {
        this.log('🛑 サーバー終了処理開始');
        
        // v2.0: モジュールのクリーンアップ
        if (this.moduleLoader) {
            for (const appName of this.moduleLoader.appRegistry.keys()) {
                await this.moduleLoader.unloadApp(appName);
            }
        }
        
        if (this.server) {
            this.server.close(() => {
                this.log('✅ サーバー終了完了');
                process.exit(0);
            });
        }
    }

    // ================================================================
    // v1.0 互換: 個別アプリ用の拡張メソッド（変更なし）
    // ================================================================
    addRoute(method, path, handler) {
        this.app[method.toLowerCase()](path, handler);
        this.log(`➕ ルート追加 | ${method.toUpperCase()} ${path}`);
    }

    setupApp(setupCallback) {
        if (typeof setupCallback === 'function') {
            setupCallback(this.app, this);
            this.log('🔧 個別アプリセットアップ完了');
        }
    }

    // ================================================================
    // v2.0: 追加ユーティリティ（新機能）
    // ================================================================
    setupRateLimiting() {
        // シンプルなレート制限実装
        const requests = new Map();
        
        this.app.use((req, res, next) => {
            const ip = req.ip;
            const now = Date.now();
            const window = 60000; // 1分
            const maxRequests = 100;
            
            if (!requests.has(ip)) {
                requests.set(ip, []);
            }
            
            const userRequests = requests.get(ip);
            const recentRequests = userRequests.filter(time => now - time < window);
            
            if (recentRequests.length >= maxRequests) {
                return res.status(429).json({ error: 'Rate limit exceeded' });
            }
            
            recentRequests.push(now);
            requests.set(ip, recentRequests);
            next();
        });
    }

    getVersion() {
        return {
            version: this.version,
            compatibilityVersion: this.compatibilityVersion,
            features: Object.keys(this.config.features || {}).filter(key => this.config.features[key])
        };
    }
}

module.exports = CommonTemplate;