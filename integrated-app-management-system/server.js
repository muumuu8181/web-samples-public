// ================================================================
// server.js - スマート単一フォルダ構成 メインサーバー
// 
// 📋 機能概要:
// - CommonTemplate v2.0 による統合サーバー
// - 動的モジュール読み込み
// - config.json による設定管理
// - 後方互換性保持
//
// 🚀 起動方法:
// node server.js
// ================================================================

const CommonTemplate = require('./core/common');
const config = require('./config.json');

async function startServer() {
    try {
        // CommonTemplate v2.0 初期化
        const app = new CommonTemplate(config);
        
        // サーバー起動
        app.start(() => {
            console.log('');
            console.log('🎉 スマート単一フォルダ構成テンプレート起動完了');
            console.log('');
            console.log('📋 有効なアプリ:');
            
            if (app.moduleLoader) {
                const loadedApps = app.moduleLoader.getLoadedApps();
                loadedApps.forEach(appInfo => {
                    console.log(`   ${appInfo.icon} ${appInfo.displayName} (${appInfo.name}) - v${appInfo.version}`);
                });
                
                if (loadedApps.length === 0) {
                    console.log('   なし (config.jsonで有効化してください)');
                }
            }
            
            console.log('');
            console.log('🔗 アクセス先:');
            console.log(`   http://localhost:${app.port}`);
            console.log('');
            console.log('⚙️ 設定変更:');
            console.log('   config.json を編集後、サーバーを再起動してください');
            console.log('');
        });
        
    } catch (error) {
        console.error('❌ サーバー起動エラー:', error.message);
        process.exit(1);
    }
}

// エラーハンドリング
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// サーバー起動
startServer();