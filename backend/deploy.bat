@echo off
REM deploy.bat - Windows部署脚本

echo 开始部署生命打卡小程序后端...

REM 检查Python是否已安装
python --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到Python，请先安装Python 3.x
    pause
    exit /b 1
)

echo 安装依赖...
pip install -r requirements.txt

echo 初始化数据库...
python -c "
import sqlite3
import os
from server import init_db

# 检查数据库是否存在
db_path = '打卡记录.db'
if os.path.exists(db_path):
    print('数据库 {} 已存在'.format(db_path))
else:
    print('创建数据库 {}'.format(db_path))
    init_db()

print('数据库初始化完成')
"

echo 部署完成！
echo.
echo 启动服务：
echo   gunicorn --config gunicorn_config.py server:app
echo.
echo 或者直接运行：
echo   python server.py
echo.
echo 服务将在 http://your-server-ip:5000 上运行

pause