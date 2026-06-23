from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import create_tables

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
