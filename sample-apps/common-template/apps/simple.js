// ================================================================
// simple.js - シンプルサンプルアプリモジュール
// テンプレート用の最小構成デモアプリ
// ================================================================

class SimpleApp {
    constructor(commonInstance, config = {}) {
        this.version = '2.0.0';
        this.name = 'simple';
        this.displayName = 'シンプルサンプル';
        this.icon = '📄';
        
        this.commonInstance = commonInstance;
        this.config = config;
        
        // シンプルアプリ専用データ
        this.messages = [];
        
        // ルート設定
        this.setupRoutes();
        this.generateSampleData();
        
        this.log('📄 シンプルサンプルアプリモジュール初期化完了');
    }

    setupRoutes() {
        const app = this.commonInstance.app;

        // メッセージ追加API
        app.post('/api/simple/add', (req, res) => {
            try {
                const { text } = req.body;
                
                // バリデーション
                if (!text) {
                    return res.status(400).json({ 
                        error: 'テキストが必要です' 
                    });
                }

                const message = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    text,
                    timestamp: new Date().toISOString(),
                    date: new Date().toISOString().split('T')[0],
                    appVersion: this.version
                };

                this.messages.push(message);
                
                this.log(`📄 メッセージ追加 | ${text.substring(0, 20)}...`);
                
                res.json({ 
                    success: true, 
                    data: message,
                    total: this.messages.length 
                });
                
            } catch (error) {
                this.log(`❌ メッセージ追加エラー | ${error.message}`);
                res.status(500).json({ error: 'メッセージの追加に失敗しました' });
            }
        });

        // メッセージ一覧取得API
        app.get('/api/simple/data', (req, res) => {
            try {
                res.json({
                    data: this.messages.slice().reverse(), // 新しい順
                    total: this.messages.length,
                    appVersion: this.version
                });
            } catch (error) {
                this.log(`❌ メッセージ取得エラー | ${error.message}`);
                res.status(500).json({ error: 'メッセージの取得に失敗しました' });
            }
        });

        // メッセージ削除API
        app.delete('/api/simple/data/:id', (req, res) => {
            try {
                const { id } = req.params;
                const index = this.messages.findIndex(item => item.id === id);
                
                if (index === -1) {
                    return res.status(404).json({ error: 'メッセージが見つかりません' });
                }

                const deleted = this.messages.splice(index, 1)[0];
                
                this.log(`🗑️ メッセージ削除 | ${deleted.text.substring(0, 20)}...`);
                
                res.json({ 
                    success: true, 
                    deleted,
                    remaining: this.messages.length 
                });
                
            } catch (error) {
                this.log(`❌ メッセージ削除エラー | ${error.message}`);
                res.status(500).json({ error: 'メッセージの削除に失敗しました' });
            }
        });

        // CSV エクスポート
        app.post('/api/simple/export/csv', (req, res) => {
            try {
                const csvData = this.messages.map(item => [
                    item.id,
                    item.text,
                    item.date,
                    item.timestamp
                ]);

                const headers = ['ID', 'メッセージ', '日付', 'タイムスタンプ'];
                
                const csvContent = this.generateCSV(csvData, headers);
                const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
                const csvFilename = `simple_messages_${timestamp}.csv`;
                
                res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                res.setHeader('Content-Disposition', `attachment; filename="${csvFilename}"`);
                res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));
                
                this.log(`📊 CSV エクスポート | ${this.messages.length}件のメッセージ`);
                res.send('\uFEFF' + csvContent); // BOM付きUTF-8
                
            } catch (error) {
                this.log(`❌ CSV エクスポートエラー | ${error.message}`);
                res.status(500).json({ error: 'CSV エクスポートに失敗しました' });
            }
        });
    }

    // CSV生成
    generateCSV(data, headers) {
        let csvContent = '';
        
        if (headers && headers.length > 0) {
            csvContent += headers.join(',') + '\n';
        }
        
        data.forEach(row => {
            if (Array.isArray(row)) {
                csvContent += row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',') + '\n';
            }
        });
        
        return csvContent;
    }

    // サンプルデータ生成
    generateSampleData() {
        this.messages = [];
        
        const samples = [
            { text: 'これはシンプルサンプルアプリです' },
            { text: '文字を表示するだけの基本的なデモです' },
            { text: 'テンプレートとしてご利用ください' },
            { text: '開発時のルール: 機能追加前にまず全体設計を確認すること' }
        ];

        samples.forEach((sample, index) => {
            const record = {
                id: (Date.now() - index * 1000).toString() + Math.random().toString(36).substr(2, 5),
                ...sample,
                timestamp: new Date(Date.now() - index * 60000).toISOString(),
                date: new Date().toISOString().split('T')[0],
                appVersion: this.version
            };
            this.messages.push(record);
        });

        this.log(`🎯 サンプルデータ生成完了 | ${samples.length}件追加`);
    }

    // ログ機能
    log(message) {
        if (this.commonInstance && typeof this.commonInstance.log === 'function') {
            this.commonInstance.log(`📄 SimpleApp | ${message}`);
        } else {
            console.log(`📄 SimpleApp | ${message}`);
        }
    }

    // クリーンアップ機能
    async cleanup() {
        this.log('🧹 シンプルサンプルアプリ クリーンアップ開始');
        this.messages = [];
        this.log('✅ シンプルサンプルアプリ クリーンアップ完了');
    }

    // 情報取得
    getInfo() {
        return {
            name: this.name,
            displayName: this.displayName,
            version: this.version,
            icon: this.icon,
            dataCount: this.messages.length,
            lastUpdate: this.messages.length > 0 ? 
                this.messages[this.messages.length - 1].timestamp : null
        };
    }
}

module.exports = SimpleApp;