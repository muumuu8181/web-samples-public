/**
 * Common Template System - 共通基盤 v1.0
 * 
 * 機能:
 * - Express.js サーバー基盤
 * - Firebase Auth (Google認証)
 * - Firebase Realtime Database
 * - 汎用ログシステム（ダウンロードフォルダ自動出力）
 * - CSV出力エンジン
 * - テスト対応インターフェース
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

/**
 * 共通アプリケーションクラス
 * 全てのアプリ（money, time, weight等）の基盤
 */
class CommonApp {
    constructor(config) {
        this.config = {
            appName: config.appName || 'webapp',
            port: config.port || 3001,
            collection: config.collection || 'app_data',
            ...config
        };
        
        this.app = express();
        this.logs = [];
        this.testMode = false;
        this.testResults = [];
        
        // 重要: ダウンロードフォルダパス（Android対応）
        this.downloadsPath = path.join(process.env.HOME, 'storage', 'downloads');
        this.logsPath = path.join(__dirname, 'logs');
        
        this.init();
    }
    
    init() {
        this.setupMiddleware();
        this.setupFirebaseRoutes();
        this.setupLogRoutes();
        this.setupCSVRoutes();
        this.setupTestRoutes();
        this.log('共通基盤初期化完了', { appName: this.config.appName });
    }
    
    /**
     * Express ミドルウェア設定
     */
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static('.'));
        
        // CORS設定
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
            next();
        });
        
        // ログ記録ミドルウェア
        this.app.use((req, res, next) => {
            const startTime = Date.now();
            res.on('finish', () => {
                this.log('HTTP Request', {
                    method: req.method,
                    url: req.url,
                    status: res.statusCode,
                    duration: Date.now() - startTime
                });
            });
            next();
        });
    }
    
    /**
     * Firebase関連ルート
     * Firebase設定は既存テンプレートから流用
     */
    setupFirebaseRoutes() {
        // Firebase設定エンドポイント
        this.app.get('/api/firebase-config', (req, res) => {
            const firebaseConfig = {
                apiKey: "AIzaSyA5PXKChizYDCXF_GJ4KL6Ylq9K5hCPXWE",
                authDomain: "shares-b1b97.firebaseapp.com",
                databaseURL: "https://shares-b1b97-default-rtdb.firebaseio.com",
                projectId: "shares-b1b97",
                storageBucket: "shares-b1b97.firebasestorage.app",
                messagingSenderId: "38311063248",
                appId: "1:38311063248:web:0d2d5726d12b305b24b8d5",
                measurementId: "G-S2ZMJH7CGC"
            };
            
            this.log('Firebase設定要求', { userAgent: req.get('User-Agent') });
            res.json({ success: true, config: firebaseConfig });
        });
        
        // 認証状態確認
        this.app.post('/api/auth/verify', (req, res) => {
            const { token } = req.body;
            this.log('認証確認', { hasToken: !!token });
            
            // 簡易実装（実際のFirebase検証は省略）
            if (token) {
                res.json({ success: true, user: { uid: 'test-user', email: 'test@example.com' } });
            } else {
                res.status(401).json({ success: false, error: 'Invalid token' });
            }
        });
    }
    
    /**
     * ログシステム - 第3原則準拠
     * 必ず両方の場所に保存（ローカル + ダウンロードフォルダ）
     */
    setupLogRoutes() {
        // ディレクトリ作成
        if (!fs.existsSync(this.logsPath)) {
            fs.mkdirSync(this.logsPath, { recursive: true });
        }
        
        // フロントエンドからのログ記録
        this.app.post('/api/log-action', (req, res) => {
            const { action, data, timestamp } = req.body;
            this.log('User Action', { action, data, timestamp });
            res.json({ success: true, logged: true });
        });
        
        // ログファイル生成（Claude Code用）
        this.app.post('/api/generate-test-log', (req, res) => {
            let userInfo = null;
            try {
                userInfo = (req.body && req.body.userInfo) || null;
            } catch (error) {
                console.log('userInfo取得エラー:', error.message);
            }
            
            const logData = {
                exportInfo: {
                    exportedAt: new Date().toISOString(),
                    appName: this.config.appName,
                    version: '1.0',
                    source: 'Common Template System'
                },
                systemLogs: this.logs,
                testResults: this.testResults,
                userInfo: userInfo,
                timestamp: Date.now()
            };
            
            const fileName = `${this.config.appName}-test-log-${new Date().toISOString().slice(0,10)}.json`;
            const localPath = path.join(this.logsPath, fileName);
            const downloadPath = path.join(this.downloadsPath, fileName);
            
            // 両方の場所に保存
            fs.writeFileSync(localPath, JSON.stringify(logData, null, 2));
            fs.writeFileSync(downloadPath, JSON.stringify(logData, null, 2));
            
            this.log('テストログ生成', { fileName, localPath, downloadPath });
            
            res.json({
                success: true,
                fileName: fileName,
                localPath: localPath,
                downloadPath: downloadPath,
                testResult: '第3原則準拠テスト完了'
            });
        });
        
        // ログクリア
        this.app.post('/api/clear-logs', (req, res) => {
            this.logs = [];
            this.testResults = [];
            this.log('ログクリア実行');
            res.json({ success: true, message: 'ログをクリアしました' });
        });
    }
    
    /**
     * CSV出力システム - 汎用的設計
     */
    setupCSVRoutes() {
        this.app.post('/api/export-csv', (req, res) => {
            try {
                const { data, headers, filename } = req.body;
                
                if (!data || !Array.isArray(data)) {
                    return res.status(400).json({ success: false, error: 'Invalid data format' });
                }
                
                const csvFileName = filename || `${this.config.appName}-export-${new Date().toISOString().slice(0,10)}.csv`;
                const csvPath = path.join(this.downloadsPath, csvFileName);
                
                // ヘッダー自動検出
                const csvHeaders = headers || (data.length > 0 ? Object.keys(data[0]) : []);
                
                // CSV作成
                const csvWriter = createCsvWriter({
                    path: csvPath,
                    header: csvHeaders.map(key => ({ id: key, title: key }))
                });
                
                csvWriter.writeRecords(data).then(() => {
                    this.log('CSV出力完了', { fileName: csvFileName, recordCount: data.length });
                    res.json({
                        success: true,
                        fileName: csvFileName,
                        filePath: csvPath,
                        recordCount: data.length
                    });
                }).catch(error => {
                    this.log('CSV出力エラー', { error: error.message });
                    res.status(500).json({ success: false, error: error.message });
                });
                
            } catch (error) {
                this.log('CSV出力例外', { error: error.message });
                res.status(500).json({ success: false, error: error.message });
            }
        });
    }
    
    /**
     * テストシステム対応
     * 外部テストツールとの連携
     */
    setupTestRoutes() {
        // テストモード有効化
        this.app.post('/api/test/enable', (req, res) => {
            this.testMode = true;
            this.log('テストモード有効化');
            res.json({ success: true, testMode: true });
        });
        
        // テストモード無効化
        this.app.post('/api/test/disable', (req, res) => {
            this.testMode = false;
            this.log('テストモード無効化');
            res.json({ success: true, testMode: false });
        });
        
        // テスト結果記録
        this.app.post('/api/test/result', (req, res) => {
            const { testName, success, evidence, metadata } = req.body;
            
            const testResult = {
                testName,
                success,
                evidence,
                metadata,
                timestamp: new Date().toISOString(),
                appName: this.config.appName
            };
            
            this.testResults.push(testResult);
            this.log('テスト結果記録', testResult);
            
            res.json({ success: true, recorded: true });
        });
        
        // カンバン系テスト専用エンドポイント
        this.app.post('/api/test/kanban-action', (req, res) => {
            const { action, sourceId, targetId, coordinates, success } = req.body;
            
            const kanbanTest = {
                type: 'kanban_drag_drop',
                action,
                sourceId,
                targetId,
                coordinates,
                success,
                timestamp: new Date().toISOString()
            };
            
            this.testResults.push(kanbanTest);
            this.log('カンバンテスト記録', kanbanTest);
            
            res.json({ success: true, kanbanTestRecorded: true });
        });
    }
    
    /**
     * 汎用ログ記録システム
     * あらゆるアプリから使用可能
     */
    log(message, data = null) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            appName: this.config.appName,
            message,
            data,
            level: 'info'
        };
        
        this.logs.push(logEntry);
        console.log(`[${logEntry.timestamp}] ${this.config.appName}: ${message}`, data || '');
        
        // ログ数制限（メモリ管理）
        if (this.logs.length > 1000) {
            this.logs = this.logs.slice(-500);
        }
    }
    
    /**
     * カスタムルート追加（個別アプリ用）
     */
    addRoute(method, path, handler) {
        this.app[method.toLowerCase()](path, (req, res) => {
            try {
                this.log(`カスタムルート実行: ${method} ${path}`);
                handler(req, res);
            } catch (error) {
                this.log(`カスタムルートエラー: ${method} ${path}`, { error: error.message });
                res.status(500).json({ success: false, error: error.message });
            }
        });
    }
    
    /**
     * データベース操作（汎用）
     */
    addDatabaseRoutes() {
        // データ取得
        this.app.get('/api/data/:collection', (req, res) => {
            const collection = req.params.collection;
            this.log(`データ取得要求: ${collection}`);
            
            // 簡易実装（実際のFirebaseは個別アプリで実装）
            res.json({
                success: true,
                collection,
                data: [],
                message: 'データベース接続は個別アプリで実装してください'
            });
        });
        
        // データ保存
        this.app.post('/api/data/:collection', (req, res) => {
            const collection = req.params.collection;
            const data = req.body;
            
            this.log(`データ保存要求: ${collection}`, { dataKeys: Object.keys(data) });
            
            res.json({
                success: true,
                collection,
                saved: true,
                message: 'データベース操作は個別アプリで実装してください'
            });
        });
    }
    
    /**
     * サーバー起動
     */
    start(callback) {
        this.addDatabaseRoutes();
        
        this.app.listen(this.config.port, () => {
            const startMessage = `${this.config.appName} running on port ${this.config.port}`;
            console.log(startMessage);
            this.log('サーバー起動', { port: this.config.port });
            
            if (callback) callback();
        });
    }
    
    /**
     * Express appインスタンス取得（拡張用）
     */
    getApp() {
        return this.app;
    }
    
    /**
     * 設定取得
     */
    getConfig() {
        return this.config;
    }
}

/**
 * 汎用ヘルパー関数
 */
class CommonHelpers {
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    static formatDate(date = new Date()) {
        return date.toISOString().slice(0, 10);
    }
    
    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    static sanitizeString(str) {
        return str.replace(/[<>\"']/g, '');
    }
}

module.exports = {
    CommonApp,
    CommonHelpers
};