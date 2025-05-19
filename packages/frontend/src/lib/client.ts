// src/lib/client.ts
import { PublicClient, testnet, mainnet } from "@lens-protocol/client";
import { fragments }              from "./fragments";

// 1) Build a simple LocalStorage-backed provider
const localStorageProvider = {
  getItem:    (key: string) => window.localStorage.getItem(key),
  setItem:    (key: string, value: string) => window.localStorage.setItem(key, value),
  removeItem: (key: string) => window.localStorage.removeItem(key),
};

// 2) Create your client, including all required config fields:
export const client = PublicClient.create({
  environment: mainnet,         // ← required
  fragments,                    // ← your generated GraphQL fragments
  storage: localStorageProvider // ← now persists credentials across reloads
});
