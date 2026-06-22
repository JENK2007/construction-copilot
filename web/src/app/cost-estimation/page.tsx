'use client'

import { useState } from 'react'

export default function CostEstimationPage() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const estimate = async () => {
    if (!query.trim()) return
    setLoading(true)
    setTimeout(() => {
      setResult(`Estimated cost for "${query}": $12,500 - $18,000 (based on dataset). Agent backend not connected yet.`)
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-3xl font-bold mb-2">Cost Estimation</h1>
      <p className="text-muted-foreground mb-8">Get AI-powered cost estimates grounded in real construction data</p>

      <div className="max-w-2xl">
        <div className="rounded-xl border bg-card p-6 mb-4">
          <label className="text-sm font-medium mb-2 block">Describe your project or material need</label>
          <textarea
            className="w-full rounded-lg border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
            rows={4}
            placeholder="e.g. 500 sq ft concrete foundation, residential grade..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            onClick={estimate}
            disabled={loading}
            className="mt-3 px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
          >
            {loading ? 'Estimating...' : 'Get Estimate'}
          </button>
        </div>

        {result && (
          <div className="rounded-xl border bg-card p-6">
            <h2 className="text-sm font-semibold mb-2 text-muted-foreground">ESTIMATE RESULT</h2>
            <p className="text-sm">{result}</p>
          </div>
        )}
      </div>
    </div>
  )
}