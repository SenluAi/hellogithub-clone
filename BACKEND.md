# 站点后端说明（账号与云端数据）

复刻站原先是纯静态站，现在加了一层 Cloudflare Worker + D1，用来保存登录账号和用户数据。

## 组成

| 部分 | 位置 | 说明 |
| --- | --- | --- |
| 静态站 | `site/`（708 个文件） | 复刻的 HTML 页面，仍由 Assets 直接返回 |
| Worker 接口 | `src/worker.js` | 处理 `/api/*`，其余请求交给静态资源 |
| 配置 | `wrangler.jsonc` | `main` + `assets` + `d1_databases` 绑定 |
| 数据库 | Cloudflare D1 `hellogithub-clone` | id `922c4ee6-f5c2-4d9f-9367-2ccf76bfeace`（区域 WNAM） |
| 建表脚本 | `migrations/0001_init.sql` | users / sessions / favorites / history |

部署命令：`npx wrangler deploy`（首次需清掉本机代理变量，否则容易失败）。
执行 SQL：`npx wrangler d1 execute hellogithub-clone --remote --file=migrations/0001_init.sql`

## 接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/register` | 注册：`{username, password, nickname}`，账号为 11 位手机号或 4-32 位字母/数字/_.@- |
| POST | `/api/login` | 登录：`{username, password}` |
| POST | `/api/logout` | 退出，清除会话 |
| GET | `/api/me` | 当前登录用户 + 收藏数量 |
| GET | `/api/favorites` | 收藏列表 |
| POST | `/api/favorites` | 添加收藏：`{slug, title, url}` |
| DELETE | `/api/favorites` | 取消收藏：`{slug}` |
| GET | `/api/history` | 最近 100 条阅读记录 |
| POST | `/api/history` | 写入一条阅读记录 |
| GET | `/api/health` | 健康检查 |

会话用 HttpOnly + Secure + SameSite=Lax 的 Cookie（`hg_session`），有效期 30 天；密码用 PBKDF2-SHA256（10 万次迭代 + 每用户随机盐）哈希后存库，不存明文。

## 前端接入点

- `site/login/index.html`：登录 / 注册 / 退出 + 显示「我的收藏」列表。
- `site/index.html`：首页登录入口改为请求 `/api/me`，登录后显示昵称。
- `site/repo/*.html`（124 个项目页）：右下角浮动「☆ 收藏」按钮，登录用户打开页面时自动记录阅读历史。
- 注入脚本：`inject-login.js`（登录状态）、`inject-auth.js`（收藏按钮 + 首页状态，幂等可重跑）。

## 注意

- 数据保存到云端，换设备、换浏览器都能看到收藏和阅读记录。
- 未登录仍可正常浏览全站，点收藏会自动跳到登录页。
- 密码不提供找回功能（没有邮件/短信服务），忘记密码只能换账号。
