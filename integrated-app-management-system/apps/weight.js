// ================================================================
// weight.js - 体重管理アプリモジュール（UI対応版）
// ================================================================

class WeightApp {
    constructor(commonInstance, config = {}) {
        this.version = '2.0.0';
        this.name = 'weight';
        this.displayName = '体重管理';
        this.icon = '⚖️';
        
        this.commonInstance = commonInstance;
        this.config = config;
        
        // 体重管理専用データ
        this.weightRecords = [];
        
        // ルート設定
        this.setupRoutes();
        this.generateSampleData();
        
        this.log('⚖️ 体重管理アプリモジュール初期化完了');
    }

    setupRoutes() {
        const app = this.commonInstance.app;

        // 体重記録追加
        app.post('/api/weight/add', (req, res) => {
            try {
                const { weight, height, date, memo, userId } = req.body;
                
                // バリデーション
                if (!weight) {
                    return res.status(400).json({ 
                        error: '体重が必要です' 
                    });
                }

                const weightRecord = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    weight: parseFloat(weight),
                    height: height ? parseFloat(height) : null,
                    bmi: null,
                    date: date || new Date().toISOString().split('T')[0],
                    memo: memo || '',
                    timestamp: new Date().toISOString(),
                    userId: userId || 'anonymous',
                    appVersion: this.version
                };

                // BMI計算
                if (weightRecord.height) {
                    weightRecord.bmi = (weightRecord.weight / Math.pow(weightRecord.height / 100, 2)).toFixed(1);
                }

                this.weightRecords.push(weightRecord);
                
                this.log(`⚖️ 体重記録追加 | ${weight}kg ${weightRecord.bmi ? `BMI:${weightRecord.bmi}` : ''}`);
                
                res.json({ 
                    success: true, 
                    data: weightRecord,
                    total: this.weightRecords.length 
                });
                
            } catch (error) {
                this.log(`❌ 体重記録追加エラー | ${error.message}`);
                res.status(500).json({ error: '体重記録の追加に失敗しました' });
            }
        });

        // 体重記録一覧取得
        app.get('/api/weight/data', (req, res) => {
            try {
                res.json({
                    data: this.weightRecords,
                    total: this.weightRecords.length,
                    appVersion: this.version
                });
            } catch (error) {
                this.log(`❌ 体重記録取得エラー | ${error.message}`);
                res.status(500).json({ error: '体重記録の取得に失敗しました' });
            }
        });

        // CSV出力
        app.post('/api/weight/export/csv', (req, res) => {
            try {
                const csvHeader = '日付,体重(kg),身長(cm),BMI,メモ,タイムスタンプ\n';
                
                const csvData = this.weightRecords
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map(record => {
                        return [
                            record.date,
                            record.weight,
                            record.height || '',
                            record.bmi || '',
                            record.memo || '',
                            record.timestamp
                        ].map(field => `"${field}"`).join(',');
                    })
                    .join('\n');

                const csvContent = csvHeader + csvData;

                res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                res.setHeader('Content-Disposition', `attachment; filename="weight_records_${new Date().toISOString().split('T')[0]}.csv"`);
                res.send('\uFEFF' + csvContent);
                
                this.log(`📥 体重記録CSV出力 | ${this.weightRecords.length}件のデータを出力`);
                
            } catch (error) {
                this.log(`❌ 体重記録CSV出力エラー | ${error.message}`);
                res.status(500).json({ error: 'CSV出力に失敗しました' });
            }
        });
    }

    // サンプルデータ生成
    generateSampleData() {
        const baseWeight = 70;
        const height = 170;
        const samples = [];

        // 30日分のサンプルデータを生成
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            const weight = (baseWeight + (Math.random() - 0.5) * 3).toFixed(1);
            const bmi = (weight / Math.pow(height / 100, 2)).toFixed(1);
            
            samples.push({
                weight: parseFloat(weight),
                height: height,
                bmi: parseFloat(bmi),
                date: date.toISOString().split('T')[0],
                memo: i % 7 === 0 ? '週次測定' : '',
                timestamp: date.toISOString(),
                userId: 'sample'
            });
        }

        samples.forEach(sample => {
            this.weightRecords.push({
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                ...sample,
                appVersion: this.version
            });
        });

        this.log(`⚖️ サンプルデータ生成完了 | ${samples.length}件追加`);
    }

    // ログ出力
    log(message) {
        this.commonInstance.log(message);
    }
}

module.exports = WeightApp;