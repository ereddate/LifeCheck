const api = require('./api.js');

App({
  onLaunch() {
    // 初始化应用，使用Flask后端服务
    console.log('应用启动，使用Flask后端服务');
    
    // 检查是否有已保存的用户登录信息
    const savedUser = wx.getStorageSync('currentUser');
    if (savedUser) {
      this.globalData.currentUser = savedUser;
    }
    
    // 小程序自动更新功能
    this.handleAutoUpdate();
  },

  // 处理小程序自动更新
  handleAutoUpdate() {
    const updateManager = wx.getUpdateManager()
    
    updateManager.onCheckForUpdate(function (res) {
      // 请求完新版本信息的回调
      if (res.hasUpdate) {
        console.log("发现新版本，准备下载")
      }
    })
    
    updateManager.onUpdateReady(function () {
      // 新的版本已经下载好，提示用户重启应用
      wx.showModal({
        title: '更新提示',
        content: '新版本已准备好，是否重启应用？',
        success: function (res) {
          if (res.confirm) {
            // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
            updateManager.applyUpdate()
          }
        }
      })
    })
    
    updateManager.onUpdateFailed(function () {
      // 新的版本下载失败
      console.log("新版本下载失败")
    })
  },

  // 检查是否已登录
  isLogin() {
    const currentUser = wx.getStorageSync('currentUser')
    return !!currentUser
  },

  // 自动登录（如果之前已登录）
  autoLogin() {
    return new Promise((resolve, reject) => {
      const currentUser = wx.getStorageSync('currentUser')
      if (currentUser) {
        this.globalData.currentUser = currentUser;
        resolve(currentUser);
      } else {
        reject(new Error('未登录'));
      }
    });
  },

  // 使用用户名和密码登录
  login(credentials) {
    return new Promise((resolve, reject) => {
      api.login(credentials)
        .then(response => {
          if (response.success && response.user) {
            // 保存用户信息到全局和本地存储
              const user = response.user;
              // 确保用户对象包含头像字段
              if (!user.avatar_url) {
                user.avatar_url = '/images/default-avatar.png';
              }
              this.globalData.currentUser = user;
              wx.setStorageSync('currentUser', user);
            resolve(user);
          } else {
            reject(new Error(response.error || '登录失败'));
          }
        })
        .catch(error => {
          console.error('登录失败', error);
          reject(error);
        });
    });
  },

  // 注册新用户
  register(userData) {
    return new Promise((resolve, reject) => {
      api.register(userData)
        .then(response => {
          if (response.success && response.user) {
            // 注册成功后自动登录
            const user = response.user;
            // 确保用户对象包含头像字段
            if (!user.avatar_url) {
              user.avatar_url = '/images/default-avatar.png';
            }
            this.globalData.currentUser = user;
            wx.setStorageSync('currentUser', user);
            resolve(user);
          } else {
            reject(new Error(response.error || '注册失败'));
          }
        })
        .catch(error => {
          console.error('注册失败', error);
          reject(error);
        });
    });
  },

  // 登出
  logout() {
    wx.removeStorageSync('currentUser');
    this.globalData.currentUser = null;
  },
  
  globalData: {
    currentUser: null  // 当前登录用户信息
  }
})