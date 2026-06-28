'use client'

import { useState } from 'react'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'

export default function CostEstimationPage() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const estimate = async () => {
    if (!query.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const response = await fetch('http://localhost:8001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      })
      const data = await response.json()
      setResult(data)
    } catch {
      setResult({ answer: 'Error connecting to backend. Make sure API is running on port 8001.', source_rows: [] })
    } finally {
      setLoading(false)
    }
  }

  const examples = [
    'How much does a concrete foundation cost for a 2000 sq ft house?',
    'What is the estimated cost for road paving per mile?',
    'Cost estimate for steel structure warehouse 5000 sq ft',
    'Bridge construction cost estimate for 100 meter span',
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">💰</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Cost Estimation</h1>
              <p className="text-xs text-gray-500">Powered by 1,458 real projects</p>
            </div>
          </div>
          <UserButton />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
        {/* Input Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Describe your project or material need
          </label>
          <textarea
            className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm sm:text-base outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition resize-none"
            rows={4}
            placeholder="e.g. 500 sq ft concrete foundation, residential grade..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            onClick={estimate}
            disabled={loading || !query.trim()}
            className="mt-3 px-6 py-3 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition flex items-center gap-2">
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Estimating...
              </>
            ) : '💰 Get Estimate'}
          </button>
        </div>

        {/* Example queries */}
        {!result && (
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-500 mb-3">Try these examples:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {examples.map((ex) => (
                <button key={ex} onClick={() => setQuery(ex)}
                  className="text-left p-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-orange-300 hover:bg-orange-50 transition">
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-3 py-1 rounded-full">
                  {result.agent || 'Cost Estimation Agent'}
                </span>
                {result.routing_method && (
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                    via {result.routing_method}
                  </span>
                )}
              </div>
              <p className="text-sm sm:text-base text-gray-800 whitespace-pre-wrap leading-relaxed">
                {result.answer}
              </p>
            </div>

            {result.source_rows && result.source_rows.length > 0 && (
              <div className="bg-orange-50 rounded-2xl border border-orange-100 p-6">
                <p className="text-sm font-semibold text-orange-600 mb-3">📊 Real Dataset Sources</p>
                <div className="space-y-2">
                  {result.source_rows.map((row: any, i: number) => (
                    <div key={i} className="bg-white rounded-xl p-3 border border-orange-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-medium text-gray-700">Project {row.project_number}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{row.bid_item_description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">${row.bid_total?.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">{row.bid_days} days</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => { setResult(null); setQuery('') }}
              className="text-sm text-gray-500 hover:text-orange-500 transition">
              ← Start new estimate
            </button>
          </div>
        )}
      </main>
    </div>
  )
}