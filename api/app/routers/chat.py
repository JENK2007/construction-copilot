from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.agents.orchestrator import route_query
from app.agents.cost_agent import run_cost_agent
from app.agents.knowledge_agent import run_knowledge_agent
from app.agents.material_agent import run_material_agent
from app.agents.risk_agent import run_risk_agent

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    conversation_id: str = "default"

class ChatResponse(BaseModel):
    answer: str
    agent: str
    routing_method: str
    source_rows: list = []

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Step 1: Route the query
    routing = await route_query(request.message)
    agent = routing["agent"]
    method = routing["routing_method"]

    # Step 2: Run the correct specialist agent
    if agent == "cost":
        result = await run_cost_agent(request.message)
    elif agent == "material":
        result = await run_material_agent(request.message)
    elif agent == "risk":
        result = await run_risk_agent(request.message)
    else:
        result = await run_knowledge_agent(request.message)

    return ChatResponse(
        answer=result["answer"],
        agent=result["agent"],
        routing_method=method,
        source_rows=result.get("source_rows", []),
    )