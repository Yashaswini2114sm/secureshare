"""
SecureShare Database Module
============================
Sets up SQLAlchemy async engine and session factory.
Supports both PostgreSQL (production) and SQLite (development).

Usage:
    from app.database import get_db, Base
    
    # In FastAPI endpoint:
    async def my_endpoint(db: AsyncSession = Depends(get_db)):
        ...
"""

# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


# ── Create async engine ──────────────────────────────────────────
# connect_args needed for SQLite to allow multi-threaded access
connect_args = {}
if "sqlite" in settings.DATABASE_URL:
    connect_args = {"check_same_thread": False}

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,          # Log SQL queries when DEBUG=True
    connect_args=connect_args,
)

# ── Session factory ──────────────────────────────────────────────
# Each request gets its own session via dependency injection
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,       # Keep objects usable after commit
)


# ── Base model class ─────────────────────────────────────────────
class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""
    pass


# ── Dependency: get database session ─────────────────────────────
async def get_db():
    """
    FastAPI dependency that provides a database session.
    Automatically closes the session when the request is done.
    
    Usage:
        @router.get("/items")
        async def get_items(db: AsyncSession = Depends(get_db)):
            result = await db.execute(select(Item))
            return result.scalars().all()
    """
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ── Create all tables ────────────────────────────────────────────
async def init_db():
    """
    Create all database tables defined by models inheriting from Base.
    Called once during application startup.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
