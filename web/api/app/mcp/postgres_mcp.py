from fastapi import APIRouter
from pydantic import BaseModel
import psycopg2
from app.core.config import settings

router = APIRouter()

class MCPToolCall(BaseModel):
    tool: str
    parameters: dict

@router.post("/mcp/tool")
async def execute_mcp_tool(call: MCPToolCall):
    """PostgreSQL MCP Server — executes construction dataset queries."""
    
    if call.tool == "query_projects":
        keyword = call.parameters.get("keyword", "")
        conn = psycopg2.connect(settings.database_url)
        cur = conn.cursor()
        cur.execute("""
            SELECT cp.project_number, cp.bid_total, cp.engineers_estimate, cp.bid_days
            FROM construction_projects cp
            JOIN construction_line_items cli ON cp.project_number = cli.project_number
            WHERE cli.bid_item_description ILIKE %s
            LIMIT 5
        """, (f"%{keyword}%",))
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return {
            "tool": "query_projects",
            "result": [
                {"project_number": r[0], "bid_total": float(r[1]) if r[1] else None,
                 "engineers_estimate": float(r[2]) if r[2] else None, "bid_days": float(r[3]) if r[3] else None}
                for r in rows
            ]
        }

    if call.tool == "get_cost_stats":
        conn = psycopg2.connect(settings.database_url)
        cur = conn.cursor()
        cur.execute("""
            SELECT 
                COUNT(*) as total_projects,
                AVG(bid_total) as avg_bid,
                MIN(bid_total) as min_bid,
                MAX(bid_total) as max_bid
            FROM construction_projects
            WHERE bid_total IS NOT NULL
        """)
        row = cur.fetchone()
        cur.close()
        conn.close()
        return {
            "tool": "get_cost_stats",
            "result": {
                "total_projects": row[0],
                "avg_bid": float(row[1]),
                "min_bid": float(row[2]),
                "max_bid": float(row[3])
            }
        }

    return {"error": f"Unknown tool: {call.tool}"}

@router.get("/mcp/tools")
async def list_mcp_tools():
    """List available MCP tools."""
    return {
        "mcp_server": "PostgreSQL Construction Dataset",
        "tools": [
            {"name": "query_projects", "description": "Query construction projects by keyword", "parameters": {"keyword": "string"}},
            {"name": "get_cost_stats", "description": "Get overall cost statistics from dataset", "parameters": {}},
        ]
    }