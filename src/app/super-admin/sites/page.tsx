'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Globe, Settings, Eye, Plus } from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kinepro-omega.vercel.app'

const TEMPLATE_META: Record<string, { label: string; bg: string; color: string }> = {
  medical: { label: 'Médical Classique', bg: '#EFF6FF', color: '#2563EB' },
  premium: { label: 'Moderne Premium',   bg: '#FEF3C7', color: '#B45309' },
  warm:    { label: 'Chaleureux Humain', bg: '#CCFBF1', color: '#0D9488' },
  sport:   { label: 'Sport & Dynamique', bg: '#EDE9FE', color: '#7C3AED' },
}

export default function SuperAdminSitesPage() {
  const [cabinets, setCabinets] = useState<any[]>([])
  const [loading, setLoading]  = useState(true)

  useEffect(() => {
    fetch('/api/super-admin/sites')
      .then(r => r.json())
      .then(d => { setCabinets(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function togglePublish(cabinetId: string) {
    await fetch(`/api/super-admin/sites/${cabinetId}/publish`, { method: 'POST' })
    // Refresh
    fetch('/api/super-admin/sites').then(r => r.json()).then(d => setCabinets(Array.isArray(d) ? d : []))
  }

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ color:'white', fontSize:22, fontWeight:800, margin:'0 0 6px' }}>Sites des cabinets</h1>
        <p style={{ color:'#818CF8', fontSize:14, margin:0 }}>Gérez les sites vitrines de chaque cabinet</p>
      </div>

      <div style={{ background:'#1E1B4B', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.06)', background:'rgba(255,255,255,0.03)' }}>
              {['Cabinet', 'Slug', 'Template', 'Statut', 'Dernière MàJ', 'Actions'].map(h => (
                <th key={h} style={{ padding:'12px 16px', fontSize:11, fontWeight:700, color:'#818CF8', textAlign:'left', textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding:40, textAlign:'center', color:'#818CF8' }}>Chargement...</td></tr>
            ) : cabinets.length === 0 ? (
              <tr><td colSpan={6} style={{ padding:40, textAlign:'center', color:'#818CF8' }}>Aucun cabinet</td></tr>
            ) : cabinets.map((cab: any) => {
              const site = cab.site
              const tmpl = TEMPLATE_META[site?.templateId] ?? null
              const isPublished = site?.published ?? false
              return (
                <tr key={cab.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding:'14px 16px' }}>
                    <div style={{ color:'white', fontWeight:600, fontSize:14 }}>{cab.nom}</div>
                    <div style={{ color:'#818CF8', fontSize:12 }}>{cab.ville}</div>
                  </td>
                  <td style={{ padding:'14px 16px', fontSize:12, color:'#C7D2FE', fontFamily:'monospace' }}>
                    {cab.slug ? `/${cab.slug}` : <span style={{ color:'#64748B' }}>—</span>}
                  </td>
                  <td style={{ padding:'14px 16px' }}>
                    {tmpl ? (
                      <span style={{ background:tmpl.bg, color:tmpl.color, padding:'3px 10px', borderRadius:999, fontSize:12, fontWeight:600 }}>
                        {tmpl.label}
                      </span>
                    ) : (
                      <span style={{ color:'#64748B', fontSize:12 }}>Non configuré</span>
                    )}
                  </td>
                  <td style={{ padding:'14px 16px' }}>
                    <span style={{
                      background: isPublished ? 'rgba(22,163,74,0.15)' : 'rgba(100,116,139,0.15)',
                      color: isPublished ? '#4ADE80' : '#94A3B8',
                      padding:'3px 10px', borderRadius:999, fontSize:12, fontWeight:600,
                    }}>
                      {!site ? '⚪ Non configuré' : isPublished ? '🟢 Publié' : '⚫ Brouillon'}
                    </span>
                  </td>
                  <td style={{ padding:'14px 16px', fontSize:12, color:'#818CF8' }}>
                    {site?.updatedAt ? new Date(site.updatedAt).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td style={{ padding:'14px 16px' }}>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      <Link href={`/super-admin/sites/${cab.id}`}
                        style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'5px 10px', background:'rgba(99,102,241,0.2)', color:'#A5B4FC', borderRadius:7, fontSize:12, fontWeight:500, textDecoration:'none', border:'1px solid rgba(99,102,241,0.3)' }}>
                        <Settings size={12} /> Configurer
                      </Link>
                      {cab.slug && site && (
                        <a href={`${APP_URL}/cabinet/${cab.slug}`} target="_blank" rel="noopener noreferrer"
                          style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'5px 10px', background:'rgba(99,102,241,0.1)', color:'#818CF8', borderRadius:7, fontSize:12, fontWeight:500, textDecoration:'none', border:'1px solid rgba(99,102,241,0.2)' }}>
                          <Eye size={12} /> Voir
                        </a>
                      )}
                      {site && (
                        <button onClick={() => togglePublish(cab.id)}
                          style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'5px 10px', background: isPublished ? 'rgba(239,68,68,0.1)' : 'rgba(22,163,74,0.15)', color: isPublished ? '#FCA5A5' : '#4ADE80', borderRadius:7, fontSize:12, fontWeight:500, border:'none', cursor:'pointer', borderWidth:1, borderStyle:'solid', borderColor: isPublished ? 'rgba(239,68,68,0.2)' : 'rgba(22,163,74,0.2)' }}>
                          {isPublished ? 'Dépublier' : 'Publier'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
