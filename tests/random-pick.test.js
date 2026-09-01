const test = require('node:test');
const assert = require('node:assert/strict');
const {
  composeMeal,
  scoreByHistory,
  pickRestaurant,
  pickOutsideCandidates
} = require('../utils/random-pick.js');

const NOW = Date.UTC(2026, 0, 20, 12, 0, 0);
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function dish(id, name, category) {
  return { id, name, category };
}

test('24h 内确认过的菜权重为 0，候选充足时不选', () => {
  const dishes = [
    dish('a', '红烧肉', '主菜'),
    dish('b', '清蒸鱼', '主菜'),
    dish('c', '番茄汤', '汤')
  ];
  const history = [{ dishIds: ['a'], createdAt: NOW - HOUR }];
  assert.equal(scoreByHistory(history, 'a', NOW), 0);
  assert.equal(scoreByHistory(history, 'b', NOW), 1);
  const result = composeMeal(dishes, history, '一菜一汤', NOW);
  assert.ok(result.dishes.some((d) => d.id !== 'a'));
});

test('3-7 天权重 0.5，7 天以上权重 1', () => {
  assert.equal(scoreByHistory([{ dishIds: ['a'], createdAt: NOW - 4 * DAY }], 'a', NOW), 0.5);
  assert.equal(scoreByHistory([{ dishIds: ['a'], createdAt: NOW - 8 * DAY }], 'a', NOW), 1);
});

test('一菜一汤返回 1 主菜 + 1 汤且不重复', () => {
  const dishes = [
    dish('a', '红烧肉', '主菜'),
    dish('b', '清蒸鱼', '主菜'),
    dish('c', '番茄汤', '汤'),
    dish('d', '排骨汤', '汤')
  ];
  const result = composeMeal(dishes, [], '一菜一汤', NOW);
  assert.equal(result.dishes.filter((d) => d.category === '主菜').length, 1);
  assert.equal(result.dishes.filter((d) => d.category === '汤').length, 1);
  assert.equal(new Set(result.dishes.map((d) => d.id)).size, 2);
});

test('24h 内吃过导致候选不足时放宽并提示 relaxed', () => {
  const dishes = [
    dish('a', '红烧肉', '主菜'),
    dish('b', '清蒸鱼', '主菜'),
    dish('c', '番茄汤', '汤')
  ];
  const history = [{ dishIds: ['a'], createdAt: NOW - HOUR }];
  const result = composeMeal(dishes, history, '两菜一汤', NOW);
  assert.equal(result.dishes.length, 3);
  assert.equal(result.relaxed, true);
});

test('无汤时返回 soupMissing', () => {
  const dishes = [dish('a', '红烧肉', '主菜'), dish('b', '清蒸鱼', '主菜')];
  const result = composeMeal(dishes, [], '一菜一汤', NOW);
  assert.equal(result.dishes.length, 1);
  assert.equal(result.soupMissing, true);
});

test('pickRestaurant 最近确认过的馆子不会先被选中', () => {
  const restaurants = [{ id: 'r1', name: '老店' }, { id: 'r2', name: '新店' }];
  const history = [{ restaurantId: 'r1', createdAt: NOW - HOUR }];
  const result = pickRestaurant(restaurants, history, NOW, () => 0);
  assert.equal(result.id, 'r2');
});

test('pickOutsideCandidates 收藏优先且返回 3 家', () => {
  const pois = [
    { id: 'p1', title: '甲' },
    { id: 'p2', title: '乙' },
    { id: 'p3', title: '丙' },
    { id: 'p4', title: '丁' }
  ];
  const result = pickOutsideCandidates(pois, ['p2'], [], NOW, 3, () => 0);
  assert.equal(result.length, 3);
  assert.equal(result[0].id, 'p2');
});
