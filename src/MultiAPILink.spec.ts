import { createHttpLink, execute, gql, toPromise } from '@apollo/client/core'
import fetchMock from 'jest-fetch-mock'

import { MultiAPILink } from './MultiAPILink'

fetchMock.enableMocks()

const ORIGIN = `https://api`
const ENDPOINTS_CONFIG: Record<string, { path: string; response: any }> = {
  a: {
    path: '/a',
    response: { name: 'A' },
  },
  b: {
    path: '/b',
    response: { name: 'B' },
  },
}

const queryA = gql`
  query @api(name: "a") {
    queryToA {
      data
    }
  }
`

const queryB = gql`
  query @api(name: "b") {
    queryToB {
      data
    }
  }
`

describe('MultiAPILink', () => {
  beforeEach(() => {
    fetchMock.mockResponse((req) => {
      const data = Object.values(ENDPOINTS_CONFIG).find((config) =>
        req.url.endsWith(`${config.path}/graphql`)
      )?.response
      return Promise.resolve(JSON.stringify({ data }))
    })
  })
  it('should redirect request to right endpoint', async () => {
    const link = new MultiAPILink({
      endpoints: Object.fromEntries(
        Object.keys(ENDPOINTS_CONFIG).map((endpointKey) => [
          endpointKey,
          ORIGIN + ENDPOINTS_CONFIG[endpointKey].path,
        ])
      ),
      createHttpLink: () => createHttpLink(),
    })

    const queryAResponse = await toPromise(
      execute(link, {
        query: queryA,
      })
    )
    const queryBResponse = await toPromise(
      execute(link, {
        query: queryB,
      })
    )

    expect(queryAResponse.data).toEqual(ENDPOINTS_CONFIG.a.response)
    expect(queryBResponse.data).toEqual(ENDPOINTS_CONFIG.b.response)
  })
})
