// ================================================================
// test-suite.js - 統合アプリ管理システム 全機能テストスイート
// ================================================================

class SystemTestSuite {
    constructor() {
        this.baseURL = 'http://127.0.0.1:3001';
        this.results = [];
        this.startTime = Date.now();
    }

    // テスト結果記録
    recordTest(testName, success, details = '', error = null) {
        this.results.push({
            test: testName,
            success,
            details,
            error: error ? error.message : null,
            timestamp: new Date().toISOString()
        });
        
        const status = success ? '✅' : '❌';
        console.log(`${status} ${testName} - ${details}`);
        if (error) console.error(`   Error: ${error.message}`);
    }

    // 1. サーバー接続テスト
    async testServerConnection() {
        try {
            const response = await fetch(`${this.baseURL}/api/health`);
            const data = await response.json();
            
            this.recordTest(
                'サーバー接続',
                response.ok && data.status === 'OK',
                `レスポンス: ${response.status}`
            );
        } catch (error) {
            this.recordTest('サーバー接続', false, 'サーバーに接続できません', error);
        }
    }

    // 2. 設定API テスト
    async testConfigAPI() {
        try {
            const response = await fetch(`${this.baseURL}/api/config`);
            const data = await response.json();
            
            const hasConfig = data.config && data.loadedApps;
            const hasEnabledApps = data.config.enabledApps && data.config.enabledApps.length > 0;
            
            this.recordTest(
                '設定API',
                hasConfig && hasEnabledApps,
                `有効アプリ数: ${data.config.enabledApps.length}個`
            );
        } catch (error) {
            this.recordTest('設定API', false, '設定APIエラー', error);
        }
    }

    // 3. メモ管理API テスト
    async testMemoAPI() {
        try {
            // メモ一覧取得
            const listResponse = await fetch(`${this.baseURL}/api/memo/data`);
            const listData = await listResponse.json();
            
            this.recordTest(
                'メモ一覧取得',
                listResponse.ok && Array.isArray(listData.data),
                `メモ数: ${listData.data?.length || 0}件`
            );

            // メモ追加テスト
            const testMemo = {
                title: 'テストメモ',
                content: 'これはテスト用のメモです',
                category: 'テスト',
                tags: ['テスト', '自動'],
                userId: 'test-user'
            };

            const addResponse = await fetch(`${this.baseURL}/api/memo/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testMemo)
            });
            const addData = await addResponse.json();
            
            this.recordTest(
                'メモ追加',
                addResponse.ok && addData.memo,
                `メモID: ${addData.memo?.id}`
            );

            // フィルター検索テスト（追加したAPIをテスト）
            const filterResponse = await fetch(`${this.baseURL}/api/memo/filter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keywords: ['テスト'] })
            });
            const filterData = await filterResponse.json();
            
            this.recordTest(
                'メモフィルター検索',
                filterResponse.ok && Array.isArray(filterData.data),
                `検索結果: ${filterData.total || 0}件`
            );

        } catch (error) {
            this.recordTest('メモ管理API', false, 'メモAPIエラー', error);
        }
    }

    // 4. フロントエンド機能テスト（基本HTML構造）
    async testFrontendStructure() {
        try {
            const response = await fetch(this.baseURL);
            const html = await response.text();
            
            const hasTitle = html.includes('統合アプリ管理システム');
            const hasAppTabs = html.includes('app-tabs');
            const hasMainContent = html.includes('main-content');
            const hasScript = html.includes('<script>');
            
            this.recordTest(
                'フロントエンド構造',
                hasTitle && hasAppTabs && hasMainContent && hasScript,
                `タイトル: ${hasTitle}, タブ: ${hasAppTabs}, コンテンツ: ${hasMainContent}, スクリプト: ${hasScript}`
            );
            
        } catch (error) {
            this.recordTest('フロントエンド構造', false, 'HTMLテストエラー', error);
        }
    }

    // 5. CSS機能テスト
    async testCSSStyles() {
        try {
            const response = await fetch(this.baseURL);
            const html = await response.text();
            
            const hasCSS = html.includes('<style>');
            const hasFilterStyles = html.includes('filter-keyword-tag');
            const hasButtonStyles = html.includes('btn');
            
            this.recordTest(
                'CSS スタイル',
                hasCSS && hasFilterStyles && hasButtonStyles,
                `CSS: ${hasCSS}, フィルター: ${hasFilterStyles}, ボタン: ${hasButtonStyles}`
            );
            
        } catch (error) {
            this.recordTest('CSS スタイル', false, 'CSSテストエラー', error);
        }
    }

    // 6. ファイル構造テスト
    async testFileStructure() {
        try {
            // 重要ファイルの存在確認（Fetch APIでは直接ファイル存在確認は困難）
            const files = [
                '/api/config',  // 設定API
                '/api/info',    // システム情報API
            ];
            
            let successCount = 0;
            for (const file of files) {
                try {
                    const response = await fetch(`${this.baseURL}${file}`);
                    if (response.ok) successCount++;
                } catch (e) {
                    // ファイルが存在しない
                }
            }
            
            this.recordTest(
                'ファイル構造',
                successCount === files.length,
                `${successCount}/${files.length} ファイルが正常`
            );
            
        } catch (error) {
            this.recordTest('ファイル構造', false, 'ファイル構造テストエラー', error);
        }
    }

    // 全テスト実行
    async runAllTests() {
        console.log('🚀 統合アプリ管理システム 全機能テスト開始');
        console.log('='.repeat(50));
        
        await this.testServerConnection();
        await this.testConfigAPI();
        await this.testMemoAPI();
        await this.testFrontendStructure();
        await this.testCSSStyles();
        await this.testFileStructure();
        
        this.generateReport();
    }

    // テスト結果レポート生成
    generateReport() {
        const endTime = Date.now();
        const duration = ((endTime - this.startTime) / 1000).toFixed(2);
        
        const totalTests = this.results.length;
        const passedTests = this.results.filter(r => r.success).length;
        const failedTests = totalTests - passedTests;
        const successRate = ((passedTests / totalTests) * 100).toFixed(1);
        
        console.log('\n' + '='.repeat(50));
        console.log('📊 テスト結果サマリー');
        console.log('='.repeat(50));
        console.log(`⏱️  実行時間: ${duration}秒`);
        console.log(`📝 総テスト数: ${totalTests}`);
        console.log(`✅ 成功: ${passedTests}`);
        console.log(`❌ 失敗: ${failedTests}`);
        console.log(`📈 成功率: ${successRate}%`);
        
        console.log('\n📋 詳細結果:');
        this.results.forEach((result, index) => {
            const status = result.success ? '✅' : '❌';
            console.log(`${index + 1}. ${status} ${result.test}`);
            console.log(`   └─ ${result.details}`);
            if (result.error) {
                console.log(`   └─ エラー: ${result.error}`);
            }
        });
        
        console.log('\n' + '='.repeat(50));
        
        // 総合判定
        if (successRate >= 90) {
            console.log('🎉 テスト結果: 優秀 (90%以上)');
        } else if (successRate >= 70) {
            console.log('⚠️  テスト結果: 良好 (70%以上)');
        } else {
            console.log('🚨 テスト結果: 要改善 (70%未満)');
        }
        
        return {
            totalTests,
            passedTests,
            failedTests,
            successRate: parseFloat(successRate),
            duration: parseFloat(duration),
            results: this.results
        };
    }
}

// モジュールとして使用可能にする
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SystemTestSuite;
}

// ブラウザから直接実行可能にする
if (typeof window !== 'undefined') {
    window.SystemTestSuite = SystemTestSuite;
}