'use client'

import { useState, useMemo } from 'react'
import { X, Sparkles, ArrowLeft, ArrowRight, RefreshCw, Send, Plus, Trash2, Pencil, Check } from 'lucide-react'
import type { ProgrammeContenu, Exercice } from '@/lib/exercise-program'
import { formatWhatsAppMessage, waUrl } from '@/lib/exercise-program'

interface PatientLite {
  id: string
  prenom: string
  nom: string
  pathologie?: string | null
  telephone?: string | null
}

interface Props {
  patient: PatientLite
  cabinet?: { nom?: string | null; telephone?: string | null } | null
  onClose: () => void
  onSent?: () => void
}

type Step = 'config' | 'generating' | 'review' | 'sent'
type Lang = 'fr' | 'ar'

const OBJECTIFS_FR = [
  'Réduction douleur',
  'Récupération mobilité',
  'Renforcement musculaire',
  'Rééducation post-opératoire',
  'Maintien / Prévention',
  'Autre',
]
const OBJECTIFS_AR = [
  'تخفيف الألم',
  'استعادة الحركة',
  'تقوية العضلات',
  'إعادة تأهيل بعد الجراحة',
  'الصيانة / الوقاية',
  'أخرى',
]

export default function ExerciseProgramModal({ patient, cabinet, onClose, onSent }: Props) {
  const [step, setStep]   = useState<Step>('config')
  const [lang, setLang]   = useState<Lang>('fr')

  // Form state
  const [pathologie,   setPathologie]    = useState(patient.pathologie || '')
  const [seanceNumero, setSeanceNumero]  = useState(1)
  const [seanceTotal,  setSeanceTotal]   = useState(12)
  const [niveauDouleur, setNiveauDouleur] = useState(5)
  const [objectif,      setObjectif]      = useState(OBJECTIFS_FR[0])
  const [objectifAutre, setObjectifAutre] = useState('')
  const [contraintes,   setContraintes]   = useState('')
  const [duree,         setDuree]         = useState(15)
  const [frequence,     setFrequence]     = useState<'1x/jour' | '2x/jour' | '3x/semaine'>('1x/jour')

  // Generation state
  const [programme, setProgramme] = useState<ProgrammeContenu | null>(null)
  const [savedId,   setSavedId]   = useState<string | null>(null)
  const [error,     setError]     = useState<string | null>(null)
  const [busy,      setBusy]      = useState(false)

  const objectifs = lang === 'ar' ? OBJECTIFS_AR : OBJECTIFS_FR
  const isRTL     = lang === 'ar'

  const canGenerate = pathologie.trim().length > 0

  // ── Step actions ───────────────────────────────────────────────────────────

  async function generate(saveId: string | null = null) {
    setError(null)
    setStep('generating')
    setBusy(true)
    try {
      const finalObjectif = objectif === 'Autre' || objectif === 'أخرى' ? (objectifAutre || objectif) : objectif

      const res = await fetch('/api/ai/generate-exercise-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientPrenom: patient.prenom,
          pathologie,
          seanceNumero,
          seanceTotal,
          niveauDouleur,
          objectif: finalObjectif,
          contraintes,
          duree,
          frequence,
          langue: lang,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setProgramme(data)
      setSavedId(saveId)
      setStep('review')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la génération')
      setStep('config')
    } finally {
      setBusy(false)
    }
  }

  async function saveProgramme(): Promise<string | null> {
    if (!programme) return null
    try {
      const url = savedId ? `/api/exercise-programs/${savedId}` : '/api/exercise-programs'
      const res = await fetch(url, {
        method: savedId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          titre:     programme.titre,
          contenu:   programme,
          langue:    lang,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur sauvegarde')
      setSavedId(data.id)
      return data.id
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur sauvegarde')
      return null
    }
  }

  async function sendWhatsApp() {
    if (!programme || !patient.telephone) return
    setBusy(true)
    try {
      const id = await saveProgramme()
      if (!id) return
      const message = formatWhatsAppMessage(programme, {
        patientPrenom: patient.prenom,
        pathologie,
        seanceNumero, seanceTotal,
        cabinetNom: cabinet?.nom ?? undefined,
        cabinetTel: cabinet?.telephone ?? undefined,
        langue: lang,
      })
      window.open(waUrl(patient.telephone, message), '_blank')
      await fetch(`/api/exercise-programs/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markSent: true }),
      })
      setStep('sent')
      onSent?.()
    } finally {
      setBusy(false)
    }
  }

  // ── Edit programme helpers ─────────────────────────────────────────────────

  function updateExercice(idx: number, patch: Partial<Exercice>) {
    if (!programme) return
    const exercices = programme.exercices.map((e, i) => i === idx ? { ...e, ...patch } : e)
    setProgramme({ ...programme, exercices })
  }
  function removeExercice(idx: number) {
    if (!programme) return
    setProgramme({ ...programme, exercices: programme.exercices.filter((_, i) => i !== idx).map((e, i) => ({ ...e, numero: i + 1 })) })
  }
  function addExercice() {
    if (!programme) return
    const next: Exercice = {
      numero: programme.exercices.length + 1,
      nom: lang === 'ar' ? 'تمرين جديد' : 'Nouvel exercice',
      description: '', duree: '', serie: '', position: '', conseil: '',
    }
    setProgramme({ ...programme, exercices: [...programme.exercices, next] })
  }
  function updateConseil(idx: number, value: string) {
    if (!programme) return
    const cs = programme.conseils_generaux.map((c, i) => i === idx ? value : c)
    setProgramme({ ...programme, conseils_generaux: cs })
  }

  // ── UI ─────────────────────────────────────────────────────────────────────

  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} dir={isRTL ? 'rtl' : 'ltr'} style={sheet}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#2563EB,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={18} color="white" />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                {isRTL ? 'برنامج تمارين بالذكاء الاصطناعي' : "Programme d'exercices IA"}
              </h3>
              <p style={{ fontSize: 12.5, color: '#64748B', margin: '2px 0 0' }}>
                {patient.prenom} {patient.nom}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Language switch */}
            <div style={langSwitch}>
              {(['fr', 'ar'] as Lang[]).map(l => (
                <button key={l} onClick={() => setLang(l)}
                  style={{ ...langBtn, background: lang === l ? '#2563EB' : 'transparent', color: lang === l ? 'white' : '#64748B' }}>
                  {l === 'fr' ? 'FR' : 'عر'}
                </button>
              ))}
            </div>
            <button onClick={onClose} style={iconBtn}><X size={18} /></button>
          </div>
        </div>

        {/* Progress dots */}
        <div style={{ padding: '12px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748B', fontWeight: 600 }}>
          <StepDot active={step === 'config'}     done={step !== 'config'}                                       n={1} label={isRTL ? 'إعدادات' : 'Configuration'} />
          <ChevronArrow rtl={isRTL} />
          <StepDot active={step === 'generating'} done={step === 'review' || step === 'sent'}                   n={2} label={isRTL ? 'إنشاء' : 'Génération'} />
          <ChevronArrow rtl={isRTL} />
          <StepDot active={step === 'review'}     done={step === 'sent'}                                         n={3} label={isRTL ? 'مراجعة' : 'Révision'} />
          <ChevronArrow rtl={isRTL} />
          <StepDot active={step === 'sent'}       done={step === 'sent'}                                         n={4} label={isRTL ? 'إرسال' : 'Envoi'} />
        </div>

        {/* Body */}
        <div style={body}>
          {error && (
            <div style={errorBox}>❌ {error}</div>
          )}

          {step === 'config' && (
            <ConfigStep
              isRTL={isRTL}
              pathologie={pathologie} setPathologie={setPathologie}
              seanceNumero={seanceNumero} setSeanceNumero={setSeanceNumero}
              seanceTotal={seanceTotal} setSeanceTotal={setSeanceTotal}
              niveauDouleur={niveauDouleur} setNiveauDouleur={setNiveauDouleur}
              objectif={objectif} setObjectif={setObjectif}
              objectifs={objectifs}
              objectifAutre={objectifAutre} setObjectifAutre={setObjectifAutre}
              contraintes={contraintes} setContraintes={setContraintes}
              duree={duree} setDuree={setDuree}
              frequence={frequence} setFrequence={setFrequence}
            />
          )}

          {step === 'generating' && (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div style={{ display: 'inline-block', position: 'relative', marginBottom: 20 }}>
                <div style={{ width: 56, height: 56, border: '3px solid #DBEAFE', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'epspin 0.85s linear infinite' }} />
                <Sparkles size={20} color="#2563EB" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                {isRTL ? 'كلود يولّد برنامجك...' : 'Claude génère votre programme...'}
              </div>
              <div style={{ fontSize: 13, color: '#64748B' }}>
                {isRTL ? 'يستغرق 3 إلى 5 ثوان' : '3 à 5 secondes en moyenne'}
              </div>
              <style>{`@keyframes epspin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {step === 'review' && programme && (
            <ReviewStep
              programme={programme}
              setProgramme={setProgramme}
              isRTL={isRTL}
              pathologie={pathologie}
              patientPrenom={patient.prenom}
              frequence={frequence}
              duree={duree}
              onAddExercice={addExercice}
              onRemoveExercice={removeExercice}
              onUpdateExercice={updateExercice}
              onUpdateConseil={updateConseil}
            />
          )}

          {step === 'sent' && (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <Check size={32} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
                {isRTL ? 'تم إرسال البرنامج ✓' : 'Programme envoyé ✓'}
              </div>
              <div style={{ fontSize: 14, color: '#64748B', marginBottom: 24 }}>
                {isRTL ? `أُرسل إلى ${patient.prenom} عبر واتساب` : `Envoyé à ${patient.prenom} sur WhatsApp`}
              </div>
              <button onClick={onClose} style={btnSecondary}>{isRTL ? 'إغلاق' : 'Fermer'}</button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'config' && (
          <div style={footer}>
            <button onClick={onClose} style={btnSecondary}>{isRTL ? 'إلغاء' : 'Annuler'}</button>
            <button onClick={() => generate(null)} disabled={!canGenerate || busy} style={{ ...btnPrimary, opacity: (!canGenerate || busy) ? 0.5 : 1, cursor: (!canGenerate || busy) ? 'not-allowed' : 'pointer' }}>
              <Sparkles size={15} /> {isRTL ? 'إنشاء بالذكاء الاصطناعي' : 'Générer avec Claude AI'}
            </button>
          </div>
        )}
        {step === 'review' && programme && (
          <div style={footer}>
            <button onClick={() => setStep('config')} style={btnSecondary}>
              <ArrowLeft size={14} /> {isRTL ? 'العودة' : 'Retour'}
            </button>
            <button onClick={() => generate(savedId)} disabled={busy} style={btnGhost}>
              <RefreshCw size={14} /> {isRTL ? 'إعادة الإنشاء' : 'Régénérer'}
            </button>
            <button onClick={sendWhatsApp} disabled={busy || !patient.telephone}
              title={!patient.telephone ? 'Aucun numéro de téléphone' : undefined}
              style={{ ...btnWa, opacity: (!patient.telephone || busy) ? 0.55 : 1, cursor: (!patient.telephone || busy) ? 'not-allowed' : 'pointer' }}>
              <Send size={15} /> {isRTL ? 'إرسال عبر واتساب' : 'Envoyer sur WhatsApp'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────

function ConfigStep(props: any) {
  const { isRTL,
    pathologie, setPathologie, seanceNumero, setSeanceNumero, seanceTotal, setSeanceTotal,
    niveauDouleur, setNiveauDouleur, objectif, setObjectif, objectifs,
    objectifAutre, setObjectifAutre, contraintes, setContraintes,
    duree, setDuree, frequence, setFrequence } = props
  const t = (fr: string, ar: string) => isRTL ? ar : fr

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={lbl}>{t('Pathologie principale *', 'الحالة الرئيسية *')}</label>
        <input value={pathologie} onChange={e => setPathologie(e.target.value)} required style={input}
          placeholder={t('Ex: Lombalgie chronique', 'مثال: ألم أسفل الظهر المزمن')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={lbl}>{t('Séance n°', 'رقم الجلسة')}</label>
          <input type="number" min={1} value={seanceNumero} onChange={e => setSeanceNumero(parseInt(e.target.value) || 1)} style={input} />
        </div>
        <div>
          <label style={lbl}>{t('Total séances', 'إجمالي الجلسات')}</label>
          <input type="number" min={1} value={seanceTotal} onChange={e => setSeanceTotal(parseInt(e.target.value) || 1)} style={input} />
        </div>
      </div>

      <div>
        <label style={lbl}>
          {t('Niveau de douleur actuel', 'مستوى الألم الحالي')}
          <span style={{ float: isRTL ? 'left' : 'right', fontWeight: 800, color: niveauDouleur >= 7 ? '#DC2626' : niveauDouleur >= 4 ? '#F59E0B' : '#16A34A' }}>{niveauDouleur}/10</span>
        </label>
        <input type="range" min={1} max={10} value={niveauDouleur} onChange={e => setNiveauDouleur(parseInt(e.target.value))}
          style={{ width: '100%', accentColor: niveauDouleur >= 7 ? '#DC2626' : niveauDouleur >= 4 ? '#F59E0B' : '#16A34A' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
          <span>1</span><span>5</span><span>10</span>
        </div>
      </div>

      <div>
        <label style={lbl}>{t('Objectif principal *', 'الهدف الرئيسي *')}</label>
        <select value={objectif} onChange={e => setObjectif(e.target.value)} style={input}>
          {objectifs.map((o: string) => <option key={o} value={o}>{o}</option>)}
        </select>
        {(objectif === 'Autre' || objectif === 'أخرى') && (
          <input value={objectifAutre} onChange={e => setObjectifAutre(e.target.value)} placeholder={t('Précisez l\'objectif', 'حدد الهدف')} style={{ ...input, marginTop: 8 }} />
        )}
      </div>

      <div>
        <label style={lbl}>{t('Contraintes particulières (optionnel)', 'قيود خاصة (اختياري)')}</label>
        <textarea value={contraintes} onChange={e => setContraintes(e.target.value)} rows={2}
          placeholder={t('Ex: Patient diabétique, éviter exercices debout prolongés', 'مثال: مريض مصاب بالسكري، تجنب التمارين الواقفة لفترات طويلة')}
          style={{ ...input, resize: 'vertical', fontFamily: 'inherit' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={lbl}>{t('Durée du programme', 'مدة البرنامج')}</label>
          <div style={chipRow}>
            {[5, 10, 15, 20].map(d => (
              <button type="button" key={d} onClick={() => setDuree(d)}
                style={{ ...chip, background: duree === d ? '#2563EB' : 'white', color: duree === d ? 'white' : '#475569', borderColor: duree === d ? '#2563EB' : '#E2E8F0' }}>
                {d} min
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={lbl}>{t('Fréquence', 'التكرار')}</label>
          <div style={chipRow}>
            {(['1x/jour', '2x/jour', '3x/semaine'] as const).map(f => (
              <button type="button" key={f} onClick={() => setFrequence(f)}
                style={{ ...chip, background: frequence === f ? '#2563EB' : 'white', color: frequence === f ? 'white' : '#475569', borderColor: frequence === f ? '#2563EB' : '#E2E8F0' }}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ReviewStep({ programme, setProgramme, isRTL, pathologie, patientPrenom, frequence, duree, onAddExercice, onRemoveExercice, onUpdateExercice, onUpdateConseil }: any) {
  const t = (fr: string, ar: string) => isRTL ? ar : fr

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header card */}
      <div style={{ background: 'linear-gradient(135deg, #EFF6FF, #FAF5FF)', border: '1px solid #E0E7FF', borderRadius: 14, padding: 18 }}>
        <input
          value={programme.titre}
          onChange={e => setProgramme({ ...programme, titre: e.target.value })}
          style={{ width: '100%', background: 'transparent', border: 'none', fontSize: 17, fontWeight: 800, color: '#1E293B', outline: 'none' }}
        />
        <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>
          🏋️ {patientPrenom} — {pathologie} · {duree} min · {frequence}
        </div>
      </div>

      {/* Introduction */}
      <div>
        <label style={lbl}>{t('Introduction', 'مقدمة')}</label>
        <textarea
          value={programme.introduction}
          onChange={e => setProgramme({ ...programme, introduction: e.target.value })}
          rows={2}
          style={{ ...input, resize: 'vertical', fontFamily: 'inherit', fontStyle: 'italic' }}
        />
      </div>

      {/* Exercices */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <label style={lbl}>{t('Exercices', 'التمارين')} ({programme.exercices.length})</label>
          <button type="button" onClick={onAddExercice} style={btnGhostSmall}>
            <Plus size={13} /> {t('Ajouter', 'إضافة')}
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {programme.exercices.map((ex: Exercice, i: number) => (
            <ExerciseCard key={i} exercice={ex} isRTL={isRTL}
              onUpdate={(p: any) => onUpdateExercice(i, p)}
              onRemove={() => onRemoveExercice(i)} />
          ))}
        </div>
      </div>

      {/* Conseils généraux */}
      <div>
        <label style={lbl}>{t('Conseils généraux', 'نصائح عامة')}</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {programme.conseils_generaux?.map((c: string, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#16A34A', fontSize: 16 }}>✅</span>
              <input value={c} onChange={e => onUpdateConseil(i, e.target.value)} style={{ ...input, flex: 1 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Message de fin */}
      <div>
        <label style={lbl}>{t('Message de motivation', 'رسالة تحفيز')}</label>
        <textarea
          value={programme.message_fin}
          onChange={e => setProgramme({ ...programme, message_fin: e.target.value })}
          rows={2}
          style={{ ...input, resize: 'vertical', fontFamily: 'inherit' }}
        />
      </div>
    </div>
  )
}

function ExerciseCard({ exercice, isRTL, onUpdate, onRemove }: { exercice: Exercice; isRTL: boolean; onUpdate: (p: Partial<Exercice>) => void; onRemove: () => void }) {
  const t = (fr: string, ar: string) => isRTL ? ar : fr
  return (
    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#2563EB', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
          {exercice.numero}
        </div>
        <input value={exercice.nom} onChange={e => onUpdate({ nom: e.target.value })}
          style={{ flex: 1, fontSize: 15, fontWeight: 800, color: '#0F172A', background: 'transparent', border: 'none', outline: 'none', borderBottom: '1.5px dashed transparent', padding: '2px 0' }}
          onFocus={e => { e.currentTarget.style.borderBottomColor = '#2563EB' }}
          onBlur={e => { e.currentTarget.style.borderBottomColor = 'transparent' }}
        />
        <button onClick={onRemove} style={{ ...iconBtn, color: '#DC2626' }} aria-label="Supprimer"><Trash2 size={15} /></button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <SmallField label={`📍 ${t('Position', 'الوضعية')}`} value={exercice.position} onChange={v => onUpdate({ position: v })} />
        <SmallField label={`⏱ ${t('Durée', 'المدة')} × ${t('Séries', 'مجموعات')}`}
          value={[exercice.duree, exercice.serie].filter(Boolean).join(' × ')}
          onChange={v => { const parts = v.split('×').map(s => s.trim()); onUpdate({ duree: parts[0] ?? '', serie: parts[1] ?? '' }) }} />
      </div>
      <SmallField label={`📝 ${t('Description', 'الوصف')}`} value={exercice.description} onChange={v => onUpdate({ description: v })} textarea />
      <SmallField label={`💡 ${t('Conseil', 'نصيحة')}`}  value={exercice.conseil}     onChange={v => onUpdate({ conseil: v })} />
      <SmallField label={`⚠️ ${t('Attention', 'انتباه')}`} value={exercice.attention ?? ''} onChange={v => onUpdate({ attention: v })} />
    </div>
  )
}

function SmallField({ label, value, onChange, textarea }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 3 }}>{label}</div>
      {textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={2}
          style={{ width: '100%', padding: '6px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, background: 'white', resize: 'vertical', fontFamily: 'inherit', color: '#0F172A', boxSizing: 'border-box' }} />
      ) : (
        <input value={value} onChange={e => onChange(e.target.value)}
          style={{ width: '100%', padding: '6px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, background: 'white', color: '#0F172A', boxSizing: 'border-box' }} />
      )}
    </div>
  )
}

function StepDot({ active, done, n, label }: { active: boolean; done: boolean; n: number; label: string }) {
  const color = done ? '#16A34A' : active ? '#2563EB' : '#CBD5E1'
  const bg    = done ? '#DCFCE7' : active ? '#DBEAFE' : '#F1F5F9'
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 20, height: 20, borderRadius: '50%', background: bg, color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>
        {done ? '✓' : n}
      </span>
      <span style={{ color: active || done ? '#0F172A' : '#94A3B8', fontSize: 12.5, fontWeight: active ? 700 : 600 }}>{label}</span>
    </div>
  )
}
function ChevronArrow({ rtl }: { rtl: boolean }) {
  return <span style={{ color: '#CBD5E1', fontSize: 13 }}>{rtl ? '←' : '→'}</span>
}

// ── Styles ───────────────────────────────────────────────────────────────────

const overlay: React.CSSProperties = { position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }
const sheet:   React.CSSProperties = { background: 'white', borderRadius: 18, maxWidth: 720, width: '100%', maxHeight: '94vh', display: 'flex', flexDirection: 'column', boxShadow: '0 30px 80px rgba(0,0,0,0.35)', overflow: 'hidden' }
const body:    React.CSSProperties = { padding: 24, overflowY: 'auto', flex: 1 }
const footer:  React.CSSProperties = { padding: '14px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap', background: '#F8FAFC' }
const errorBox: React.CSSProperties = { background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, marginBottom: 12 }
const input: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', color: '#0F172A', boxSizing: 'border-box', background: 'white' }
const lbl: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }
const chipRow: React.CSSProperties = { display: 'flex', gap: 6, flexWrap: 'wrap' }
const chip: React.CSSProperties = { padding: '7px 12px', borderRadius: 8, border: '1.5px solid', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }
const iconBtn: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 6, borderRadius: 8, display: 'inline-flex', alignItems: 'center' }
const langSwitch: React.CSSProperties = { display: 'inline-flex', background: '#F1F5F9', borderRadius: 999, padding: 3, gap: 2 }
const langBtn: React.CSSProperties = { border: 'none', borderRadius: 999, cursor: 'pointer', fontWeight: 800, fontSize: 12, padding: '4px 10px', transition: 'all 0.15s' }
const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: 'linear-gradient(135deg, #2563EB, #7C3AED)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: 'pointer' }
const btnSecondary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: 'white', color: '#475569', border: '1.5px solid #E2E8F0', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }
const btnGhost: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }
const btnGhostSmall: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: '#EFF6FF', color: '#2563EB', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }
const btnWa: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: 'linear-gradient(135deg, #25D366, #128C7E)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,211,102,0.35)' }
