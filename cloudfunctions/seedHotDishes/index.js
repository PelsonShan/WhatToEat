const cloud = require('wx-server-sdk');
const hotDishes = require('./hot-dishes.js');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async () => {
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
  return { inserted, total: hotDishes.length };
};
