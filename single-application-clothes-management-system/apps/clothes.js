// ================================================================
// clothes.js - 服の管理アプリモジュール
// ================================================================

class ClothesApp {
    constructor(commonInstance, config = {}) {
        this.version = '2.0.0';
        this.name = 'clothes';
        this.displayName = '服の管理';
        this.icon = '👕';
        
        this.commonInstance = commonInstance;
        this.config = config;
        
        // 衣類データ
        this.clothesData = [];
        
        // ルート設定
        this.setupRoutes();
        this.generateSampleData();
        
        this.log('👕 服の管理アプリモジュール初期化完了');
    }

    setupRoutes() {
        const app = this.commonInstance.app;

        // 衣類データ追加API
        app.post('/api/clothes/add', (req, res) => {
            try {
                const { type, color, season, size, quantity, brand, notes } = req.body;
                
                // バリデーション
                if (!type || !color || !season || !size || !quantity) {
                    return res.status(400).json({ 
                        error: '必須項目が不足しています（種別・色・季節・サイズ・数量）' 
                    });
                }

                if (quantity <= 0) {
                    return res.status(400).json({ 
                        error: '数量は1以上で入力してください' 
                    });
                }

                const record = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    type: type,
                    color: color,
                    season: season,
                    size: size,
                    quantity: parseInt(quantity),
                    brand: brand || '',
                    notes: notes || '',
                    timestamp: new Date().toISOString(),
                    date: new Date().toISOString().split('T')[0],
                    appVersion: this.version
                };

                this.clothesData.push(record);
                
                this.log(`👕 衣類追加 | ${type}(${color}・${season}・${size}) ${quantity}枚`);
                
                res.json({ 
                    success: true, 
                    data: record,
                    total: this.clothesData.length 
                });
                
            } catch (error) {
                this.log(`❌ 衣類追加エラー | ${error.message}`);
                res.status(500).json({ error: '衣類データの追加に失敗しました' });
            }
        });

        // 衣類データ一覧取得API
        app.get('/api/clothes/data', (req, res) => {
            try {
                res.json({
                    data: this.clothesData.slice().reverse(), // 新しい順
                    total: this.clothesData.length,
                    appVersion: this.version
                });
            } catch (error) {
                this.log(`❌ 衣類データ取得エラー | ${error.message}`);
                res.status(500).json({ error: '衣類データの取得に失敗しました' });
            }
        });

        // 衣類データ削除API
        app.delete('/api/clothes/data/:id', (req, res) => {
            try {
                const { id } = req.params;
                const index = this.clothesData.findIndex(item => item.id === id);
                
                if (index === -1) {
                    return res.status(404).json({ error: '衣類データが見つかりません' });
                }

                const deleted = this.clothesData.splice(index, 1)[0];
                
                this.log(`🗑️ 衣類削除 | ${deleted.type}(${deleted.color}・${deleted.season})`);
                
                res.json({ 
                    success: true, 
                    deleted,
                    remaining: this.clothesData.length 
                });
                
            } catch (error) {
                this.log(`❌ 衣類削除エラー | ${error.message}`);
                res.status(500).json({ error: '衣類データの削除に失敗しました' });
            }
        });

        // 統計データ取得API
        app.get('/api/clothes/stats', (req, res) => {
            try {
                const stats = this.generateStats();
                
                res.json({
                    success: true,
                    stats: stats,
                    total: this.clothesData.length,
                    appVersion: this.version
                });
                
            } catch (error) {
                this.log(`❌ 統計データ取得エラー | ${error.message}`);
                res.status(500).json({ error: '統計データの取得に失敗しました' });
            }
        });

        // CSV エクスポート
        app.post('/api/clothes/export/csv', (req, res) => {
            try {
                const csvData = this.clothesData.map(item => [
                    item.type,
                    item.color,
                    item.season,
                    item.size,
                    item.quantity,
                    item.brand,
                    item.notes,
                    item.date,
                    item.timestamp
                ]);

                const headers = [
                    '種別', '色', '季節', 'サイズ', '数量', 
                    'ブランド', 'メモ', '日付', '登録日時'
                ];
                
                const csvContent = this.generateCSV(csvData, headers);
                const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
                const csvFilename = `clothes_data_${timestamp}.csv`;
                
                res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                res.setHeader('Content-Disposition', `attachment; filename="${csvFilename}"`);
                res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));
                
                this.log(`📊 衣類CSV エクスポート | ${this.clothesData.length}件のデータ`);
                res.send('\uFEFF' + csvContent); // BOM付きUTF-8
                
            } catch (error) {
                this.log(`❌ CSV エクスポートエラー | ${error.message}`);
                res.status(500).json({ error: 'CSV エクスポートに失敗しました' });
            }
        });
    }

    // 統計データ生成
    generateStats() {
        const stats = {
            byType: {},
            byColor: {},
            bySeason: {},
            bySize: {},
            totalItems: 0,
            totalQuantity: 0
        };

        this.clothesData.forEach(item => {
            // 種別別統計
            stats.byType[item.type] = (stats.byType[item.type] || 0) + item.quantity;
            
            // 色別統計
            stats.byColor[item.color] = (stats.byColor[item.color] || 0) + item.quantity;
            
            // 季節別統計
            stats.bySeason[item.season] = (stats.bySeason[item.season] || 0) + item.quantity;
            
            // サイズ別統計
            stats.bySize[item.size] = (stats.bySize[item.size] || 0) + item.quantity;
            
            // 総数
            stats.totalQuantity += item.quantity;
            stats.totalItems++;
        });

        return stats;
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
        this.clothesData = [];
        
        const samples = [
            {type: "シャツ", color: "白", season: "オールシーズン", size: "M", quantity: 3, brand: "ユニクロ", notes: "仕事用"},
            {type: "ジーンズ", color: "青", season: "オールシーズン", size: "L", quantity: 2, brand: "リーバイス", notes: "お気に入り"},
            {type: "コート", color: "黒", season: "冬", size: "M", quantity: 1, brand: "ZARA", notes: "フォーマル用"},
            {type: "Tシャツ", color: "グレー", season: "夏", size: "M", quantity: 5, brand: "GU", notes: "普段着"},
            {type: "スカート", color: "茶色", season: "秋", size: "S", quantity: 2, brand: "H&M", notes: "カジュアル"},
            {type: "ジャケット", color: "紺", season: "春", size: "M", quantity: 1, brand: "無印良品", notes: "通勤用"},
            {type: "ズボン", color: "黒", season: "オールシーズン", size: "L", quantity: 4, brand: "ユニクロ", notes: "スラックス"},
            {type: "ブラウス", color: "ピンク", season: "春", size: "S", quantity: 2, brand: "GU", notes: "女性用"}
        ];

        samples.forEach((sample, index) => {
            const record = {
                id: (Date.now() - index * 1000).toString() + Math.random().toString(36).substr(2, 5),
                ...sample,
                timestamp: new Date(Date.now() - index * 60000).toISOString(),
                date: new Date().toISOString().split('T')[0],
                appVersion: this.version
            };
            this.clothesData.push(record);
        });

        this.log(`🎯 衣類サンプルデータ生成完了 | ${samples.length}件追加`);
    }

    // ログ機能
    log(message) {
        if (this.commonInstance && typeof this.commonInstance.log === 'function') {
            this.commonInstance.log(`👕 ClothesApp | ${message}`);
        } else {
            console.log(`👕 ClothesApp | ${message}`);
        }
    }

    // クリーンアップ機能
    async cleanup() {
        this.log('🧹 服の管理アプリ クリーンアップ開始');
        this.clothesData = [];
        this.log('✅ 服の管理アプリ クリーンアップ完了');
    }

    // 情報取得
    getInfo() {
        return {
            name: this.name,
            displayName: this.displayName,
            version: this.version,
            icon: this.icon,
            dataCount: this.clothesData.length,
            totalQuantity: this.clothesData.reduce((sum, item) => sum + item.quantity, 0),
            lastUpdate: this.clothesData.length > 0 ? 
                this.clothesData[this.clothesData.length - 1].timestamp : null
        };
    }
}

module.exports = ClothesApp;