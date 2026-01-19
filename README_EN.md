# LifeCheck - Life Check-in Mini Program

A mini program that encourages daily check-ins to help users develop good habits and motivate each other with friends.

**Chinese Name**: 人生打卡

## Features

### 📱 Basic Functions
- **Daily Check-in**: Record daily check-in moments and cultivate good habits
- **Check-in Statistics**: View personal check-in history and statistics
- **Task Management**: Create and manage personal check-in tasks

### 👥 Social Functions
- **Friend System**: Connect with friends and check in together
- **Reminder Function**: Remind friends to check in and strengthen friendships
- **Intimacy System**: Intimacy calculation based on interaction frequency
- **Messaging System**: Receive friend reminder notifications
- **Sharing & Invitations**: Share the mini program to invite friends

### 🔐 Security & Performance Optimization
- **SQL Injection Protection**: All database queries use parameterized queries
- **Input Validation & Sanitization**: Use bleach library to clean user inputs and prevent XSS attacks
- **Strong Password Hashing**: Enhanced password security using PBKDF2 algorithm
- **Rate Limiting**: Prevent API abuse and DDoS attacks
- **Enhanced Authentication**: Improved user verification mechanisms
- **Database Optimization**: Use WAL mode to improve concurrent performance
- **Connection Pool Management**: Support database connection reuse to improve high-concurrency performance
- **Multi-database Support**: Flexible switching between SQLite/MySQL/PostgreSQL
- **Configuration-based Deployment**: Rapid environment switching through environment variables

### 🔄 User Experience Optimization
- **Pull-to-refresh**: Support pull-down refresh for personal center page data
- **Real-time Data Sync**: Fixed friend count and message count display issues
- **Static Resource Service**: Configure backend to provide avatars and static resources
- **CORS Support**: Ensure smooth front-end and back-end communication

### 💡 Special Features
- **Closest Friend Reminders**: Prioritize showing unclocked friends with high intimacy
- **Smart Reminders**: Sort reminder lists by intimacy level
- **Paginated Friend Lists**: Support viewing all friends
- **Unread Message Count**: Display accurate unread message count

## Technical Architecture

### Frontend
- WeChat Mini Program native development
- WXML/WXSS/JavaScript
- Responsive design

### Backend
- Flask Web Framework
- Multi-database Support (SQLite/MySQL/PostgreSQL)
- RESTful API Design
- Cross-Origin Resource Sharing (CORS) support
- Static file service
- Connection Pool Management
- Configuration-based Deployment

## Quick Start

### Development Environment Setup

#### 1. Backend Service
```bash
# Enter backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Start service
python server.py
```

Service will run on `http://localhost:5000`

#### 2. Frontend Development
1. Open WeChat Developer Tools
2. Import the project root directory
3. Ensure `API_BASE_URL` in `api.js` points to the correct backend address
4. Compile and run

### Production Deployment

#### Environment Variable Configuration
The project supports configuration through environment variables, enabling rapid database switching and performance parameter adjustment:

```bash
# Database type (sqlite/mysql/postgresql)
export DB_TYPE=sqlite

# SQLite Configuration
export SQLITE_DB_PATH=打卡记录.db

# MySQL Configuration (optional)
export MYSQL_HOST=localhost
export MYSQL_PORT=3306
export MYSQL_USER=username
export MYSQL_PASSWORD=password
export MYSQL_DATABASE=qdaily_checkin

# PostgreSQL Configuration (optional)
export PG_HOST=localhost
export PG_PORT=5432
export PG_USER=username
export PG_PASSWORD=password
export PG_DATABASE=qdaily_checkin

# Performance Configuration
export POOL_SIZE=20
export MAX_OVERFLOW=30
export POOL_TIMEOUT=30
export RATE_LIMIT_MAX_REQUESTS=100
export RATE_LIMIT_WINDOW=60
```

#### Deployment Methods
1. **Traditional Deployment**: `python server.py`
2. **Production Deployment**: `gunicorn --config gunicorn.conf.py server:app`
3. **Containerized Deployment**: `docker run -d -e DB_TYPE=postgresql ... qdaily-checkin-backend`

Refer to [DEPLOYMENT.md](./backend/DEPLOYMENT.md) for detailed deployment guide.

## API Endpoints

### User Related
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `GET /api/user/{id}/records` - Get user check-in records
- `POST /api/checkin` - Perform check-in

### Social Related
- `GET /api/user/{id}/friends` - Get friend list
- `GET /api/user/{id}/top-intimacy-not-checked-in-friends` - Get closest unclocked friends
- `POST /api/add-friend` - Add friend
- `POST /api/remind-friend/{user_id}/{friend_id}` - Remind friend to check in
- `GET /api/user/{id}/messages` - Get message list
- `PUT /api/message/{id}/read` - Mark message as read
- `GET /api/user/{id}/unread-messages-count` - Get unread message count
- `GET /api/stats/{id}` - Get user statistics

## Security Features

### Protection Measures
- SQL Injection Protection: Using parameterized queries
- XSS Protection: Input sanitization and validation
- Strong Password Policy: PBKDF2 hashing algorithm
- Rate Limiting: Prevent API abuse
- Authentication: Improved user authentication flow

### Data Protection
- Sensitive data not returned directly
- Input length limits
- Regular expression validation

## Feature Highlights

### Intimacy System
Calculate intimacy scores based on interaction frequency between users, prioritizing reminders for high-intimacy friends to check in.

### Messaging Notifications
When friends remind others to check in, notification messages are generated that users can view in the message page.

### Smart Sorting
Friend lists are sorted by intimacy level, with important friends displayed first.

### Paginated Loading
Friend lists support paginated loading, improving performance with large datasets.

### Real-time Data
Fixed inaccurate display of friend counts and message counts, ensuring data updates in real-time.

## Project Structure

```
life-checkin/
├── pages/                  # Mini program pages
│   ├── add/              # Check-in page
│   ├── index/            # Records page
│   ├── detail/           # Detail page
│   ├── mine/             # Mine page
│   ├── auth/             # Authentication page
│   ├── settings/         # Settings page
│   ├── friends/          # Friends page
│   └── messages/         # Messages page
├── api.js                # API interface wrapper
├── app.js                # Mini program app configuration
├── app.json              # Mini program global configuration
├── backend/
│   ├── server.py         # Main service file
│   ├── db.py             # Database abstraction layer
│   ├── config.py         # Configuration management
│   ├── schema.sql        # Database schema
│   ├── requirements.txt  # Dependencies
│   ├── gunicorn.conf.py  # Gunicorn production configuration
│   ├── Dockerfile        # Docker containerization configuration
│   └── DEPLOYMENT.md     # Deployment documentation
└── ...
```

## Contribution

Welcome to submit Issues and PRs to jointly improve this project.

## License

MIT License