App({
  onLaunch: function() {

    let used = wx.getStorageSync("used")
    console.log(`是否已使用过本小程序:${used}`)

    if (!used) {
      wx.showModal({
        title: '使用须知',
        content: '可乐喜剧小程序购票取票服务由互动吧提供，当点击购票取票按钮时将询问是否跳转至互动吧小程序，请点击允许，以保证您正常购票取票。',
        showCancel:false,
        success(res) {
          if (res.confirm) {
            wx.setStorageSync("used", true)
          } 
        }
      })
    }

  }
})