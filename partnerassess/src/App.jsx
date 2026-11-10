import React, { useEffect, useState, useCallback } from 'react'
import { supabase, configured } from './supabase.js'
import { LangProvider, useLang, LangSwitcher } from './i18n.jsx'
import Auth from './pages/Auth.jsx'
import Dashboard from './pages/Dashboard.jsx'
import AssessmentForm from './pages/AssessmentForm.jsx'
import Results from './pages/Results.jsx'
import Admin from './pages/Admin.jsx'
import { Logo } from './components.jsx'

function Shell() {
  const { t } = useLang()
  const [ready, setReady] = useState(false)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [recovery, setRecovery] = useState(false)
  const [view, setView] = useState({ name: 'dashboard' })
  const [orgName, setOrgName] = useState('')

  useEffect(() => {
    if (!configured) { setReady(true); return }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      if (event === 'SIGNED_OUT') { setProfile(null); setView({ name: 'dashboard' }) }
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const loadProfile = useCallback(async () => {
    if (!session) return
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
    setProfile(data)
    const { data: s } = await supabase.from('app_settings').select('value').eq('key', 'org_name').maybeSingle()
    setOrgName(s?.value || '')
  }, [session])

  useEffect(() => { loadProfile() }, [loadProfile])

  const go = (name, extra = {}) => { window.scrollTo(0, 0); setView({ name, ...extra }) }

  if (!configured) {
    return (
      <div className="center-card">
        <Logo />
        <h1>{t('setupTitle')}</h1>
        <p className="muted">{t('setupBody')}</p>
      </div>
    )
  }

  if (!ready) return <div className="center-card"><p className="muted">{t('loading')}</p></div>

  if (!session || recovery) {
    return <Auth recovery={recovery} onRecoveryDone={() => setRecovery(false)} />
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="app">
      <header className="topbar no-print">
        <button className="brand-btn" onClick={() => go('dashboard')} aria-label="PartnerAssess">
          <Logo small />
        </button>
        <nav>
          <button className={view.name === 'dashboard' ? 'active' : ''} onClick={() => go('dashboard')}>{t('navAssessments')}</button>
          <button className={view.name === 'new' ? 'active' : ''} onClick={() => go('new')}>{t('navNew')}</button>
          {isAdmin && <button className={view.name === 'admin' ? 'active' : ''} onClick={() => go('admin')}>{t('navAdmin')}</button>}
        </nav>
        <div className="topbar-right">
          <LangSwitcher />
          <span className="who" title={session.user.email}>{profile?.full_name || session.user.email}</span>
          <button className="link-btn" onClick={() => supabase.auth.signOut()}>{t('signOut')}</button>
        </div>
      </header>
      <main className="content">
        {view.name === 'dashboard' && <Dashboard userId={session.user.id} go={go} />}
        {view.name === 'new' && <AssessmentForm userId={session.user.id} go={go} />}
        {view.name === 'edit' && <AssessmentForm userId={session.user.id} id={view.id} go={go} />}
        {view.name === 'results' && <Results id={view.id} go={go} orgName={orgName} />}
        {view.name === 'admin' && isAdmin && (
          <Admin me={session.user.id} orgName={orgName} onOrgSaved={setOrgName} go={go} />
        )}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <LangProvider>
      <Shell />
    </LangProvider>
  )
}
