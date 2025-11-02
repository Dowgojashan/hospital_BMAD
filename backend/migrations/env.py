import os
import sys
from logging.config import fileConfig

# [--- 開始修正 ---]
# 獲取 env.py 檔案所在的目錄 (/app/migrations)
script_dir = os.path.dirname(os.path.abspath(__file__))
# 獲取該目錄的上一層目錄 (/app)
project_root = os.path.dirname(script_dir)
# 將 /app 目錄加入到 Python 的 sys.path 中
sys.path.append(project_root)
# [--- 修正完畢 ---]

from alembic import context
from sqlalchemy import engine_from_config, pool

# [關鍵] 這一行現在應該可以正常運作了
from app.db.base import Base
# 讀取 .ini 檔案的設定
config = context.config

# 設定日誌
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# [關鍵] 將您的 Base 設為 Alembic 的目標
# 這樣 Alembic 在 "autogenerate" 時才能看到您的模型
target_metadata = Base.metadata

# --- 以下為資料庫連線設定 ---

def get_url():
    """從環境變數 .env 讀取 DATABASE_URL"""
    return os.getenv("DATABASE_URL")

def run_migrations_offline() -> None:
    """在離線模式下執行遷移。"""
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """在連線模式下執行遷移。"""
    # 使用 .ini 檔案中的設定（它會讀取 ${DATABASE_URL}）
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        url=get_url() # 確保使用 .env 的 URL
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()