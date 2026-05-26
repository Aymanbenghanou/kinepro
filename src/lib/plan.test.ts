import { describe, it, expect } from 'vitest'
import { getPlanState, hasProAccess, EXISTING_CABINETS_CUTOFF, type CabinetPlanInfo } from './plan'

// Dates fixes pour éviter toute dépendance à l'horloge réelle.
// "now" est toujours en 2026 (cutoff = 2026-05-26), donc :
//  - FUTURE (2099) reste toujours dans le futur
//  - PAST (2020) reste toujours dans le passé
const BEFORE_CUTOFF = '2025-01-01T00:00:00Z' // cabinet exempté (avant le cutoff)
const AFTER_CUTOFF  = '2026-06-01T00:00:00Z' // cabinet post-facturation
const FUTURE        = '2099-01-01T00:00:00Z'
const PAST          = '2020-01-01T00:00:00Z'

function cab(p: Partial<CabinetPlanInfo>): CabinetPlanInfo {
  return {
    plan: 'trial',
    planStatus: 'trialing',
    trialEndsAt: FUTURE,
    createdAt: AFTER_CUTOFF,
    ...p,
  }
}

// Sanité : le cutoff est bien dans le passé par rapport à "maintenant" (sinon
// les hypothèses AFTER_CUTOFF / BEFORE_CUTOFF seraient inversées).
describe('EXISTING_CABINETS_CUTOFF', () => {
  it('est passé (le système de facturation a déjà démarré)', () => {
    expect(EXISTING_CABINETS_CUTOFF.getTime()).toBeLessThan(Date.now())
  })
})

describe('getPlanState', () => {
  it('cabinet exempté (créé avant le cutoff) + essai expiré → "active" (CRITIQUE)', () => {
    expect(getPlanState(cab({ createdAt: BEFORE_CUTOFF, plan: 'trial', trialEndsAt: PAST })))
      .toBe('active')
  })

  it('post-cutoff, trial, trialEndsAt futur → "trialing"', () => {
    expect(getPlanState(cab({ createdAt: AFTER_CUTOFF, plan: 'trial', trialEndsAt: FUTURE })))
      .toBe('trialing')
  })

  it('post-cutoff, trial, trialEndsAt passé → "trial_expired"', () => {
    expect(getPlanState(cab({ createdAt: AFTER_CUTOFF, plan: 'trial', trialEndsAt: PAST })))
      .toBe('trial_expired')
  })

  it('plan "pro" + planStatus "active" → "active"', () => {
    expect(getPlanState(cab({ createdAt: AFTER_CUTOFF, plan: 'pro', planStatus: 'active', trialEndsAt: null })))
      .toBe('active')
  })

  it('plan "starter" + planStatus "active" → "active"', () => {
    expect(getPlanState(cab({ createdAt: AFTER_CUTOFF, plan: 'starter', planStatus: 'active', trialEndsAt: null })))
      .toBe('active')
  })
})

describe('hasProAccess', () => {
  it('cabinet exempté (même en "starter") → true (les 137 gardent le Pro)', () => {
    expect(hasProAccess(cab({ createdAt: BEFORE_CUTOFF, plan: 'starter', planStatus: 'active' })))
      .toBe(true)
  })

  it('post-cutoff, "trialing" (trialEndsAt futur) → true', () => {
    expect(hasProAccess(cab({ createdAt: AFTER_CUTOFF, plan: 'trial', trialEndsAt: FUTURE })))
      .toBe(true)
  })

  it('post-cutoff, "pro" actif → true', () => {
    expect(hasProAccess(cab({ createdAt: AFTER_CUTOFF, plan: 'pro', planStatus: 'active', trialEndsAt: null })))
      .toBe(true)
  })

  it('post-cutoff, "starter" actif → false', () => {
    expect(hasProAccess(cab({ createdAt: AFTER_CUTOFF, plan: 'starter', planStatus: 'active', trialEndsAt: null })))
      .toBe(false)
  })

  it('post-cutoff, "trial" expiré (trialEndsAt passé) → false', () => {
    expect(hasProAccess(cab({ createdAt: AFTER_CUTOFF, plan: 'trial', trialEndsAt: PAST })))
      .toBe(false)
  })
})
