/**
 * Firebase データ管理コアモジュール
 * 
 * ⚠️ 警告: このファイルは編集しないでください ⚠️
 * このファイルはテンプレートのコア機能です。
 * 設定は config/firebase-config.js で行ってください。
 * 
 * Version: 1.0.0
 * Author: Template System
 */

class FirebaseDataCore {
    constructor() {
        this.database = null;
        this.dataRef = null;
        this.user = null;
        this.dataType = null;
        this.callbacks = {
            onDataChange: [],
            onConnectionChange: [],
            onError: []
        };
        this.isInitialized = false;
        this.isConnected = false;
    }

    /**
     * データ管理システムを初期化
     * @param {Object} firebaseConfig - Firebase設定オブジェクト
     * @param {string} dataType - データタイプ ('todos', 'memos', 'surveys' など)
     */
    init(firebaseConfig, dataType) {
        try {
            // Firebase初期化（既に初期化済みでもエラーにならない）
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            
            this.database = firebase.database();
            this.dataType = dataType;
            this.setupConnectionListener();
            this.isInitialized = true;
            
            console.log(`🔥 Firebase Data Core initialized for "${dataType}"`);
        } catch (error) {
            console.error('❌ Firebase Data Core initialization failed:', error);
            this.triggerErrorCallbacks(error);
            throw error;
        }
    }

    /**
     * ユーザー認証後のデータセットアップ
     * @param {Object} user - Firebase認証ユーザー
     */
    setupUserData(user) {
        if (!this.isInitialized) {
            throw new Error('Firebase Data Core が初期化されていません');
        }

        // 前のデータ参照をクリーンアップ
        this.cleanup();

        this.user = user;
        
        if (user) {
            // ユーザー専用データパス: users/{userId}/{dataType}
            this.dataRef = this.database.ref(`users/${user.uid}/${this.dataType}`);
            this.setupDataListener();
            console.log(`✅ User data setup for ${user.email || user.uid}: users/${user.uid}/${this.dataType}`);
        } else {
            this.dataRef = null;
            this.user = null;
            console.log('🔄 User data cleared (logged out)');
        }
    }

    /**
     * 接続状態の監視を設定
     * @private
     */
    setupConnectionListener() {
        this.database.ref('.info/connected').on('value', (snap) => {
            const connected = snap.val();
            this.isConnected = connected;
            
            // 接続状態変更コールバックを実行
            this.callbacks.onConnectionChange.forEach(callback => {
                try {
                    callback(connected);
                } catch (error) {
                    console.error('接続状態変更コールバックエラー:', error);
                }
            });
        });
    }

    /**
     * データ変更の監視を設定
     * @private
     */
    setupDataListener() {
        if (!this.dataRef) return;

        this.dataRef.on('value', (snapshot) => {
            const data = snapshot.val() || {};
            
            // データ変更コールバックを実行
            this.callbacks.onDataChange.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('データ変更コールバックエラー:', error);
                }
            });
        }, (error) => {
            console.error('データ監視エラー:', error);
            this.triggerErrorCallbacks(error);
        });
    }

    /**
     * データを追加
     * @param {Object} data - 追加するデータ
     * @param {boolean} withMasking - マスキング適用するか
     * @returns {Promise<string>} 追加されたデータのキー
     */
    async addData(data, withMasking = false) {
        if (!this.dataRef || !this.user) {
            throw new Error('ユーザーがログインしていないか、データ参照が設定されていません');
        }

        try {
            const enrichedData = {
                ...data,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                userId: this.user.uid,
                userName: this.user.displayName || 'ユーザー',
                userEmail: this.user.email || '',
                createdAt: new Date().toISOString()
            };

            // マスキング処理
            if (withMasking && data.content) {
                enrichedData.content = this.maskSensitiveData(data.content);
                enrichedData.isMasked = true;
            }

            const newRef = await this.dataRef.push(enrichedData);
            console.log('✅ データ追加成功:', newRef.key);
            return newRef.key;
        } catch (error) {
            console.error('❌ データ追加失敗:', error);
            this.triggerErrorCallbacks(error);
            throw error;
        }
    }

    /**
     * データを更新
     * @param {string} key - データキー
     * @param {Object} updates - 更新内容
     * @returns {Promise<void>}
     */
    async updateData(key, updates) {
        if (!this.dataRef || !this.user) {
            throw new Error('ユーザーがログインしていないか、データ参照が設定されていません');
        }

        try {
            const updateData = {
                ...updates,
                updatedAt: new Date().toISOString(),
                lastModifiedBy: this.user.uid
            };

            await this.dataRef.child(key).update(updateData);
            console.log('✅ データ更新成功:', key);
        } catch (error) {
            console.error('❌ データ更新失敗:', error);
            this.triggerErrorCallbacks(error);
            throw error;
        }
    }

    /**
     * データを削除
     * @param {string} key - データキー
     * @returns {Promise<void>}
     */
    async removeData(key) {
        if (!this.dataRef || !this.user) {
            throw new Error('ユーザーがログインしていないか、データ参照が設定されていません');
        }

        try {
            await this.dataRef.child(key).remove();
            console.log('✅ データ削除成功:', key);
        } catch (error) {
            console.error('❌ データ削除失敗:', error);
            this.triggerErrorCallbacks(error);
            throw error;
        }
    }

    /**
     * 全データを取得（一回のみ）
     * @returns {Promise<Object>} データオブジェクト
     */
    async getData() {
        if (!this.dataRef || !this.user) {
            throw new Error('ユーザーがログインしていないか、データ参照が設定されていません');
        }

        try {
            const snapshot = await this.dataRef.once('value');
            return snapshot.val() || {};
        } catch (error) {
            console.error('❌ データ取得失敗:', error);
            this.triggerErrorCallbacks(error);
            throw error;
        }
    }

    /**
     * センシティブデータのマスキング
     * @param {string} text - マスキング対象テキスト
     * @returns {string} マスキング済みテキスト
     * @private
     */
    maskSensitiveData(text) {
        if (!text || typeof text !== 'string') return text;
        
        if (text.length <= 2) {
            return '*'.repeat(text.length);
        }
        
        // 最初と最後の文字を残してマスキング
        return text[0] + '*'.repeat(text.length - 2) + text[text.length - 1];
    }

    /**
     * データ変更のコールバックを登録
     * @param {Function} callback - コールバック関数
     */
    onDataChange(callback) {
        this.callbacks.onDataChange.push(callback);
    }

    /**
     * 接続状態変更のコールバックを登録
     * @param {Function} callback - コールバック関数
     */
    onConnectionChange(callback) {
        this.callbacks.onConnectionChange.push(callback);
    }

    /**
     * エラーのコールバックを登録
     * @param {Function} callback - コールバック関数
     */
    onError(callback) {
        this.callbacks.onError.push(callback);
    }

    /**
     * エラーコールバックを実行
     * @param {Error} error - エラーオブジェクト
     * @private
     */
    triggerErrorCallbacks(error) {
        this.callbacks.onError.forEach(callback => {
            try {
                callback(error);
            } catch (callbackError) {
                console.error('エラーコールバック実行エラー:', callbackError);
            }
        });
    }

    /**
     * 現在のユーザーを取得
     * @returns {Object|null} ユーザー情報
     */
    getCurrentUser() {
        return this.user;
    }

    /**
     * 接続状態を取得
     * @returns {boolean} 接続状態
     */
    isConnectedToDatabase() {
        return this.isConnected;
    }

    /**
     * データ参照のパスを取得
     * @returns {string|null} データパス
     */
    getDataPath() {
        return this.dataRef ? this.dataRef.toString() : null;
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
     * データ監視を停止
     */
    cleanup() {
        if (this.dataRef) {
            this.dataRef.off();
        }
    }

    /**
     * データ管理システムを破棄
     */
    destroy() {
        this.cleanup();
        this.clearCallbacks();
        this.database = null;
        this.dataRef = null;
        this.user = null;
        this.dataType = null;
        this.isInitialized = false;
        this.isConnected = false;
    }
}

// グローバルインスタンス作成のヘルパー関数
function createFirebaseDataCore(dataType) {
    return new FirebaseDataCore();
}

// グローバル関数として公開
if (typeof window !== 'undefined') {
    window.FirebaseDataCore = FirebaseDataCore;
    window.createFirebaseDataCore = createFirebaseDataCore;
}

// Node.js環境での対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FirebaseDataCore, createFirebaseDataCore };
}