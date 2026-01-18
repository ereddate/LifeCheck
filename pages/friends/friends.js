const api = require('../../api.js');

Page({
  data: {
    friends: [],
    currentPage: 1,
    totalPages: 1,
    totalFriends: 0,
    isLoading: false,
    hasMore: true,
    unreadCount: 0  // 未读消息数量
  },

  onLoad() {
    this.loadFriends();
    this.getUnreadCount();  // 获取未读消息数量
  },

  // 加载好友列表
  loadFriends() {
    if (this.data.isLoading || !this.data.hasMore) {
      return;
    }

    this.setData({
      isLoading: true
    });

    this.ensureLogin().then((userId) => {
      // 获取分页好友列表
      api.getFriendsPaginated(userId, this.data.currentPage, 20)
        .then(response => {
          const { friends, current_page, total_pages, total_count } = response;
          
          // 合并新数据
          const newFriends = this.data.currentPage === 1 
            ? friends 
            : [...this.data.friends, ...friends];
          
          this.setData({
            friends: newFriends,
            currentPage: current_page,
            totalPages: total_pages,
            totalFriends: total_count,
            hasMore: current_page < total_pages,
            isLoading: false
          });
        })
        .catch(err => {
          console.error('获取好友列表失败', err);
          wx.showToast({
            title: '获取好友列表失败',
            icon: 'none'
          });
          this.setData({
            isLoading: false
          });
        });
    }).catch(err => {
      console.error('未登录无法加载好友列表', err);
      this.setData({
        isLoading: false
      });
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      currentPage: 1,
      friends: [],
      hasMore: true
    });
    this.loadFriends();
    this.getUnreadCount();  // 刷新未读消息数量
    wx.stopPullDownRefresh();
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.isLoading) {
      this.setData({
        currentPage: this.data.currentPage + 1
      });
      this.loadFriends();
    }
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

  // 获取未读消息数量
  getUnreadCount() {
    this.ensureLogin().then((userId) => {
      api.getUnreadMessagesCount(userId)
        .then(response => {
          this.setData({
            unreadCount: response.unread_count || 0
          });
        })
        .catch(err => {
          console.error('获取未读消息数量失败', err);
        });
    }).catch(err => {
      console.error('未登录无法获取未读消息数量', err);
    });
  },

  // 提醒好友
  remindFriend(e) {
    const friendId = e.currentTarget.dataset.id;
    const friendName = e.currentTarget.dataset.name;
    const userId = this.data.userId;

    wx.showModal({
      title: '提醒好友',
      content: `确定要提醒 ${friendName} 打卡吗？`,
      success: (res) => {
        if (res.confirm) {
          this.ensureLogin().then((userId) => {
            // 调用API提醒好友并更新亲密度
            api.remindFriend(userId, friendId)
              .then(response => {
                if (response.success) {
                  wx.showToast({
                    title: response.message || '提醒成功',
                    icon: 'success'
                  });

                  // 刷新当前页面数据
                  this.setData({
                    friends: [],
                    currentPage: 1,
                    hasMore: true
                  });
                  this.loadFriends();
                } else {
                  wx.showToast({
                    title: response.error || '提醒失败',
                    icon: 'none'
                  });
                }
              })
              .catch(err => {
                console.error('提醒好友失败', err);
                wx.showToast({
                  title: '提醒失败',
                  icon: 'none'
                });
              });
          });
        }
      }
    });
  },

  // 跳转到消息页面
  goToMessages() {
    wx.navigateTo({
      url: '/pages/messages/messages'
    });
  }
});