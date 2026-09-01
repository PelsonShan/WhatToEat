const cloud = require('wx-server-sdk');
const hotDishes = require('./hot-dishes.js');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

const COLLECTIONS = ['users', 'dishes', 'restaurants', 'hot_dishes', 'pick_history'];

async function ensureCollections() {
  const created = [];
  for (const name of COLLECTIONS) {
    try {
      await db.createCollection(name);
      created.push(name);
    } catch (err) {
      // 集合已存在时忽略
    }
  }
  return created;
}

exports.main = async () => {
  const created = await ensureCollections();
  const col = db.collection('hot_dishes');
  const existing = await col.field({ name: true }).limit(1000).get();
  const names = new Set(existing.data.map((d) => d.name));
  const missing = hotDishes
    .filter((dish) => !names.has(dish.name))
    .map((dish) => ({ ...dish, createdAt: Date.now() }));

  let inserted = 0;
  const chunkSize = 20;
  for (let i = 0; i < missing.length; i += chunkSize) {
    await col.add({ data: missing.slice(i, i + chunkSize) });
    inserted += Math.min(chunkSize, missing.length - i);
  }
  return { inserted, total: hotDishes.length, created };
};
