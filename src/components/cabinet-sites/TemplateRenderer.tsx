'use client'

import dynamic from 'next/dynamic'

const CabinetSiteV2 = dynamic(() => import('./CabinetSiteV2'), { ssr: false })

export default function TemplateRenderer({ templateId, data }: { templateId: string; data: any }) {
  return <CabinetSiteV2 data={data} />
}
