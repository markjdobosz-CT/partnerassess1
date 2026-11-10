import React from 'react'
import { useLang } from './i18n.jsx'
import { TIER_COLORS } from './data.js'

export function Logo({ small = false }) {
  return (
    <span className={'logo' + (small ? ' logo-small' : '')}>
      <span className="logo-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12h4l3-8 4 16 3-8h4" />
        </svg>
      </span>
      <span className="logo-text">
        <strong>PartnerAssess</strong>
        {!small && <small>partnerassess.net</small>}
      </span>
    </span>
  )
}

export function TierBadge({ tier }) {
  const { t } = useLang()
  if (!tier) return <span className="muted">-</span>
  return (
    <span className="tier-badge" style={{ background: TIER_COLORS[tier] }}>
      {t('tier_' + tier)}
    </span>
  )
}

export function typeLabel(t, type) {
  return t('type' + type)
}
