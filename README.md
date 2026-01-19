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

### 🔐 安全与性能优化
- **SQL注入防护**: 所有数据库查询使用参数化查询
- **输入验证与清理**: 使用bleach库清理用户输入，防止XSS攻击
- **强密码哈希**: 使用PBKDF2算法增强密码安全性
- **速率限制**: 防止API滥用和DDoS攻击
- **身份认证强化**: 改进的用户验证机制
- **数据库优化**: 使用WAL模式提升并发性能
- **连接池管理**: 支持数据库连接复用，提升高并发性能
- **多数据库支持**: 可灵活切换SQLite/MySQL/PostgreSQL
- **配置化部署**: 通过环境变量实现快速环境切换

### 🔄 用户体验优化
- **下拉刷新**: 支持个人中心页面下拉刷新数据
- **实时数据同步**: 修复好友数量和消息数量显示问题
- **静态资源服务**: 配置后端提供头像等静态资源
- **CORS支持**: 确保前后端通信顺畅

### 💡 特色功能
- **最亲密好友提醒**: 优先显示亲密度高的未打卡好友
- **智能提醒**: 根据亲密度排序显示提醒列表
- **分页好友列表**: 支持查看所有好友
- **未读消息计数**: 显示准确的未读消息数量

## 技术架构

### 前端
- 微信小程序原生开发
- WXML/WXSS/JavaScript
- 响应式设计

### 后端
- Flask Web框架
- 多数据库支持 (SQLite/MySQL/PostgreSQL)
- RESTful API设计
- 跨域资源共享(CORS)支持
- 静态文件服务
- 连接池管理
- 配置化部署

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

#### 环境变量配置
项目支持通过环境变量进行配置，支持快速切换数据库和调整性能参数：

```bash
# 数据库类型 (sqlite/mysql/postgresql)
export DB_TYPE=sqlite

# SQLite 配置
export SQLITE_DB_PATH=打卡记录.db

# MySQL 配置 (可选)
export MYSQL_HOST=localhost
export MYSQL_PORT=3306
export MYSQL_USER=username
export MYSQL_PASSWORD=password
export MYSQL_DATABASE=qdaily_checkin

# PostgreSQL 配置 (可选)
export PG_HOST=localhost
export PG_PORT=5432
export PG_USER=username
export PG_PASSWORD=password
export PG_DATABASE=qdaily_checkin

# 性能配置
export POOL_SIZE=20
export MAX_OVERFLOW=30
export POOL_TIMEOUT=30
export RATE_LIMIT_MAX_REQUESTS=100
export RATE_LIMIT_WINDOW=60
```

#### 部署方式
1. **传统部署**: `python server.py`
2. **生产部署**: `gunicorn --config gunicorn.conf.py server:app`
3. **容器化部署**: `docker run -d -e DB_TYPE=postgresql ... qdaily-checkin-backend`

参见 [DEPLOYMENT.md](./backend/DEPLOYMENT.md) 获取详细的部署指南。

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
- `GET /api/user/{id}/unread-messages-count` - 获取未读消息数量
- `GET /api/stats/{id}` - 获取用户统计信息

## 安全特性

### 防护措施
- SQL注入防护：使用参数化查询
- XSS防护：输入清理和验证
- 强密码策略：PBKDF2哈希算法
- 速率限制：防止API滥用
- 身份验证：改进的用户认证流程

### 数据保护
- 敏感数据不直接返回
- 输入长度限制
- 正则表达式验证

## 功能亮点

### 亲密度系统
基于用户间的互动频率计算亲密度分数，优先提醒亲密度高的好友打卡。

### 消息通知
好友提醒打卡时会生成消息通知，用户可在消息页面查看。

### 智能排序
好友列表按亲密度排序，重要好友优先显示。

### 分页加载
好友列表支持分页加载，提升大数据量下的性能。

### 实时数据
修复了好友数量和消息数量显示不准确的问题，确保数据实时更新。

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
├── api.js                # API接口封装
├── app.js                # 小程序应用配置
├── app.json              # 小程序全局配置
├── backend/
│   ├── server.py         # 主服务文件
│   ├── db.py             # 数据库抽象层
│   ├── config.py         # 配置管理
│   ├── schema.sql        # 数据库表结构
│   ├── requirements.txt  # 依赖包
│   ├── gunicorn.conf.py  # Gunicorn生产配置
│   ├── Dockerfile        # Docker容器化配置
│   └── DEPLOYMENT.md     # 部署说明文档
└── ...
```

## 贡献

欢迎提交Issue和PR，共同完善这个项目。

## 许可证

MIT License