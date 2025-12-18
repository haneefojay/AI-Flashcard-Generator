from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import AsyncAdaptedQueuePool
from app.core.config import settings
import logging
from fastapi import HTTPException

logger = logging.getLogger(__name__)

DATABASE_URL = f"postgresql+asyncpg://{settings.database_username}:{settings.database_password}@{settings.database_hostname}:{settings.database_port}/{settings.database_name}"

# Configure the engine with connection pooling and timeouts
engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # Set to False in production
    future=True,
)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


'''
async def get_db():
    session = AsyncSessionLocal()
    try:
        yield session
    except Exception as e:
        logger.error(f"Database error: {str(e)}")
        await session.rollback()
        raise HTTPException(
            status_code=500,
            detail="Database error occurred"
        )
    finally:
        await session.close()
'''