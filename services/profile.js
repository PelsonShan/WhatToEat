const { showError, cacheGet, cacheSet } = require('../utils/errors.js');

function getCurrentUser() {
  return wx.cloud.callFunction({ name: 'login' })
    .then((res) => {
      cacheSet('users', [res.result.user]);
      return res.result.user;
    })
    .catch((err) => {
      showError('db', err);
      const cached = cacheGet('users');
      return cached && cached[0] ? cached[0] : null;
    });
}

function listUsers() {
  return wx.cloud.database().collection('users').limit(100).get()
    .then((res) => {
      cacheSet('users', res.data);
      return res.data;
    })
    .catch((err) => {
      showError('db', err);
      return cacheGet('users') || [];
    });
}

function updateUser(userId, data) {
  return wx.cloud.database().collection('users').doc(userId).update({ data })
    .then(() => true)
    .catch((err) => {
      showError('db', err);
      return false;
    });
}

function listHistory() {
  return wx.cloud.database().collection('pick_history')
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get()
    .then((res) => {
      cacheSet('history', res.data);
      return res.data;
    })
    .catch((err) => {
      showError('db', err);
      return cacheGet('history') || [];
    });
}

module.exports = { getCurrentUser, listUsers, updateUser, listHistory };
