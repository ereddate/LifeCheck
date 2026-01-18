// 服务器配置
const SERVER_CONFIG = {
  // 开发环境 - 本地服务器
  development: 'http://127.0.0.1:5000',
  
  // 生产环境 - 远程服务器 (请替换为实际的服务器地址)
  production: 'https://your-server-domain.com', // TODO: 替换为实际服务器地址
  
  // 测试环境
  test: 'http://localhost:5000'
};

// 根据环境选择服务器地址
// 微信小程序中通常使用线上地址
const API_BASE_URL = SERVER_CONFIG.production;

// 用户认证相关
function register(username, password) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE_URL}/api/register`,
      method: 'POST',
      data: {
        username: username,
        password: password
      },
      success: (res) => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(res.data);
        } else {
          reject(new Error(`注册失败: ${res.statusCode}`));
        }
      },
      fail: (err) => {
        console.error('注册请求失败:', err);
        reject(err);
      }
    });
  });
}

// 用户登录
function login(username, password) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE_URL}/api/login`,
      method: 'POST',
      data: {
        username: username,
        password: password
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error(`登录失败: ${res.statusCode}`));
        }
      },
      fail: (err) => {
        console.error('登录请求失败:', err);
        reject(err);
      }
    });
  });
}

// 获取所有打卡记录
function getRecords() {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE_URL}/api/records`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error(`获取记录失败: ${res.statusCode}`));
        }
      },
      fail: (err) => {
        console.error('获取记录请求失败:', err);
        reject(err);
      }
    });
  });
}

// 获取用户打卡记录
function getUserRecords(userId) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE_URL}/api/user/${userId}/records`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error(`获取用户记录失败: ${res.statusCode}`));
        }
      },
      fail: (err) => {
        console.error('获取用户记录请求失败:', err);
        reject(err);
      }
    });
  });
}

// 执行打卡
function doCheckin(userId, content) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE_URL}/api/checkin`,
      method: 'POST',
      data: {
        user_id: userId,
        content: content
      },
      success: (res) => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(res.data);
        } else {
          reject(new Error(`打卡失败: ${res.statusCode}`));
        }
      },
      fail: (err) => {
        console.error('打卡请求失败:', err);
        reject(err);
      }
    });
  });
}

// 获取用户统计信息
function getStats(userId) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE_URL}/api/stats/${userId}`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error(`获取统计信息失败: ${res.statusCode}`));
        }
      },
      fail: (err) => {
        console.error('获取统计信息请求失败:', err);
        reject(err);
      }
    });
  });
}

// 创建打卡任务
function createTask(userId, title, content) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE_URL}/api/task`,
      method: 'POST',
      data: {
        user_id: userId,
        title: title,
        content: content
      },
      success: (res) => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(res.data);
        } else {
          reject(new Error(`创建任务失败: ${res.statusCode}`));
        }
      },
      fail: (err) => {
        console.error('创建任务请求失败:', err);
        reject(err);
      }
    });
  });
}

// 获取用户任务列表
function getUserTasks(userId) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE_URL}/api/user/${userId}/tasks`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error(`获取任务列表失败: ${res.statusCode}`));
        }
      },
      fail: (err) => {
        console.error('获取任务列表请求失败:', err);
        reject(err);
      }
    });
  });
}

// 删除打卡任务
function deleteTask(taskId) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE_URL}/api/task/${taskId}`,
      method: 'DELETE',
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error(`删除任务失败: ${res.statusCode}`));
        }
      },
      fail: (err) => {
        console.error('删除任务请求失败:', err);
        reject(err);
      }
    });
  });
}

// 获取未打卡的好友列表
function getNotCheckedInFriends(userId) {
    return new Promise((resolve, reject) => {
        wx.request({
            url: `${API_BASE_URL}/api/user/${userId}/not-checked-in-friends`,
            method: 'GET',
            success: (res) => {
                if (res.statusCode === 200) {
                    resolve(res.data);
                } else {
                    reject(new Error(`请求失败: ${res.statusCode}`));
                }
            },
            fail: (err) => {
                console.error('获取未打卡好友列表失败:', err);
                reject(err);
            }
        });
    });
}

// 获取好友列表
function getFriends(userId) {
    return new Promise((resolve, reject) => {
        wx.request({
            url: `${API_BASE_URL}/api/user/${userId}/friends`,
            method: 'GET',
            success: (res) => {
                if (res.statusCode === 200) {
                    resolve(res.data);
                } else {
                    reject(new Error(`请求失败: ${res.statusCode}`));
                }
            },
            fail: (err) => {
                console.error('获取好友列表失败:', err);
                reject(err);
            }
        });
    });
}

// 获取亲密度最高的未打卡好友列表
function getTopIntimacyNotCheckedInFriends(userId) {
    return new Promise((resolve, reject) => {
        wx.request({
            url: `${API_BASE_URL}/api/user/${userId}/top-intimacy-not-checked-in-friends`,
            method: 'GET',
            success: (res) => {
                if (res.statusCode === 200) {
                    resolve(res.data);
                } else {
                    reject(new Error(`请求失败: ${res.statusCode}`));
                }
            },
            fail: (err) => {
                console.error('获取亲密度最高未打卡好友列表失败:', err);
                reject(err);
            }
        });
    });
}

// 获取分页好友列表
function getFriendsPaginated(userId, page = 1, pageSize = 20) {
    return new Promise((resolve, reject) => {
        wx.request({
            url: `${API_BASE_URL}/api/user/${userId}/friends/paginated?page=${page}&page_size=${pageSize}`,
            method: 'GET',
            success: (res) => {
                if (res.statusCode === 200) {
                    resolve(res.data);
                } else {
                    reject(new Error(`请求失败: ${res.statusCode}`));
                }
            },
            fail: (err) => {
                console.error('获取分页好友列表失败:', err);
                reject(err);
            }
        });
    });
}

// 提醒好友打卡
function remindFriend(userId, friendId) {
    return new Promise((resolve, reject) => {
        wx.request({
            url: `${API_BASE_URL}/api/remind-friend/${userId}/${friendId}`,
            method: 'POST',
            success: (res) => {
                if (res.statusCode === 200) {
                    resolve(res.data);
                } else {
                    reject(new Error(`请求失败: ${res.statusCode}`));
                }
            },
            fail: (err) => {
                console.error('提醒好友失败:', err);
                reject(err);
            }
        });
    });
}

// 获取用户消息列表
function getMessages(userId) {
    return new Promise((resolve, reject) => {
        wx.request({
            url: `${API_BASE_URL}/api/user/${userId}/messages`,
            method: 'GET',
            success: (res) => {
                if (res.statusCode === 200) {
                    resolve(res.data);
                } else {
                    reject(new Error(`请求失败: ${res.statusCode}`));
                }
            },
            fail: (err) => {
                console.error('获取消息列表失败:', err);
                reject(err);
            }
        });
    });
}

// 标记消息为已读
function markMessageRead(messageId) {
    return new Promise((resolve, reject) => {
        wx.request({
            url: `${API_BASE_URL}/api/message/${messageId}/read`,
            method: 'PUT',
            success: (res) => {
                if (res.statusCode === 200) {
                    resolve(res.data);
                } else {
                    reject(new Error(`请求失败: ${res.statusCode}`));
                }
            },
            fail: (err) => {
                console.error('标记消息为已读失败:', err);
                reject(err);
            }
        });
    });
}

// 获取未读消息数量
function getUnreadMessagesCount(userId) {
    return new Promise((resolve, reject) => {
        wx.request({
            url: `${API_BASE_URL}/api/user/${userId}/unread-messages-count`,
            method: 'GET',
            success: (res) => {
                if (res.statusCode === 200) {
                    resolve(res.data);
                } else {
                    reject(new Error(`请求失败: ${res.statusCode}`));
                }
            },
            fail: (err) => {
                console.error('获取未读消息数量失败:', err);
                reject(err);
            }
        });
    });
}

// 添加好友
function addFriend(userId, friendId) {
    return new Promise((resolve, reject) => {
        wx.request({
            url: `${API_BASE_URL}/api/add-friend`,
            method: 'POST',
            data: {
                user_id: userId,
                friend_id: friendId
            },
            success: (res) => {
                if (res.statusCode === 200) {
                    resolve(res.data);
                } else {
                    reject(new Error(`请求失败: ${res.statusCode}`));
                }
            },
            fail: (err) => {
                console.error('添加好友失败:', err);
                reject(err);
            }
        });
    });
}

module.exports = {
    register,
    login,
    getRecords,
    getUserRecords,
    doCheckin,
    getStats,
    createTask,
    getUserTasks,
    deleteTask,
    getNotCheckedInFriends,
    getFriends,
    getTopIntimacyNotCheckedInFriends,
    getFriendsPaginated,
    remindFriend,
    getMessages,
    markMessageRead,
    getUnreadMessagesCount,
    addFriend
};