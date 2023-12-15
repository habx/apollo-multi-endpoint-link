import {
  ApolloLink,
  createHttpLink,
  execute,
  gql,
  toPromise,
} from '@apollo/client/core'
import { RestLink } from 'apollo-link-rest'
import fetchMock from 'jest-fetch-mock'

import { MultiAPILink } from './MultiAPILink'
import { RetryLink } from "@apollo/client/link/retry";

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

const queryC = gql`
  query {
    queryToC {
      data
    }
  }
`

const queryD = gql`
  query {
    queryToD @rest(method: "GET", endpoint: d, path: "/") {
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

  it('should redirect request to default endpoint if none is passed explicitely', async () => {
    const link = new MultiAPILink({
      endpoints: Object.fromEntries(
        Object.keys(ENDPOINTS_CONFIG).map((endpointKey) => [
          endpointKey,
          ORIGIN + ENDPOINTS_CONFIG[endpointKey].path,
        ])
      ),
      defaultEndpoint: 'b',
      createHttpLink: () => createHttpLink(),
    })

    const queryCResponse = await toPromise(
      execute(link, {
        query: queryC,
      })
    )

    expect(queryCResponse.data).toEqual(ENDPOINTS_CONFIG.b.response)
  })

  it('should ignore MultiAPILink if there is a REST directive', async () => {
    const httpLink = createHttpLink()
    const httpLinkSpy = jest.spyOn(httpLink, 'request')
    const link = ApolloLink.from([
      new MultiAPILink({
        endpoints: Object.fromEntries(
          Object.keys(ENDPOINTS_CONFIG).map((endpointKey) => [
            endpointKey,
            ORIGIN + ENDPOINTS_CONFIG[endpointKey].path,
          ])
        ),
        createHttpLink: () => httpLink,
      }),
      new RestLink({
        endpoints: {
          d: 'test',
        },
      }),
    ])

    await toPromise(
      execute(link, {
        query: queryD,
      })
    )

    expect(httpLinkSpy).not.toBeCalled()
  })

  it('should ignore default endpoint if there is a REST directive', async () => {
    const httpLink = createHttpLink()
    const httpLinkSpy = jest.spyOn(httpLink, 'request')
    const link = ApolloLink.from([
      new MultiAPILink({
        endpoints: Object.fromEntries(
          Object.keys(ENDPOINTS_CONFIG).map((endpointKey) => [
            endpointKey,
            ORIGIN + ENDPOINTS_CONFIG[endpointKey].path,
          ])
        ),
        defaultEndpoint: 'b',
        createHttpLink: () => httpLink,
      }),
      new RestLink({
        endpoints: {
          d: 'test',
        },
      }),
    ])

    await toPromise(
      execute(link, {
        query: queryD,
      })
    )

    expect(httpLinkSpy).not.toBeCalled()
  })

  describe('with retry link', () => {
    beforeEach(() => {
      fetchMock.resetMocks()

      fetchMock.mockRejectOnce(new Error('Network error'))

      fetchMock.mockResponse((req) => {
        const data = Object.values(ENDPOINTS_CONFIG).find((config) =>
          req.url.endsWith(`${config.path}/graphql`)
        )?.response
        return Promise.resolve(JSON.stringify({data}))
      })
    })

    it('should retry the operation with the correct endpoint', async () => {
      const retryLink = new RetryLink({
        attempts: {
          max: 2,
        },
      });
      const link = ApolloLink.from([
        retryLink,
        new MultiAPILink({
          endpoints: Object.fromEntries(
            Object.keys(ENDPOINTS_CONFIG).map((endpointKey) => [
              endpointKey,
              ORIGIN + ENDPOINTS_CONFIG[endpointKey].path,
            ])
          ),
          defaultEndpoint: 'b',
          createHttpLink: () => createHttpLink(),
        })
      ])

      const queryAResponse = await toPromise(
        execute(link, {
          query: queryA,
        })
      )

      expect(queryAResponse.data).toEqual(ENDPOINTS_CONFIG.a.response)
    })
  })
})
