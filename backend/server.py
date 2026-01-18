from flask import Flask, request, jsonify, g
import sqlite3
import json
import os
from datetime import datetime
import hashlib
import secrets
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
DATABASE = '打卡记录.db'

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row  # 使结果可以像字典一样访问
    return db

def init_db():
    with app.app_context():
        db = get_db()
        # 以UTF-8编码读取schema.sql文件
        with open('schema.sql', 'r', encoding='utf-8') as f:
            db.cursor().executescript(f.read())
        db.commit()

def query_db(query, args=(), one=False):
    cur = get_db().execute(query, args)
    rv = cur.fetchall()
    cur.close()
    return (rv[0] if rv else None) if one else rv

def insert_db(query, args=()):
    db = get_db()
    cur = db.execute(query, args)
    db.commit()
    return cur.lastrowid

def update_db(query, args=()):
    db = get_db()
    cur = db.execute(query, args)
    db.commit()
    return cur.rowcount

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

@app.route('/')
def hello():
    return jsonify({"message": "欢迎使用人生打卡后端服务!"})

# 用户注册
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # 验证必需字段
        if not data.get('username') or not data.get('password'):
            return jsonify({"error": "用户名和密码不能为空"}), 400
        
        # 检查用户名是否已存在
        existing_user = query_db('SELECT id FROM users WHERE username = ?', [data['username']], one=True)
        if existing_user:
            return jsonify({"error": "用户名已存在"}), 400
        
        # 生成密码哈希
        password_hash = generate_password_hash(data['password'])
        
        # 创建新用户
        user_id = insert_db(
            'INSERT INTO users (username, password_hash, email, nickname, avatar_url) VALUES (?, ?, ?, ?, ?)',
            [data['username'], password_hash, data.get('email', ''), data.get('nickname', data['username']), data.get('avatar_url', '/images/default-avatar.png')]
        )
        
        # 检查是否有推荐人ID，建立好友关系
        referrer_id = data.get('referrer_id')
        if referrer_id and referrer_id != user_id:
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
def login():
    try:
        data = request.get_json()
        
        # 验证必需字段
        if not data.get('username') or not data.get('password'):
            return jsonify({"error": "用户名和密码不能为空"}), 400
        
        # 查找用户
        user = query_db(
            'SELECT id, username, password_hash, nickname, email, avatar_url FROM users WHERE username = ?', 
            [data['username']], one=True
        )
        
        if not user or not check_password_hash(user['password_hash'], data['password']):
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
def get_records():
    try:
        records = query_db('SELECT * FROM records ORDER BY create_time DESC')
        # 将sqlite3.Row对象转换为字典
        records_list = [dict(record) for record in records]
        return jsonify(records_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 获取单个用户的打卡记录
@app.route('/api/user/<int:user_id>/records', methods=['GET'])
def get_user_records(user_id):
    try:
        records = query_db('SELECT * FROM records WHERE user_id = ? ORDER BY create_time DESC', [user_id])
        records_list = [dict(record) for record in records]
        return jsonify(records_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 用户打卡
@app.route('/api/checkin', methods=['POST'])
def do_checkin():
    try:
        data = request.get_json()
        
        # 验证必需字段
        if not data.get('user_id') or not data.get('title'):
            return jsonify({"error": "缺少必需字段"}), 400
        
        # 检查用户今天是否已经打过卡
        today = datetime.now().strftime('%Y-%m-%d')
        user_id = data.get('user_id')
        
        existing_checkin = query_db(
            'SELECT id FROM records WHERE user_id = ? AND date = ? LIMIT 1', 
            [user_id, today], 
            one=True
        )
        
        if existing_checkin:
            return jsonify({"error": "今天已经打过卡了"}), 400
        
        # 插入新的打卡记录
        record_id = insert_db(
            'INSERT INTO records (user_id, title, content, date, create_time) VALUES (?, ?, ?, ?, ?)',
            [data.get('user_id'), data.get('title'), data.get('content', ''), 
             data.get('date', today), 
             datetime.now().strftime('%Y-%m-%d %H:%M:%S')]
        )
        
        # 获取刚刚插入的记录
        new_record = query_db('SELECT * FROM records WHERE id = ?', [record_id], one=True)
        return jsonify({"success": True, "record": dict(new_record)}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500



# 创建打卡任务
@app.route('/api/task', methods=['POST'])
def create_task():
    try:
        data = request.get_json()
        
        # 验证必需字段
        if not data.get('user_id') or not data.get('title'):
            return jsonify({"error": "缺少必需字段"}), 400
        
        # 插入新的打卡任务
        task_id = insert_db(
            '''INSERT INTO checkin_tasks 
               (user_id, title, description, type, target_days, remind_time, created_at, updated_at) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
            [data.get('user_id'), 
             data.get('title'), 
             data.get('description', ''), 
             data.get('type', 'daily'),
             data.get('target_days', 30),
             data.get('remind_time', '08:00'),
             datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
             datetime.now().strftime('%Y-%m-%d %H:%M:%S')]
        )
        
        # 获取刚刚插入的任务
        new_task = query_db('SELECT * FROM checkin_tasks WHERE id = ?', [task_id], one=True)
        return jsonify({"success": True, "task": dict(new_task)}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 获取用户的所有打卡任务
@app.route('/api/user/<int:user_id>/tasks', methods=['GET'])
def get_user_tasks(user_id):
    try:
        tasks = query_db('SELECT * FROM checkin_tasks WHERE user_id = ? ORDER BY created_at DESC', [user_id])
        tasks_list = [dict(task) for task in tasks]
        return jsonify(tasks_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 删除打卡任务
@app.route('/api/task/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    try:
        # 先检查任务是否存在
        task = query_db('SELECT id, user_id FROM checkin_tasks WHERE id = ?', [task_id], one=True)
        if not task:
            return jsonify({"error": "任务不存在"}), 404
        
        # 删除任务
        rows_affected = update_db('DELETE FROM checkin_tasks WHERE id = ?', [task_id])
        
        if rows_affected > 0:
            return jsonify({"success": True, "message": "任务已删除"}), 200
        else:
            return jsonify({"error": "删除失败"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 修改用户密码
@app.route('/api/change-password', methods=['POST'])
def change_password():
    try:
        data = request.get_json()
        
        # 验证必需字段
        if not data.get('user_id') or not data.get('old_password') or not data.get('new_password'):
            return jsonify({"error": "缺少必需字段"}), 400
        
        user_id = data.get('user_id')
        old_password = data.get('old_password')
        new_password = data.get('new_password')
        
        # 验证新密码长度
        if len(new_password) < 6:
            return jsonify({"error": "新密码长度至少6位"}), 400
        
        # 获取当前用户信息
        user = query_db('SELECT id, password_hash FROM users WHERE id = ?', [user_id], one=True)
        
        if not user:
            return jsonify({"error": "用户不存在"}), 404
        
        # 验证旧密码
        if not check_password_hash(user['password_hash'], old_password):
            return jsonify({"error": "原密码错误"}), 400
        
        # 更新密码
        new_password_hash = generate_password_hash(new_password)
        update_db('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', 
                  [new_password_hash, datetime.now().strftime('%Y-%m-%d %H:%M:%S'), user_id])
        
        return jsonify({"success": True, "message": "密码修改成功"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 获取用户的好友列表
@app.route('/api/user/<int:user_id>/friends', methods=['GET'])
def get_friends(user_id):
    try:
        # 查询用户的好友列表
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

# 更新亲密度分数
def update_intimacy_score(user_id, friend_id, action='interact'):
    """更新用户间的亲密度分数"""
    try:
        # 根据不同行为给予不同分数
        score_increment = 0
        if action == 'remind':
            score_increment = 5  # 提醒好友 +5分
        elif action == 'interact':
            score_increment = 1  # 一般互动 +1分
        elif action == 'checkin_together':
            score_increment = 3  # 同时打卡 +3分
        
        # 检查是否已有亲密度记录
        existing_record = query_db('''
            SELECT id, score FROM intimacy_scores WHERE user_id = ? AND friend_id = ?
        ''', [user_id, friend_id], one=True)
        
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        if existing_record:
            # 更新现有记录
            new_score = existing_record['score'] + score_increment
            update_db('''
                UPDATE intimacy_scores 
                SET score = ?, last_interaction = ? 
                WHERE user_id = ? AND friend_id = ?
            ''', [new_score, current_time, user_id, friend_id])
        else:
            # 创建新记录
            insert_db('''
                INSERT INTO intimacy_scores (user_id, friend_id, score, last_interaction) 
                VALUES (?, ?, ?, ?)
            ''', [user_id, friend_id, score_increment, current_time])
        
        # 同时更新反向关系
        existing_reverse = query_db('''
            SELECT id, score FROM intimacy_scores WHERE user_id = ? AND friend_id = ?
        ''', [friend_id, user_id], one=True)
        
        if existing_reverse:
            # 更新现有记录
            update_db('''
                UPDATE intimacy_scores 
                SET last_interaction = ? 
                WHERE user_id = ? AND friend_id = ?
            ''', [current_time, friend_id, user_id])
        else:
            # 创建新记录
            insert_db('''
                INSERT INTO intimacy_scores (user_id, friend_id, score, last_interaction) 
                VALUES (?, ?, ?, ?)
            ''', [friend_id, user_id, 0, current_time])
        
        return True
    except Exception as e:
        print(f"更新亲密度分数失败: {str(e)}")
        return False

# 获取用户未打卡的好友列表（按亲密度排序）
@app.route('/api/user/<int:user_id>/not-checked-in-friends', methods=['GET'])
def get_not_checked_in_friends(user_id):
    try:
        # 获取用户的好友ID列表
        friend_ids = query_db('''
            SELECT friend_id FROM friendships WHERE user_id = ?
        ''', [user_id])
        
        if not friend_ids:
            return jsonify([])
        
        # 将好友ID转换为列表
        friend_ids = [f['friend_id'] for f in friend_ids]
        
        # 构建查询语句以找出今天未打卡的好友
        placeholders = ','.join(['?' for _ in friend_ids])
        today = datetime.now().strftime('%Y-%m-%d')
        
        # 获取今天已打卡的好友
        checked_in_friends = query_db(f'''
            SELECT DISTINCT user_id FROM records WHERE user_id IN ({placeholders}) AND date = ?
        ''', friend_ids + [today])
        
        checked_in_friend_ids = [f['user_id'] for f in checked_in_friends]
        
        # 获取今天未打卡的好友
        not_checked_in_friend_ids = [fid for fid in friend_ids if fid not in checked_in_friend_ids]
        
        if not not_checked_in_friend_ids:
            return jsonify([])
        
        # 构建查询语句获取未打卡好友的详细信息及亲密度
        placeholders = ','.join(['?' for _ in not_checked_in_friend_ids])
        not_checked_in_friends = query_db(f'''
            SELECT u.id, u.username, u.nickname, u.avatar_url, 
                   COALESCE(i.score, 0) as intimacy_score
            FROM users u
            LEFT JOIN intimacy_scores i ON u.id = i.friend_id AND i.user_id = ?
            WHERE u.id IN ({placeholders})
            ORDER BY COALESCE(i.score, 0) DESC
        ''', [user_id] + not_checked_in_friend_ids)
        
        not_checked_in_friends_list = [dict(friend) for friend in not_checked_in_friends]
        return jsonify(not_checked_in_friends_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 获取用户亲密度最高的未打卡好友列表
@app.route('/api/user/<int:user_id>/top-intimacy-not-checked-in-friends', methods=['GET'])
def get_top_intimacy_not_checked_in_friends(user_id):
    try:
        # 获取用户的好友ID列表
        friend_ids = query_db('''
            SELECT friend_id FROM friendships WHERE user_id = ?
        ''', [user_id])
        
        if not friend_ids:
            return jsonify([])
        
        # 将好友ID转换为列表
        friend_ids = [f['friend_id'] for f in friend_ids]
        
        # 构建查询语句以找出今天未打卡的好友
        placeholders = ','.join(['?' for _ in friend_ids])
        today = datetime.now().strftime('%Y-%m-%d')
        
        # 获取今天已打卡的好友
        checked_in_friends = query_db(f'''
            SELECT DISTINCT user_id FROM records WHERE user_id IN ({placeholders}) AND date = ?
        ''', friend_ids + [today])
        
        checked_in_friend_ids = [f['user_id'] for f in checked_in_friends]
        
        # 获取今天未打卡的好友
        not_checked_in_friend_ids = [fid for fid in friend_ids if fid not in checked_in_friend_ids]
        
        if not not_checked_in_friend_ids:
            return jsonify([])
        
        # 构建查询语句获取未打卡好友的详细信息及亲密度，按亲密度降序排列，限制为前10名
        placeholders = ','.join(['?' for _ in not_checked_in_friend_ids])
        not_checked_in_friends = query_db(f'''
            SELECT u.id, u.username, u.nickname, u.avatar_url, 
                   COALESCE(i.score, 0) as intimacy_score
            FROM users u
            LEFT JOIN intimacy_scores i ON u.id = i.friend_id AND i.user_id = ?
            WHERE u.id IN ({placeholders})
            ORDER BY COALESCE(i.score, 0) DESC
            LIMIT 10
        ''', [user_id] + not_checked_in_friend_ids)
        
        not_checked_in_friends_list = [dict(friend) for friend in not_checked_in_friends]
        return jsonify(not_checked_in_friends_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 获取用户的好友列表（支持分页）
@app.route('/api/user/<int:user_id>/friends/paginated', methods=['GET'])
def get_friends_paginated(user_id):
    try:
        # 获取查询参数
        page = request.args.get('page', 1, type=int)
        page_size = request.args.get('page_size', 20, type=int)
        offset = (page - 1) * page_size
        
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

# 提醒好友打卡并更新亲密度
@app.route('/api/remind-friend/<int:user_id>/<int:friend_id>', methods=['POST'])
def remind_friend(user_id, friend_id):
    try:
        # 更新亲密度分数
        success = update_intimacy_score(user_id, friend_id, 'remind')
        
        if success:
            # 创建提醒消息
            insert_db('''
                INSERT INTO messages (sender_id, receiver_id, type, content) 
                VALUES (?, ?, ?, ?)
            ''', [user_id, friend_id, 'remind', f'您的好友提醒您今天记得打卡'])
            
            return jsonify({"success": True, "message": "提醒已发送，亲密度已更新"})
        else:
            return jsonify({"success": False, "error": "操作失败"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 获取用户消息列表
@app.route('/api/user/<int:user_id>/messages', methods=['GET'])
def get_messages(user_id):
    try:
        # 获取用户的消息列表，按时间倒序排列
        messages = query_db('''
            SELECT m.*, u.nickname, u.avatar_url
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.receiver_id = ?
            ORDER BY m.created_at DESC
        ''', [user_id])
        
        messages_list = [dict(msg) for msg in messages]
        return jsonify(messages_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 标记消息为已读
@app.route('/api/message/<int:message_id>/read', methods=['PUT'])
def mark_message_read(message_id):
    try:
        update_db('UPDATE messages SET read_status = 1 WHERE id = ?', [message_id])
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 添加好友关系
@app.route('/api/add-friend', methods=['POST'])
def add_friend():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        friend_id = data.get('friend_id')
        
        if not user_id or not friend_id:
            return jsonify({"error": "缺少用户ID或好友ID"}), 400
        
        if user_id == friend_id:
            return jsonify({"error": "不能添加自己为好友"}), 400
        
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
def get_unread_messages_count(user_id):
    try:
        count = query_db('''
            SELECT COUNT(*) as count FROM messages 
            WHERE receiver_id = ? AND read_status = 0
        ''', [user_id], one=True)['count']
        
        return jsonify({"unread_count": count})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 获取用户统计信息
@app.route('/api/stats/<int:user_id>', methods=['GET'])
def get_stats(user_id):
    try:
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

if __name__ == '__main__':
    # 初始化数据库
    if not os.path.exists(DATABASE):
        init_db()
    
    # 生产环境配置
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)