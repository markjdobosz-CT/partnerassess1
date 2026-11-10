import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase.js'
import { useLang } from '../i18n.jsx'
import { TierBadge } from '../components.jsx'

export default function Dashboard({ userId, go }) {
  const { t } = useLang()
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')

  async function load() {
    const { data, error } = await supabase
      .from('assessments').select('id,partner_name,entity_type,total_score,tier,updated_at')
      .eq('user_id', userId).order('updated_at', { ascending: false })
    if (error) setError(error.message)
    setRows(data || [])
  }
  useEffect(() => { load() }, [userId])

  async function remove(id) {
    if (!window.confirm(t('delConfirm'))) return
    await supabase.from('assessments').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <div className="page-head">
        <h1>{t('myAssessments')}</h1>
        <button className="btn btn-primary" onClick={() => go('new')}>{t('navNew')}</button>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {rows === null && <p className="muted">{t('loading')}</p>}
      {rows && rows.length === 0 && (
        <div className="empty">
          <h2>{t('emptyTitle')}</h2>
          <p className="muted">{t('emptyHint')}</p>
          <button className="btn btn-primary" onClick={() => go('new')}>{t('navNew')}</button>
        </div>
      )}
      {rows && rows.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>{t('colPartner')}</th><th>{t('colType')}</th><th>{t('colScore')}</th><th>{t('colRec')}</th><th>{t('colUpdated')}</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><button className="link-btn strong" onClick={() => go('results', { id: r.id })}>{r.partner_name}</button></td>
                  <td>{t('type' + r.entity_type)}</td>
                  <td className="num">{r.total_score !== null ? Math.round(r.total_score) : '-'}</td>
                  <td><TierBadge tier={r.tier} /></td>
                  <td>{new Date(r.updated_at).toLocaleDateString()}</td>
                  <td className="row-actions">
                    <button className="link-btn" onClick={() => go('results', { id: r.id })}>{t('open')}</button>
                    <button className="link-btn danger" onClick={() => remove(r.id)}>{t('del')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
