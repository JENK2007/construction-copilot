from openai import OpenAI
from app.core.config import settings
import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=settings.openrouter_api_key,
)

def query_construction_data(keywords: list[str]) -> list[dict]:
    """Query Supabase for real construction line items matching keywords."""
    conn = psycopg2.connect(settings.database_url)
    cur = conn.cursor()

    conditions = " OR ".join([
        f"cli.bid_item_description ILIKE '%{kw}%'"
        for kw in keywords
    ])

    sql = f"""
        SELECT
            cp.project_number,
            cp.bid_total,
            cp.engineers_estimate,
            cp.bid_days,
            cp.start_date,
            cli.bid_item_description,
            cli.quantity,
            cli.unit_of_measure
        FROM construction_projects cp
        JOIN construction_line_items cli ON cp.project_number = cli.project_number
        WHERE {conditions}
        ORDER BY cp.bid_total DESC
        LIMIT 10
    """

    cur.execute(sql)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    return [
        {
            "project_number": r[0],
            "bid_total": float(r[1]) if r[1] else None,
            "engineers_estimate": float(r[2]) if r[2] else None,
            "bid_days": float(r[3]) if r[3] else None,
            "start_date": str(r[4]) if r[4] else None,
            "bid_item_description": r[5],
            "quantity": float(r[6]) if r[6] else None,
            "unit_of_measure": r[7],
        }
        for r in rows
    ]

def extract_keywords(query: str) -> list[str]:
    """Extract construction keywords from user query."""
    common_words = {"how", "much", "does", "cost", "what", "is", "the", "for", "a", "an", "and", "or"}
    words = query.lower().split()
    keywords = [w for w in words if w not in common_words and len(w) > 3]
    return keywords[:3] if keywords else ["construction"]

async def run_cost_agent(query: str) -> dict:
    """Main cost estimation agent."""

    # Step 1: Extract keywords and query real data
    keywords = extract_keywords(query)
    dataset_rows = query_construction_data(keywords)

    # Step 2: Build context from real data
    if dataset_rows:
        data_context = "\n".join([
            f"- Project {r['project_number']}: bid ${r['bid_total']:,.0f}, "
            f"estimate ${r['engineers_estimate']:,.0f}, "
            f"item: {r['bid_item_description']}, qty: {r['quantity']} {r['unit_of_measure']}"
            for r in dataset_rows
        ])
        avg_bid = sum(r['bid_total'] for r in dataset_rows if r['bid_total']) / len(dataset_rows)
    else:
        data_context = "No matching projects found in dataset."
        avg_bid = None

    # Step 3: LLM generates response grounded in real data
    prompt = f"""You are a Construction Cost Estimation Agent with access to a real database of 1,458 construction projects.

User query: {query}

Real project data from database:
{data_context}

Based on this real data, provide:
1. A cost estimate range
2. Key factors affecting cost
3. Which database projects are most relevant

Keep response concise and practical for a contractor."""

    response = client.chat.completions.create(
        model="openrouter/auto",
        messages=[{"role": "user", "content": prompt}],
    )

    answer = response.choices[0].message.content

    return {
        "agent": "Cost Estimation Agent",
        "answer": answer,
        "source_rows": dataset_rows[:3],
        "keywords_used": keywords,
        "average_bid_in_results": avg_bid,
    }