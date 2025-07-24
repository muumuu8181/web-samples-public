# 統一動作確認システム仕様書
## 【解釈の余地ゼロ】の動作確認標準プロセス

### 1. システム概要
開発者A・B・C誰がやっても同じ結果が得られる完全標準化された動作確認プロセス

### 2. 必須4段階プロセス
```
[STEP1] サーバー起動確認
[STEP2] API実行（curl -X POST localhost:3001/api/generate-test-log）
[STEP3] JSONファイル生成確認
[STEP4] AI（Claude Code）読み取り成功確認
```

### 3. 成功判定基準
#### STEP1成功条件
- ポート3001でサーバー応答
- エラーメッセージなし

#### STEP2成功条件
- HTTPステータス200
- success:trueレスポンス
- fileName、filePathが返される

#### STEP3成功条件
- 指定パスにJSONファイル存在
- ファイルサイズ > 0バイト
- 有効なJSON形式

#### STEP4成功条件
- Claude CodeのRead toolで読み取り成功
- 期待するJSON構造確認
- エラーなし

### 4. 失敗時の標準対応
1. エラーログ出力
2. 原因特定
3. 修正実行
4. STEP1から再実行

### 5. 実装仕様
#### 必須エンドポイント
- POST /api/generate-test-log（AI自動テスト用）
- POST /api/generate-log（フロントエンド連携用）

#### 必須レスポンス形式
```json
{
  "success": boolean,
  "message": string,
  "fileName": string,
  "filePath": string,
  "fileExists": boolean,
  "timestamp": number
}
```

#### 必須ログ形式
```json
{
  "exportInfo": {
    "exportedAt": "ISO-8601-timestamp",
    "exportedBy": "user-id",
    "version": "1.0",
    "source": "app-name",
    "testPurpose": "test-description"
  },
  "testData": {
    "success": boolean,
    "timestamp": number
  }
}
```

この仕様に100%準拠したシステムのみが標準として認められる。