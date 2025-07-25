# 👕 服の管理アプリ - 完全仕様書

## 📋 **プロジェクト概要**
- **プロジェクト名**: 服の管理アプリ追加プロジェクト  
- **対象システム**: integrated-auto-development-system-v2
- **開発方針**: 基本3機能（Google認証・realtimeDB・ログDL）完全保護
- **最終目標**: GitHubアップロード・完全テスト済み

## 👕 **機能要件**

### **基本機能**
1. **衣類データ登録**
   - 衣類種別選択（コート、シャツ、ズボン、スカート、ドレス、アウター、インナー等）
   - 色の選択（赤、青、緑、黄、黒、白、グレー、ベージュ、茶色等）
   - 季節分類（春、夏、秋、冬、オールシーズン）
   - 所持数量の記録
   - サイズ記録（S、M、L、XL等）

2. **データ表示・集計**
   - 衣類一覧表示（種別・色・季節でフィルタリング）
   - 統計情報（種別別数量、季節別数量、色別数量）
   - 視覚的な集計（円グラフ・棒グラフ表示）

3. **データ管理**
   - 個別データの削除機能
   - CSV エクスポート機能
   - データ検索・フィルタリング

### **UI設計要件**
- **ドロップダウン型式**: 衣類種別・色・季節・サイズ選択
- **ボタン操作**: 簡単な記録・削除・エクスポート
- **レスポンシブ対応**: モバイル・タブレット・デスクトップ対応
- **直感的操作**: ユーザーフレンドリーなインターフェース

## 🔧 **技術仕様**

### **ファイル構成**
- `apps/clothes.js` - 服の管理アプリモジュール（新規作成）
- `allowed-apps.json` - "clothes" 追加
- `config.json` - 衣類管理設定追加・有効化

### **API設計**
- `POST /api/clothes/add` - 衣類データ追加
- `GET /api/clothes/data` - 衣類データ一覧取得  
- `DELETE /api/clothes/data/:id` - 衣類データ削除
- `POST /api/clothes/export/csv` - CSV エクスポート
- `GET /api/clothes/stats` - 統計データ取得

### **データモデル**
```javascript
{
  id: "unique_id",
  type: "コート",
  color: "黒",
  season: "冬",
  size: "M", 
  quantity: 2,
  brand: "ユニクロ", // オプション
  notes: "お気に入り", // オプション
  timestamp: "2025-07-24T14:00:00.000Z",
  date: "2025-07-24",
  appVersion: "2.0.0"
}
```

## 🏗️ **システム設計**

### **クラス設計**
```javascript
class ClothesApp {
    constructor(commonInstance, config = {})
    setupRoutes()           // API エンドポイント設定
    generateSampleData()    // サンプルデータ生成
    generateCSV()          // CSV 生成機能
    getStats()             // 統計データ取得
    log()                  // ログ機能
    cleanup()              // クリーンアップ
    getInfo()              // アプリ情報取得
}
```

### **データ構造**
```javascript
// 衣類レコード
{
    id: "1721832000000xyz12",
    type: "シャツ",           // 必須: 衣類種別
    color: "白",              // 必須: 色
    season: "オールシーズン",  // 必須: 季節
    size: "M",               // 必須: サイズ
    quantity: 3,             // 必須: 数量
    brand: "ユニクロ",        // オプション: ブランド
    notes: "仕事用",          // オプション: メモ
    timestamp: "2025-07-24T14:15:00.000Z",
    date: "2025-07-24",
    appVersion: "2.0.0"
}
```

## 🎨 **UI仕様**

### **メインフォーム**
```html
<div class="clothes-form">
    <select id="clothesType">衣類種別</select>
    <select id="clothesColor">色</select>
    <select id="clothesSeason">季節</select>
    <select id="clothesSize">サイズ</select>
    <input type="number" id="quantity" placeholder="数量">
    <input type="text" id="brand" placeholder="ブランド（任意）">
    <textarea id="notes" placeholder="メモ（任意）"></textarea>
    <button onclick="addClothes()">👕 記録</button>
</div>
```

### **統計表示エリア**
```html
<div class="stats-section">
    <div class="stat-card">種別別統計</div>
    <div class="stat-card">色別統計</div>
    <div class="stat-card">季節別統計</div>
    <canvas id="clothesChart">グラフ表示</canvas>
</div>
```

## 🌐 **API仕様**

| メソッド | エンドポイント | 説明 | パラメータ |
|---------|--------------|------|-----------|
| POST | `/api/clothes/add` | 衣類データ追加 | type, color, season, size, quantity, brand?, notes? |
| GET | `/api/clothes/data` | 衣類データ一覧取得 | なし |
| DELETE | `/api/clothes/data/:id` | 衣類データ削除 | id (URLパラメータ) |
| POST | `/api/clothes/export/csv` | CSV エクスポート | なし |
| GET | `/api/clothes/stats` | 統計データ取得 | なし |

## 📊 **統計機能設計**

### **集計項目**
- **種別別統計**: コート(5), シャツ(12), ズボン(8)...
- **色別統計**: 黒(10), 白(8), グレー(5)...
- **季節別統計**: 春(7), 夏(15), 秋(6), 冬(9)...
- **サイズ別統計**: S(3), M(18), L(12), XL(2)...

### **視覚化**
- **円グラフ**: 種別別割合
- **棒グラフ**: 色別・季節別数量
- **数値表示**: 総アイテム数、最多カテゴリ

## 🎯 **設定項目（config.json追加）**

```javascript
"clothes": {
    "name": "服の管理",
    "description": "衣類の種類・色・季節別管理と統計",
    "icon": "👕",
    "categories": [
        "コート", "ジャケット", "シャツ", "Tシャツ", "ブラウス",
        "ズボン", "ジーンズ", "スカート", "ドレス", "ワンピース",
        "アウター", "インナー", "下着", "靴下", "帽子", "その他"
    ],
    "colors": [
        "黒", "白", "グレー", "茶色", "ベージュ",
        "赤", "ピンク", "オレンジ", "黄色", "緑",
        "青", "紺", "紫", "その他"
    ],
    "seasons": [
        "春", "夏", "秋", "冬", "オールシーズン"
    ],
    "sizes": [
        "XS", "S", "M", "L", "XL", "XXL", "フリー"
    ]
}
```

## 📋 **サンプルデータ**
```javascript
[
    {type: "シャツ", color: "白", season: "オールシーズン", size: "M", quantity: 3},
    {type: "ジーンズ", color: "青", season: "オールシーズン", size: "L", quantity: 2},
    {type: "コート", color: "黒", season: "冬", size: "M", quantity: 1},
    {type: "Tシャツ", color: "グレー", season: "夏", size: "M", quantity: 5},
    {type: "スカート", color: "茶色", season: "秋", size: "S", quantity: 2}
]
```

## 📝 **作業項目一覧**

### 🔄 **フェーズ1: 企画・設計**
1. ✅ ガイドブック・仕様書確認
2. ✅ 服の管理アプリ要件定義作成
3. ✅ 作業項目一覧の詳細化
4. ✅ 服の管理アプリ仕様書作成

### 🛠️ **フェーズ2: 開発準備**
5. 🎯 ユーザー確認・GOサイン取得

### 💻 **フェーズ3: アプリモジュール開発**
6. 📁 `apps/clothes.js` 作成（ClothesApp クラス実装）
7. 🔧 API エンドポイント実装（add/data/delete/export/stats）
8. 📊 サンプルデータ生成機能実装
9. ⚙️ ログ・エラーハンドリング実装

### 🎨 **フェーズ4: UI開発**
10. 📱 HTML フォーム作成（種別・色・季節・サイズ選択）
11. 💄 CSS スタイリング（レスポンシブ対応）
12. ⚡ JavaScript 実装（API連携・動的表示）
13. 📊 統計機能UI実装（グラフ表示）

### ⚙️ **フェーズ5: システム統合**
14. 📝 `allowed-apps.json` に "clothes" 追加
15. 🔧 `config.json` で衣類管理設定追加・有効化
16. 🚀 サーバー再起動・動作確認

### 🧪 **フェーズ6: テスト・検証**
17. 🔍 API 単体テスト（curl コマンド）
18. 🌐 Web UI テスト（ブラウザ動作確認）
19. 📋 4段階検証システム実行
20. 📊 CSV エクスポート機能テスト
21. 🐛 エラー修正・品質向上

### 📤 **フェーズ7: GitHubアップロード**
22. 📁 フォルダ整理・バックアップ作成
23. 📖 README.md 更新（服の管理アプリ追加）
24. 🔄 Git コミット・プッシュ
25. 🎉 GitHub公開完了確認

### 📈 **予想作業ステップ数: 約30-40ステップ**
- **開発**: 15-20ステップ
- **テスト**: 8-10ステップ  
- **統合・アップロード**: 5-8ステップ

## 🎯 **成功基準**

### **機能テスト**
- ✅ 衣類データの登録・表示・削除が正常動作
- ✅ 統計機能が正確に集計・表示
- ✅ CSV エクスポートが完全動作
- ✅ レスポンシブデザインが全デバイス対応

### **品質テスト**  
- ✅ 基本3機能（Google認証・realtimeDB・ログDL）が保護されている
- ✅ エラーハンドリングが適切に実装
- ✅ 4段階検証システムを全て通過
- ✅ パフォーマンスが良好

### **統合テスト**
- ✅ 既存アプリ（money、weight、memo、calc、sleep）に影響なし
- ✅ サーバー起動・停止が正常
- ✅ GitHub アップロード完了
- ✅ 全体システムが安定動作

---

**🎉 完全仕様書 - 服の管理アプリの全ての要件・設計・作業項目を網羅**