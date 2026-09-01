const { showError } = require('../utils/errors.js');

function getLocation() {
  return new Promise((resolve) => {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => resolve(res),
      fail: (err) => {
        showError('location', err);
        resolve(null);
      }
    });
  });
}

function searchNearby(location) {
  return wx.cloud.callFunction({
    name: 'lbsSearch',
    data: { location }
  }).then((res) => res.result && res.result.pois ? res.result.pois : [])
    .catch((err) => {
      showError('lbs', err);
      return [];
    });
}

module.exports = { getLocation, searchNearby };
