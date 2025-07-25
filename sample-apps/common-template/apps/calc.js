// ================================================================
// calc.js - 計算機アプリモジュール
// 
// 📋 機能概要:
// - 2つの数値の足し算
// - 計算履歴の保存
// - CSV エクスポート機能
//
// 🔄 互換性:
// - v1.0 CommonTemplate 対応
// - v2.0 CommonTemplate 対応
// - モジュールローダー対応
// ================================================================

class CalcApp {
    constructor(commonInstance, config = {}) {
        this.version = '2.0.0';
        this.name = 'calc';
        this.displayName = '計算機';
        this.icon = '🧮';
        
        this.commonInstance = commonInstance;
        this.config = config;
        
        // 計算履歴データ
        this.calculations = [];
        
        // ルート設定
        this.setupRoutes();
        this.generateSampleData();
        
        this.log('🧮 計算機アプリモジュール初期化完了');
    }

    // ================================================================
    // ルート設定
    // ================================================================
    setupRoutes() {
        const app = this.commonInstance.app;

        // 計算実行
        app.post('/api/calc/calculate', (req, res) => {
            try {
                const { numberA, numberB, operation = 'add' } = req.body;
                
                // バリデーション
                if (numberA === undefined || numberB === undefined) {
                    return res.status(400).json({ 
                        error: '数値A と 数値B が必要です' 
                    });
                }

                const numA = parseFloat(numberA);
                const numB = parseFloat(numberB);

                if (isNaN(numA) || isNaN(numB)) {
                    return res.status(400).json({ 
                        error: '有効な数値を入力してください' 
                    });
                }

                // 計算実行（現在は足し算のみ）
                let result;
                let operationSymbol;
                
                switch (operation) {
                    case 'add':
                    default:
                        result = numA + numB;
                        operationSymbol = '+';
                        break;
                }

                const calculation = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    numberA: numA,
                    numberB: numB,
                    operation,
                    operationSymbol,
                    result,
                    timestamp: new Date().toISOString(),
                    date: new Date().toISOString().split('T')[0],
                    appVersion: this.version
                };

                this.calculations.push(calculation);
                
                this.log(`🧮 計算実行 | ${numA} + ${numB} = ${result}`);
                
                res.json({ 
                    success: true, 
                    calculation,
                    total: this.calculations.length 
                });
                
            } catch (error) {
                this.log(`❌ 計算エラー | ${error.message}`);
                res.status(500).json({ error: '計算の実行に失敗しました' });
            }
        });

        // 計算履歴取得
        app.get('/api/calc/history', (req, res) => {
            try {
                res.json({
                    calculations: this.calculations.slice().reverse(), // 新しい順
                    total: this.calculations.length,
                    appVersion: this.version
                });
            } catch (error) {
                this.log(`❌ 履歴取得エラー | ${error.message}`);
                res.status(500).json({ error: '履歴の取得に失敗しました' });
            }
        });

        // 履歴削除
        app.delete('/api/calc/history/:id', (req, res) => {
            try {
                const { id } = req.params;
                const index = this.calculations.findIndex(calc => calc.id === id);
                
                if (index === -1) {
                    return res.status(404).json({ error: '計算履歴が見つかりません' });
                }

                const deleted = this.calculations.splice(index, 1)[0];
                
                this.log(`🗑️ 履歴削除 | ${deleted.numberA} + ${deleted.numberB} = ${deleted.result}`);
                
                res.json({ 
                    success: true, 
                    deleted,
                    remaining: this.calculations.length 
                });
                
            } catch (error) {
                this.log(`❌ 履歴削除エラー | ${error.message}`);
                res.status(500).json({ error: '履歴の削除に失敗しました' });
            }
        });

        // CSV エクスポート
        app.post('/api/calc/export/csv', (req, res) => {
            try {
                // CSV用データ変換
                const csvData = this.calculations.map(calc => [
                    calc.date,
                    calc.numberA,
                    calc.operationSymbol,
                    calc.numberB,
                    calc.result,
                    calc.timestamp
                ]);

                const headers = ['日付', '数値A', '演算子', '数値B', '結果', '計算日時'];
                
                // CSV コンテンツ生成
                const csvContent = this.generateCSV(csvData, headers);
                const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
                const csvFilename = `calc_history_${timestamp}.csv`;
                
                res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                res.setHeader('Content-Disposition', `attachment; filename="${csvFilename}"`);
                res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));
                
                this.log(`📊 CSV エクスポート | ${this.calculations.length}件の計算履歴`);
                res.send('\uFEFF' + csvContent); // BOM付きUTF-8
                
            } catch (error) {
                this.log(`❌ CSV エクスポートエラー | ${error.message}`);
                res.status(500).json({ error: 'CSV エクスポートに失敗しました' });
            }
        });

        // 履歴全削除
        app.delete('/api/calc/history', (req, res) => {
            try {
                const count = this.calculations.length;
                this.calculations = [];
                
                this.log(`🗑️ 全履歴削除 | ${count}件削除`);
                
                res.json({ 
                    success: true, 
                    message: '全ての履歴を削除しました',
                    deletedCount: count 
                });
                
            } catch (error) {
                this.log(`❌ 全履歴削除エラー | ${error.message}`);
                res.status(500).json({ error: '履歴の削除に失敗しました' });
            }
        });
    }

    // ================================================================
    // CSV生成
    // ================================================================
    generateCSV(data, headers) {
        let csvContent = '';
        
        // ヘッダー追加
        if (headers && headers.length > 0) {
            csvContent += headers.join(',') + '\n';
        }
        
        // データ行追加
        data.forEach(row => {
            if (Array.isArray(row)) {
                csvContent += row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',') + '\n';
            } else if (typeof row === 'object') {
                csvContent += Object.values(row).map(field => `"${String(field).replace(/"/g, '""')}"`).join(',') + '\n';
            }
        });
        
        return csvContent;
    }

    // ================================================================
    // サンプルデータ生成
    // ================================================================
    generateSampleData() {
        // 既存データクリア
        this.calculations = [];
        
        const sampleCalculations = [
            { numberA: 10, numberB: 5, operation: 'add' },
            { numberA: 25, numberB: 15, operation: 'add' },
            { numberA: 100, numberB: 50, operation: 'add' },
            { numberA: 7, numberB: 3, operation: 'add' },
            { numberA: 99, numberB: 1, operation: 'add' }
        ];

        sampleCalculations.forEach((sample, index) => {
            const result = sample.numberA + sample.numberB; // 足し算のみ
            const calculation = {
                id: (Date.now() - index * 1000).toString() + Math.random().toString(36).substr(2, 5),
                numberA: sample.numberA,
                numberB: sample.numberB,
                operation: sample.operation,
                operationSymbol: '+',
                result,
                timestamp: new Date(Date.now() - index * 60000).toISOString(), // 1分ずつ古い時刻
                date: new Date().toISOString().split('T')[0],
                appVersion: this.version
            };
            this.calculations.push(calculation);
        });

        this.log(`🎯 サンプルデータ生成完了 | ${sampleCalculations.length}件追加`);
    }

    // ================================================================
    // ログ機能
    // ================================================================
    log(message) {
        if (this.commonInstance && typeof this.commonInstance.log === 'function') {
            this.commonInstance.log(`🧮 CalcApp | ${message}`);
        } else {
            console.log(`🧮 CalcApp | ${message}`);
        }
    }

    // ================================================================
    // クリーンアップ機能
    // ================================================================
    async cleanup() {
        this.log('🧹 計算機アプリ クリーンアップ開始');
        
        // 必要に応じてリソースの解放
        this.calculations = [];
        
        this.log('✅ 計算機アプリ クリーンアップ完了');
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
            calculationCount: this.calculations.length,
            lastCalculation: this.calculations.length > 0 ? 
                this.calculations[this.calculations.length - 1].timestamp : null
        };
    }
}

module.exports = CalcApp;