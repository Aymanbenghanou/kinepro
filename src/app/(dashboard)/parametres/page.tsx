import { redirect } from 'next/navigation'

// L'ancienne page "Configuration" (5 tabs) a été éclatée en 4 sous-pages :
// /parametres/cabinet, /types-seances, /salles, /notifications.
// Toute visite de l'index redirige vers la première sous-page.
export default function ParametresIndex() {
  redirect('/parametres/cabinet')
}
