const { showError, toast } = require('../utils/errors.js');

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
  return db.collection('pick_history').add({
    data: {
      type: 'home',
      combo,
      dishIds: dishes.map((d) => d.id),
      dishNames: dishes.map((d) => d.name),
      confirmBy: '',
      createdAt: Date.now()
    }
  }).then(() => toast('记下了')).catch((err) => showError('pick', err));
}

function confirmJackpot(restaurant) {
  const db = wx.cloud.database();
  return db.collection('pick_history').add({
    data: {
      type: 'jackpot',
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      confirmBy: '',
      createdAt: Date.now()
    }
  }).then(() => toast('记下了')).catch((err) => showError('pick', err));
}

function confirmOutside(candidate) {
  const db = wx.cloud.database();
  return db.collection('pick_history').add({
    data: {
      type: 'outside',
      restaurantId: candidate.id,
      restaurantName: candidate.title,
      confirmBy: '',
      createdAt: Date.now()
    }
  }).then(() => toast('记下了')).catch((err) => showError('pick', err));
}

module.exports = { callRandomPick, confirmHome, confirmJackpot, confirmOutside };
