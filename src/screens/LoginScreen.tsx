import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function LoginScreen() {
  const [email,    setEmail]   = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]   = useState('')
  const [loading,  setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    setLoading(false)
    if (err) {
      setError('Rangt netfang eða lykilorð. Reyndu aftur.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-blue-800 text-center mb-2">Alicante íbúð</h1>
        <p className="text-center text-gray-500 mb-8">Bókunarkerfi</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Netfang</span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="þitt@netfang.is"
              className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Lykilorð</span>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </label>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl disabled:opacity-50 transition"
          >
            {loading ? 'Hinkraðu…' : 'Skrá inn'}
          </button>
        </form>
      </div>
    </div>
  )
}
