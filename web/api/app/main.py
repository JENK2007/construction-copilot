from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import create_tables
from app.routers.chat import router as chat_router
from app.mcp.postgres_mcp import router as mcp_router
from app.routers.pdf import router as pdf_router

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

app.include_router(chat_router, prefix="/api")
app.include_router(mcp_router, prefix="/api")
app.include_router(pdf_router, prefix="/api")
