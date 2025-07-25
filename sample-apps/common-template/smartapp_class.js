        class SmartTemplateApp {
            constructor() {
                this.currentUser = null;
                this.currentApp = 'welcome';
                this.config = null;
                this.loadedApps = [];
                this.logs = [];
                
                this.setupEventListeners();
                this.initialize();
                
                this.log('🚀 統合アプリ管理システム v1.0 初期化完了');
            }

            async initialize() {
                try {
                    // Firebase設定読み込み
                    await this.loadFirebaseConfig();
                    
                    // システム情報読み込み
                    await this.loadSystemInfo();
                    
                    // 設定読み込み
                    await this.loadAppConfig();
                    
                    // 認証設定
                    this.setupAuth();
                    
                    this.updateConnectionStatus('success', 'オンライン');
                    this.log('✅ 初期化完了');
                    
                } catch (error) {
                    this.updateConnectionStatus('error', '初期化エラー');
                    this.log(`❌ 初期化エラー | ${error.message}`);
                }
            }

            // Firebase設定読み込み
            async loadFirebaseConfig() {
                try {
                    const response = await fetch('/api/firebase-config');
                    const firebaseConfig = await response.json();
                    
                    firebase.initializeApp(firebaseConfig);
                    this.auth = firebase.auth();
                    this.database = firebase.database();
                    
                    this.log('🔥 Firebase初期化完了');
                } catch (error) {
                    this.log(`❌ Firebase初期化エラー | ${error.message}`);
                }
            }

            // システム情報読み込み
            async loadSystemInfo() {
                try {
                    const response = await fetch('/api/info');
                    const info = await response.json();
                    
                    document.getElementById('appName').textContent = info.appName;
                    document.getElementById('version').textContent = `v${info.version}`;
                    document.getElementById('uptime').textContent = `${Math.floor(info.uptime / 60)}分`;
                    
                    if (info.moduleLoader) {
                        document.getElementById('enabledApps').textContent = 
                            `${info.moduleLoader.loadedAppsCount}個`;
                    }
                    
                    this.log('📊 システム情報読み込み完了');
                } catch (error) {
                    this.log(`❌ システム情報読み込みエラー | ${error.message}`);
                }
            }

            // アプリ設定読み込み
            async loadAppConfig() {
                try {
                    const response = await fetch('/api/config');
                    const data = await response.json();
                    
                    this.config = data.config;
                    this.loadedApps = data.loadedApps || [];
                    
                    this.setupAppTabs();
                    this.log(`📋 設定読み込み完了 | ${this.loadedApps.length}個のアプリ`);
                } catch (error) {
                    this.log(`❌ 設定読み込みエラー | ${error.message}`);
                }
            }

            // アプリタブ設定
            setupAppTabs() {
                const tabsContainer = document.getElementById('appTabs');
                
                // 既存の動的タブを削除
                const dynamicTabs = tabsContainer.querySelectorAll('.app-tab[data-dynamic="true"]');
                dynamicTabs.forEach(tab => tab.remove());
                
                // アプリタブを追加
                this.loadedApps.forEach(app => {
                    const tab = document.createElement('button');
                    tab.className = 'app-tab';
                    tab.setAttribute('data-app', app.name);
                    tab.setAttribute('data-dynamic', 'true');
                    tab.innerHTML = `
                        <span class="icon">${app.icon}</span>
                        <span>${app.displayName}</span>
                    `;
                    tabsContainer.appendChild(tab);
                    
                    // タブクリックイベント
                    tab.addEventListener('click', () => this.switchApp(app.name));
                    
                    // アプリコンテンツ領域を作成
                    this.createAppContent(app);
                });
            }

            // アプリコンテンツ作成
            createAppContent(app) {
                const mainContent = document.querySelector('.main-content');
                
                const contentDiv = document.createElement('div');
                contentDiv.className = 'app-content';
                contentDiv.id = `${app.name}-content`;
                contentDiv.innerHTML = `
                    <div style="padding: 20px; text-align: center;">
                        <h2>${app.icon} ${app.displayName}</h2>
                        <p>${app.description || 'アプリが正常に読み込まれました'}</p>
                        <p><strong>バージョン:</strong> ${app.version}</p>
                        <p><strong>ステータス:</strong> ${app.status}</p>
                        
                        <div style="margin-top: 30px;">
                            <button class="btn" onclick="app.testAppAPI('${app.name}')">
                                🔗 ${app.displayName} API テスト
                            </button>
                        </div>
                        
                        <div style="margin-top: 20px; text-align: left;">
                            <h4>利用可能なAPI:</h4>
                            <ul style="margin-top: 10px;">
                                <li>GET /api/${app.name}/* - データ取得</li>
                                <li>POST /api/${app.name}/* - データ追加</li>
                                <li>DELETE /api/${app.name}/* - データ削除</li>
                                <li>POST /api/${app.name}/export/csv - CSV出力</li>
                            </ul>
                        </div>
                    </div>
                `;
                
                mainContent.appendChild(contentDiv);
            }

            // アプリ切り替え
            switchApp(appName) {
                // タブの切り替え
                document.querySelectorAll('.app-tab').forEach(tab => {
                    tab.classList.remove('active');
                });
                document.querySelector(`[data-app="${appName}"]`).classList.add('active');
                
                // コンテンツの切り替え
                document.querySelectorAll('.app-content').forEach(content => {
                    content.style.display = 'none';
                });
                
                const targetContent = document.getElementById(`${appName}-content`);
                if (targetContent) {
                    targetContent.style.display = 'block';
                    
                    // アプリ固有の初期化
                    if (appName === 'money') {
                        // 今日の日付をデフォルトに設定
                        const today = new Date().toISOString().split('T')[0];
                        const dateInput = document.getElementById('money-date');
                        if (dateInput) {
                            dateInput.value = today;
                        }
                        
                        // 取引履歴を読み込み
                        this.loadMoneyTransactions();
                    } else if (appName === 'time') {
                        // 今日の日付をデフォルトに設定
                        const today = new Date().toISOString().split('T')[0];
                        const dateInput = document.getElementById('time-date');
                        if (dateInput) {
                            dateInput.value = today;
                        }
                        
                        // 時間記録を読み込み
                        this.loadTimeRecords();
                    } else if (appName === 'weight') {
                        // 今日の日付をデフォルトに設定
                        const today = new Date().toISOString().split('T')[0];
                        const dateInput = document.getElementById('weight-date');
                        if (dateInput) {
                            dateInput.value = today;
                        }
                        
                        // 体重記録を読み込み
                        this.loadWeightRecords();
                    } else if (appName === 'memo') {
                        // メモ一覧を読み込み
                        this.loadMemos();
                    } else if (appName === 'calc') {
                        // 計算履歴を読み込み
                        this.loadCalcHistory();
                    }
                    
                    // 設定画面の場合は設定UIを初期化
                    if (appName === 'settings') {
                        this.loadConfigUI();
                    }
                }
                
                this.currentApp = appName;
                this.log(`🔄 アプリ切り替え | ${appName}`);
            }

            // 認証設定
            setupAuth() {
                if (!this.auth) return;
                
                this.auth.onAuthStateChanged((user) => {
                    this.currentUser = user;
                    this.updateAuthUI();
                    
                    if (user) {
                        this.log(`👤 ログイン成功 | ${user.email}`);
                    } else {
                        this.log('👤 ログアウト');
                    }
                });
            }

            // 認証UI更新
            updateAuthUI() {
                const authBtn = document.getElementById('authBtn');
                
                if (this.currentUser) {
                    authBtn.textContent = 'ログアウト';
                    authBtn.onclick = () => this.signOut();
                } else {
                    authBtn.textContent = 'Googleでログイン';
                    authBtn.onclick = () => this.signIn();
                }
            }

            // ログイン
            async signIn() {
                try {
                    const provider = new firebase.auth.GoogleAuthProvider();
                    await this.auth.signInWithPopup(provider);
                } catch (error) {
                    this.log(`❌ ログインエラー | ${error.message}`);
                }
            }

            // ログアウト
            async signOut() {
                try {
                    await this.auth.signOut();
                } catch (error) {
                    this.log(`❌ ログアウトエラー | ${error.message}`);
                }
            }

            // 接続ステータス更新
            updateConnectionStatus(type, message) {
                const status = document.getElementById('connectionStatus');
                status.className = `status status-${type}`;
                status.innerHTML = `<span>${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '❌'}</span><span>${message}</span>`;
            }

            // イベントリスナー設定
            setupEventListeners() {
                // タブ切り替え
                document.addEventListener('click', (e) => {
                    if (e.target.closest('.app-tab')) {
                        const tab = e.target.closest('.app-tab');
                        const appName = tab.getAttribute('data-app');
                        this.switchApp(appName);
                    }
                });
            }

            // API テスト
            async testAPI() {
                try {
                    this.log('🔗 API接続テスト開始');
                    
                    const response = await fetch('/api/health');
                    const data = await response.json();
                    
                    if (data.status === 'OK') {
                        this.log('✅ API接続テスト成功');
                        this.updateConnectionStatus('success', 'API正常');
                    } else {
                        this.log('❌ API接続テスト失敗');
                        this.updateConnectionStatus('error', 'API異常');
                    }
                } catch (error) {
                    this.log(`❌ API接続テストエラー | ${error.message}`);
                    this.updateConnectionStatus('error', 'API接続エラー');
                }
            }

            // アプリ個別API テスト
            async testAppAPI(appName) {
                try {
                    this.log(`🔗 ${appName} API テスト開始`);
                    
                    // アプリ固有のテストAPIを呼び出し
                    const response = await fetch(`/api/${appName}/sample-data`, {
                        method: 'POST'
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        this.log(`✅ ${appName} API テスト成功`);
                    } else {
                        this.log(`❌ ${appName} API テスト失敗`);
                    }
                } catch (error) {
                    this.log(`❌ ${appName} API テストエラー | ${error.message}`);
                }
            }

            // サンプルデータ生成
            async generateSampleData() {
                try {
                    this.log('🎯 サンプルデータ生成開始');
                    
                    for (const app of this.loadedApps) {
                        await this.testAppAPI(app.name);
                    }
                    
                    this.log('✅ 全アプリのサンプルデータ生成完了');
                } catch (error) {
                    this.log(`❌ サンプルデータ生成エラー | ${error.message}`);
                }
            }

            // 設定関連機能
            async loadConfig() {
                try {
                    const response = await fetch('/api/config');
                    const data = await response.json();
                    
                    document.getElementById('configEditor').value = 
                        JSON.stringify(data.config, null, 2);
                    
                    this.log('📥 設定読み込み完了');
                } catch (error) {
                    this.log(`❌ 設定読み込みエラー | ${error.message}`);
                }
            }

            async saveConfig() {
                try {
                    const configText = document.getElementById('configEditor').value;
                    const config = JSON.parse(configText);
                    
                    const response = await fetch('/api/config', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(config)
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        this.log('💾 設定保存完了');
                        alert('設定を保存しました。変更を反映するにはサーバーを再起動してください。');
                    } else {
                        throw new Error(data.error || '設定保存に失敗しました');
                    }
                } catch (error) {
                    this.log(`❌ 設定保存エラー | ${error.message}`);
                    alert(`設定保存エラー: ${error.message}`);
                }
            }

            async resetConfig() {
                if (confirm('設定をリセットしますか？')) {
                    await this.loadConfig();
                    this.log('🔄 設定リセット完了');
                }
            }

            // お金管理機能
            async addMoneyTransaction() {
                const type = document.getElementById('money-type').value;
                const amount = parseFloat(document.getElementById('money-amount').value);
                const category = document.getElementById('money-category').value;
                const description = document.getElementById('money-description').value;
                const date = document.getElementById('money-date').value || new Date().toISOString().split('T')[0];

                if (!amount || amount <= 0) {
                    alert('正しい金額を入力してください');
                    return;
                }

                const transaction = {
                    id: Date.now().toString(),
                    type,
                    amount,
                    category,
                    description,
                    date,
                    timestamp: new Date().toISOString(),
                    userId: this.currentUser ? this.currentUser.uid : 'anonymous'
                };

                try {
                    // Firebase Realtime Databaseに保存
                    if (this.database && this.currentUser) {
                        await this.database.ref(`transactions/${this.currentUser.uid}/${transaction.id}`).set(transaction);
                        this.log(`💰 取引をFirebaseに保存 | ${type} ${amount}円`);
                    }

                    // ローカルにも保存
                    this.saveTransactionLocal(transaction);
                    
                    // フォームをクリア
                    document.getElementById('money-amount').value = '';
                    document.getElementById('money-description').value = '';
                    
                    // 取引一覧を更新
                    this.loadMoneyTransactions();
                    
                    this.log(`💰 取引記録完了 | ${type} ${amount}円 (${category})`);
                } catch (error) {
                    this.log(`❌ 取引保存エラー | ${error.message}`);
                }
            }

            saveTransactionLocal(transaction) {
                let transactions = JSON.parse(localStorage.getItem('moneyTransactions') || '[]');
                transactions.push(transaction);
                localStorage.setItem('moneyTransactions', JSON.stringify(transactions));
            }

            async loadMoneyTransactions() {
                try {
                    let transactions = [];
                    
                    // Firebase から取得
                    if (this.database && this.currentUser) {
                        const snapshot = await this.database.ref(`transactions/${this.currentUser.uid}`).once('value');
                        if (snapshot.exists()) {
                            transactions = Object.values(snapshot.val());
                        }
                    }
                    
                    // ローカルストレージからも取得（バックアップ）
                    const localTransactions = JSON.parse(localStorage.getItem('moneyTransactions') || '[]');
                    
                    // マージ（重複除去）
                    const allTransactions = [...transactions, ...localTransactions];
                    const uniqueTransactions = allTransactions.filter((trans, index, self) =>
                        index === self.findIndex(t => t.id === trans.id)
                    );
                    
                    // 日付順でソート
                    uniqueTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
                    
                    this.displayTransactions(uniqueTransactions);
                } catch (error) {
                    this.log(`❌ 取引読み込みエラー | ${error.message}`);
                }
            }

            displayTransactions(transactions) {
                const container = document.getElementById('money-transactions');
                
                if (transactions.length === 0) {
                    container.innerHTML = '<p>取引履歴がありません</p>';
                    return;
                }
                
                let html = '';
                let totalIncome = 0;
                let totalExpense = 0;
                
                transactions.forEach(trans => {
                    const isIncome = trans.type === 'income';
                    const amount = parseFloat(trans.amount);
                    
                    if (isIncome) {
                        totalIncome += amount;
                    } else {
                        totalExpense += amount;
                    }
                    
                    html += `
                        <div class="transaction-item ${isIncome ? 'transaction-income' : 'transaction-expense'}">
                            <div>
                                <strong>${trans.date}</strong> | ${trans.category}
                                ${trans.description ? ` - ${trans.description}` : ''}
                            </div>
                            <div>
                                <span style="color: ${isIncome ? 'green' : 'red'}">
                                    ${isIncome ? '+' : '-'}${amount.toLocaleString()}円
                                </span>
                            </div>
                        </div>
                    `;
                });
                
                const balance = totalIncome - totalExpense;
                html = `
                    <div style="background: #e9ecef; padding: 10px; margin-bottom: 10px; border-radius: 4px;">
                        <strong>残高: ${balance.toLocaleString()}円</strong> 
                        (収入: ${totalIncome.toLocaleString()}円, 支出: ${totalExpense.toLocaleString()}円)
                    </div>
                ` + html;
                
                container.innerHTML = html;
            }

            async exportMoneyCSV() {
                try {
                    const response = await fetch('/api/money/export/csv', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            startDate: null,
                            endDate: null,
                            type: null
                        })
                    });
                    
                    if (response.ok) {
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `money_transactions_${new Date().toISOString().split('T')[0]}.csv`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                        
                        this.log('📥 CSV出力完了');
                    }
                } catch (error) {
                    this.log(`❌ CSV出力エラー | ${error.message}`);
                }
            }

            // ログクリップボードコピー機能
            async copyLogsToClipboard() {
                try {
                    const logContainer = document.getElementById('debugLogs');
                    const logText = logContainer.textContent || logContainer.innerText;
                    
                    // ログが空の場合
                    if (!logText || logText === 'システム初期化中...') {
                        this.log('❌ コピー可能なログがありません');
                        alert('コピー可能なログがありません');
                        return;
                    }
                    
                    // クリップボードAPI対応チェック
                    if (navigator.clipboard && window.isSecureContext) {
                        await navigator.clipboard.writeText(logText);
                        this.log('📋 ログをクリップボードにコピー完了');
                        
                        // 成功フィードバック
                        const button = document.querySelector('[onclick="copyLogsToClipboard()"]');
                        const originalText = button.textContent;
                        button.textContent = '✅ コピー完了';
                        button.style.background = '#4CAF50';
                        
                        setTimeout(() => {
                            button.textContent = originalText;
                            button.style.background = '';
                        }, 2000);
                        
                    } else {
                        // 古いブラウザ用のフォールバック
                        const textArea = document.createElement('textarea');
                        textArea.value = logText;
                        textArea.style.position = 'fixed';
                        textArea.style.opacity = '0';
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                        
                        this.log('📋 ログをクリップボードにコピー完了（フォールバック）');
                        alert('ログをクリップボードにコピーしました');
                    }
                    
                } catch (error) {
                    this.log(`❌ クリップボードコピーエラー | ${error.message}`);
                    alert('クリップボードへのコピーに失敗しました');
                }
            }

            // 時間管理機能
            timer = {
                interval: null,
                seconds: 0,
                isRunning: false,
                taskName: ''
            };

            async addTimeRecord() {
                this.log('⏰ 時間記録ボタンが押されました');
                
                const task = document.getElementById('time-task').value;
                const category = document.getElementById('time-category').value;
                const hours = parseInt(document.getElementById('time-hours').value) || 0;
                const minutes = parseInt(document.getElementById('time-minutes').value) || 0;
                const date = document.getElementById('time-date').value || new Date().toISOString().split('T')[0];

                if (!task) {
                    this.log('❌ タスク名が入力されていません');
                    alert('タスク名を入力してください');
                    return;
                }

                if (hours === 0 && minutes === 0) {
                    this.log('❌ 時間が入力されていません');
                    alert('時間を入力してください');
                    return;
                }

                const timeRecord = {
                    id: Date.now().toString(),
                    task,
                    category,
                    hours,
                    minutes,
                    totalMinutes: hours * 60 + minutes,
                    date,
                    timestamp: new Date().toISOString(),
                    userId: this.currentUser ? this.currentUser.uid : 'anonymous'
                };

                try {
                    const response = await fetch('/api/time/add', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(timeRecord)
                    });

                    if (response.ok) {
                        // フォームをクリア
                        document.getElementById('time-task').value = '';
                        document.getElementById('time-hours').value = '';
                        document.getElementById('time-minutes').value = '';
                        
                        this.loadTimeRecords();
                        this.log(`⏰ 時間記録完了 | ${task} ${hours}時間${minutes}分 (${category})`);
                    } else {
                        this.log('❌ 時間記録の保存に失敗しました');
                    }
                } catch (error) {
                    this.log(`❌ 時間記録エラー | ${error.message}`);
                }
            }

            async loadTimeRecords() {
                this.log('⏰ 時間記録を読み込み中...');
                
                try {
                    const response = await fetch('/api/time/data');
                    const result = await response.json();
                    
                    const container = document.getElementById('time-records');
                    
                    if (result.data && result.data.length === 0) {
                        container.innerHTML = '<p>時間記録がありません</p>';
                        return;
                    }
                    
                    let html = '';
                    let totalMinutes = 0;
                    
                    if (result.data) {
                        result.data.forEach(record => {
                            totalMinutes += record.totalMinutes || 0;
                            
                            html += `
                                <div class="record-item record-${record.category.toLowerCase()}">
                                    <div>
                                        <strong>${record.date}</strong> | ${record.task}
                                        <br><small>${record.category}</small>
                                    </div>
                                    <div>
                                        <span>${record.hours || 0}時間${record.minutes || 0}分</span>
                                    </div>
                                </div>
                            `;
                        });
                    }
                    
                    const totalHours = Math.floor(totalMinutes / 60);
                    const remainingMinutes = totalMinutes % 60;
                    
                    html = `
                        <div style="background: #e9ecef; padding: 10px; margin-bottom: 10px; border-radius: 4px;">
                            <strong>合計時間: ${totalHours}時間${remainingMinutes}分</strong>
                        </div>
                    ` + html;
                    
                    container.innerHTML = html || '<p>時間記録がありません</p>';
                    this.log('⏰ 時間記録の読み込み完了');
                } catch (error) {
                    this.log(`❌ 時間記録読み込みエラー | ${error.message}`);
                    document.getElementById('time-records').innerHTML = '<p>時間記録の読み込みに失敗しました</p>';
                }
            }

            startTimer() {
                this.log('⏱️ タイマー開始ボタンが押されました');
                
                const task = document.getElementById('time-task').value;
                if (!task) {
                    this.log('❌ タイマー開始: タスク名が必要です');
                    alert('タスク名を入力してからタイマーを開始してください');
                    return;
                }

                this.timer.taskName = task;
                this.timer.seconds = 0;
                this.timer.isRunning = true;
                
                document.getElementById('timer-section').style.display = 'block';
                document.getElementById('timer-task-name').textContent = `実行中: ${task}`;
                
                this.timer.interval = setInterval(() => {
                    this.timer.seconds++;
                    this.updateTimerDisplay();
                }, 1000);
                
                this.log(`⏱️ タイマー開始 | タスク: ${task}`);
            }

            pauseTimer() {
                this.log('⏸️ タイマー一時停止');
                
                if (this.timer.interval) {
                    clearInterval(this.timer.interval);
                    this.timer.interval = null;
                    this.timer.isRunning = false;
                }
            }

            stopTimer() {
                this.log('⏹️ タイマー停止');
                
                if (this.timer.interval) {
                    clearInterval(this.timer.interval);
                    this.timer.interval = null;
                }
                
                const hours = Math.floor(this.timer.seconds / 3600);
                const minutes = Math.floor((this.timer.seconds % 3600) / 60);
                
                // 自動で時間を入力フォームに設定
                document.getElementById('time-hours').value = hours;
                document.getElementById('time-minutes').value = minutes;
                
                document.getElementById('timer-section').style.display = 'none';
                this.timer.seconds = 0;
                this.timer.isRunning = false;
                
                this.log(`⏹️ タイマー停止 | 経過時間: ${hours}時間${minutes}分`);
            }

            updateTimerDisplay() {
                const hours = Math.floor(this.timer.seconds / 3600);
                const minutes = Math.floor((this.timer.seconds % 3600) / 60);
                const seconds = this.timer.seconds % 60;
                
                const display = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                document.getElementById('timer-display').textContent = display;
            }

            async exportTimeCSV() {
                this.log('📥 時間管理CSV出力ボタンが押されました');
                
                try {
                    const response = await fetch('/api/time/export/csv', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({})
                    });
                    
                    if (response.ok) {
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `time_records_${new Date().toISOString().split('T')[0]}.csv`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                        
                        this.log('📥 時間管理CSV出力完了');
                    } else {
                        this.log('❌ 時間管理CSV出力に失敗しました');
                    }
                } catch (error) {
                    this.log(`❌ 時間管理CSV出力エラー | ${error.message}`);
                }
            }

            // 体重管理機能
            async addWeightRecord() {
                this.log('⚖️ 体重記録ボタンが押されました');
                
                const weight = parseFloat(document.getElementById('weight-value').value);
                const height = parseFloat(document.getElementById('weight-height').value);
                const date = document.getElementById('weight-date').value || new Date().toISOString().split('T')[0];
                const memo = document.getElementById('weight-memo').value;

                if (!weight) {
                    this.log('❌ 体重が入力されていません');
                    alert('体重を入力してください');
                    return;
                }

                const weightRecord = {
                    id: Date.now().toString(),
                    weight,
                    height,
                    date,
                    memo,
                    timestamp: new Date().toISOString(),
                    userId: this.currentUser ? this.currentUser.uid : 'anonymous'
                };

                // BMI計算
                if (height) {
                    weightRecord.bmi = (weight / Math.pow(height / 100, 2)).toFixed(1);
                }

                try {
                    const response = await fetch('/api/weight/add', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(weightRecord)
                    });

                    if (response.ok) {
                        // フォームをクリア
                        document.getElementById('weight-value').value = '';
                        document.getElementById('weight-memo').value = '';
                        
                        this.loadWeightRecords();
                        this.log(`⚖️ 体重記録完了 | ${weight}kg ${height ? `BMI:${weightRecord.bmi}` : ''}`);
                    } else {
                        this.log('❌ 体重記録の保存に失敗しました');
                    }
                } catch (error) {
                    this.log(`❌ 体重記録エラー | ${error.message}`);
                }
            }

            async loadWeightRecords() {
                this.log('⚖️ 体重記録を読み込み中...');
                
                try {
                    const response = await fetch('/api/weight/data');
                    const result = await response.json();
                    
                    const container = document.getElementById('weight-records');
                    
                    if (result.data && result.data.length === 0) {
                        container.innerHTML = '<p>体重記録がありません</p>';
                        return;
                    }
                    
                    let html = '';
                    
                    if (result.data) {
                        result.data.forEach(record => {
                            html += `
                                <div class="record-item">
                                    <div>
                                        <strong>${record.date}</strong> | ${record.weight}kg
                                        ${record.bmi ? ` | BMI: ${record.bmi}` : ''}
                                        ${record.memo ? `<br><small>${record.memo}</small>` : ''}
                                    </div>
                                </div>
                            `;
                        });
                    }
                    
                    container.innerHTML = html || '<p>体重記録がありません</p>';
                    this.log('⚖️ 体重記録の読み込み完了');
                } catch (error) {
                    this.log(`❌ 体重記録読み込みエラー | ${error.message}`);
                    document.getElementById('weight-records').innerHTML = '<p>体重記録の読み込みに失敗しました</p>';
                }
            }

            calculateBMI() {
                this.log('📊 BMI計算ボタンが押されました');
                
                const weight = parseFloat(document.getElementById('weight-value').value);
                const height = parseFloat(document.getElementById('weight-height').value);

                if (!weight || !height) {
                    this.log('❌ BMI計算: 体重と身長が必要です');
                    alert('体重と身長を入力してください');
                    return;
                }

                const bmi = (weight / Math.pow(height / 100, 2)).toFixed(1);
                let status = '';
                let statusClass = '';

                if (bmi < 18.5) {
                    status = '低体重';
                    statusClass = 'bmi-underweight';
                } else if (bmi < 25) {
                    status = '普通体重';
                    statusClass = 'bmi-normal';
                } else if (bmi < 30) {
                    status = '肥満（1度）';
                    statusClass = 'bmi-overweight';
                } else {
                    status = '肥満（2度以上）';
                    statusClass = 'bmi-obese';
                }

                document.getElementById('bmi-result').textContent = `BMI: ${bmi}`;
                document.getElementById('bmi-status').textContent = status;
                document.getElementById('bmi-status').className = `bmi-status ${statusClass}`;
                document.getElementById('bmi-section').style.display = 'block';

                this.log(`📊 BMI計算完了 | BMI: ${bmi} (${status})`);
            }

            async exportWeightCSV() {
                this.log('📥 体重管理CSV出力ボタンが押されました');
                
                try {
                    const response = await fetch('/api/weight/export/csv', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({})
                    });
                    
                    if (response.ok) {
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `weight_records_${new Date().toISOString().split('T')[0]}.csv`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                        
                        this.log('📥 体重管理CSV出力完了');
                    } else {
                        this.log('❌ 体重管理CSV出力に失敗しました');
                    }
                } catch (error) {
                    this.log(`❌ 体重管理CSV出力エラー | ${error.message}`);
                }
            }

            // メモ管理機能
            async addMemo() {
                this.log('📝 メモ保存ボタンが押されました');
                
                const title = document.getElementById('memo-title').value;
                const content = document.getElementById('memo-textarea').value;
                const category = document.getElementById('memo-category').value;
                const tagsInput = document.getElementById('memo-tags').value;

                if (!title || !content) {
                    this.log('❌ タイトルと内容が必要です');
                    alert('タイトルと内容を入力してください');
                    return;
                }

                const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

                const memo = {
                    title,
                    content,
                    category,
                    tags,
                    userId: this.currentUser ? this.currentUser.uid : 'anonymous'
                };

                try {
                    const response = await fetch('/api/memo/add', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(memo)
                    });

                    if (response.ok) {
                        // フォームをクリア
                        document.getElementById('memo-title').value = '';
                        document.getElementById('memo-textarea').value = '';
                        document.getElementById('memo-tags').value = '';
                        
                        this.loadMemos();
                        this.log(`📝 メモ保存完了 | ${title} (${category})`);
                    } else {
                        this.log('❌ メモの保存に失敗しました');
                    }
                } catch (error) {
                    this.log(`❌ メモ保存エラー | ${error.message}`);
                }
            }

            async loadMemos() {
                this.log('📝 メモ一覧を読み込み中...');
                
                try {
                    const response = await fetch('/api/memo/data');
                    const result = await response.json();
                    
                    const container = document.getElementById('memo-records');
                    
                    if (result.data && result.data.length === 0) {
                        container.innerHTML = '<p>メモがありません</p>';
                        return;
                    }
                    
                    let html = '';
                    
                    if (result.data) {
                        result.data.forEach(memo => {
                            const tagsHtml = Array.isArray(memo.tags) ? 
                                memo.tags.map(tag => `<span class="memo-tag">${tag}</span>`).join('') : '';
                            
                            html += `
                                <div class="memo-item">
                                    <div class="memo-header">
                                        <span class="memo-title">${memo.title}</span>
                                        <span class="memo-category">${memo.category}</span>
                                    </div>
                                    <div class="memo-content">${memo.content}</div>
                                    <div class="memo-meta">
                                        <div>
                                            <span>${memo.date}</span>
                                            <div class="memo-tags">${tagsHtml}</div>
                                        </div>
                                        <button class="memo-delete-btn" onclick="deleteMemo('${memo.id}')">🗑️ 削除</button>
                                    </div>
                                </div>
                            `;
                        });
                    }
                    
                    container.innerHTML = html || '<p>メモがありません</p>';
                    this.log('📝 メモ一覧の読み込み完了');
                } catch (error) {
                    this.log(`❌ メモ読み込みエラー | ${error.message}`);
                    document.getElementById('memo-records').innerHTML = '<p>メモの読み込みに失敗しました</p>';
                }
            }

            async deleteMemo(memoId) {
                this.log(`🗑️ メモ削除ボタンが押されました | ID: ${memoId}`);
                
                if (!confirm('このメモを削除しますか？')) {
                    this.log('📝 メモ削除をキャンセルしました');
                    return;
                }

                try {
                    const response = await fetch(`/api/memo/delete/${memoId}`, {
                        method: 'DELETE'
                    });

                    if (response.ok) {
                        this.loadMemos();
                        this.log(`🗑️ メモ削除完了 | ID: ${memoId}`);
                    } else {
                        this.log('❌ メモの削除に失敗しました');
                    }
                } catch (error) {
                    this.log(`❌ メモ削除エラー | ${error.message}`);
                }
            }

            async exportMemoCSV() {
                this.log('📥 メモCSV出力ボタンが押されました');
                
                try {
                    const response = await fetch('/api/memo/export/csv', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({})
                    });
                    
                    if (response.ok) {
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `memo_data_${new Date().toISOString().split('T')[0]}.csv`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                        
                        this.log('📥 メモCSV出力完了');
                    } else {
                        this.log('❌ メモCSV出力に失敗しました');
                    }
                } catch (error) {
                    this.log(`❌ メモCSV出力エラー | ${error.message}`);
                }
            }

            // ================================================================
            // 計算機管理機能
            // ================================================================
            async calculateNumbers() {
                this.log('🧮 計算実行ボタンが押されました');
                
                const numberA = parseFloat(document.getElementById('calc-number-a').value);
                const numberB = parseFloat(document.getElementById('calc-number-b').value);
                const resultElement = document.getElementById('calc-result');

                // バリデーション
                if (isNaN(numberA) || isNaN(numberB)) {
                    this.log('❌ 有効な数値を入力してください');
                    alert('数値A と 数値B に有効な数値を入力してください');
                    resultElement.textContent = '?';
                    return;
                }

                try {
                    const response = await fetch('/api/calc/calculate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            numberA: numberA,
                            numberB: numberB,
                            operation: 'add'
                        })
                    });

                    if (response.ok) {
                        const result = await response.json();
                        resultElement.textContent = result.calculation.result;
                        
                        this.loadCalcHistory();
                        this.log(`🧮 計算完了 | ${numberA} + ${numberB} = ${result.calculation.result}`);
                    } else {
                        this.log('❌ 計算処理に失敗しました');
                        resultElement.textContent = 'エラー';
                    }
                } catch (error) {
                    this.log(`❌ 計算エラー | ${error.message}`);
                    resultElement.textContent = 'エラー';
                }
            }

            clearCalculation() {
                document.getElementById('calc-number-a').value = '';
                document.getElementById('calc-number-b').value = '';
                document.getElementById('calc-result').textContent = '?';
                this.log('🗑️ 計算フォームをクリアしました');
            }

            async loadCalcHistory() {
                this.log('📊 計算履歴を読み込み中...');
                
                try {
                    const response = await fetch('/api/calc/history');
                    const result = await response.json();
                    
                    const container = document.getElementById('calc-history-list');
                    
                    if (!result.calculations || result.calculations.length === 0) {
                        container.innerHTML = '<div class="loading">計算履歴がありません</div>';
                        return;
                    }
                    
                    let html = '';
                    
                    result.calculations.forEach(calc => {
                        const date = new Date(calc.timestamp).toLocaleString('ja-JP');
                        html += `
                            <div class="calc-history-item">
                                <div>
                                    <div class="calc-expression">${calc.numberA} + ${calc.numberB} = ${calc.result}</div>
                                    <div class="calc-timestamp">${date}</div>
                                </div>
                                <button class="calc-delete-btn" onclick="deleteCalcHistory('${calc.id}')">🗑️</button>
                            </div>
                        `;
                    });
                    
                    container.innerHTML = html;
                    this.log('📊 計算履歴の読み込み完了');
                    
                } catch (error) {
                    this.log(`❌ 計算履歴読み込みエラー | ${error.message}`);
                }
            }

            async deleteCalcHistory(calcId) {
                this.log(`🗑️ 計算履歴削除 | ID: ${calcId}`);
                
                try {
                    const response = await fetch(`/api/calc/history/${calcId}`, {
                        method: 'DELETE'
                    });

                    if (response.ok) {
                        this.loadCalcHistory();
                        this.log(`🗑️ 計算履歴削除完了 | ID: ${calcId}`);
                    } else {
                        this.log('❌ 計算履歴の削除に失敗しました');
                    }
                } catch (error) {
                    this.log(`❌ 計算履歴削除エラー | ${error.message}`);
                }
            }

            async exportCalcCSV() {
                this.log('📥 計算履歴CSV出力ボタンが押されました');
                
                try {
                    const response = await fetch('/api/calc/export/csv', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({})
                    });
                    
                    if (response.ok) {
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `calc_history_${new Date().toISOString().slice(0, 10)}.csv`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        window.URL.revokeObjectURL(url);
                        
                        this.log('📥 計算履歴CSV出力完了');
                    } else {
                        this.log('❌ 計算履歴CSV出力に失敗しました');
                    }
                } catch (error) {
                    this.log(`❌ 計算履歴CSV出力エラー | ${error.message}`);
                }
            }

            // ================================================================
            // 設定管理UI機能
            // ================================================================
            async loadConfigUI() {
                this.log('⚙️ 設定UIを読み込み中...');
                
                try {
                    const response = await fetch('/api/config');
                    const result = await response.json();
                    
                    // アプリ有効化チェックボックス
                    this.renderAppCheckboxes(result.config);
                    
                    // 機能設定チェックボックス
                    this.renderFeatureCheckboxes(result.config);
                    
                    this.log('⚙️ 設定UI読み込み完了');
                    
                } catch (error) {
                    this.log(`❌ 設定UI読み込みエラー | ${error.message}`);
                }
            }

            renderAppCheckboxes(config) {
                const container = document.getElementById('enabledAppsCheckboxes');
                const allApps = {
                    'money': { name: 'お金管理', icon: '💰' },
                    'time': { name: '時間管理', icon: '⏰' },
                    'weight': { name: '体重管理', icon: '⚖️' },
                    'memo': { name: 'メモ管理', icon: '📝' },
                    'calc': { name: '計算機', icon: '🧮' }
                };

                let html = '';
                Object.keys(allApps).forEach(appKey => {
                    const app = allApps[appKey];
                    const isEnabled = config.enabledApps && config.enabledApps.includes(appKey);
                    const checkedAttribute = isEnabled ? 'checked' : '';
                    const enabledClass = isEnabled ? 'enabled' : '';
                    
                    html += `
                        <div class="checkbox-item ${enabledClass}">
                            <input type="checkbox" id="app-${appKey}" ${checkedAttribute} onchange="toggleApp('${appKey}')">
                            <label for="app-${appKey}">
                                <span class="app-icon">${app.icon}</span>
                                ${app.name}
                            </label>
                        </div>
                    `;
                });
                
                container.innerHTML = html;
            }

            renderFeatureCheckboxes(config) {
                const container = document.getElementById('featuresCheckboxes');
                const features = {
                    'firebaseAuth': { name: 'Firebase認証', icon: '🔐' },
                    'realtimeDatabase': { name: 'リアルタイムDB', icon: '🔄' },
                    'csvExport': { name: 'CSV出力機能', icon: '📊' },
                    'jsonLogs': { name: 'JSONログ', icon: '📝' },
                    'debugMode': { name: 'デバッグモード', icon: '🐛' }
                };

                let html = '';
                Object.keys(features).forEach(featureKey => {
                    const feature = features[featureKey];
                    const isEnabled = config.features && config.features[featureKey];
                    const checkedAttribute = isEnabled ? 'checked' : '';
                    const enabledClass = isEnabled ? 'enabled' : '';
                    
                    html += `
                        <div class="checkbox-item ${enabledClass}">
                            <input type="checkbox" id="feature-${featureKey}" ${checkedAttribute} onchange="toggleFeature('${featureKey}')">
                            <label for="feature-${featureKey}">
                                <span class="app-icon">${feature.icon}</span>
                                ${feature.name}
                            </label>
                        </div>
                    `;
                });
                
                container.innerHTML = html;
            }

            async saveConfigUI() {
                this.log('💾 設定保存開始...');
                
                try {
                    // 現在の設定を取得
                    const response = await fetch('/api/config');
                    const currentConfig = await response.json();
                    
                    // アプリ設定を更新
                    const enabledApps = [];
                    const appCheckboxes = document.querySelectorAll('#enabledAppsCheckboxes input[type="checkbox"]');
                    appCheckboxes.forEach(checkbox => {
                        if (checkbox.checked) {
                            const appName = checkbox.id.replace('app-', '');
                            enabledApps.push(appName);
                        }
                    });
                    
                    // 機能設定を更新
                    const features = { ...currentConfig.config.features };
                    const featureCheckboxes = document.querySelectorAll('#featuresCheckboxes input[type="checkbox"]');
                    featureCheckboxes.forEach(checkbox => {
                        const featureName = checkbox.id.replace('feature-', '');
                        features[featureName] = checkbox.checked;
                    });
                    
                    // 設定を保存
                    const updatedConfig = {
                        ...currentConfig.config,
                        enabledApps: enabledApps,
                        features: features
                    };
                    
                    const saveResponse = await fetch('/api/config', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatedConfig)
                    });
                    
                    if (saveResponse.ok) {
                        this.log('💾 設定保存完了');
                        alert('設定を保存しました。\\n変更を適用するにはサーバーを再起動してください。');
                    } else {
                        this.log('❌ 設定保存に失敗しました');
                        alert('設定の保存に失敗しました。');
                    }
                    
                } catch (error) {
                    this.log(`❌ 設定保存エラー | ${error.message}`);
                    alert('設定の保存中にエラーが発生しました。');
                }
            }

            toggleApp(appName) {
                const checkbox = document.getElementById(`app-${appName}`);
                const container = checkbox.closest('.checkbox-item');
                
                if (checkbox.checked) {
                    container.classList.add('enabled');
                } else {
                    container.classList.remove('enabled');
                }
                
                this.log(`📱 アプリ切り替え | ${appName}: ${checkbox.checked ? 'ON' : 'OFF'}`);
            }

            toggleFeature(featureName) {
                const checkbox = document.getElementById(`feature-${featureName}`);
                const container = checkbox.closest('.checkbox-item');
                
                if (checkbox.checked) {
                    container.classList.add('enabled');
                } else {
                    container.classList.remove('enabled');
                }
                
                this.log(`⚙️ 機能切り替え | ${featureName}: ${checkbox.checked ? 'ON' : 'OFF'}`);
            }

            // ログ機能
            log(message) {
                const timestamp = new Date().toLocaleTimeString('ja-JP');
                const logEntry = `[${timestamp}] ${message}`;
                this.logs.push(logEntry);
                
                const debugLogs = document.getElementById('debugLogs');
                if (debugLogs) {
                    debugLogs.textContent = this.logs.slice(-50).join('\\n');
                    debugLogs.scrollTop = debugLogs.scrollHeight;
                }
                console.log(logEntry);
            }

            async downloadLogs() {
                try {
                    const response = await fetch('/api/generate-log', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ source: 'smart-template-ui', logs: this.logs })
                    });

                    const data = await response.json();
                    
                    if (data.success) {
                        this.log(`📄 ログファイル生成完了 | ${data.filename}`);
                    } else {
                        throw new Error(data.error || 'ログダウンロードに失敗しました');
                    }
                } catch (error) {
                    this.log(`❌ ログダウンロードエラー | ${error.message}`);
                }
            }

            clearLogs() {
                this.logs = [];
                document.getElementById('debugLogs').textContent = 'ログがクリアされました';
                this.log('🗑️ ログをクリアしました');
            }

            refreshLogs() {
                const debugLogs = document.getElementById('debugLogs');
                debugLogs.textContent = this.logs.slice(-50).join('\\n');
                debugLogs.scrollTop = debugLogs.scrollHeight;
                this.log('🔄 ログ表示を更新しました');
            }
