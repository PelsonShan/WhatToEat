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
  let inserted = 0;
  for (const dish of hotDishes) {
    const existing = await col.where({ name: dish.name }).limit(1).get();
    if (existing.data.length) continue;
    await col.add({
      data: {
        ...dish,
        createdAt: Date.now()
      }
    });
    inserted += 1;
  }
  return { inserted, total: hotDishes.length, created };
};
