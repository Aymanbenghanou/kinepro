import LegalShell, { type LegalBlock } from '@/components/legal/LegalShell'

export const metadata = { title: 'Mentions légales — KinéPro' }

const blocks: LegalBlock[] = [
  {
    heading: 'Éditeur du site',
    body: [
      'Le présent site est édité par KinePro.',
      [
        'Adresse : 25 Avenue Mohammed V, Casablanca, Maroc',
        'Téléphone : +212 6 12 34 56 78',
        'Email : contact@kinepro.ma',
        'Responsable de publication : Yassine El Amrani',
      ],
    ],
  },
  {
    heading: 'Hébergement',
    body: [
      'Le site est hébergé par Hostinger International Ltd., 61 Lordou Vironos Street, 6023 Larnaca, Chypre — hostinger.com.',
    ],
  },
  {
    heading: 'Propriété intellectuelle',
    body: [
      "L'ensemble du contenu présent sur ce site (textes, images, logos, design, éléments graphiques, vidéos, icônes, etc.) est protégé par les lois relatives à la propriété intellectuelle. Toute reproduction, modification, diffusion ou exploitation sans autorisation préalable écrite est interdite.",
    ],
  },
  {
    heading: 'Responsabilité',
    body: [
      "KinePro s'efforce de fournir des informations fiables et régulièrement mises à jour. Toutefois, des erreurs ou omissions peuvent survenir. L'utilisation du site se fait sous la seule responsabilité de l'utilisateur.",
    ],
  },
]

export default function LegalPage() {
  return <LegalShell title="Mentions légales" updated="26 mai 2026" blocks={blocks} />
}
