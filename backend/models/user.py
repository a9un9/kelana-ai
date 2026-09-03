from sqlalchemy import Column, BigInteger, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True)
    name = Column(String(100))
    email = Column(String(255), unique=True)
    password_hash = Column(String(255))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now(), nullable=True)
    created_by = Column(String(100), nullable=True)
    updated_by = Column(String(100), nullable=True)

    trips = relationship("Trip", back_populates="owner")
    conversations = relationship("Conversation", back_populates="user")

# Import models at the end to avoid circular imports but ensure registry is populated
import models.trip  # noqa: F401
import models.conversation  # noqa: F401
