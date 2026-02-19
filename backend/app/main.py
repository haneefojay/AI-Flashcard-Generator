from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .routers import flashcard, auth, route1, deck, export_deck
from .core.config import settings
from .models import Base
from .database import engine, AsyncSessionLocal
from sqlalchemy.sql import text
import logging


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.project_name,
    version=settings.version,
    description="AI-powered flashcard generation API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(lambda sync_conn: Base.metadata.create_all(bind=sync_conn))


@app.on_event("shutdown")
async def shutdown():
    await engine.dispose()
    logger.info("Closed database connections")

@app.get("/health")
async def health_check():
    """Health check endpoint with database connection test"""
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
            db_status = "connected"
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        db_status = "disconnected"
        
    return {
        "status": "healthy",
        "database": db_status,
        "version": settings.version
    }

app.include_router(flashcard.router)
app.include_router(auth.router)
app.include_router(route1.router)
app.include_router(deck.router)
app.include_router(export_deck.router)


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception handler caught: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected error occurred. Please try again later."
        }
    )