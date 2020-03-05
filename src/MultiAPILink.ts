import { ApolloLink, NextLink, Operation, RequestHandler } from 'apollo-link'
import { hasDirectives, removeDirectivesFromDocument } from 'apollo-utilities'
import { OperationDefinitionNode, StringValueNode } from 'graphql'

class MultiAPILink extends ApolloLink {
  endpoints: Record<string, string>

  constructor(endpoints: Record<string, string>, request?: RequestHandler) {
    super(request)
    this.endpoints = endpoints
  }

  public request(operation: Operation, nextLink: NextLink) {
    if (!hasDirectives(['api'], operation.query)) {
      nextLink(operation)
    }

    const apiName: string = ((operation.query.definitions.find(
      definition => definition.kind === 'OperationDefinition'
    ) as OperationDefinitionNode)?.directives
      ?.find(directive => directive.name?.value === 'api')
      ?.arguments?.find(argument => argument.name?.value === 'name')
      ?.value as StringValueNode)?.value

    const query = removeDirectivesFromDocument(
      [{ name: 'api', remove: true }],
      operation.query
    )
    if (!query) {
      throw new Error('Error while removing directive api')
    }

    operation.query = query

    if (this.endpoints[apiName]) {
      operation.setContext({
        uri: `${this.endpoints[apiName]}/graphql`,
      })
    } else if (process.env.NODE_ENV === 'dev') {
      throw new Error(`${apiName} is not defined in endpoints definitions`)
    }

    return nextLink(operation)
  }
}

export default MultiAPILink
