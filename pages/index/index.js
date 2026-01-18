const db = wx.cloud.database()
const _ = db.command

Page({
  data: {
    checkinList: [],
    filterType: 'all',
    totalCount: 0,
    todayCount: 0,
    streakDays: 0
  },

  onLoad() {
    // 确保用户已登录
    this.ensureLogin().then(() => {
      this.loadCheckinList()
      this.loadStats()
    }).catch(err => {
      console.error('登录失败', err)
    })
  },

  onShow() {
    // 仅检查登录状态，不重复加载数据
    // 数据在onLoad时已加载，无需每次显示都重新加载
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

  loadCheckinList() {
    const { filterType } = this.data
    const where = filterType === 'all' ? {} : { type: filterType }

    db.collection('checkin_tasks')
      .where(where)
      .orderBy('createTime', 'desc')
      .get()
      .then(res => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const list = res.data.map(item => {
          const lastCheckTime = new Date(item.lastCheckTime)
          const isToday = lastCheckTime >= today
          return {
            ...item,
            checkedToday: isToday,
            lastCheckTime: this.formatTime(item.lastCheckTime),
            typeName: this.getTypeName(item.type)
          }
        })
        
        this.setData({ checkinList: list })
      })
      .catch(err => {
        console.error('加载打卡列表失败', err)
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
      })
  },

  loadStats() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    db.collection('checkin_tasks')
      .count()
      .then(res => {
        this.setData({ totalCount: res.total })
      })

    db.collection('checkin_records')
      .where({
        checkTime: _.gte(today)
      })
      .count()
      .then(res => {
        this.setData({ todayCount: res.total })
      })

    db.collection('checkin_stats')
      .doc('user_stats')
      .get()
      .then(res => {
        this.setData({ streakDays: res.data.streakDays || 0 })
      })
      .catch(() => {})
  },

  switchFilter(e) {
    this.ensureLogin().then(() => {
      const type = e.currentTarget.dataset.type
      this.setData({ filterType: type }, () => {
        this.loadCheckinList()
      })
    }).catch(err => {
      console.error('未登录无法切换筛选', err)
    })
  },

  goToDetail(e) {
    this.ensureLogin().then(() => {
      const id = e.currentTarget.dataset.id
      wx.navigateTo({
        url: `/pages/detail/detail?id=${id}`
      })
    }).catch(err => {
      console.error('未登录无法跳转详情', err)
    })
  },

  doCheckin(e) {
    this.ensureLogin().then(() => {
      const id = e.currentTarget.dataset.id
      wx.cloud.callFunction({
        name: 'doCheckin',
        data: { taskId: id }
      }).then(() => {
        wx.showToast({
          title: '打卡成功',
          icon: 'success'
        })
        this.loadCheckinList()
        this.loadStats()
        
        // 打卡成功后询问是否提醒好友
        this.askToRemindFriends()
      }).catch(err => {
        wx.showToast({
          title: '打卡失败',
          icon: 'none'
        })
      })
    }).catch(err => {
      console.error('未登录无法打卡', err)
    })
  },

  // 询问是否提醒好友
  askToRemindFriends() {
    this.ensureLogin().then(() => {
      wx.showModal({
        title: '打卡成功',
        content: '是否分享给好友，让他们知道你已打卡？',
        confirmText: '分享提醒',
        cancelText: '暂不提醒',
        success: (res) => {
          if (res.confirm) {
            // 引导用户分享给好友
            this.shareToFriends()
          }
        }
      })
    }).catch(err => {
      console.error('未登录无法提醒好友', err)
    })
  },

  // 分享给好友
  shareToFriends() {
    // 显示分享菜单，让用户主动分享
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage'], // 只显示分享给朋友选项
      success: () => {
        // 设置分享内容
        wx.onShareAppMessage(() => {
          return {
            title: '我刚刚完成了今日打卡，你也来试试吧！',
            path: '/pages/index/index',
            imageUrl: '/images/share-image.jpg' // 如果有分享图片的话
          }
        })
        
        // 提示用户进行分享操作
        wx.showToast({
          title: '点击右上角分享给好友',
          icon: 'none',
          duration: 2000
        })
      },
      fail: () => {
        wx.showToast({
          title: '分享功能暂不可用',
          icon: 'none'
        })
      }
    })
  },

  getTypeName(type) {
    const typeMap = {
      'daily': '每日',
      'weekly': '每周',
      'monthly': '每月'
    }
    return typeMap[type] || '每日'
  },

  formatTime(timestamp) {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days < 7) return `${days}天前`
    
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${month}月${day}日`
  }
})