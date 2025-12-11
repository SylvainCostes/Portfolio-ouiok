import { ArgoCD } from '@icons/ArgoCD'
import { AWS } from '@icons/AWS'
import { Azure } from '@icons/Azure'
import { Bash } from '@icons/Bash'
import { CSharp } from '@icons/CSharp'
import { Docker } from '@icons/Docker'
import { Github } from '@icons/Github'
import { Helm } from '@icons/Helm'
import { Kubernetes } from '@icons/Kubernetes'
import { Okta } from '@icons/Okta'
import { PostgreSQL } from '@icons/PostgreSQL'
import { PowerShell } from '@icons/PowerShell'
import { Python } from '@icons/Python'
import { RabbitMQ } from '@icons/RabbitMQ'
import { Terraform } from '@icons/Terraform'
import { TypeScript } from '@icons/TypeScript'
import type { JSX, SVGProps } from 'react'

type TechStack = {
  name: string
  icon: (props: SVGProps<SVGSVGElement>) => JSX.Element
  description: string
}

const techStacks: TechStack[] = [
  {
    name: 'AWS',
    icon: AWS, // Placeholder - replace with AWS icon
    description:
      'Amazon Web Services - Cloud platform expertise with Lambda, S3, EC2, and serverless architecture.'
  },
  {
    name: 'Azure',
    icon: Azure, // Placeholder - replace with Azure icon
    description:
      'Microsoft Azure - Container orchestration with AKS, Azure DevOps, and cloud infrastructure management.'
  },
  {
    name: 'Docker',
    icon: Docker,
    description:
      'Container platform for building, shipping, and running distributed applications.'
  },
  {
    name: 'Kubernetes',
    icon: Kubernetes, // Placeholder - replace with K8s icon
    description:
      'Container orchestration platform for automating deployment, scaling, and management (kubectl, AKS).'
  },
  {
    name: 'Terraform',
    icon: Terraform, // Placeholder - replace with Terraform icon
    description:
      'Infrastructure as Code (IaC) tool for building, changing, and versioning infrastructure safely.'
  },
  {
    name: 'C# / .NET',
    icon: CSharp, // Placeholder - replace with C# icon
    description:
      'Backend API development with .NET framework for enterprise applications.'
  },
  {
    name: 'GitHub',
    icon: Github,
    description:
      'Version control and collaboration using Git and GitHub for source code management.'
  },
  {
    name: 'Python',
    icon: Python, // Placeholder - replace with Python icon
    description:
      'Scripting, security automation, and DevOps tooling for infrastructure management.'
  },
  {
    name: 'TypeScript',
    icon: TypeScript,
    description:
      'Full-stack development with type-safe JavaScript for scalable applications.'
  },
  {
    name: 'PostgreSQL',
    icon: PostgreSQL, // Placeholder - replace with PostgreSQL icon
    description:
      'Relational database management and migration from ELK stack.'
  },
  {
    name: 'ArgoCD',
    icon: ArgoCD, // Placeholder - replace with ArgoCD icon
    description:
      'Continuous deployment tool for Kubernetes with GitOps workflows.'
  },
  {
    name: 'PowerShell',
    icon: PowerShell, // Placeholder - replace with PowerShell icon
    description:
      'Windows automation and scripting for DevOps processes.'
  },
  {
    name: 'Bash',
    icon: Bash, // Placeholder - replace with Bash icon
    description:
      'Linux scripting and automation for infrastructure management.'
  },
  {
    name: 'Helm',
    icon: Helm, // Placeholder - replace with Helm icon
    description:
      'Kubernetes package manager for deploying and managing custom charts.'
  },
  {
    name: 'RabbitMQ',
    icon: RabbitMQ, // Placeholder - replace with RabbitMQ icon
    description:
      'Message broker for asynchronous communication and Azure migration.'
  },
  {
    name: 'OAuth2 / Okta',
    icon: Okta, // Placeholder - replace with Okta icon
    description:
      'Single Sign-On (SSO) implementation and identity access management.'
  }
]

export default techStacks
