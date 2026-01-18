const app = getApp()

Page({
  data: {
  },

  onLoad() {
  },

  onGetUserInfo(e) {
    if (e.detail.userInfo) {
      // 用户同意授权
      wx.showLoading({
        title: '登录中...'
      })

      // 保存用户信息到本地存储
      wx.setStorageSync('userInfo', e.detail.userInfo)
      
      // 更新全局数据
      const app = getApp()
      app.globalData.userInfo = e.detail.userInfo

      // 执行登录流程
      app.autoLogin().then(() => {
        wx.hideLoading()
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        })

        // 跳转到首页
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          })
        }, 1000)
      }).catch(err => {
        wx.hideLoading()
        wx.showToast({
          title: '登录失败',
          icon: 'none'
        })
        console.error('登录失败', err)
      })
    } else {
      // 用户拒绝授权
      wx.showToast({
        title: '授权失败',
        icon: 'none'
      })
      
      // 用户拒绝授权后，可能需要返回上一页或停留在授权页面
      // 这里我们暂时停留在授权页面，让用户可以重新尝试授权
    }
  }
})