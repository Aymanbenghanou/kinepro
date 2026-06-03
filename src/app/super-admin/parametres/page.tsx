import { getAppConfig } from '@/lib/app-config'
import ParametresForm from './ParametresForm'

export const dynamic = 'force-dynamic'

// Page « Paramètres » super-admin — config globale plateforme.
// Pour l'instant : numéro WhatsApp support. À étendre : email, social, etc.
export default async function SuperAdminParametresPage() {
  const config = await getAppConfig()
  return (
    <div style={{ padding: '32px 28px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>Paramètres</h1>
      <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 28px' }}>
        Configuration globale de la plateforme. Les changements sont propagés immédiatement à tous les cabinets (cache invalidé).
      </p>
      <ParametresForm initial={{ supportWhatsapp: config.supportWhatsapp }} />
    </div>
  )
}
