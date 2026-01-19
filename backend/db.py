import sqlite3
import threading
import time
from contextlib import contextmanager
from collections import deque
from functools import wraps
from flask import request, jsonify
from config import config, db_config
import bleach

# 根据配置选择数据库驱动
db_type = config.DB_TYPE.lower()

if db_type == 'mysql':
    import pymysql
    from sqlalchemy import create_engine, text
elif db_type == 'postgresql':
    import psycopg2
    from sqlalchemy import create_engine, text
else:  # sqlite
    from sqlalchemy import create_engine, text

# 全局数据库引擎
engine = None
local_storage = threading.local()

def init_db_engine():
    """初始化数据库引擎"""
    global engine
    database_url = db_config.get_database_url()
    
    if db_type in ['mysql', 'postgresql']:
        engine = create_engine(
            database_url,
            pool_size=config.POOL_SIZE,
            max_overflow=config.MAX_OVERFLOW,
            pool_timeout=config.POOL_TIMEOUT,
            pool_pre_ping=True,
            echo=False  # 生产环境中关闭SQL日志
        )
    else:  # sqlite
        engine = create_engine(
            database_url,
            # SQLite不需要连接池，但保留基本配置
            echo=False
        )

def get_db_connection():
    """获取数据库连接"""
    if db_type in ['mysql', 'postgresql']:
        # 使用SQLAlchemy引擎
        return engine.connect()
    else:
        # SQLite直接使用原生连接
        conn = sqlite3.connect(config.SQLITE_DB_PATH)
        conn.row_factory = sqlite3.Row  # 返回字典格式的结果
        return conn

@contextmanager
def get_db():
    """数据库连接上下文管理器"""
    conn = get_db_connection()
    try:
        yield conn
    finally:
        if hasattr(conn, 'close'):
            conn.close()

def query_db(query, args=(), one=False):
    """通用查询函数"""
    with get_db() as conn:
        if db_type == 'mysql':
            cursor = conn.execute(text(query), args)
        elif db_type == 'postgresql':
            cursor = conn.execute(text(query), args)
        else:  # sqlite
            cursor = conn.execute(query, args)
        
        rv = cursor.fetchall()
        result = [dict(row._mapping) if hasattr(row, '_mapping') else dict(row) for row in rv]
        
        return (result[0] if result else None) if one else result

def insert_db(query, args=()):
    """通用插入函数"""
    with get_db() as conn:
        if db_type == 'mysql':
            result = conn.execute(text(query), args)
        elif db_type == 'postgresql':
            result = conn.execute(text(query), args)
        else:  # sqlite
            result = conn.execute(query, args)
        
        conn.commit()
        
        # 获取最后插入的ID
        if db_type == 'mysql':
            return result.lastrowid
        elif db_type == 'postgresql':
            # PostgreSQL需要使用RETURNING子句来获取ID
            # 这里假设插入语句有返回ID的机制
            return result.lastrowid
        else:  # sqlite
            return result.lastrowid

def update_db(query, args=()):
    """通用更新函数"""
    with get_db() as conn:
        if db_type == 'mysql':
            result = conn.execute(text(query), args)
        elif db_type == 'postgresql':
            result = conn.execute(text(query), args)
        else:  # sqlite
            result = conn.execute(query, args)
        
        conn.commit()
        return result.rowcount

# 速率限制存储
from collections import defaultdict, deque
rate_limits = defaultdict(lambda: deque())

def rate_limit(max_requests=None, window=None):
    """简单的速率限制装饰器"""
    if max_requests is None:
        max_requests = config.RATE_LIMIT_MAX_REQUESTS
    if window is None:
        window = config.RATE_LIMIT_WINDOW
        
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            client_ip = request.remote_addr
            now = time.time()
            
            # 清理过期的请求记录
            while rate_limits[client_ip] and rate_limits[client_ip][0] <= now - window:
                rate_limits[client_ip].popleft()
            
            # 检查是否超过限制
            if len(rate_limits[client_ip]) >= max_requests:
                return jsonify({"error": "请求过于频繁，请稍后再试"}), 429
            
            # 记录当前请求
            rate_limits[client_ip].append(now)
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def sanitize_input(text, max_length=255):
    """清理和验证输入数据"""
    if not text:
        return text
    # 去除首尾空白字符
    text = text.strip()
    # 限制最大长度
    if len(text) > max_length:
        text = text[:max_length]
    # 使用bleach清理潜在危险的HTML标签
    text = bleach.clean(text, strip=True)
    return text