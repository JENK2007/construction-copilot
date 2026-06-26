from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.agents.orchestrator import run_orchestrator

router = APIRouter()

class OrchestratorQuery(BaseModel):
    query: str

@router.post("/chat")
async def chat(body: OrchestratorQuery):
    if not body.query or len(body.query.strip()) < 3:
        raise HTTPException(status_code=400, detail="Query too short")
    try:
        result = await run_orchestrator(body.query)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))