App({
  globalData: {
    cloudEnv: 'cloud1-d5gw1tslx7c0e25ab'
  },

  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 以上基础库');
      return;
    }
    wx.cloud.init({
      env: this.globalData.cloudEnv,
      traceUser: true
    });
  }
});
