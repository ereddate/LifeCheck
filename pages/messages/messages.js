const api = require('../../api.js');

Page({
  data: {
    messages: [],
    hasMore: true,
    currentPage: 1,
    isLoading: false
  },

  onLoad() {
    this.loadMessages();
    // 进入消息页面时，将所有消息标记为已读
    this.markAllAsRead();
  },

  // 将所有消息标记为已读
  markAllAsRead() {
    this.ensureLogin().then((userId) => {
      // 获取当前用户的所有未读消息
      api.getMessages(userId)
        .then(messages => {
          const unreadMessages = messages.filter(msg => msg.read_status === 0);
          
          // 批量将未读消息标记为已读
          const markPromises = unreadMessages.map(msg => {
            return api.markMessageRead(msg.id).catch(err => {
              console.error(`标记消息 ${msg.id} 为已读失败`, err);
            });
          });
          
          Promise.all(markPromises).then(() => {
            // 更新未读消息数量
            this.updateUnreadCount();
            
            // 重新加载消息列表
            this.setData({
              messages: []
            });
            this.loadMessages();
          }).catch(err => {
            console.error('批量标记消息为已读失败', err);
          });
        })
        .catch(err => {
          console.error('获取消息列表失败', err);
        });
    });
  },

  // 加载消息列表
  loadMessages() {
    if (this.data.isLoading || !this.data.hasMore) {
      return;
    }

    this.setData({
      isLoading: true
    });

    this.ensureLogin().then((userId) => {
      api.getMessages(userId)
        .then(messages => {
          // 格式化时间
          const formattedMessages = messages.map(msg => ({
            ...msg,
            formattedTime: this.formatTime(new Date(msg.created_at.replace(/-/g, '/')))
          }));

          this.setData({
            messages: formattedMessages,
            isLoading: false
          });
        })
        .catch(err => {
          console.error('获取消息列表失败', err);
          wx.showToast({
            title: '获取消息失败',
            icon: 'none'
          });
          this.setData({
            isLoading: false
          });
        });
    }).catch(err => {
      console.error('未登录无法加载消息', err);
      this.setData({
        isLoading: false
      });
    });
  },

  // 格式化时间
  formatTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;

    return `${date.getMonth() + 1}月${date.getDate()}日`;
  },

  // 标记消息为已读
  markAsRead(e) {
    const messageId = e.currentTarget.dataset.id;

    api.markMessageRead(messageId)
      .then(res => {
        // 更新本地消息状态
        const messages = this.data.messages.map(msg => {
          if (msg.id === messageId) {
            return {...msg, read_status: 1};
          }
          return msg;
        });

        this.setData({
          messages: messages
        });
        
        // 更新未读消息数量
        this.updateUnreadCount();
      })
      .catch(err => {
        console.error('标记消息为已读失败', err);
      });
  },

  // 更新未读消息数量
  updateUnreadCount() {
    this.ensureLogin().then((userId) => {
      api.getUnreadMessagesCount(userId)
        .then(response => {
          // 这里可以通知其他页面更新未读数量，或者直接更新全局数据
          const app = getApp();
          app.globalData.unreadMessageCount = response.unread_count || 0;
        })
        .catch(err => {
          console.error('更新未读消息数量失败', err);
        });
    });
  },

  // 确保用户已登录
  ensureLogin() {
    return new Promise((resolve, reject) => {
      const app = getApp();
      if (app.globalData.currentUser) {
        // 已登录
        resolve(app.globalData.currentUser.id);
      } else {
        // 未登录，跳转到登录页面
        wx.redirectTo({
          url: '/pages/auth/auth'
        });
        reject(new Error('未登录'));
      }
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      messages: [],
      currentPage: 1,
      hasMore: true
    });
    this.loadMessages();
    wx.stopPullDownRefresh();
  }
});