/**
 * アプリケーション固有設定ファイル
 * 
 * 🔧 ここを編集してください 🔧
 * あなたのアプリに合わせてカスタマイズしてください
 * 
 * Version: 1.0.0
 */

// 🎨 UI テーマ設定
const uiTheme = {
    // メインカラー
    primaryColor: "#667eea",
    secondaryColor: "#764ba2",
    
    // 状態カラー
    successColor: "#28a745",
    errorColor: "#dc3545",
    warningColor: "#ffc107",
    infoColor: "#17a2b8",
    
    // フォント
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    
    // アニメーション
    enableAnimations: true,
    animationDuration: "0.3s"
};

// 📝 アプリケーション設定
const appConfig = {
    // アプリ情報
    name: "My Firebase App",
    version: "1.0.0",
    description: "Firebase認証テンプレートを使用したアプリ",
    
    // 機能設定
    features: {
        enableOfflineMode: true,
        enableRealTimeSync: true,
        enableDataMasking: false,
        enableUserProfiles: true,
        enableNotifications: false
    },
    
    // データ設定
    data: {
        maxItemsPerUser: 1000,
        enableAutoSave: true,
        saveInterval: 5000, // 5秒
        enableVersioning: false
    },
    
    // UI設定
    ui: {
        showLoadingSpinner: true,
        showToastMessages: true,
        enableDarkMode: false,
        compactMode: false
    }
};

// 🔐 セキュリティ設定
const securityConfig = {
    // 認証設定
    auth: {
        requireEmailVerification: false,
        allowAnonymousAuth: false,
        sessionTimeout: 3600000, // 1時間（ミリ秒）
        enableMultiDevice: true
    },
    
    // データ保護
    dataProtection: {
        enableEncryption: false,
        enableMasking: false,
        enableAuditLog: false,
        enableBackup: false
    },
    
    // アクセス制御
    accessControl: {
        enableRateLimiting: false,
        maxRequestsPerMinute: 60,
        enableIPBlocking: false
    }
};

// 📊 ログ設定
const loggingConfig = {
    level: "info", // "debug", "info", "warn", "error"
    enableConsoleLogging: true,
    enableRemoteLogging: false,
    enableUserActionLogging: false
};

// 🌐 多言語設定
const i18nConfig = {
    defaultLanguage: "ja",
    supportedLanguages: ["ja", "en"],
    messages: {
        ja: {
            loginButton: "Googleでログイン",
            logoutButton: "ログアウト",
            addButton: "追加",
            deleteButton: "削除",
            saveButton: "保存",
            cancelButton: "キャンセル",
            loading: "読み込み中...",
            error: "エラーが発生しました",
            success: "成功しました",
            noData: "データがありません",
            loginRequired: "ログインが必要です"
        },
        en: {
            loginButton: "Sign in with Google",
            logoutButton: "Sign out",
            addButton: "Add",
            deleteButton: "Delete",
            saveButton: "Save",
            cancelButton: "Cancel",
            loading: "Loading...",
            error: "An error occurred",
            success: "Success",
            noData: "No data available",
            loginRequired: "Login required"
        }
    }
};

// 🎯 カスタムイベント設定
const eventConfig = {
    // カスタムイベント名
    events: {
        USER_LOGIN: "user_login",
        USER_LOGOUT: "user_logout",
        DATA_ADDED: "data_added",
        DATA_UPDATED: "data_updated",
        DATA_DELETED: "data_deleted",
        ERROR_OCCURRED: "error_occurred"
    },
    
    // イベントログ
    enableEventLogging: false,
    maxEventHistory: 100
};

// 🚀 グローバルに公開
if (typeof window !== 'undefined') {
    window.uiTheme = uiTheme;
    window.appConfig = appConfig;
    window.securityConfig = securityConfig;
    window.loggingConfig = loggingConfig;
    window.i18nConfig = i18nConfig;
    window.eventConfig = eventConfig;
}

// Node.js環境での対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        uiTheme,
        appConfig,
        securityConfig,
        loggingConfig,
        i18nConfig,
        eventConfig
    };
}