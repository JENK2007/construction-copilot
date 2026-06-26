import asyncio
from app.agents.cost_agent
import run_cost_agent

async def test():
    query = "How much does concrete foundation work cost?"
    print(f"Query: {query}\n")
    result = await run_cost_agent(query)
    print(f"Agent: {result['agent']}")
    print(f"Keywords used: {result['keywords_used']}")
    print(f"Source rows found: {len(result['source_rows'])}")
    print(f"Average bid in results: ${result['average_bid_in_results']:,.0f}" if result['average_bid_in_results'] else "No data")
    print(f"\nAnswer:\n{result['answer']}")

asyncio.run(test())