# 部署文档

## 部署到云服务器

### 方法一：直接部署到Linux服务器

1. 在云服务器上安装Python 3.9+
2. 克隆代码库
3. 安装依赖：
   ```bash
   pip install -r requirements.txt
   ```
4. 启动服务：
   ```bash
   gunicorn --config gunicorn_config.py server:app
   ```

### 方法二：使用Docker部署

1. 在云服务器上安装Docker
2. 构建镜像：
   ```bash
   docker build -t life-checkin-backend .
   ```
3. 运行容器：
   ```bash
   docker run -d -p 5000:5000 --name life-checkin-app life-checkin-backend
   ```

### 方法三：部署到Heroku（推荐新手）

1. 注册Heroku账号
2. 安装Heroku CLI
3. 登录Heroku：
   ```bash
   heroku login
   ```
4. 创建应用：
   ```bash
   heroku create your-app-name
   ```
5. 部署应用：
   ```bash
   git push heroku main
   ```

## 配置小程序

部署完成后，需要修改小程序中的API地址：

1. 找到 `api.js` 文件
2. 将 `API_BASE_URL` 改为你的服务器地址，例如：
   ```javascript
   const API_BASE_URL = 'https://your-domain.com';  // 替换为实际域名
   ```

## 部署注意事项

1. 确保服务器防火墙开放5000端口（或你配置的其他端口）
2. 对于生产环境，建议使用HTTPS
3. 定期备份数据库文件 `打卡记录.db`
4. 设置适当的日志记录便于调试

## 环境变量配置（可选）

你可以通过环境变量配置数据库路径和其他设置：
- DATABASE_PATH: 自定义数据库文件路径
- SECRET_KEY: Flask应用密钥
- PORT: 服务端口（默认5000）