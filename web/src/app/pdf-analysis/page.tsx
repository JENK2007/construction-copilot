'use client'

import { useState } from 'react'

export default function PDFAnalysisPage() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const analyze = async () => {
    if (!file) return
    setLoading(true)
    setTimeout(() => {
      setResult(`Document "${file.name}" received. Extracted 12 line items totalling $245,000. Agent backend not connected yet.`)
      setLoading(false)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-3xl font-bold mb-2">PDF / BOQ Analysis</h1>
      <p className="text-muted-foreground mb-8">Upload a Bill of Quantities or project document for AI analysis</p>

      <div className="max-w-2xl">
        <div className="rounded-xl border-2 border-dashed bg-card p-12 text-center mb-4">
          <p className="text-muted-foreground text-sm mb-4">Drag and drop a PDF here, or click to browse</p>
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            id="file-upload"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <label
            htmlFor="file-upload"
            className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium cursor-pointer hover:opacity-90 transition"
          >
            Browse Files
          </label>
          {file && (
            <p className="mt-4 text-sm font-medium">{file.name}</p>
          )}
        </div>

        {file && (
          <button
            onClick={analyze}
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition mb-4"
          >
            {loading ? 'Analyzing...' : 'Analyze Document'}
          </button>
        )}

        {result && (
          <div className="rounded-xl border bg-card p-6">
            <h2 className="text-sm font-semibold mb-2 text-muted-foreground">ANALYSIS RESULT</h2>
            <p className="text-sm">{result}</p>
          </div>
        )}
      </div>
    </div>
  )
}