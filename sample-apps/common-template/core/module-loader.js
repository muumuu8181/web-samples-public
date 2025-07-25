// ================================================================
// module-loader.js - 動的モジュール読み込みシステム
// 
// 📋 機能概要:
// - config.jsonに基づく安全な動的読み込み
// - エラー隔離（一つのアプリエラーが全体に影響しない）
// - セキュアな読み込み制御
// - 後方互換性対応
//
// 🛡️ セキュリティ:
// - ホワイトリスト方式でアプリ制限
// - パストラバーサル攻撃防止
// - try-catch によるエラー隔離
// ================================================================

const fs = require('fs');
const path = require('path');

class ModuleLoader {
    constructor(commonInstance, configPath = './config.json') {
        this.commonInstance = commonInstance;
        this.configPath = configPath;
        this.allowedAppsPath = './allowed-apps.json';
        this.loadedApps = new Map();
        this.appRegistry = new Map();
        this.config = this.loadConfig();
        
        // セキュリティ: 外部ファイルから許可されたアプリのホワイトリストを読み込み
        this.allowedApps = this.loadAllowedApps();
        
        this.log('🔧 モジュールローダー初期化完了');
    }

    // ================================================================
    // 許可アプリリスト読み込み（外部ファイル）
    // ================================================================
    loadAllowedApps() {
        try {
            if (!fs.existsSync(this.allowedAppsPath)) {
                this.log(`⚠️ 許可アプリファイルが見つかりません: ${this.allowedAppsPath}`);
                this.log('🔧 デフォルトの許可アプリリストを使用します');
                return ['money', 'time', 'weight', 'memo']; // デフォルト
            }

            const allowedAppsData = fs.readFileSync(this.allowedAppsPath, 'utf8');
            const allowedAppsConfig = JSON.parse(allowedAppsData);
            
            // バリデーション
            if (!allowedAppsConfig.allowedApps || !Array.isArray(allowedAppsConfig.allowedApps)) {
                this.log('❌ 許可アプリファイルの形式が正しくありません');
                return ['money', 'time', 'weight', 'memo']; // デフォルト
            }

            this.log(`📋 許可アプリリスト読み込み完了 | ${allowedAppsConfig.allowedApps.length}個のアプリが許可されています`);
            this.log(`🔧 許可アプリ: ${allowedAppsConfig.allowedApps.join(', ')}`);
            
            return allowedAppsConfig.allowedApps;
            
        } catch (error) {
            this.log(`❌ 許可アプリリスト読み込みエラー | ${error.message}`);
            this.log('🔧 デフォルトの許可アプリリストを使用します');
            return ['money', 'time', 'weight', 'memo']; // デフォルト
        }
    }

    // ================================================================
    // 設定読み込み
    // ================================================================
    loadConfig() {
        try {
            if (!fs.existsSync(this.configPath)) {
                this.log(`⚠️ 設定ファイルが見つかりません: ${this.configPath}`);
                return this.getDefaultConfig();
            }

            const configData = fs.readFileSync(this.configPath, 'utf8');
            const config = JSON.parse(configData);
            
            // Tolerant Reader パターン: 必須項目のデフォルト値設定
            const mergedConfig = {
                version: '2.0',
                enabledApps: [],
                features: {
                    firebaseAuth: true,
                    realtimeDatabase: true,
                    csvExport: true,
                    jsonLogs: true
                },
                ...config
            };

            this.log(`📋 設定読み込み完了 | バージョン: ${mergedConfig.version}`);
            return mergedConfig;
            
        } catch (error) {
            this.log(`❌ 設定読み込みエラー | ${error.message}`);
            return this.getDefaultConfig();
        }
    }

    getDefaultConfig() {
        return {
            version: '2.0',
            appName: 'SmartPersonalManager',
            enabledApps: ['money'],
            features: {
                firebaseAuth: true,
                realtimeDatabase: true,
                csvExport: true,
                jsonLogs: true
            }
        };
    }

    // ================================================================
    // アプリモジュール動的読み込み
    // ================================================================
    async loadEnabledApps() {
        const enabledApps = this.config.enabledApps || [];
        this.log(`🚀 有効アプリ読み込み開始 | 対象: ${enabledApps.join(', ')}`);

        const loadResults = [];

        for (const appName of enabledApps) {
            try {
                const result = await this.loadSingleApp(appName);
                loadResults.push(result);
            } catch (error) {
                // エラー隔離: 一つのアプリ失敗が全体を止めない
                const errorResult = {
                    appName,
                    success: false,
                    error: error.message,
                    loadedAt: new Date().toISOString()
                };
                loadResults.push(errorResult);
                this.log(`❌ アプリ読み込み失敗 | ${appName} | ${error.message}`);
            }
        }

        this.log(`✅ アプリ読み込み完了 | 成功: ${loadResults.filter(r => r.success).length}/${loadResults.length}`);
        return loadResults;
    }

    async loadSingleApp(appName) {
        // セキュリティチェック
        if (!this.isAllowedApp(appName)) {
            throw new Error(`許可されていないアプリです: ${appName}`);
        }

        const appPath = this.getAppPath(appName);
        
        // ファイル存在チェック
        if (!fs.existsSync(appPath)) {
            throw new Error(`アプリファイルが見つかりません: ${appPath}`);
        }

        // 動的読み込み
        const AppClass = require(appPath);
        
        // アプリインスタンス作成
        const appInstance = new AppClass(this.commonInstance, this.config);
        
        // アプリ登録
        this.appRegistry.set(appName, {
            instance: appInstance,
            config: this.config.apps?.[appName] || {},
            loadedAt: new Date().toISOString(),
            version: appInstance.version || '1.0'
        });

        this.log(`✅ アプリ読み込み成功 | ${appName} | バージョン: ${appInstance.version || '1.0'}`);
        
        return {
            appName,
            success: true,
            version: appInstance.version || '1.0',
            loadedAt: new Date().toISOString()
        };
    }

    // ================================================================
    // セキュリティ機能
    // ================================================================
    isAllowedApp(appName) {
        // ホワイトリスト方式
        if (!this.allowedApps.includes(appName)) {
            return false;
        }

        // パストラバーサル攻撃防止
        if (appName.includes('..') || appName.includes('/') || appName.includes('\\')) {
            return false;
        }

        // 英数字とハイフンのみ許可
        if (!/^[a-zA-Z0-9-_]+$/.test(appName)) {
            return false;
        }

        return true;
    }

    getAppPath(appName) {
        return path.resolve(__dirname, '..', 'apps', `${appName}.js`);
    }

    // ================================================================
    // アプリ管理機能
    // ================================================================
    getLoadedApps() {
        const apps = [];
        for (const [appName, appData] of this.appRegistry) {
            apps.push({
                name: appName,
                displayName: this.config.apps?.[appName]?.name || appName,
                icon: this.config.apps?.[appName]?.icon || '📱',
                description: this.config.apps?.[appName]?.description || '',
                version: appData.version,
                loadedAt: appData.loadedAt,
                status: 'loaded'
            });
        }
        return apps;
    }

    getAppInstance(appName) {
        const appData = this.appRegistry.get(appName);
        return appData ? appData.instance : null;
    }

    isAppLoaded(appName) {
        return this.appRegistry.has(appName);
    }

    // ================================================================
    // ホットリロード機能
    // ================================================================
    async reloadApp(appName) {
        try {
            // アプリアンロード
            if (this.appRegistry.has(appName)) {
                const appData = this.appRegistry.get(appName);
                if (appData.instance && typeof appData.instance.cleanup === 'function') {
                    await appData.instance.cleanup();
                }
                this.appRegistry.delete(appName);
            }

            // キャッシュクリア
            const appPath = this.getAppPath(appName);
            delete require.cache[require.resolve(appPath)];

            // 再読み込み
            const result = await this.loadSingleApp(appName);
            this.log(`🔄 アプリリロード完了 | ${appName}`);
            return result;
            
        } catch (error) {
            this.log(`❌ アプリリロード失敗 | ${appName} | ${error.message}`);
            throw error;
        }
    }

    // ================================================================
    // 設定更新機能
    // ================================================================
    async updateConfig(newConfig) {
        try {
            // 設定検証
            const validatedConfig = this.validateConfig(newConfig);
            
            // ファイル保存
            fs.writeFileSync(this.configPath, JSON.stringify(validatedConfig, null, 2));
            
            // 内部設定更新
            this.config = validatedConfig;
            
            // アプリの再読み込み（必要に応じて）
            await this.reloadAppsIfNeeded(validatedConfig);
            
            this.log('⚙️ 設定更新完了');
            return { success: true, config: validatedConfig };
            
        } catch (error) {
            this.log(`❌ 設定更新エラー | ${error.message}`);
            throw error;
        }
    }

    validateConfig(config) {
        // 基本的な型チェック
        if (typeof config !== 'object' || config === null) {
            throw new Error('設定は有効なオブジェクトである必要があります');
        }

        // 必須項目チェック
        if (config.enabledApps && !Array.isArray(config.enabledApps)) {
            throw new Error('enabledAppsは配列である必要があります');
        }

        // セキュリティチェック
        if (config.enabledApps) {
            for (const appName of config.enabledApps) {
                if (!this.isAllowedApp(appName)) {
                    throw new Error(`許可されていないアプリが含まれています: ${appName}`);
                }
            }
        }

        return config;
    }

    async reloadAppsIfNeeded(newConfig) {
        const oldEnabledApps = new Set(this.config.enabledApps || []);
        const newEnabledApps = new Set(newConfig.enabledApps || []);

        // 新しく追加されたアプリを読み込み
        for (const appName of newEnabledApps) {
            if (!oldEnabledApps.has(appName)) {
                await this.loadSingleApp(appName);
            }
        }

        // 削除されたアプリをアンロード
        for (const appName of oldEnabledApps) {
            if (!newEnabledApps.has(appName)) {
                await this.unloadApp(appName);
            }
        }
    }

    async unloadApp(appName) {
        if (this.appRegistry.has(appName)) {
            const appData = this.appRegistry.get(appName);
            if (appData.instance && typeof appData.instance.cleanup === 'function') {
                await appData.instance.cleanup();
            }
            this.appRegistry.delete(appName);
            this.log(`🗑️ アプリアンロード完了 | ${appName}`);
        }
    }

    // ================================================================
    // ログ機能
    // ================================================================
    log(message) {
        const timestamp = new Date().toLocaleString('ja-JP');
        const logEntry = `[${timestamp}] 🔧 ModuleLoader | ${message}`;
        
        if (this.commonInstance && typeof this.commonInstance.log === 'function') {
            this.commonInstance.log(logEntry);
        } else {
            console.log(logEntry);
        }
    }

    // ================================================================
    // 統計情報
    // ================================================================
    getStats() {
        return {
            configVersion: this.config.version,
            totalAppsConfigured: this.config.enabledApps?.length || 0,
            loadedAppsCount: this.appRegistry.size,
            loadedApps: Array.from(this.appRegistry.keys()),
            allowedApps: this.allowedApps,
            lastConfigLoad: this.lastConfigLoad || new Date().toISOString()
        };
    }
}

module.exports = ModuleLoader;