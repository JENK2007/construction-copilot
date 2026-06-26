from openai import OpenAI
from app.core.config import settings
import psycopg2

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=settings.openrouter_api_key,
)

def query_risk_data(keywords: list[str]) -> list[dict]:
    """Query projects to analyze risk patterns."""
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
            cp.start_date
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

    results = []
    for r in rows:
        bid = float(r[1]) if r[1] else None
        estimate = float(r[2]) if r[2] else None
        variance = None
        if bid and estimate and estimate > 0:
            variance = ((bid - estimate) / estimate) * 100

        results.append({
            "project_number": r[0],
            "bid_total": bid,
            "engineers_estimate": estimate,
            "bid_days": float(r[3]) if r[3] else None,
            "start_date": str(r[4]) if r[4] else None,
            "cost_variance_pct": round(variance, 2) if variance else None,
        })

    return results

async def run_risk_agent(query: str) -> dict:
    """Risk Analysis Agent."""

    common_words = {"what", "risk", "will", "this", "project", "the", "for", "are", "any"}
    words = query.lower().split()
    keywords = [w for w in words if w not in common_words and len(w) > 3][:3]
    if not keywords:
        keywords = ["construction", "project", "building"]

    dataset_rows = query_risk_data(keywords)

    if dataset_rows:
        data_context = "\n".join([
            f"- Project {r['project_number']}: "
            f"bid ${r['bid_total']:,.0f}, "
            f"estimate ${r['engineers_estimate']:,.0f}, "
            f"variance: {r['cost_variance_pct']}%, "
            f"duration: {r['bid_days']} days"
            for r in dataset_rows
            if r['bid_total'] and r['engineers_estimate']
        ])
        
        variances = [r['cost_variance_pct'] for r in dataset_rows if r['cost_variance_pct']]
        avg_variance = sum(variances) / len(variances) if variances else 0
    else:
        data_context = "No matching project data found."
        avg_variance = 0

    prompt = f"""You are a Construction Risk Analysis Expert with access to real project data.

User query: {query}

Real project risk data from database:
{data_context}

Average cost variance in similar projects: {avg_variance:.1f}%

Based on this real data, provide:
1. Key risks identified
2. Budget risk assessment (based on historical variance)
3. Timeline risks
4. Mitigation strategies
5. Risk severity: Low / Medium / High

Be specific and practical for contractors and project managers."""

    response = client.chat.completions.create(
        model="openrouter/auto",
        messages=[{"role": "user", "content": prompt}],
    )

    answer = response.choices[0].message.content

    return {
        "agent": "Risk Analysis Agent",
        "answer": answer,
        "source_rows": dataset_rows[:3],
        "keywords_used": keywords,
        "average_bid_in_results": avg_variance,
    }