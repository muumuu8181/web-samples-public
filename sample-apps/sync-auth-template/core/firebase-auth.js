/**
 * Firebase 認証コアモジュール
 * 
 * ⚠️ 警告: このファイルは編集しないでください ⚠️
 * このファイルはテンプレートのコア機能です。
 * 設定は config/firebase-config.js で行ってください。
 * 
 * Version: 1.0.0
 * Author: Template System
 */

class FirebaseAuthCore {
    constructor() {
        this.user = null;
        this.auth = null;
        this.callbacks = {
            onAuthStateChanged: [],
            onLoginSuccess: [],
            onLoginError: [],
            onLogoutSuccess: []
        };
        this.isInitialized = false;
    }

    /**
     * Firebase認証を初期化
     * @param {Object} firebaseConfig - Firebase設定オブジェクト
     */
    init(firebaseConfig) {
        try {
            // Firebase初期化（既に初期化済みでもエラーにならない）
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            
            this.auth = firebase.auth();
            this.setupAuthStateListener();
            this.isInitialized = true;
            
            console.log('🔥 Firebase Auth Core initialized successfully');
        } catch (error) {
            console.error('❌ Firebase Auth Core initialization failed:', error);
            throw error;
        }
    }

    /**
     * 認証状態の監視を設定
     * @private
     */
    setupAuthStateListener() {
        this.auth.onAuthStateChanged((user) => {
            const previousUser = this.user;
            this.user = user;
            
            // すべての認証状態変更コールバックを実行
            this.callbacks.onAuthStateChanged.forEach(callback => {
                try {
                    callback(user, previousUser);
                } catch (error) {
                    console.error('認証状態変更コールバックエラー:', error);
                }
            });
        });
    }

    /**
     * Google認証でログイン
     * @returns {Promise<Object>} ユーザー情報
     */
    async signInWithGoogle() {
        if (!this.isInitialized) {
            throw new Error('Firebase Auth Core が初期化されていません');
        }

        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await this.auth.signInWithPopup(provider);
            
            // ログイン成功コールバックを実行
            this.callbacks.onLoginSuccess.forEach(callback => {
                try {
                    callback(result.user);
                } catch (error) {
                    console.error('ログイン成功コールバックエラー:', error);
                }
            });
            
            console.log('✅ Google認証成功:', result.user.email);
            return result.user;
        } catch (error) {
            // ログインエラーコールバックを実行
            this.callbacks.onLoginError.forEach(callback => {
                try {
                    callback(error);
                } catch (callbackError) {
                    console.error('ログインエラーコールバックエラー:', callbackError);
                }
            });
            
            console.error('❌ Google認証失敗:', error);
            throw error;
        }
    }

    /**
     * 匿名認証でログイン
     * @returns {Promise<Object>} ユーザー情報
     */
    async signInAnonymously() {
        if (!this.isInitialized) {
            throw new Error('Firebase Auth Core が初期化されていません');
        }

        try {
            const result = await this.auth.signInAnonymously();
            
            this.callbacks.onLoginSuccess.forEach(callback => {
                try {
                    callback(result.user);
                } catch (error) {
                    console.error('ログイン成功コールバックエラー:', error);
                }
            });
            
            console.log('✅ 匿名認証成功:', result.user.uid);
            return result.user;
        } catch (error) {
            this.callbacks.onLoginError.forEach(callback => {
                try {
                    callback(error);
                } catch (callbackError) {
                    console.error('ログインエラーコールバックエラー:', callbackError);
                }
            });
            
            console.error('❌ 匿名認証失敗:', error);
            throw error;
        }
    }

    /**
     * ログアウト
     * @returns {Promise<void>}
     */
    async signOut() {
        if (!this.isInitialized) {
            throw new Error('Firebase Auth Core が初期化されていません');
        }

        try {
            await this.auth.signOut();
            
            this.callbacks.onLogoutSuccess.forEach(callback => {
                try {
                    callback();
                } catch (error) {
                    console.error('ログアウト成功コールバックエラー:', error);
                }
            });
            
            console.log('✅ ログアウト成功');
        } catch (error) {
            console.error('❌ ログアウト失敗:', error);
            throw error;
        }
    }

    /**
     * 現在のユーザーを取得
     * @returns {Object|null} ユーザー情報
     */
    getCurrentUser() {
        return this.user;
    }

    /**
     * ユーザーがログイン済みかチェック
     * @returns {boolean} ログイン状態
     */
    isLoggedIn() {
        return this.user !== null;
    }

    /**
     * 認証状態変更のコールバックを登録
     * @param {Function} callback - コールバック関数
     */
    onAuthStateChanged(callback) {
        this.callbacks.onAuthStateChanged.push(callback);
    }

    /**
     * ログイン成功のコールバックを登録
     * @param {Function} callback - コールバック関数
     */
    onLoginSuccess(callback) {
        this.callbacks.onLoginSuccess.push(callback);
    }

    /**
     * ログインエラーのコールバックを登録
     * @param {Function} callback - コールバック関数
     */
    onLoginError(callback) {
        this.callbacks.onLoginError.push(callback);
    }

    /**
     * ログアウト成功のコールバックを登録
     * @param {Function} callback - コールバック関数
     */
    onLogoutSuccess(callback) {
        this.callbacks.onLogoutSuccess.push(callback);
    }

    /**
     * すべてのコールバックをクリア
     */
    clearCallbacks() {
        Object.keys(this.callbacks).forEach(key => {
            this.callbacks[key] = [];
        });
    }

    /**
     * 認証システムを破棄
     */
    destroy() {
        this.clearCallbacks();
        this.user = null;
        this.auth = null;
        this.isInitialized = false;
    }
}

// グローバルインスタンスを作成（シングルトンパターン）
if (typeof window !== 'undefined') {
    window.FirebaseAuthCore = window.FirebaseAuthCore || new FirebaseAuthCore();
}

// Node.js環境での対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirebaseAuthCore;
}