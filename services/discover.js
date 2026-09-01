const { listHotDishes, listDishes, importHotDish } = require('./dishes.js');

function favoriteRestaurant(poi) {
  const db = wx.cloud.database();
  return db.collection('restaurants').add({
    data: {
      name: poi.title,
      address: poi.address || '',
      location: poi.location || null,
      poiId: poi.id,
      frequent: false,
      note: poi.category ? `来自${poi.category}` : '',
      createdAt: Date.now()
    }
  }).then(() => {
    wx.showToast({ title: '已收藏', icon: 'success' });
    return true;
  }).catch((err) => {
    wx.showToast({ title: '稍后重试', icon: 'none' });
    return false;
  });
}

function noveltyCandidates() {
  const db = wx.cloud.database();
  const _ = db.command;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return Promise.all([
    listHotDishes(),
    listDishes(''),
    db.collection('pick_history')
      .where({ createdAt: _.gt(weekAgo) })
      .field({ dishNames: true })
      .limit(100)
      .get()
  ])
    .then(([hot, existing, recent]) => {
      const names = new Set(existing.map((d) => d.name));
      (recent.data || []).forEach((record) => {
        (record.dishNames || []).forEach((name) => names.add(name));
      });
      const candidates = hot.filter((d) => !names.has(d.name));
      const shuffled = candidates.slice().sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 6);
    });
}

module.exports = { favoriteRestaurant, noveltyCandidates, importHotDish };
