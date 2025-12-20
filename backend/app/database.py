from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import AsyncAdaptedQueuePool
from app.core.config import settings
import logging
from fastapi import HTTPException

logger = logging.getLogger(__name__)


database_url = settings.database_url
if database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif not database_url.startswith("postgresql+asyncpg://"):
    pass

# Configure the engine with connection pooling and timeouts
engine = create_async_engine(
    database_url,
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