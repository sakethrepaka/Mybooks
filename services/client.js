import { ApolloClient, InMemoryCache } from "@apollo/client";

const apikey = process.env.EXPO_PUBLIC_HASURA_ADMIN_SECRET;

const client = new ApolloClient({
  uri: "https://settling-donkey-30.hasura.app/v1/graphql", // Your Hasura GraphQL endpoint
  headers: {
    "x-hasura-admin-secret": apikey,
    "content-type": "application/json",
  },
  cache: new InMemoryCache(),
});

export default client;
