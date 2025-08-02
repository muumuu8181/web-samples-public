/**
 * Firebase設定ファイル
 * 
 * 🔧 ここを編集してください 🔧
 * あなたのFirebaseプロジェクトの設定に変更してください
 * 
 * 設定手順:
 * 1. Firebase Console (https://console.firebase.google.com/) にアクセス
 * 2. 新しいプロジェクトを作成
 * 3. プロジェクト設定 → 全般 → アプリを追加 → ウェブアプリ
 * 4. 表示された設定をここにコピペ
 * 5. Database Rules と Authentication を設定
 * 
 * Version: 1.0.0
 */

// 🔥 あなたのFirebase設定をここに記載してください
const firebaseConfig = {
    // ⚠️ 注意: 以下は例です。あなたの実際の設定に変更してください ⚠️
    apiKey: "your-api-key-here",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com",
    projectId: "your-project",
    storageBucket: "your-project.firebasestorage.app",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

// 🎯 追加設定（必要に応じて変更）
const appSettings = {
    // アプリケーション名
    appName: "My Firebase App",
    
    // デフォルトのデータタイプ
    defaultDataType: "app-data",
    
    // デバッグモード（本番環境では false にしてください）
    debugMode: true,
    
    // UI設定
    ui: {
        showUserInfo: true,
        showConnectionStatus: true,
        showDataPath: true
    },
    
    // セキュリティ設定
    security: {
        enableDataMasking: false,  // センシティブデータのマスキング
        requireEmailVerification: false  // メール認証必須
    }
};

// 📊 サンプルデータベースルール（Firebase Console で設定してください）
const sampleDatabaseRules = `
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid && auth.provider === 'google'",
        ".validate": "auth != null"
      }
    },
    ".read": false,
    ".write": false
  }
}
`;

// 🚀 グローバルに公開
if (typeof window !== 'undefined') {
    window.firebaseConfig = firebaseConfig;
    window.appSettings = appSettings;
    window.sampleDatabaseRules = sampleDatabaseRules;
}

// Node.js環境での対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        firebaseConfig,
        appSettings,
        sampleDatabaseRules
    };
}