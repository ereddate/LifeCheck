# LifeCheck - 人生打卡小程序

一款鼓励每日坚持打卡的小程序，帮助用户养成良好习惯，与好友互相督促。

**English Name**: LifeCheck

## 功能特性

### 📱 基础功能
- **每日打卡**: 记录每日打卡时刻，培养良好习惯
- **打卡统计**: 查看个人打卡历史和统计数据
- **任务管理**: 创建和管理个人打卡任务

### 👥 社交功能
- **好友系统**: 与朋友建立联系，共同打卡
- **提醒功能**: 提醒好友打卡，增进友谊
- **亲密度系统**: 基于互动频率的亲密度计算
- **消息系统**: 接收好友提醒通知
- **分享邀请**: 分享小程序邀请好友加入

### 💡 特色功能
- **最亲密好友提醒**: 优先显示亲密度高的未打卡好友
- **智能提醒**: 根据亲密度排序显示提醒列表
- **分页好友列表**: 支持查看所有好友

## 技术架构

### 前端
- 微信小程序原生开发
- WXML/WXSS/JavaScript
- 响应式设计

### 后端
- Flask Web框架
- SQLite数据库
- RESTful API设计

## 快速开始

### 开发环境搭建

#### 1. 后端服务
```bash
# 进入后端目录
cd backend

# 安装依赖
pip install -r requirements.txt

# 启动服务
python server.py
```

服务将运行在 `http://localhost:5000`

#### 2. 前端开发
1. 打开微信开发者工具
2. 导入项目根目录
3. 确保 `api.js` 中的 `API_BASE_URL` 指向正确的后端地址
4. 编译运行

### 生产环境部署

参见 [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md) 获取详细的部署指南。

## 项目结构

```
life-checkin/
├── pages/                  # 小程序页面
│   ├── add/              # 打卡页面
│   ├── index/            # 记录页面
│   ├── detail/           # 详情页面
│   ├── mine/             # 我的页面
│   ├── auth/             # 认证页面
│   ├── settings/         # 设置页面
│   ├── friends/          # 好友页面
│   └── messages/         # 消息页面
├── backend/              # 后端服务
│   ├── server.py         # 主服务文件
│   ├── schema.sql        # 数据库表结构
│   └── requirements.txt  # 依赖包
├── api.js                # API接口封装
├── app.js                # 小程序应用配置
├── app.json              # 小程序全局配置
└── ...
```

## API接口

### 用户相关
- `POST /api/register` - 用户注册
- `POST /api/login` - 用户登录
- `GET /api/user/{id}/records` - 获取用户打卡记录
- `POST /api/checkin` - 执行打卡

### 社交相关
- `GET /api/user/{id}/friends` - 获取好友列表
- `GET /api/user/{id}/top-intimacy-not-checked-in-friends` - 获取亲密度最高的未打卡好友
- `POST /api/add-friend` - 添加好友
- `POST /api/remind-friend/{user_id}/{friend_id}` - 提醒好友打卡
- `GET /api/user/{id}/messages` - 获取消息列表
- `PUT /api/message/{id}/read` - 标记消息为已读

## 部署说明

对于生产环境，需要将后端服务部署到公网可访问的服务器。详细部署指南请参考 [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)。

## 功能亮点

### 亲密度系统
基于用户间的互动频率计算亲密度分数，优先提醒亲密度高的好友打卡。

### 消息通知
好友提醒打卡时会生成消息通知，用户可在消息页面查看。

### 智能排序
好友列表按亲密度排序，重要好友优先显示。

### 分页加载
好友列表支持分页加载，提升大数据量下的性能。

## 贡献

欢迎提交Issue和PR，共同完善这个项目。

## 许可证

MIT License