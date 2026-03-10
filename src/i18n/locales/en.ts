const en = {
  // Hero
  'hero.badge': 'Open to opportunities',
  'hero.title': "Hi, I'm Sylvain. <br /> A Platform Engineer.",
  'hero.subtitle':
    'Specialized in Kubernetes, GitOps, and cloud infrastructure — I build reliable, automated systems at scale.',

  // Navigation / CTA
  'nav.about': 'About',
  'nav.projects': 'Projects',
  'nav.blog': 'Blog',

  // Bento
  'bento.featured': 'Featured work',
  'bento.discover': 'Discover more projects',
  'bento.techstack': 'Tech stack',
  'bento.techstack.desc':
    'Specialized in AWS/Azure, Kubernetes, Terraform, and CI/CD automation. Experienced in C#, Python, and modern web technologies.',
  'bento.reading': 'Currently reading',
  'bento.typing': 'Typing speed',

  // About
  'about.title': 'About me',
  'about.open': 'Open to opportunities',
  'about.bio.1':
    "I'm a Platform Engineer with 3+ years of experience building and operating Kubernetes-based infrastructure at scale — most recently at Société Générale CIB where I owned the CI/CD pipelines and GitOps practices for a payment platform processing millions of transactions daily.",
  'about.bio.2':
    "My stack centers on Azure (AKS), Terraform, ArgoCD, and Helm, and I care deeply about making infrastructure invisible: teams ship faster, incidents are shorter, and on-call is less painful.",
  'about.bio.3':
    'Beyond the day job I run a Raspberry Pi homelab that mirrors prod: Traefik ingress, Gitea Actions CI, Cloudflare Tunnels for zero-trust access, and Prometheus/Grafana for observability — basically my personal playground for things I can\'t break at work.',
  'about.bio.4':
    'I\'m actively looking for my next Platform / DevOps / SRE role where I can help an engineering team move faster with less fear. If that sounds like your team, send me a message.',

  // Footer
  'footer.rights': 'All rights reserved.',
} as const

export default en
export type TranslationKey = keyof typeof en
