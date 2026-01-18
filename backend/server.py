from flask import Flask, request, jsonify, g
from flask_cors import CORS
import sqlite3
import json
import os
import re
from datetime import datetime
import hashlib
import secrets
from werkzeug.security import generate_password_hash, check_password_hash
import bleach  # 用于清理HTML内容
from functools import wraps
import time
from collections import defaultdict, deque

app = Flask(__name__)
CORS(app)  # 启用跨域支持
DATABASE = '打卡记录.db'

# 速率限制存储
rate_limits = defaultdict(lambda: deque())

def rate_limit(max_requests=10, window=60):
    """简单的速率限制装饰器"""
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

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row  # 使结果可以像字典一样访问
        # 设置连接属性以提高性能和安全性
        db.execute('PRAGMA foreign_keys = ON')  # 启用外键约束
        db.execute('PRAGMA journal_mode = WAL')  # 启用WAL模式以提高并发性能
    return db

def init_db():
    with app.app_context():
        db = get_db()
        # 以UTF-8编码读取schema.sql文件
        with open('schema.sql', 'r', encoding='utf-8') as f:
            db.cursor().executescript(f.read())
        db.commit()

def query_db(query, args=(), one=False):
    """安全的数据库查询函数，使用参数化查询防止SQL注入"""
    cur = get_db().execute(query, args)
    rv = cur.fetchall()
    cur.close()
    return (rv[0] if rv else None) if one else rv

def insert_db(query, args=()):
    """安全的数据库插入函数"""
    db = get_db()
    cur = db.execute(query, args)
    db.commit()
    return cur.lastrowid

def update_db(query, args=()):
    """安全的数据库更新函数"""
    db = get_db()
    cur = db.execute(query, args)
    db.commit()
    return cur.rowcount

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

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

@app.route('/')
@rate_limit(max_requests=100, window=60)  # 对首页访问进行速率限制
def hello():
    return jsonify({"message": "欢迎使用人生打卡后端服务!"})

# 用户注册
@app.route('/api/register', methods=['POST'])
@rate_limit(max_requests=5, window=300)  # 注册接口限制更严格
def register():
    try:
        data = request.get_json()
        
        # 输入验证和清理
        if not data:
            return jsonify({"error": "无效的JSON数据"}), 400
        
        # 验证必需字段
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({"error": "用户名和密码不能为空"}), 400
        
        # 清理输入
        username = sanitize_input(username, max_length=50)
        nickname = sanitize_input(data.get('nickname', username), max_length=100)
        email = sanitize_input(data.get('email', ''), max_length=100)
        avatar_url = sanitize_input(data.get('avatar_url', '/images/default-avatar.png'), max_length=255)
        
        # 验证输入格式
        if not re.match(r'^[a-zA-Z0-9_\u4e00-\u9fa5]{3,20}$', username):
            return jsonify({"error": "用户名只能包含字母、数字、下划线和中文，长度3-20位"}), 400
        
        if len(password) < 6:
            return jsonify({"error": "密码长度至少6位"}), 400
        
        if email and not re.match(r'^[^@]+@[^@]+\.[^@]+$', email):
            return jsonify({"error": "邮箱格式不正确"}), 400
        
        # 检查用户名是否已存在
        existing_user = query_db('SELECT id FROM users WHERE username = ?', [username], one=True)
        if existing_user:
            return jsonify({"error": "用户名已存在"}), 400
        
        # 生成更强的密码哈希
        password_hash = generate_password_hash(password, method='pbkdf2:sha256:5000', salt_length=12)
        
        # 创建新用户
        user_id = insert_db(
            'INSERT INTO users (username, password_hash, email, nickname, avatar_url) VALUES (?, ?, ?, ?, ?)',
            [username, password_hash, email, nickname, avatar_url]
        )
        
        # 检查是否有推荐人ID，建立好友关系
        referrer_id = data.get('referrer_id')
        if referrer_id and isinstance(referrer_id, int) and referrer_id != user_id:
            # 检查推荐人是否存在
            referrer = query_db('SELECT id FROM users WHERE id = ?', [referrer_id], one=True)
            if referrer:
                # 建立双向好友关系
                insert_db('INSERT OR IGNORE INTO friendships (user_id, friend_id, status) VALUES (?, ?, ?)', [referrer_id, user_id, 'accepted'])
                insert_db('INSERT OR IGNORE INTO friendships (user_id, friend_id, status) VALUES (?, ?, ?)', [user_id, referrer_id, 'accepted'])
        
        # 获取新创建的用户信息
        new_user = query_db('SELECT id, username, nickname, email, avatar_url FROM users WHERE id = ?', [user_id], one=True)
        
        return jsonify({"success": True, "user": dict(new_user)}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 用户登录
@app.route('/api/login', methods=['POST'])
@rate_limit(max_requests=10, window=60)  # 登录接口速率限制
def login():
    try:
        data = request.get_json()
        
        # 输入验证
        if not data:
            return jsonify({"error": "无效的JSON数据"}), 400
        
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({"error": "用户名和密码不能为空"}), 400
        
        # 清理输入
        username = sanitize_input(username, max_length=50)
        
        # 查找用户
        user = query_db(
            'SELECT id, username, password_hash, nickname, email, avatar_url FROM users WHERE username = ?', 
            [username], one=True
        )
        
        if not user or not check_password_hash(user['password_hash'], password):
            return jsonify({"error": "用户名或密码错误"}), 401
        
        # 返回用户信息（不包括密码哈希）
        user_data = {
            "id": user['id'],
            "username": user['username'],
            "nickname": user['nickname'],
            "email": user['email'],
            "avatar_url": user['avatar_url'] or '/images/default-avatar.png'
        }
        
        return jsonify({"success": True, "user": user_data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 获取所有打卡记录
@app.route('/api/records', methods=['GET'])
@rate_limit(max_requests=60, window=60)
def get_records():
    try:
        # 添加分页支持以提高性能
        page = request.args.get('page', 1, type=int)
        page_size = min(request.args.get('page_size', 20, type=int), 100)  # 最大页面大小限制
        offset = (page - 1) * page_size
        
        records = query_db('SELECT * FROM records ORDER BY create_time DESC LIMIT ? OFFSET ?', [page_size, offset])
        # 将sqlite3.Row对象转换为字典
        records_list = [dict(record) for record in records]
        return jsonify(records_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 获取单个用户的打卡记录
@app.route('/api/user/<int:user_id>/records', methods=['GET'])
@rate_limit(max_requests=60, window=60)
def get_user_records(user_id):
    try:
        # 验证用户ID范围
        if user_id <= 0:
            return jsonify({"error": "无效的用户ID"}), 400
        
        records = query_db('SELECT * FROM records WHERE user_id = ? ORDER BY create_time DESC', [user_id])
        records_list = [dict(record) for record in records]
        return jsonify(records_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 用户打卡
@app.route('/api/checkin', methods=['POST'])
@rate_limit(max_requests=30, window=60)
def do_checkin():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "无效的JSON数据"}), 400
        
        user_id = data.get('user_id')
        title = data.get('title')
        
        # 验证必需字段
        if not user_id or not title:
            return jsonify({"error": "缺少必需字段"}), 400
        
        # 验证数据类型
        if not isinstance(user_id, int) or user_id <= 0:
            return jsonify({"error": "无效的用户ID"}), 400
        
        # 清理输入
        title = sanitize_input(title, max_length=200)
        
        if len(title) < 1:
            return jsonify({"error": "标题不能为空"}), 400
        
        # 检查用户今天是否已经打过卡
        today = datetime.now().strftime('%Y-%m-%d')
        existing_record = query_db(
            'SELECT id FROM records WHERE user_id = ? AND date = ?', 
            [user_id, today], one=True
        )
        
        if existing_record:
            return jsonify({"error": "今天已经打过卡了"}), 400
        
        # 检查用户是否存在
        user = query_db('SELECT id FROM users WHERE id = ?', [user_id], one=True)
        if not user:
            return jsonify({"error": "用户不存在"}), 404
        
        # 创建打卡记录
        record_id = insert_db(
            'INSERT INTO records (user_id, title, date, create_time) VALUES (?, ?, ?, ?)',
            [user_id, title, today, datetime.now().strftime('%Y-%m-%d %H:%M:%S')]
        )
        
        # 获取完整的打卡记录
        record = query_db('SELECT * FROM records WHERE id = ?', [record_id], one=True)
        
        return jsonify({"success": True, "record": dict(record)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 创建打卡任务
@app.route('/api/task', methods=['POST'])
@rate_limit(max_requests=20, window=60)
def create_task():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "无效的JSON数据"}), 400
        
        user_id = data.get('user_id')
        title = data.get('title')
        
        # 验证必需字段
        if not user_id or not title:
            return jsonify({"error": "缺少必需字段"}), 400
        
        # 验证数据类型
        if not isinstance(user_id, int) or user_id <= 0:
            return jsonify({"error": "无效的用户ID"}), 400
        
        # 清理输入
        title = sanitize_input(title, max_length=200)
        
        if len(title) < 1:
            return jsonify({"error": "任务标题不能为空"}), 400
        
        # 检查用户是否存在
        user = query_db('SELECT id FROM users WHERE id = ?', [user_id], one=True)
        if not user:
            return jsonify({"error": "用户不存在"}), 404
        
        # 插入新的打卡任务
        task_id = insert_db(
            'INSERT INTO checkin_tasks (user_id, title, created_at) VALUES (?, ?, ?)',
            [user_id, title, datetime.now().strftime('%Y-%m-%d %H:%M:%S')]
        )
        
        # 获取创建的任务信息
        task = query_db('SELECT * FROM checkin_tasks WHERE id = ?', [task_id], one=True)
        
        return jsonify({"success": True, "task": dict(task)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 获取用户的打卡任务
@app.route('/api/user/<int:user_id>/tasks', methods=['GET'])
@rate_limit(max_requests=60, window=60)
def get_user_tasks(user_id):
    try:
        if user_id <= 0:
            return jsonify({"error": "无效的用户ID"}), 400
        
        tasks = query_db('SELECT * FROM checkin_tasks WHERE user_id = ? ORDER BY created_at DESC', [user_id])
        tasks_list = [dict(task) for task in tasks]
        return jsonify(tasks_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 删除打卡任务
@app.route('/api/task/<int:task_id>', methods=['DELETE'])
@rate_limit(max_requests=20, window=60)
def delete_task(task_id):
    try:
        if task_id <= 0:
            return jsonify({"error": "无效的任务ID"}), 400
        
        # 先检查任务是否存在
        task = query_db('SELECT id, user_id FROM checkin_tasks WHERE id = ?', [task_id], one=True)
        if not task:
            return jsonify({"error": "任务不存在"}), 404
        
        # 删除任务
        rows_affected = update_db('DELETE FROM checkin_tasks WHERE id = ?', [task_id])
        
        if rows_affected > 0:
            return jsonify({"success": True, "message": "任务删除成功"})
        else:
            return jsonify({"error": "删除任务失败"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 修改密码
@app.route('/api/change-password', methods=['POST'])
@rate_limit(max_requests=5, window=300)
def change_password():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "无效的JSON数据"}), 400
        
        user_id = data.get('user_id')
        old_password = data.get('old_password')
        new_password = data.get('new_password')
        
        if not user_id or not old_password or not new_password:
            return jsonify({"error": "缺少必需字段"}), 400
        
        if not isinstance(user_id, int) or user_id <= 0:
            return jsonify({"error": "无效的用户ID"}), 400
        
        if len(new_password) < 6:
            return jsonify({"error": "新密码长度至少6位"}), 400
        
        # 获取用户信息
        user = query_db('SELECT id, password_hash FROM users WHERE id = ?', [user_id], one=True)
        if not user:
            return jsonify({"error": "用户不存在"}), 404
        
        # 验证原密码
        if not check_password_hash(user['password_hash'], old_password):
            return jsonify({"error": "原密码错误"}), 401
        
        # 生成新密码哈希
        new_password_hash = generate_password_hash(new_password, method='pbkdf2:sha256:5000', salt_length=12)
        
        # 更新密码
        update_db('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', 
                 [new_password_hash, datetime.now().strftime('%Y-%m-%d %H:%M:%S'), user_id])
        
        return jsonify({"success": True, "message": "密码修改成功"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 获取用户好友列表
@app.route('/api/user/<int:user_id>/friends', methods=['GET'])
@rate_limit(max_requests=60, window=60)
def get_user_friends(user_id):
    try:
        if user_id <= 0:
            return jsonify({"error": "无效的用户ID"}), 400
        
        friends = query_db('''
            SELECT u.id, u.username, u.nickname, u.avatar_url, f.status, f.created_at
            FROM friendships f
            JOIN users u ON f.friend_id = u.id
            WHERE f.user_id = ?
            ORDER BY f.created_at DESC
        ''', [user_id])
        
        friends_list = [dict(friend) for friend in friends]
        return jsonify(friends_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 获取用户未打卡的好友
@app.route('/api/user/<int:user_id>/not-checked-in-friends', methods=['GET'])
@rate_limit(max_requests=60, window=60)
def get_not_checked_in_friends(user_id):
    try:
        if user_id <= 0:
            return jsonify({"error": "无效的用户ID"}), 400
        
        today = datetime.now().strftime('%Y-%m-%d')
        
        not_checked_in_friends = query_db('''
            SELECT u.id, u.username, u.nickname, u.avatar_url, f.created_at
            FROM friendships f
            JOIN users u ON f.friend_id = u.id
            WHERE f.user_id = ?
            AND f.friend_id NOT IN (
                SELECT user_id FROM records WHERE date = ?
            )
            ORDER BY f.created_at DESC
        ''', [user_id, today])
        
        not_checked_in_friends_list = [dict(friend) for friend in not_checked_in_friends]
        return jsonify(not_checked_in_friends_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 获取用户高亲密度未打卡好友
@app.route('/api/user/<int:user_id>/top-intimacy-not-checked-in-friends', methods=['GET'])
@rate_limit(max_requests=20, window=60)
def get_top_intimacy_not_checked_in_friends(user_id):
    try:
        if user_id <= 0:
            return jsonify({"error": "无效的用户ID"}), 400
        
        today = datetime.now().strftime('%Y-%m-%d')
        
        not_checked_in_friends = query_db('''
            SELECT u.id, u.username, u.nickname, u.avatar_url, 
                   COALESCE(i.score, 0) as intimacy_score, f.created_at
            FROM friendships f
            JOIN users u ON f.friend_id = u.id
            LEFT JOIN intimacy_scores i ON u.id = i.friend_id AND i.user_id = ?
            WHERE f.user_id = ?
            AND f.friend_id NOT IN (
                SELECT user_id FROM records WHERE date = ?
            )
            ORDER BY COALESCE(i.score, 0) DESC, f.created_at DESC
            LIMIT 10
        ''', [user_id, user_id, today])
        
        not_checked_in_friends_list = [dict(friend) for friend in not_checked_in_friends]
        return jsonify(not_checked_in_friends_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 分页获取用户好友列表
@app.route('/api/user/<int:user_id>/friends/paginated', methods=['GET'])
@rate_limit(max_requests=60, window=60)
def get_friends_paginated(user_id):
    try:
        if user_id <= 0:
            return jsonify({"error": "无效的用户ID"}), 400
        
        # 获取查询参数
        page = request.args.get('page', 1, type=int)
        page_size = min(request.args.get('page_size', 20, type=int), 50)  # 限制最大页面大小
        offset = (page - 1) * page_size
        
        if page < 1 or page_size < 1:
            return jsonify({"error": "无效的分页参数"}), 400
        
        # 查询用户的好友列表，包含亲密度分数，按亲密度降序排列
        friends = query_db('''
            SELECT u.id, u.username, u.nickname, u.avatar_url, 
                   COALESCE(i.score, 0) as intimacy_score, f.created_at
            FROM friendships f
            JOIN users u ON f.friend_id = u.id
            LEFT JOIN intimacy_scores i ON u.id = i.friend_id AND i.user_id = ?
            WHERE f.user_id = ?
            ORDER BY COALESCE(i.score, 0) DESC, f.created_at DESC
            LIMIT ? OFFSET ?
        ''', [user_id, user_id, page_size, offset])
        
        # 查询总好友数量
        total_count = query_db('''
            SELECT COUNT(*) as count FROM friendships WHERE user_id = ?
        ''', [user_id], one=True)['count']
        
        friends_list = [dict(friend) for friend in friends]
        
        return jsonify({
            'friends': friends_list,
            'total_count': total_count,
            'current_page': page,
            'page_size': page_size,
            'total_pages': (total_count + page_size - 1) // page_size
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 提醒好友打卡
@app.route('/api/remind-friend/<int:user_id>/<int:friend_id>', methods=['POST'])
@rate_limit(max_requests=10, window=60)
def remind_friend(user_id, friend_id):
    try:
        if user_id <= 0 or friend_id <= 0:
            return jsonify({"error": "无效的用户ID"}), 400
        
        if user_id == friend_id:
            return jsonify({"error": "不能提醒自己"}), 400
        
        # 检查用户和好友是否存在，以及是否为好友关系
        friendship = query_db('''
            SELECT id FROM friendships WHERE user_id = ? AND friend_id = ? AND status = 'accepted'
        ''', [user_id, friend_id], one=True)
        
        if not friendship:
            return jsonify({"error": "用户之间不是好友关系"}), 400
        
        # 创建提醒消息
        message_id = insert_db('''
            INSERT INTO messages (sender_id, receiver_id, type, content, created_at) 
            VALUES (?, ?, ?, ?, ?)
        ''', [user_id, friend_id, 'remind', '您的好友提醒您今天记得打卡', datetime.now().strftime('%Y-%m-%d %H:%M:%S')])
        
        # 更新亲密度分数
        update_intimacy_score(user_id, friend_id, 1)  # 提醒好友增加1分亲密度
        
        return jsonify({"success": True, "message": "提醒发送成功"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 获取用户消息列表
@app.route('/api/user/<int:user_id>/messages', methods=['GET'])
@rate_limit(max_requests=60, window=60)
def get_messages(user_id):
    try:
        if user_id <= 0:
            return jsonify({"error": "无效的用户ID"}), 400
        
        # 添加分页支持
        page = request.args.get('page', 1, type=int)
        page_size = min(request.args.get('page_size', 20, type=int), 100)
        offset = (page - 1) * page_size
        
        messages = query_db('''
            SELECT m.*, u.username, u.nickname, u.avatar_url
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.receiver_id = ?
            ORDER BY m.created_at DESC
            LIMIT ? OFFSET ?
        ''', [user_id, page_size, offset])
        
        messages_list = [dict(msg) for msg in messages]
        return jsonify(messages_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 标记消息为已读
@app.route('/api/message/<int:message_id>/read', methods=['PUT'])
@rate_limit(max_requests=30, window=60)
def mark_message_read(message_id):
    try:
        if message_id <= 0:
            return jsonify({"error": "无效的消息ID"}), 400
        
        rows_affected = update_db('UPDATE messages SET read_status = 1 WHERE id = ?', [message_id])
        
        if rows_affected > 0:
            return jsonify({"success": True, "message": "消息标记为已读成功"})
        else:
            return jsonify({"error": "消息不存在"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 获取用户信息
@app.route('/api/user/<int:user_id>', methods=['GET'])
@rate_limit(max_requests=60, window=60)
def get_user_info(user_id):
    try:
        if user_id <= 0:
            return jsonify({"error": "无效的用户ID"}), 400
        
        user = query_db('SELECT id, username, nickname, avatar_url, phone FROM users WHERE id = ?', [user_id], one=True)
        
        if user:
            return jsonify(dict(user))
        else:
            return jsonify({"error": "用户不存在"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 更新用户信息
@app.route('/api/user/<int:user_id>', methods=['PUT'])
@rate_limit(max_requests=20, window=60)
def update_user_info(user_id):
    try:
        if user_id <= 0:
            return jsonify({"error": "无效的用户ID"}), 400
        
        data = request.get_json()
        if not data:
            return jsonify({"error": "无效的JSON数据"}), 400
        
        nickname = data.get('nickname')
        phone = data.get('phone')
        avatar_url = data.get('avatar_url')
        
        # 验证手机号格式（简单验证）
        if phone and not re.match(r'^1[3-9]\d{9}$', phone):
            return jsonify({"error": "手机号格式不正确"}), 400
        
        # 清理输入数据
        if nickname:
            nickname = sanitize_input(nickname, max_length=100)
        if phone:
            phone = sanitize_input(phone, max_length=20)
        if avatar_url:
            avatar_url = sanitize_input(avatar_url, max_length=255)
        
        # 更新用户信息
        update_fields = []
        update_values = []
        
        if nickname is not None:
            update_fields.append("nickname = ?")
            update_values.append(nickname)
        
        if phone is not None:
            update_fields.append("phone = ?")
            update_values.append(phone)
            
        if avatar_url is not None:
            update_fields.append("avatar_url = ?")
            update_values.append(avatar_url)
        
        if not update_fields:
            return jsonify({"error": "没有提供需要更新的字段"}), 400
        
        update_values.append(user_id)
        query = f"UPDATE users SET {', '.join(update_fields)} WHERE id = ?"
        
        update_db(query, update_values)
        
        return jsonify({"success": True, "message": "用户信息更新成功"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 添加好友关系
@app.route('/api/add-friend', methods=['POST'])
@rate_limit(max_requests=10, window=60)
def add_friend():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "无效的JSON数据"}), 400
        
        user_id = data.get('user_id')
        friend_id = data.get('friend_id')
        
        if not user_id or not friend_id:
            return jsonify({"error": "缺少用户ID或好友ID"}), 400
        
        if not isinstance(user_id, int) or not isinstance(friend_id, int):
            return jsonify({"error": "用户ID必须是整数"}), 400
        
        if user_id <= 0 or friend_id <= 0:
            return jsonify({"error": "用户ID必须大于0"}), 400
        
        if user_id == friend_id:
            return jsonify({"error": "不能添加自己为好友"}), 400
        
        # 检查用户和好友是否存在
        user_exists = query_db('SELECT id FROM users WHERE id = ?', [user_id], one=True)
        friend_exists = query_db('SELECT id FROM users WHERE id = ?', [friend_id], one=True)
        
        if not user_exists or not friend_exists:
            return jsonify({"error": "用户或好友不存在"}), 404
        
        # 检查是否已经存在好友关系
        existing_friendship = query_db('''
            SELECT id FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
        ''', [user_id, friend_id, friend_id, user_id], one=True)
        
        if existing_friendship:
            return jsonify({"success": True, "message": "好友关系已存在"})
        
        # 添加好友关系（双向）
        insert_db('INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, ?)', [user_id, friend_id, 'accepted'])
        insert_db('INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, ?)', [friend_id, user_id, 'accepted'])
        
        return jsonify({"success": True, "message": "好友添加成功"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 获取用户未读消息数量
@app.route('/api/user/<int:user_id>/unread-messages-count', methods=['GET'])
@rate_limit(max_requests=30, window=60)
def get_unread_messages_count(user_id):
    try:
        if user_id <= 0:
            return jsonify({"error": "无效的用户ID"}), 400
        
        count = query_db('''
            SELECT COUNT(*) as count FROM messages 
            WHERE receiver_id = ? AND read_status = 0
        ''', [user_id], one=True)['count']
        
        return jsonify({"unread_count": count})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 获取用户统计信息
@app.route('/api/stats/<int:user_id>', methods=['GET'])
@rate_limit(max_requests=60, window=60)
def get_stats(user_id):
    try:
        if user_id <= 0:
            return jsonify({"error": "无效的用户ID"}), 400
        
        total_checkins = query_db(
            'SELECT COUNT(*) as count FROM records WHERE user_id = ?', 
            [user_id], one=True
        )['count']
        
        # 统计好友数量
        friend_count = query_db(
            'SELECT COUNT(*) as count FROM friendships WHERE user_id = ?', 
            [user_id], one=True
        )['count']
        
        # 获取未打卡的好友数量
        # 先获取所有好友ID
        friend_ids = query_db(
            'SELECT friend_id FROM friendships WHERE user_id = ?', 
            [user_id]
        )
        friend_ids = [f['friend_id'] for f in friend_ids]
        
        not_checked_in_friends = 0
        if friend_ids:
            # 构建查询语句
            placeholders = ','.join(['?' for _ in friend_ids])
            today = datetime.now().strftime('%Y-%m-%d')
            
            # 查询今天已打卡的好友
            checked_in_friend_ids = query_db(
                f'SELECT DISTINCT user_id FROM records WHERE user_id IN ({placeholders}) AND date = ?',
                friend_ids + [today]
            )
            checked_in_friend_ids = [f['user_id'] for f in checked_in_friend_ids]
            
            # 未打卡的好友数量
            not_checked_in_friends = len([fid for fid in friend_ids if fid not in checked_in_friend_ids])
        
        recent_checkins = query_db(
            'SELECT * FROM records WHERE user_id = ? ORDER BY create_time DESC LIMIT 5', 
            [user_id]
        )
        recent_list = [dict(record) for record in recent_checkins]
        
        stats = {
            'total_checkins': total_checkins,
            'recent_checkins': recent_list,
            'friend_count': friend_count,
            'not_checked_in_friends': not_checked_in_friends
        }
        return jsonify(stats)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def check_and_init_db():
    """Check if database has required tables, initialize if missing"""
    if not os.path.exists(DATABASE):
        init_db()
        return

    # 检查数据库表是否完整
    with app.app_context():
        db = get_db()
        cursor = db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        users_table_exists = cursor.fetchone() is not None
        
        if not users_table_exists:
            init_db()

def update_intimacy_score(user_id, friend_id, score_change):
    """更新亲密度分数"""
    try:
        # 检查是否已有亲密度记录
        existing_score = query_db(
            'SELECT score FROM intimacy_scores WHERE user_id = ? AND friend_id = ?', 
            [user_id, friend_id], one=True
        )
        
        if existing_score:
            new_score = max(0, existing_score['score'] + score_change)  # 确保分数不低于0
            update_db(
                'UPDATE intimacy_scores SET score = ?, updated_at = ? WHERE user_id = ? AND friend_id = ?',
                [new_score, datetime.now().strftime('%Y-%m-%d %H:%M:%S'), user_id, friend_id]
            )
        else:
            new_score = max(0, 10 + score_change)  # 新增好友初始分数
            insert_db(
                'INSERT INTO intimacy_scores (user_id, friend_id, score, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
                [user_id, friend_id, new_score, datetime.now().strftime('%Y-%m-%d %H:%M:%S'), datetime.now().strftime('%Y-%m-%d %H:%M:%S')]
            )
    except Exception as e:
        print(f"更新亲密度分数失败: {str(e)}")

# 配置静态文件路由
from flask import send_from_directory
import os

# 静态文件服务 - 提供图片等资源
@app.route('/images/<path:filename>')
def serve_images(filename):
    return send_from_directory(os.path.join(app.root_path, '../images'), filename)

if __name__ == '__main__':
    check_and_init_db()
    app.run(host='0.0.0.0', port=5000, debug=False)  # 生产环境关闭调试模式