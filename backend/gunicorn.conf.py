# Gunicorn 配置文件
bind = "0.0.0.0:5000"
workers = 4  # 根据CPU核心数调整
worker_class = "sync"  # 或者使用 "gevent" 或 "eventlet" 以支持更高并发
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100
timeout = 30
keepalive = 2
preload_app = True