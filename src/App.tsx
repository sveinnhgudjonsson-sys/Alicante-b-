import { AuthProvider, useAuth } from './lib/auth'
import LoginScreen from './screens/LoginScreen'
import HomeScreen from './screens/HomeScreen'

function Inner() {
  const { session, member, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Hinkraðu…</div>
      </div>
    )
  }

  // Logged in but email not in members table → rejected
  if (session && !member) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
        <div className="bg-white rounded-2xl shadow p-6 text-center max-w-sm w-full">
          <div className="text-4xl mb-3">🚫</div>
          <p className="font-semibold text-gray-800 mb-1">Aðgangur bannaður</p>
          <p className="text-gray-500 text-sm mb-4">
            Netfangið þitt er ekki á leyfislista þessarar íbúðar.
          </p>
          <button
            onClick={() => import('./lib/supabase').then(m => m.supabase.auth.signOut())}
            className="text-sm text-blue-600 underline"
          >
            Skrá út
          </button>
        </div>
      </div>
    )
  }

  if (!session) return <LoginScreen />

  return <HomeScreen />
}

export default function App() {
  return (
    <AuthProvider>
      <Inner />
    </AuthProvider>
  )
}
