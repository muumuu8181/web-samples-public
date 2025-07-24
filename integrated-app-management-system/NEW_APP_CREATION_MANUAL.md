# 新アプリ追加完全マニュアル

## 📋 概要
このマニュアルは、共通ファイルを一切変更せずに新しいアプリを追加する手順を説明します。
**重要: このマニュアル通りに実行すれば、誰でも同じ結果を得られます。**

## 🛡️ 禁止事項
- **`core/common.js`** の編集 ❌
- **`core/module-loader.js`** の編集 ❌  
- **`server.js`** の編集 ❌
- **`index.html`** の共通部分の編集 ❌

## ✅ 編集可能ファイル
- **`config.json`** ✅
- **`allowed-apps.json`** ✅
- **`apps/[新アプリ名].js`** ✅（新規作成）
- **`index.html`** のアプリ固有部分 ✅

---

## 📖 新アプリ追加手順

### STEP 1: アプリファイル作成

#### 1.1 ファイル作成
```bash
# appsフォルダに新しいアプリファイルを作成
touch apps/[アプリ名].js
```

#### 1.2 基本テンプレートをコピー
以下のテンプレートを使用してアプリを作成してください：

```javascript
// ================================================================
// [アプリ名].js - [アプリ説明]アプリモジュール
// ================================================================

class [アプリクラス名]App {
    constructor(commonInstance, config = {}) {
        this.version = '2.0.0';
        this.name = '[アプリ名]';           // 英数字のみ
        this.displayName = '[表示名]';       // 日本語可
        this.icon = '[絵文字]';             // 1文字の絵文字
        
        this.commonInstance = commonInstance;
        this.config = config;
        
        // アプリ専用データ
        this.[データ名] = [];
        
        // ルート設定
        this.setupRoutes();
        this.generateSampleData();
        
        this.log('[絵文字] [アプリ説明]アプリモジュール初期化完了');
    }

    setupRoutes() {
        const app = this.commonInstance.app;

        // データ追加API
        app.post('/api/[アプリ名]/add', (req, res) => {
            try {
                const { /* 必要なフィールド */ } = req.body;
                
                // バリデーション
                if (/* バリデーション条件 */) {
                    return res.status(400).json({ 
                        error: 'エラーメッセージ' 
                    });
                }

                const record = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    // データフィールド
                    timestamp: new Date().toISOString(),
                    date: new Date().toISOString().split('T')[0],
                    appVersion: this.version
                };

                this.[データ名].push(record);
                
                this.log(`[絵文字] データ追加 | ${/* ログメッセージ */}`);
                
                res.json({ 
                    success: true, 
                    data: record,
                    total: this.[データ名].length 
                });
                
            } catch (error) {
                this.log(`❌ データ追加エラー | ${error.message}`);
                res.status(500).json({ error: 'データの追加に失敗しました' });
            }
        });

        // データ一覧取得API
        app.get('/api/[アプリ名]/data', (req, res) => {
            try {
                res.json({
                    data: this.[データ名].slice().reverse(), // 新しい順
                    total: this.[データ名].length,
                    appVersion: this.version
                });
            } catch (error) {
                this.log(`❌ データ取得エラー | ${error.message}`);
                res.status(500).json({ error: 'データの取得に失敗しました' });
            }
        });

        // データ削除API
        app.delete('/api/[アプリ名]/data/:id', (req, res) => {
            try {
                const { id } = req.params;
                const index = this.[データ名].findIndex(item => item.id === id);
                
                if (index === -1) {
                    return res.status(404).json({ error: 'データが見つかりません' });
                }

                const deleted = this.[データ名].splice(index, 1)[0];
                
                this.log(`🗑️ データ削除 | ${/* ログメッセージ */}`);
                
                res.json({ 
                    success: true, 
                    deleted,
                    remaining: this.[データ名].length 
                });
                
            } catch (error) {
                this.log(`❌ データ削除エラー | ${error.message}`);
                res.status(500).json({ error: 'データの削除に失敗しました' });
            }
        });

        // CSV エクスポート（オプション）
        app.post('/api/[アプリ名]/export/csv', (req, res) => {
            try {
                const csvData = this.[データ名].map(item => [
                    // CSVの列データ
                ]);

                const headers = [/* CSVヘッダー */];
                
                const csvContent = this.generateCSV(csvData, headers);
                const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
                const csvFilename = `[アプリ名]_data_${timestamp}.csv`;
                
                res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                res.setHeader('Content-Disposition', `attachment; filename="${csvFilename}"`);
                res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));
                
                this.log(`📊 CSV エクスポート | ${this.[データ名].length}件のデータ`);
                res.send('\uFEFF' + csvContent); // BOM付きUTF-8
                
            } catch (error) {
                this.log(`❌ CSV エクスポートエラー | ${error.message}`);
                res.status(500).json({ error: 'CSV エクスポートに失敗しました' });
            }
        });
    }

    // CSV生成（必要な場合）
    generateCSV(data, headers) {
        let csvContent = '';
        
        if (headers && headers.length > 0) {
            csvContent += headers.join(',') + '\n';
        }
        
        data.forEach(row => {
            if (Array.isArray(row)) {
                csvContent += row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',') + '\n';
            }
        });
        
        return csvContent;
    }

    // サンプルデータ生成
    generateSampleData() {
        this.[データ名] = [];
        
        const samples = [
            // サンプルデータ配列
        ];

        samples.forEach((sample, index) => {
            const record = {
                id: (Date.now() - index * 1000).toString() + Math.random().toString(36).substr(2, 5),
                ...sample,
                timestamp: new Date(Date.now() - index * 60000).toISOString(),
                date: new Date().toISOString().split('T')[0],
                appVersion: this.version
            };
            this.[データ名].push(record);
        });

        this.log(`🎯 サンプルデータ生成完了 | ${samples.length}件追加`);
    }

    // ログ機能
    log(message) {
        if (this.commonInstance && typeof this.commonInstance.log === 'function') {
            this.commonInstance.log(`[絵文字] [アプリクラス名]App | ${message}`);
        } else {
            console.log(`[絵文字] [アプリクラス名]App | ${message}`);
        }
    }

    // クリーンアップ機能
    async cleanup() {
        this.log('🧹 [アプリ説明]アプリ クリーンアップ開始');
        this.[データ名] = [];
        this.log('✅ [アプリ説明]アプリ クリーンアップ完了');
    }

    // 情報取得
    getInfo() {
        return {
            name: this.name,
            displayName: this.displayName,
            version: this.version,
            icon: this.icon,
            dataCount: this.[データ名].length,
            lastUpdate: this.[データ名].length > 0 ? 
                this.[データ名][this.[データ名].length - 1].timestamp : null
        };
    }
}

module.exports = [アプリクラス名]App;
```

### STEP 2: 許可アプリリストに追加

#### 2.1 allowed-apps.json を編集
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
    "calc",
    "[新アプリ名]"  ← 追加
  ],
  "comments": {
    // 既存コメント
    "[新アプリ名]": "[新アプリの説明]"  ← 追加
  }
}
```

### STEP 3: config.json で有効化

#### 3.1 enabledApps に追加
```json
{
  "enabledApps": ["money", "time", "weight", "memo", "calc", "[新アプリ名]"],
}
```

#### 3.2 apps セクションに設定追加
```json
{
  "apps": {
    // 既存アプリ設定
    "[新アプリ名]": {
      "name": "[表示名]",
      "description": "[アプリの説明]",
      "icon": "[絵文字]",
      "categories": ["カテゴリ1", "カテゴリ2", "その他"]
    }
  }
}
```

### STEP 4: サーバー再起動

```bash
# 既存プロセス停止
ps aux | grep "node server.js" | grep -v grep | awk '{print $2}' | xargs -r kill

# サーバー起動
node server.js
```

### STEP 5: 動作確認

#### 5.1 ログ確認
起動ログで新アプリが正常に読み込まれていることを確認：
```
📋 有効なアプリ:
   💰 お金管理 (money) - v2.0.0
   ⏰ 時間管理 (time) - v2.0.0
   ⚖️ 体重管理 (weight) - v2.0.0
   📝 メモ管理 (memo) - v2.0.0
   🧮 計算機 (calc) - v2.0.0
   [絵文字] [表示名] ([新アプリ名]) - v2.0.0  ← 追加確認
```

#### 5.2 API動作確認
```bash
# データ取得テスト
curl -X GET http://localhost:3001/api/[新アプリ名]/data

# データ追加テスト
curl -X POST http://localhost:3001/api/[新アプリ名]/add \
  -H "Content-Type: application/json" \
  -d '{ /* 必要なデータ */ }'
```

---

## 🔧 実例: 計算機アプリ

### ファイル一覧
```
apps/calc.js                   ← 新規作成
allowed-apps.json             ← "calc" 追加
config.json                   ← "calc" 有効化 + 設定追加
```

### 主要API
- `POST /api/calc/calculate` - 計算実行
- `GET /api/calc/history` - 計算履歴取得
- `DELETE /api/calc/history/:id` - 履歴削除
- `POST /api/calc/export/csv` - CSV エクスポート

### 動作確認済み
```bash
# 計算実行
curl -X POST http://localhost:3001/api/calc/calculate \
  -H "Content-Type: application/json" \
  -d '{"numberA": 15, "numberB": 25}'

# 結果: {"success":true,"calculation":{"result":40,...}}
```

---

## ⚠️ トラブルシューティング

### 問題: アプリが読み込まれない
**原因**: `allowed-apps.json` に追加し忘れ
**解決**: `allowedApps` 配列にアプリ名を追加

### 問題: "許可されていないアプリです" エラー
**原因**: アプリ名のタイポまたは許可リスト未登録
**解決**: アプリ名とallowed-apps.jsonの記載を確認

### 問題: API が 404 エラー
**原因**: ルート設定の間違い
**解決**: setupRoutes() メソッドの API パスを確認

### 問題: サンプルデータが表示されない
**原因**: generateSampleData() の実装不備
**解決**: データ配列に正しくサンプルを追加しているか確認

---

## 📊 成功の指標

✅ サーバー起動時に新アプリが読み込まれる
✅ API リクエストが正常レスポンスを返す  
✅ サンプルデータが表示される
✅ データの追加・削除が動作する
✅ CSV エクスポートが動作する（実装した場合）

---

## 📝 注意事項

1. **アプリ名は英数字のみ**: ファイル名やAPI パスに使用
2. **クラス名は PascalCase**: `CalcApp`, `TodoApp` など
3. **API パスは統一**: `/api/[アプリ名]/[操作]` 形式
4. **エラーハンドリング必須**: try-catch で適切に処理
5. **ログ出力推奨**: デバッグ時に役立つ

---

**このマニュアル通りに実行すれば、共通ファイルを一切変更せずに新しいアプリを追加できます。**