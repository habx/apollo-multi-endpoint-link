import { ApolloLink } from '@apollo/client/core'

export interface MultiAPILinkConfig {
  /**
   * Dictionary of your endpoints.
   * Keys will be used as name identifier in the `@api` directive
   */
  endpoints: Record<string, string>
  /**
   * Init http apollo link
   */
  createHttpLink: () => ApolloLink
  /**
   * Init websocket apollo link
   * @param endpoint
   */
  createWsLink?: (endpoint: string) => ApolloLink
  /**
   * Suffix to add to your endpoint for websocket subscriptions
   */
  wsSuffix?: string
  /**
   * Suffix to add to your endpoint for http calls
   */
  httpSuffix?: string
  /**
   *
   * @param endpoints
   * @param getCurrentContext
   * Callback function to set context like headers according to your endpoint.
   */
  getContext?: (
    endpoint: string,
    getCurrentContext: () => Record<string, any>
  ) => Record<string, any>
  /**
   * Add apiName passed in `api` directive to every `__typename` contained in network data response
   * eg: with `@api(name: 'v1')` directive in your query, an initial typename `Project` would become `v1:Project`
   */
  prefixTypenames?: boolean
}
