from openai import OpenAI
from app.core.config import settings
from app.agents.cost_agent import run_cost_agent
from app.agents.knowledge_agent import run_knowledge_agent
from app.agents.material_agent import run_material_agent
from app.agents.risk_agent import run_risk_agent

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=settings.openrouter_api_key,
)

ROUTING_RULES = {
    "cost": ["cost", "price", "estimate", "budget", "expensive", "cheap", "how much", "rate", "bid"],
    "material": ["material", "concrete", "steel", "wood", "asphalt", "cement", "brick", "pipe", "recommend"],
    "document": ["pdf", "document", "upload", "boq", "bill of quantities", "analyze", "extract", "file"],
    "knowledge": ["what is", "how to", "explain", "define", "method", "technique", "standard", "code"],
}

def rule_based_route(query: str) -> str | None:
    q = query.lower()
    scores = {agent: 0 for agent in ROUTING_RULES}
    for agent, keywords in ROUTING_RULES.items():
        for kw in keywords:
            if kw in q:
                scores[agent] += 1
    best = max(scores, key=scores.get)
    if scores[best] > 0:
        return best
    return None

def llm_route(query: str) -> str:
    prompt = f"""You are a routing system for a Construction Project Copilot.
Classify this user query into exactly one of these agents:
- cost: questions about prices, estimates, budgets, bid amounts
- material: questions about construction materials, recommendations, alternatives
- document: requests to analyze uploaded PDFs, BOQs, cost sheets
- knowledge: general construction concepts, methods, standards, explanations

Query: "{query}"

Respond with ONLY one word: cost, material, document, or knowledge"""

    response = client.chat.completions.create(
        model="openrouter/free",
        messages=[{"role": "user", "content": prompt}],
    )
    result = response.choices[0].message.content.strip().lower()
    for agent in ["cost", "material", "document", "knowledge"]:
        if agent in result:
            return agent
    return "knowledge"

async def route_query(query: str) -> dict:
    agent = rule_based_route(query)
    method = "rules"

    if agent is None:
        agent = llm_route(query)
        method = "llm"

    return {
        "agent": agent,
        "routing_method": method,
        "query": query
    }

async def run_orchestrator(query: str) -> dict:
    routing = await route_query(query)
    agent = routing["agent"]
    method = routing["routing_method"]

    if agent == "cost":
        result = await run_cost_agent(query)
        result["intent"] = "cost"
        result["routed_to"] = "Cost Estimation Agent"
        result["routing_method"] = method
        return result

    if agent == "knowledge":
        result = await run_knowledge_agent(query)
        result["intent"] = "knowledge"
        result["routed_to"] = "Construction Knowledge Agent"
        result["routing_method"] = method
        return result

    if agent == "risk":
        result = await run_risk_agent(query)
        result["intent"] = "risk"
        result["routed_to"] = "Risk Analysis Agent"
        result["routing_method"] = method
        return result

    if agent == "material":
        result = await run_material_agent(query)
        result["intent"] = "material"
        result["routed_to"] = "Material Recommendation Agent"
        result["routing_method"] = method
        return result

    return {
        "agent": "Orchestrator",
        "intent": agent,
        "routed_to": f"{agent.capitalize()} Agent (coming soon)",
        "routing_method": method,
        "answer": f"This is a {agent} question. This agent is coming soon.",
        "source_rows": [],
        "keywords_used": [],
        "average_bid_in_results": None,
    }