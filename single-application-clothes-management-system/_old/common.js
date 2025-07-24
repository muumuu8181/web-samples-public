// ================================================================
// common.js - Node.js共通テンプレート（変更禁止）
// 
// 📋 機能概要:
// - Express.jsサーバー基盤
// - Firebase Auth & Realtime Database統合  
// - CSV データダウンロード機能
// - 自動ログ機能
// - 基本ルーティング
//
// ⚠️ 重要: このファイルは共通部分のため変更禁止
// 個別アプリ機能は各アプリファイル(例:moneyApp.js)で実装
// ================================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

class CommonTemplate {
    constructor(appName = 'WebApp') {
        this.app = express();
        this.appName = appName;
        this.logs = [];
        this.port = process.env.PORT || 3001;
        
        // 共通設定
        this.setupMiddleware();
        this.setupCommonRoutes();
        this.setupFirebaseRoutes();
        this.setupLogSystem();
        
        this.log(`🚀 ${this.appName} 共通システム初期化完了`);
    }

    // ================================================================
    // Express.js 基本設定
    // ================================================================
    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static('public'));
        this.app.use('/logs', express.static('logs'));
        
        // リクエストログ
        this.app.use((req, res, next) => {
            this.log(`📡 ${req.method} ${req.path} | IP: ${req.ip}`);
            next();
        });
    }

    // ================================================================
    // 共通ルーティング
    // ================================================================
    setupCommonRoutes() {
        // ヘルスチェック
        this.app.get('/api/health', (req, res) => {
            res.json({
                status: 'OK',
                appName: this.appName,
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        });

        // システム情報
        this.app.get('/api/info', (req, res) => {
            res.json({
                appName: this.appName,
                version: '1.0.0',
                nodeVersion: process.version,
                platform: process.platform,
                memory: process.memoryUsage()
            });
        });
    }

    // ================================================================
    // Firebase関連ルーティング
    // ================================================================
    setupFirebaseRoutes() {
        // Firebase設定情報（フロントエンド用）
        this.app.get('/api/firebase-config', (req, res) => {
            const config = {
                apiKey: "AIzaSyA5PXKChizYDCXF_GJ4KL6Ylq9K5hCPXWE",
                authDomain: "shares-b1b97.firebaseapp.com",
                databaseURL: "https://shares-b1b97-default-rtdb.firebaseio.com",
                projectId: "shares-b1b97",
                storageBucket: "shares-b1b97.appspot.com",
                messagingSenderId: "927474832426",
                appId: "1:927474832426:web:8a8d8d8d8d8d8d8d8d8d8d"
            };
            
            this.log('🔥 Firebase設定を提供');
            res.json(config);
        });

        // 認証確認
        this.app.post('/api/auth/verify', (req, res) => {
            const { idToken } = req.body;
            
            // 実際の実装では Firebase Admin SDK で検証
            this.log('🔐 認証トークン検証リクエスト');
            
            res.json({
                success: true,
                message: '認証確認完了',
                timestamp: new Date().toISOString()
            });
        });
    }

    // ================================================================
    // CSV ダウンロード機能（共通）
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
    // ログシステム（共通）
    // ================================================================
    setupLogSystem() {
        // ログディレクトリ作成
        if (!fs.existsSync('logs')) {
            fs.mkdirSync('logs', { recursive: true });
        }

        // ログ生成API
        this.app.post('/api/generate-log', (req, res) => {
            try {
                const logData = {
                    appName: this.appName,
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

        // テスト用ログ生成
        this.app.post('/api/generate-test-log', (req, res) => {
            this.log('🧪 テスト用ログ生成開始');
            this.log('📊 サンプルデータ処理中...');
            this.log('✅ テスト処理完了');
            
            // ログファイル生成
            const logData = {
                appName: this.appName,
                testMode: true,
                timestamp: new Date().toISOString(),
                logs: this.logs,
                sampleData: {
                    users: 5,
                    transactions: 15,
                    totalAmount: 12500
                }
            };

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

        // ログ一覧取得
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
    // ログ記録機能
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
    // サーバー起動
    // ================================================================
    start(callback) {
        this.server = this.app.listen(this.port, () => {
            this.log(`🌟 ${this.appName} サーバー起動完了 | Port: ${this.port}`);
            this.log(`🔗 アクセス先: http://localhost:${this.port}`);
            
            if (callback) callback();
        });

        // 終了処理
        process.on('SIGTERM', () => this.gracefulShutdown());
        process.on('SIGINT', () => this.gracefulShutdown());
    }

    gracefulShutdown() {
        this.log('🛑 サーバー終了処理開始');
        if (this.server) {
            this.server.close(() => {
                this.log('✅ サーバー終了完了');
                process.exit(0);
            });
        }
    }

    // ================================================================
    // 個別アプリ用の拡張メソッド
    // ================================================================
    addRoute(method, path, handler) {
        this.app[method.toLowerCase()](path, handler);
        this.log(`➕ ルート追加 | ${method.toUpperCase()} ${path}`);
    }

    // 個別アプリのセットアップコールバック
    setupApp(setupCallback) {
        if (typeof setupCallback === 'function') {
            setupCallback(this.app, this);
            this.log('🔧 個別アプリセットアップ完了');
        }
    }
}

module.exports = CommonTemplate;