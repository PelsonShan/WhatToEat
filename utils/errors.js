const CACHE_KEYS = {
  dishes: 'cache:dishes',
  restaurants: 'cache:restaurants',
  hotDishes: 'cache:hot_dishes',
  history: 'cache:pick_history',
  users: 'cache:users'
};

function toast(message) {
  wx.showToast({ title: message, icon: 'none' });
}

function showError(scope, err) {
  const message = scope === 'location'
    ? '请开启定位'
    : scope === 'lbs'
      ? '暂时不可用'
      : '稍后重试';
  toast(message);
  console.error(`[${scope}]`, err);
}

function cacheGet(key) {
  try {
    return wx.getStorageSync(CACHE_KEYS[key]);
  } catch (err) {
    return null;
  }
}

function cacheSet(key, value) {
  try {
    wx.setStorageSync(CACHE_KEYS[key], value);
  } catch (err) {
    // 存储失败不影响主流程
  }
}

module.exports = { showError, toast, cacheGet, cacheSet };
