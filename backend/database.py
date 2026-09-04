from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# load .env so os.getenv() can read it
load_dotenv()

# connection string from .env — never hardcode secrets
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./temp.db")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# engine = the connection pool
if DATABASE_URL and DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

# SessionLocal = a factory for DB sessions
SessionLocal = sessionmaker(bind=engine, autoflush=False)

# Base = all ORM models inherit from this
Base = declarative_base()

# create all tables
def init_db() -> None:
    """Create all SQLAlchemy tables for the configured database."""
    try:
        # import all models so their metadata is registered before create_all
        import models.user  # noqa: F401
        import models.trip  # noqa: F401
        import models.conversation  # noqa: F401
        import models.message  # noqa: F401
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Warning: could not initialize database tables: {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
