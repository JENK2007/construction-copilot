from openai import OpenAI
from app.core.config import settings

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=settings.openrouter_api_key,
)

async def run_knowledge_agent(query: str) -> dict:
    """Construction Knowledge Agent — answers general construction questions."""

    prompt = f"""You are a Construction Knowledge Expert with deep expertise in:
- Construction materials and methods
- Engineering principles
- Building codes and standards
- Construction terminology
- Project management concepts

User question: {query}

Provide a clear, practical answer that helps contractors, engineers, and builders.
Be specific and actionable. Keep it concise but complete."""

    response = client.chat.completions.create(
        model="openrouter/auto",
        messages=[{"role": "user", "content": prompt}],
    )

    answer = response.choices[0].message.content

    return {
        "agent": "Construction Knowledge Agent",
        "answer": answer,
        "source_rows": [],
        "keywords_used": [],
        "average_bid_in_results": None,
    }