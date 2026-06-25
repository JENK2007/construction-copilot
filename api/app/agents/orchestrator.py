from openai import OpenAI
from app.core.config import settings

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