# 吃什么（今日签）微信小程序

一款给家人内部使用的“今天吃什么”决策小程序。把家里常吃的菜和常去的馆子记下来，饭点抽一签，周末还能触发“超级大奖”带家人出去吃。

## 功能

- **今日签**：一菜一汤 / 两菜一汤 / 三菜一汤 / 自由单点，转盘随机出签文；换一批不记录，确认才写入膳录
- **超级大奖**：周一 00:00 - 周五 17:00 不触发；周五晚和周末按午餐 15% / 晚餐 40% / 其他 25% 概率触发，从市井馆子随机一家
- **在外面吃**：授权定位后，按当前位置 5 公里内随机一组 3 家候选，收藏优先，支持换一组与导航
- **食单**：灶下（家常菜）与市井（馆子）两类；支持新增、编辑、删除、搜索“寻味...”和热门菜品一键导入
- **觅食**：附近好味（腾讯位置服务 POI）、四方风味（按菜系浏览热门菜）、尝新推荐（未加入且近 7 天没吃过的热门菜）
- **膳记**：家人信息与印章头像、最近吃过记录、古风落款
- **防重复**：24 小时内权重 0，24h-3d 20%，3-7d 50%，7d+ 100%；默认按全家记录
- **中国风视觉**：中国红 + 鎏金 + 米黄纸，晓式祥云、印章、抽签文案

## 技术栈

- 原生微信小程序（WXML / WXSS / JS）
- 微信云开发（云数据库 + 云函数）
- 腾讯位置服务 WebService API
- Node.js 内置 `node:test` 做单元测试

## 目录结构

```text
.
├── pages/                  # 四个 Tab 页面
│   ├── index/              # 今日签
│   ├── foodlist/           # 食单
│   ├── discover/           # 觅食
│   └── profile/            # 膳记
├── components/seal/        # 印章组件
├── services/               # 云函数与数据库调用封装
├── utils/                  # 时间窗与随机算法、统一错误处理
├── tests/                  # 单元测试
├── assets/                 # 晓式祥云 SVG
├── cloudfunctions/         # 云函数
│   ├── login/              # 用户身份
│   ├── seedHotDishes/      # 内置热门菜种子
│   ├── randomPick/         # 随机与防重复
│   └── lbsSearch/          # 腾讯位置服务 POI 搜索
├── docs/superpowers/       # 设计文档与实现计划
└── project.config.json     # 微信开发者工具配置
```

## 快速开始

1. 用微信开发者工具导入本项目根目录，在 [project.config.json](./project.config.json) 中填入你的 appid。
2. 开通云开发，在 [app.js](./app.js) 中把 `cloudEnv` 替换成你的云环境 ID。
3. 部署云函数：`login`、`seedHotDishes`、`randomPick`、`lbsSearch`。
4. 在云开发控制台创建集合：`users`、`dishes`、`restaurants`、`hot_dishes`、`pick_history`。
5. 手动触发一次 `seedHotDishes`，写入内置热门菜品。
6. 给 `lbsSearch` 配置环境变量 `TENCENT_LBS_KEY`（腾讯位置服务控制台申请）。
7. 真机预览时授权定位；正式给家人使用前，把云数据库权限按“仅创建者/云函数”收紧。

## 测试

```bash
node --test tests/time.test.js tests/random-pick.test.js
```

覆盖：组合抽选、防重复权重、候选不足放宽、汤缺失、大奖时间窗与概率、收藏优先候选。

## 设计文档

- 设计文档：[docs/superpowers/specs/2026-08-31-chifanshenme-design.md](./docs/superpowers/specs/2026-08-31-chifanshenme-design.md)
- 实现计划：[docs/superpowers/plans/2026-09-01-chifanshenme.md](./docs/superpowers/plans/2026-09-01-chifanshenme.md)
