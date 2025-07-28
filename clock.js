// スタイリッシュ時計アプリ - JavaScript

class StylishClockApp {
    constructor() {
        this.currentTheme = 'light';
        this.analogClockVisible = true;
        this.digitalClockVisible = true;
        this.currentTab = 'clock';
        
        // タイマー関連
        this.timerInterval = null;
        this.timerSeconds = 0;
        this.timerOriginalSeconds = 0;
        this.timerRunning = false;
        
        // ストップウォッチ関連
        this.stopwatchInterval = null;
        this.stopwatchSeconds = 0;
        this.stopwatchRunning = false;
        this.lapCounter = 1;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startClocks();
        this.updateTimerDisplay();
        this.updateStopwatchDisplay();
        
        // 初期タブの設定
        this.switchTab('clock');
    }

    setupEventListeners() {
        // テーマ切り替え
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                this.changeTheme(theme);
            });
        });

        // タブ切り替え
        document.getElementById('clockTab').addEventListener('click', () => this.switchTab('clock'));
        document.getElementById('timerTab').addEventListener('click', () => this.switchTab('timer'));
        document.getElementById('stopwatchTab').addEventListener('click', () => this.switchTab('stopwatch'));

        // 時計表示切り替え
        document.getElementById('toggleAnalog').addEventListener('click', () => this.toggleClock('analog'));
        document.getElementById('toggleDigital').addEventListener('click', () => this.toggleClock('digital'));

        // タイマー関連
        document.getElementById('setTimer').addEventListener('click', () => this.setTimer());
        document.getElementById('startTimer').addEventListener('click', () => this.startTimer());
        document.getElementById('pauseTimer').addEventListener('click', () => this.pauseTimer());
        document.getElementById('resetTimer').addEventListener('click', () => this.resetTimer());

        // ストップウォッチ関連
        document.getElementById('startStopwatch').addEventListener('click', () => this.startStopwatch());
        document.getElementById('pauseStopwatch').addEventListener('click', () => this.pauseStopwatch());
        document.getElementById('resetStopwatch').addEventListener('click', () => this.resetStopwatch());
    }

    // テーマ変更
    changeTheme(theme) {
        this.currentTheme = theme;
        document.body.className = `min-h-screen theme-${theme}`;
        
        // テーマボタンのアクティブ状態更新
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.remove('ring-4', 'ring-white', 'ring-opacity-50');
        });
        document.querySelector(`[data-theme="${theme}"]`).classList.add('ring-4', 'ring-white', 'ring-opacity-50');
    }

    // タブ切り替え
    switchTab(tabName) {
        this.currentTab = tabName;
        
        // タブボタンの状態更新
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.style.background = 'rgba(255, 255, 255, 0.2)';
        });
        
        document.getElementById(`${tabName}Tab`).classList.add('active');
        document.getElementById(`${tabName}Tab`).style.background = 'linear-gradient(45deg, var(--primary-color), var(--secondary-color))';
        
        // コンテンツの表示切り替え
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            content.classList.add('hidden');
        });
        
        document.getElementById(`${tabName}Section`).classList.add('active');
        document.getElementById(`${tabName}Section`).classList.remove('hidden');
    }

    // 時計表示切り替え
    toggleClock(type) {
        const analogCanvas = document.getElementById('analogClock').parentElement.parentElement;
        const digitalDiv = analogCanvas.nextElementSibling;
        
        if (type === 'analog') {
            if (this.analogClockVisible) {
                analogCanvas.style.display = 'none';
                this.analogClockVisible = false;
                document.getElementById('toggleAnalog').innerHTML = '<i class="fas fa-eye mr-2"></i>アナログ表示';
            } else {
                analogCanvas.style.display = 'block';
                this.analogClockVisible = true;
                document.getElementById('toggleAnalog').innerHTML = '<i class="fas fa-eye-slash mr-2"></i>アナログ非表示';
            }
        } else if (type === 'digital') {
            if (this.digitalClockVisible) {
                digitalDiv.style.display = 'none';
                this.digitalClockVisible = false;
                document.getElementById('toggleDigital').innerHTML = '<i class="fas fa-eye mr-2"></i>デジタル表示';
            } else {
                digitalDiv.style.display = 'block';
                this.digitalClockVisible = true;
                document.getElementById('toggleDigital').innerHTML = '<i class="fas fa-eye-slash mr-2"></i>デジタル非表示';
            }
        }
    }

    // 時計開始
    startClocks() {
        this.updateDigitalClock();
        this.drawAnalogClock();
        
        // 1秒ごとに更新
        setInterval(() => {
            this.updateDigitalClock();
            this.drawAnalogClock();
        }, 1000);
    }

    // デジタル時計更新
    updateDigitalClock() {
        const now = new Date();
        const time = now.toLocaleTimeString('ja-JP');
        const date = now.toLocaleDateString('ja-JP');
        
        document.getElementById('digitalTime').textContent = time;
        document.getElementById('digitalDate').textContent = date;
    }

    // アナログ時計描画
    drawAnalogClock() {
        const canvas = document.getElementById('analogClock');
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;
        
        // キャンバスクリア
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 背景グラデーション
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.2)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fill();
        
        // 外周の枠
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();
        
        // 時刻取得
        const now = new Date();
        const hours = now.getHours() % 12;
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        
        // 時刻の目盛り
        this.drawClockMarks(ctx, centerX, centerY, radius);
        
        // 針の描画
        this.drawHand(ctx, centerX, centerY, (hours + minutes / 60) / 12 * 2 * Math.PI - Math.PI / 2, radius * 0.5, 6, 'rgba(255, 255, 255, 0.9)');  // 時針
        this.drawHand(ctx, centerX, centerY, minutes / 60 * 2 * Math.PI - Math.PI / 2, radius * 0.75, 4, 'rgba(255, 255, 255, 0.9)');  // 分針
        this.drawHand(ctx, centerX, centerY, seconds / 60 * 2 * Math.PI - Math.PI / 2, radius * 0.9, 2, '#06d6a0');  // 秒針
        
        // 中心の円
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
        ctx.fill();
    }

    // 時計の目盛り描画
    drawClockMarks(ctx, centerX, centerY, radius) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        
        for (let i = 0; i < 12; i++) {
            const angle = i / 12 * 2 * Math.PI - Math.PI / 2;
            const startRadius = radius * 0.85;
            const endRadius = radius * 0.95;
            
            const startX = centerX + Math.cos(angle) * startRadius;
            const startY = centerY + Math.sin(angle) * startRadius;
            const endX = centerX + Math.cos(angle) * endRadius;
            const endY = centerY + Math.sin(angle) * endRadius;
            
            ctx.lineWidth = i % 3 === 0 ? 3 : 1;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
        
        // 数字の描画
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        for (let i = 1; i <= 12; i++) {
            const angle = i / 12 * 2 * Math.PI - Math.PI / 2;
            const x = centerX + Math.cos(angle) * radius * 0.75;
            const y = centerY + Math.sin(angle) * radius * 0.75;
            ctx.fillText(i.toString(), x, y);
        }
    }

    // 針の描画
    drawHand(ctx, centerX, centerY, angle, length, width, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        
        const endX = centerX + Math.cos(angle) * length;
        const endY = centerY + Math.sin(angle) * length;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }

    // タイマー設定
    setTimer() {
        const minutes = parseInt(document.getElementById('timerMinutes').value) || 0;
        const seconds = parseInt(document.getElementById('timerSeconds').value) || 0;
        
        this.timerSeconds = minutes * 60 + seconds;
        this.timerOriginalSeconds = this.timerSeconds;
        this.updateTimerDisplay();
    }

    // タイマー開始
    startTimer() {
        if (this.timerSeconds <= 0) {
            this.setTimer();
        }
        
        if (this.timerSeconds > 0) {
            this.timerRunning = true;
            document.getElementById('startTimer').style.display = 'none';
            document.getElementById('pauseTimer').style.display = 'inline-block';
            
            this.timerInterval = setInterval(() => {
                this.timerSeconds--;
                this.updateTimerDisplay();
                
                if (this.timerSeconds <= 0) {
                    this.timerFinished();
                }
            }, 1000);
        }
    }

    // タイマー一時停止
    pauseTimer() {
        this.timerRunning = false;
        clearInterval(this.timerInterval);
        
        document.getElementById('startTimer').style.display = 'inline-block';
        document.getElementById('pauseTimer').style.display = 'none';
    }

    // タイマーリセット
    resetTimer() {
        this.timerRunning = false;
        clearInterval(this.timerInterval);
        this.timerSeconds = this.timerOriginalSeconds;
        
        document.getElementById('startTimer').style.display = 'inline-block';
        document.getElementById('pauseTimer').style.display = 'none';
        
        this.updateTimerDisplay();
    }

    // タイマー表示更新
    updateTimerDisplay() {
        const minutes = Math.floor(this.timerSeconds / 60);
        const seconds = this.timerSeconds % 60;
        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('timerDisplay').textContent = display;
    }

    // タイマー終了処理
    timerFinished() {
        this.timerRunning = false;
        clearInterval(this.timerInterval);
        
        document.getElementById('startTimer').style.display = 'inline-block';
        document.getElementById('pauseTimer').style.display = 'none';
        
        // アラート音（ブラウザのベル音）
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IAAAAAABAAABACIA');
            audio.play();
        } catch (e) {
            // フォールバック
            console.log('Timer finished!');
        }
        
        // 視覚的な通知
        document.getElementById('timerDisplay').classList.add('glow');
        setTimeout(() => {
            document.getElementById('timerDisplay').classList.remove('glow');
        }, 3000);
        
        alert('タイマーが終了しました！');
    }

    // ストップウォッチ開始
    startStopwatch() {
        this.stopwatchRunning = true;
        document.getElementById('startStopwatch').style.display = 'none';
        document.getElementById('pauseStopwatch').style.display = 'inline-block';
        
        this.stopwatchInterval = setInterval(() => {
            this.stopwatchSeconds++;
            this.updateStopwatchDisplay();
        }, 1000);
    }

    // ストップウォッチ停止
    pauseStopwatch() {
        this.stopwatchRunning = false;
        clearInterval(this.stopwatchInterval);
        
        document.getElementById('startStopwatch').style.display = 'inline-block';
        document.getElementById('pauseStopwatch').style.display = 'none';
        
        // ラップタイム記録
        this.addLapTime();
    }

    // ストップウォッチリセット
    resetStopwatch() {
        this.stopwatchRunning = false;
        clearInterval(this.stopwatchInterval);
        this.stopwatchSeconds = 0;
        this.lapCounter = 1;
        
        document.getElementById('startStopwatch').style.display = 'inline-block';
        document.getElementById('pauseStopwatch').style.display = 'none';
        
        this.updateStopwatchDisplay();
        
        // ラップタイムクリア
        document.getElementById('lapTimes').innerHTML = '<p class="text-white opacity-60 text-sm">ラップタイムがここに表示されます</p>';
    }

    // ストップウォッチ表示更新
    updateStopwatchDisplay() {
        const hours = Math.floor(this.stopwatchSeconds / 3600);
        const minutes = Math.floor((this.stopwatchSeconds % 3600) / 60);
        const seconds = this.stopwatchSeconds % 60;
        
        const display = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('stopwatchDisplay').textContent = display;
    }

    // ラップタイム追加
    addLapTime() {
        const lapTimesContainer = document.getElementById('lapTimes');
        
        // 初回の場合、プレースホルダーテキストを削除
        if (lapTimesContainer.children.length === 1 && lapTimesContainer.children[0].tagName === 'P') {
            lapTimesContainer.innerHTML = '';
        }
        
        const hours = Math.floor(this.stopwatchSeconds / 3600);
        const minutes = Math.floor((this.stopwatchSeconds % 3600) / 60);
        const seconds = this.stopwatchSeconds % 60;
        
        const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const lapDiv = document.createElement('div');
        lapDiv.className = 'flex justify-between items-center p-2 bg-white bg-opacity-10 rounded text-white text-sm';
        lapDiv.innerHTML = `
            <span>ラップ ${this.lapCounter}</span>
            <span class="font-mono">${timeStr}</span>
        `;
        
        lapTimesContainer.appendChild(lapDiv);
        this.lapCounter++;
        
        // スクロールを最下部に
        lapTimesContainer.scrollTop = lapTimesContainer.scrollHeight;
    }
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
    new StylishClockApp();
});