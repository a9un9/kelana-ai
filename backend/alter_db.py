import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE trips ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
        conn.commit()
        print("Column added.")
    except Exception as e:
        print("Error:", e)
