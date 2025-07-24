# 計算機アプリ追加作業 - 詳細実装ガイド

## 📋 概要
このドキュメントは、統合アプリ管理システムに計算機アプリを追加した際の**全作業工程**を詳細に記録したものです。第三者がこの手順を参考に、同様の新アプリを追加できるよう、すべての作業を順序立てて説明します。

## ⚠️ 重要な前提条件

### 🛡️ 絶対に変更してはいけないファイル
```
core/common.js          ❌ 共通テンプレート（変更禁止）
core/module-loader.js   ❌ モジュール管理（変更禁止）  
server.js               ❌ サーバー起動（変更禁止）
```

### ✅ 変更可能ファイル
```
apps/[新アプリ名].js    ✅ 新規作成
config.json             ✅ 設定変更
allowed-apps.json       ✅ 許可リスト変更
index.html              ✅ UI追加（個別部分のみ）
```

---

## 🔧 STEP 1: バックエンドアプリ作成

### 1.1 ファイル作成
```bash
# appsフォルダに新しいJSファイルを作成
touch apps/calc.js
```

### 1.2 基本構造実装
**ファイル**: `apps/calc.js`

```javascript
class CalcApp {
    constructor(commonInstance, config = {}) {
        // 【必須】アプリ基本情報
        this.version = '2.0.0';
        this.name = 'calc';                    // ファイル名と一致させる
        this.displayName = '計算機';            // 画面表示名
        this.icon = '🧮';                      // タブアイコン
        
        // 【必須】共通インスタンス
        this.commonInstance = commonInstance;
        this.config = config;
        
        // 【必須】アプリ専用データ
        this.calculations = [];                // データ保存配列
        
        // 【必須】初期化処理
        this.setupRoutes();                    // APIルート設定
        this.generateSampleData();             // サンプルデータ生成
        
        this.log('🧮 計算機アプリモジュール初期化完了');
    }

    // 【必須】APIルート設定
    setupRoutes() {
        const app = this.commonInstance.app;

        // データ処理API
        app.post('/api/calc/calculate', (req, res) => {
            // バリデーション → データ処理 → レスポンス
        });

        // データ取得API  
        app.get('/api/calc/history', (req, res) => {
            // データ返却
        });

        // データ削除API
        app.delete('/api/calc/history/:id', (req, res) => {
            // データ削除処理
        });

        // CSV出力API
        app.post('/api/calc/export/csv', (req, res) => {
            // CSV生成・ダウンロード
        });
    }

    // 【必須】サンプルデータ生成
    generateSampleData() {
        // 初期データ作成
    }

    // 【必須】ログ機能
    log(message) {
        if (this.commonInstance && typeof this.commonInstance.log === 'function') {
            this.commonInstance.log(`🧮 CalcApp | ${message}`);
        }
    }

    // 【必須】クリーンアップ
    async cleanup() {
        this.log('🧹 計算機アプリ クリーンアップ開始');
        this.calculations = [];
        this.log('✅ 計算機アプリ クリーンアップ完了');
    }

    // 【必須】情報取得
    getInfo() {
        return {
            name: this.name,
            displayName: this.displayName,
            version: this.version,
            icon: this.icon,
            dataCount: this.calculations.length
        };
    }
}

module.exports = CalcApp;
```

### 1.3 重要な実装ポイント

#### ✅ 必須プロパティ
- `version`: アプリバージョン
- `name`: 一意のアプリ名（英数字のみ）
- `displayName`: 画面表示名（日本語可）
- `icon`: タブ表示用絵文字（1文字）

#### ✅ 必須メソッド
- `setupRoutes()`: APIエンドポイント定義
- `log()`: ログ出力機能
- `cleanup()`: リソース解放
- `getInfo()`: アプリ情報取得

#### ✅ API命名規則
```
/api/[アプリ名]/[操作名]

例:
/api/calc/calculate      # 計算実行
/api/calc/history        # 履歴取得  
/api/calc/export/csv     # CSV出力
```

---

## 🔧 STEP 2: 許可アプリリストに追加

### 2.1 ファイル編集
**ファイル**: `allowed-apps.json`

```json
{
  "version": "1.0.0",
  "description": "許可されたアプリモジュールのホワイトリスト",
  "lastUpdated": "2025-07-24T14:10:00.000Z",
  "allowedApps": [
    "money",
    "time", 
    "weight",
    "memo",
    "calc"        ← 【追加】新しいアプリ名
  ],
  "comments": {
    "money": "お金管理アプリ",
    "time": "時間管理アプリ", 
    "weight": "体重管理アプリ",
    "memo": "メモ管理アプリ",
    "calc": "計算機アプリ"    ← 【追加】説明文
  }
}
```

### 2.2 注意事項
- **アプリ名は英数字のみ** - ファイル名と完全一致
- **配列の最後にカンマ忘れ注意** - JSON構文エラーの原因
- **comments は任意** - 管理用メモとして活用

---

## 🔧 STEP 3: 設定ファイルでアプリ有効化

### 3.1 enabledApps に追加
**ファイル**: `config.json`

```json
{
  "enabledApps": [
    "money", 
    "time", 
    "weight", 
    "memo", 
    "calc"        ← 【追加】
  ]
}
```

### 3.2 apps セクションに設定追加
**ファイル**: `config.json`

```json
{
  "apps": {
    "money": { /* 既存設定 */ },
    "time": { /* 既存設定 */ },
    "weight": { /* 既存設定 */ },
    "memo": { /* 既存設定 */ },
    "calc": {                           ← 【追加】
      "name": "計算機",
      "description": "シンプルな数値計算と履歴管理",
      "icon": "🧮",
      "categories": ["足し算", "引き算", "掛け算", "割り算"]
    }
  }
}
```

---

## 🔧 STEP 4: フロントエンドUI作成

### 4.1 HTML画面追加
**ファイル**: `index.html`
**場所**: 他のアプリ画面の後（メモ管理画面の後など）

```html
<!-- 計算機画面 -->
<div class="app-content" id="calc-content" style="display: none;">
    <div class="calc-panel">
        <h3>🧮 計算機</h3>
        
        <!-- 計算入力フォーム -->
        <div class="input-section">
            <h4>🧮 数値計算</h4>
            <div class="calc-form">
                <div class="calc-input-row">
                    <input type="number" id="calc-number-a" placeholder="数値A" step="any">
                    <span class="calc-operator">+</span>
                    <input type="number" id="calc-number-b" placeholder="数値B" step="any">
                    <span class="calc-equals">=</span>
                    <span id="calc-result" class="calc-result">?</span>
                </div>
                <div class="calc-button-row">
                    <button class="btn calc-btn" onclick="calculateNumbers()">🧮 計算実行</button>
                    <button class="btn btn-secondary" onclick="clearCalculation()">🗑️ クリア</button>
                </div>
            </div>
        </div>
        
        <!-- 計算履歴 -->
        <div class="calc-history-section">
            <h4>📊 計算履歴</h4>
            <div id="calc-history-list" class="calc-history-list">
                <div class="loading">履歴を読み込み中...</div>
            </div>
        </div>
    </div>
</div>
```

### 4.2 重要なHTML設計ポイント

#### ✅ ID命名規則
```
[アプリ名]-[要素名]

例:
calc-content      # メインコンテナ
calc-number-a     # 入力フィールドA
calc-result       # 結果表示
calc-history-list # 履歴表示エリア
```

#### ✅ CSS クラス命名
```
[アプリ名]-[コンポーネント名]

例: 
calc-form         # フォーム全体
calc-input-row    # 入力行
calc-button-row   # ボタン行
calc-history-item # 履歴アイテム
```

### 4.3 CSS スタイル追加
**ファイル**: `index.html` (styleタグ内)

```css
/* 計算機スタイル */
.calc-form {
    background: var(--surface);
    padding: 20px;
    border-radius: var(--border-radius);
    border: 1px solid var(--border);
    margin-bottom: 20px;
}

.calc-input-row {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 20px;
    justify-content: center;
    flex-wrap: wrap;
}

.calc-input {
    width: 120px;
    text-align: center;
    font-size: 18px;
    font-weight: bold;
}

.calc-result {
    font-size: 24px;
    font-weight: bold;
    color: var(--success);
    min-width: 100px;
    background: var(--bg);
    padding: 8px 15px;
    border-radius: 6px;
    border: 2px solid var(--success);
    text-align: center;
}
```

---

## 🔧 STEP 5: JavaScript機能実装

### 5.1 アプリクラス内にメソッド追加
**ファイル**: `index.html` (scriptタグ内)
**場所**: 他のアプリメソッドの後

```javascript
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
```

### 5.2 グローバル関数追加
**ファイル**: `index.html` (scriptタグ内)
**場所**: 他のグローバル関数の後

```javascript
// 計算機管理関数
function calculateNumbers() { app.calculateNumbers(); }
function clearCalculation() { app.clearCalculation(); }
function deleteCalcHistory(calcId) { app.deleteCalcHistory(calcId); }
function exportCalcCSV() { app.exportCalcCSV(); }
```

### 5.3 アプリ切り替え処理追加
**ファイル**: `index.html` (switchApp メソッド内)

```javascript
} else if (appName === 'calc') {
    // 計算履歴を読み込み
    this.loadCalcHistory();
}
```

---

## 🔧 STEP 6: 動作確認とテスト

### 6.1 サーバー再起動
```bash
# 既存プロセス停止
ps aux | grep "node server.js" | grep -v grep | awk '{print $2}' | xargs -r kill

# サーバー再起動
node server.js
```

### 6.2 起動ログ確認
```
📋 有効なアプリ:
   💰 お金管理 (money) - v2.0.0
   ⚖️ 体重管理 (weight) - v2.0.0
   📝 メモ管理 (memo) - v2.0.0
   🧮 計算機 (calc) - v2.0.0     ← 【確認】新アプリが表示される
```

### 6.3 ブラウザ動作確認
1. `http://localhost:3001` にアクセス
2. **🧮 計算機**タブが表示されることを確認
3. **数値A**: `15`, **数値B**: `25` を入力
4. **「🧮 計算実行」**ボタンをクリック
5. **結果**: `40` が表示されることを確認
6. **計算履歴**に記録されることを確認

### 6.4 API動作確認
```bash
# 計算実行テスト
curl -X POST http://localhost:3001/api/calc/calculate \
  -H "Content-Type: application/json" \
  -d '{"numberA": 15, "numberB": 25}'

# 期待レスポンス:
# {"success":true,"calculation":{"result":40,...}}

# 履歴取得テスト  
curl -X GET http://localhost:3001/api/calc/history
```

---

## 🔧 STEP 7: チェックボックス設定UI対応

### 7.1 設定画面でアプリ表示
設定画面の**「📱 有効なアプリ」**セクションに計算機のチェックボックスが自動表示されることを確認：

```
☑️ 💰 お金管理
☑️ ⚖️ 体重管理  
☑️ 📝 メモ管理
☑️ 🧮 計算機     ← 【確認】自動的に追加される
```

### 7.2 設定変更テスト
1. **設定**タブをクリック
2. **計算機のチェックを外す**
3. **「💾 設定保存」**をクリック
4. **サーバー再起動**
5. **計算機タブが消える**ことを確認

---

## ⚠️ よくある問題と解決方法

### 問題1: アプリが読み込まれない
**エラー**: `❌ アプリ読み込み失敗 | calc | 許可されていないアプリです`

**原因**: `allowed-apps.json` にアプリ名が追加されていない
**解決**: `allowedApps` 配列にアプリ名を追加

### 問題2: タブが表示されない  
**原因**: `config.json` の `enabledApps` に追加されていない
**解決**: `enabledApps` 配列にアプリ名を追加

### 問題3: API が 404 エラー
**原因**: APIルートの定義ミス
**解決**: `setupRoutes()` メソッドのパスを確認

### 問題4: UI が表示されない
**原因**: HTML の ID名重複またはCSS適用されていない
**解決**: 
- ID名の一意性確認
- CSS セレクタの確認
- ブラウザ開発者ツールでエラー確認

### 問題5: JavaScript エラー
**原因**: グローバル関数未定義またはメソッド名の不一致
**解決**:
- グローバル関数を正しく定義
- メソッド名とonclick属性の一致確認

---

## 📝 作業チェックリスト

### ✅ ファイル作成・編集
- [ ] `apps/calc.js` 作成
- [ ] `allowed-apps.json` に追加
- [ ] `config.json` に追加  
- [ ] `index.html` にUI追加
- [ ] `index.html` にCSS追加
- [ ] `index.html` にJavaScript追加

### ✅ 動作確認
- [ ] サーバー起動ログでアプリ確認
- [ ] ブラウザでタブ表示確認
- [ ] 基本機能動作確認
- [ ] API レスポンス確認
- [ ] 設定画面での表示確認
- [ ] 設定変更での有効/無効確認

### ✅ エラー対応
- [ ] コンソールエラーなし
- [ ] APIエラーなし  
- [ ] UI表示エラーなし
- [ ] ログにエラーなし

---

## 🎯 成功の指標

### ✅ 完了条件
1. **サーバー起動時に新アプリが読み込まれる**
2. **ブラウザでタブが表示される**
3. **基本機能（入力→実行→結果表示）が動作する**
4. **API が正常レスポンスを返す**
5. **設定画面でチェックボックス表示・操作ができる**
6. **CSV エクスポートが動作する**（実装した場合）

### ✅ 品質確認
- **エラーログが出力されない**
- **UI デザインが他アプリと統一されている**
- **操作が直感的で分かりやすい**
- **データが正しく保存・表示される**

---

## 📚 参考情報

### 🔗 関連ファイル
- `NEW_APP_CREATION_MANUAL.md` - 基本的な新アプリ追加手順
- `VERSION_INFO.md` - システム全体の機能・仕様
- `apps/money.js` - 参考実装（お金管理アプリ）
- `apps/memo.js` - 参考実装（メモ管理アプリ）

### 📖 技術仕様
- **Node.js + Express.js** - サーバーサイド
- **Firebase** - 認証・データベース
- **Vanilla JavaScript** - フロントエンド
- **CSS Variables** - スタイリング

---

**📝 このドキュメントは、計算機アプリ追加の全作業工程を詳細に記録したものです。第三者がこの手順に従って、同様の新アプリを確実に追加できるよう作成されています。**