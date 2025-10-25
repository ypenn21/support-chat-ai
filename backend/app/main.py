"""FastAPI application entry point"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings

# Create FastAPI app
app = FastAPI(
    title="Support Chat AI Assistant API",
    description="AI-powered response suggestions for support agents",
    version="0.1.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check() -> JSONResponse:
    """Health check endpoint"""
    return JSONResponse(
        content={
            "status": "healthy",
            "version": "0.1.0",
            "environment": settings.ENVIRONMENT,
        }
    )


@app.get("/")
async def root() -> JSONResponse:
    """Root endpoint"""
    return JSONResponse(
        content={
            "message": "Support Chat AI Assistant API",
            "version": "0.1.0",
            "docs": "/docs" if settings.DEBUG else None,
        }
    )


# TODO: Add API routes
# from app.api.routes import suggest, auth, feedback
# app.include_router(suggest.router, prefix="/api", tags=["suggestions"])
# app.include_router(auth.router, prefix="/api", tags=["auth"])
# app.include_router(feedback.router, prefix="/api", tags=["feedback"])
