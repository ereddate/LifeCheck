#!/bin/bash
# 启动Flask后端服务的脚本

echo "正在启动人生打卡后端服务..."

# 检查是否已安装依赖
if [ ! -d "venv" ]; then
    echo "创建虚拟环境..."
    python -m venv venv
fi

# 激活虚拟环境并安装依赖
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate.bat 2>/dev/null
pip install -r requirements.txt

echo "启动Flask应用..."
python server.py