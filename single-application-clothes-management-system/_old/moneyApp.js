// ================================================================
// moneyApp.js - お金管理アプリ（個別実装）
// 
// 📋 機能概要:
// - 収入・支出の記録と管理
// - カテゴリ別分析
// - 月次・日次レポート
// - CSV データエクスポート
// - Firebase統合（リアルタイム同期）
//
// 🔗 共通機能: common.jsから継承
// ================================================================

const CommonTemplate = require('./common');
const path = require('path');

class MoneyApp extends CommonTemplate {
    constructor() {
        super('MoneyApp');
        
        // お金管理専用データ
        this.categories = [
            '食費', '交通費', '娯楽費', '光熱費', '家賃', 
            '医療費', '教育費', 'その他支出', '給与', '副業', 
            'ボーナス', 'その他収入'
        ];
        
        this.transactions = [];
        
        // 個別ルート設定
        this.setupMoneyRoutes();
        this.setupMoneyUI();
        
        this.log('💰 お金管理アプリ初期化完了');
    }

    // ================================================================
    // お金管理専用API
    // ================================================================
    setupMoneyRoutes() {
        // 取引追加
        this.app.post('/api/money/transaction', (req, res) => {
            try {
                const { type, amount, category, description, date } = req.body;
                
                // バリデーション
                if (!type || !amount || !category) {
                    return res.status(400).json({ 
                        error: 'type, amount, category は必須です' 
                    });
                }

                if (!['income', 'expense'].includes(type)) {
                    return res.status(400).json({ 
                        error: 'type は income または expense である必要があります' 
                    });
                }

                const transaction = {
                    id: Date.now().toString(),
                    type,
                    amount: parseFloat(amount),
                    category,
                    description: description || '',
                    date: date || new Date().toISOString().slice(0, 10),
                    timestamp: new Date().toISOString()
                };

                this.transactions.push(transaction);
                
                this.log(`💰 取引追加 | ${type === 'income' ? '収入' : '支出'} | ¥${amount.toLocaleString()} | ${category}`);
                
                res.json({ 
                    success: true, 
                    transaction,
                    total: this.transactions.length 
                });
                
            } catch (error) {
                this.log(`❌ 取引追加エラー | ${error.message}`);
                res.status(500).json({ error: '取引の追加に失敗しました' });
            }
        });

        // 取引一覧取得
        this.app.get('/api/money/transactions', (req, res) => {
            try {
                const { startDate, endDate, type, category } = req.query;
                let filteredTransactions = [...this.transactions];

                // 日付フィルター
                if (startDate) {
                    filteredTransactions = filteredTransactions.filter(t => t.date >= startDate);
                }
                if (endDate) {
                    filteredTransactions = filteredTransactions.filter(t => t.date <= endDate);
                }

                // タイプフィルター
                if (type) {
                    filteredTransactions = filteredTransactions.filter(t => t.type === type);
                }

                // カテゴリフィルター
                if (category) {
                    filteredTransactions = filteredTransactions.filter(t => t.category === category);
                }

                // 統計情報計算
                const stats = this.calculateStats(filteredTransactions);
                
                res.json({ 
                    transactions: filteredTransactions.reverse(), // 新しい順
                    stats,
                    filters: { startDate, endDate, type, category }
                });
                
            } catch (error) {
                this.log(`❌ 取引一覧取得エラー | ${error.message}`);
                res.status(500).json({ error: '取引一覧の取得に失敗しました' });
            }
        });

        // 取引削除
        this.app.delete('/api/money/transaction/:id', (req, res) => {
            try {
                const { id } = req.params;
                const index = this.transactions.findIndex(t => t.id === id);
                
                if (index === -1) {
                    return res.status(404).json({ error: '取引が見つかりません' });
                }

                const deletedTransaction = this.transactions.splice(index, 1)[0];
                
                this.log(`🗑️ 取引削除 | ID: ${id} | ¥${deletedTransaction.amount.toLocaleString()}`);
                
                res.json({ 
                    success: true, 
                    deletedTransaction,
                    remaining: this.transactions.length 
                });
                
            } catch (error) {
                this.log(`❌ 取引削除エラー | ${error.message}`);
                res.status(500).json({ error: '取引の削除に失敗しました' });
            }
        });

        // カテゴリ一覧取得
        this.app.get('/api/money/categories', (req, res) => {
            res.json({ categories: this.categories });
        });

        // 月次レポート
        this.app.get('/api/money/monthly-report', (req, res) => {
            try {
                const { year, month } = req.query;
                const targetYear = year || new Date().getFullYear();
                const targetMonth = month || (new Date().getMonth() + 1);
                
                const monthlyTransactions = this.transactions.filter(t => {
                    const transactionDate = new Date(t.date);
                    return transactionDate.getFullYear() === parseInt(targetYear) &&
                           transactionDate.getMonth() + 1 === parseInt(targetMonth);
                });

                const report = this.generateMonthlyReport(monthlyTransactions, targetYear, targetMonth);
                
                this.log(`📊 月次レポート生成 | ${targetYear}年${targetMonth}月 | ${monthlyTransactions.length}件`);
                
                res.json(report);
                
            } catch (error) {
                this.log(`❌ 月次レポート生成エラー | ${error.message}`);
                res.status(500).json({ error: '月次レポートの生成に失敗しました' });
            }
        });

        // CSV エクスポート（お金管理専用）
        this.app.post('/api/money/export/csv', (req, res) => {
            try {
                const { startDate, endDate, type } = req.body;
                let exportTransactions = [...this.transactions];

                // フィルター適用
                if (startDate) {
                    exportTransactions = exportTransactions.filter(t => t.date >= startDate);
                }
                if (endDate) {
                    exportTransactions = exportTransactions.filter(t => t.date <= endDate);
                }
                if (type) {
                    exportTransactions = exportTransactions.filter(t => t.type === type);
                }

                // CSV用データ変換
                const csvData = exportTransactions.map(t => [
                    t.date,
                    t.type === 'income' ? '収入' : '支出',
                    t.category,
                    t.description,
                    t.amount,
                    t.timestamp
                ]);

                const headers = ['日付', 'タイプ', 'カテゴリ', '詳細', '金額', '登録日時'];
                
                // 共通CSV機能を使用
                req.body = {
                    data: csvData,
                    headers: headers,
                    filename: 'money_transactions.csv'
                };

                this.log(`📊 CSV エクスポート | ${exportTransactions.length}件の取引`);
                
                // CSVデータを直接レスポンス
                const csvContent = this.generateCSV(csvData, headers);
                const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
                const csvFilename = `money_transactions_${timestamp}.csv`;
                
                res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                res.setHeader('Content-Disposition', `attachment; filename="${csvFilename}"`);
                res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));
                
                res.send('\\uFEFF' + csvContent); // BOM付きUTF-8
                
            } catch (error) {
                this.log(`❌ CSV エクスポートエラー | ${error.message}`);
                res.status(500).json({ error: 'CSV エクスポートに失敗しました' });
            }
        });
    }

    // ================================================================
    // お金管理専用UI設定
    // ================================================================
    setupMoneyUI() {
        // メインページ
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'money-app.html'));
        });

        // サンプルデータ生成
        this.app.post('/api/money/sample-data', (req, res) => {
            try {
                this.generateSampleData();
                res.json({ 
                    success: true, 
                    message: 'サンプルデータを生成しました',
                    totalTransactions: this.transactions.length 
                });
            } catch (error) {
                res.status(500).json({ error: 'サンプルデータ生成に失敗しました' });
            }
        });
    }

    // ================================================================
    // 統計計算機能
    // ================================================================
    calculateStats(transactions) {
        const income = transactions.filter(t => t.type === 'income');
        const expenses = transactions.filter(t => t.type === 'expense');
        
        const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
        const balance = totalIncome - totalExpenses;

        // カテゴリ別集計
        const categoryStats = {};
        transactions.forEach(t => {
            if (!categoryStats[t.category]) {
                categoryStats[t.category] = { income: 0, expense: 0, count: 0 };
            }
            categoryStats[t.category][t.type === 'income' ? 'income' : 'expense'] += t.amount;
            categoryStats[t.category].count++;
        });

        return {
            totalIncome,
            totalExpenses,
            balance,
            transactionCount: transactions.length,
            averageIncome: income.length > 0 ? totalIncome / income.length : 0,
            averageExpense: expenses.length > 0 ? totalExpenses / expenses.length : 0,
            categoryStats
        };
    }

    // ================================================================
    // 月次レポート生成
    // ================================================================
    generateMonthlyReport(transactions, year, month) {
        const stats = this.calculateStats(transactions);
        
        // 日別集計
        const dailyStats = {};
        transactions.forEach(t => {
            const day = new Date(t.date).getDate();
            if (!dailyStats[day]) {
                dailyStats[day] = { income: 0, expense: 0, count: 0 };
            }
            dailyStats[day][t.type === 'income' ? 'income' : 'expense'] += t.amount;
            dailyStats[day].count++;
        });

        return {
            period: `${year}年${month}月`,
            summary: stats,
            dailyBreakdown: dailyStats,
            transactions: transactions.sort((a, b) => new Date(b.date) - new Date(a.date)),
            generatedAt: new Date().toISOString()
        };
    }

    // ================================================================
    // CSV生成ヘルパー
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
        const sampleTransactions = [
            { type: 'income', amount: 250000, category: '給与', description: '月給', date: '2024-01-25' },
            { type: 'expense', amount: 80000, category: '家賃', description: '1月分家賃', date: '2024-01-01' },
            { type: 'expense', amount: 15000, category: '食費', description: 'スーパーマーケット', date: '2024-01-03' },
            { type: 'expense', amount: 3000, category: '交通費', description: '電車代', date: '2024-01-04' },
            { type: 'expense', amount: 8000, category: '娯楽費', description: '映画・書籍', date: '2024-01-06' },
            { type: 'income', amount: 30000, category: '副業', description: 'フリーランス案件', date: '2024-01-15' },
            { type: 'expense', amount: 12000, category: '光熱費', description: '電気・ガス代', date: '2024-01-10' },
            { type: 'expense', amount: 25000, category: '食費', description: '外食・食材購入', date: '2024-01-20' },
            { type: 'expense', amount: 5500, category: '医療費', description: '病院受診', date: '2024-01-18' },
            { type: 'expense', amount: 4000, category: 'その他支出', description: '雑費', date: '2024-01-22' }
        ];

        sampleTransactions.forEach(sample => {
            const transaction = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                ...sample,
                timestamp: new Date().toISOString()
            };
            this.transactions.push(transaction);
        });

        this.log(`🎯 サンプルデータ生成完了 | ${sampleTransactions.length}件追加`);
    }
}

// ================================================================
// アプリケーション起動
// ================================================================
if (require.main === module) {
    const moneyApp = new MoneyApp();
    
    moneyApp.start(() => {
        moneyApp.log('💰 お金管理アプリ起動完了');
        moneyApp.log('🌐 ブラウザで http://localhost:3001 にアクセスしてください');
        
        // 初期サンプルデータ生成
        moneyApp.generateSampleData();
    });
}

module.exports = MoneyApp;