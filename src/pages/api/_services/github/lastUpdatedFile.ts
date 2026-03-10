import { GH_ACCESS_TOKEN } from 'astro:env/server'

interface LastUpdatedTimeData {
  lastUpdatedTime: string
  latestCommitUrl: string
}

const getLastUpdatedTimeByFile = async (
  filePath: string
): Promise<LastUpdatedTimeData> => {  if (!GH_ACCESS_TOKEN) {
    throw new Error('GH_ACCESS_TOKEN is not set')
  }
  const API_URL = `https://api.github.com/repos/sylvaincostes/Portfolio-ouiok/commits?`

  const params = new URLSearchParams({
    path: `src/content/${filePath}`,
    per_page: '1'
  }).toString()

  const response = await fetch(API_URL + params, {
    headers: { Authorization: `Bearer ${GH_ACCESS_TOKEN}` }
  })

  const [data] = await response.json()

  return {
    lastUpdatedTime: data.commit.committer.date,
    latestCommitUrl: data.html_url
  }
}

export default getLastUpdatedTimeByFile
