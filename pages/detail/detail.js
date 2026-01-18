const db = wx.cloud.database()
const _ = db.command

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
    db.collection('checkin_tasks')
      .doc(this.data.taskId)
      .get()
      .then(res => {
        const task = res.data
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const lastCheckTime = new Date(task.lastCheckTime)
        const checkedToday = lastCheckTime >= today

        this.setData({
          task: {
            ...task,
            checkedToday,
            createTime: this.formatDate(task.createTime),
            typeName: this.getTypeName(task.type)
          }
        })
      })
      .catch(err => {
        console.error('加载任务详情失败', err)
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
      })
  },

  loadCheckinRecords() {
    db.collection('checkin_records')
      .where({
        taskId: this.data.taskId
      })
      .orderBy('checkTime', 'desc')
      .limit(50)
      .get()
      .then(res => {
        const list = res.data.map(item => {
          const date = new Date(item.checkTime)
          return {
            ...item,
            day: date.getDate(),
            month: `${date.getMonth() + 1}月`,
            time: this.formatTime(item.checkTime)
          }
        })
        this.setData({ recordList: list })
      })
      .catch(err => {
        console.error('加载打卡记录失败', err)
      })
  },

  doCheckin() {
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
          wx.cloud.callFunction({
            name: 'doCheckin',
            data: { taskId: this.data.taskId }
          }).then(() => {
            wx.showToast({
              title: '打卡成功',
              icon: 'success'
            })
            this.loadTaskDetail()
            this.loadCheckinRecords()
          }).catch(err => {
            wx.showToast({
              title: '打卡失败',
              icon: 'none'
            })
          })
        }
      }
    })
  },

  deleteTask() {
    wx.showModal({
      title: '确认删除',
      content: '删除后将无法恢复，确定要删除这个打卡任务吗？',
      confirmColor: '#ff4d4f',
      success: res => {
        if (res.confirm) {
          db.collection('checkin_tasks')
            .doc(this.data.taskId)
            .remove()
            .then(() => {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              })
              setTimeout(() => {
                wx.navigateBack()
              }, 1500)
            })
            .catch(err => {
              wx.showToast({
                title: '删除失败',
                icon: 'none'
              })
            })
        }
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