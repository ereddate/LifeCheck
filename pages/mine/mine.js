const db = wx.cloud.database()
const _ = db.command

Page({
  data: {
    userInfo: {
      nickName: '点击登录',
      avatarUrl: '/images/default-avatar.png' // 假设有默认头像
    },
    stats: {
      totalTasks: 0,
      totalCheckins: 0,
      maxStreak: 0,
      thisMonth: 0,
      friendCount: 0,
      notCheckedInFriends: 0
    },
    todayTip: '坚持就是胜利，今天也要加油哦！'
  },

  onLoad() {
    // 确保用户已登录
    this.ensureLogin().then(() => {
      this.loadStats()
      this.loadTodayTip()
    }).catch(err => {
      console.error('登录失败', err)
    })
  },

  onLoad() {
    // 确保用户已登录
    this.ensureLogin().then(() => {
      this.loadStats()
      this.loadTodayTip()
    }).catch(err => {
      console.error('登录失败', err)
    })
    
    // 加载本地用户信息
    this.loadLocalUserInfo()
  },

  onShow() {
    // 每次显示页面时都加载本地用户信息
    this.loadLocalUserInfo()
    
    // 仅检查登录状态，不重复加载统计数据
    // 统计数据在onLoad时已加载，无需每次显示都重新加载
    this.ensureLogin().then(() => {
      // 如果需要刷新数据，可以在这里添加适当的条件判断
    }).catch(err => {
      console.error('登录失败', err)
    })
  },

  // 加载本地用户信息
  loadLocalUserInfo() {
    const userInfo = wx.getStorageSync('userInfo') || {
      nickName: '点击登录',
      avatarUrl: '/images/default-avatar.png'
    }
    this.setData({ userInfo })
  },

  // 跳转到授权页面
  goToAuth() {
    wx.navigateTo({
      url: '/pages/auth/auth'
    })
  },

  // 确保用户已登录
  ensureLogin() {
    return new Promise((resolve, reject) => {
      const app = getApp()
      if (app.globalData.openid) {
        // 已登录
        resolve(app.globalData.openid)
      } else {
        // 未登录，尝试登录
        app.autoLogin().then(openid => {
          resolve(openid)
        }).catch(err => {
          // 登录失败，引导用户授权
          this.navigateToAuth()
          reject(err)
        })
      }
    })
  },

  // 导航到授权页面
  navigateToAuth() {
    wx.navigateTo({
      url: '/pages/auth/auth'
    })
  },

  loadStats() {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    db.collection('checkin_tasks')
      .count()
      .then(res => {
        this.setData({
          'stats.totalTasks': res.total
        })
      })

    db.collection('checkin_records')
      .count()
      .then(res => {
        this.setData({
          'stats.totalCheckins': res.total
        })
      })

    db.collection('checkin_records')
      .where({
        checkTime: _.gte(monthStart)
      })
      .count()
      .then(res => {
        this.setData({
          'stats.thisMonth': res.total
        })
      })

    db.collection('checkin_stats')
      .doc('user_stats')
      .get()
      .then(res => {
        this.setData({
          'stats.maxStreak': res.data.maxStreak || 0
        })
      })
      .catch(() => {})

    // 获取好友统计数据
    this.loadFriendStats()
  },

  loadFriendStats() {
    // 默认值：如果没有获取到数据或出错，显示默认值
    const defaultFriendCount = 0
    const defaultNotCheckedInFriends = 0
    
    // 获取好友总数
    db.collection('friends_list')
      .where({
        _openid: db.command.eq(wx.getStorageSync('openid') || '')
      })
      .count()
      .then(countRes => {
        const friendCount = countRes.total || 0
        
        // 获取未打卡的好友数量
        db.collection('friends_list')
          .where({
            _openid: db.command.eq(wx.getStorageSync('openid') || '')
          })
          .get()
          .then(friendsRes => {
            if (friendsRes.data && friendsRes.data.length > 0) {
              const friendIds = friendsRes.data.map(friend => friend.openid)
              
              // 查询这些好友今天是否已打卡（假设检查今天是否有打卡记录）
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              
              db.collection('checkin_records')
                .where({
                  _openid: db.command.in(friendIds),
                  checkTime: _.gte(today)
                })
                .distinct('_openid')
                .then(checkedInFriendsRes => {
                  const checkedInFriendsCount = checkedInFriendsRes.list ? checkedInFriendsRes.list.length : 0
                  const notCheckedInFriends = friendCount - checkedInFriendsCount
                  
                  this.setData({
                    'stats.friendCount': friendCount,
                    'stats.notCheckedInFriends': Math.max(notCheckedInFriends, 0)
                  })
                })
                .catch(err => {
                  console.error('获取已打卡好友数失败', err)
                  this.setData({
                    'stats.friendCount': friendCount,
                    'stats.notCheckedInFriends': defaultNotCheckedInFriends
                  })
                })
            } else {
              // 没有好友
              this.setData({
                'stats.friendCount': friendCount,
                'stats.notCheckedInFriends': defaultNotCheckedInFriends
              })
            }
          })
          .catch(err => {
            console.error('获取好友列表失败', err)
            this.setData({
              'stats.friendCount': defaultFriendCount,
              'stats.notCheckedInFriends': defaultNotCheckedInFriends
            })
          })
      })
      .catch(err => {
        console.error('获取好友总数失败', err)
        this.setData({
          'stats.friendCount': defaultFriendCount,
          'stats.notCheckedInFriends': defaultNotCheckedInFriends
        })
      })
  },

  loadTodayTip() {
    const tips = [
      '坚持就是胜利，今天也要加油哦！',
      '每一个小小的进步，都是成功的基石。',
      '不要等待机会，而要创造机会。',
      '今天的努力，是明天的收获。',
      '自律给我自由，打卡成就更好的自己。',
      '千里之行，始于足下。',
      '不积跬步，无以至千里。',
      '每天进步一点点，成功就在眼前。'
    ]
    const today = new Date().getDate()
    const index = today % tips.length
    this.setData({
      todayTip: tips[index]
    })
  },

  goToRecords() {
    this.ensureLogin().then(() => {
      wx.switchTab({
        url: '/pages/index/index'
      })
    }).catch(err => {
      console.error('未登录无法跳转', err)
    })
  },

  goToAchievements() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  goToSettings() {
    this.ensureLogin().then(() => {
      wx.showActionSheet({
        itemList: ['关于我们', '清除缓存', '联系客服'],
        success: res => {
          if (res.tapIndex === 0) {
            wx.showModal({
              title: '关于我们',
              content: '人生打卡小程序，帮助你养成好习惯，记录每一个重要时刻。',
              showCancel: false
            })
          } else if (res.tapIndex === 1) {
            wx.showLoading({ title: '清除中...' })
            setTimeout(() => {
              wx.hideLoading()
              wx.showToast({
                title: '清除成功',
                icon: 'success'
              })
            }, 1000)
          } else if (res.tapIndex === 2) {
            wx.showModal({
              title: '联系客服',
              content: '如有问题，请添加客服微信：life_checkin',
              showCancel: false
            })
          }
        }
      })
    }).catch(err => {
      console.error('未登录无法进入设置', err)
    })
  },

  // 提醒未打卡好友
  remindNotCheckedInFriends() {
    this.ensureLogin().then(() => {
      // 检查是否有未打卡的好友
      if (this.data.stats.notCheckedInFriends <= 0) {
        wx.showToast({
          title: '没有需要提醒的好友',
          icon: 'none'
        })
        return
      }

      // 提示用户确认提醒操作
      wx.showModal({
        title: '提醒未打卡好友',
        content: `确定要提醒 ${this.data.stats.notCheckedInFriends} 位未打卡的好友吗？`,
        confirmText: '立即提醒',
        cancelText: '暂不提醒',
        success: (res) => {
          if (res.confirm) {
            // 由于微信小程序的限制，无法直接发送模板消息给好友
            // 可以引导用户分享小程序给好友
            wx.showModal({
              title: '提醒好友打卡',
              content: '点击确定分享小程序给未打卡的好友，提醒他们打卡',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  // 调用分享功能，让用户主动分享给好友
                  this.triggerShareToFriends()
                }
              }
            })
          }
        }
      })
    }).catch(err => {
      console.error('未登录无法提醒好友', err)
    })
  },

  // 触发分享给好友
  triggerShareToFriends() {
    // 显示分享菜单，让用户选择分享给好友
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage'], // 只显示分享给朋友选项
      success: () => {
        // 监听用户点击右上角菜单中的转发按钮
        wx.onShareAppMessage(() => {
          return {
            title: '提醒：你今天还没有打卡哦！',
            path: '/pages/index/index',
            imageUrl: '/images/share-image.jpg' // 如果有分享图片的话
          }
        })
      }
    })
  }
})