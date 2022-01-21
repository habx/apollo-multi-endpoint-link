<!-- @format -->

## Apollo link which add an api directive to fetch data from multi endpoints

<img src="https://res.cloudinary.com/habx/image/upload/v1597742839/blog/tech/apollo-multi-link.jpg" />

[![CircleCI](https://img.shields.io/circleci/build/github/habx/apollo-multi-endpoint-link)](https://app.circleci.com/pipelines/github/habx/apollo-multi-endpoint-link)
[![Version](https://img.shields.io/npm/v/@habx/apollo-multi-endpoint-link)](https://www.npmjs.com/package/@habx/apollo-multi-endpoint-link)
[![Size](https://img.shields.io/bundlephobia/min/@habx/apollo-multi-endpoint-link)](https://bundlephobia.com/result?p=@habx/apollo-multi-endpoint-link)
[![License](https://img.shields.io/github/license/habx/apollo-multi-endpoint-link)](/LICENSE)

### Why ?

We wrote [an article](https://www.habx.com/tech/micro-graphql-schema) about why and how we did this link if you want more details.

### Install

```bash
   npm i @habx/apollo-multi-endpoint-link
```

### Setup

```typescript
import { createHttpLink } from "apollo-link-http";

new ApolloClient({
 link: ApolloLink.from([
   new MultiAPILink({
       endpoints: {
           housings: 'https://housings.api',
           projects: 'https://projects.api',
           ...
       },
       createHttpLink: () => createHttpLink(),
     }),
 ])
})
```

NB: Since default value of `httpSuffix` is `/graphql`, endpoints above will be transformed to `https://housings.api/graphql` and `https://projects.api/graphql`.
If you do not have common suffix, you can pass an empty string as `httpSuffix` to avoid this transformation.

##### API

```typescript
new MultiAPILink(config, request);
```

###### config

| Parameter       | Description                                                                                                                | Default                | Required |
| --------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------- | -------- |
| endpoints       | Dictionary of endpoints                                                                                                    |                        | Yes      |
| createHttpLink  | Function to generate http link like [apollo-link-http](https://www.apollographql.com/docs/link/links/http/)                |                        | Yes      |
| createWsLink    | Function to generate wsLink like [apollo-link-ws](https://www.apollographql.com/docs/link/links/ws/)                       |                        | No       |
| wsSuffix        | Suffix added to endpoint for subscriptions queries                                                                         | /graphql/subscriptions | No       |
| httpSuffix      | Suffix added to endpoint for http queries                                                                                  | /graphql               | No       |
| getContext      | Callback function called to set custom [context](https://www.apollographql.com/docs/link/links/http/#context) like headers |                        | No       |
| prefixTypenames | Add name argument passed in `@api` directive to every \_\_typename contained in network data response                      |                        | No       |

### Queries

#### Query with static api name :

```graphql
query projectList @api(name: projects) {
  projects {
    nodes {
      id
      name
    }
  }
}
```

```ts
const response = useQuery(myQuery);
```

#### Query with dynamic api name

```graphql
query projectList @api(contextKey: "apiName") {
  projects {
    nodes {
      id
      name
    }
  }
}
```

```ts
const response = useQuery(myQuery, { context: { apiName: "projects" } });
```

#### Setting custom context

Sometimes you might need to set custom [apollo link context](https://www.apollographql.com/docs/link/links/http/#context) like `headers` for authentication purpose.
This link allows it by doing as following.

```typescript
new MultiAPILink({
    getContext: (endpoint) => {
      if (endpoint === 'yourendpoint-with-auth') {
        return ({
          headers: {
            'Authorization': 'xxxx',
          }
        })
      }
      return {}
    },
    ...
})
```
