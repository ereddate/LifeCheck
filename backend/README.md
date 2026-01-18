# 人生打卡后端服务

基于Python Flask的后端服务

## 安装和运行

### 1. 安装依赖
```bash
cd backend
pip install -r requirements.txt
```

### 2. 运行服务
```bash
# Windows
start.bat

# 或者直接运行
python server.py
```

服务将在 http://localhost:5000 上运行

## API 接口

### 获取所有打卡记录
- `GET /api/records`

### 获取用户打卡记录
- `GET /api/user/{openid}/records`

### 用户打卡
- `POST /api/checkin`
- 请求体: `{"openid": "...", "title": "...", "content": "...", "date": "..."}`

### 获取用户统计
- `GET /api/stats/{openid}`

## 数据库

使用SQLite数据库，数据存储在 `打卡记录.db` 文件中

表结构:
- records: id, openid, title, content, date, create_time