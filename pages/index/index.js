const api = require('../../api.js')

Page({
  data: {
    checkinList: [],
    filterType: 'all',
    totalCount: 0,
    todayCount: 0,
    streakDays: 0,
    refreshing: false
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

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      refreshing: true
    });

    this.ensureLogin().then(() => {
      // 重新加载数据
      this.loadCheckinList();
      this.loadStats();
    }).catch(err => {
      console.error('刷新失败', err);
      wx.stopPullDownRefresh(); // 停止下拉刷新动画
      this.setData({
        refreshing: false
      });
    });
  },

  // 数据加载完成后停止刷新
  onDataLoaded() {
    if (this.data.refreshing) {
      wx.stopPullDownRefresh(); // 停止下拉刷新动画
      this.setData({
        refreshing: false
      });
    }
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

  // 导航到授权页面
  navigateToAuth() {
    wx.navigateTo({
      url: '/pages/auth/auth'
    })
  },

  loadCheckinList() {
    this.ensureLogin().then((openid) => {
      // 从Flask后端获取用户打卡记录
      api.getUserRecords(openid)
        .then(res => {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          
          // 处理返回的数据格式，使其与原有UI适配
          const list = res.map(item => {
            // 假设后端返回的数据包含打卡任务相关信息
            // 使用 date 字段来判断打卡日期
            let dateStr = item.date;
            if (!dateStr) {
              // 如果没有 date 字段，则使用 create_time 字段
              dateStr = item.create_time;
            }
            
            if (typeof dateStr === 'string' && dateStr.includes(' ')) {
              // 将 "YYYY-MM-DD HH:MM:SS" 转换为 "YYYY/MM/DD HH:MM:SS"
              dateStr = dateStr.replace(/-/g, '/');
            } else if (typeof dateStr === 'string' && !dateStr.includes(' ')) {
              // 如果 dateStr 只包含日期 "YYYY-MM-DD"，则加上时间部分
              dateStr = dateStr.replace(/-/g, '/') + ' 00:00:00';
            }
            
            const lastCheckTime = new Date(dateStr);
            const isToday = lastCheckTime >= today;
            
            return {
              ...item,
              id: item.id,
              title: item.title,
              content: item.content,
              checkedToday: isToday,
              lastCheckTime: this.formatTime(lastCheckTime),
              typeName: this.getTypeName('daily') // 默认类型
            }
          })
          
          this.setData({ checkinList: list })
          this.onDataLoaded(); // 通知数据加载完成
        })
        .catch(err => {
          console.error('加载打卡列表失败', err)
          wx.showToast({
            title: '加载失败',
            icon: 'none'
          })
          this.onDataLoaded(); // 即使失败也要停止刷新
        })
    }).catch(err => {
      console.error('未登录无法加载列表', err)
      this.onDataLoaded(); // 即使失败也要停止刷新
    })
  },

  loadStats() {
    this.ensureLogin().then((openid) => {
      // 从Flask后端获取用户统计数据
      api.getStats(openid)
        .then(res => {
          // 更新统计数据
          this.setData({ 
            totalCount: res.total_checkins || 0,
            todayCount: res.recent_checkins ? res.recent_checkins.length : 0,
            streakDays: res.streakDays || 0
          })
          this.onDataLoaded(); // 通知数据加载完成
        })
        .catch(err => {
          console.error('加载统计数据失败', err)
          this.onDataLoaded(); // 即使失败也要停止刷新
        })
    }).catch(err => {
      console.error('未登录无法加载统计', err)
      this.onDataLoaded(); // 即使失败也要停止刷新
    })
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
    this.ensureLogin().then((openid) => {
      const id = e.currentTarget.dataset.id
      
      // 准备打卡数据
      const checkinData = {
        openid: openid,
        title: '新的打卡', // 实际应用中可能需要获取任务标题
        content: '打卡内容',
        date: new Date().toISOString().split('T')[0],
        create_time: new Date().toISOString()
      }
      
      // 调用Flask后端API进行打卡
      api.doCheckin(checkinData)
        .then(res => {
          if (res.success) {
            wx.showToast({
              title: '打卡成功',
              icon: 'success'
            })
            this.loadCheckinList()
            this.loadStats()
            
            // 打卡成功后询问是否提醒好友
            this.askToRemindFriends()
          } else {
            wx.showToast({
              title: '打卡失败',
              icon: 'none'
            })
          }
        })
        .catch(err => {
          console.error('打卡失败', err)
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