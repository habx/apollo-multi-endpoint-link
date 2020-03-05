## Apollo link which add an api directive to fetch data from multi endpoints


### Install
```bash
   npm i @habx/apollo-multi-endpoint-link
```

### Setup
```typescript
  new ApolloClient({
    link: ApolloLink.from([
      new MultiAPILink({
          housings: 'https://housings.api/graphql',
          projects: 'https://projects.api/graphql',
          ...
        }),
      new HttpLink({ ... }),
    ])
  })
```

### Queries
```graphql
  query projectList @api(name: projects) {
    projects {
      nodes {
        id
        name
      }
    }
  }
````
