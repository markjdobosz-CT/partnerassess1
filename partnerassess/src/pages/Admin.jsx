import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase.js'
import { useLang } from '../i18n.jsx'
import { TierBadge } from '../components.jsx'

export default function Admin({ me, orgName, onOrgSaved, go }) {
  const { t } = useLang()
  const [users, setUsers] = useState([])
  const [all, setAll] = useState([])
  const [org, setOrg] = useState(orgName || '')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    const u = await supabase.from('profiles').select('*').order('created_at', { ascending: true })
    const a = await supabase.from('assessments')
      .select('id,user_id,partner_name,entity_type,total_score,tier,updated_at').order('updated_at', { ascending: false })
    if (u.error) setError(u.error.message)
    setUsers(u.data || []); setAll(a.data || [])
  }
  useEffect(() => { load() }, [])

  async function setRole(id, role) {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
    if (error) setError(error.message)
    load()
  }

  async function saveOrg(e) {
    e.preventDefault()
    const { error } = await supabase.from('app_settings').upsert({ key: 'org_name', value: org.trim() })
    if (error) { setError(error.message); return }
    onOrgSaved(org.trim()); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const owner = (id) => users.find((u) => u.id === id)?.email || '-'

  return (
    <div>
      <div className="page-head"><h1>{t('adminTitle')}</h1></div>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="panel">
        <h2>{t('settings')}</h2>
        <form onSubmit={saveOrg} className="inline-form">
          <label>{t('orgLabel')}<input value={org} onChange={(e) => setOrg(e.target.value)} /></label>
          <button className="btn btn-primary">{saved ? t('saved') : t('saveSettings')}</button>
        </form>
      </div>

      <div className="panel">
        <h2>{t('users')} ({users.length})</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>{t('colName')}</th><th>{t('colEmail')}</th><th>{t('colRole')}</th><th>{t('colJoined')}</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.full_name || '-'}{u.org_name ? <span className="muted"> · {u.org_name}</span> : null}</td>
                  <td>{u.email}</td>
                  <td>
                    <select value={u.role} disabled={u.id === me} onChange={(e) => setRole(u.id, e.target.value)}>
                      <option value="admin">{t('roleAdmin')}</option>
                      <option value="member">{t('roleMember')}</option>
                    </select>
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <h2>{t('allAssess')} ({all.length})</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>{t('colPartner')}</th><th>{t('colType')}</th><th>{t('colScore')}</th><th>{t('colRec')}</th><th>{t('colOwner')}</th><th>{t('colUpdated')}</th></tr></thead>
            <tbody>
              {all.map((r) => (
                <tr key={r.id}>
                  <td><button className="link-btn strong" onClick={() => go('results', { id: r.id })}>{r.partner_name}</button></td>
                  <td>{t('type' + r.entity_type)}</td>
                  <td className="num">{r.total_score !== null ? Math.round(r.total_score) : '-'}</td>
                  <td><TierBadge tier={r.tier} /></td>
                  <td>{owner(r.user_id)}</td>
                  <td>{new Date(r.updated_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
