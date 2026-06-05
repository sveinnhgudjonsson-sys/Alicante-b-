import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { Member } from '../types'

interface AuthCtx {
  session: Session | null
  member: Member | null
  loading: boolean
}

const Ctx = createContext<AuthCtx>({ session: null, member: null, loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [member, setMember]   = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) fetchMember(data.session.user.email!)
      else setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (s) fetchMember(s.user.email!)
      else { setMember(null); setLoading(false) }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function fetchMember(email: string) {
    const { data } = await supabase
      .from('members')
      .select('*')
      .eq('email', email)
      .single()
    setMember(data ?? null)
    setLoading(false)
  }

  return <Ctx.Provider value={{ session, member, loading }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
