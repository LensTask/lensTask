import request from "graphql-request";

const isDevelopment = process.env.NODE_ENV === 'development';
const prodEndpoint = "https://api-v2.lens.dev/graphql";
const devEndpoint = "/api/lens/graphql"; // Path for the Next.js rewrite

const endpoint = isDevelopment ? devEndpoint : prodEndpoint;

export function gql<T>(query: string, variables?: Record<string, any>) {
  return request<T>(endpoint, query, variables);
}
