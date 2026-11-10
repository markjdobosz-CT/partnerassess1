import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase.js'
import { useLang } from '../i18n.jsx'
import { DIMENSIONS, TIER_COLORS, computeScore, tierFor } from '../data.js'
import { TierBadge } from '../components.jsx'

export default function Results({ id, go, orgName }) {
  const { t } = useLang()
  const [a, setA] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('assessments').select('*').eq('id', id).maybeSingle().then(({ data, error }) => {
      if (error) setError(error.message)
      setA(data)
    })
  }, [id])

  if (error) return <div className="alert alert-error">{error}</div>
  if (!a) return <p className="muted">{t('loading')}</p>

  const total = computeScore(a.scores)
  const tier = tierFor(total)
  const ranked = DIMENSIONS.map((d) => ({ ...d, s: a.scores[d.id] }))
  const strongest = [...ranked].sort((x, y) => y.s - x.s || y.weight - x.weight).slice(0, 3).filter((d) => d.s >= 4)
  const gaps = ranked.filter((d) => d.s <= 2).sort((x, y) => y.weight - x.weight)
  const championLow = a.scores.champion <= 2

  return (
    <div className="report">
      <div className="page-head no-print">
        <button className="link-btn" onClick={() => go('dashboard')}>← {t('back')}</button>
        <div className="actions">
          <button className="btn" onClick={() => go('edit', { id })}>{t('edit')}</button>
          <button className="btn btn-primary" onClick={() => window.print()}>{t('print')}</button>
        </div>
      </div>

      <div className="report-head">
        <p className="muted">{orgName ? orgName + ' · ' : ''}{t('resTitle')}</p>
        <h1>{a.partner_name}</h1>
        <p className="muted">{t('type' + a.entity_type)} · {t('assessedOn')} {new Date(a.updated_at).toLocaleDateString()}</p>
      </div>

      <div className="score-hero" style={{ borderColor: TIER_COLORS[tier] }}>
        <div>
          <div className="big">{Math.round(total)}</div>
          <div className="muted">{t('overall')} · {t('outOf')}</div>
        </div>
        <div className="hero-rec">
          <TierBadge tier={tier} />
          <p>{t('tierd_' + tier)}</p>
        </div>
      </div>

      {championLow && <div className="alert alert-warn">{t('championWarn')}</div>}

      <div className="panel">
        <h2>{t('breakdown')}</h2>
        {ranked.map((d) => (
          <div className="bar-row" key={d.id}>
            <div className="bar-label">
              <span>{t('d_' + d.id)}</span>
              <span className="muted">{d.s}/5 · {t('r' + d.s)} · {d.weight}%</span>
            </div>
            <div className="bar"><div className="bar-fill" style={{ width: (d.s / 5) * 100 + '%', background: d.s <= 2 ? '#d4622a' : d.s === 3 ? '#c28a00' : '#2f5bdc' }} /></div>
            {a.notes?.[d.id] && <p className="bar-note">{a.notes[d.id]}</p>}
          </div>
        ))}
      </div>

      <div className="two-col">
        <div className="panel">
          <h2>{t('strongest')}</h2>
          {strongest.length === 0 ? <p className="muted">-</p> : (
            <ul className="plain">{strongest.map((d) => <li key={d.id}>{t('d_' + d.id)}</li>)}</ul>
          )}
        </div>
        <div className="panel">
          <h2>{t('gaps')}</h2>
          <p className="muted">{t('gapsHint')}</p>
          {gaps.length === 0 ? <p>{t('noGaps')}</p> : (
            <ul className="plain">{gaps.map((d) => <li key={d.id}>{t('d_' + d.id)}</li>)}</ul>
          )}
        </div>
      </div>

      {a.summary && (
        <div className="panel">
          <h2>{t('overallNotes')}</h2>
          <p className="pre">{a.summary}</p>
        </div>
      )}

      <p className="report-foot muted">{t('prepared')} · partnerassess.net</p>
    </div>
  )
}
