'use client'

export default function AgentsPage() {
  const agents = [
    { name: 'Orchestrator', status: 'active', description: 'Routes requests to specialist agents', calls: 0 },
    { name: 'Knowledge Agent', status: 'idle', description: 'Answers construction concepts and methods', calls: 0 },
    { name: 'Cost Estimation Agent', status: 'idle', description: 'Queries dataset for cost ranges via MCP', calls: 0 },
    { name: 'Material Recommendation Agent', status: 'idle', description: 'Suggests materials and alternatives', calls: 0 },
    { name: 'Document Analysis Agent', status: 'idle', description: 'Parses PDF BOQs and cost sheets', calls: 0 },
  ]

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-3xl font-bold mb-2">Agent Monitoring</h1>
      <p className="text-muted-foreground mb-8">Live status of all active AI agents</p>

      <div className="grid gap-4 max-w-3xl">
        {agents.map((agent) => (
          <div key={agent.name} className="rounded-xl border bg-card p-6 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} />
                <h2 className="font-semibold text-sm">{agent.name}</h2>
              </div>
              <p className="text-xs text-muted-foreground">{agent.description}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Tool calls</p>
              <p className="text-lg font-bold">{agent.calls}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 max-w-3xl rounded-xl border bg-card p-6">
        <h2 className="font-semibold mb-3">Routing Log</h2>
        <p className="text-sm text-muted-foreground">No routing decisions yet. Send a message in the Chat to see agent activity here.</p>
      </div>
    </div>
  )
}