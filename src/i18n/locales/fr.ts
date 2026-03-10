import type { TranslationKey } from './en'

const fr: Record<TranslationKey, string> = {
  // Hero
  'hero.badge': 'Disponible pour opportunités',
  'hero.title': "Bonjour, je suis Sylvain. <br /> Ingénieur Platform.",
  'hero.subtitle':
    'Spécialisé en Kubernetes, GitOps et infrastructure cloud — je construis des systèmes fiables et automatisés à grande échelle.',

  // Navigation / CTA
  'nav.about': 'À propos',
  'nav.projects': 'Projets',
  'nav.blog': 'Blog',

  // Bento
  'bento.featured': 'Projet phare',
  'bento.discover': 'Voir plus de projets',
  'bento.techstack': 'Stack technique',
  'bento.techstack.desc':
    'Spécialisé en AWS/Azure, Kubernetes, Terraform et automatisation CI/CD. Expérimenté en C#, Python et technologies web modernes.',
  'bento.reading': 'En ce moment je lis',
  'bento.typing': 'Vitesse de frappe',

  // About
  'about.title': 'À propos de moi',
  'about.open': 'Disponible pour opportunités',
  'about.bio.1':
    "Je suis Ingénieur Platform avec 3+ ans d'expérience à construire et opérer des infrastructures Kubernetes à grande échelle — notamment à la Société Générale CIB où j'étais responsable des pipelines CI/CD et des pratiques GitOps pour une plateforme de paiement traitant des millions de transactions par jour.",
  'about.bio.2':
    "Ma stack tourne autour d'Azure (AKS), Terraform, ArgoCD et Helm. Mon objectif : rendre l'infrastructure invisible — les équipes livrent plus vite, les incidents durent moins longtemps, et l'astreinte est moins douloureuse.",
  'about.bio.3':
    "En dehors du travail, je gère un homelab sur Raspberry Pi qui reproduit la prod : ingress Traefik, CI avec Gitea Actions, tunnels Cloudflare pour un accès zéro-trust, et Prometheus/Grafana pour l'observabilité — mon terrain de jeu personnel pour tout ce que je ne peux pas casser au boulot.",
  'about.bio.4':
    "Je cherche activement mon prochain poste Platform / DevOps / SRE pour aider une équipe d'ingénierie à délivrer plus vite avec moins de risque. Si ça ressemble à votre équipe, envoyez-moi un message.",

  // Footer
  'footer.rights': 'Tous droits réservés.',
}

export default fr
