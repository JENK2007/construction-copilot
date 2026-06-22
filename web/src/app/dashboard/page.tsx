'use client'

import { UserButton } from '@clerk/nextjs'
import { useUser } from '@clerk/nextjs'

export default function DashboardPage() {
  const { user } = useUser()

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.firstName || 'Contractor'}
          </p>
        </div>
        <UserButton />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Projects', value: '0' },
          { label: 'Cost Estimates', value: '0' },
          { label: 'Documents Analyzed', value: '0' },
          { label: 'Active Agents', value: '4' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border bg-card p-6">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="text-3xl font-bold mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-3 flex-wrap">
          {[
            { label: 'Open Chat', href: '/chat' },
            { label: 'Cost Estimation', href: '/cost-estimation' },
            { label: 'PDF Analysis', href: '/pdf-analysis' },
            { label: 'Agent Monitor', href: '/agents' },
          ].map((action) => (
            <a
              key={action.href}
              href={action.href}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
            >
              {action.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
