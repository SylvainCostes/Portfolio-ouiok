import { gql } from 'graphql-request'

export const GetGithubContributions = gql`
  query ($userName: String!) {
    user(login: $userName) {
      repositories(first: 1, orderBy: { direction: DESC, field: PUSHED_AT }) {
        nodes {
          name
          pushedAt
        }
      }
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
      }
    }
  }
`

export const GetRepoInfo = gql`
  query ($username: String!, $repositoryName: String!) {
    repository(name: $repositoryName, owner: $username) {
      id
      name
      nameWithOwner
      description
      forkCount
      stargazerCount
      openGraphImageUrl
      pushedAt
      updatedAt
      url
    }
  }
`
