import LegalShell, { type LegalBlock } from '@/components/legal/LegalShell'

export const metadata = { title: "Conditions Générales d'Utilisation — KinéPro" }

const blocks: LegalBlock[] = [
  {
    heading: 'Objet',
    body: ["Les présentes Conditions Générales d'Utilisation définissent les modalités d'accès et d'utilisation du site KinePro."],
  },
  {
    heading: 'Accès au site',
    body: ["Le site est accessible à tout utilisateur disposant d'un accès internet. Certaines fonctionnalités peuvent nécessiter la prise de rendez-vous ou l'envoi d'informations personnelles."],
  },
  {
    heading: 'Utilisation du site',
    body: [
      "L'utilisateur s'engage à :",
      [
        'Utiliser le site de manière légale',
        'Ne pas perturber le fonctionnement du site',
        'Fournir des informations exactes et complètes',
      ],
    ],
  },
  {
    heading: 'Rendez-vous',
    body: ['Les demandes de rendez-vous effectuées via le site restent soumises à validation et confirmation. KinePro se réserve le droit de modifier ou annuler un rendez-vous en cas de nécessité.'],
  },
  {
    heading: 'Responsabilité',
    body: [
      'KinePro ne pourra être tenu responsable :',
      [
        "D'une interruption temporaire du site",
        "D'un problème technique indépendant de sa volonté",
        "D'une mauvaise utilisation des services proposés",
      ],
    ],
  },
  {
    heading: 'Modification des conditions',
    body: ['KinePro se réserve le droit de modifier les présentes conditions à tout moment afin de les adapter aux évolutions du site et des services.'],
  },
  {
    heading: 'Droit applicable',
    body: ['Les présentes conditions sont soumises au droit marocain.'],
  },
  {
    heading: 'Contact',
    body: ['KinePro — contact@kinepro.ma — +212 6 12 34 56 78.'],
  },
]

export default function TermsPage() {
  return <LegalShell title="Conditions Générales d'Utilisation" updated="26 mai 2026" blocks={blocks} />
}
