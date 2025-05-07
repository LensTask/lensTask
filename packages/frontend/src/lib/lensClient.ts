import {
  LensClient,
  production,
  development,
} from '@lens-protocol/client';

const isDevelopment = process.env.NODE_ENV === 'development';

const environment = isDevelopment
  ? { ...development, gqlEndpoint: '/api/lens/graphql' } // Use proxy in dev
  : production;

// Instantiate WITHOUT the storage key, relying on the default.
export const lensClient = new LensClient({ environment });
