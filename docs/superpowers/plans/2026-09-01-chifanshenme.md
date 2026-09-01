# “吃什么”小程序 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现一个家人内部使用的微信小程序：今日签随机决定吃什么、食单管理灶下菜品与市井馆子、觅食发现新选择、膳记记录家人与最近吃过。

**Architecture:** 原生微信小程序（WXML/WXSS/JS）+ 微信云开发（云数据库、云函数）。随机与防重复算法抽成纯 JS 模块并做 Node 单元测试；腾讯位置服务通过云函数调用以隐藏 key；页面通过服务层统一调用云函数与数据库。

**Tech Stack:** 微信小程序原生框架、微信云开发、腾讯位置服务 WebService API、Node.js 内置 `node:test`。

**Spec:** [2026-08-31-chifanshenme-design.md](../specs/2026-08-31-chifanshenme-design.md)

## Global Constraints

- Tab 命名固定：今日签、食单、觅食、膳记；页面文案不得出现旧名（吃什么、家常菜、外面餐馆、推荐、发现、我的）。
- 食单分类固定：灶下（菜品）、市井（馆子）；搜索框占位文字为“寻味...”。
- 配色固定：中国红 #9f1d16 / #b3261e，鎏金 #d9a441 / #f2c14e，纸色 #f8ecd0，卡片 #fff7e0，文字 #5a241d / #6b4a35 / #8a5a3b。
- 字体：Songti SC / STSong / KaiTi / STKaiti / SimSun。
- 祥云图案采用“晓”式云朵造型（圆润云身 + 卷尾），不用黑红配色。
- 防重复：24h 内权重 0，24h-3d 20%，3-7d 50%，7d+ 100%；默认全家维度；换一批不写记录，确认才写。
- 超级大奖：周一 00:00-周五 17:00 不触发；其余时间午餐 11-14 为 15%，晚餐 17-21 为 40%，其他 25%。
- 在外面吃：默认 5 公里内，随机一组 3 家，收藏优先。
- 家庭自用，不上架；云数据库默认全员可读写，生产前需收紧权限。

## File Structure

- `app.js` / `app.json` / `app.wxss`：应用入口、tab 配置、全局主题
- `project.config.json` / `sitemap.json`：开发者工具项目配置
- `pages/index/`：今日签
- `pages/foodlist/`：食单
- `pages/discover/`：觅食
- `pages/profile/`：膳记
- `components/seal/`：印章组件
- `utils/random-pick.js`：纯算法（可单测）
- `utils/time.js`：时间窗与日期工具（可单测）
- `services/`：云函数与数据库调用封装
- `data/hot-dishes.js`：内置热门菜品种子数据
- `cloudfunctions/login/`、`cloudfunctions/randomPick/`、`cloudfunctions/lbsSearch/`、`cloudfunctions/seedHotDishes/`
- `tests/random-pick.test.js`、`tests/time.test.js`：Node 单元测试

---

### Task 1: 初始化小程序骨架

**Files:**
- Create: `project.config.json`
- Create: `sitemap.json`
- Create: `app.json`
- Create: `app.js`
- Create: `app.wxss`
- Create: `pages/index/index.{js,json,wxml,wxss}`
- Create: `pages/foodlist/foodlist.{js,json,wxml,wxss}`
- Create: `pages/discover/discover.{js,json,wxml,wxss}`
- Create: `pages/profile/profile.{js,json,wxml,wxss}`
- Modify: `.gitignore`（加入 `cloudfunctions/*/node_modules`）

**Interfaces:**
- Consumes: 无
- Produces: 四个可切换的空 tab 页；`app.js` 调用 `wx.cloud.init({ env: 'your-env-id' })`，env 从 `app.globalData.cloudEnv` 读取

- [ ] **Step 1: 创建项目配置**

`project.config.json` 使用游客 appid 占位，`miniprogramRoot` 指向项目根目录，`cloudfunctionRoot: "cloudfunctions"`。

`app.json`：

```json
{
  "pages": [
    "pages/index/index",
    "pages/foodlist/foodlist",
    "pages/discover/discover",
    "pages/profile/profile"
  ],
  "window": {
    "navigationBarBackgroundColor": "#9f1d16",
    "navigationBarTextStyle": "white",
    "navigationBarTitleText": "今日签",
    "backgroundColor": "#f8ecd0"
  },
  "tabBar": {
    "color": "#6b4a35",
    "selectedColor": "#9f1d16",
    "backgroundColor": "#f8ecd0",
    "borderStyle": "black",
    "list": [
      { "pagePath": "pages/index/index", "text": "今日签" },
      { "pagePath": "pages/foodlist/foodlist", "text": "食单" },
      { "pagePath": "pages/discover/discover", "text": "觅食" },
      { "pagePath": "pages/profile/profile", "text": "膳记" }
    ]
  },
  "sitemapLocation": "sitemap.json"
}
```

- [ ] **Step 2: 创建最小页面**

每个页面 js 只包含 `Page({ data: {} })`，wxml 只包含 `<view class="page">{{title}}</view>`，wxss 设置 `page { background: #f8ecd0; }`。

- [ ] **Step 3: 初始化云开发**

`app.js`：

```js
App({
  globalData: {
    cloudEnv: 'your-env-id'
  },
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 以上基础库');
      return;
    }
    wx.cloud.init({ env: this.globalData.cloudEnv, traceUser: true });
  }
});
```

- [ ] **Step 4: 验证并提交**

在微信开发者工具打开项目，确认四个 tab 可切换、无编译错误。

```bash
git add .
git commit -m "feat: 初始化小程序骨架与四个 Tab"
```

---

### Task 2: 全局中国风主题与静态资源

**Files:**
- Create: `app.wxss`（主题类）
- Create: `components/seal/seal.{js,json,wxml,wxss}`
- Create: `assets/cloud-cream.svg`、`assets/cloud-red.svg`

**Interfaces:**
- Produces: 全局类 `.cn-font`、`.seal`、`.btn-primary`、`.btn-outline`；印章组件属性 `text`、`size`

- [ ] **Step 1: 写入全局样式**

`app.wxss` 包含：

```css
page {
  background: #f8ecd0;
  color: #5a241d;
  font-family: "Songti SC", "STSong", "KaiTi", "STKaiti", "SimSun", serif;
}
.cn-font { font-family: "Songti SC", "STSong", "KaiTi", "STKaiti", "SimSun", serif; }
.seal {
  display: inline-block;
  background: #b3261e;
  color: #ffe9b3;
  border: 1px solid #f2c14e;
  border-radius: 4px;
  padding: 2px 7px;
  font-weight: 700;
  transform: rotate(-3deg);
  letter-spacing: 1px;
}
.btn-primary {
  background: #9f1d16;
  color: #f2d9a4;
  border: 2px solid #9f1d16;
  border-radius: 5px;
  text-align: center;
  padding: 18rpx 0;
  font-weight: 700;
}
.btn-outline {
  background: #f8ecd0;
  color: #9f1d16;
  border: 2px solid #9f1d16;
  border-radius: 5px;
  text-align: center;
  padding: 18rpx 0;
  font-weight: 700;
}
```

- [ ] **Step 2: 创建晓云 SVG**

`assets/cloud-cream.svg` 与 `assets/cloud-red.svg` 使用同一路径（圆润云身 + 卷尾），仅填充色不同：cream 用 `#f2d9a4`，red 用 `#c63a2e`。SVG `viewBox="0 0 120 72"`。

- [ ] **Step 3: 创建印章组件**

`components/seal/seal.js` 定义 `properties: { text: String, size: { type: Number, value: 11 } }`，wxml 渲染 `<text class="seal" style="font-size:{{size}}px">{{text}}</text>`。

- [ ] **Step 4: 验证并提交**

在任一页面引用 `<seal text="今日签" />`，确认印章与全局主题生效。

```bash
git add .
git commit -m "feat: 全局中国风主题与印章组件"
```

---

### Task 3: 云开发数据层与内置菜品种子

**Files:**
- Create: `data/hot-dishes.js`
- Create: `cloudfunctions/seedHotDishes/index.js`
- Create: `cloudfunctions/login/index.js`
- Create: `cloudfunctions/login/package.json`

**Interfaces:**
- Consumes: 云环境已初始化（Task 1）
- Produces: `seedHotDishes` 云函数可幂等写入 `hot_dishes`；`login` 返回 `{ openid, user }`

- [ ] **Step 1: 定义内置热门菜品数据**

`data/hot-dishes.js` 导出数组，每条形如：

```js
module.exports = [
  { name: '红烧肉', category: '主菜', cuisine: '川菜', source: 'hot' },
  { name: '清蒸鲈鱼', category: '主菜', cuisine: '粤菜', source: 'hot' },
  { name: '番茄蛋汤', category: '汤', cuisine: '家常', source: 'hot' },
  { name: '阳春面', category: '主食', cuisine: '本帮菜', source: 'hot' }
];
```

至少包含 40 条，覆盖川菜、粤菜、湘菜、本帮菜、家常、火锅、烧烤等菜系，以及主菜/汤/主食三类。

- [ ] **Step 2: 编写种子云函数**

`cloudfunctions/seedHotDishes/index.js` 先按 `name` 查重，不存在才插入，返回 `{ inserted }`。

- [ ] **Step 3: 编写登录云函数**

`cloudfunctions/login/index.js`：

```js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async () => {
  const { OPENID } = cloud.getWXContext();
  const col = db.collection('users');
  const found = await col.where({ openid: OPENID }).get();
  if (found.data.length) return { openid: OPENID, user: found.data[0] };
  const user = { openid: OPENID, nickname: '', avatar: '', familyRole: '', createdAt: Date.now() };
  await col.add({ data: user });
  return { openid: OPENID, user };
};
```

- [ ] **Step 4: 验证并提交**

在开发者工具云开发控制台部署两个云函数；手动触发 `seedHotDishes`，确认 `hot_dishes` 有 40+ 条；触发 `login`，确认 `users` 增加当前 openid。

```bash
git add .
git commit -m "feat: 云开发登录与热门菜品种子数据"
```

---

### Task 4: 时间窗与防重复算法（TDD）

**Files:**
- Create: `utils/time.js`
- Create: `tests/time.test.js`
- Create: `utils/random-pick.js`
- Create: `tests/random-pick.test.js`

**Interfaces:**
- Produces:
  - `isJackpotAllowed(now: Date): boolean`
  - `jackpotRate(now: Date): number`
  - `scoreByHistory(history: Array<{ dishIds: string[], restaurantId?: string, createdAt: number }>, targetId: string, now: number): number`
  - `composeMeal(dishes, history, combo, now, rng = Math.random): Array<{ id, name, category }>`
  - `pickRestaurant(restaurants, history, now, rng = Math.random): object`
  - `pickOutsideCandidates(pois, favoriteIds, history, now, count = 3, rng = Math.random): Array`

- [ ] **Step 1: 写时间窗测试**

`tests/time.test.js` 覆盖：周五 16:00 不允许、周五 18:00 允许且按 17-21 晚餐档、周六午餐 12:00 概率 0.15、周六晚餐 19:00 概率 0.4、周日 10:00 概率 0.25。

- [ ] **Step 2: 运行测试确认失败**

```bash
node --test tests/time.test.js
```

预期 FAIL：`isJackpotAllowed is not a function`。

- [ ] **Step 3: 实现 `utils/time.js`**

```js
function isJackpotAllowed(now) {
  const day = now.getDay();
  if (day >= 1 && day <= 4) return false;
  if (day === 5) return now.getHours() >= 17;
  return true;
}

function jackpotRate(now) {
  if (!isJackpotAllowed(now)) return 0;
  const h = now.getHours();
  if (h >= 11 && h < 14) return 0.15;
  if (h >= 17 && h < 21) return 0.4;
  return 0.25;
}

module.exports = { isJackpotAllowed, jackpotRate };
```

- [ ] **Step 4: 运行测试确认通过**

```bash
node --test tests/time.test.js
```

- [ ] **Step 5: 写防重复与组合测试**

`tests/random-pick.test.js` 覆盖：
1. 24h 内确认过的菜权重为 0，组合不选它（候选充足时）
2. 3-7 天权重 0.5，7 天以上权重 1
3. 一菜一汤返回 1 主菜 + 1 汤，且不重复
4. 候选不足时放宽：只有 2 道可候选仍能凑两菜一汤并提示 `relaxed: true`
5. 无汤时返回 `soupMissing: true`
6. `pickRestaurant` 最近确认过的馆子不会先被选中
7. `pickOutsideCandidates` 收藏 ID 优先且返回 3 家

- [ ] **Step 6: 运行测试确认失败**

```bash
node --test tests/random-pick.test.js
```

- [ ] **Step 7: 实现 `utils/random-pick.js`**

核心实现要点：

```js
const DAY = 24 * 60 * 60 * 1000;

function scoreByHistory(history, targetId, now) {
  let last = 0;
  for (const h of history) {
    const hit = h.dishIds && h.dishIds.includes(targetId);
    const hitRestaurant = h.restaurantId && h.restaurantId === targetId;
    if ((hit || hitRestaurant) && h.createdAt > last) last = h.createdAt;
  }
  if (!last) return 1;
  const age = now - last;
  if (age < DAY) return 0;
  if (age < 3 * DAY) return 0.2;
  if (age < 7 * DAY) return 0.5;
  return 1;
}
```

`composeMeal` 按组合类型定义需求：一菜一汤 = 1 主菜 + 1 汤；两菜一汤 = 2 主菜 + 1 汤；三菜一汤 = 3 主菜 + 1 汤；自由单点 = 1 主菜。按分数加权随机（`score === 0` 的候选在候选充足时排除），同组合不选同一道；某类候选不足时逐级放宽（先允许 3 天内，再全部），并设置 `relaxed: true` 或 `soupMissing: true`。

- [ ] **Step 8: 运行测试确认通过并提交**

```bash
node --test tests/time.test.js tests/random-pick.test.js
git add .
git commit -m "feat: 时间窗与防重复随机算法及单元测试"
```

---

### Task 5: 今日签（在家模式）

**Files:**
- Create: `services/pick.js`
- Modify: `cloudfunctions/randomPick/index.js`
- Modify: `pages/index/index.{js,wxml,wxss,json}`

**Interfaces:**
- Consumes: Task 4 的 `composeMeal`、`scoreByHistory`；Task 2 的主题类
- Produces: 云函数 `randomPick({ mode: 'home', combo })` 返回 `{ dishes, relaxed, soupMissing }`；客户端 `confirmHome(dishes)` 写入 `pick_history`

- [ ] **Step 1: 实现 randomPick 云函数**

云函数读取 `dishes`（灶下）与 `pick_history`，调用 `utils/random-pick.js`（云函数内复制同一算法模块），按 `combo` 返回结果。

- [ ] **Step 2: 实现今日签 UI**

`index.wxml` 包含：模式切换（在家/在外面）、组合 chips、转盘视图、签文卡（菜品标签换行）、换一批 / 确认按钮。转盘用 CSS `conic-gradient` + `transition` 旋转动画；结果卡用 `<view class="dish-chip"><text class="cat">主菜</text>红烧肉</view>` 结构。

- [ ] **Step 3: 接线交互**

`index.js` 处理：
- `onComboTap` 更新选中组合
- `startPick` 调 `randomPick({ mode: 'home', combo })`，成功后显示签文并旋转转盘
- `reroll` 再次调用 `startPick`，不写记录
- `confirm` 调 `services/pick.js#confirmHome` 写入 `pick_history`，成功后提示“记下了”
- 异常时 `wx.showToast({ title: '稍后重试', icon: 'none' })`

- [ ] **Step 4: 验证并提交**

开发者工具手动验证：选择三菜一汤能出 3 主菜 + 1 汤；连续换一批不重复；确认后膳记可读到记录。

```bash
git add .
git commit -m "feat: 今日签在家模式随机流程"
```

---

### Task 6: 超级大奖与在外面吃

**Files:**
- Modify: `cloudfunctions/randomPick/index.js`
- Create: `cloudfunctions/lbsSearch/index.js`
- Create: `services/lbs.js`
- Modify: `pages/index/index.{js,wxml,wxss}`

**Interfaces:**
- Produces: `randomPick({ mode: 'jackpot' })` 返回馆子；`randomPick({ mode: 'outside', location })` 返回 3 家候选；`lbsSearch({ keyword, location })` 返回 POI 数组

- [ ] **Step 1: 实现大奖逻辑**

`randomPick` 在 `mode: 'home'` 时先调 `jackpotRate(new Date())`，按概率进入 `mode: 'jackpot'`；从 `restaurants`（市井）用 `pickRestaurant` 抽一家，返回 `{ jackpot: true, restaurant }`。

- [ ] **Step 2: 实现附近 POI 搜索云函数**

`lbsSearch` 读取环境变量 `TENCENT_LBS_KEY`，调用腾讯位置服务 `/ws/place/v1/explore`（半径 5000，`category: 美食`），返回清洗后的 `{ id, title, address, location, category, rating }` 列表。

- [ ] **Step 3: 实现在外面吃模式**

客户端 `wx.getLocation({ type: 'gcj02' })` 获取坐标，调 `randomPick({ mode: 'outside', location })`；云函数先读收藏的 `restaurants`，再调 `lbsSearch` 并交给 `pickOutsideCandidates` 返回 3 家。每家展示名称、类型、距离、评分，收藏项带“收藏优先”标记。

- [ ] **Step 4: 接入导航与确认**

“导航”调 `wx.openLocation({ latitude, longitude, name, address })`；“选这家”写入 `pick_history`（`type: 'outside'`，`restaurantId`），随后提示并返回结果。

- [ ] **Step 5: 验证并提交**

真机验证定位授权、3 家候选、换一组、导航跳转；无收藏时仍能返回 POI 候选；授权拒绝时只提示且不崩溃。

```bash
git add .
git commit -m "feat: 超级大奖与在外面吃模式"
```

---

### Task 7: 食单页

**Files:**
- Create: `services/dishes.js`
- Modify: `pages/foodlist/foodlist.{js,wxml,wxss}`

**Interfaces:**
- Produces: `getDishes(query)`、`getRestaurants(query)`、`addDish(data)`、`addRestaurant(data)`、`updateItem(collection, id, data)`、`removeItem(collection, id)`、`importHotDish(id)` 供页面使用

- [ ] **Step 1: 实现服务层**

`services/dishes.js` 用 `wx.cloud.database()` 封装 CRUD；列表查询支持按 `name` 正则模糊匹配（寻味搜索）。

- [ ] **Step 2: 实现食单 UI**

顶部“寻味...”输入框；分段切换“灶下 / 市井”；灶下列表显示名称、分类、菜系、常吃印章；市井列表显示名称、地址、常去印章。底部“+ 新增”与“热门导入”按钮。

- [ ] **Step 3: 实现新增/编辑/删除/导入**

新增用半屏弹层表单：灶下菜品字段（名称、分类、菜系、常吃）、市井馆子字段（名称、地址、坐标、常去、备注）。删除前 `wx.showModal` 确认。热门导入弹层展示 `hot_dishes`，点“导入”调 `importHotDish` 复制进 `dishes`（`source: 'imported'`）。

- [ ] **Step 4: 验证并提交**

两个微信账号（或开发者工具 + 真机）分别增删改，确认云端共享与搜索生效。

```bash
git add .
git commit -m "feat: 食单灶下与市井管理"
```

---

### Task 8: 觅食页

**Files:**
- Create: `services/discover.js`
- Modify: `pages/discover/discover.{js,wxml,wxss}`

**Interfaces:**
- Consumes: `lbsSearch`（Task 6）、`hot_dishes`、`pick_history`
- Produces: `favoriteRestaurant(poi)` 写入 `restaurants`；`importToKitchen(dish)` 写入 `dishes`

- [ ] **Step 1: 实现附近好味**

点击“看看附近”后授权定位，调 `lbsSearch` 展示 POI 列表（名称、类型、距离、评分），每项带“收藏”按钮，调 `favoriteRestaurant` 存入市井。

- [ ] **Step 2: 实现四方风味**

展示菜系 chips（川菜、粤菜、湘菜、火锅、烧烤等）；选中菜系后按 `cuisine` 过滤 `hot_dishes`；每项带“加入食单”，调 `importToKitchen`。

- [ ] **Step 3: 实现尝新推荐**

查询 `hot_dishes` 中未出现在 `dishes` 且不在近 7 天 `pick_history` 的菜，随机展示 6 道，可一键加入。

- [ ] **Step 4: 验证并提交**

真机验证附近好味收藏进市井、四方风味导入进灶下、尝新推荐不重复推荐已导入的菜。

```bash
git add .
git commit -m "feat: 觅食附近好味与尝新"
```

---

### Task 9: 膳记页

**Files:**
- Create: `services/profile.js`
- Modify: `pages/profile/profile.{js,wxml,wxss}`

**Interfaces:**
- Consumes: `login`（Task 3）、`pick_history`、`users`

- [ ] **Step 1: 实现用户信息与家人列表**

页面加载调 `login`，展示头像、昵称、家人称呼；查询 `users` 列表，用印章头像展示家人（爸、妈、仔等）。

- [ ] **Step 2: 实现膳录**

按 `createdAt` 倒序查 `pick_history`，显示时间、组合或馆子、确认人；底部落款“一粥一饭 · 当思来处”。

- [ ] **Step 3: 验证并提交**

今日签确认后回到膳记，记录出现在列表顶部。

```bash
git add .
git commit -m "feat: 膳记家人信息与膳录"
```

---

### Task 10: 容错、缓存与验收

**Files:**
- Modify: `services/*.js`、`pages/*/*.js`
- Create: `utils/errors.js`

**Interfaces:**
- Produces: `showError(scope, message)` 统一 toast 与缓存逻辑

- [ ] **Step 1: 实现统一容错**

`utils/errors.js` 封装：云函数失败 toast“稍后重试”；定位拒绝 toast“请开启定位”；LBS 异常时附近好味显示“暂时不可用”但不阻塞其他功能；列表读取失败时从 `wx.setStorageSync` 读缓存。

- [ ] **Step 2: 补齐候选不足提示**

今日签结果卡根据 `relaxed` / `soupMissing` 显示“可选项不多，已放宽防重复”或“库里还没有汤，可去热门导入”。

- [ ] **Step 3: 跑通全部单元测试与验收清单**

```bash
node --test tests/time.test.js tests/random-pick.test.js
```

按设计文档第 8 节验收清单逐项手动验证，并记录结果。

- [ ] **Step 4: 提交**

```bash
git add .
git commit -m "feat: 容错缓存与验收"
```

---

## Self-Review

**Spec coverage:** 今日签组合随机与确认（Task 5）、超级大奖时间窗与概率（Task 4/6）、在外面吃（Task 6）、食单灶下/市井与热门导入（Task 3/7）、觅食附近好味/四方风味/尝新（Task 8）、膳记家人与膳录（Task 9）、中国风视觉（Task 2）、数据模型（Task 3）、防重复算法（Task 4）、容错与测试（Task 10）。无缺口。

**Placeholder scan:** 所有任务均有可执行步骤与验收方式；云环境 ID、腾讯位置服务 key 以配置项占位，实现时通过 `app.globalData.cloudEnv` 与环境变量注入，非未决 TODO。

**Type consistency:** `randomPick` 返回字段 `dishes/restaurant/relaxed/soupMissing/jackpot` 在 Task 5/6 中一致；`pick_history` 字段 `dishIds/restaurantId/createdAt/type` 在 Task 4/5/6/9 中一致。
