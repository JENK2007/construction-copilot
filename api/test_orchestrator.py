import asyncio
from app.agents.orchestrator import route_query

async def test():
    tests = [
        "How much does concrete foundation cost?",
        "What is the best material for roofing?",
        "Analyze this PDF document",
        "What is post-tension concrete?",
        "Something completely random"
    ]
    for q in tests:
        result = await route_query(q)
        print(f"[{result['routing_method']:5}] {result['agent']:10} <- {q}")

asyncio.run(test())