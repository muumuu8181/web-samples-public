// ================================================================
// time.js - 時間管理アプリモジュール（UI対応版）
// ================================================================

class TimeApp {
    constructor(commonInstance, config = {}) {
        this.version = '2.0.0';
        this.name = 'time';
        this.displayName = '時間管理';
        this.icon = '⏰';
        
        this.commonInstance = commonInstance;
        this.config = config;
        
        // 時間管理専用データ
        this.timeRecords = [];
        
        // ルート設定
        this.setupRoutes();
        this.generateSampleData();
        
        this.log('⏰ 時間管理アプリモジュール初期化完了');
    }

    setupRoutes() {
        const app = this.commonInstance.app;

        // 時間記録追加
        app.post('/api/time/add', (req, res) => {
            try {
                const { task, category, hours, minutes, totalMinutes, date, userId } = req.body;
                
                // バリデーション
                if (!task || !category) {
                    return res.status(400).json({ 
                        error: 'タスク名とカテゴリが必要です' 
                    });
                }

                const timeRecord = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    task,
                    category,
                    hours: hours || 0,
                    minutes: minutes || 0,
                    totalMinutes: totalMinutes || 0,
                    date: date || new Date().toISOString().split('T')[0],
                    timestamp: new Date().toISOString(),
                    userId: userId || 'anonymous',
                    appVersion: this.version
                };

                this.timeRecords.push(timeRecord);
                
                this.log(`⏰ 時間記録追加 | ${task} | ${category} | ${hours}時間${minutes}分`);
                
                res.json({ 
                    success: true, 
                    data: timeRecord,
                    total: this.timeRecords.length 
                });
                
            } catch (error) {
                this.log(`❌ 時間記録追加エラー | ${error.message}`);
                res.status(500).json({ error: '時間記録の追加に失敗しました' });
            }
        });

        // 時間記録一覧取得
        app.get('/api/time/data', (req, res) => {
            try {
                res.json({
                    data: this.timeRecords,
                    total: this.timeRecords.length,
                    appVersion: this.version
                });
            } catch (error) {
                this.log(`❌ 時間記録取得エラー | ${error.message}`);
                res.status(500).json({ error: '時間記録の取得に失敗しました' });
            }
        });

        // CSV出力
        app.post('/api/time/export/csv', (req, res) => {
            try {
                const csvHeader = '日付,タスク,カテゴリ,時間,分,合計分,タイムスタンプ\n';
                
                const csvData = this.timeRecords
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map(record => {
                        return [
                            record.date,
                            record.task,
                            record.category,
                            record.hours,
                            record.minutes,
                            record.totalMinutes,
                            record.timestamp
                        ].map(field => `"${field}"`).join(',');
                    })
                    .join('\n');

                const csvContent = csvHeader + csvData;

                res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                res.setHeader('Content-Disposition', `attachment; filename="time_records_${new Date().toISOString().split('T')[0]}.csv"`);
                res.send('\uFEFF' + csvContent);
                
                this.log(`📥 時間記録CSV出力 | ${this.timeRecords.length}件のデータを出力`);
                
            } catch (error) {
                this.log(`❌ 時間記録CSV出力エラー | ${error.message}`);
                res.status(500).json({ error: 'CSV出力に失敗しました' });
            }
        });
    }

    // サンプルデータ生成
    generateSampleData() {
        const samples = [
            { task: '資料作成', category: '仕事', hours: 2, minutes: 30, totalMinutes: 150 },
            { task: 'プログラミング学習', category: '勉強', hours: 1, minutes: 45, totalMinutes: 105 },
            { task: 'ランニング', category: '運動', hours: 0, minutes: 45, totalMinutes: 45 },
            { task: '会議資料確認', category: '仕事', hours: 0, minutes: 30, totalMinutes: 30 },
            { task: '読書', category: 'その他', hours: 1, minutes: 0, totalMinutes: 60 },
            { task: 'コーヒーブレイク', category: '休憩', hours: 0, minutes: 15, totalMinutes: 15 },
            { task: 'データ分析', category: '仕事', hours: 3, minutes: 0, totalMinutes: 180 },
            { task: '英語学習', category: '勉強', hours: 1, minutes: 20, totalMinutes: 80 }
        ];

        samples.forEach(sample => {
            this.timeRecords.push({
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                ...sample,
                date: new Date().toISOString().split('T')[0],
                timestamp: new Date().toISOString(),
                userId: 'sample',
                appVersion: this.version
            });
        });

        this.log(`⏰ サンプルデータ生成完了 | ${samples.length}件追加`);
    }

    // ログ出力
    log(message) {
        this.commonInstance.log(message);
    }
}

module.exports = TimeApp;