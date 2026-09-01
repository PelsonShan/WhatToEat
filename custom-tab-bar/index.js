Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/index/index', text: '今日签' },
      { pagePath: '/pages/foodlist/foodlist', text: '食单' },
      { pagePath: '/pages/discover/discover', text: '觅食' },
      { pagePath: '/pages/profile/profile', text: '膳记' }
    ]
  },

  methods: {
    switchTab(e) {
      const { url, index } = e.currentTarget.dataset;
      this.setData({ selected: index });
      wx.switchTab({ url });
    }
  }
});
