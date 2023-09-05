import * as keycloak from "@pulumi/keycloak";
import * as pulumi from "@pulumi/pulumi";

import { User } from "../data/user";

export class RealmSettingsProvider {
  private realName: string;

  constructor(realmName: string) {
    this.realName = realmName;
  }

  createRealm(realmName: string): keycloak.Realm {
    const args: keycloak.RealmArgs = {
      realm: this.realName,
    };
    return new keycloak.Realm(`keycloak_realm_${this.realName}`, args);
  }

  createGoogleProvider(
    realmId: pulumi.Output<string>,
    clientId: string,
    clientSecret: string
  ) {
    const args: keycloak.oidc.GoogleIdentityProviderArgs = {
      realm: realmId,
      clientId: clientId,
      clientSecret: clientSecret,
    };
    return new keycloak.oidc.GoogleIdentityProvider(
      `keycloak_google_identity_provider_${this.realName}`,
      args
    );
  }

  createGroup(
    realmId: pulumi.Output<string>,
    groupName: string
  ): keycloak.Group {
    const args: keycloak.GroupArgs = {
      realmId: realmId,
      name: groupName,
    };
    return new keycloak.Group(`keycloak_group_${this.realName}_${groupName}`, args);
  }

  createUser(
    realmId: pulumi.Output<string>,
    user: User
  ): keycloak.User {
    const args: keycloak.UserArgs = {
      realmId: realmId,
      username: user.username,
      initialPassword: {
        value: "ChangeMe!!",
        temporary: false,
      },
      email: user.email,
      emailVerified: true,
    };
    return new keycloak.User(`keycloak_user_${this.realName}_${user.username}`, args);
  }

  createGroupMemberShip(
    realmId: pulumi.Output<string>,
    groupName: string,
    groupId: pulumi.Output<string>,
    userNames: pulumi.Output<string>[]
  ): keycloak.GroupMemberships {
    const args: keycloak.GroupMembershipsArgs = {
      realmId: realmId,
      groupId: groupId,
      members: userNames,
    };
    return new keycloak.GroupMemberships(
      `keycloak_group_membership_${this.realName}_${groupName}`,
      args
    );
  }

  createGroupMembershipProtocolMapper(
    realmId: pulumi.Output<string>,
    claimName: string,
    clientScopeId: pulumi.Output<string>
  ) {
    const args: keycloak.openid.GroupMembershipProtocolMapperArgs = {
      realmId: realmId,
      claimName: claimName,
      clientScopeId: clientScopeId,
      name: claimName,
      fullPath: false,
    };
    return new keycloak.openid.GroupMembershipProtocolMapper(
      `keycloak_group_membership_protocol_mapper_${this.realName}_${claimName}`,
      args
    );
  }

  createOidcClient(
    realmId: pulumi.Output<string>,
    clientName: string,
    rootUri: string,
    validRedirectUris: string[],
    clientId: string,
    clientSecret: string
  ): keycloak.openid.Client {
    const args: keycloak.openid.ClientArgs = {
      realmId: realmId,
      name: clientName,
      clientId: clientId,
      clientSecret: clientSecret,
      accessType: "CONFIDENTIAL",
      standardFlowEnabled: true,
      rootUrl: rootUri,
      validRedirectUris: validRedirectUris,
      consentRequired: true,
    };
    return new keycloak.openid.Client(
      `keycloak_openid_client_${this.realName}_${clientId}`,
      args
    );
  }

  createClientScope(
    realmId: pulumi.Output<string>,
    clientScopeName: string,
    includeInTokenScope: boolean
  ): keycloak.openid.ClientScope {
    const args: keycloak.openid.ClientScopeArgs = {
      realmId: realmId,
      name: clientScopeName,
      includeInTokenScope: includeInTokenScope,
      consentScreenText: clientScopeName,
    };
    return new keycloak.openid.ClientScope(
      `keycloak_client_scope_${this.realName}_${clientScopeName}`,
      args
    );
  }

  createClientDefaultScopes(
    realmId: pulumi.Output<string>,
    clientName: string,
    clientId: pulumi.Output<string>,
    defaultScopes: string[]
  ): keycloak.openid.ClientDefaultScopes {
    const args: keycloak.openid.ClientDefaultScopesArgs = {
      realmId: realmId,
      clientId: clientId,
      defaultScopes: defaultScopes,
    };
    return new keycloak.openid.ClientDefaultScopes(
      `keycloak_client_default_scopes_${this.realName}_${clientName}`,
      args
    );
  }

  createClientOptionalScopes(
    realmId: pulumi.Output<string>,
    clientName: string,
    clientId: pulumi.Output<string>,
    optionalScopes: string[]
  ): keycloak.openid.ClientOptionalScopes {
    const args: keycloak.openid.ClientOptionalScopesArgs = {
      realmId: realmId,
      clientId: clientId,
      optionalScopes: optionalScopes,
    };
    return new keycloak.openid.ClientOptionalScopes(
      `keycloak_client_optional_scopes_${this.realName}_${clientName}`,
      args
    );
  }
}
