# 高考英语阅读方法论训练端

基于「阅读方法论」的高考英语阅读理解训练平台。把一篇阅读理解的解题过程拆解为 5 个步骤，引导学生带着方法论做题，而不是凭感觉蒙答案；并配套 AI 讲题、错题本与学情画像。

## 功能亮点

- **五步训练法**：关键词提取 → 反向定位 → 选项关系判断 → 作答 → 复盘
- **干扰项标注**：每个选项标注干扰类型（同义替换 / 偷换概念 / 无中生有 / 方向相反 / 范围缩放）
- **AI 讲题**：接入 DeepSeek，按题生成解题讲解
- **错题本 + 学情画像**：记录每步判断正确率，自动定位薄弱干扰项类型
- **教师标注**：支持对选项、文段做教学标注

## 技术栈

| 层     | 技术                                        |
| ------ | ------------------------------------------- |
| 前端   | Vite 5 + React 18 + Tailwind CSS 3          |
| 后端   | Express 5 + Prisma 6 + SQLite               |
| 认证   | JWT（bcryptjs）                             |
| AI     | DeepSeek API                                |

## 目录结构

```
.
├── frontend/   # 前端（Vite + React）
└── backend/    # 后端（Express + Prisma）
```

## 快速开始

### 1. 启动后端

```bash
cd backend
npm install
cp .env.example .env        # 填入你的 DEEPSEEK_API_KEY 等
npx prisma migrate dev --name init
npm run db:seed             # 灌入题目种子数据
npm run dev                 # http://localhost:3000
```

### 2. 启动前端

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

开发时前端直接请求 `http://localhost:3000/api`（后端已开启 CORS）。

### 3. 生产部署（可选）

前端构建产物交给后端静态托管：

```bash
cd frontend && npm run build
# 将 frontend/dist 内容复制到 backend/public
cd ../backend && npm start
```

## 环境变量

见 `backend/.env.example`。

| 变量              | 说明                          |
| ----------------- | ----------------------------- |
| `PORT`            | 后端端口，默认 3000            |
| `JWT_SECRET`      | JWT 签名密钥                  |
| `DATABASE_URL`    | SQLite 连接串                 |
| `DEEPSEEK_API_KEY`| DeepSeek API Key（AI 讲题用） |

> ⚠️ 请勿将 `.env` 提交到仓库，仓库中仅保留 `.env.example` 模板。
