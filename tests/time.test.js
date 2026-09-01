const test = require('node:test');
const assert = require('node:assert/strict');
const { isJackpotAllowed, jackpotRate } = require('../utils/time.js');

function at(day, hour) {
  return new Date(2026, 0, 4 + day, hour, 0, 0, 0);
}

test('周五 16:00 不允许触发超级大奖', () => {
  assert.equal(isJackpotAllowed(at(5, 16)), false);
  assert.equal(jackpotRate(at(5, 16)), 0);
});

test('周五 18:00 允许且按晚餐档 40%', () => {
  assert.equal(isJackpotAllowed(at(5, 18)), true);
  assert.equal(jackpotRate(at(5, 18)), 0.4);
});

test('周六午餐 12:00 概率 15%', () => {
  assert.equal(isJackpotAllowed(at(6, 12)), true);
  assert.equal(jackpotRate(at(6, 12)), 0.15);
});

test('周六晚餐 19:00 概率 40%', () => {
  assert.equal(jackpotRate(at(6, 19)), 0.4);
});

test('周日 10:00 概率 25%', () => {
  assert.equal(jackpotRate(at(0, 10)), 0.25);
});
