# 🚨 重大な認識違いと注意点記録

## 📋 作成日時
2025年7月25日 - common-template v0.6開発時

## 🔍 認識違いの根本原因

### 1. 仕様書・要件定義の不備
- **問題**: 「全ログ一括表示」の具体的な仕様が不明確
- **誤解**: 現在のシステムログ(systemLogs配列)を表示する機能だと認識
- **正解**: 過去に保存されたログファイル(logs/フォルダ)を読み込む機能

### 2. ログ機能の二重構造理解不足
- **システムログ(debugLogs)**: リアルタイム動作ログ（緑画面）
- **ログ閲覧(logDisplay)**: 過去の保存済みログファイル表示
- **混同**: この2つを混同してフィルター機能を実装

### 3. バージョン管理の複雑性
- **config.jsonのversion**: 設定ファイル内のバージョン
- **表示されるバージョン**: ハードコードされたシステムログ内のバージョン
- **パッケージのversion**: package.jsonのバージョン
- **フォルダ名のバージョン**: ディレクトリ名のバージョン

## 🚨 今回発生した具体的なミス

### ミス1: フィルター機能の破壊的実装
```javascript
// ❌ 間違った実装（v0.5）
if (debugLogs) {
    debugLogs.textContent = filteredLogs.join('\n'); // システムログを破壊
}
```
- **問題**: システムログの実際のデータを書き換え
- **影響**: 実際の作業ログが失われる危険性

### ミス2: ログ機能の目的誤解
```javascript
// ❌ 間違った実装
function loadAllLogs() {
    logDisplay.textContent = systemLogs.join('\n'); // 現在ログを表示
}
```
- **問題**: 「全ログ一括表示」を現在ログ表示と誤解
- **正解**: 過去の保存済みログファイルを読み込むべき

### ミス3: バージョン表示の不整合
- **config.json**: 0.6に変更済み
- **画面表示**: まだ0.3のまま
- **原因**: systemLogs配列内にハードコードされたバージョン情報

### ミス4: STEP3ページ機能確認エラー
```javascript
// ❌ 間違ったセレクタ
const tabs = document.querySelectorAll('.tab-btn'); // 存在しないクラス
```
- **問題**: HTMLの実際のクラス名(.app-tab)と不一致
- **原因**: HTMLとJavaScriptの連携確認不足

## 📋 今後の注意点（必須チェックリスト）

### 🔍 実装前チェック
1. **要件の具体的確認**
   - 「〜表示」「〜機能」の具体的な動作を詳細確認
   - データの流れ（入力→処理→出力）を明確化
   - 既存データの保護必要性を確認

2. **HTML構造の事前確認**
   - 実際のクラス名・ID名をGrep/Bashで確認
   - セレクタの存在確認を先に実行
   - 要素の階層構造を理解

3. **データ破壊リスク評価**
   - 既存データを変更する処理かを事前確認
   - 読み取り専用 vs 書き込み処理の区別
   - バックアップ・復元の必要性判断

### 🛡️ 実装時チェック
1. **バージョン一貫性**
   - config.json
   - package.json  
   - 画面表示
   - ログ出力
   全てのバージョン表記を統一

2. **ログ機能の分離**
   - リアルタイムログ（システム動作用）
   - 過去ログ（アーカイブ閲覧用）
   この2つを明確に分離して実装

3. **フィルター機能の安全性**
   - 元データは絶対に変更しない
   - 表示のみを変更する設計
   - 複数表示エリアへの影響を考慮

### 🧪 テスト時チェック
1. **動作確認の網羅性**
   - 各機能の個別テスト
   - 機能間の連携テスト
   - データ保護の確認テスト

2. **エラーケースの確認**
   - 空データでの動作
   - 不正入力での動作
   - ファイル不存在での動作

## 🎯 具体的な修正項目（v0.7での対応予定）

### 1. バージョン自動更新機能
- config.jsonのversionを動的に読み込み
- 全表示箇所で統一バージョン表示

### 2. ログ機能の正しい実装
- 「全ログ一括表示」→過去ログファイル読み込み機能
- システムログとの完全分離

### 3. 安全なフィルター機能
- 読み取り専用フィルター実装
- データ破壊の完全防止

### 4. HTML-JavaScript連携の確認
- 全セレクタの存在確認
- 動的要素の生成確認

## 📚 教訓

### 最重要教訓
**「実装前に必ず実際の構造・データ・要件を確認する」**

### 具体的行動
1. コードを書く前にRead/Bash/Grepで実際の状況を確認
2. 仕様が曖昧な場合は必ず質問で明確化
3. データを変更する処理では必ず保護を最優先に設計

## 🔄 今後の改善策

1. **要件定義テンプレートの作成**
   - 機能の具体的動作
   - データの流れ
   - 保護すべき要素

2. **実装チェックリストの運用**
   - HTML構造確認
   - データ安全性確認
   - バージョン一貫性確認

3. **テスト項目の標準化**
   - 正常系・異常系テスト
   - データ保護テスト
   - 連携テスト

---
**この記録を必ず参照して同じミスを繰り返さないこと**