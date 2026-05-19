'use client'

import dynamic from 'next/dynamic'

const MedicalTemplate = dynamic(() => import('./templates/MedicalTemplate'), { ssr: false })
const PremiumTemplate = dynamic(() => import('./templates/PremiumTemplate'), { ssr: false })
const WarmTemplate    = dynamic(() => import('./templates/WarmTemplate'),    { ssr: false })
const SportTemplate   = dynamic(() => import('./templates/SportTemplate'),   { ssr: false })

export default function TemplateRenderer({ templateId, data }: { templateId: string; data: any }) {
  switch (templateId) {
    case 'premium': return <PremiumTemplate data={data} />
    case 'warm':    return <WarmTemplate    data={data} />
    case 'sport':   return <SportTemplate   data={data} />
    default:        return <MedicalTemplate data={data} />
  }
}
