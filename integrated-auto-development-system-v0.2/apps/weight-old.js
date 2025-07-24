// ================================================================
// weight.js - 体重管理アプリモジュール
// 
// 📋 機能概要:
// - 体重・体脂肪率・筋肉量の記録
// - 健康指標の推移分析
// - BMI計算と健康状態評価
// - グラフ用データ生成
//
// 🔄 互換性:
// - v1.0 CommonTemplate 対応
// - v2.0 CommonTemplate 対応
// - モジュールローダー対応
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
        this.records = [];
        this.userProfile = {
            height: 170, // cm (デフォルト値)
            age: 30,
            gender: 'male' // male, female
        };
        this.categories = this.config.apps?.weight?.categories || [
            '体重', '体脂肪率', '筋肉量', 'BMI', '血圧', 'その他'
        ];
        
        // ルート設定
        this.setupRoutes();
        this.generateSampleData();
        
        this.log('⚖️ 体重管理アプリモジュール初期化完了');
    }

    // ================================================================
    // ルート設定
    // ================================================================
    setupRoutes() {
        const app = this.commonInstance.app;

        // 体重記録追加
        app.post('/api/weight/record', (req, res) => {
            try {
                const { weight, bodyFat, muscle, bloodPressure, memo, date } = req.body;
                
                // バリデーション
                if (!weight || weight <= 0) {
                    return res.status(400).json({ 
                        error: '体重は必須かつ正の値である必要があります' 
                    });
                }

                // BMI計算
                const heightM = this.userProfile.height / 100;
                const bmi = Math.round((weight / (heightM * heightM)) * 10) / 10;
                const bmiCategory = this.getBmiCategory(bmi);

                const record = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    weight: parseFloat(weight),
                    bodyFat: bodyFat ? parseFloat(bodyFat) : null,
                    muscle: muscle ? parseFloat(muscle) : null,
                    bmi,
                    bmiCategory,
                    bloodPressure: bloodPressure || null,
                    memo: memo || '',
                    date: date || new Date().toISOString().slice(0, 10),
                    timestamp: new Date().toISOString(),
                    appVersion: this.version
                };

                this.records.push(record);
                
                this.log(`⚖️ 体重記録追加 | ${weight}kg | BMI: ${bmi} | ${bmiCategory}`);
                
                res.json({ 
                    success: true, 
                    record,
                    total: this.records.length 
                });
                
            } catch (error) {
                this.log(`❌ 体重記録追加エラー | ${error.message}`);
                res.status(500).json({ error: '体重記録の追加に失敗しました' });
            }
        });

        // 体重記録一覧取得
        app.get('/api/weight/records', (req, res) => {
            try {
                const { startDate, endDate, limit } = req.query;
                let filteredRecords = [...this.records];

                // 日付フィルター
                if (startDate) {
                    filteredRecords = filteredRecords.filter(r => r.date >= startDate);
                }
                if (endDate) {
                    filteredRecords = filteredRecords.filter(r => r.date <= endDate);
                }

                // 件数制限
                if (limit) {
                    filteredRecords = filteredRecords.slice(-parseInt(limit));
                }

                // 統計情報計算
                const stats = this.calculateStats(filteredRecords);
                
                res.json({ 
                    records: filteredRecords.reverse(), // 新しい順
                    stats,
                    userProfile: this.userProfile,
                    filters: { startDate, endDate, limit },
                    appVersion: this.version
                });
                
            } catch (error) {
                this.log(`❌ 体重記録一覧取得エラー | ${error.message}`);
                res.status(500).json({ error: '体重記録一覧の取得に失敗しました' });
            }
        });

        // 体重記録削除
        app.delete('/api/weight/record/:id', (req, res) => {
            try {
                const { id } = req.params;
                const index = this.records.findIndex(r => r.id === id);
                
                if (index === -1) {
                    return res.status(404).json({ error: '体重記録が見つかりません' });
                }

                const deletedRecord = this.records.splice(index, 1)[0];
                
                this.log(`🗑️ 体重記録削除 | ID: ${id} | ${deletedRecord.weight}kg`);
                
                res.json({ 
                    success: true, 
                    deletedRecord,
                    remaining: this.records.length 
                });
                
            } catch (error) {
                this.log(`❌ 体重記録削除エラー | ${error.message}`);
                res.status(500).json({ error: '体重記録の削除に失敗しました' });
            }
        });

        // ユーザープロフィール取得
        app.get('/api/weight/profile', (req, res) => {
            res.json({ 
                profile: this.userProfile,
                appVersion: this.version
            });
        });

        // ユーザープロフィール更新
        app.post('/api/weight/profile', (req, res) => {
            try {
                const { height, age, gender } = req.body;
                
                if (height && height > 0) {
                    this.userProfile.height = parseFloat(height);
                }
                if (age && age > 0) {
                    this.userProfile.age = parseInt(age);
                }
                if (gender && ['male', 'female'].includes(gender)) {
                    this.userProfile.gender = gender;
                }

                // 既存記録のBMI再計算
                this.recalculateBmi();
                
                this.log(`👤 プロフィール更新 | 身長: ${this.userProfile.height}cm | 年齢: ${this.userProfile.age}`);
                
                res.json({ 
                    success: true, 
                    profile: this.userProfile,
                    message: 'プロフィールを更新しました'
                });
                
            } catch (error) {
                this.log(`❌ プロフィール更新エラー | ${error.message}`);
                res.status(500).json({ error: 'プロフィールの更新に失敗しました' });
            }
        });

        // グラフ用データ取得
        app.get('/api/weight/chart-data', (req, res) => {
            try {
                const { days = 30 } = req.query;
                const chartData = this.generateChartData(parseInt(days));
                
                res.json({ 
                    chartData,
                    period: `${days}日間`,
                    appVersion: this.version
                });
                
            } catch (error) {
                this.log(`❌ グラフデータ生成エラー | ${error.message}`);
                res.status(500).json({ error: 'グラフデータの生成に失敗しました' });
            }
        });

        // 健康レポート
        app.get('/api/weight/health-report', (req, res) => {
            try {
                const report = this.generateHealthReport();
                
                this.log(`📊 健康レポート生成 | ${this.records.length}件の記録を分析`);
                
                res.json(report);
                
            } catch (error) {
                this.log(`❌ 健康レポート生成エラー | ${error.message}`);
                res.status(500).json({ error: '健康レポートの生成に失敗しました' });
            }
        });

        // CSV エクスポート
        app.post('/api/weight/export/csv', (req, res) => {
            try {
                const { startDate, endDate } = req.body;
                let exportRecords = [...this.records];

                // フィルター適用
                if (startDate) {
                    exportRecords = exportRecords.filter(r => r.date >= startDate);
                }
                if (endDate) {
                    exportRecords = exportRecords.filter(r => r.date <= endDate);
                }

                // CSV用データ変換
                const csvData = exportRecords.map(r => [
                    r.date,
                    r.weight,
                    r.bodyFat || '',
                    r.muscle || '',
                    r.bmi,
                    r.bmiCategory,
                    r.bloodPressure || '',
                    r.memo,
                    r.timestamp
                ]);

                const headers = ['日付', '体重(kg)', '体脂肪率(%)', '筋肉量(kg)', 'BMI', 'BMI判定', '血圧', 'メモ', '登録日時'];
                
                // CSVコンテンツ生成
                const csvContent = this.generateCSV(csvData, headers);
                const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
                const csvFilename = `weight_records_${timestamp}.csv`;
                
                res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                res.setHeader('Content-Disposition', `attachment; filename="${csvFilename}"`);
                res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));
                
                this.log(`📊 CSV エクスポート | ${exportRecords.length}件の体重記録`);
                res.send('\\uFEFF' + csvContent); // BOM付きUTF-8
                
            } catch (error) {
                this.log(`❌ CSV エクスポートエラー | ${error.message}`);
                res.status(500).json({ error: 'CSV エクスポートに失敗しました' });
            }
        });

        // サンプルデータ生成
        app.post('/api/weight/sample-data', (req, res) => {
            try {
                this.generateSampleData();
                res.json({ 
                    success: true, 
                    message: 'サンプルデータを生成しました',
                    totalRecords: this.records.length,
                    appVersion: this.version
                });
            } catch (error) {
                res.status(500).json({ error: 'サンプルデータ生成に失敗しました' });
            }
        });
    }

    // ================================================================
    // BMI関連機能
    // ================================================================
    getBmiCategory(bmi) {
        if (bmi < 18.5) return '低体重';
        if (bmi < 25) return '標準';
        if (bmi < 30) return '肥満(1度)';
        if (bmi < 35) return '肥満(2度)';
        return '肥満(3度)';
    }

    recalculateBmi() {
        const heightM = this.userProfile.height / 100;
        
        this.records.forEach(record => {
            record.bmi = Math.round((record.weight / (heightM * heightM)) * 10) / 10;
            record.bmiCategory = this.getBmiCategory(record.bmi);
        });
        
        this.log(`🔄 BMI再計算完了 | ${this.records.length}件`);
    }

    // ================================================================
    // 統計計算
    // ================================================================
    calculateStats(records) {
        if (records.length === 0) {
            return {
                totalRecords: 0,
                currentWeight: null,
                weightChange: null,
                averageBmi: null,
                trend: 'no-data'
            };
        }

        const sortedRecords = records.sort((a, b) => new Date(a.date) - new Date(b.date));
        const latestRecord = sortedRecords[sortedRecords.length - 1];
        const firstRecord = sortedRecords[0];
        
        const currentWeight = latestRecord.weight;
        const weightChange = currentWeight - firstRecord.weight;
        const averageBmi = Math.round((records.reduce((sum, r) => sum + r.bmi, 0) / records.length) * 10) / 10;
        
        // トレンド分析
        let trend = 'stable';
        if (weightChange > 1) trend = 'increasing';
        else if (weightChange < -1) trend = 'decreasing';

        // 最近の推移（直近5件）
        const recentRecords = sortedRecords.slice(-5);
        const recentTrend = this.calculateTrend(recentRecords);

        return {
            totalRecords: records.length,
            currentWeight,
            weightChange: Math.round(weightChange * 10) / 10,
            averageBmi,
            trend,
            recentTrend,
            latestRecord,
            firstRecord,
            dateRange: {
                start: firstRecord.date,
                end: latestRecord.date
            }
        };
    }

    calculateTrend(records) {
        if (records.length < 2) return 'insufficient-data';
        
        const weights = records.map(r => r.weight);
        const changes = [];
        
        for (let i = 1; i < weights.length; i++) {
            changes.push(weights[i] - weights[i - 1]);
        }
        
        const averageChange = changes.reduce((sum, c) => sum + c, 0) / changes.length;
        
        if (averageChange > 0.2) return 'increasing';
        if (averageChange < -0.2) return 'decreasing';
        return 'stable';
    }

    // ================================================================
    // グラフデータ生成
    // ================================================================
    generateChartData(days) {
        const endDate = new Date();
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - days);
        
        const filteredRecords = this.records.filter(r => {
            const recordDate = new Date(r.date);
            return recordDate >= startDate && recordDate <= endDate;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));

        return {
            labels: filteredRecords.map(r => r.date),
            datasets: {
                weight: filteredRecords.map(r => r.weight),
                bmi: filteredRecords.map(r => r.bmi),
                bodyFat: filteredRecords.filter(r => r.bodyFat).map(r => ({ x: r.date, y: r.bodyFat })),
                muscle: filteredRecords.filter(r => r.muscle).map(r => ({ x: r.date, y: r.muscle }))
            },
            period: { start: startDate.toISOString().slice(0, 10), end: endDate.toISOString().slice(0, 10) }
        };
    }

    // ================================================================
    // 健康レポート生成
    // ================================================================
    generateHealthReport() {
        const stats = this.calculateStats(this.records);
        const chartData = this.generateChartData(90); // 90日間
        
        // 健康アドバイス生成
        const advice = this.generateHealthAdvice(stats);

        return {
            summary: stats,
            chartData,
            advice,
            userProfile: this.userProfile,
            generatedAt: new Date().toISOString(),
            appVersion: this.version
        };
    }

    generateHealthAdvice(stats) {
        const advice = [];
        
        if (!stats.latestRecord) {
            advice.push({ type: 'info', message: 'まずは体重を記録してみましょう' });
            return advice;
        }

        const latestBmi = stats.latestRecord.bmi;
        
        // BMIに基づくアドバイス
        if (latestBmi < 18.5) {
            advice.push({ type: 'warning', message: 'BMIが低めです。栄養バランスの良い食事を心がけましょう' });
        } else if (latestBmi >= 25) {
            advice.push({ type: 'warning', message: 'BMIが高めです。適度な運動と食事管理を検討しましょう' });
        } else {
            advice.push({ type: 'success', message: 'BMIは標準範囲内です。現在の生活習慣を維持しましょう' });
        }

        // トレンドに基づくアドバイス
        if (stats.trend === 'increasing' && stats.weightChange > 3) {
            advice.push({ type: 'caution', message: '体重が増加傾向です。食事と運動のバランスを見直してみましょう' });
        } else if (stats.trend === 'decreasing' && stats.weightChange < -3) {
            advice.push({ type: 'caution', message: '体重が減少傾向です。健康的な範囲での減量を心がけましょう' });
        } else if (stats.trend === 'stable') {
            advice.push({ type: 'success', message: '体重が安定しています。良い調子です！' });
        }

        // 記録頻度のアドバイス
        if (stats.totalRecords < 7) {
            advice.push({ type: 'info', message: '定期的な記録で変化を把握しやすくなります' });
        }

        return advice;
    }

    // ================================================================
    // CSV生成
    // ================================================================
    generateCSV(data, headers) {
        let csvContent = '';
        
        // ヘッダー追加
        if (headers && headers.length > 0) {
            csvContent += headers.join(',') + '\\n';
        }
        
        // データ行追加
        data.forEach(row => {
            if (Array.isArray(row)) {
                csvContent += row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',') + '\\n';
            } else if (typeof row === 'object') {
                csvContent += Object.values(row).map(field => `"${String(field).replace(/"/g, '""')}"`).join(',') + '\\n';
            }
        });
        
        return csvContent;
    }

    // ================================================================
    // サンプルデータ生成
    // ================================================================
    generateSampleData() {
        // 既存データクリア
        this.records = [];
        
        const baseWeight = 70; // kg
        const today = new Date();
        
        // 30日間のサンプルデータ生成
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            // 体重の自然な変動をシミュレート
            const variation = (Math.random() - 0.5) * 2; // ±1kg
            const weight = Math.round((baseWeight + variation) * 10) / 10;
            
            const heightM = this.userProfile.height / 100;
            const bmi = Math.round((weight / (heightM * heightM)) * 10) / 10;
            
            const record = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                weight,
                bodyFat: Math.random() > 0.7 ? Math.round((15 + Math.random() * 10) * 10) / 10 : null, // 30%の確率で体脂肪率記録
                muscle: Math.random() > 0.8 ? Math.round((30 + Math.random() * 10) * 10) / 10 : null, // 20%の確率で筋肉量記録
                bmi,
                bmiCategory: this.getBmiCategory(bmi),
                bloodPressure: Math.random() > 0.9 ? '120/80' : null, // 10%の確率で血圧記録
                memo: Math.random() > 0.8 ? '健康状態良好' : '',
                date: date.toISOString().slice(0, 10),
                timestamp: new Date().toISOString(),
                appVersion: this.version
            };
            
            this.records.push(record);
        }

        this.log(`🎯 サンプルデータ生成完了 | ${this.records.length}件追加`);
    }

    // ================================================================
    // ログ機能
    // ================================================================
    log(message) {
        if (this.commonInstance && typeof this.commonInstance.log === 'function') {
            this.commonInstance.log(`⚖️ WeightApp | ${message}`);
        } else {
            console.log(`⚖️ WeightApp | ${message}`);
        }
    }

    // ================================================================
    // クリーンアップ機能
    // ================================================================
    async cleanup() {
        this.log('🧹 体重管理アプリ クリーンアップ開始');
        
        // データクリア
        this.records = [];
        
        this.log('✅ 体重管理アプリ クリーンアップ完了');
    }

    // ================================================================
    // 情報取得
    // ================================================================
    getInfo() {
        return {
            name: this.name,
            displayName: this.displayName,
            version: this.version,
            icon: this.icon,
            recordCount: this.records.length,
            userProfile: this.userProfile,
            categories: this.categories.length,
            lastRecord: this.records.length > 0 ? 
                this.records[this.records.length - 1].timestamp : null
        };
    }
}

module.exports = WeightApp;