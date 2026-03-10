import { GH_ACCESS_TOKEN } from 'astro:env/server'
import request from 'graphql-request'

import { GetGithubContributions } from '@/lib/graphql'
import type { GithubContributionData } from '@/types'

const getGithubContributions = async (): Promise<GithubContributionData> => {
  const response = await request({
    url: 'https://api.github.com/graphql',
    document: GetGithubContributions,
    variables: { userName: 'sylvaincostes' },
    requestHeaders: {
      Authorization: `Bearer ${GH_ACCESS_TOKEN}`
    }
  })

  const parsedResponse = (response as any).user.contributionsCollection
    .contributionCalendar

  return {
    lastPushedAt: (response as any).user.repositories.nodes[0].pushedAt,
    totalContributions: parsedResponse.totalContributions,
    contributions: parsedResponse.weeks.flatMap((week: any) => {
      return week.contributionDays.map((day: any) => {
        return {
          count: day.contributionCount,
          date: day.date.replace(/-/g, '/')
        }
      })
    })
  }
}

export default getGithubContributions
