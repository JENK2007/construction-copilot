from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.agents.cost_agent import run_cost_agent

router = APIRouter()

class CostQuery(BaseModel):
    query: str

@router.post("/estimate")
async def get_cost_estimate(body: CostQuery):
    if not body.query or len(body.query.strip()) < 5:
        raise HTTPException(status_code=400, detail="Query too short")
    
    try:
        result = await run_cost_agent(body.query)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))