// API接口配置
const API_BASE_URL = 'http://localhost:5000';  // 开发环境Flask服务器地址

// 用户注册
function register(userData) {
    return new Promise((resolve, reject) => {
        wx.request({
            url: `${API_BASE_URL}/api/register`,
            method: 'POST',
            data: userData,
            header: {
                'content-type': 'application/json'
            },
            success: (res) => {
                if (res.statusCode === 201) {
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
function login(credentials) {
    return new Promise((resolve, reject) => {
        wx.request({
            url: `${API_BASE_URL}/api/login`,
            method: 'POST',
            data: credentials,
            header: {
                'content-type': 'application/json'
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
                    reject(new Error(`请求失败: ${res.statusCode}`));
                }
            },
            fail: (err) => {
                console.error('获取打卡记录失败:', err);
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
                    reject(new Error(`请求失败: ${res.statusCode}`));
                }
            },
            fail: (err) => {
                console.error('获取用户打卡记录失败:', err);
                reject(err);
            }
        });
    });
}

// 用户打卡
function doCheckin(data) {
    return new Promise((resolve, reject) => {
        wx.request({
            url: `${API_BASE_URL}/api/checkin`,
            method: 'POST',
            data: data,
            header: {
                'content-type': 'application/json'
            },
            success: (res) => {
                if (res.statusCode === 201) {
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

// 获取用户统计
function getStats(userId) {
    return new Promise((resolve, reject) => {
        wx.request({
            url: `${API_BASE_URL}/api/stats/${userId}`,
            method: 'GET',
            success: (res) => {
                if (res.statusCode === 200) {
                    resolve(res.data);
                } else {
                    reject(new Error(`请求失败: ${res.statusCode}`));
                }
            },
            fail: (err) => {
                console.error('获取统计信息失败:', err);
                reject(err);
            }
        });
    });
}

// 创建打卡任务
function createTask(data) {
    return new Promise((resolve, reject) => {
        wx.request({
            url: `${API_BASE_URL}/api/task`,
            method: 'POST',
            data: data,
            header: {
                'content-type': 'application/json'
            },
            success: (res) => {
                if (res.statusCode === 201) {
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
                    reject(new Error(`请求失败: ${res.statusCode}`));
                }
            },
            fail: (err) => {
                console.error('获取用户任务失败:', err);
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