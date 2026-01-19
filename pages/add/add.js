const api = require('../../api.js')

Page({
  data: {
    friendList: [],
    totalFriendCount: 0,      // 总好友数量
    hasCheckedInToday: false  // 是否今天已打卡
  },

  onLoad() {
    // 确保用户已登录
    this.ensureLogin().then(() => {
      this.checkTodayCheckinStatus();
      this.loadFriendList();
    }).catch(err => {
      console.error('登录失败', err)
    })
  },

  onShow() {
    // 每次显示页面时都检查登录状态和打卡状态
    this.ensureLogin().then(() => {
      this.checkTodayCheckinStatus();
    }).catch(err => {
      console.error('登录失败', err)
    })
  },

  // 检查用户今天是否已经打卡
  checkTodayCheckinStatus() {
    this.ensureLogin().then((userId) => {
      // 获取今天的日期（仅日期部分，不包含时间）
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      // 获取用户的所有打卡记录
      api.getUserRecords(userId)
        .then(records => {
          // 检查今天是否有打卡记录
          // 优先检查 date 字段，如果没有则尝试从 create_time 字段提取日期
          const todayRecord = records.some(record => {
            // 检查 date 字段
            if (record.date && record.date === todayStr) {
              return true;
            }
            // 如果 date 字段不匹配或不存在，尝试从 create_time 提取日期
            if (record.create_time) {
              // 从 create_time 字段提取日期部分 (YYYY-MM-DD)
              const recordDate = record.create_time.split(' ')[0];
              if (recordDate === todayStr) {
                return true;
              }
            }
            return false;
          });
          
          this.setData({
            hasCheckedInToday: todayRecord
          });
        })
        .catch(err => {
          console.error('检查打卡状态失败', err);
          // 如果无法获取记录，默认设为未打卡
          this.setData({
            hasCheckedInToday: false
          });
        });
    }).catch(err => {
      console.error('未登录无法检查打卡状态', err);
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

  // 导航到授权页面
  navigateToAuth() {
    wx.navigateTo({
      url: '/pages/auth/auth'
    })
  },

  loadFriendList() {
    this.ensureLogin().then((userId) => {
      // 从后端获取亲密度最高的未打卡好友列表
      api.getTopIntimacyNotCheckedInFriends(userId)
        .then(friends => {
          // 记录总好友数量
          const totalFriendCount = friends.length;
          
          // 更新页面数据
          this.setData({
            friendList: friends,
            totalFriendCount: totalFriendCount
          });
          
          console.log(`加载亲密度最高的未打卡好友：${totalFriendCount}位`);
        })
        .catch(err => {
          console.error('获取亲密度最高未打卡好友列表失败', err);
          // 出错时显示空列表
          this.setData({
            friendList: [],
            totalFriendCount: 0
          });
        });
    }).catch(err => {
      console.error('未登录无法加载好友列表', err);
      this.setData({
        friendList: [],
        totalFriendCount: 0
      });
    });
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
    this.ensureLogin().then((userId) => {
      const friendId = e.currentTarget.dataset.id
      const friendName = e.currentTarget.dataset.name
      
      wx.showModal({
        title: '提醒好友',
        content: `确定要提醒 ${friendName} 打卡吗？`,
        success: (res) => {
          if (res.confirm) {
            // 调用API提醒好友并更新亲密度
            api.remindFriend(userId, friendId)
              .then(response => {
                if (response.success) {
                  wx.showToast({
                    title: response.message || '提醒成功',
                    icon: 'success'
                  })
                  
                  // 重新加载好友列表以反映最新的亲密度变化
                  this.loadFriendList();
                } else {
                  wx.showToast({
                    title: response.error || '提醒失败',
                    icon: 'none'
                  })
                }
              })
              .catch(err => {
                console.error('提醒好友失败', err);
                wx.showToast({
                  title: '提醒失败',
                  icon: 'none'
                });
              });
          }
        }
      })
    }).catch(err => {
      console.error('未登录无法提醒好友', err)
    })
  },

  // 跳转到所有好友页面
  goToAllFriends() {
    wx.navigateTo({
      url: '/pages/friends/friends'
    });
  },

  submitForm() {
    // 检查是否今天已经打卡
    if (this.data.hasCheckedInToday) {
      wx.showToast({
        title: '今日已打卡',
        icon: 'none'
      });
      
      return;
    }

    this.ensureLogin().then((userId) => {
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

      // 使用Flask后端API进行打卡
      const checkinData = {
        user_id: userId,
        title: title,
        content: '坚持打卡，养成好习惯',
        date: now.toISOString().split('T')[0]
        // 不传递create_time，让后端自动生成
      }
      
      api.doCheckin(checkinData)
        .then(res => {
          wx.hideLoading()
          if (res.success) {
            wx.showToast({
              title: '打卡成功',
              icon: 'success'
            })
            // 更新打卡状态
            this.setData({
              hasCheckedInToday: true
            });
            setTimeout(() => {
              wx.switchTab({
                url: '/pages/index/index'
              })
            }, 1500)
          } else {
            wx.showToast({
              title: res.error || '打卡失败',
              icon: 'none'
            })
          }
        })
        .catch(err => {
          wx.hideLoading()
          console.error('打卡失败', err)
          wx.showToast({
            title: err.message || '打卡失败',
            icon: 'none'
          })
        })
    }).catch(err => {
      console.error('未登录无法提交表单', err)
    })
  },
  
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
  }
})