// ================================================================
// memo.js - メモ管理アプリモジュール
// ================================================================

class MemoApp {
    constructor(commonInstance, config = {}) {
        this.version = '2.0.0';
        this.name = 'memo';
        this.displayName = 'メモ管理';
        this.icon = '📝';
        
        this.commonInstance = commonInstance;
        this.config = config;
        
        // メモ専用データ
        this.memos = [];
        
        // ルート設定
        this.setupRoutes();
        this.generateSampleData();
        
        this.log('📝 メモ管理アプリモジュール初期化完了');
    }

    setupRoutes() {
        const app = this.commonInstance.app;

        // メモ追加
        app.post('/api/memo/add', (req, res) => {
            try {
                const { title, content, category, tags, userId } = req.body;
                
                // バリデーション
                if (!title || !content) {
                    return res.status(400).json({ 
                        error: 'タイトルと内容が必要です' 
                    });
                }

                const memo = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    title,
                    content,
                    category: category || 'その他',
                    tags: tags || [],
                    date: new Date().toISOString().split('T')[0],
                    timestamp: new Date().toISOString(),
                    userId: userId || 'anonymous',
                    appVersion: this.version
                };

                this.memos.push(memo);
                
                this.log(`📝 メモ追加 | ${title} | カテゴリ: ${memo.category}`);
                
                res.json({ 
                    success: true, 
                    memo: memo,  // テストスイートが期待している形式
                    data: memo,  // 後方互換性のため残す
                    total: this.memos.length 
                });
                
            } catch (error) {
                this.log(`❌ メモ追加エラー | ${error.message}`);
                res.status(500).json({ error: 'メモの追加に失敗しました' });
            }
        });

        // メモ一覧取得
        app.get('/api/memo/data', (req, res) => {
            try {
                res.json({
                    data: this.memos,
                    total: this.memos.length,
                    appVersion: this.version
                });
            } catch (error) {
                this.log(`❌ メモ取得エラー | ${error.message}`);
                res.status(500).json({ error: 'メモの取得に失敗しました' });
            }
        });

        // メモ削除
        app.delete('/api/memo/delete/:id', (req, res) => {
            try {
                const { id } = req.params;
                const index = this.memos.findIndex(memo => memo.id === id);
                
                if (index === -1) {
                    return res.status(404).json({ error: 'メモが見つかりません' });
                }

                const deletedMemo = this.memos.splice(index, 1)[0];
                
                this.log(`🗑️ メモ削除 | ${deletedMemo.title}`);
                
                res.json({ 
                    success: true, 
                    deleted: deletedMemo,
                    remaining: this.memos.length 
                });
                
            } catch (error) {
                this.log(`❌ メモ削除エラー | ${error.message}`);
                res.status(500).json({ error: 'メモの削除に失敗しました' });
            }
        });

        // CSV出力
        app.post('/api/memo/export/csv', (req, res) => {
            try {
                const csvHeader = '日付,タイトル,内容,カテゴリ,タグ,タイムスタンプ\n';
                
                const csvData = this.memos
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map(memo => {
                        return [
                            memo.date,
                            memo.title,
                            memo.content.replace(/\n/g, ' '), // 改行を空白に変換
                            memo.category,
                            Array.isArray(memo.tags) ? memo.tags.join(',') : memo.tags,
                            memo.timestamp
                        ].map(field => `"${field}"`).join(',');
                    })
                    .join('\n');

                const csvContent = csvHeader + csvData;

                res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                res.setHeader('Content-Disposition', `attachment; filename="memo_data_${new Date().toISOString().split('T')[0]}.csv"`);
                res.send('\uFEFF' + csvContent);
                
                this.log(`📥 メモCSV出力 | ${this.memos.length}件のデータを出力`);
                
            } catch (error) {
                this.log(`❌ メモCSV出力エラー | ${error.message}`);
                res.status(500).json({ error: 'CSV出力に失敗しました' });
            }
        });

        // フィルター検索API
        app.post('/api/memo/filter', (req, res) => {
            try {
                const { keywords } = req.body;
                
                if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
                    return res.json({ data: this.memos });
                }
                
                // 最大5個のキーワードに制限
                const limitedKeywords = keywords.slice(0, 5);
                
                const filteredMemos = this.memos.filter(memo => {
                    const searchableText = [
                        memo.title,
                        memo.content,
                        memo.category,
                        ...(Array.isArray(memo.tags) ? memo.tags : [])
                    ].join(' ').toLowerCase();
                    
                    // 全てのキーワードが含まれている場合のみ表示（AND検索）
                    return limitedKeywords.every(keyword => 
                        searchableText.includes(keyword.toLowerCase())
                    );
                });
                
                this.log(`🔍 フィルター検索完了 | キーワード: ${limitedKeywords.join(', ')} | 結果: ${filteredMemos.length}件`);
                
                res.json({ 
                    data: filteredMemos,
                    keywords: limitedKeywords,
                    total: filteredMemos.length 
                });
            } catch (error) {
                this.log(`❌ フィルター検索エラー | ${error.message}`);
                res.status(500).json({ error: 'フィルター検索に失敗しました' });
            }
        });
    }

    // サンプルデータ生成
    generateSampleData() {
        const samples = [
            { 
                title: 'プロジェクト会議メモ', 
                content: '明日の会議で議論する項目：\n- 新機能の仕様確認\n- スケジュール調整\n- 予算の見直し',
                category: '仕事',
                tags: ['会議', 'プロジェクト']
            },
            { 
                title: 'アイデアメモ', 
                content: 'アプリの新機能アイデア：\n- ダークモード対応\n- 検索機能強化\n- データエクスポート機能',
                category: 'アイデア',
                tags: ['開発', 'アイデア']
            },
            { 
                title: '買い物リスト', 
                content: '今度買うもの：\n- 牛乳\n- パン\n- 卵\n- りんご\n- 洗剤',
                category: 'プライベート',
                tags: ['買い物', 'リスト']
            },
            { 
                title: '読書メモ', 
                content: '「効率的な時間管理術」より：\n- ポモドーロテクニック\n- タスクの優先順位付け\n- 集中時間の確保',
                category: '学習',
                tags: ['読書', '時間管理']
            },
            { 
                title: 'ランチの候補', 
                content: '今度行きたいレストラン：\n- イタリアン「ベラヴィスタ」\n- 和食「竹の庵」\n- カフェ「ブルーマウンテン」',
                category: 'プライベート',
                tags: ['食事', 'レストラン']
            }
        ];

        samples.forEach(sample => {
            this.memos.push({
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                ...sample,
                date: new Date().toISOString().split('T')[0],
                timestamp: new Date().toISOString(),
                userId: 'sample',
                appVersion: this.version
            });
        });

        this.log(`📝 サンプルデータ生成完了 | ${samples.length}件追加`);
    }

    // ログ出力
    log(message) {
        this.commonInstance.log(message);
    }
}

module.exports = MemoApp;