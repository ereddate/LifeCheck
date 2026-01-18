const api = require('../../api.js');

Page({
  data: {
    userInfo: {
      nickname: '',
      phone: '',
      avatarUrl: ''
    },
    tempNickname: '',
    tempPhone: ''
  },

  onLoad() {
    this.loadUserInfo();
  },

  // 加载用户信息
  loadUserInfo() {
    this.ensureLogin().then((userId) => {
      api.getUserInfo(userId)
        .then(userInfo => {
          this.setData({
            userInfo: {
              nickname: userInfo.nickname || userInfo.username,
              phone: userInfo.phone || '',
              avatarUrl: userInfo.avatar_url || '/images/default-avatar.png'
            },
            tempNickname: userInfo.nickname || userInfo.username,
            tempPhone: userInfo.phone || ''
          });
        })
        .catch(err => {
          console.error('获取用户信息失败', err);
          wx.showToast({
            title: '获取用户信息失败',
            icon: 'none'
          });
        });
    }).catch(err => {
      console.error('未登录无法获取用户信息', err);
    });
  },

  // 输入昵称
  onNicknameInput(e) {
    this.setData({
      tempNickname: e.detail.value
    });
  },

  // 输入手机号
  onPhoneInput(e) {
    this.setData({
      tempPhone: e.detail.value
    });
  },

  // 保存用户信息
  saveUserInfo() {
    const { tempNickname, tempPhone } = this.data;
    
    // 验证手机号格式
    if (tempPhone && !/^1[3-9]\d{9}$/.test(tempPhone)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      });
      return;
    }

    this.ensureLogin().then((userId) => {
      wx.showLoading({
        title: '保存中...'
      });

      api.updateUserInfo(userId, {
        nickname: tempNickname,
        phone: tempPhone
      })
        .then(response => {
          wx.hideLoading();
          
          if (response.success) {
            wx.showToast({
              title: response.message || '保存成功',
              icon: 'success'
            });

            // 更新本地数据
            this.setData({
              userInfo: {
                ...this.data.userInfo,
                nickname: tempNickname,
                phone: tempPhone
              }
            });
          } else {
            wx.showToast({
              title: response.error || '保存失败',
              icon: 'none'
            });
          }
        })
        .catch(err => {
          wx.hideLoading();
          console.error('更新用户信息失败', err);
          wx.showToast({
            title: '保存失败',
            icon: 'none'
          });
        });
    }).catch(err => {
      console.error('未登录无法保存用户信息', err);
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
    });
  },

  // 确保用户已登录
  ensureLogin() {
    return new Promise((resolve, reject) => {
      const app = getApp();
      if (app.globalData.currentUser) {
        // 已登录
        resolve(app.globalData.currentUser.id);
      } else {
        // 未登录，跳转到登录页面
        wx.redirectTo({
          url: '/pages/auth/auth'
        });
        reject(new Error('未登录'));
      }
    });
  }
});