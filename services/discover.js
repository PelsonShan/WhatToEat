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
  return Promise.all([listHotDishes(), listDishes('')])
    .then(([hot, existing]) => {
      const names = new Set(existing.map((d) => d.name));
      return hot.filter((d) => !names.has(d.name)).slice(0, 6);
    });
}

module.exports = { favoriteRestaurant, noveltyCandidates, importHotDish };
