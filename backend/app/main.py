from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import github

app = FastAPI(
    title="Repo2Resume API",
    description="Generate professional resume summaries from GitHub contributions",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(github.router)

# Log all registered routes on startup
@app.on_event("startup")
async def log_routes():
    print("\n" + "="*80)
    print("REGISTERED ROUTES:")
    print("="*80)
    for route in app.routes:
        if hasattr(route, 'methods') and hasattr(route, 'path'):
            print(f"{', '.join(route.methods):8} {route.path}")
    print("="*80 + "\n")


@app.get("/")
async def root():
    return {"message": "Repo2Resume API - Ready to summarize your GitHub contributions"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
