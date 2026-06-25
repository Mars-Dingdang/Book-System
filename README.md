# 化学竞赛教室图书借阅系统

一个基于 Next.js、TypeScript、Prisma 的轻量级图书借阅管理系统。开发默认使用 SQLite，部署时可将 Prisma datasource 切换到 PostgreSQL。

## 本地运行

```bash
npm install
cp .env.example .env
npm run db:push
npm run db:seed
npm run dev
```

如果本机 Prisma schema-engine 对 SQLite 推送失败，可改用等价的本地初始化脚本：

```bash
npm run db:init
npm run db:seed
```

默认管理员账号：

- 学号：`admin`
- 密码：`.env` 中 `ADMIN_INIT_PASSWORD`，默认 `admin123456`

示例普通用户：

- 学号：`20240001`
- 密码：`123456`

## 核心页面

- `/login` 登录
- `/register` 注册
- `/books` 图书列表
- `/borrow/scan` 扫码或输入编号借书
- `/return/scan` 扫码或输入编号还书
- `/me/borrowed` 当前借阅
- `/admin` 管理员后台
- `/admin/books` 书目管理
- `/admin/copies` 实体书管理和二维码打印
- `/admin/borrow-records` 借阅记录

## 环境变量

见 `.env.example`。
