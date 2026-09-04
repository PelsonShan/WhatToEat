const { showError, cacheGet, cacheSet } = require('../utils/errors.js');

const MANAGE_FOOD_FN = 'manageFood';

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function queryByName(collection, keyword) {
  const db = wx.cloud.database();
  const limit = 100;
  if (!keyword) {
    return db.collection(collection).orderBy('createdAt', 'desc').limit(limit).get();
  }
  const reg = db.RegExp({ regexp: escapeRegExp(keyword), options: 'i' });
  return db.collection(collection).where({ name: reg }).limit(limit).get();
}

function listDishes(keyword) {
  return queryByName('dishes', keyword).then((res) => {
    cacheSet('dishes', res.data);
    return res.data;
  }).catch((err) => {
    showError('db', err);
    return cacheGet('dishes') || [];
  });
}

function listRestaurants(keyword) {
  return queryByName('restaurants', keyword).then((res) => {
    cacheSet('restaurants', res.data);
    return res.data;
  }).catch((err) => {
    showError('db', err);
    return cacheGet('restaurants') || [];
  });
}

function addDish(data) {
  return wx.cloud.database().collection('dishes').add({
    data: {
      name: data.name,
      category: data.category || '主菜',
      cuisine: data.cuisine || '',
      frequent: !!data.frequent,
      source: 'manual',
      createdAt: Date.now()
    }
  }).then(() => true).catch((err) => {
    showError('db', err);
    return false;
  });
}

function addRestaurant(data) {
  return wx.cloud.database().collection('restaurants').add({
    data: {
      name: data.name,
      address: data.address || '',
      location: data.location || null,
      frequent: !!data.frequent,
      note: data.note || '',
      createdAt: Date.now()
    }
  }).then(() => true).catch((err) => {
    showError('db', err);
    return false;
  });
}

function updateItem(collection, id, data) {
  return wx.cloud.database().collection(collection).doc(id).update({ data })
    .then(() => true)
    .catch((err) => {
      showError('db', err);
      return false;
    });
}

function removeItem(collection, id) {
  const removeByCloud = wx.cloud.callFunction({
    name: MANAGE_FOOD_FN,
    data: { action: 'remove', collection, id }
  }).then((res) => !!(res.result && res.result.ok));

  const removeDirect = () => wx.cloud.database().collection(collection).doc(id).remove()
    .then(() => true)
    .catch(() => false);

  return removeByCloud
    .then((ok) => ok || removeDirect())
    .then((ok) => {
      if (ok) {
        const list = cacheGet(collection) || [];
        cacheSet(collection, list.filter((item) => item._id !== id));
      } else {
        showError('db', new Error('removeItem failed'));
      }
      return ok;
    })
    .catch(() => {
      showError('db', new Error('removeItem failed'));
      return false;
    });
}

function listHotDishes() {
  return wx.cloud.database().collection('hot_dishes').limit(100).get()
    .then((res) => {
      cacheSet('hotDishes', res.data);
      return res.data;
    })
    .catch((err) => {
      showError('db', err);
      return cacheGet('hotDishes') || [];
    });
}

function importHotDish(hotDish) {
  const db = wx.cloud.database();
  return db.collection('dishes').where({ name: hotDish.name }).get()
    .then((res) => {
      if (res.data.length) {
        wx.showToast({ title: '已在食单', icon: 'none' });
        return false;
      }
      return db.collection('dishes').add({
        data: {
          name: hotDish.name,
          category: hotDish.category || '主菜',
          cuisine: hotDish.cuisine || '',
          frequent: false,
          source: 'imported',
          createdAt: Date.now()
        }
      }).then(() => {
        wx.showToast({ title: '已加入', icon: 'success' });
        return true;
      });
    })
    .catch((err) => {
      showError('db', err);
      return false;
    });
}

module.exports = {
  listDishes,
  listRestaurants,
  addDish,
  addRestaurant,
  updateItem,
  removeItem,
  listHotDishes,
  importHotDish
};
