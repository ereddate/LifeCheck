@echo off
echo 正在启动人生打卡后端服务...

REM 检查是否已安装依赖
if not exist venv (
    echo 创建虚拟环境...
    python -m venv venv
)

REM 激活虚拟环境并安装依赖
call venv\Scripts\activate.bat
pip install -r requirements.txt

echo 启动Flask应用...
python server.py

pause