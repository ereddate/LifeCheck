#!/bin/bash
# deploy.sh - 部署脚本示例

echo "开始部署生命打卡小程序后端..."

# 检查是否已安装必要的工具
if ! command -v python3 &> /dev/null; then
    echo "错误: 未找到python3，请先安装Python 3.x"
    exit 1
fi

if ! command -v pip &> /dev/null; then
    echo "错误: 未找到pip，请先安装pip"
    exit 1
fi

echo "安装依赖..."
pip install -r requirements.txt

echo "初始化数据库..."
python -c "
import sqlite3
import os
from server import init_db

# 检查数据库是否存在
db_path = '打卡记录.db'
if os.path.exists(db_path):
    print(f'数据库 {db_path} 已存在')
else:
    print(f'创建数据库 {db_path}')
    init_db()

print('数据库初始化完成')
"

echo "部署完成！"
echo ""
echo "启动服务："
echo "  gunicorn --config gunicorn_config.py server:app"
echo ""
echo "或者直接运行："
echo "  python server.py"
echo ""
echo "服务将在 http://your-server-ip:5000 上运行"