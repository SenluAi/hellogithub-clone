# HelloGitHub

官方站点：https://hellogithub.com/ ｜ 线上地址：https://hellogithub.senlinlu.cn
特点：列表页、详情页（`site/repo/`）、标签页（`site/tag/`）、榜单页（`site/rank/`）全部指向站内，没有外链死链。

## 目录速览

| 路径 | 作用 |
| --- | --- |
| `site/` | 部署目录（index.html + repo/ + tag/ + rank/ + assets/），`wrangler deploy` 直接发布 |
| `details.json` | 所有项目的详情数据（抓自详情页 `__NEXT_DATA__`），是详情页和标签页的数据源 |
| `detail-raw/` | 详情页原始 HTML 缓存，已抓过的不重复抓 |
| `rank-ym-data.json` | 榜单数据（按年月抓取）：每个月份的月度榜项目列表 |
| `update.js` | 一键自动更新（核心脚本） |
| `extract.js` | 从 `detail-raw/` 重新提取 `details.json` |
| `build-detail.js` | 生成 `site/repo/*.html` 详情页 |
| `build-tags.js` | 生成 `site/tag/*.html` 标签页 + 标签索引，并改写详情页标签链接 |
| `build-tags2.js` | 用真实标签重建首页侧栏「热门标签」（含“全部标签”入口） |
| `build-rank-ym.js` | 生成榜单页：`site/rank/index.html`（总览）、`monthly.html`（月度索引）、`monthly-YYYY-MM.html`（逐月）、`yearly.html`、`yearly-YYYY.html`（逐年）、`weekly.html`（周榜） |
| `run-update.cmd` | 手动运行入口（可透传参数，如 `run-update.cmd --force`） |
| `backup/` | 每次更新前自动备份 `details.json` 和首页，只保留最近 7 份 |
| `update-log.txt` | 本地运行时的完整日志 |

## 榜单页说明

- 月度榜按「月份」拆分：2017 年 1 月 ~ 2026 年 9 月共 117 个月，每个月一页（`rank/monthly-YYYY-MM.html`），页内标注月份并带年份、月份切换。
- 年度榜按「年份」拆分：2017 ~ 2026 共 10 年，每年一页（`rank/yearly-YYYY.html`）。
- 周榜、榜单总览各自成页；首页顶部「最新 / 月度 / 年度」导航均指向站内页面。

## 手动更新

```bat
cd /d "C:\Users\Mr Li\Desktop\hellogithub-clone"
node update.js                :: 有新项目才更新并部署
node update.js --force        :: 即使没有新增也重建并部署
node update.js --no-deploy    :: 只构建、本地校验，不部署（试运行）
```

## 定时自动更新（云端，电脑不用开机）

已从「本地 Windows 计划任务」改为「Cloudflare 云端定时」，本地那个任务已删除。

| 项目 | 值 |
| --- | --- |
| 定时器 | Cron Worker `hellogithub-clone-cron`，cron `0 1 * * *`（UTC 01:00 = 北京 09:00，每天一次） |
| Worker 地址 | https://hellogithub-clone-cron.78816306.workers.dev |
| Worker 源码 | `…\Desktop\hellogithub-clone-cron\`（`cron-worker.js` + `wrangler.toml`，独立于本仓库） |
| 部署挂钩 | Workers → hellogithub-clone → 设置 → 构建 → 部署挂钩 `cron-daily`（分支 main） |
| 构建命令 | `node update.js --no-deploy`（抓新内容 → 重建页面 → 校验） |
| 部署命令 | `npx wrangler deploy` |

触发链：Cron Worker 到点 → POST 部署挂钩 → Cloudflare Workers Builds 拉本仓库 `main` → 跑构建命令 → 校验通过才 `wrangler deploy`；校验不过构建失败，线上保持上一个成功版本。

- **手动触发一次**：浏览器打开 `https://hellogithub-clone-cron.78816306.workers.dev/?key=<ADMIN_KEY>`，或在构建页面点部署挂钩。
- **看结果**：Cloudflare 面板 → Workers & Pages → hellogithub-clone → 构建（每次构建的完整日志）；只有本地运行时才写 `update-log.txt`。
- **改频率**：改 `hellogithub-clone-cron\wrangler.toml` 里的 `crons`（UTC 时间），再 `npx wrangler deploy`。
- **回滚**：面板里把上一个成功构建重新部署，或本地 `git checkout` 后手动 `wrangler deploy`。

更新流程：抓官方列表 → 比对本地 `details.json` 找出新增 → 抓新项目详情页 → 重建详情页/标签页/榜单页
→ 首页插入新卡片（站内链接）→ 校验（死链、失效链接为 0 才继续）→ 部署 → 线上校验。
任何一步校验不过就停止部署，并把改动前的文件留在 `backup/` 里可回滚。

> 注：构建脚本里的路径一律基于脚本自身目录（`__dirname`），本地和云端构建目录不同也能跑，改动脚本时别写死绝对路径。
