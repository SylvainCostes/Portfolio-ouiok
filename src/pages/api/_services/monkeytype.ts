import { MONKEYTYPE_API_KEY } from 'astro:env/server'

import type { MonkeyTypeData } from '@/types'

const mapResponse = (response: any) => {
  // Vérifier si response.data existe et est un objet
  if (!response?.data || typeof response.data !== 'object') {
    console.error('Invalid response structure:', response)
    throw new Error('Invalid Monkeytype API response structure')
  }

  return Object.entries(response.data).flatMap(([time, records]) => {
    // Vérifier que records est bien un tableau
    if (!Array.isArray(records)) {
      console.error('Records is not an array for time:', time, records)
      return []
    }
    return (records as any[]).map((record: any) => ({
      ...record,
      time: Number(time)
    }))
  })
}

const getMonkeytypeData = async (): Promise<MonkeyTypeData> => {
  const API_KEY = MONKEYTYPE_API_KEY
  const response = await fetch(
    'https://api.monkeytype.com/users/personalBests?mode=time',
    { headers: { Authorization: `ApeKey ${API_KEY}` } }
  )

  const responseJSON = await response.json()
  
  // Log pour debug
  console.log('Monkeytype API response:', JSON.stringify(responseJSON, null, 2))
  
  const data = mapResponse(responseJSON)

  if (!data || data.length === 0) {
    throw new Error('No data returned from Monkeytype API')
  }

  const bestScore = data.reduce((max, item) => {
    return item.wpm > max.wpm ? item : max
  }, data[0])

  return {
    acc: Math.round(bestScore.acc),
    consistency: Math.round(bestScore.consistency),
    language: bestScore.language,
    time: bestScore.time,
    wpm: Math.round(bestScore.wpm)
  }
}

export default getMonkeytypeData
