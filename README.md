### Apollo link which add an api directive to fetch data from multi endpoints

#### Setup
```typescript
  new ApolloClient({
    link: new MultiAPILink({
      housings: 'https://housings.api/graphql',
      projects: 'https://projects.api/graphql'
    })
  })
```

#### Queries
```graphql
const projectOptionListQuery = gql`
  query projectList @api(name: projects) {
    projects {
      nodes {
        id
        name
      }
    }
  }
````
