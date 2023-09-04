import { Client } from "./client";

export interface Oidc {
  clients: Client[];
  additionalScopes?: string[];
}
