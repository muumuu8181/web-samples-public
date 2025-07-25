# スマート単一フォルダ構成テンプレート 設計仕様書

## 📋 プロジェクト概要
**目的**: 後方互換性を保ちながら、複数アプリを柔軟に組み合わせ可能なスマート単一フォルダ構成テンプレートの実装

**バージョン**: v2.0
**作成日**: 2025-07-24
**対象ユーザー**: 複数の管理アプリを組み合わせて使いたいユーザー

## 🎯 核心要件

### 1. 後方互換性の保持
- common.js v1.0 + アプリ v1.0 → 動作保証
- common.js v2.0 + アプリ v1.0 → 動作保証
- common.js v2.0 + アプリ v3.0 → 動作保証

### 2. スマート単一フォルダ構成
- 全機能を一つのフォルダに配置
- 動的読み込みで必要な機能のみ利用
- config.jsonで簡単に設定変更

### 3. バグ隔離とセキュリティ
- 無効なアプリのバグは他に影響しない
- 不要なコードは読み込まれない
- セキュアな動的読み込み

## 🏗️ アーキテクチャ設計

### フォルダ構成
```
smart-template/
├── core/
│   ├── common.js              # v2.0 共通テンプレート
│   ├── module-loader.js       # 動的読み込みエンジン
│   └── plugin-system.js       # プラグインアーキテクチャ
├── apps/
│   ├── money.js               # お金管理モジュール
│   ├── time.js                # 時間管理モジュール
│   ├── weight.js              # 体重管理モジュール
│   └── ...                    # 将来の拡張用
├── ui/
│   ├── components/            # 共通UIコンポーネント
│   └── templates/             # アプリ別テンプレート
├── config.json               # アプリ有効/無効設定
├── package.json               # 依存関係
├── server.js                  # メインサーバー
├── index.html                 # 統合UI
└── logs/                      # ログディレクトリ
```

### 技術スタック
- **Backend**: Node.js + Express.js
- **Frontend**: HTML5 + CSS3 + Vanilla JavaScript
- **Database**: Firebase Realtime Database
- **Auth**: Firebase Auth (Google OAuth)
- **Export**: CSV + JSON
- **Module System**: CommonJS + 動的import

## 🔧 コンポーネント設計

### 1. common.js v2.0
**役割**: 後方互換性を保つ共通機能基盤
```javascript
class CommonTemplate {
  constructor(config = {}) {
    // Tolerant Reader パターン
    this.config = this.mergeDefaultConfig(config);
    this.plugins = [];
    this.moduleLoader = new ModuleLoader();
  }
  
  // 既存API保持（v1.0互換）
  setupMiddleware() { /* v1.0と同じ */ }
  setupCommonRoutes() { /* v1.0と同じ */ }
  
  // v2.0新機能
  loadModules(enabledApps) { /* 動的読み込み */ }
  registerPlugin(plugin) { /* プラグイン登録 */ }
}
```

### 2. module-loader.js
**役割**: 設定に基づく動的モジュール読み込み
```javascript
class ModuleLoader {
  async loadEnabledApps(config) {
    const enabledApps = config.enabledApps || [];
    for (const appName of enabledApps) {
      try {
        const AppModule = require(`../apps/${appName}.js`);
        this.registerApp(appName, new AppModule());
      } catch (error) {
        // エラー隔離: 一つのアプリ失敗が全体に影響しない
        console.warn(`App ${appName} failed to load:`, error.message);
      }
    }
  }
}
```

### 3. config.json
**役割**: ユーザー設定の中央管理
```json
{
  "version": "2.0",
  "appName": "PersonalManager",
  "enabledApps": ["money", "time", "weight"],
  "features": {
    "firebaseAuth": true,
    "csvExport": true,
    "advancedAnalytics": false
  },
  "ui": {
    "theme": "default",
    "compactMode": false
  },
  "port": 3001
}
```

## 📊 実装戦略

### Phase 1: 基盤実装
1. common.js v2.0 の実装
2. module-loader.js の実装  
3. 基本的なconfig.json読み込み

### Phase 2: アプリモジュール作成
1. money.js (お金管理)
2. time.js (時間管理)
3. weight.js (体重管理)

### Phase 3: 統合UI実装
1. 動的UI生成システム
2. アプリ切り替え機能
3. 設定管理画面

### Phase 4: テスト・最適化
1. 全機能動作テスト
2. 後方互換性テスト
3. パフォーマンス最適化

## 🧪 テスト仕様

### 1. 互換性テスト
- [ ] v1.0 moneyApp + v2.0 common → 動作確認
- [ ] v2.0 全機能 → 動作確認
- [ ] config変更 → 動的反映確認

### 2. 動作テスト
- [ ] Firebase認証 → Google OAuth
- [ ] データCRUD → 各アプリで確認
- [ ] CSV出力 → 各アプリで確認
- [ ] ログ生成・DL → 確認

### 3. エラー処理テスト
- [ ] 不正config → 安全なデフォルト動作
- [ ] 一つのアプリエラー → 他アプリ継続動作
- [ ] ネットワークエラー → 適切なエラーハンドリング

## 🎯 成功基準

1. **機能性**: 全ての基本3機能（Firebase認証、Realtime DB、CSV DL）が動作
2. **互換性**: v1.0アプリが v2.0 common で動作
3. **柔軟性**: config.json変更で機能ON/OFF切り替え可能
4. **安定性**: 一つのアプリエラーが全体に影響しない
5. **効率性**: 不要なコードは読み込まれない

## 📝 実装チェックリスト

### 第3原則実装サイクル
各ステップで「改修→実行→結果の確認」を実行

- [ ] Step 1: common.js v2.0 実装→テスト→ログ確認
- [ ] Step 2: module-loader.js 実装→テスト→ログ確認
- [ ] Step 3: money.js 実装→テスト→ログ確認
- [ ] Step 4: time.js 実装→テスト→ログ確認
- [ ] Step 5: weight.js 実装→テスト→ログ確認
- [ ] Step 6: 統合UI 実装→テスト→ログ確認
- [ ] Step 7: config.json システム→テスト→ログ確認
- [ ] Step 8: 全体統合テスト→ログ確認
- [ ] Step 9: 最終動作確認→ログ確認

## 🤖 Gemini-CLI相談ポイント

- [ ] アーキテクチャ設計レビュー
- [ ] 後方互換性実装方法の確認
- [ ] 動的読み込みのベストプラクティス調査
- [ ] セキュリティ観点でのレビュー
- [ ] パフォーマンス最適化の提案
- [ ] エラーハンドリング戦略の検証