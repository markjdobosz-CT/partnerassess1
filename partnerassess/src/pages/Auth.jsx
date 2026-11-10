import React, { useState } from 'react'
import { supabase } from '../supabase.js'
import { useLang, LangSwitcher } from '../i18n.jsx'
import { Logo } from '../components.jsx'

const FEATURES = ['f1', 'f2', 'f3', 'f4', 'f5']

export default function Auth({ recovery, onRecoveryDone }) {
  const { t } = useLang()
  const [mode, setMode] = useState('signin') // signin | signup | forgot
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [org, setOrg] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const reset = (m) => { setMode(m); setError(''); setNotice('') }

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setError(''); setNotice('')
    try {
      if (recovery) {
        if (password.length < 8) throw new Error(t('newPwSub'))
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw error
        setNotice(t('pwUpdated'))
        setTimeout(onRecoveryDone, 900)
      } else if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw error
      } else if (mode === 'signup') {
        if (password.length < 8) throw new Error(t('newPwSub'))
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim(), org_name: org.trim() },
            emailRedirectTo: window.location.origin,
          },
        })
        if (error) throw error
        if (!data.session) { setNotice(t('confirmEmail')); setMode('signin') }
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin })
        if (error) throw error
        setNotice(t('resetSent'))
      }
    } catch (err) {
      setError(err.message || t('errorGeneric'))
    } finally {
      setBusy(false)
    }
  }

  const title = recovery ? t('newPwTitle') : mode === 'signin' ? t('welcome') : mode === 'signup' ? t('createTitle') : t('resetTitle')
  const sub = recovery ? t('newPwSub') : mode === 'signin' ? t('welcomeSub') : mode === 'signup' ? t('createSub') : t('resetSub')

  return (
    <div className="auth">
      <aside className="auth-side">
        <Logo />
        <blockquote>“{t('tagline')}”</blockquote>
        <ul>
          {FEATURES.map((f) => (
            <li key={f}>
              <strong>{t(f + 't')}</strong>
              <span>{t(f + 'd')}</span>
            </li>
          ))}
        </ul>
        <p className="auth-foot">© {new Date().getFullYear()} partnerassess.net</p>
      </aside>
      <section className="auth-main">
        <div className="auth-lang"><LangSwitcher /></div>
        <form className="auth-form" onSubmit={submit}>
          <h1>{title}</h1>
          <p className="muted">{sub}</p>

          {error && <div className="alert alert-error" role="alert">{error}</div>}
          {notice && <div className="alert alert-ok" role="status">{notice}</div>}

          {mode === 'signup' && !recovery && (
            <>
              <label>{t('fullName')}
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" />
              </label>
              <label>{t('orgName')}
                <input value={org} onChange={(e) => setOrg(e.target.value)} autoComplete="organization" />
              </label>
            </>
          )}

          {!recovery && (
            <label>{t('email')}
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('emailPh')} required autoComplete="email" />
            </label>
          )}

          {mode !== 'forgot' && (
            <label>
              <span className="label-row">
                <span>{recovery ? t('newPw') : t('password')}</span>
                {mode === 'signin' && !recovery && (
                  <button type="button" className="link-btn" onClick={() => reset('forgot')}>{t('forgot')}</button>
                )}
              </span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} />
            </label>
          )}

          <button className="btn btn-primary btn-wide" disabled={busy}>
            {busy ? t('loading') : recovery ? t('savePw') : mode === 'signin' ? t('signIn') : mode === 'signup' ? t('createBtn') : t('sendReset')}
          </button>

          {!recovery && (
            <p className="auth-switch">
              {mode === 'signin' && <>{t('noAccount')} <button type="button" className="link-btn" onClick={() => reset('signup')}>{t('createAccount')}</button></>}
              {mode === 'signup' && <>{t('haveAccount')} <button type="button" className="link-btn" onClick={() => reset('signin')}>{t('signIn')}</button></>}
              {mode === 'forgot' && <button type="button" className="link-btn" onClick={() => reset('signin')}>{t('backToSignIn')}</button>}
            </p>
          )}
          <p className="auth-secure">partnerassess.net · {t('secure')}</p>
        </form>
      </section>
    </div>
  )
}
