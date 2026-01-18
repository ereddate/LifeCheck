App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: wx.CLOUD_DYNAMICS_CURRENT_ENV,
        traceUser: true
      })
    }
    
    // 尝试自动登录
    this.autoLogin()
  },

  // 检查是否已登录
  isLogin() {
    const openid = wx.getStorageSync('openid')
    return !!openid
  },

  /* 
  // 验证登录状态
  validateLogin() {
    return new Promise((resolve, reject) => {
      // 先检查本地是否有 openid
      const openid = wx.getStorageSync('openid')
      if (!openid) {
        // 本地没有 openid，肯定是未登录
        reject(new Error('No openid stored'))
        return
      }

      // 如果本地有 openid，尝试调用云函数验证登录状态
      wx.cloud.callFunction({
        name: 'getOpenid',
        data: {},
        success: (result) => {
          // 云函数调用成功，说明登录有效
          // 同时更新全局数据
          this.globalData.openid = result.result.openid
          resolve(result.result.openid)
        },
        fail: (error) => {
          // 云函数调用失败，说明登录无效或网络问题
          // 清除本地存储的 openid，防止后续操作使用无效的登录状态
          wx.removeStorageSync('openid')
          this.globalData.openid = undefined
          
          console.error('验证登录状态失败', error)
          reject(error)
        }
      })
    })
  },
  */

  // 跳转到授权页面
  redirectToAuth() {
    wx.navigateTo({
      url: '/pages/auth/auth'
    })
  },
  
  autoLogin() {
    // 检查是否已经登录过
    const openid = wx.getStorageSync('openid')
    if (openid) {
      // 已经登录过，直接设置全局变量
      this.globalData.openid = openid
      return Promise.resolve(openid)
    }
    
    // 未登录，执行登录流程
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (res.code) {
            // 通过云函数获取openid
            wx.cloud.callFunction({
              name: 'getOpenid',
              data: {},
              success: (result) => {
                const openid = result.result.openid
                wx.setStorageSync('openid', openid)
                this.globalData.openid = openid
                resolve(openid)
              },
              fail: (error) => {
                console.error('获取openid失败', error)
                reject(error)
              }
            })
          } else {
            console.error('登录失败！' + res.errMsg)
            reject(new Error('登录失败'))
          }
        },
        fail: (error) => {
          console.error('调用wx.login失败', error)
          reject(error)
        }
      })
    })
  },

  // 登录并保存用户信息
  loginWithUserInfo() {
    return new Promise((resolve, reject) => {
      // 先执行常规登录
      this.autoLogin().then(openid => {
        // 检查是否已有用户信息
        const userInfo = wx.getStorageSync('userInfo')
        if (userInfo) {
          this.globalData.userInfo = userInfo
          resolve({ openid, userInfo })
        } else {
          // 如果没有用户信息，需要引导用户授权
          reject(new Error('需要用户授权'))
        }
      }).catch(err => {
        reject(err)
      })
    })
  },
  
  globalData: {
    openid: null
  }
})