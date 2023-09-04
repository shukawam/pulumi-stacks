export interface Client {
  clientName: string;
  clientId: string;
  clientSecret: string;
  rootUri: string;
  validRedirectUris: string[];
  defaultScopes?: string[];
  optionalScopes?: string[];
}
