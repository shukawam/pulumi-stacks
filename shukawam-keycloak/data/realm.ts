import { GoogleProvider } from "./google-provider";
import { Oidc } from "./oidc";
import { Group } from "./group";

export interface Realm {
  name: string;
  groups?: Group[];
  oidc?: Oidc;
  googleProvider?: GoogleProvider;
}
