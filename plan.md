# 化学竞赛教室图书借阅系统 plan.md

## 1. 项目背景

学校化学竞赛教室中有一个书柜，存放大量化学竞赛相关书籍、讲义、内部资料以及部分同学自行印刷的影印版资料。平时同学们会自由借阅这些资料，但目前缺少系统化管理，容易出现以下问题：

- 不知道某本书当前是否还在书柜中；
- 不知道某本书被谁借走；
- 不知道借走时间和是否超期；
- 管理员难以统计库存、借阅记录和丢失情况；
- 同学借还书流程不规范，依赖人工登记。

因此需要开发一个轻量级图书借阅系统，功能类似小型图书馆系统。每一本实体书贴上唯一二维码，同学登录后通过手机扫码完成借书和还书操作，管理员可以在后台查看所有图书状态和借阅记录。

------

## 2. 项目目标

实现一个可部署的 Web 图书借阅系统，满足以下核心需求：

1. 用户可以注册、登录自己的账号；
2. 用户可以扫码借书；
3. 用户可以扫码还书；
4. 用户可以查询某本书是否可借；
5. 用户可以查看自己当前借阅的书；
6. 用户可以查看自己的历史借阅记录；
7. 管理员可以录入、编辑和删除图书信息；
8. 管理员可以为每本实体书生成唯一编号和二维码；
9. 管理员可以查看所有书籍当前状态；
10. 管理员可以查看哪些书被借走、借走时间、借阅人；
11. 管理员可以查看超期未还、损坏、丢失等异常状态；
12. 管理员可以导出借阅记录或图书清单。

------

## 3. 推荐技术栈

使用 Web 应用方案，不开发原生 App。

### 3.1 前端与后端

推荐使用：

```text
Next.js + TypeScript
```

原因：

- 一个项目中同时实现前端页面和后端 API；
- 适合快速开发和部署；
- 可以部署到 Vercel；
- 对 Codex 代码生成友好；
- 手机浏览器可直接访问。

### 3.2 数据库

推荐使用：

```text
PostgreSQL
```

开发阶段也可以先使用 SQLite，但最终部署建议使用 PostgreSQL。

推荐数据库服务：

```text
Supabase PostgreSQL
Neon PostgreSQL
Railway PostgreSQL
```

### 3.3 ORM

使用：

```text
Prisma
```

原因：

- 数据模型清晰；
- 迁移方便；
- TypeScript 类型支持好；
- 适合 Next.js 项目。

### 3.4 登录认证

推荐使用：

```text
Auth.js / NextAuth.js
```

第一版可以先实现简单账号密码登录。

账号字段建议：

```text
姓名
学号
班级
密码
角色 user/admin
```

### 3.5 扫码功能

使用浏览器摄像头扫码库：

```text
html5-qrcode
```

注意：浏览器调用摄像头通常需要 HTTPS，因此部署时应使用 HTTPS 域名。

### 3.6 二维码生成

使用：

```text
qrcode
```

用于为每本实体书生成二维码图片。

------

## 4. 部署方案

### 4.1 推荐部署方式

推荐：

```text
Vercel + Supabase PostgreSQL
```

优点：

- Vercel 自动提供 HTTPS；
- 手机浏览器扫码功能可正常使用；
- 不需要自行配置 Nginx；
- 适合低成本快速上线；
- 后续维护简单。

### 4.2 需要准备的东西

项目部署需要：

```text
1. Vercel 账号
2. Supabase 或 Neon 数据库
3. 一个管理员账号
4. 一份初始书籍 Excel 清单
5. 二维码标签打印纸或普通打印纸
6. 可选：自定义域名
```

### 4.3 环境变量

项目需要以下环境变量：

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="replace-with-random-secret"
NEXTAUTH_URL="https://your-domain.com"
ADMIN_INIT_PASSWORD="change-me"
```

如果不用 NextAuth，可以改为自定义 JWT 认证：

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="replace-with-random-secret"
```

------

## 5. 业务概念设计

系统中需要区分两个概念：

### 5.1 书目 Book

表示某一种书，例如：

```text
高中化学竞赛教程
无机化学习题精讲
有机化学竞赛专题讲义
```

一个书目可能有多本实体副本。

### 5.2 实体书 BookCopy

表示书柜中的某一本具体实体书。

例如《高中化学竞赛教程》有 3 本，则对应：

```text
CHEM-ORG-001-01
CHEM-ORG-001-02
CHEM-ORG-001-03
```

每一本实体书都应该有唯一编号和唯一二维码。

------

## 6. 编号规则

建议实体书编号格式如下：

```text
CHEM-{CATEGORY}-{BOOK_ID}-{COPY_INDEX}
```

示例：

```text
CHEM-ORG-001-01
CHEM-ORG-001-02
CHEM-INORG-002-01
CHEM-PHY-003-01
CHEM-ANA-004-01
```

分类缩写建议：

```text
ORG     有机化学
INORG   无机化学
PHY     物理化学
ANA     分析化学
EXP     实验化学
GEN     综合竞赛
HAND    讲义资料
OTHER   其他
```

二维码内容推荐使用完整 URL：

```text
https://your-domain.com/book-copy/CHEM-ORG-001-01
```

这样用户使用微信、浏览器或系统相机扫码后，可以直接进入该书页面。

系统内部扫码时，也可以从该 URL 中解析出 `copyCode`。

------

## 7. 数据库设计

使用 Prisma 建模。

### 7.1 User 用户表

```prisma
model User {
  id             Int            @id @default(autoincrement())
  name           String
  studentId      String         @unique
  className      String?
  email          String?
  passwordHash   String
  role           Role           @default(USER)
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  borrowRecords  BorrowRecord[]
  auditLogs       AuditLog[]
}
```

### 7.2 Book 书目表

```prisma
model Book {
  id          Int        @id @default(autoincrement())
  title       String
  author      String?
  publisher   String?
  category    String?
  isbn        String?
  description String?
  sourceType  SourceType @default(ORIGINAL)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  copies      BookCopy[]
}
```

### 7.3 BookCopy 实体书表

```prisma
model BookCopy {
  id             Int            @id @default(autoincrement())
  bookId         Int
  copyCode       String         @unique
  status         CopyStatus     @default(AVAILABLE)
  location       String?
  qrCodeUrl      String?
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  book           Book           @relation(fields: [bookId], references: [id])
  borrowRecords  BorrowRecord[]
}
```

### 7.4 BorrowRecord 借阅记录表

```prisma
model BorrowRecord {
  id          Int          @id @default(autoincrement())
  userId      Int
  bookCopyId  Int
  borrowedAt  DateTime     @default(now())
  dueAt        DateTime?
  returnedAt   DateTime?
  status      BorrowStatus @default(BORROWED)

  user        User         @relation(fields: [userId], references: [id])
  bookCopy    BookCopy     @relation(fields: [bookCopyId], references: [id])
}
```

### 7.5 AuditLog 操作日志表

```prisma
model AuditLog {
  id          Int       @id @default(autoincrement())
  userId      Int?
  action      String
  targetType  String?
  targetId    String?
  detail      String?
  createdAt   DateTime  @default(now())

  user        User?      @relation(fields: [userId], references: [id])
}
```

### 7.6 枚举类型

```prisma
enum Role {
  USER
  ADMIN
}

enum CopyStatus {
  AVAILABLE
  BORROWED
  LOST
  DAMAGED
}

enum BorrowStatus {
  BORROWED
  RETURNED
  OVERDUE
  LOST
}

enum SourceType {
  ORIGINAL
  PHOTOCOPY
  HANDOUT
  INTERNAL
  OTHER
}
```

------

## 8. 页面设计

### 8.1 普通用户页面

#### `/login`

登录页面。

功能：

- 输入学号和密码；
- 登录成功后跳转到首页；
- 登录失败显示错误信息。

#### `/register`

注册页面。

字段：

```text
姓名
学号
班级
邮箱，可选
密码
确认密码
```

注册后默认为普通用户。

#### `/`

用户首页。

显示：

```text
扫码借书
扫码还书
搜索图书
我当前借阅的书
我的历史记录
```

#### `/borrow/scan`

扫码借书页面。

功能：

- 调用手机摄像头；
- 扫描书本二维码；
- 解析实体书编号；
- 请求 `POST /api/borrow`；
- 显示借阅成功或失败原因。

#### `/return/scan`

扫码还书页面。

功能：

- 调用手机摄像头；
- 扫描书本二维码；
- 解析实体书编号；
- 请求 `POST /api/return`；
- 显示归还成功或失败原因。

#### `/books`

图书搜索和列表页面。

功能：

- 按书名搜索；
- 按作者搜索；
- 按分类筛选；
- 显示总副本数、可借数量、已借数量。

#### `/books/[id]`

书目详情页面。

显示：

```text
书名
作者
出版社
分类
资料类型
简介
所有实体副本
每本实体副本状态
所在位置
是否可借
```

#### `/book-copy/[copyCode]`

实体书详情页面。

功能：

- 展示具体实体书信息；
- 若可借，显示“借阅此书”按钮；
- 若当前用户已借该书，显示“归还此书”按钮；
- 若已被他人借走，显示“已借出”。

#### `/me/borrowed`

当前借阅页面。

显示当前用户尚未归还的书。

#### `/me/history`

用户历史借阅记录页面。

显示用户过去所有借阅和归还记录。

------

### 8.2 管理员页面

所有 `/admin/*` 页面都需要管理员权限。

#### `/admin`

管理员首页。

显示统计卡片：

```text
书目总数
实体书总数
当前可借数量
当前借出数量
超期未还数量
损坏数量
丢失数量
```

显示最近借阅记录。

#### `/admin/books`

书目管理页面。

功能：

- 查看所有书目；
- 新增书目；
- 编辑书目；
- 删除书目；
- 查看每个书目下的实体副本。

#### `/admin/books/new`

新增书目页面。

字段：

```text
书名
作者
出版社
分类
ISBN，可选
资料类型
描述
所在位置
初始副本数量
```

提交后：

- 创建 Book；
- 根据初始副本数量创建 BookCopy；
- 自动生成 copyCode；
- 自动生成二维码 URL。

#### `/admin/copies`

实体书管理页面。

功能：

- 查看所有实体书；
- 按状态筛选；
- 按位置筛选；
- 手动修改状态；
- 标记为损坏；
- 标记为丢失；
- 重新生成二维码。

#### `/admin/borrow-records`

借阅记录管理页面。

功能：

- 查看所有借阅记录；
- 按用户筛选；
- 按书名筛选；
- 按状态筛选；
- 按时间筛选；
- 查看未归还记录；
- 查看超期记录；
- 管理员手动归还。

#### `/admin/users`

用户管理页面。

功能：

- 查看所有用户；
- 修改用户角色；
- 禁用或启用用户；
- 查看某用户借阅记录。

#### `/admin/import`

Excel 导入页面。

功能：

- 上传 Excel 文件；
- 解析书单；
- 批量创建书目和实体副本。

#### `/admin/export`

导出页面。

功能：

- 导出全部图书清单；
- 导出当前借出列表；
- 导出历史借阅记录。

------

## 9. API 设计

### 9.1 认证相关

#### `POST /api/auth/register`

请求：

```json
{
  "name": "张三",
  "studentId": "20240001",
  "className": "高二竞赛班",
  "email": "zhangsan@example.com",
  "password": "123456"
}
```

行为：

- 校验学号是否已存在；
- 对密码进行哈希；
- 创建普通用户；
- 返回用户信息。

#### `POST /api/auth/login`

请求：

```json
{
  "studentId": "20240001",
  "password": "123456"
}
```

行为：

- 校验学号和密码；
- 登录成功后设置 session 或返回 token。

------

### 9.2 图书查询相关

#### `GET /api/books`

支持 query 参数：

```text
q       搜索关键词
category 分类
status   状态
page     页码
limit    每页数量
```

返回：

```json
{
  "items": [
    {
      "id": 1,
      "title": "高中化学竞赛教程",
      "author": "张三",
      "category": "ORG",
      "totalCopies": 3,
      "availableCopies": 2,
      "borrowedCopies": 1
    }
  ],
  "total": 1
}
```

#### `GET /api/books/:id`

返回书目详情和所有副本状态。

#### `GET /api/book-copies/:copyCode`

返回实体书详情。

------

### 9.3 借书相关

#### `POST /api/borrow`

请求：

```json
{
  "copyCode": "CHEM-ORG-001-01"
}
```

业务逻辑：

1. 检查用户是否已登录；
2. 根据 `copyCode` 查询实体书；
3. 如果不存在，返回错误；
4. 如果状态不是 `AVAILABLE`，返回错误；
5. 创建 BorrowRecord；
6. 设置 `borrowedAt = now()`；
7. 设置 `dueAt = now() + 30 days`，可配置；
8. 设置 BorrowRecord.status = `BORROWED`；
9. 设置 BookCopy.status = `BORROWED`；
10. 写入 AuditLog；
11. 返回成功信息。

返回：

```json
{
  "success": true,
  "message": "借阅成功",
  "record": {
    "id": 1,
    "borrowedAt": "2026-06-24T10:00:00.000Z",
    "dueAt": "2026-07-24T10:00:00.000Z"
  }
}
```

错误示例：

```json
{
  "success": false,
  "message": "这本书当前不可借"
}
```

------

### 9.4 还书相关

#### `POST /api/return`

请求：

```json
{
  "copyCode": "CHEM-ORG-001-01"
}
```

业务逻辑：

1. 检查用户是否已登录；
2. 根据 `copyCode` 查询实体书；
3. 查找该实体书当前未归还的 BorrowRecord；
4. 如果不存在未归还记录，返回错误；
5. 如果当前借阅人不是当前用户，普通用户不能归还，返回错误；
6. 如果当前用户是管理员，则允许管理员代还；
7. 设置 `returnedAt = now()`；
8. 设置 BorrowRecord.status = `RETURNED`；
9. 设置 BookCopy.status = `AVAILABLE`；
10. 写入 AuditLog；
11. 返回成功信息。

------

### 9.5 当前用户相关

#### `GET /api/me/borrowed`

返回当前用户尚未归还的书。

#### `GET /api/me/history`

返回当前用户历史借阅记录。

------

### 9.6 管理员相关

#### `GET /api/admin/books`

管理员查看所有书目。

#### `POST /api/admin/books`

管理员新增书目。

#### `PATCH /api/admin/books/:id`

管理员修改书目。

#### `DELETE /api/admin/books/:id`

管理员删除书目。

删除前需要检查：

- 如果该书存在未归还的副本，不允许删除；
- 或者只做软删除。

#### `POST /api/admin/book-copies`

管理员新增实体副本。

#### `PATCH /api/admin/book-copies/:id`

管理员修改实体书状态、位置等信息。

#### `GET /api/admin/borrow-records`

管理员查看所有借阅记录。

#### `POST /api/admin/borrow-records/:id/force-return`

管理员强制归还。

#### `GET /api/admin/export/books`

导出图书清单。

#### `GET /api/admin/export/borrow-records`

导出借阅记录。

------

## 10. 核心业务规则

### 10.1 借书规则

- 用户必须登录才能借书；
- 只有状态为 `AVAILABLE` 的实体书可以借出；
- 一本实体书同一时间只能被一个用户借出；
- 借书成功后必须创建借阅记录；
- 借书成功后实体书状态改为 `BORROWED`；
- 建议默认借阅期限为 30 天；
- 可选限制：每个用户最多同时借 5 本。

### 10.2 还书规则

- 用户必须登录才能还书；
- 普通用户只能归还自己借出的书；
- 管理员可以代为归还任意书；
- 还书成功后设置 `returnedAt`；
- 还书成功后实体书状态改为 `AVAILABLE`；
- 还书操作必须写入日志。

### 10.3 管理员规则

- 管理员可以新增、修改、删除书目；
- 管理员可以新增实体副本；
- 管理员可以标记书籍为损坏；
- 管理员可以标记书籍为丢失；
- 管理员可以查看所有借阅记录；
- 管理员可以导出数据。

### 10.4 并发规则

借书时要防止两个用户同时扫码借同一本书。

实现要求：

- 借书接口中必须使用数据库事务；
- 在事务中检查实体书状态；
- 状态为 `AVAILABLE` 时才允许更新为 `BORROWED`；
- 如果更新失败，返回“这本书已被借走”。

------

## 11. 前端组件设计

### 11.1 `QRScanner`

用途：

- 调用手机摄像头；
- 识别二维码；
- 返回扫码结果。

接口设计：

```tsx
type QRScannerProps = {
  onScan: (text: string) => void;
  onError?: (error: unknown) => void;
};
```

功能：

- 使用 `html5-qrcode`；
- 进入页面后显示扫码区域；
- 扫码成功后停止摄像头；
- 支持重新扫码；
- 支持手动输入编号。

### 11.2 `BookCard`

显示图书摘要。

内容：

```text
书名
作者
分类
可借数量
总数量
```

### 11.3 `BookCopyStatusBadge`

显示实体书状态：

```text
可借
已借出
损坏
丢失
```

### 11.4 `AdminTable`

通用后台表格组件。

功能：

- 分页；
- 搜索；
- 筛选；
- 操作按钮。

------

## 12. 二维码生成设计

### 12.1 单本生成

管理员创建实体书副本时，系统自动生成二维码内容：

```text
{NEXT_PUBLIC_BASE_URL}/book-copy/{copyCode}
```

例如：

```text
https://chem-library.example.com/book-copy/CHEM-ORG-001-01
```

### 12.2 批量生成

管理员应能批量下载二维码。

第一版可以简单实现为：

- 在 `/admin/copies` 页面中每行显示二维码；
- 浏览器打印该页面；
- 每个二维码下方显示 copyCode 和书名。

第二版可以实现：

- 生成 PDF 标签页；
- 每张标签包含二维码、书名、编号；
- 支持 A4 纸打印。

------

## 13. Excel 导入设计

### 13.1 Excel 格式

推荐初始 Excel 表头：

```text
title
author
publisher
category
sourceType
description
location
quantity
```

示例：

```text
title,author,publisher,category,sourceType,description,location,quantity
高中化学竞赛教程,张三,某出版社,ORG,ORIGINAL,,A柜第2层,3
有机化学专题讲义,,内部资料,ORG,HANDOUT,,A柜第3层,5
```

### 13.2 导入逻辑

1. 管理员上传 Excel；
2. 系统解析每一行；
3. 创建 Book；
4. 根据 quantity 创建对应数量的 BookCopy；
5. 自动生成 copyCode；
6. 自动生成 qrCodeUrl；
7. 返回导入成功和失败统计。

------

## 14. 搜索与查询功能

用户和管理员都需要搜索图书。

搜索范围：

```text
书名
作者
出版社
分类
ISBN
描述
实体书编号 copyCode
```

第一版可以使用数据库 `contains` 查询。

后续可以优化：

- 拼音搜索；
- 模糊搜索；
- 全文搜索；
- 热门书籍排序。

------

## 15. 超期逻辑

第一版可以不做自动通知，但需要能显示超期状态。

判断方式：

```text
如果 BorrowRecord.status = BORROWED
且 dueAt < 当前时间
则视为超期
```

可以在查询时动态判断，不一定要定时更新数据库。

管理员后台应提供“超期未还”筛选。

后续可以增加：

- 邮件提醒；
- 企业微信/钉钉提醒；
- 每日自动检查超期。

------

## 16. 安全要求

### 16.1 登录安全

- 密码必须使用 bcrypt 或 argon2 哈希；
- 不能明文存储密码；
- session 或 JWT 必须有过期时间；
- 管理员接口必须校验用户角色。

### 16.2 权限控制

普通用户允许：

```text
查看图书
扫码借书
扫码还书
查看自己的记录
```

普通用户禁止：

```text
修改图书信息
查看所有用户详细记录
替别人归还书
删除记录
修改借阅状态
```

管理员允许：

```text
管理图书
管理实体副本
查看全部借阅记录
强制归还
标记损坏或丢失
导入导出数据
```

### 16.3 操作日志

以下操作必须写入 AuditLog：

```text
用户借书
用户还书
管理员新增书目
管理员修改书目
管理员新增实体副本
管理员修改实体书状态
管理员强制归还
管理员标记丢失
管理员标记损坏
```

------

## 17. 错误处理

所有 API 返回统一格式。

成功：

```json
{
  "success": true,
  "message": "操作成功",
  "data": {}
}
```

失败：

```json
{
  "success": false,
  "message": "错误原因"
}
```

常见错误：

```text
未登录
无权限
实体书不存在
书目不存在
这本书当前不可借
这本书不是由你借出的
这本书已经归还
当前存在未归还记录，不能删除
数据库操作失败
```

------

## 18. 用户体验要求

### 18.1 手机端优先

系统主要在手机上使用，因此页面需要适配手机。

要求：

- 首页按钮大；
- 扫码页面简洁；
- 借书和还书成功后反馈明显；
- 错误信息清楚；
- 支持手动输入编号作为扫码失败的备用方案。

### 18.2 管理端适配电脑

管理员后台主要在电脑上使用。

要求：

- 表格清晰；
- 支持搜索和筛选；
- 支持分页；
- 支持导出；
- 二维码打印页面排版整齐。

------

## 19. MVP 开发阶段

第一阶段只实现最小可用版本。

### 19.1 必须实现

```text
1. 用户注册
2. 用户登录
3. 管理员角色
4. 图书列表
5. 图书详情
6. 实体书详情
7. 管理员新增书目
8. 管理员新增实体副本
9. 自动生成 copyCode
10. 自动生成二维码内容
11. 扫码借书
12. 扫码还书
13. 用户当前借阅
14. 用户历史借阅
15. 管理员查看当前借出列表
16. 管理员查看全部借阅记录
```

### 19.2 暂不实现但预留结构

```text
1. 邮件提醒
2. 预约图书
3. 借阅排行榜
4. 拼音搜索
5. PDF 标签生成
6. 企业微信提醒
7. 多教室、多书柜支持
8. 统一身份认证
```

------

## 20. 推荐项目目录

```text
chem-library/
├── README.md
├── plan.md
├── package.json
├── next.config.js
├── tsconfig.json
├── .env.example
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   └── logo.png
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── books/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── book-copy/
│   │   │   └── [copyCode]/
│   │   │       └── page.tsx
│   │   ├── borrow/
│   │   │   └── scan/
│   │   │       └── page.tsx
│   │   ├── return/
│   │   │   └── scan/
│   │   │       └── page.tsx
│   │   ├── me/
│   │   │   ├── borrowed/
│   │   │   │   └── page.tsx
│   │   │   └── history/
│   │   │       └── page.tsx
│   │   ├── admin/
│   │   │   ├── page.tsx
│   │   │   ├── books/
│   │   │   │   ├── page.tsx
│   │   │   │   └── new/
│   │   │   │       └── page.tsx
│   │   │   ├── copies/
│   │   │   │   └── page.tsx
│   │   │   ├── borrow-records/
│   │   │   │   └── page.tsx
│   │   │   ├── users/
│   │   │   │   └── page.tsx
│   │   │   ├── import/
│   │   │   │   └── page.tsx
│   │   │   └── export/
│   │   │       └── page.tsx
│   │   └── api/
│   │       ├── auth/
│   │       ├── books/
│   │       ├── book-copies/
│   │       ├── borrow/
│   │       │   └── route.ts
│   │       ├── return/
│   │       │   └── route.ts
│   │       ├── me/
│   │       └── admin/
│   ├── components/
│   │   ├── QRScanner.tsx
│   │   ├── BookCard.tsx
│   │   ├── BookCopyStatusBadge.tsx
│   │   ├── AdminTable.tsx
│   │   └── Navbar.tsx
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── db.ts
│   │   ├── qrcode.ts
│   │   ├── copyCode.ts
│   │   ├── permissions.ts
│   │   └── apiResponse.ts
│   └── styles/
│       └── globals.css
└── tests/
    ├── borrow.test.ts
    └── return.test.ts
```

------

## 21. 关键工具函数

### 21.1 `generateCopyCode`

位置：

```text
src/lib/copyCode.ts
```

功能：

根据分类、书目 ID、副本序号生成实体书编号。

示例：

```ts
export function generateCopyCode(category: string, bookId: number, copyIndex: number): string {
  const safeCategory = category || "OTHER";
  const bookPart = String(bookId).padStart(3, "0");
  const copyPart = String(copyIndex).padStart(2, "0");
  return `CHEM-${safeCategory}-${bookPart}-${copyPart}`;
}
```

### 21.2 `parseCopyCodeFromQrText`

功能：

从二维码内容中解析实体书编号。

输入可能是：

```text
CHEM-ORG-001-01
https://your-domain.com/book-copy/CHEM-ORG-001-01
```

输出：

```text
CHEM-ORG-001-01
```

### 21.3 `requireAuth`

功能：

检查当前用户是否登录。

### 21.4 `requireAdmin`

功能：

检查当前用户是否为管理员。

### 21.5 `createAuditLog`

功能：

写入操作日志。

------

## 22. 借书 API 伪代码

```ts
async function borrowBook(userId: number, copyCode: string) {
  return await prisma.$transaction(async (tx) => {
    const copy = await tx.bookCopy.findUnique({
      where: { copyCode },
    });

    if (!copy) {
      throw new Error("实体书不存在");
    }

    if (copy.status !== "AVAILABLE") {
      throw new Error("这本书当前不可借");
    }

    const record = await tx.borrowRecord.create({
      data: {
        userId,
        bookCopyId: copy.id,
        borrowedAt: new Date(),
        dueAt: addDays(new Date(), 30),
        status: "BORROWED",
      },
    });

    await tx.bookCopy.update({
      where: { id: copy.id },
      data: { status: "BORROWED" },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: "BORROW_BOOK",
        targetType: "BookCopy",
        targetId: copy.copyCode,
        detail: `用户借出实体书 ${copy.copyCode}`,
      },
    });

    return record;
  });
}
```

------

## 23. 还书 API 伪代码

```ts
async function returnBook(userId: number, role: "USER" | "ADMIN", copyCode: string) {
  return await prisma.$transaction(async (tx) => {
    const copy = await tx.bookCopy.findUnique({
      where: { copyCode },
    });

    if (!copy) {
      throw new Error("实体书不存在");
    }

    const record = await tx.borrowRecord.findFirst({
      where: {
        bookCopyId: copy.id,
        returnedAt: null,
        status: "BORROWED",
      },
    });

    if (!record) {
      throw new Error("这本书当前没有未归还记录");
    }

    if (role !== "ADMIN" && record.userId !== userId) {
      throw new Error("这本书不是由你借出的，请联系管理员");
    }

    await tx.borrowRecord.update({
      where: { id: record.id },
      data: {
        returnedAt: new Date(),
        status: "RETURNED",
      },
    });

    await tx.bookCopy.update({
      where: { id: copy.id },
      data: { status: "AVAILABLE" },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: "RETURN_BOOK",
        targetType: "BookCopy",
        targetId: copy.copyCode,
        detail: `用户归还实体书 ${copy.copyCode}`,
      },
    });

    return true;
  });
}
```

------

## 24. 开发任务拆分

### Task 1：初始化项目

- 创建 Next.js TypeScript 项目；
- 安装 Prisma；
- 安装数据库驱动；
- 安装认证依赖；
- 安装扫码和二维码依赖；
- 配置 ESLint 和 Prettier；
- 创建 `.env.example`。

推荐依赖：

```bash
npm install @prisma/client prisma
npm install bcryptjs
npm install html5-qrcode
npm install qrcode
npm install zod
npm install date-fns
npm install xlsx
```

如果使用 NextAuth：

```bash
npm install next-auth
```

开发依赖：

```bash
npm install -D @types/bcryptjs @types/qrcode
```

------

### Task 2：实现数据库模型

- 编写 `prisma/schema.prisma`；
- 创建 User、Book、BookCopy、BorrowRecord、AuditLog；
- 创建枚举类型；
- 执行数据库迁移；
- 编写 seed 脚本创建管理员账号和示例书籍。

------

### Task 3：实现认证系统

- 用户注册；
- 用户登录；
- 用户退出；
- 密码哈希；
- 登录状态保持；
- `requireAuth`；
- `requireAdmin`。

------

### Task 4：实现普通用户页面

- 首页；
- 图书列表；
- 图书详情；
- 实体书详情；
- 当前借阅；
- 历史记录；
- 扫码借书页面；
- 扫码还书页面。

------

### Task 5：实现扫码组件

- 创建 `QRScanner.tsx`；
- 使用 `html5-qrcode`；
- 支持扫码成功回调；
- 支持摄像头权限错误提示；
- 支持手动输入实体书编号；
- 扫码成功后自动停止摄像头。

------

### Task 6：实现借书和还书 API

- `POST /api/borrow`；
- `POST /api/return`；
- 使用数据库事务；
- 校验登录状态；
- 校验实体书状态；
- 写入借阅记录；
- 修改实体书状态；
- 写入操作日志；
- 返回统一 JSON。

------

### Task 7：实现管理员后台

- 管理员首页；
- 书目管理；
- 实体书管理；
- 借阅记录管理；
- 用户管理；
- 强制归还；
- 标记损坏；
- 标记丢失。

------

### Task 8：实现二维码生成和打印

- 为每个 BookCopy 生成二维码 URL；
- 在实体书管理页面展示二维码；
- 创建二维码打印页面；
- 打印页面包含书名、编号、二维码；
- 支持浏览器打印。

------

### Task 9：实现 Excel 导入导出

- 管理员上传 Excel；
- 解析书单；
- 批量创建 Book 和 BookCopy；
- 导出图书清单；
- 导出当前借出列表；
- 导出历史借阅记录。

------

### Task 10：测试和修复

测试重点：

- 用户注册登录；
- 普通用户不能访问管理员页面；
- 管理员可以访问管理员页面；
- 可借书可以被借出；
- 已借出的书不能再次借出；
- 普通用户只能归还自己借的书；
- 管理员可以强制归还；
- 借还书后 BookCopy 状态正确；
- 借还书后 BorrowRecord 正确；
- 借还书后 AuditLog 正确；
- 搜索和筛选正常；
- 手机端扫码正常；
- HTTPS 下摄像头权限正常。

------

## 25. 验收标准

项目完成后应满足以下条件：

### 25.1 用户侧

- 用户可以注册和登录；
- 用户可以在手机上打开网页；
- 用户可以扫码借书；
- 用户可以扫码还书；
- 用户可以搜索图书；
- 用户可以查看某本书是否可借；
- 用户可以查看自己当前借了哪些书；
- 用户可以查看自己的历史借阅记录。

### 25.2 管理员侧

- 管理员可以登录后台；
- 管理员可以新增书目；
- 管理员可以新增实体书副本；
- 管理员可以生成二维码；
- 管理员可以查看所有书籍状态；
- 管理员可以查看当前借出列表；
- 管理员可以看到借阅人和借阅时间；
- 管理员可以查看历史借阅记录；
- 管理员可以标记损坏和丢失；
- 管理员可以强制归还；
- 管理员可以导入和导出数据。

### 25.3 数据一致性

- 一本实体书同一时间不能被多人借出；
- 借书成功后状态必须变成 `BORROWED`；
- 还书成功后状态必须变成 `AVAILABLE`；
- 每次借还书都必须生成 BorrowRecord 或更新 BorrowRecord；
- 每次重要操作都必须写入 AuditLog。

------

## 26. 后续扩展方向

未来可以继续扩展：

```text
1. 接入学校统一身份认证
2. 邮箱或企业微信超期提醒
3. 图书预约功能
4. 图书推荐功能
5. 借阅排行榜
6. 热门书籍统计
7. 多教室、多书柜、多校区管理
8. 图书封面上传
9. 支持手机端 PWA
10. 支持离线缓存
11. 支持管理员扫码盘点库存
12. 支持损坏赔偿记录
```

------

## 27. 版权与资料类型说明

系统需要支持不同资料类型：

```text
正版书
影印资料
内部讲义
同学整理资料
其他资料
```

对应字段：

```text
sourceType = ORIGINAL | PHOTOCOPY | HANDOUT | INTERNAL | OTHER
```

系统本身只负责借阅管理，不负责判断资料版权状态。若存在影印版材料，应仅在校内内部场景中谨慎管理，并遵守学校规定和相关版权要求。

------

## 28. Codex 实现要求

请 Codex 按以下优先级实现：

1. 先完成数据库模型和认证；
2. 再完成普通用户借还书闭环；
3. 再完成管理员查看当前借出列表；
4. 再完成图书管理；
5. 再完成二维码打印；
6. 最后完成 Excel 导入导出和高级筛选。

不要一开始过度设计。第一版必须保证：

```text
登录
书目管理
实体书管理
扫码借书
扫码还书
借阅记录查询
管理员后台
```

这几个核心功能稳定可用。

------

## 29. 最小可运行版本定义

最小可运行版本只需要以下页面和 API：

### 页面

```text
/login
/register
/
/books
/books/[id]
/book-copy/[copyCode]
/borrow/scan
/return/scan
/me/borrowed
/admin
/admin/books
/admin/copies
/admin/borrow-records
```

### API

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/books
GET  /api/books/:id
GET  /api/book-copies/:copyCode
POST /api/borrow
POST /api/return
GET  /api/me/borrowed
GET  /api/admin/borrow-records
POST /api/admin/books
POST /api/admin/book-copies
```

实现完这些后，系统即可投入试用。

------

## 30. 最终交付物

项目最终应交付：

```text
1. 可运行的 Next.js 项目代码
2. Prisma 数据库模型
3. 数据库迁移文件
4. seed 示例数据
5. README 部署说明
6. .env.example 环境变量模板
7. 管理员账号初始化方式
8. 二维码打印页面
9. 手机端扫码借还书页面
10. 管理员后台页面
```