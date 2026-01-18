const api = require('../../api.js')

Page({
  data: {
    taskId: '',
    task: {},
    recordList: []
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ taskId: options.id })
      this.loadTaskDetail()
      this.loadCheckinRecords()
    }
  },

  onShow() {
    if (this.data.taskId) {
      this.loadTaskDetail()
      this.loadCheckinRecords()
    }
  },

  loadTaskDetail() {
    // 从Flask后端获取用户任务详情
    this.ensureLogin().then((userId) => {
      // 获取用户的所有任务，然后找到对应ID的任务
      api.getUserTasks(userId)
        .then(tasks => {
          if (tasks && tasks.length > 0) {
            // 查找对应ID的任务
            const task = tasks.find(t => t.id == this.data.taskId);
            if (task) {
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              const lastCheckTime = new Date(task.created_at)
              const checkedToday = lastCheckTime >= today

              this.setData({
                task: {
                  ...task,
                  checkedToday,
                  createTime: this.formatDate(new Date(task.created_at)),
                  typeName: this.getTypeName(task.type)
                }
              })
            } else {
              // 如果没找到对应ID的任务，使用默认数据
              this.useDefaultTaskData();
            }
          } else {
            // 如果API调用失败，使用默认数据
            this.useDefaultTaskData();
          }
        })
        .catch(err => {
          console.error('加载任务详情失败', err)
          this.useDefaultTaskData();
        })
    }).catch(err => {
      console.error('未登录无法加载任务详情', err)
      this.useDefaultTaskData();
    })
  },

  // 使用默认任务数据
  useDefaultTaskData() {
    const defaultTask = {
      id: this.data.taskId,
      title: '示例打卡任务',
      type: 'daily',
      description: '这是一个示例打卡任务',
      createTime: new Date(),
      lastCheckTime: new Date(),
      checkedToday: false
    }
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const lastCheckTime = new Date(defaultTask.lastCheckTime)
    const checkedToday = lastCheckTime >= today

    this.setData({
      task: {
        ...defaultTask,
        checkedToday,
        createTime: this.formatDate(defaultTask.createTime),
        typeName: this.getTypeName(defaultTask.type)
      }
    })
  },

  loadCheckinRecords() {
    // 从Flask后端获取打卡记录
    this.ensureLogin().then((userId) => {
      api.getUserRecords(userId)
        .then(res => {
          // 处理返回的数据格式
          const list = res.map(item => {
            const date = new Date(item.create_time)
            return {
              ...item,
              day: date.getDate(),
              month: `${date.getMonth() + 1}月`,
              time: this.formatTime(new Date(item.create_time))
            }
          })
          this.setData({ recordList: list })
        })
        .catch(err => {
          console.error('加载打卡记录失败', err)
        })
    }).catch(err => {
      console.error('未登录无法加载打卡记录', err)
    })
  },

  doCheckin() {
    this.ensureLogin().then((userId) => {
      if (this.data.task.checkedToday) {
        wx.showToast({
          title: '今日已打卡',
          icon: 'none'
        })
        return
      }

      wx.showModal({
        title: '确认打卡',
        content: '确定要完成这次打卡吗？',
        success: res => {
          if (res.confirm) {
            // 准备打卡数据
            const checkinData = {
              user_id: userId,
              title: this.data.task.title || '新的打卡',
              content: '完成了一次打卡',
              date: new Date().toISOString().split('T')[0]
              // 不传递create_time，让后端自动生成
            }
            
            // 调用Flask后端API进行打卡
            api.doCheckin(checkinData)
              .then(res => {
                if (res.success) {
                  wx.showToast({
                    title: '打卡成功',
                    icon: 'success'
                  })
                  this.loadTaskDetail()
                  this.loadCheckinRecords()
                } else {
                  wx.showToast({
                    title: res.error || '打卡失败',
                    icon: 'none'
                  })
                }
              })
              .catch(err => {
                console.error('打卡失败', err)
                wx.showToast({
                  title: err.message || '打卡失败',
                  icon: 'none'
                })
              })
          }
        }
      })
    }).catch(err => {
      console.error('未登录无法打卡', err)
    })
  },

  deleteTask() {
    wx.showModal({
      title: '确认删除',
      content: '删除后将无法恢复，确定要删除这个打卡任务吗？',
      confirmColor: '#ff4d4f',
      success: res => {
        if (res.confirm) {
          // 调用API删除任务
          api.deleteTask(this.data.taskId)
            .then(res => {
              if (res.success) {
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                })
                setTimeout(() => {
                  wx.navigateBack()
                }, 1500)
              } else {
                wx.showToast({
                  title: '删除失败',
                  icon: 'none'
                })
              }
            })
            .catch(err => {
              console.error('删除任务失败', err)
              wx.showToast({
                title: '删除失败',
                icon: 'none'
              })
            })
        }
      }
    })
  },

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

  getTypeName(type) {
    const typeMap = {
      'daily': '每日',
      'weekly': '每周',
      'monthly': '每月'
    }
    return typeMap[type] || '每日'
  },

  formatDate(timestamp) {
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${year}年${month}月${day}日`
  },

  formatTime(timestamp) {
    const date = new Date(timestamp)
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }
})