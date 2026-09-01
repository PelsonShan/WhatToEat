const pickService = require('../../services/pick.js');
const { isJackpotAllowed, jackpotRate } = require('../../utils/time.js');
const { getLocation } = require('../../services/lbs.js');

function getShichen(hour) {
  const names = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  return `${names[Math.floor(((hour + 1) % 24) / 2)]}时`;
}

Page({
  data: {
    mode: 'home',
    combos: ['一菜一汤', '两菜一汤', '三菜一汤', '自由单点'],
    combo: '三菜一汤',
    jackpotAllowed: false,
    jackpotRateText: '',
    loading: false,
    result: null,
    resultType: '',
    selectedCandidate: null,
    pickSource: 'home',
    confirmed: false,
    locationGranted: false,
    statusBarHeight: 20,
    shichen: '巳时'
  },

  onLoad() {
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: info.statusBarHeight || 20,
      shichen: getShichen(new Date().getHours())
    });
    if (this.getTabBar) this.getTabBar().setData({ selected: 0 });
    const now = new Date();
    const allowed = isJackpotAllowed(now);
    const rate = jackpotRate(now);
    this.setData({
      jackpotAllowed: allowed,
      jackpotRateText: allowed ? `${Math.round(rate * 100)}%` : ''
    });
  },

  onShow() {
    if (this.getTabBar) this.getTabBar().setData({ selected: 0 });
  },

  onModeTap(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({
      mode,
      result: null,
      resultType: '',
      selectedCandidate: null,
      confirmed: false
    });
  },

  onComboTap(e) {
    const combo = e.currentTarget.dataset.combo;
    this.setData({ combo });
  },

  startPick() {
    if (this.data.loading) return;
    this.setData({
      loading: true,
      result: null,
      resultType: '',
      selectedCandidate: null,
      confirmed: false
    });
    pickService.callRandomPick({ mode: 'home', combo: this.data.combo })
      .then((res) => {
        if (!res) return;
        this.setData({
          result: res,
          resultType: res.jackpot ? 'jackpot' : 'dishes',
          pickSource: 'home'
        });
      })
      .finally(() => this.setData({ loading: false }));
  },

  startJackpot() {
    if (this.data.loading) return;
    this.setData({
      loading: true,
      result: null,
      resultType: '',
      selectedCandidate: null,
      confirmed: false
    });
    pickService.callRandomPick({ mode: 'jackpot' })
      .then((res) => {
        if (!res) return;
        const isJackpot = !!res.jackpot;
        this.setData({
          result: res,
          resultType: isJackpot ? 'jackpot' : (res.dishes ? 'dishes' : ''),
          pickSource: isJackpot ? 'jackpot' : 'home'
        });
      })
      .finally(() => this.setData({ loading: false }));
  },

  async startOutside() {
    if (this.data.loading) return;
    const location = await getLocation();
    if (!location) return;
    this.setData({
      loading: true,
      result: null,
      resultType: '',
      selectedCandidate: null,
      confirmed: false,
      locationGranted: true
    });
    pickService.callRandomPick({ mode: 'outside', location: { latitude: location.latitude, longitude: location.longitude } })
      .then((res) => {
        if (!res) return;
        this.setData({
          result: res,
          resultType: 'outside',
          selectedCandidate: res.candidates && res.candidates.length ? res.candidates[0] : null
        });
      })
      .finally(() => this.setData({ loading: false }));
  },

  reroll() {
    if (this.data.resultType === 'jackpot') {
      if (this.data.pickSource === 'home') {
        this.startPick();
      } else {
        this.startJackpot();
      }
    } else if (this.data.resultType === 'outside') {
      this.startOutside();
    } else {
      this.startPick();
    }
  },

  confirm() {
    if (this.data.confirmed) {
      wx.showToast({ title: '已确认过啦', icon: 'none' });
      return;
    }
    let promise;
    if (this.data.resultType === 'jackpot') {
      const restaurant = this.data.result && this.data.result.restaurant;
      promise = restaurant
        ? pickService.confirmJackpot(restaurant)
        : Promise.resolve(false);
    } else if (this.data.resultType === 'outside') {
      const candidate = this.data.selectedCandidate;
      promise = candidate ? pickService.confirmOutside(candidate) : Promise.resolve(false);
    } else if (this.data.result && this.data.result.dishes) {
      promise = pickService.confirmHome(this.data.result.dishes, this.data.combo);
    } else {
      promise = Promise.resolve(false);
    }
    this.setData({ confirmed: true });
    promise.then((ok) => {
      if (!ok) this.setData({ confirmed: false });
    });
  },

  openNavigation() {
    const target = this.data.resultType === 'jackpot'
      ? this.data.result.restaurant
      : this.data.selectedCandidate;
    if (!target) return;
    const loc = target.location || {};
    wx.openLocation({
      latitude: Number(loc.latitude || loc.lat),
      longitude: Number(loc.longitude || loc.lng),
      name: target.name || target.title,
      address: target.address || ''
    });
  },

  selectCandidate(e) {
    const id = e.currentTarget.dataset.id;
    const candidate = this.data.result.candidates.find((c) => c.id === id);
    if (candidate) this.setData({ selectedCandidate: candidate });
  }
});
