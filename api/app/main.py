from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import create_tables
from app.routers import cost, orchestrator

app = FastAPI(title="Construction Copilot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    create_tables()

@app.get("/health")
def health():
    return {"status": "ok", "service": "construction-copilot-api"}

# Routers
app.include_router(cost.router, prefix="/api/cost", tags=["Cost Estimation"])
app.include_router(orchestrator.router, prefix="/api/orchestrator", tags=["Orchestrator"])