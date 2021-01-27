import {
  ApolloLink,
  NextLink,
  Operation,
  RequestHandler,
} from '@apollo/client/core'
import {
  getMainDefinition,
  hasDirectives,
  removeDirectivesFromDocument,
} from '@apollo/client/utilities'
import { OperationDefinitionNode, StringValueNode } from 'graphql'

type Config = {
  endpoints: Record<string, string>
  createHttpLink: () => ApolloLink
  createWsLink?: (endpoint: string) => ApolloLink
  wsSuffix?: string
  httpSuffix?: string
  getContext?: (
    endpoints: string,
    getCurrentContext: () => Record<string, any>
  ) => Record<string, any>
}

const getDirectiveArgumentValueFromOperation = (
  operation: Operation,
  directiveName: string,
  argumentName: string
) =>
  ((operation.query.definitions.find(
    (definition) => definition.kind === 'OperationDefinition'
  ) as OperationDefinitionNode)?.directives
    ?.find((directive) => directive.name?.value === directiveName)
    ?.arguments?.find((argument) => argument.name?.value === argumentName)
    ?.value as StringValueNode)?.value

class MultiAPILink extends ApolloLink {
  httpLink: ApolloLink
  wsLinks: Record<string, ApolloLink>

  config: Config

  constructor(config: Config, request?: RequestHandler) {
    super(request)
    this.config = config
    this.httpLink = config.createHttpLink()
    this.wsLinks = {}
  }

  public request(operation: Operation, forward?: NextLink) {
    if (!hasDirectives(['api'], operation.query)) {
      return forward?.(operation) ?? null
    }

    let apiName: string = getDirectiveArgumentValueFromOperation(
      operation,
      'api',
      'name'
    )

    if (!apiName) {
      const contextKey = getDirectiveArgumentValueFromOperation(
        operation,
        'api',
        'contextKey'
      )

      if (contextKey) {
        apiName = operation.getContext()[contextKey]
      }
    }

    const query = removeDirectivesFromDocument(
      [{ name: 'api', remove: true }],
      operation.query
    )

    if (!query) {
      throw new Error('Error while removing directive api')
    }

    operation.query = query

    if (this.config.getContext) {
      operation.setContext(
        this.config.getContext(apiName, operation.getContext)
      )
    }

    if (this.config.endpoints[apiName]) {
      operation.setContext({
        uri: `${this.config.endpoints[apiName]}${
          this.config.httpSuffix ?? '/graphql'
        }`,
      })
    } else if (process.env.NODE_ENV === 'dev') {
      throw new Error(`${apiName} is not defined in endpoints definitions`)
    }

    const definition = getMainDefinition(operation.query)
    if (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    ) {
      if (!this.config.createWsLink) {
        throw new Error(
          `You tried to call a subscription without configuring "createWsLink" function:${operation.query}`
        )
      }
      if (!this.wsLinks[apiName]) {
        const endpoint = this.config.endpoints[apiName]
        const wsEndpoint = endpoint.startsWith('/')
          ? `${window.location.origin}${endpoint}`.replace('http', 'ws')
          : endpoint.replace('http', 'ws')
        this.wsLinks[apiName] = this.config.createWsLink(
          `${wsEndpoint}${this.config.wsSuffix ?? '/graphql/subscriptions'}`
        )
      }

      return this.wsLinks[apiName].request(operation, forward)
    }

    return this.httpLink.request(operation, forward)
  }
}

export default MultiAPILink
