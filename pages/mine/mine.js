const api = require('../../api.js')

Page({
  data: {
    userInfo: {
      nickName: '点击登录',
      avatarUrl: '/images/default-avatar.png'
    },
    stats: {
      totalTasks: 0,
      totalCheckins: 0,
      maxStreak: 0,
      thisMonth: 0,
      friendCount: 0,
      messageCount: 0,
      notCheckedInFriends: 0
    },
    todayTip: '坚持就是胜利，今天也要加油哦！',
    currentUser: null
  },

  onLoad() {
    // 检查登录状态
    this.checkLoginStatus();
  },

  onShow() {
    // 每次进入页面都检查登录状态并刷新数据
    this.checkLoginStatus();
  },

  // 检查登录状态
  checkLoginStatus() {
    const app = getApp();
    if (app.isLogin()) {
      // 已登录，获取用户信息
      this.setData({
        currentUser: app.globalData.currentUser
      });
      this.loadUserData();
    } else {
      // 未登录，跳转到授权页面
      wx.redirectTo({
        url: '/pages/auth/auth'
      });
    }
  },

  // 加载用户数据
  loadUserData() {
    const currentUser = this.data.currentUser;
    if (!currentUser) {
      console.error('未获取到当前用户信息');
      return;
    }

    // 获取用户统计信息
    api.getStats(currentUser.id)
      .then(stats => {
        this.setData({
          'stats.totalCheckins': stats.total_checkins || 0,
          'stats.thisMonth': stats.recent_checkins ? stats.recent_checkins.length : 0
        });
      })
      .catch(err => {
        console.error('获取用户统计数据失败', err);
        this.setData({
          'stats.totalCheckins': 0,
          'stats.thisMonth': 0
        });
      });

    // 设置用户信息
    this.setData({
      userInfo: {
        nickName: currentUser.nickname || currentUser.username,
        avatarUrl: currentUser.avatar_url || '/images/default-avatar.png' // 使用后端返回的头像，否则使用默认头像
      }
    });
  },

  // 头像点击事件 - 已登录时查看个人信息，未登录时跳转到登录
  goToAuth() {
    const app = getApp();
    if (app.isLogin()) {
      // 已登录，可以在这里添加查看个人信息的功能
      wx.showToast({
        title: '您已登录',
        icon: 'none'
      });
      // 或者可以跳转到个人信息编辑页面（如果有的话）
      // wx.navigateTo({
      //   url: '/pages/profile/profile'
      // });
    } else {
      // 未登录，跳转到登录页面
      wx.navigateTo({
        url: '/pages/auth/auth'
      });
    }
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
          
          // 更新页面数据
          this.setData({
            userInfo: {
              nickName: '点击登录',
              avatarUrl: '/images/default-avatar.png'
            },
            stats: {
              totalTasks: 0,
              totalCheckins: 0,
              maxStreak: 0,
              thisMonth: 0,
              friendCount: 0,
              messageCount: 0,
              notCheckedInFriends: 0
            },
            currentUser: null
          });
          
          // 跳转到登录页面
          wx.redirectTo({
            url: '/pages/auth/auth'
          });
        }
      }
    });
  },

  loadStats() {
    this.ensureLogin().then((userId) => {
      // 从Flask后端获取用户统计数据
      api.getStats(userId)
        .then(res => {
          // 更新统计数据
          this.setData({
            'stats.totalCheckins': res.total_checkins || 0,
            'stats.thisMonth': res.recent_checkins ? res.recent_checkins.length : 0
          })
        })
        .catch(err => {
          console.error('获取统计数据失败', err)
        })
    }).catch(err => {
      console.error('未登录无法加载统计数据', err)
    })
  },

  loadTodayTip() {
    // 每日提示，可以随机显示不同的励志语句
    const tips = [
      '坚持就是胜利，今天也要加油哦！',
      '每一个小目标的达成，都是大成就的开始！',
      '今天的努力，是为了明天更好的自己！',
      '千里之行，始于足下，加油！',
      '每一次坚持，都在为未来积累力量！'
    ]
    
    const randomIndex = Math.floor(Math.random() * tips.length)
    this.setData({
      todayTip: tips[randomIndex]
    })
  },

  // 跳转到打卡统计页面
  goToRecords() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  // 跳转到设置页面
  goToSettings() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    });
  },

  // 分享给好友
  onShareAppMessage() {
    const app = getApp();
    const currentUser = app.globalData.currentUser;
    
    let sharePath = '/pages/index/index';
    if (currentUser && currentUser.id) {
      // 包含推荐人ID
      sharePath = `/pages/auth/auth?referrer_id=${currentUser.id}`;
    }
    
    return {
      title: '邀请你加入人生打卡计划',
      path: sharePath,
      imageUrl: '/images/share-image.jpg' // 如果有分享图片的话
    }
  },
  
  // 分享到朋友圈
  onShareTimeline() {
    const app = getApp();
    const currentUser = app.globalData.currentUser;
    
    let sharePath = '/pages/index/index';
    if (currentUser && currentUser.id) {
      // 包含推荐人ID
      sharePath = `/pages/auth/auth?referrer_id=${currentUser.id}`;
    }
    
    return {
      title: '坚持打卡，成就更好的自己',
      query: `referrer_id=${currentUser?.id || ''}`
    }
  },

  goToCheckedHistory(){
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  goToAllFriends(){
    wx.switchTab({  
      url: '/pages/friends/friends'
    });
  },

  goToMessages(){
    wx.navigateTo({
      url: '/pages/messages/messages'
    });
  },

  // 提醒未打卡好友
  remindNotCheckedInFriends() {
    // 先检查登录状态
    const app = getApp();
    if (!app.globalData.currentUser || !app.globalData.currentUser.id) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      // 跳转到登录页面
      wx.redirectTo({
        url: '/pages/auth/auth'
      });
      return;
    }
    
    const userId = app.globalData.currentUser.id;
    
    // 获取未打卡的好友列表
    api.getNotCheckedInFriends(userId)
      .then(friends => {
        if (!friends || friends.length === 0) {
          wx.showToast({
            title: '没有未打卡的好友',
            icon: 'none'
          });
          return;
        }
        
        // 询问是否提醒好友
        wx.showModal({
          title: '提醒未打卡好友',
          content: `发现${friends.length}位好友今天还没打卡，是否提醒他们？`,
          success: (res) => {
            if (res.confirm) {
              // 这里可以实现批量提醒好友的逻辑
              // 目前模拟提醒成功
              wx.showToast({
                title: `已提醒${friends.length}位好友`,
                icon: 'success'
              });
              
              // 刷新统计数据
              this.loadStats();
            }
          }
        });
      })
      .catch(err => {
        console.error('获取未打卡好友列表失败', err);
        wx.showToast({
          title: '获取好友列表失败',
          icon: 'none'
        });
      });
  },

  // 确保用户已登录
  ensureLogin() {
    return new Promise((resolve, reject) => {
      const app = getApp()
      if (app.globalData.currentUser) {
        // 已登录
        resolve(app.globalData.currentUser.id)
      } else {
        // 未登录，跳转到登录页面
        wx.redirectTo({
          url: '/pages/auth/auth'
        })
        reject(new Error('未登录'))
      }
    })
  },

  // 分享功能
  onShareAppMessage() {
    const app = getApp();
    const currentUser = app.globalData.currentUser;
    
    if (currentUser) {
      return {
        title: '一起来打卡吧！',
        path: `/pages/add/add?referrer=${currentUser.id}`, // 传递当前用户的ID作为推荐人
        imageUrl: '/images/share-image.jpg' // 可以自定义分享图片
      };
    } else {
      return {
        title: '人生打卡小程序',
        path: '/pages/add/add',
        imageUrl: '/images/share-image.jpg'
      };
    }
  },

  // 页面显示时检查是否有推荐人参数
  onShow() {
    // 每次进入页面都检查登录状态并刷新数据
    this.checkLoginStatus();
    
    // 获取页面参数
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const options = currentPage.options;
    
    if (options.referrer) {
      // 如果是通过分享链接进入，且当前用户不是推荐人，则尝试建立好友关系
      this.handleReferral(options.referrer);
    }
  },

  // 处理推荐人逻辑
  handleReferral(referrerId) {
    this.ensureLogin().then((currentUserId) => {
      if (parseInt(currentUserId) !== parseInt(referrerId)) {
        // 检查是否已经是好友
        this.checkFriendship(currentUserId, referrerId)
          .then(isFriend => {
            if (!isFriend) {
              // 如果还不是好友，发起添加好友请求
              this.addFriend(parseInt(referrerId));
            }
          })
          .catch(err => {
            console.error('检查好友关系失败', err);
          });
      }
    }).catch(err => {
      console.error('未登录无法处理推荐', err);
    });
  },

  // 检查好友关系
  checkFriendship(userId, friendId) {
    return new Promise((resolve, reject) => {
      api.getFriends(userId)
        .then(friends => {
          const isFriend = friends.some(friend => friend.id === friendId);
          resolve(isFriend);
        })
        .catch(err => {
          reject(err);
        });
    });
  },

  // 添加好友
  addFriend(friendId) {
    // 在这里可以发起好友请求或直接建立好友关系
    // 简化处理：直接建立好友关系
    wx.showModal({
      title: '添加好友',
      content: '您通过分享链接进入了小程序，是否添加分享者为好友？',
      confirmText: '添加',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.ensureLogin().then((userId) => {
            // 调用后端API添加好友关系
            api.addFriend(userId, friendId)
              .then(response => {
                if (response.success) {
                  wx.showToast({
                    title: response.message || '好友添加成功',
                    icon: 'success'
                  });
                } else {
                  wx.showToast({
                    title: response.error || '添加好友失败',
                    icon: 'none'
                  });
                }
              })
              .catch(err => {
                console.error('添加好友失败', err);
                wx.showToast({
                  title: '添加好友失败',
                  icon: 'none'
                });
              });
          });
        }
      }
    });
  }
})