import LegalShell, { type LegalBlock } from '@/components/legal/LegalShell'

export const metadata = { title: 'Politique de confidentialité — KinéPro' }

const blocks: LegalBlock[] = [
  {
    heading: 'Collecte des données',
    body: [
      'Nous pouvons collecter certaines données personnelles lorsque vous utilisez notre site :',
      [
        'Nom et prénom',
        'Numéro de téléphone',
        'Adresse email',
        'Informations transmises via les formulaires',
        'Données de navigation et cookies',
      ],
    ],
  },
  {
    heading: 'Utilisation des données',
    body: [
      'Les données collectées sont utilisées afin de :',
      [
        'Répondre aux demandes des utilisateurs',
        'Gérer les prises de rendez-vous',
        "Améliorer l'expérience utilisateur",
        'Assurer le bon fonctionnement du site',
        'Envoyer des informations liées aux services proposés',
      ],
    ],
  },
  {
    heading: 'Conservation des données',
    body: ['Les données personnelles sont conservées uniquement pendant la durée nécessaire au traitement des demandes et à la gestion des services.'],
  },
  {
    heading: 'Sécurité',
    body: ['KinePro met en place des mesures de sécurité adaptées afin de protéger les données personnelles contre tout accès non autorisé, perte ou divulgation.'],
  },
  {
    heading: 'Partage des données',
    body: ['Les données personnelles ne sont jamais vendues ni partagées à des tiers sans consentement préalable, sauf obligation légale.'],
  },
  {
    heading: 'Cookies',
    body: ["Le site peut utiliser des cookies afin d'améliorer l'expérience utilisateur et analyser le trafic. L'utilisateur peut désactiver les cookies depuis les paramètres de son navigateur."],
  },
  {
    heading: 'Droits des utilisateurs',
    body: [
      'Conformément à la réglementation applicable, vous disposez des droits suivants :',
      ['Accès à vos données', 'Modification de vos données', 'Suppression de vos données'],
      'Pour toute demande : contact@kinepro.ma.',
    ],
  },
]

export default function PrivacyPage() {
  return <LegalShell title="Politique de confidentialité" updated="26 mai 2026" blocks={blocks} />
}
