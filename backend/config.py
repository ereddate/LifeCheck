import os
from urllib.parse import quote_plus

class Config:
    """基础配置类"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    
    # 数据库配置
    DB_TYPE = os.environ.get('DB_TYPE', 'sqlite')  # sqlite, mysql, postgresql
    DATABASE_URL = os.environ.get('DATABASE_URL')
    
    # SQLite配置
    SQLITE_DB_PATH = os.environ.get('SQLITE_DB_PATH', '打卡记录.db')
    
    # MySQL配置
    MYSQL_HOST = os.environ.get('MYSQL_HOST', 'localhost')
    MYSQL_PORT = int(os.environ.get('MYSQL_PORT', 3306))
    MYSQL_USER = os.environ.get('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', '')
    MYSQL_DATABASE = os.environ.get('MYSQL_DATABASE', 'qdaily_checkin')
    
    # PostgreSQL配置
    PG_HOST = os.environ.get('PG_HOST', 'localhost')
    PG_PORT = int(os.environ.get('PG_PORT', 5432))
    PG_USER = os.environ.get('PG_USER', 'postgres')
    PG_PASSWORD = os.environ.get('PG_PASSWORD', '')
    PG_DATABASE = os.environ.get('PG_DATABASE', 'qdaily_checkin')
    
    # 连接池配置
    POOL_SIZE = int(os.environ.get('POOL_SIZE', 10))
    MAX_OVERFLOW = int(os.environ.get('MAX_OVERFLOW', 20))
    POOL_TIMEOUT = int(os.environ.get('POOL_TIMEOUT', 30))
    
    # 其他配置
    RATE_LIMIT_MAX_REQUESTS = int(os.environ.get('RATE_LIMIT_MAX_REQUESTS', 100))
    RATE_LIMIT_WINDOW = int(os.environ.get('RATE_LIMIT_WINDOW', 60))


class DatabaseConfig:
    """数据库连接配置"""
    
    @staticmethod
    def get_database_url():
        """根据环境变量返回适当的数据库URL"""
        db_type = os.environ.get('DB_TYPE', 'sqlite')
        
        if db_type.lower() == 'mysql':
            # MySQL连接URL
            host = os.environ.get('MYSQL_HOST', 'localhost')
            port = os.environ.get('MYSQL_PORT', '3306')
            user = os.environ.get('MYSQL_USER', 'root')
            password = os.environ.get('MYSQL_PASSWORD', '')
            database = os.environ.get('MYSQL_DATABASE', 'qdaily_checkin')
            
            # URL编码密码，以防包含特殊字符
            encoded_password = quote_plus(password)
            return f"mysql+pymysql://{user}:{encoded_password}@{host}:{port}/{database}?charset=utf8mb4"
            
        elif db_type.lower() == 'postgresql':
            # PostgreSQL连接URL
            host = os.environ.get('PG_HOST', 'localhost')
            port = os.environ.get('PG_PORT', '5432')
            user = os.environ.get('PG_USER', 'postgres')
            password = os.environ.get('PG_PASSWORD', '')
            database = os.environ.get('PG_DATABASE', 'qdaily_checkin')
            
            encoded_password = quote_plus(password)
            return f"postgresql://{user}:{encoded_password}@{host}:{port}/{database}"
            
        else:  # 默认使用SQLite
            db_path = os.environ.get('SQLITE_DB_PATH', '打卡记录.db')
            return f"sqlite:///{db_path}"


# 全局配置实例
config = Config()
db_config = DatabaseConfig()