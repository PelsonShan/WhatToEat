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
    this.bootstrapCloud();
  },

  bootstrapCloud() {
    if (wx.getStorageSync('seedDone')) return;
    wx.cloud.callFunction({ name: 'seedHotDishes' })
      .then(() => wx.setStorageSync('seedDone', true))
      .catch(() => {
        // 云函数尚未部署或网络异常时静默，下次启动重试
      });
  }
});
