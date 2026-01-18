const api = require('../../api.js');

Page({
  data: {
    userInfo: null,
    showPasswordModal: false  // 控制修改密码弹窗显示
  },

  onLoad() {
    // 获取用户信息
    const app = getApp();
    if (app.globalData.currentUser) {
      this.setData({
        userInfo: app.globalData.currentUser
      });
    }
  },

  // 显示修改密码弹窗
  showChangePasswordModal() {
    this.setData({
      showPasswordModal: true
    });
  },

  // 隐藏修改密码弹窗
  hidePasswordModal() {
    this.setData({
      showPasswordModal: false
    });
  },

  // 修改密码
  changePassword(e) {
    const { oldPassword, newPassword, confirmNewPassword } = e.detail.value;
    
    // 验证输入
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      wx.showToast({
        title: '请填写所有密码字段',
        icon: 'none'
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      wx.showToast({
        title: '新密码与确认密码不一致',
        icon: 'none'
      });
      return;
    }

    if (newPassword.length < 6) {
      wx.showToast({
        title: '新密码长度至少6位',
        icon: 'none'
      });
      return;
    }

    // 获取当前用户ID
    const app = getApp();
    const userId = app.globalData.currentUser?.id;

    if (!userId) {
      wx.showToast({
        title: '用户未登录',
        icon: 'none'
      });
      return;
    }

    // 调用API修改密码
    wx.showLoading({
      title: '修改中...'
    });

    // 这里我们向后端发送修改密码的请求
    wx.request({
      url: 'http://localhost:5000/api/change-password',
      method: 'POST',
      data: {
        user_id: userId,
        old_password: oldPassword,
        new_password: newPassword
      },
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200 && res.data.success) {
          wx.showToast({
            title: '密码修改成功',
            icon: 'success'
          });
          // 关闭弹窗
          this.setData({
            showPasswordModal: false
          });
        } else {
          wx.showToast({
            title: res.data.error || '密码修改失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
      }
    });
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 调用app的登出方法
          const app = getApp();
          app.logout();
          
          // 跳转到登录页面
          wx.redirectTo({
            url: '/pages/auth/auth'
          });
        }
      }
    });
  },

  // 清除缓存
  clearCache() {
    wx.showModal({
      title: '提示',
      content: '确定要清除缓存吗？\n注意：这不会退出登录',
      success: (res) => {
        if (res.confirm) {
          // 只清除非用户数据的缓存
          // 保存当前用户信息
          const app = getApp();
          const currentUser = app.globalData.currentUser;
          
          // 清除所有存储，然后恢复用户信息
          wx.clearStorage({
            success: () => {
              // 恢复用户登录信息
              if (currentUser) {
                wx.setStorageSync('currentUser', currentUser);
                app.globalData.currentUser = currentUser;
              }
              
              wx.showToast({
                title: '缓存已清除',
                icon: 'success'
              });
            }
          });
        }
      }
    });
  }
})