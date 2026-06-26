from openai import OpenAI
from app.core.config import settings
import psycopg2

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=settings.openrouter_api_key,
)

def query_material_data(keywords: list[str]) -> list[dict]:
    """Query Supabase for material-related line items."""
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
            cli.bid_item_description,
            cli.quantity,
            cli.unit_of_measure
        FROM construction_projects cp
        JOIN construction_line_items cli ON cp.project_number = cli.project_number
        WHERE {conditions}
        ORDER BY cp.bid_total DESC
        LIMIT 8
    """

    cur.execute(sql)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    return [
        {
            "project_number": r[0],
            "bid_total": float(r[1]) if r[1] else None,
            "bid_item_description": r[2],
            "quantity": float(r[3]) if r[3] else None,
            "unit_of_measure": r[4],
        }
        for r in rows
    ]

async def run_material_agent(query: str) -> dict:
    """Material Recommendation Agent."""

    # Extract keywords from query
    common_words = {"what", "which", "best", "should", "use", "for", "the", "is", "are", "recommend"}
    words = query.lower().split()
    keywords = [w for w in words if w not in common_words and len(w) > 3][:3]
    if not keywords:
        keywords = ["concrete", "steel", "material"]

    # Query real data
    dataset_rows = query_material_data(keywords)

    if dataset_rows:
        data_context = "\n".join([
            f"- Project {r['project_number']}: {r['bid_item_description']}, "
            f"qty: {r['quantity']} {r['unit_of_measure']}, bid: ${r['bid_total']:,.0f}"
            for r in dataset_rows
        ])
    else:
        data_context = "No matching material data found in database."

    prompt = f"""You are a Construction Material Recommendation Expert with access to a database of real construction projects.

User query: {query}

Real material data from database:
{data_context}

Based on this real project data, provide:
1. Recommended materials for this use case
2. Cost-performance tradeoffs
3. Alternative options
4. Key factors to consider when choosing

Be specific and practical for contractors and builders."""

    response = client.chat.completions.create(
        model="openrouter/auto",
        messages=[{"role": "user", "content": prompt}],
    )

    answer = response.choices[0].message.content

    return {
        "agent": "Material Recommendation Agent",
        "answer": answer,
        "source_rows": dataset_rows[:3],
        "keywords_used": keywords,
        "average_bid_in_results": None,
    }