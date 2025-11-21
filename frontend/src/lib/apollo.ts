import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

// Subgraph endpoint - Updated with your deployed subgraph URL
const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL || 'https://api.studio.thegraph.com/query/1715807/agora-sub/0.0.1';

export const makeClient = () => {
  return new ApolloClient({
    link: new HttpLink({
      uri: SUBGRAPH_URL,
    }),
    cache: new InMemoryCache(),
  });
};