import { useEffect, useMemo, useState } from 'react'

function App() {
  const baseUrl = useMemo(() => import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000', [])
  const [loading, setLoading] = useState(false)
  const [queries, setQueries] = useState([])
  const [status, setStatus] = useState('new')
  const [message, setMessage] = useState('')
  const [selected, setSelected] = useState(null)
  const [draft, setDraft] = useState(null)

  const fetchQueries = async () => {
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch(`${baseUrl}/queries?status=${status || ''}`)
      const data = await res.json()
      setQueries(data.items || [])
    } catch (e) {
      setMessage(`Error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const parseNow = async () => {
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch(`${baseUrl}/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 6 })
      })
      if (!res.ok) throw new Error('Parse failed')
      await fetchQueries()
      setMessage('Parsed sample newsletters and saved queries.')
    } catch (e) {
      setMessage(`Error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const generatePitch = async (id) => {
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch(`${baseUrl}/pitch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query_id: id, parameters: {} })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Pitch failed')
      setMessage('Pitch generated.')
    } catch (e) {
      setMessage(`Error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const createDraft = async (id) => {
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch(`${baseUrl}/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query_id: id, parameters: {} })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Draft failed')
      setDraft({ id: data.draft_id, body: data.body })
      setMessage('Draft created. Review below and approve to send.')
    } catch (e) {
      setMessage(`Error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const approveDraft = async () => {
    if (!draft?.id) return
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch(`${baseUrl}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft_id: draft.id, approved: true })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Approve failed')
      setMessage('Approved. You can now send the email.')
    } catch (e) {
      setMessage(`Error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const sendEmail = async () => {
    if (!draft?.id) return
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch(`${baseUrl}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft_id: draft.id })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Send failed')
      setMessage('Email sent (simulated).')
    } catch (e) {
      setMessage(`Error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQueries()
  }, [status])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Psych PR Assistant</h1>
          <div className="flex gap-3">
            <button onClick={parseNow} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm">Parse Gmail</button>
            <select value={status} onChange={(e)=>setStatus(e.target.value)} className="px-3 py-2 bg-white rounded border text-sm">
              <option value="">All</option>
              <option value="new">New</option>
              <option value="drafted">Drafted</option>
              <option value="approved">Approved</option>
              <option value="sent">Sent</option>
            </select>
            <button onClick={fetchQueries} className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm">Refresh</button>
          </div>
        </header>

        {message && (
          <div className="mb-4 p-3 rounded bg-amber-50 text-amber-800 border border-amber-200 text-sm">{message}</div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800">Queries</h2>
              {loading && <div className="text-xs text-gray-500">Working...</div>}
            </div>
            <ul className="divide-y">
              {queries.map(q => (
                <li key={q._id} className={`py-3 ${selected?._id===q._id?'bg-blue-50':''}`}>
                  <button className="text-left w-full" onClick={()=>setSelected(q)}>
                    <div className="font-medium text-gray-800">{q.subject}</div>
                    <div className="text-xs text-gray-500">From {q.sender_email} • {q.received_at?.slice(0,16)}</div>
                    {q.deadline && <div className="text-xs text-rose-600">Deadline: {q.deadline.slice(0,16)}</div>}
                  </button>
                  <div className="mt-2 flex gap-2">
                    <button onClick={()=>generatePitch(q._id)} className="px-3 py-1.5 rounded bg-indigo-600 text-white text-xs">Generate Pitch</button>
                    <button onClick={()=>createDraft(q._id)} className="px-3 py-1.5 rounded bg-gray-800 text-white text-xs">Create Draft</button>
                  </div>
                </li>
              ))}
              {queries.length===0 && (
                <li className="py-10 text-center text-sm text-gray-500">No queries yet. Parse Gmail to import examples.</li>
              )}
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h2 className="font-semibold text-gray-800 mb-3">Draft Preview</h2>
            {!draft && <p className="text-sm text-gray-500">Select a query and create a draft to preview.</p>}
            {draft && (
              <div className="space-y-3">
                <textarea value={draft.body} onChange={(e)=>setDraft(prev=>({...prev, body:e.target.value}))} className="w-full h-72 border rounded p-3 text-sm font-mono"/>
                <div className="flex gap-2">
                  <button onClick={approveDraft} className="px-3 py-1.5 rounded bg-green-600 text-white text-xs">Approve</button>
                  <button onClick={sendEmail} className="px-3 py-1.5 rounded bg-blue-600 text-white text-xs">Send</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-8 text-xs text-gray-500">Connected to: {baseUrl}</footer>
      </div>
    </div>
  )
}

export default App
