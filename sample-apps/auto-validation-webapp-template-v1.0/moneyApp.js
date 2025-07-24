/**
 * Money Management App - お金管理アプリ v1.0
 * 
 * 共通基盤(common.js)を使用
 * カンバンD&D機能付き
 * 完全テスト対応
 */

const { CommonApp, CommonHelpers } = require('./common');
const path = require('path');

/**
 * お金管理アプリクラス
 */
class MoneyApp extends CommonApp {
    constructor() {
        super({
            appName: 'money-tracker',
            port: 3001,
            collection: 'money_data'
        });
        
        this.categories = ['収入', '食費', '交通費', '娯楽費', '日用品', '貯金', 'その他'];
        this.setupMoneyRoutes();
        this.setupFrontend();
    }
    
    /**
     * お金管理専用ルート
     */
    setupMoneyRoutes() {
        // データ一覧取得
        this.app.get('/api/money/list', (req, res) => {
            this.log('お金データ一覧取得要求');
            
            // サンプルデータ（実際はFirebaseから取得）
            const sampleData = [
                {
                    id: 'money_001',
                    amount: 1500,
                    category: '食費',
                    description: '昼食代',
                    date: '2025-07-24',
                    timestamp: Date.now(),
                    status: 'pending'
                },
                {
                    id: 'money_002',
                    amount: -800,
                    category: '交通費',
                    description: '電車代',
                    date: '2025-07-24',
                    timestamp: Date.now(),
                    status: 'completed'
                }
            ];
            
            this.log('お金データ一覧取得完了', { count: sampleData.length });
            res.json({ success: true, data: sampleData });
        });
        
        // データ追加
        this.app.post('/api/money/add', (req, res) => {
            const { amount, category, description, date } = req.body;
            
            const newEntry = {
                id: CommonHelpers.generateId(),
                amount: parseFloat(amount),
                category,
                description,
                date: date || CommonHelpers.formatDate(),
                timestamp: Date.now(),
                status: 'pending'
            };
            
            this.log('お金データ追加', newEntry);
            
            // 実際のアプリではFirebaseに保存
            res.json({ success: true, data: newEntry });
        });
        
        // カンバン移動（重要: テスト対象）
        this.app.post('/api/money/move', (req, res) => {
            const { id, fromStatus, toStatus, coordinates } = req.body;
            
            this.log('カンバン移動実行', { id, fromStatus, toStatus, coordinates });
            
            // カンバン移動の証跡記録
            const moveEvidence = {
                itemId: id,
                sourceColumn: fromStatus,
                targetColumn: toStatus,
                coordinates: coordinates,
                timestamp: new Date().toISOString(),
                success: true
            };
            
            // テストツール用ログ記録
            this.app.post('/api/test/kanban-action', {
                body: {
                    action: 'kanban_move_completed',
                    sourceId: id,
                    targetId: toStatus,
                    coordinates: coordinates,
                    success: true,
                    evidence: moveEvidence
                }
            });
            
            res.json({ 
                success: true, 
                moved: true,
                evidence: moveEvidence
            });
        });
        
        // 集計データ取得
        this.app.get('/api/money/summary', (req, res) => {
            this.log('集計データ取得要求');
            
            const summary = {
                totalIncome: 50000,
                totalExpense: 25000,
                balance: 25000,
                categoryBreakdown: {
                    '食費': 15000,
                    '交通費': 8000,
                    '娯楽費': 2000
                },
                monthlyTrend: [
                    { month: '2025-06', income: 45000, expense: 30000 },
                    { month: '2025-07', income: 50000, expense: 25000 }
                ]
            };
            
            this.log('集計データ取得完了', summary);
            res.json({ success: true, summary });
        });
    }
    
    /**
     * フロントエンドHTML配信
     */
    setupFrontend() {
        this.app.get('/', (req, res) => {
            this.log('フロントエンドページ要求');
            res.send(this.generateHTML());
        });
    }
    
    /**
     * HTML生成（カンバンD&D機能付き）
     */
    generateHTML() {
        return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>💰 お金管理アプリ - 共通テンプレート版</title>
    
    <!-- Firebase SDK -->
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js"></script>
    
    <style>
        :root {
            --primary: #2E8B57;
            --danger: #DC143C;
            --warning: #FF8C00;
            --bg: #F5F5F5;
            --surface: #FFFFFF;
            --text: #333333;
            --border: #DDDDDD;
            --shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: var(--bg);
            color: var(--text);
            line-height: 1.6;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        /* ヘッダー */
        header {
            background: var(--surface);
            padding: 20px;
            border-radius: 12px;
            box-shadow: var(--shadow);
            margin-bottom: 20px;
            text-align: center;
        }

        h1 {
            color: var(--primary);
            margin-bottom: 10px;
        }

        .auth-section {
            margin-top: 15px;
        }

        .auth-btn {
            background: #4285f4;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
        }

        /* 入力フォーム */
        .input-section {
            background: var(--surface);
            padding: 20px;
            border-radius: 12px;
            box-shadow: var(--shadow);
            margin-bottom: 20px;
        }

        .form-row {
            display: flex;
            gap: 15px;
            margin-bottom: 15px;
            flex-wrap: wrap;
        }

        .form-group {
            flex: 1;
            min-width: 150px;
        }

        label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
        }

        input, select, textarea {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--border);
            border-radius: 6px;
            font-size: 14px;
        }

        button {
            background: var(--primary);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
        }

        button:hover {
            opacity: 0.9;
        }

        /* カンバンボード（重要: テスト対象） */
        .kanban-board {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }

        .kanban-column {
            background: var(--surface);
            border-radius: 12px;
            padding: 15px;
            box-shadow: var(--shadow);
        }

        .column-header {
            font-weight: 600;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid var(--border);
        }

        .kanban-item {
            background: #f9f9f9;
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 10px;
            cursor: move;
            /* GPU加速最適化 */
            will-change: transform;
            transform: translate3d(0, 0, 0);
            transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1);
            backface-visibility: hidden;
            perspective: 1000px;
            /* レイヤー分離でリペイント最適化 */
            contain: layout style paint;
        }

        .kanban-item:hover {
            /* hoverアニメーション無効化（ガクガク原因） */
            /* transform: translateY(-2px); */
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .kanban-item.newly-added {
            /* アニメーション無効化（ガクガク原因） */
            /* animation: slideInRight 0.5s ease-out; */
            border: 2px solid var(--primary);
        }

        /* @keyframes slideInRight {
            from {
                transform: translateX(100px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        } */

        .kanban-item.dragging {
            opacity: 0.8;
            /* GPU加速・完全無効化で最大スムーズ化 */
            transform: translate3d(0, 0, 0);
            /* scale(1.05) も無効化 */
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
            z-index: 1000;
            /* ドラッグ中はCSS transitionを無効化 */
            transition: none;
            /* 最高優先度でGPU処理 */
            will-change: transform;
        }

        .drop-zone {
            min-height: 100px;
            border: 2px dashed transparent;
            border-radius: 8px;
            transition: border-color 0.3s;
        }

        .drop-zone.drag-over {
            border-color: var(--primary);
            background: rgba(46, 139, 87, 0.1);
        }
        
        /* ドロップ位置インジケーター */
        .drop-indicator {
            height: 4px;
            background: linear-gradient(90deg, var(--primary), #4CAF50);
            width: 100%;
            margin: 8px 0;
            border-radius: 3px;
            opacity: 0;
            transform: scaleX(0);
            transition: all 0.15s ease-out;
            box-shadow: 0 0 12px rgba(46, 139, 87, 0.6);
            position: relative;
            pointer-events: none;
        }
        
        .drop-indicator::before {
            content: '';
            position: absolute;
            left: -6px;
            top: -3px;
            width: 10px;
            height: 10px;
            background: var(--primary);
            border-radius: 50%;
            box-shadow: 0 0 8px rgba(46, 139, 87, 0.8);
        }
        
        .drop-indicator::after {
            content: '';
            position: absolute;
            right: -6px;
            top: -3px;
            width: 10px;
            height: 10px;
            background: var(--primary);
            border-radius: 50%;
            box-shadow: 0 0 8px rgba(46, 139, 87, 0.8);
        }
        
        .drop-indicator.active {
            opacity: 1;
            transform: scaleX(1);
        }

        .amount-positive {
            color: var(--primary);
            font-weight: 600;
        }

        .amount-negative {
            color: var(--danger);
            font-weight: 600;
        }

        /* ログセクション */
        .log-section {
            background: var(--surface);
            padding: 20px;
            border-radius: 12px;
            box-shadow: var(--shadow);
        }

        .log-controls {
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
            flex-wrap: wrap;
        }

        .log-btn {
            background: #2196F3;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
        }

        .debug-logs {
            background: #1e1e1e;
            color: #00ff00;
            padding: 15px;
            border-radius: 6px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            max-height: 300px;
            overflow-y: auto;
            white-space: pre-line;
        }

        /* レスポンシブ */
        @media (max-width: 768px) {
            .form-row {
                flex-direction: column;
            }
            
            .kanban-board {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- ヘッダー -->
        <header>
            <h1>💰 お金管理アプリ</h1>
            <p>共通テンプレートシステム v1.0</p>
            <div class="auth-section">
                <button class="auth-btn" id="authBtn" onclick="toggleAuth()">Google でログイン</button>
                <div id="userInfo" style="margin-top: 10px;"></div>
            </div>
        </header>

        <!-- 入力フォーム -->
        <div class="input-section">
            <h3>💸 新しい記録を追加</h3>
            <form id="moneyForm" onsubmit="addMoney(event)">
                <div class="form-row">
                    <div class="form-group">
                        <label for="amount">金額</label>
                        <input type="number" id="amount" required placeholder="例: 1500">
                    </div>
                    <div class="form-group">
                        <label for="category">カテゴリ</label>
                        <select id="category" required>
                            <option value="">選択してください</option>
                            <option value="収入">💰 収入</option>
                            <option value="食費">🍽️ 食費</option>
                            <option value="交通費">🚃 交通費</option>
                            <option value="娯楽費">🎮 娯楽費</option>
                            <option value="日用品">🛒 日用品</option>
                            <option value="貯金">💰 貯金</option>
                            <option value="その他">📝 その他</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="date">日付</label>
                        <input type="date" id="date" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="description">説明</label>
                        <textarea id="description" rows="2" placeholder="例: 昼食代"></textarea>
                    </div>
                </div>
                <button type="submit">💾 記録を追加</button>
            </form>
        </div>

        <!-- カンバンボード（重要: テスト対象） -->
        <div class="kanban-section">
            <h3>📋 お金の流れ管理</h3>
            <div class="kanban-board">
                <div class="kanban-column">
                    <div class="column-header">⏳ Pending</div>
                    <div class="drop-zone" data-status="pending" id="pending-zone">
                        <div class="kanban-item" draggable="true" data-id="task-item-1" id="task-item-1">
                            <div class="amount-negative">-1,500円</div>
                            <div>食費 - 昼食代</div>
                            <small>2025-07-24</small>
                        </div>
                    </div>
                </div>
                
                <div class="kanban-column">
                    <div class="column-header">🔄 In Progress</div>
                    <div class="drop-zone" data-status="in-progress" id="in-progress-zone">
                        <div class="kanban-item" draggable="true" data-id="task-item-3">
                            <div class="amount-positive">+5,000円</div>
                            <div>収入 - アルバイト代</div>
                            <small>2025-07-24</small>
                        </div>
                    </div>
                </div>
                
                <div class="kanban-column">
                    <div class="column-header">✅ Completed</div>
                    <div class="drop-zone" data-status="completed" id="completed-zone">
                        <div class="kanban-item" draggable="true" data-id="task-item-2">
                            <div class="amount-negative">-800円</div>
                            <div>交通費 - 電車代</div>
                            <small>2025-07-24</small>
                        </div>
                    </div>
                </div>
                
                <div class="kanban-column">
                    <div class="column-header">❌ キャンセル</div>
                    <div class="drop-zone" data-status="cancelled" id="cancelled-zone">
                        <!-- キャンセルされた項目 -->
                    </div>
                </div>
            </div>
        </div>

        <!-- ログセクション -->
        <div class="log-section">
            <h3>📊 システムログ</h3>
            <div class="log-controls">
                <button class="log-btn" onclick="downloadLogs()">📥 ログダウンロード</button>
                <button class="log-btn" onclick="copyLogs()">📋 ログコピー</button>
                <button class="log-btn" onclick="clearLogs()">🗑️ ログクリア</button>
                <button class="log-btn" onclick="testKanban()">🧪 カンバンテスト</button>
                <button class="log-btn" onclick="exportCSV()">📊 CSV出力</button>
            </div>
            <div class="debug-logs" id="debugLogs">アプリケーション起動中...</div>
        </div>
    </div>

    <script>
        // Firebase設定
        let firebaseConfig = null;
        let user = null;
        let logs = [];
        
        // パフォーマンス監視システム（ガクガク検知用）
        const performanceMonitor = {
            frameDrops: 0,
            lastFrameTime: 0,
            dragStartTime: 0,
            frameTimings: [],
            
            init() {
                this.lastFrameTime = performance.now();
                this.frameTimings = [];
                this.frameDrops = 0;
            },
            
            checkPerformance() {
                const now = performance.now();
                const frameDuration = now - this.lastFrameTime;
                this.frameTimings.push(frameDuration);
                
                // フレーム履歴は最大50個まで保持
                if (this.frameTimings.length > 50) {
                    this.frameTimings.shift();
                }
                
                let rating = 'excellent';
                // 16.67ms(60FPS)を大幅に超える場合はガクガク判定
                if (frameDuration > 33.34) { // 30FPS以下
                    this.frameDrops++;
                    rating = 'poor';
                } else if (frameDuration > 22.22) { // 45FPS以下
                    rating = 'average';
                }
                
                this.lastFrameTime = now;
                
                // ガクガク状態をログに記録
                if (rating === 'poor') {
                    log('🔍 ガクガク検知: ' + frameDuration.toFixed(2) + 'ms (' + (1000/frameDuration).toFixed(1) + 'FPS)', {
                        frameDuration: frameDuration,
                        fps: 1000/frameDuration,
                        rating: rating,
                        frameDrops: this.frameDrops
                    });
                }
                
                return rating;
            },
            
            getSummary() {
                if (this.frameTimings.length === 0) return null;
                
                const avgFrameTime = this.frameTimings.reduce((a, b) => a + b, 0) / this.frameTimings.length;
                const maxFrameTime = Math.max(...this.frameTimings);
                const minFrameTime = Math.min(...this.frameTimings);
                const avgFPS = 1000 / avgFrameTime;
                
                // スムーズさスコア計算（60FPS基準）
                const smoothnessScore = Math.max(0, Math.min(1, avgFPS / 60));
                
                let overallRating = 'excellent';
                if (avgFPS < 30) overallRating = 'poor';
                else if (avgFPS < 45) overallRating = 'average';
                
                return {
                    frameDropCount: this.frameDrops,
                    averageFrameTime: avgFrameTime,
                    worstFrameTime: maxFrameTime,
                    bestFrameTime: minFrameTime,
                    averageFPS: avgFPS,
                    performanceRating: overallRating,
                    smoothnessScore: smoothnessScore,
                    totalFrames: this.frameTimings.length
                };
            }
        };
        
        // throttle機能（DOM操作頻度制限用）
        function throttle(func, wait) {
            let timeout;
            let lastExecTime = 0;
            return function executedFunction(...args) {
                const now = Date.now();
                
                if (now - lastExecTime > wait) {
                    func.apply(this, args);
                    lastExecTime = now;
                } else {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => {
                        func.apply(this, args);
                        lastExecTime = Date.now();
                    }, wait - (now - lastExecTime));
                }
            };
        }
        
        // 座標キャッシュシステム
        const coordinateCache = new Map();
        
        function getCachedRect(element) {
            const elementId = element.dataset.id || element.id || Math.random().toString(36).substr(2, 9);
            const cacheKey = elementId + '_' + Date.now();
            
            // 直近のキャッシュを探す（10ms以内）
            for (let [key, value] of coordinateCache.entries()) {
                if (key.startsWith(elementId) && (Date.now() - value.timestamp) < 10) {
                    return value.rect;
                }
            }
            
            const rect = element.getBoundingClientRect();
            coordinateCache.set(cacheKey, {
                rect: rect,
                timestamp: Date.now()
            });
            
            // 古いキャッシュクリーンアップ
            setTimeout(() => {
                for (let [key, value] of coordinateCache.entries()) {
                    if (Date.now() - value.timestamp > 100) {
                        coordinateCache.delete(key);
                    }
                }
            }, 100);
            
            return rect;
        }

        // アプリ初期化
        document.addEventListener('DOMContentLoaded', async () => {
            log('💰 お金管理アプリ起動');
            
            // 今日の日付を設定
            document.getElementById('date').value = new Date().toISOString().slice(0, 10);
            
            // Firebase設定取得
            try {
                const response = await fetch('/api/firebase-config');
                const result = await response.json();
                firebaseConfig = result.config;
                firebase.initializeApp(firebaseConfig);
                log('🔥 Firebase初期化完了');
                
                // 認証状態監視
                firebase.auth().onAuthStateChanged((authUser) => {
                    user = authUser;
                    updateAuthUI();
                });
                
            } catch (error) {
                log(\`❌ Firebase初期化エラー: \${error.message}\`);
            }
            
            // カンバンD&D設定
            setupKanbanDragDrop();
            
            log('✅ アプリ初期化完了');
        });

        // カンバンドラッグ&ドロップ設定（重要: テスト対象）
        function setupKanbanDragDrop() {
            log('🎯 カンバンD&D設定開始');
            
            // ドラッグ可能アイテムの設定
            const kanbanItems = document.querySelectorAll('.kanban-item');
            log('📊 発見されたカンバン項目数: ' + kanbanItems.length);
            
            kanbanItems.forEach((item, index) => {
                log('📊 項目' + index + ' ID: ' + (item.dataset.id || 'ID未設定') + ' draggable: ' + item.draggable);
                item.addEventListener('dragstart', handleDragStart);
                item.addEventListener('dragend', handleDragEnd);
            });
            
            // ドロップゾーンの設定
            document.querySelectorAll('.drop-zone').forEach(zone => {
                zone.addEventListener('dragover', handleDragOver);
                zone.addEventListener('dragenter', handleDragEnter);
                zone.addEventListener('dragleave', handleDragLeave);
                zone.addEventListener('drop', handleDrop);
            });
            
            log('✅ カンバンD&D設定完了');
        }

        function handleDragStart(e) {
            const startTime = performance.now();
            const rect = getCachedRect(e.target); // キャッシュ使用
            
            // パフォーマンス監視開始
            performanceMonitor.init();
            performanceMonitor.dragStartTime = startTime;
            
            e.dataTransfer.setData('text/plain', e.target.dataset.id);
            e.target.classList.add('dragging');
            
            // パフォーマンス計測開始
            window.dragStartTime = startTime;
            window.dragElement = e.target;
            
            // 開始位置の記録（要素の位置とマウスの位置両方）
            const startPosition = {
                element: {
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: rect.height
                },
                mouse: {
                    x: e.clientX,
                    y: e.clientY
                },
                parent: e.target.parentElement.dataset.status || 'unknown'
            };
            
            // グローバル変数に保存
            window.dragStartPosition = startPosition;
            
            log('🎯 ドラッグ開始: ' + e.target.dataset.id + ' [座標: X=' + startPosition.element.x + ' Y=' + startPosition.element.y + ' マウス: X=' + startPosition.mouse.x + ' Y=' + startPosition.mouse.y + ']', {
                itemId: e.target.dataset.id,
                startPosition: startPosition,
                startTime: startTime
            });
            
            // テスト用ログ記録
            logAction('drag_start', {
                itemId: e.target.dataset.id,
                startPosition: startPosition,
                timestamp: new Date().toISOString(),
                performanceStart: startTime
            });
        }

        function handleDragEnd(e) {
            const endTime = performance.now();
            const duration = window.dragStartTime ? endTime - window.dragStartTime : 0;
            
            e.target.classList.remove('dragging');
            
            // パフォーマンスサマリー取得
            const perfSummary = performanceMonitor.getSummary();
            
            // パフォーマンス分析
            let performanceRating = 'excellent';
            if (duration > 100) performanceRating = 'poor';
            else if (duration > 50) performanceRating = 'average';
            
            // 詳細パフォーマンスログ
            const performanceLog = {
                dragDuration: duration,
                performanceRating: performanceRating,
                ...(perfSummary || {})
            };
            
            log('🏁 ドラッグ終了: ' + e.target.dataset.id + ' [総時間: ' + duration.toFixed(2) + 'ms - ' + performanceRating + '] [平均FPS: ' + (perfSummary ? perfSummary.averageFPS.toFixed(1) : 'N/A') + ']', performanceLog);
            
            // ガクガク検知結果をログに記録
            if (perfSummary && perfSummary.performanceRating === 'poor') {
                logAction('drag_performance_poor', {
                    itemId: e.target.dataset.id,
                    performanceMetrics: perfSummary,
                    dragDuration: duration,
                    timestamp: new Date().toISOString(),
                    issue: 'カンバンガクガク状態検知'
                });
            }
            
            // 計測リセット
            window.dragStartTime = null;
            window.dragElement = null;
            coordinateCache.clear(); // キャッシュクリア
        }

        // throttle機能付きインジケーター更新（60FPS制限）
        const throttledUpdateDropIndicator = throttle(updateDropIndicator, 16);
        
        function handleDragOver(e) {
            e.preventDefault();
            
            // パフォーマンス監視
            performanceMonitor.checkPerformance();
            
            // ドロップ位置インジケーターの更新（throttle適用）
            const dropZone = e.target.closest('.drop-zone');
            if (!dropZone || !window.dragElement) return;
            
            throttledUpdateDropIndicator(dropZone, e.clientY);
        }

        function handleDragEnter(e) {
            e.preventDefault();
            e.target.classList.add('drag-over');
        }

        function handleDragLeave(e) {
            e.target.classList.remove('drag-over');
            
            // ドロップインジケーターをクリア
            const dropZone = e.target.closest('.drop-zone');
            if (dropZone) {
                clearDropIndicators(dropZone);
            }
        }
        
        // ドロップ位置インジケーター更新（安定化版）
        function updateDropIndicator(dropZone, mouseY) {
            const existingItems = Array.from(dropZone.children).filter(child => 
                child.classList && child.classList.contains('kanban-item') && child !== window.dragElement
            );
            
            let targetPosition = 'end';
            let targetElement = null;
            
            // 挿入位置を決定
            for (let i = 0; i < existingItems.length; i++) {
                const itemRect = existingItems[i].getBoundingClientRect();
                const itemCenterY = itemRect.top + itemRect.height / 2;
                
                if (mouseY < itemCenterY) {
                    targetPosition = 'before';
                    targetElement = existingItems[i];
                    break;
                } else if (i === existingItems.length - 1) {
                    targetPosition = 'after';
                    targetElement = existingItems[i];
                }
            }
            
            // 既存のインジケーターの位置をチェック
            const currentIndicator = dropZone.querySelector('.drop-indicator');
            let needsUpdate = true;
            
            if (currentIndicator) {
                const currentPos = getCurrentIndicatorPosition(dropZone, currentIndicator);
                const newPos = { position: targetPosition, element: targetElement };
                
                // 位置が変わらない場合は更新をスキップ
                if (isSamePosition(currentPos, newPos)) {
                    needsUpdate = false;
                }
            }
            
            if (needsUpdate) {
                // 既存のインジケーターを削除
                clearDropIndicators(dropZone);
                
                // 新しいインジケーターを作成
                const indicator = document.createElement('div');
                indicator.className = 'drop-indicator';
                
                if (targetPosition === 'before' && targetElement) {
                    dropZone.insertBefore(indicator, targetElement);
                } else if (targetPosition === 'after' && targetElement) {
                    targetElement.insertAdjacentElement('afterend', indicator);
                } else {
                    dropZone.appendChild(indicator);
                }
                
                // スムーズなアニメーション
                requestAnimationFrame(() => {
                    indicator.classList.add('active');
                });
            }
        }
        
        // インジケーターの現在位置を取得
        function getCurrentIndicatorPosition(dropZone, indicator) {
            const nextSibling = indicator.nextElementSibling;
            const prevSibling = indicator.previousElementSibling;
            
            if (nextSibling && nextSibling.classList.contains('kanban-item')) {
                return { position: 'before', element: nextSibling };
            } else if (prevSibling && prevSibling.classList.contains('kanban-item')) {
                return { position: 'after', element: prevSibling };
            } else {
                return { position: 'end', element: null };
            }
        }
        
        // 位置比較
        function isSamePosition(pos1, pos2) {
            return pos1.position === pos2.position && pos1.element === pos2.element;
        }
        
        // ドロップインジケーターをクリア
        function clearDropIndicators(dropZone) {
            const indicators = dropZone.querySelectorAll('.drop-indicator');
            indicators.forEach(indicator => indicator.remove());
        }

        function handleDrop(e) {
            e.preventDefault();
            const itemId = e.dataTransfer.getData('text/plain');
            const dropZone = e.target.closest('.drop-zone');
            const newStatus = dropZone.dataset.status;
            
            dropZone.classList.remove('drag-over');
            
            // インジケーターをクリア
            clearDropIndicators(dropZone);
            
            // アイテム移動
            const item = document.querySelector(\`[data-id="\${itemId}"]\`);
            if (item) {
                // 移動前の位置情報を取得（キャッシュ使用）
                const beforeRect = getCachedRect(item);
                const beforeParent = item.parentElement.dataset.status || 'unknown';
                
                // ドロップ位置に基づいて適切な場所に挿入
                const dropY = e.clientY;
                const existingItems = Array.from(dropZone.children).filter(child => 
                    child.classList && child.classList.contains('kanban-item') && child !== item
                );
                
                let insertPosition = null;
                for (let i = 0; i < existingItems.length; i++) {
                    const itemRect = existingItems[i].getBoundingClientRect();
                    const itemCenterY = itemRect.top + itemRect.height / 2;
                    
                    if (dropY < itemCenterY) {
                        insertPosition = existingItems[i];
                        break;
                    }
                }
                
                // 適切な位置に挿入
                if (insertPosition) {
                    dropZone.insertBefore(item, insertPosition);
                } else {
                    dropZone.appendChild(item); // 最後尾に追加
                }
                
                // 移動後の位置情報を取得
                const afterRect = item.getBoundingClientRect();
                const afterParent = item.parentElement.dataset.status || 'unknown';
                
                // 移動距離計算
                const movementDistance = Math.sqrt(
                    Math.pow(afterRect.left - beforeRect.left, 2) + 
                    Math.pow(afterRect.top - beforeRect.top, 2)
                );
                
                // 完全な座標ログ作成
                const coordinateLog = {
                    itemId: itemId,
                    movement: {
                        before: {
                            element: { x: beforeRect.left, y: beforeRect.top, width: beforeRect.width, height: beforeRect.height },
                            parent: beforeParent,
                            mouse: window.dragStartPosition ? window.dragStartPosition.mouse : { x: 0, y: 0 }
                        },
                        after: {
                            element: { x: afterRect.left, y: afterRect.top, width: afterRect.width, height: afterRect.height },
                            parent: afterParent,
                            mouse: { x: e.clientX, y: e.clientY }
                        },
                        distance: movementDistance,
                        actuallyMoved: movementDistance > 10, // 10px以上の移動を実移動と判定
                        parentChanged: beforeParent !== afterParent
                    },
                    timestamp: new Date().toISOString()
                };
                
                log(\`🎯 ドロップ完了: \${itemId} → \${newStatus} [ドロップY: \${dropY} 移動前: X=\${beforeRect.left.toFixed(1)} Y=\${beforeRect.top.toFixed(1)} → 移動後: X=\${afterRect.left.toFixed(1)} Y=\${afterRect.top.toFixed(1)} 距離: \${movementDistance.toFixed(2)}px 挿入位置: \${insertPosition ? 'before-' + insertPosition.dataset.id : 'end'}]\`, coordinateLog);
                
                // サーバーに移動を通知（座標情報付き）
                fetch('/api/money/move', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: itemId,
                        fromStatus: beforeParent,
                        toStatus: newStatus,
                        coordinates: coordinateLog
                    })
                });
                
                // テスト用ログ記録（座標証跡付き）
                logAction('drop_complete', {
                    itemId: itemId,
                    newStatus: newStatus,
                    coordinateEvidence: coordinateLog,
                    movementVerified: coordinateLog.movement.actuallyMoved,
                    success: true
                });
                
                log(\`✅ カンバン移動完了: \${itemId} → \${newStatus} [検証: \${coordinateLog.movement.actuallyMoved ? '実移動確認' : '移動なし'} ΔX=\${(afterRect.left - beforeRect.left).toFixed(1)} ΔY=\${(afterRect.top - beforeRect.top).toFixed(1)}]\`);
                
                // 開始位置をリセット
                window.dragStartPosition = null;
            }
        }

        // 認証関連
        function toggleAuth() {
            if (user) {
                firebase.auth().signOut();
            } else {
                const provider = new firebase.auth.GoogleAuthProvider();
                firebase.auth().signInWithPopup(provider);
            }
        }

        function updateAuthUI() {
            const authBtn = document.getElementById('authBtn');
            const userInfo = document.getElementById('userInfo');
            
            if (user) {
                authBtn.textContent = 'ログアウト';
                userInfo.innerHTML = \`<small>ログイン中: \${user.displayName}</small>\`;
                log(\`👤 ユーザーログイン: \${user.displayName}\`);
            } else {
                authBtn.textContent = 'Googleでログイン';
                userInfo.innerHTML = '';
                log('👤 ユーザーログアウト');
            }
        }

        // データ追加
        async function addMoney(event) {
            event.preventDefault();
            
            const formData = {
                amount: document.getElementById('amount').value,
                category: document.getElementById('category').value,
                description: document.getElementById('description').value,
                date: document.getElementById('date').value
            };
            
            log('💰 お金データ追加', formData);
            
            try {
                const response = await fetch('/api/money/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    log('✅ お金データ追加成功', result.data);
                    
                    // カンバンボードに新しい項目を追加
                    addToKanban(formData);
                    
                    document.getElementById('moneyForm').reset();
                    document.getElementById('date').value = new Date().toISOString().slice(0, 10);
                } else {
                    log('❌ お金データ追加失敗', result);
                }
                
            } catch (error) {
                log(\`❌ お金データ追加例外: \${error.message}\`);
            }
        }

        // CSV出力
        async function exportCSV() {
            log('📊 CSV出力開始');
            
            const sampleData = [
                { date: '2025-07-24', category: '食費', amount: -1500, description: '昼食代' },
                { date: '2025-07-24', category: '交通費', amount: -800, description: '電車代' }
            ];
            
            try {
                const response = await fetch('/api/export-csv', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        data: sampleData,
                        filename: 'money-data-export.csv'
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    log(\`✅ CSV出力完了: \${result.fileName}\`);
                } else {
                    log('❌ CSV出力失敗', result);
                }
                
            } catch (error) {
                log(\`❌ CSV出力例外: \${error.message}\`);
            }
        }

        // ログコピー機能
        async function copyLogs() {
            log('📋 ログコピー開始');
            
            try {
                const debugLogs = document.getElementById('debugLogs');
                const logText = debugLogs.textContent;
                
                // クリップボードにコピー
                await navigator.clipboard.writeText(logText);
                
                log('✅ ログコピー完了: クリップボードにコピーしました');
                
                // 一時的にボタンテキストを変更してフィードバック
                const copyButton = event.target;
                const originalText = copyButton.textContent;
                copyButton.textContent = '✅ コピー完了!';
                copyButton.style.background = '#28a745';
                
                setTimeout(() => {
                    copyButton.textContent = originalText;
                    copyButton.style.background = '#2196F3';
                }, 2000);
                
            } catch (error) {
                log('❌ ログコピー失敗: ' + error.message);
                
                // フォールバック: テキスト選択
                const debugLogs = document.getElementById('debugLogs');
                const range = document.createRange();
                range.selectNodeContents(debugLogs);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
                
                log('💡 ログが選択されました。Ctrl+Cでコピーしてください');
            }
        }

        // ログダウンロード
        async function downloadLogs() {
            log('📥 ログダウンロード開始');
            
            try {
                const response = await fetch('/api/generate-test-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userInfo: user ? {
                            uid: user.uid,
                            email: user.email,
                            displayName: user.displayName
                        } : null
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    log(\`✅ ログダウンロード完了: \${result.fileName}\`);
                } else {
                    log('❌ ログダウンロード失敗', result);
                }
                
            } catch (error) {
                log(\`❌ ログダウンロード例外: \${error.message}\`);
            }
        }

        // カンバンテスト実行
        async function testKanban() {
            log('🧪 カンバンテスト開始');
            
            // テストシミュレーション
            const testItem = document.getElementById('task-item-1');
            if (testItem) {
                // ドラッグシミュレーション
                const dragEvent = new Event('dragstart');
                testItem.dispatchEvent(dragEvent);
                
                // ドロップシミュレーション
                setTimeout(() => {
                    const completedZone = document.getElementById('completed-zone');
                    completedZone.appendChild(testItem);
                    
                    log('✅ カンバンテスト完了: task-item-1を完了列に移動');
                    
                    // テスト結果記録
                    logAction('kanban_test_complete', {
                        testType: 'manual_simulation',
                        itemMoved: 'task-item-1',
                        success: true,
                        timestamp: new Date().toISOString()
                    });
                }, 1000);
            }
        }

        function clearLogs() {
            logs = [];
            document.getElementById('debugLogs').textContent = 'ログがクリアされました\\n';
            log('🗑️ ログクリア完了');
        }

        // カンバンボードに新しい項目を追加
        function addToKanban(formData) {
            const pendingZone = document.getElementById('pending-zone');
            const itemId = 'item-' + Date.now();
            
            const kanbanItem = document.createElement('div');
            kanbanItem.className = 'kanban-item newly-added';
            kanbanItem.draggable = true;
            kanbanItem.dataset.id = itemId;
            
            const amountClass = formData.amount >= 0 ? 'amount-positive' : 'amount-negative';
            const amountText = formData.amount >= 0 ? '+' + formData.amount + '円' : formData.amount + '円';
            
            kanbanItem.innerHTML = 
                '<div class="' + amountClass + '">' + amountText + '</div>' +
                '<div>' + formData.category + ' - ' + formData.description + '</div>' +
                '<small>' + formData.date + '</small>';
            
            // ドラッグイベント設定
            kanbanItem.addEventListener('dragstart', handleDragStart);
            kanbanItem.addEventListener('dragend', handleDragEnd);
            
            pendingZone.appendChild(kanbanItem);
            
            // アニメーション終了後にborderを削除
            setTimeout(() => {
                kanbanItem.classList.remove('newly-added');
            }, 500);
            
            log('📋 カンバンに追加: ' + itemId + ' (' + formData.category + ')');
        }

        // ログ記録
        function log(message, data = null) {
            const timestamp = new Date().toLocaleTimeString('ja-JP');
            const logEntry = \`[\${timestamp}] \${message}\`;
            
            logs.push({ timestamp, message, data });
            
            const debugLogs = document.getElementById('debugLogs');
            debugLogs.textContent += logEntry + '\\n';
            debugLogs.scrollTop = debugLogs.scrollHeight;
            
            console.log(logEntry, data || '');
        }

        // アクションログ記録（テスト用）
        async function logAction(action, data) {
            try {
                await fetch('/api/log-action', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: action,
                        data: data,
                        timestamp: Date.now()
                    })
                });
            } catch (error) {
                console.error('ログ記録エラー:', error);
            }
        }
    </script>
</body>
</html>`;
    }
}

// サーバー起動
if (require.main === module) {
    const moneyApp = new MoneyApp();
    
    moneyApp.start(() => {
        console.log('💰 お金管理アプリが起動しました');
        console.log('📱 アクセス: http://localhost:3001');
        console.log('🧪 テスト実行: node testSuite.js money-tracker kanban-drag-drop');
    });
}

module.exports = { MoneyApp };