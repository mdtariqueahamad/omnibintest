from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db_indexes
from app.routers import bins, chat


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database indexes on startup
    init_db_indexes()
    yield
    # Clean up resources on shutdown if necessary


app = FastAPI(
    title="OmniBin Smart Waste Management API",
    description="Backend API services for smart IoT dustbin ingestion and NetworkX-optimized routing.",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for frontend web integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include application routers
app.include_router(bins.router)
app.include_router(chat.router)


@app.get("/", tags=["Health"])
def root():
    """Root endpoint verifying API operational status."""
    return {
        "system": "OmniBin Smart Waste Management",
        "status": "Operational",
        "documentation": "/docs",
    }
