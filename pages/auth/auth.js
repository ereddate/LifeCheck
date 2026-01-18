// pages/auth/auth.js
Page({
  data: {
    isRegister: false, // 是否显示注册表单
    username: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    email: '',
    referrerId: null  // 推荐人ID
  },

  onLoad(options) {
    // 处理从分享链接传入的推荐人ID
    if (options.referrer_id) {
      this.setData({
        referrerId: parseInt(options.referrer_id)
      });
    }
  },

  // 切换到登录界面
  switchToLogin() {
    this.setData({
      isRegister: false
    });
  },

  // 切换到注册界面
  switchToRegister() {
    this.setData({
      isRegister: true
    });
  },

  // 输入框事件处理
  onUsernameInput(event) {
    this.setData({
      username: event.detail.value
    });
  },

  onPasswordInput(event) {
    this.setData({
      password: event.detail.value
    });
  },

  onConfirmPasswordInput(event) {
    this.setData({
      confirmPassword: event.detail.value
    });
  },

  onNicknameInput(event) {
    this.setData({
      nickname: event.detail.value
    });
  },

  onEmailInput(event) {
    this.setData({
      email: event.detail.value
    });
  },

  // 处理登录表单提交
  handleLogin(event) {
    const formData = event.detail.value;
    
    if (!formData.username || !formData.password) {
      wx.showToast({
        title: '请输入用户名和密码',
        icon: 'none'
      });
      return;
    }

    // 显示加载提示
    wx.showLoading({
      title: '登录中...'
    });

    // 调用app中的登录方法
    const app = getApp();
    app.login(formData)
      .then(user => {
        wx.hideLoading();
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });

        // 跳转到首页
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/add/add'
          });
        }, 1500);
      })
      .catch(error => {
        wx.hideLoading();
        wx.showToast({
          title: error.message || '登录失败',
          icon: 'none'
        });
      });
  },

  // 处理注册表单提交
  handleRegister(event) {
    const formData = event.detail.value;
    
    // 验证必填字段
    if (!formData.username || !formData.password) {
      wx.showToast({
        title: '请输入用户名和密码',
        icon: 'none'
      });
      return;
    }

    // 验证密码长度
    if (formData.password.length < 6) {
      wx.showToast({
        title: '密码长度至少6位',
        icon: 'none'
      });
      return;
    }

    // 验证两次密码输入是否一致
    if (formData.password !== formData.confirmPassword) {
      wx.showToast({
        title: '两次密码输入不一致',
        icon: 'none'
      });
      return;
    }

    // 准备注册数据
    const registerData = {
      username: formData.username,
      password: formData.password,
      nickname: formData.nickname || formData.username,
      email: formData.email || ''
    };

    // 如果有推荐人ID，添加到注册数据中
    if (this.data.referrerId) {
      registerData.referrer_id = this.data.referrerId;
    }

    // 显示加载提示
    wx.showLoading({
      title: '注册中...'
    });

    // 调用app中的注册方法
    const app = getApp();
    app.register(registerData)
      .then(user => {
        wx.hideLoading();
        wx.showToast({
          title: '注册成功',
          icon: 'success'
        });

        // 注册成功后自动登录，跳转到首页
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/add/add'
          });
        }, 1500);
      })
      .catch(error => {
        wx.hideLoading();
        wx.showToast({
          title: error.message || '注册失败',
          icon: 'none'
        });
      });
  }
});