# 部署说明

## 快速部署

### 1. 环境准备

```bash
# 安装依赖
pip install -r requirements.txt
```

### 2. 配置数据库

复制示例配置文件并根据需要修改：

```bash
cp .env.example .env
# 编辑 .env 文件配置数据库连接
```

### 3. 数据库切换说明

#### 切换到 MySQL
```bash
export DB_TYPE=mysql
export MYSQL_HOST=your_mysql_host
export MYSQL_PORT=3306
export MYSQL_USER=your_username
export MYSQL_PASSWORD=your_password
export MYSQL_DATABASE=qdaily_checkin
```

#### 切换到 PostgreSQL
```bash
export DB_TYPE=postgresql
export PG_HOST=your_pg_host
export PG_PORT=5432
export PG_USER=your_username
export PG_PASSWORD=your_password
export PG_DATABASE=qdaily_checkin
```

#### 继续使用 SQLite (默认)
```bash
export DB_TYPE=sqlite
export SQLITE_DB_PATH=打卡记录.db
```

### 4. 启动服务

#### 开发模式
```bash
python server.py
```

#### 生产模式
```bash
gunicorn --config gunicorn.conf.py server:app
```

### 5. Docker 部署

```bash
# 构建镜像
docker build -t qdaily-checkin-backend .

# 运行容器 (SQLite)
docker run -d -p 5000:5000 \
  -e DB_TYPE=sqlite \
  -e SQLITE_DB_PATH=/app/打卡记录.db \
  --name qdaily-backend \
  qdaily-checkin-backend

# 运行容器 (MySQL)
docker run -d -p 5000:5000 \
  -e DB_TYPE=mysql \
  -e MYSQL_HOST=your_mysql_host \
  -e MYSQL_PORT=3306 \
  -e MYSQL_USER=your_username \
  -e MYSQL_PASSWORD=your_password \
  -e MYSQL_DATABASE=qdaily_checkin \
  --name qdaily-backend \
  qdaily-checkin-backend
```

## 配置参数说明

### 数据库配置
- `DB_TYPE`: 数据库类型 (sqlite/mysql/postgresql)
- `SQLITE_DB_PATH`: SQLite 数据库文件路径
- `MYSQL_*`: MySQL 连接参数
- `PG_*`: PostgreSQL 连接参数

### 性能配置
- `POOL_SIZE`: 连接池大小 (默认: 10)
- `MAX_OVERFLOW`: 最大溢出连接数 (默认: 20)
- `POOL_TIMEOUT`: 连接超时时间 (默认: 30秒)
- `RATE_LIMIT_MAX_REQUESTS`: 每窗口期内最大请求数 (默认: 100)
- `RATE_LIMIT_WINDOW`: 速率限制时间窗口 (默认: 60秒)

## 扩容说明

### 垂直扩容
- 增加 `POOL_SIZE` 和 `MAX_OVERFLOW` 参数值
- 调整 `gunicorn.conf.py` 中的 `workers` 数量

### 水平扩容
- 使用负载均衡器分发请求
- 确保多个实例共享同一个数据库
- 使用外部缓存服务 (如 Redis) 统一管理会话和缓存

## 监控和维护

### 性能监控
- 数据库连接数监控
- 响应时间监控
- 错误率监控

### 日志管理
- 应用日志轮转
- 数据库慢查询日志
- 访问日志分析