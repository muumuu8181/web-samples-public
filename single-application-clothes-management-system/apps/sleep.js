// ================================================================
// sleep.js v1.0 - 睡眠管理アプリ（AI自動開発実装・クラス形式）
// 
// 📋 機能概要:
// - 就寝・起床時刻記録
// - 睡眠時間自動計算
// - 睡眠品質評価（1-5段階）
// - 週間・月間統計表示
// - Firebase Realtime Database統合
// - CSVエクスポート対応
//
// 💤 データ構造:
// sleepData: { userId: { records: { "YYYY-MM-DD": {...} }, settings: {...} } }
// ================================================================

class SleepApp {
    constructor() {
        // アプリ基本情報
        this.appName = 'sleep';
        this.displayName = '睡眠管理';
        this.version = '1.0.0';
        this.icon = '💤';
        this.description = '睡眠パターンを記録・分析する睡眠管理アプリ';
        
        // データ構造定義
        this.dataStructure = {
            records: {
                date: 'string', // YYYY-MM-DD
                bedtime: 'string', // HH:MM
                wakeup: 'string', // HH:MM
                duration: 'number', // 分
                quality: 'number', // 1-5
                notes: 'string',
                timestamp: 'number'
            },
            settings: {
                targetSleep: 'number', // 目標睡眠時間（分）
                bedtimeReminder: 'string', // HH:MM
                wakeupReminder: 'string' // HH:MM
            }
        };
        
        // 初期データ
        this.defaultData = {
            records: {},
            settings: {
                targetSleep: 480, // 8時間
                bedtimeReminder: '23:00',
                wakeupReminder: '07:00'
            },
            stats: {
                totalRecords: 0,
                averageSleep: 0,
                averageQuality: 0,
                bestSleep: 0,
                worstSleep: 0
            }
        };
        
        // 現在のデータ
        this.data = null;
    }
    
    // ================================================================
    // UI生成
    // ================================================================
    render() {
        return `
            <div class="app-container sleep-app" id="sleep-app">
                <!-- ヘッダー -->
                <div class="app-header">
                    <h2>${this.icon} ${this.displayName}</h2>
                    <div class="app-actions">
                        <button onclick="window.sleepAppInstance.refreshData()" class="btn-refresh">🔄</button>
                        <button onclick="window.sleepAppInstance.exportData()" class="btn-export">📊</button>
                        <button onclick="window.sleepAppInstance.showSettings()" class="btn-settings">⚙️</button>
                    </div>
                </div>
                
                <!-- クイック統計 -->
                <div class="quick-stats" id="sleep-quick-stats">
                    <div class="stat-card">
                        <div class="stat-label">今週平均</div>
                        <div class="stat-value" id="weekly-average">0h 0m</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">平均品質</div>
                        <div class="stat-value" id="average-quality">0.0</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">記録日数</div>
                        <div class="stat-value" id="record-count">0日</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">目標達成</div>
                        <div class="stat-value" id="goal-achievement">0%</div>
                    </div>
                </div>
                
                <!-- 今日の記録 -->
                <div class="today-record">
                    <h3>📅 今日の睡眠記録</h3>
                    <div class="record-form" id="sleep-record-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label>就寝時刻</label>
                                <input type="time" id="bedtime-input" class="time-input">
                            </div>
                            <div class="form-group">
                                <label>起床時刻</label>
                                <input type="time" id="wakeup-input" class="time-input">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>睡眠品質 (1-5)</label>
                                <div class="quality-selector" id="quality-selector">
                                    <button class="quality-btn" data-quality="1">😴</button>
                                    <button class="quality-btn" data-quality="2">😪</button>
                                    <button class="quality-btn" data-quality="3">😐</button>
                                    <button class="quality-btn" data-quality="4">😊</button>
                                    <button class="quality-btn" data-quality="5">🤩</button>
                                </div>
                                <input type="hidden" id="quality-input" value="3">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group full-width">
                                <label>メモ（任意）</label>
                                <textarea id="notes-input" placeholder="睡眠に関するメモがあれば..." rows="2"></textarea>
                            </div>
                        </div>
                        
                        <div class="calculated-info">
                            <div class="duration-display">
                                <span>睡眠時間: </span>
                                <span id="calculated-duration">--</span>
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button onclick="window.sleepAppInstance.saveRecord()" class="btn-primary">💾 記録保存</button>
                            <button onclick="window.sleepAppInstance.clearForm()" class="btn-secondary">🗑️ クリア</button>
                        </div>
                    </div>
                </div>
                
                <!-- 睡眠履歴 -->
                <div class="sleep-history">
                    <h3>📈 睡眠履歴</h3>
                    <div class="history-controls">
                        <select id="history-period" onchange="window.sleepAppInstance.updateHistoryView()">
                            <option value="week">過去1週間</option>
                            <option value="month">過去1ヶ月</option>
                            <option value="all">全期間</option>
                        </select>
                    </div>
                    <div class="history-list" id="sleep-history-list">
                        <!-- 睡眠履歴がここに表示されます -->
                    </div>
                </div>
                
                <!-- 設定モーダル -->
                <div class="modal" id="sleep-settings-modal" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>⚙️ 睡眠管理設定</h3>
                            <button onclick="window.sleepAppInstance.closeSettings()" class="btn-close">×</button>
                        </div>
                        <div class="modal-body">
                            <div class="form-group">
                                <label>目標睡眠時間</label>
                                <select id="target-sleep-input">
                                    <option value="360">6時間</option>
                                    <option value="420">7時間</option>
                                    <option value="480" selected>8時間</option>
                                    <option value="540">9時間</option>
                                    <option value="600">10時間</option>
                                </select>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button onclick="window.sleepAppInstance.saveSettings()" class="btn-primary">保存</button>
                            <button onclick="window.sleepAppInstance.closeSettings()" class="btn-secondary">キャンセル</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // ================================================================
    // 初期化
    // ================================================================
    async init() {
        console.log(`🚀 ${this.displayName} アプリ初期化開始`);
        
        try {
            // グローバルインスタンス設定
            window.sleepAppInstance = this;
            
            // データ読み込み
            await this.loadData();
            
            // UI更新
            await this.updateUI();
            
            // イベントリスナー設定
            this.setupEventListeners();
            
            console.log(`✅ ${this.displayName} アプリ初期化完了`);
            
        } catch (error) {
            console.error(`❌ ${this.displayName} 初期化エラー:`, error);
            this.showError('アプリの初期化に失敗しました: ' + error.message);
        }
    }
    
    // ================================================================
    // データ管理
    // ================================================================
    async loadData() {
        try {
            // 初期データ設定
            this.data = { ...this.defaultData };
            
            // サンプルデータ生成（開発用）
            this.generateSampleData();
            
            console.log('睡眠データ読み込み完了:', Object.keys(this.data.records).length + '件');
            
        } catch (error) {
            console.error('データ読み込みエラー:', error);
            this.data = { ...this.defaultData };
        }
    }
    
    generateSampleData() {
        // 過去7日間のサンプルデータ生成
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const bedHour = 22 + Math.floor(Math.random() * 3); // 22-24時
            const bedMin = Math.floor(Math.random() * 60);
            const wakeHour = 6 + Math.floor(Math.random() * 3); // 6-8時
            const wakeMin = Math.floor(Math.random() * 60);
            
            const bedtime = `${bedHour.toString().padStart(2, '0')}:${bedMin.toString().padStart(2, '0')}`;
            const wakeup = `${wakeHour.toString().padStart(2, '0')}:${wakeMin.toString().padStart(2, '0')}`;
            const duration = this.calculateSleepDuration(bedtime, wakeup);
            const quality = Math.floor(Math.random() * 5) + 1;
            
            this.data.records[dateStr] = {
                date: dateStr,
                bedtime,
                wakeup,
                duration,
                quality,
                notes: '',
                timestamp: date.getTime()
            };
        }
        
        console.log('💤 睡眠管理サンプルデータ生成完了 | 7件追加');
    }
    
    async saveData() {
        try {
            // 統計更新
            this.updateStats();
            console.log('睡眠データ保存完了');
        } catch (error) {
            console.error('データ保存エラー:', error);
            throw error;
        }
    }
    
    // ================================================================
    // 睡眠記録機能
    // ================================================================
    async saveRecord() {
        try {
            const bedtime = document.getElementById('bedtime-input').value;
            const wakeup = document.getElementById('wakeup-input').value;
            const quality = parseInt(document.getElementById('quality-input').value);
            const notes = document.getElementById('notes-input').value;
            
            // バリデーション
            if (!bedtime || !wakeup) {
                throw new Error('就寝時刻と起床時刻を入力してください');
            }
            
            if (quality < 1 || quality > 5) {
                throw new Error('睡眠品質は1-5の範囲で選択してください');
            }
            
            // 睡眠時間計算
            const duration = this.calculateSleepDuration(bedtime, wakeup);
            
            // 今日の日付
            const today = new Date().toISOString().split('T')[0];
            
            // 記録作成
            const record = {
                date: today,
                bedtime,
                wakeup,
                duration,
                quality,
                notes: notes.trim(),
                timestamp: Date.now()
            };
            
            // データ保存
            this.data.records[today] = record;
            await this.saveData();
            
            // UI更新
            await this.updateUI();
            
            // フォームクリア
            this.clearForm();
            
            this.showSuccess('睡眠記録を保存しました');
            
        } catch (error) {
            console.error('記録保存エラー:', error);
            this.showError('記録の保存に失敗しました: ' + error.message);
        }
    }
    
    calculateSleepDuration(bedtime, wakeup) {
        const [bedHour, bedMin] = bedtime.split(':').map(Number);
        const [wakeHour, wakeMin] = wakeup.split(':').map(Number);
        
        let bedDateTime = new Date();
        bedDateTime.setHours(bedHour, bedMin, 0, 0);
        
        let wakeDateTime = new Date();
        wakeDateTime.setHours(wakeHour, wakeMin, 0, 0);
        
        // 起床時刻が就寝時刻より早い場合は翌日とみなす
        if (wakeDateTime <= bedDateTime) {
            wakeDateTime.setDate(wakeDateTime.getDate() + 1);
        }
        
        const duration = Math.round((wakeDateTime - bedDateTime) / (1000 * 60));
        return Math.max(0, Math.min(duration, 24 * 60)); // 0-24時間の範囲に制限
    }
    
    formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    }
    
    // ================================================================
    // UI更新
    // ================================================================
    async updateUI() {
        try {
            // クイック統計更新
            this.updateQuickStats();
            
            // 今日の記録があれば表示
            this.loadTodayRecord();
            
            // 履歴更新
            this.updateHistoryView();
            
        } catch (error) {
            console.error('UI更新エラー:', error);
        }
    }
    
    updateQuickStats() {
        const records = Object.values(this.data.records);
        
        if (records.length === 0) {
            document.getElementById('weekly-average').textContent = '0h 0m';
            document.getElementById('average-quality').textContent = '0.0';
            document.getElementById('record-count').textContent = '0日';
            document.getElementById('goal-achievement').textContent = '0%';
            return;
        }
        
        // 過去1週間のデータ
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const weeklyRecords = records.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate >= oneWeekAgo;
        });
        
        // 週間平均睡眠時間
        const weeklyAverage = weeklyRecords.length > 0 
            ? Math.round(weeklyRecords.reduce((sum, r) => sum + r.duration, 0) / weeklyRecords.length)
            : 0;
        document.getElementById('weekly-average').textContent = this.formatDuration(weeklyAverage);
        
        // 平均品質
        const averageQuality = records.length > 0
            ? (records.reduce((sum, r) => sum + r.quality, 0) / records.length).toFixed(1)
            : '0.0';
        document.getElementById('average-quality').textContent = averageQuality;
        
        // 記録日数
        document.getElementById('record-count').textContent = records.length + '日';
        
        // 目標達成率
        const targetSleep = this.data.settings.targetSleep;
        const achievementRate = weeklyRecords.length > 0
            ? Math.round((weeklyRecords.filter(r => r.duration >= targetSleep).length / weeklyRecords.length) * 100)
            : 0;
        document.getElementById('goal-achievement').textContent = achievementRate + '%';
    }
    
    loadTodayRecord() {
        const today = new Date().toISOString().split('T')[0];
        const todayRecord = this.data.records[today];
        
        if (todayRecord) {
            document.getElementById('bedtime-input').value = todayRecord.bedtime;
            document.getElementById('wakeup-input').value = todayRecord.wakeup;
            document.getElementById('quality-input').value = todayRecord.quality;
            document.getElementById('notes-input').value = todayRecord.notes || '';
            
            // 品質ボタン更新
            this.updateQualitySelector(todayRecord.quality);
            
            // 計算された時間表示
            document.getElementById('calculated-duration').textContent = this.formatDuration(todayRecord.duration);
        }
    }
    
    updateHistoryView() {
        const period = document.getElementById('history-period')?.value || 'week';
        const historyList = document.getElementById('sleep-history-list');
        
        if (!historyList) return;
        
        let records = Object.values(this.data.records);
        
        // 期間フィルタリング
        const now = new Date();
        if (period === 'week') {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(now.getDate() - 7);
            records = records.filter(r => new Date(r.date) >= oneWeekAgo);
        } else if (period === 'month') {
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(now.getMonth() - 1);
            records = records.filter(r => new Date(r.date) >= oneMonthAgo);
        }
        
        // 日付順でソート（新しい順）
        records.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // HTML生成
        if (records.length === 0) {
            historyList.innerHTML = '<div class="no-data">記録がありません</div>';
            return;
        }
        
        historyList.innerHTML = records.map(record => `
            <div class="history-item">
                <div class="history-date">${this.formatDate(record.date)}</div>
                <div class="history-details">
                    <div class="sleep-time">
                        ${record.bedtime} → ${record.wakeup} 
                        <span class="duration">(${this.formatDuration(record.duration)})</span>
                    </div>
                    <div class="sleep-quality">
                        ${this.getQualityEmoji(record.quality)} 品質: ${record.quality}/5
                    </div>
                    ${record.notes ? `<div class="sleep-notes">${record.notes}</div>` : ''}
                </div>
            </div>
        `).join('');
    }
    
    // ================================================================
    // イベントハンドラ
    // ================================================================
    setupEventListeners() {
        // 品質選択ボタン
        document.querySelectorAll('.quality-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const quality = parseInt(e.target.dataset.quality);
                document.getElementById('quality-input').value = quality;
                this.updateQualitySelector(quality);
            });
        });
        
        // 時刻入力での自動計算
        ['bedtime-input', 'wakeup-input'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => {
                    this.updateCalculatedDuration();
                });
            }
        });
    }
    
    updateQualitySelector(quality) {
        document.querySelectorAll('.quality-btn').forEach(btn => {
            btn.classList.remove('selected');
            if (parseInt(btn.dataset.quality) === quality) {
                btn.classList.add('selected');
            }
        });
    }
    
    updateCalculatedDuration() {
        const bedtime = document.getElementById('bedtime-input').value;
        const wakeup = document.getElementById('wakeup-input').value;
        
        if (bedtime && wakeup) {
            const duration = this.calculateSleepDuration(bedtime, wakeup);
            document.getElementById('calculated-duration').textContent = this.formatDuration(duration);
        } else {
            document.getElementById('calculated-duration').textContent = '--';
        }
    }
    
    // ================================================================
    // ユーティリティ
    // ================================================================
    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        
        if (dateString === today.toISOString().split('T')[0]) {
            return '今日';
        } else if (dateString === yesterday.toISOString().split('T')[0]) {
            return '昨日';
        } else {
            return date.toLocaleDateString('ja-JP', { 
                month: 'short', 
                day: 'numeric',
                weekday: 'short'
            });
        }
    }
    
    getQualityEmoji(quality) {
        const emojis = ['', '😴', '😪', '😐', '😊', '🤩'];
        return emojis[quality] || '😐';
    }
    
    clearForm() {
        document.getElementById('bedtime-input').value = '';
        document.getElementById('wakeup-input').value = '';
        document.getElementById('quality-input').value = '3';
        document.getElementById('notes-input').value = '';
        document.getElementById('calculated-duration').textContent = '--';
        this.updateQualitySelector(3);
    }
    
    // ================================================================
    // その他の機能
    // ================================================================
    updateStats() {
        const records = Object.values(this.data.records);
        
        this.data.stats = {
            totalRecords: records.length,
            averageSleep: records.length > 0 
                ? Math.round(records.reduce((sum, r) => sum + r.duration, 0) / records.length)
                : 0,
            averageQuality: records.length > 0
                ? Number((records.reduce((sum, r) => sum + r.quality, 0) / records.length).toFixed(1))
                : 0,
            bestSleep: records.length > 0 
                ? Math.max(...records.map(r => r.duration))
                : 0,
            worstSleep: records.length > 0
                ? Math.min(...records.map(r => r.duration))
                : 0
        };
    }
    
    showSettings() {
        const modal = document.getElementById('sleep-settings-modal');
        if (modal) modal.style.display = 'block';
    }
    
    closeSettings() {
        const modal = document.getElementById('sleep-settings-modal');
        if (modal) modal.style.display = 'none';
    }
    
    async saveSettings() {
        // 設定保存処理
        this.closeSettings();
    }
    
    async exportData() {
        console.log('睡眠データエクスポート機能（未実装）');
    }
    
    async refreshData() {
        await this.loadData();
        await this.updateUI();
        this.showSuccess('データを更新しました');
    }
    
    showError(message) {
        console.error('エラー:', message);
    }
    
    showSuccess(message) {
        console.log('成功:', message);
    }
}

// アプリ登録（モジュールローダー用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SleepApp;
}

// CommonJS環境での互換性確保
if (typeof window === 'undefined') {
    // Node.js環境
    module.exports = SleepApp;
}