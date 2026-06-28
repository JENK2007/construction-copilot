'use client'

import { UserButton } from '@clerk/nextjs'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'

export default function DashboardPage() {
  const { user } = useUser()

  const metrics = [
    { label: 'Total Projects', value: '1,458', sub: 'in dataset' },
    { label: 'Cost Estimates', value: '107K', sub: 'line items' },
    { label: 'Active Agents', value: '5', sub: 'running' },
    { label: 'Avg Project Bid', value: '$4.2M', sub: 'historical' },
  ]

  const actions = [
    { label: '💬 Open Chat', href: '/chat', desc: 'Ask anything about construction' },
    { label: '💰 Cost Estimation', href: '/cost-estimation', desc: 'Get AI-powered cost estimates' },
    { label: '📄 PDF Analysis', href: '/pdf-analysis', desc: 'Upload and analyze documents' },
    { label: '🤖 Agent Monitor', href: '/agents', desc: 'View live agent activity' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-lg">Construction Copilot</span>
          </div>
          <UserButton />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName || 'Contractor'} 👋
          </h1>
          <p className="text-gray-500 mt-1 text-base sm:text-lg">
            Your AI-powered construction assistant is ready.
          </p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((m) => (
            <div key={m.label} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <p className="text-xs sm:text-sm text-gray-500 font-medium">{m.label}</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{m.value}</p>
              <p className="text-xs text-orange-500 mt-1">{m.sub}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {actions.map((a) => (
              <Link key={a.href} href={a.href}
                className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:border-orange-300 hover:shadow-md transition group">
                <p className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-orange-500 transition">{a.label}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">{a.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
          <div className="space-y-3">
            {[
              { name: 'Orchestrator Agent', status: 'active' },
              { name: 'Cost Estimation Agent', status: 'active' },
              { name: 'Knowledge Agent', status: 'active' },
              { name: 'Material Agent', status: 'active' },
              { name: 'Risk Analysis Agent', status: 'active' },
            ].map((agent) => (
              <div key={agent.name} className="flex items-center justify-between">
                <span className="text-sm sm:text-base text-gray-700">{agent.name}</span>
                <span className="flex items-center gap-2 text-xs text-green-600 font-medium">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  {agent.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}