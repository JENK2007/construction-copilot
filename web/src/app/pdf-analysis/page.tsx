'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'

export default function PDFAnalysisPage() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    if (f.type === 'application/pdf') setFile(f)
    else alert('Please upload a PDF file only')
  }

  const analyze = async () => {
    if (!file) return
    setLoading(true)
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('http://localhost:8001/api/pdf/analyze', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Analysis failed')
      setResult(data)
    } catch (e: any) {
      setResult({ error: e.message || 'Error analyzing PDF' })
    } finally {
      setLoading(false)
    }
  }

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
              <span className="text-white text-sm">📄</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">PDF Analysis</h1>
              <p className="text-xs text-gray-500">AI-powered document analysis</p>
            </div>
          </div>
          <UserButton />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
        {/* Upload area */}
        <div
          className={`bg-white rounded-2xl border-2 border-dashed p-12 text-center mb-6 transition cursor-pointer ${dragOver ? 'border-orange-400 bg-orange-50' : 'border-gray-300 hover:border-orange-300'
            }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          onClick={() => inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" accept=".pdf" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>

          {file ? (
            <div>
              <p className="text-base font-semibold text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB • Click to change</p>
            </div>
          ) : (
            <div>
              <p className="text-base font-semibold text-gray-700">Drop your PDF here</p>
              <p className="text-sm text-gray-500 mt-1">or click to browse • BOQ, Cost Sheets, Project Reports</p>
            </div>
          )}
        </div>

        {file && !result && (
          <button onClick={analyze} disabled={loading}
            className="w-full sm:w-auto px-8 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50 transition flex items-center gap-2 mb-6">
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing document...
              </>
            ) : '📄 Analyze Document'}
          </button>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4">
            {result.error ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                <p className="text-red-600 font-medium">Error: {result.error}</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-3 py-1 rounded-full">
                      {result.agent}
                    </span>
                    <span className="text-xs text-gray-400">{result.pages} pages • {result.characters_extracted} chars extracted</span>
                  </div>
                  <p className="text-sm sm:text-base text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {result.analysis}
                  </p>
                </div>

                <button onClick={() => { setResult(null); setFile(null) }}
                  className="text-sm text-gray-500 hover:text-orange-500 transition">
                  ← Analyze another document
                </button>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}