import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase.js'
import { useLang } from '../i18n.jsx'
import { DIMENSIONS, ENTITY_TYPES, computeScore, tierFor } from '../data.js'
import { TierBadge } from '../components.jsx'

export default function AssessmentForm({ userId, id, go }) {
  const { t } = useLang()
  const [name, setName] = useState('')
  const [type, setType] = useState('Corporate')
  const [scores, setScores] = useState({})
  const [notes, setNotes] = useState({})
  const [summary, setSummary] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    supabase.from('assessments').select('*').eq('id', id).maybeSingle().then(({ data, error }) => {
      if (error) setError(error.message)
      if (data) {
        setName(data.partner_name); setType(data.entity_type)
        setScores(data.scores || {}); setNotes(data.notes || {}); setSummary(data.summary || '')
      }
      setLoading(false)
    })
  }, [id])

  const total = computeScore(scores)
  const tier = tierFor(total)

  async function save(e) {
    e.preventDefault()
    if (total === null) { setError(t('rateAll')); return }
    setBusy(true); setError('')
    const payload = {
      partner_name: name.trim(), entity_type: type, scores, notes, summary,
      total_score: total, tier, updated_at: new Date().toISOString(),
    }
    const res = id
      ? await supabase.from('assessments').update(payload).eq('id', id).select('id').single()
      : await supabase.from('assessments').insert({ ...payload, user_id: userId }).select('id').single()
    setBusy(false)
    if (res.error) { setError(res.error.message); return }
    go('results', { id: res.data.id })
  }

  if (loading) return <p className="muted">{t('loading')}</p>

  return (
    <form onSubmit={save} className="form-page">
      <div className="page-head">
        <h1>{id ? t('editTitle') : t('newTitle')}</h1>
      </div>
      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <div className="panel">
        <label>{t('partnerName')}
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('partnerNamePh')} required />
        </label>
        <fieldset className="type-pick">
          <legend>{t('entityType')}</legend>
          {ENTITY_TYPES.map((ty) => (
            <label key={ty} className={'type-card' + (type === ty ? ' selected' : '')}>
              <input type="radio" name="etype" value={ty} checked={type === ty} onChange={() => setType(ty)} />
              <strong>{t('type' + ty)}</strong>
              <span>{t('type' + ty + 'Hint')}</span>
            </label>
          ))}
        </fieldset>
      </div>

      <div className="panel">
        <h2>{t('rateTitle')}</h2>
        <p className="muted">{t('rateHint')}</p>
        {DIMENSIONS.map((d) => (
          <div className="dim" key={d.id}>
            <div className="dim-head">
              <div>
                <h3>{t('d_' + d.id)}</h3>
                <p className="muted">{t('d_' + d.id + '_desc')}</p>
              </div>
              <span className="weight">{t('weightLabel')} {d.weight}%</span>
            </div>
            <div className="rating" role="radiogroup" aria-label={t('d_' + d.id)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} role="radio" aria-checked={scores[d.id] === n}
                  className={'rate-btn' + (scores[d.id] === n ? ' on' : '')}
                  onClick={() => setScores({ ...scores, [d.id]: n })}>
                  <b>{n}</b><small>{t('r' + n)}</small>
                </button>
              ))}
            </div>
            <input className="note-input" value={notes[d.id] || ''} placeholder={t('notePh')}
              onChange={(e) => setNotes({ ...notes, [d.id]: e.target.value })} />
          </div>
        ))}
      </div>

      <div className="panel">
        <label>{t('overallNotes')}
          <textarea rows="3" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder={t('overallNotesPh')} />
        </label>
      </div>

      <div className="sticky-bar">
        <div className="live">
          {total === null ? <span className="muted">{t('rateAll')}</span> : (
            <><strong className="live-score">{Math.round(total)}</strong><span className="muted">{t('outOf')}</span><TierBadge tier={tier} /></>
          )}
        </div>
        <div className="actions">
          <button type="button" className="btn" onClick={() => go(id ? 'results' : 'dashboard', { id })}>{t('cancel')}</button>
          <button className="btn btn-primary" disabled={busy || total === null}>{busy ? t('saving') : t('save')}</button>
        </div>
      </div>
    </form>
  )
}
