const { getCurrentUser, listUsers, updateUser, listHistory } = require('../../services/profile.js');

function formatTime(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function historyLabel(item) {
  if (item.type === 'outside') return `在外 · ${item.restaurantName || '馆子'}`;
  if (item.type === 'jackpot') return `大奖 · ${item.restaurantName || '馆子'}`;
  const names = item.dishNames || [];
  return names.length ? names.join('、') : '一餐家常饭';
}

Page({
  data: {
    currentUser: null,
    users: [],
    history: [],
    statusBarHeight: 20
  },

  onShow() {
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.setData({ statusBarHeight: info.statusBarHeight || 20 });
    if (this.getTabBar) this.getTabBar().setData({ selected: 3 });
    wx.showShareMenu({ menus: ['shareAppMessage'] });
    this.load();
  },

  onShareAppMessage() {
    return {
      title: '来一起决定今天吃什么',
      path: '/pages/index/index'
    };
  },

  load() {
    getCurrentUser().then((currentUser) => {
      this.setData({ currentUser });
      return listUsers();
    }).then((users) => this.setData({
      users: users.map((u) => ({
        ...u,
        initial: u.familyRole || (u.nickname ? Array.from(u.nickname)[0] : '家')
      }))
    }));
    listHistory().then((history) => {
      this.setData({
        history: history.map((item) => ({
          ...item,
          timeText: formatTime(item.createdAt),
          label: historyLabel(item),
          who: item.confirmBy && !/^o[A-Za-z0-9_-]{20,}$/.test(item.confirmBy)
            ? item.confirmBy
            : '家人'
        }))
      });
    });
  },

  editRole() {
    const current = this.data.currentUser;
    if (!current) return;
    wx.showModal({
      title: '家人称呼',
      editable: true,
      placeholderText: '如：爸爸、妈妈、仔',
      content: current.familyRole,
      success: (res) => {
        if (!res.confirm || !res.content || !res.content.trim()) return;
        const role = res.content.trim();
        updateUser(current._id, { familyRole: role }).then((ok) => {
          if (ok) {
            this.setData({
              currentUser: { ...current, familyRole: role },
              users: this.data.users.map((u) => (u._id === current._id ? { ...u, familyRole: role } : u))
            });
          }
        });
      }
    });
  }
});
