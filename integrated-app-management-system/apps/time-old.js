// ================================================================
// time.js - 時間管理アプリモジュール
// 
// 📋 機能概要:
// - 作業時間の記録と管理
// - カテゴリ別時間分析
// - 生産性レポート生成
// - タイムトラッキング機能
//
// 🔄 互換性:
// - v1.0 CommonTemplate 対応
// - v2.0 CommonTemplate 対応
// - モジュールローダー対応
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
        this.timeEntries = [];
        this.activeTimers = new Map();
        this.categories = this.config.apps?.time?.categories || [
            '作業', '勉強', '会議', '休憩', '移動', '運動', '読書', 'その他'
        ];
        
        // ルート設定
        this.setupRoutes();
        this.generateSampleData();
        
        this.log('⏰ 時間管理アプリモジュール初期化完了');
    }

    // ================================================================
    // ルート設定
    // ================================================================
    setupRoutes() {
        const app = this.commonInstance.app;

        // 時間記録追加
        app.post('/api/time/add', (req, res) => {
            try {
                const { task, category, hours, minutes, totalMinutes, date, userId } = req.body;
                
                // バリデーション
                if (!category) {
                    return res.status(400).json({ 
                        error: 'category は必須です' 
                    });
                }

                let calculatedDuration = duration;
                
                // 開始・終了時刻から時間を計算
                if (startTime && endTime) {
                    const start = new Date(startTime);
                    const end = new Date(endTime);
                    calculatedDuration = Math.round((end - start) / 1000 / 60); // 分単位
                } else if (!duration) {
                    return res.status(400).json({ 
                        error: 'duration または startTime, endTime が必要です' 
                    });
                }

                const timeEntry = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    category,
                    description: description || '',
                    startTime: startTime || null,
                    endTime: endTime || null,
                    duration: calculatedDuration, // 分単位
                    date: new Date().toISOString().slice(0, 10),
                    timestamp: new Date().toISOString(),
                    appVersion: this.version
                };

                this.timeEntries.push(timeEntry);
                
                this.log(`⏰ 時間記録追加 | ${category} | ${calculatedDuration}分 | ${description}`);
                
                res.json({ 
                    success: true, 
                    timeEntry,
                    total: this.timeEntries.length 
                });
                
            } catch (error) {
                this.log(`❌ 時間記録追加エラー | ${error.message}`);
                res.status(500).json({ error: '時間記録の追加に失敗しました' });
            }
        });

        // タイマー開始
        app.post('/api/time/timer/start', (req, res) => {
            try {
                const { category, description } = req.body;
                
                if (!category) {
                    return res.status(400).json({ error: 'category は必須です' });
                }

                const timerId = Date.now().toString();
                const timer = {
                    id: timerId,
                    category,
                    description: description || '',
                    startTime: new Date().toISOString(),
                    status: 'running'
                };

                this.activeTimers.set(timerId, timer);
                
                this.log(`▶️ タイマー開始 | ${category} | ID: ${timerId}`);
                
                res.json({ 
                    success: true, 
                    timer,
                    activeTimers: this.activeTimers.size
                });
                
            } catch (error) {
                this.log(`❌ タイマー開始エラー | ${error.message}`);
                res.status(500).json({ error: 'タイマーの開始に失敗しました' });
            }
        });

        // タイマー停止
        app.post('/api/time/timer/stop/:id', (req, res) => {
            try {
                const { id } = req.params;
                
                if (!this.activeTimers.has(id)) {
                    return res.status(404).json({ error: 'タイマーが見つかりません' });
                }

                const timer = this.activeTimers.get(id);
                const endTime = new Date();
                const startTime = new Date(timer.startTime);
                const duration = Math.round((endTime - startTime) / 1000 / 60); // 分単位

                // 時間記録として保存
                const timeEntry = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    category: timer.category,
                    description: timer.description,
                    startTime: timer.startTime,
                    endTime: endTime.toISOString(),
                    duration,
                    date: new Date().toISOString().slice(0, 10),
                    timestamp: new Date().toISOString(),
                    appVersion: this.version
                };

                this.timeEntries.push(timeEntry);
                this.activeTimers.delete(id);
                
                this.log(`⏹️ タイマー停止 | ${timer.category} | ${duration}分`);
                
                res.json({ 
                    success: true, 
                    timeEntry,
                    duration,
                    activeTimers: this.activeTimers.size
                });
                
            } catch (error) {
                this.log(`❌ タイマー停止エラー | ${error.message}`);
                res.status(500).json({ error: 'タイマーの停止に失敗しました' });
            }
        });

        // アクティブタイマー一覧
        app.get('/api/time/timers', (req, res) => {
            const timers = Array.from(this.activeTimers.values()).map(timer => {
                const now = new Date();
                const startTime = new Date(timer.startTime);
                const elapsedMinutes = Math.round((now - startTime) / 1000 / 60);
                
                return {
                    ...timer,
                    elapsedMinutes
                };
            });

            res.json({ 
                timers,
                count: timers.length,
                appVersion: this.version
            });
        });

        // 時間記録一覧取得
        app.get('/api/time/entries', (req, res) => {
            try {
                const { startDate, endDate, category } = req.query;
                let filteredEntries = [...this.timeEntries];

                // 日付フィルター
                if (startDate) {
                    filteredEntries = filteredEntries.filter(t => t.date >= startDate);
                }
                if (endDate) {
                    filteredEntries = filteredEntries.filter(t => t.date <= endDate);
                }

                // カテゴリフィルター
                if (category) {
                    filteredEntries = filteredEntries.filter(t => t.category === category);
                }

                // 統計情報計算
                const stats = this.calculateStats(filteredEntries);
                
                res.json({ 
                    entries: filteredEntries.reverse(), // 新しい順
                    stats,
                    filters: { startDate, endDate, category },
                    appVersion: this.version
                });
                
            } catch (error) {
                this.log(`❌ 時間記録一覧取得エラー | ${error.message}`);
                res.status(500).json({ error: '時間記録一覧の取得に失敗しました' });
            }
        });

        // 時間記録削除
        app.delete('/api/time/entry/:id', (req, res) => {
            try {
                const { id } = req.params;
                const index = this.timeEntries.findIndex(t => t.id === id);
                
                if (index === -1) {
                    return res.status(404).json({ error: '時間記録が見つかりません' });
                }

                const deletedEntry = this.timeEntries.splice(index, 1)[0];
                
                this.log(`🗑️ 時間記録削除 | ID: ${id} | ${deletedEntry.duration}分`);
                
                res.json({ 
                    success: true, 
                    deletedEntry,
                    remaining: this.timeEntries.length 
                });
                
            } catch (error) {
                this.log(`❌ 時間記録削除エラー | ${error.message}`);
                res.status(500).json({ error: '時間記録の削除に失敗しました' });
            }
        });

        // カテゴリ一覧取得
        app.get('/api/time/categories', (req, res) => {
            res.json({ 
                categories: this.categories,
                appVersion: this.version
            });
        });

        // 日次レポート
        app.get('/api/time/daily-report', (req, res) => {
            try {
                const { date } = req.query;
                const targetDate = date || new Date().toISOString().slice(0, 10);
                
                const dailyEntries = this.timeEntries.filter(t => t.date === targetDate);
                const report = this.generateDailyReport(dailyEntries, targetDate);
                
                this.log(`📊 日次レポート生成 | ${targetDate} | ${dailyEntries.length}件`);
                
                res.json(report);
                
            } catch (error) {
                this.log(`❌ 日次レポート生成エラー | ${error.message}`);
                res.status(500).json({ error: '日次レポートの生成に失敗しました' });
            }
        });

        // CSV エクスポート
        app.post('/api/time/export/csv', (req, res) => {
            try {
                const { startDate, endDate, category } = req.body;
                let exportEntries = [...this.timeEntries];

                // フィルター適用
                if (startDate) {
                    exportEntries = exportEntries.filter(t => t.date >= startDate);
                }
                if (endDate) {
                    exportEntries = exportEntries.filter(t => t.date <= endDate);
                }
                if (category) {
                    exportEntries = exportEntries.filter(t => t.category === category);
                }

                // CSV用データ変換
                const csvData = exportEntries.map(t => [
                    t.date,
                    t.category,
                    t.description,
                    t.duration,
                    t.startTime || '',
                    t.endTime || '',
                    t.timestamp
                ]);

                const headers = ['日付', 'カテゴリ', '詳細', '時間(分)', '開始時刻', '終了時刻', '登録日時'];
                
                // CSVコンテンツ生成
                const csvContent = this.generateCSV(csvData, headers);
                const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
                const csvFilename = `time_entries_${timestamp}.csv`;
                
                res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                res.setHeader('Content-Disposition', `attachment; filename="${csvFilename}"`);
                res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));
                
                this.log(`📊 CSV エクスポート | ${exportEntries.length}件の時間記録`);
                res.send('\\uFEFF' + csvContent); // BOM付きUTF-8
                
            } catch (error) {
                this.log(`❌ CSV エクスポートエラー | ${error.message}`);
                res.status(500).json({ error: 'CSV エクスポートに失敗しました' });
            }
        });

        // サンプルデータ生成
        app.post('/api/time/sample-data', (req, res) => {
            try {
                this.generateSampleData();
                res.json({ 
                    success: true, 
                    message: 'サンプルデータを生成しました',
                    totalEntries: this.timeEntries.length,
                    appVersion: this.version
                });
            } catch (error) {
                res.status(500).json({ error: 'サンプルデータ生成に失敗しました' });
            }
        });
    }

    // ================================================================
    // 統計計算
    // ================================================================
    calculateStats(entries) {
        const totalMinutes = entries.reduce((sum, t) => sum + t.duration, 0);
        const totalHours = Math.round(totalMinutes / 60 * 100) / 100;

        // カテゴリ別集計
        const categoryStats = {};
        entries.forEach(t => {
            if (!categoryStats[t.category]) {
                categoryStats[t.category] = { minutes: 0, hours: 0, count: 0 };
            }
            categoryStats[t.category].minutes += t.duration;
            categoryStats[t.category].hours = Math.round(categoryStats[t.category].minutes / 60 * 100) / 100;
            categoryStats[t.category].count++;
        });

        // 平均計算
        const averageMinutes = entries.length > 0 ? Math.round(totalMinutes / entries.length) : 0;

        return {
            totalMinutes,
            totalHours,
            entryCount: entries.length,
            averageMinutes,
            averageHours: Math.round(averageMinutes / 60 * 100) / 100,
            categoryStats,
            productiveTime: Object.entries(categoryStats)
                .filter(([cat]) => ['作業', '勉強', '会議'].includes(cat))
                .reduce((sum, [_, data]) => sum + data.minutes, 0)
        };
    }

    // ================================================================
    // 日次レポート生成
    // ================================================================
    generateDailyReport(entries, date) {
        const stats = this.calculateStats(entries);
        
        // 時間別集計（24時間）
        const hourlyStats = {};
        for (let i = 0; i < 24; i++) {
            hourlyStats[i] = { minutes: 0, count: 0 };
        }

        entries.forEach(t => {
            if (t.startTime) {
                const hour = new Date(t.startTime).getHours();
                hourlyStats[hour].minutes += t.duration;
                hourlyStats[hour].count++;
            }
        });

        return {
            date,
            summary: stats,
            hourlyBreakdown: hourlyStats,
            entries: entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
            generatedAt: new Date().toISOString(),
            appVersion: this.version
        };
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
        this.timeEntries = [];
        
        const today = new Date().toISOString().slice(0, 10);
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        
        const sampleEntries = [
            { category: '作業', description: 'プロジェクト企画書作成', duration: 120, date: today },
            { category: '会議', description: 'チームミーティング', duration: 60, date: today },
            { category: '勉強', description: 'プログラミング学習', duration: 90, date: today },
            { category: '休憩', description: 'ランチタイム', duration: 45, date: today },
            { category: '作業', description: 'コード実装', duration: 180, date: yesterday },
            { category: '読書', description: '技術書読書', duration: 30, date: yesterday },
            { category: '運動', description: 'ランニング', duration: 40, date: yesterday },
            { category: '移動', description: '通勤', duration: 60, date: yesterday }
        ];

        sampleEntries.forEach(sample => {
            const entry = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                ...sample,
                startTime: null,
                endTime: null,
                timestamp: new Date().toISOString(),
                appVersion: this.version
            };
            this.timeEntries.push(entry);
        });

        this.log(`🎯 サンプルデータ生成完了 | ${sampleEntries.length}件追加`);
    }

    // ================================================================
    // ログ機能
    // ================================================================
    log(message) {
        if (this.commonInstance && typeof this.commonInstance.log === 'function') {
            this.commonInstance.log(`⏰ TimeApp | ${message}`);
        } else {
            console.log(`⏰ TimeApp | ${message}`);
        }
    }

    // ================================================================
    // クリーンアップ機能
    // ================================================================
    async cleanup() {
        this.log('🧹 時間管理アプリ クリーンアップ開始');
        
        // アクティブタイマーを停止
        for (const [id, timer] of this.activeTimers) {
            this.log(`⏹️ アクティブタイマー停止 | ${timer.category} | ID: ${id}`);
        }
        this.activeTimers.clear();
        
        // データクリア
        this.timeEntries = [];
        
        this.log('✅ 時間管理アプリ クリーンアップ完了');
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
            entryCount: this.timeEntries.length,
            activeTimers: this.activeTimers.size,
            categories: this.categories.length,
            lastEntry: this.timeEntries.length > 0 ? 
                this.timeEntries[this.timeEntries.length - 1].timestamp : null
        };
    }
}

module.exports = TimeApp;