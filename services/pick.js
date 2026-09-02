const { showError, toast } = require('../utils/errors.js');

let cachedUser = null;

function getCurrentUser() {
  if (cachedUser) return Promise.resolve(cachedUser);
  return wx.cloud.callFunction({ name: 'login' })
    .then((res) => {
      cachedUser = (res.result && res.result.user) || {};
      return cachedUser;
    })
    .catch(() => ({}));
}

function resolveConfirmBy(user) {
  return user.familyRole || user.nickname || '家人';
}

function callRandomPick(params) {
  return wx.cloud.callFunction({ name: 'randomPick', data: params })
    .then((res) => res.result)
    .catch((err) => {
      showError('pick', err);
      return null;
    });
}

function confirmHome(dishes, combo) {
  const db = wx.cloud.database();
  return getCurrentUser()
    .then((user) => db.collection('pick_history').add({
      data: {
        type: 'home',
        combo,
        dishIds: dishes.map((d) => d.id),
        dishNames: dishes.map((d) => d.name),
        confirmBy: resolveConfirmBy(user),
        createdAt: Date.now()
      }
    }))
    .then(() => {
      toast('记下了');
      return true;
    })
    .catch((err) => {
      showError('pick', err);
      return false;
    });
}

function confirmJackpot(restaurant) {
  const db = wx.cloud.database();
  return getCurrentUser()
    .then((user) => db.collection('pick_history').add({
      data: {
        type: 'jackpot',
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        confirmBy: resolveConfirmBy(user),
        createdAt: Date.now()
      }
    }))
    .then(() => {
      toast('记下了');
      return true;
    })
    .catch((err) => {
      showError('pick', err);
      return false;
    });
}

function confirmOutside(candidate) {
  const db = wx.cloud.database();
  return getCurrentUser()
    .then((user) => db.collection('pick_history').add({
      data: {
        type: 'outside',
        restaurantId: candidate.id,
        restaurantName: candidate.title,
        confirmBy: resolveConfirmBy(user),
        createdAt: Date.now()
      }
    }))
    .then(() => {
      toast('记下了');
      return true;
    })
    .catch((err) => {
      showError('pick', err);
      return false;
    });
}

module.exports = { callRandomPick, confirmHome, confirmJackpot, confirmOutside };
