const db = wx.cloud.database()

Page({
  data: {
    friendList: []
  },

  onLoad() {
    // 确保用户已登录
    this.ensureLogin().then(() => {
      this.loadFriendList()
    }).catch(err => {
      console.error('登录失败', err)
    })
  },

  onShow() {
    // 仅检查登录状态，不重复加载好友列表
    // 好友列表在onLoad时已加载，无需每次显示都重新加载
    this.ensureLogin().then(() => {
      // 如果需要刷新数据，可以在这里添加适当的条件判断
    }).catch(err => {
      console.error('登录失败', err)
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

  loadFriendList() {
    // 默认值：如果没有获取到数据或出错，显示提示信息
    const defaultFriendList = []
    
    // 从云数据库获取好友列表
    // 这里假设有一个存储好友关系的集合
    db.collection('friends_list')
      .where({
        _openid: db.command.eq(wx.getStorageSync('openid') || '') // 假设用户已登录并存储了openid
      })
      .get()
      .then(res => {
        if (res.data && res.data.length > 0) {
          // 如果有好友数据，查询他们的打卡情况
          const friendIds = res.data.map(friend => friend.openid)
          
          // 查询好友的打卡记录
          db.collection('checkin_tasks')
            .where({
              _openid: db.command.in(friendIds)
            })
            .get()
            .then(tasksRes => {
              // 整理好友打卡数据
              const friendList = res.data.map(friend => {
                const task = tasksRes.data.find(t => t._openid === friend.openid)
                return {
                  id: friend.openid || Math.random().toString(36).substr(2, 9),
                  name: friend.nickName || '好友',
                  avatar: friend.avatarUrl || 'https://thirdwx.qlogo.cn/mmopen/vi_32/DYAIOgq83epDKDibiaKksKn3licpT2k2Q5XiaicvHkiciaYRJia2iaicY5iaia8iajZMibYx4m2h87ia8aJibqic7iaiaaia2oQ2ibicQ/132',
                  lastCheckTime: task?.lastCheckTime ? this.formatTime(task.lastCheckTime) : '未打卡'
                }
              })
              
              this.setData({
                friendList: friendList.length > 0 ? friendList : defaultFriendList
              })
            })
            .catch(err => {
              console.error('获取好友打卡记录失败', err)
              // 即使获取好友打卡记录失败，也显示好友列表
              const friendList = res.data.map(friend => ({
                id: friend.openid || Math.random().toString(36).substr(2, 9),
                name: friend.nickName || '好友',
                avatar: friend.avatarUrl || 'https://thirdwx.qlogo.cn/mmopen/vi_32/DYAIOgq83epDKDibiaKksKn3licpT2k2Q5XiaicvHkiciaYRJia2iaicY5iaia8iajZMibYx4m2h87ia8aJibqic7iaiaaia2oQ2ibicQ/132',
                lastCheckTime: '未知'
              }))
              
              this.setData({
                friendList: friendList.length > 0 ? friendList : defaultFriendList
              })
            })
        } else {
          // 没有好友，使用默认值
          this.setData({
            friendList: defaultFriendList
          })
        }
      })
      .catch(err => {
        console.error('获取好友列表失败', err)
        // 错误情况下使用默认值
        this.setData({
          friendList: defaultFriendList
        })
      })
  },

  formatTime(timestamp) {
    if (!timestamp) return '从未打卡'
    
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return '今天'
    if (diffDays === 1) return '昨天'
    if (diffDays < 7) return `${diffDays}天前`
    
    return `${date.getMonth() + 1}月${date.getDate()}日`
  },

  remindFriend(e) {
    this.ensureLogin().then(() => {
      const friendId = e.currentTarget.dataset.id
      const friendName = e.currentTarget.dataset.name
      
      wx.showModal({
        title: '提醒好友',
        content: `确定要提醒 ${friendName} 打卡吗？`,
        success: (res) => {
          if (res.confirm) {
            // 这里可以实现提醒好友的逻辑，比如发送模板消息
            wx.showToast({
              title: '提醒成功',
              icon: 'success'
            })
          }
        }
      })
    }).catch(err => {
      console.error('未登录无法提醒好友', err)
    })
  },

  submitForm() {
    this.ensureLogin().then(() => {
      const now = new Date()
      const hour = now.getHours()
      let title = '今日打卡'

      if (hour < 6) {
        title = '凌晨打卡'
      } else if (hour < 9) {
        title = '早起打卡'
      } else if (hour < 12) {
        title = '上午打卡'
      } else if (hour < 14) {
        title = '中午打卡'
      } else if (hour < 18) {
        title = '下午打卡'
      } else if (hour < 22) {
        title = '晚上打卡'
      } else {
        title = '深夜打卡'
      }

      wx.showLoading({
        title: '打卡中...'
      })

      db.collection('checkin_tasks').add({
        data: {
          title: title,
          type: 'daily',
          description: '坚持打卡，养成好习惯',
          remindTime: '08:00',
          targetDays: 30,
          totalCount: 0,
          streakDays: 0,
          lastCheckTime: null,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      }).then(res => {
        wx.hideLoading()
        wx.showToast({
          title: '打卡成功',
          icon: 'success'
        })
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          })
        }, 1500)
      }).catch(err => {
        wx.hideLoading()
        console.error('打卡失败', err)
        wx.showToast({
          title: '打卡失败',
          icon: 'none'
        })
      })
    }).catch(err => {
      console.error('未登录无法提交表单', err)
    })
  },
  
  onShareAppMessage() {
    return {
      title: '邀请你加入人生打卡计划',
      path: '/pages/index/index',
      imageUrl: '/images/share-image.jpg' // 如果有分享图片的话
    }
  },
  
  onShareTimeline() {
    return {
      title: '坚持打卡，成就更好的自己'
    }
  }
})