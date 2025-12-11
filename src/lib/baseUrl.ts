import { PUBLIC_VERCEL_PROJECT_PRODUCTION_URL } from 'astro:env/client'

const url = PUBLIC_VERCEL_PROJECT_PRODUCTION_URL

export const BASE_URL = url ? `https://${url}` : 'http://localhost:4321'
