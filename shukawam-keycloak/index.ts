import * as pulumi from "@pulumi/pulumi";

import { Data } from "./data/data";
import { RealmSettingsProvider } from "./providers/realm-settings-provider";

const config = new pulumi.Config();
const data = config.requireObject<Data>("data");

// create realms.
data.realms.forEach((r) => {
  const provider = new RealmSettingsProvider(r.name);
  const realmId = provider.createRealm(r.name).id;
  // create google provider.
  if (r.googleProvider != undefined) {
    provider.createGoogleProvider(
      realmId,
      r.googleProvider.clientId,
      r.googleProvider.clientSecret
    );
  }
  // create group, member, groupmembership.
  if (r.groups != undefined) {
    r.groups.forEach((g) => {
      const group = provider.createGroup(realmId, g.name);
      if (g.users != undefined) {
        const usernames: pulumi.Output<string>[] = [];
        g.users.forEach((u) => {
          usernames.push(provider.createUser(realmId, u).username);
        });
        provider.createGroupMemberShip(realmId, g.name, group.id, usernames);
      }
    });
  }
  // create oidc client.
  if (r.oidc != undefined) {
    if (r.oidc.additionalScopes != undefined) {
      r.oidc.additionalScopes.forEach((s) => {
        const scope = provider.createClientScope(realmId, s, true);
        if (s === "groups") {
          provider.createGroupMembershipProtocolMapper(realmId, s, scope.id);
        }
      });
    }
    r.oidc.clients.forEach((c) => {
      const client = provider.createOidcClient(
        realmId,
        c.clientName,
        c.rootUri,
        c.validRedirectUris,
        c.clientId,
        c.clientSecret
      );
      // create scopes
      if (c.defaultScopes != undefined) {
        provider.createClientDefaultScopes(
          realmId,
          c.clientName,
          client.id,
          c.defaultScopes
        );
      }
      if (c.optionalScopes != undefined) {
        provider.createClientOptionalScopes(
          realmId,
          c.clientName,
          client.id,
          c.optionalScopes
        );
      }
    });
  }
});
