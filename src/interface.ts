import { ApolloLink } from '@apollo/client/core'

export interface MultiAPILinkConfig {
  endpoints: Record<string, string>
  createHttpLink: () => ApolloLink
  createWsLink?: (endpoint: string) => ApolloLink
  wsSuffix?: string
  httpSuffix?: string
  getContext?: (
    endpoints: string,
    getCurrentContext: () => Record<string, any>
  ) => Record<string, any>
  /**
   * Add apiName passed in `api` directive to every `__typename` contained in network data response
   * eg: with `@api(name: 'v1')` directive in your query, an initial typename `Project` would become `v1:Project`
   */
  addApiInTypeName?: boolean
}
