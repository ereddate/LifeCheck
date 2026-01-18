# 生命打卡小程序 - 部署指南

## 概述

本项目包含两部分：
1. 微信小程序前端
2. Flask后端服务

由于微信小程序的安全限制，必须将后端服务部署到公网可访问的服务器上，才能在手机上正常使用。

## 部署步骤

### 一、部署后端服务

#### 方案1：使用云服务器（如阿里云、腾讯云等）

1. **购买并配置云服务器**
   - 推荐配置：Ubuntu 18.04+ 或 CentOS 7+
   - 至少1核2GB内存
   - 开放端口：22（SSH）、80（HTTP）、443（HTTPS）、5000（应用端口）

2. **登录服务器并安装依赖**
   ```bash
   # 更新系统
   sudo apt update && sudo apt upgrade -y
   
   # 安装Python 3和pip
   sudo apt install python3 python3-pip -y
   
   # 安装Git
   sudo apt install git -y
   
   # 安装Gunicorn
   pip3 install gunicorn
   ```

3. **部署应用**
   ```bash
   # 克隆代码
   git clone https://github.com/your-username/life-checkin.git
   cd life-checkin/backend
   
   # 安装依赖
   pip3 install -r requirements.txt
   
   # 启动服务
   gunicorn --config gunicorn_config.py server:app
   ```

4. **配置反向代理（推荐使用Nginx）**
   ```bash
   # 安装Nginx
   sudo apt install nginx -y
   
   # 配置Nginx
   sudo nano /etc/nginx/sites-available/life-checkin
   
   # 添加以下配置：
   server {
       listen 80;
       server_name your-domain.com;  # 替换为你的域名
   
       location / {
           proxy_pass http://127.0.0.1:5000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   
   # 启用站点
   sudo ln -s /etc/nginx/sites-available/life-checkin /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

#### 方案2：使用Docker部署

```bash
# 构建Docker镜像
docker build -t life-checkin-backend .

# 运行容器
docker run -d -p 5000:5000 --name life-checkin-app life-checkin-backend

# 或者使用Docker Compose
docker-compose up -d
```

#### 方案3：部署到Heroku（免费选项）

1. 注册Heroku账户
2. 安装Heroku CLI
3. 在项目根目录创建Procfile：
   ```
   web: gunicorn server:app
   ```
4. 部署：
   ```bash
   heroku create your-app-name
   git push heroku main
   ```

### 二、配置小程序前端

1. **修改API地址**
   在小程序代码中，将 `api.js` 中的 `API_BASE_URL` 改为你的服务器地址：
   
   ```javascript
   // 生产环境 - 替换为你的服务器地址
   production: 'https://your-domain.com',  // HTTPS协议
   // 或
   production: 'http://your-server-ip:5000',  // HTTP协议
   ```

2. **配置服务器域名**
   在微信公众平台配置request合法域名：
   - 登录微信公众平台
   - 进入"开发" -> "开发设置" -> "服务器域名"
   - 添加你的服务器域名到request合法域名列表

### 三、SSL证书配置（推荐）

为了更好的安全性和兼容性，建议配置SSL证书：

```bash
# 使用Certbot获取免费SSL证书
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

## 注意事项

1. **数据库持久化**：SQLite数据库文件需要持久化存储，避免服务重启后数据丢失
2. **安全性**：生产环境中应使用HTTPS协议
3. **备份**：定期备份数据库文件
4. **监控**：设置服务监控，确保服务稳定运行

## 故障排除

### 常见问题

1. **无法访问后端服务**
   - 检查服务器防火墙设置
   - 确认端口是否开放
   - 检查网络连通性

2. **小程序无法调用API**
   - 确认域名已在微信公众平台配置
   - 检查HTTPS证书有效性
   - 确认后端CORS配置

3. **数据库权限问题**
   - 确保应用有读写数据库目录的权限
   - 检查数据库文件权限设置

## 维护建议

1. 定期更新系统和软件包
2. 监控服务运行状态
3. 定期备份数据
4. 关注安全漏洞更新