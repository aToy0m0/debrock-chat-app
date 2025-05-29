# Debrock Chat App (EC2 Node.js 対応版)

このリポジトリは、Vercel AI SDK v0 を使って AWS Bedrock Agent と連携するチャットアプリのフロントエンドです。
ここでは、Amazon Linux EC2 上の Node.js 環境で自己ホストできるように調整された構成を紹介します。

## ✅ 主な変更点

- `app/api/chat/route.ts` を Edge Runtime から Node.js 対応に変更
- `.env` を設定して AWS Bedrock Agent にアクセス可能に
- その他の UI 部分（React/Tailwind）は変更不要

---

## 📁 ディレクトリ構成（抜粋）

```
debrock-chat-app/
├── app/
│   └── api/
│       └── chat/
│           └── route.ts   ← Node.js 対応済み
├── components/
├── hooks/
├── lib/
├── public/
├── styles/
├── .env                   ← Bedrock 接続情報を記載
├── package.json
├── tsconfig.json
└── README.md              ← 本ファイル
```

---

## ⚙️ .env サンプル

```
REGION=us-east-1
BEDROCK_AGENT_ID=your-agent-id
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
```

---

## 🚀 実行手順（EC2想定）

```bash
# セットアップ
pnpm install

# 本番ビルド
pnpm build

# サーバー起動（Node.js）
pnpm start
```

---

## 🐳 Dockerで動かす場合（例）

```Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install -g pnpm && pnpm install && pnpm build
ENV PORT=3000
EXPOSE 3000
CMD ["pnpm", "start"]
```

---

## 🔗 備考

- `StreamingTextResponse` は Node.js でも使用可能
- Bedrock Agent は `@aws-sdk/client-bedrock-runtime` 経由で呼び出しています
