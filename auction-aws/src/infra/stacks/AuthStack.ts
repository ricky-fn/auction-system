import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { CfnIdentityPool, CfnIdentityPoolRoleAttachment, CfnUserPoolGroup, OAuthScope, UserPool, UserPoolClient, UserPoolClientIdentityProvider } from "aws-cdk-lib/aws-cognito";
import { Effect, FederatedPrincipal, Policy, PolicyStatement, Role } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export class AuthStack extends Stack {

	public userPool: UserPool;
	private userPoolClient: UserPoolClient;
	private identityPool: CfnIdentityPool;
	private authenticatedRole: Role; // add authenticated role
	private unAuthenticatedRole: Role; // add unauthenticated role
	private adminRole: Role; // add admin role


	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props);

		this.createUserPool();
		this.createUserPoolClient();
		this.createIdentityPool();
		this.createRoles(); // create roles with trust policy to allow cognito identity pool to assume them
		this.attachRoles(); // attach roles to the identity pool
		this.createAdminsGroup(); // create admins group after creating the admin role
	}

	private createUserPool() {
		this.userPool = new UserPool(this, "AuctionUserPool", {
			selfSignUpEnabled: true,
			signInAliases: {
				username: true,
				email: true
			}
		});

		new CfnOutput(this, "AuctionUserPoolId", {
			value: this.userPool.userPoolId
		});
	}
	private createUserPoolClient() {
		this.userPoolClient = this.userPool.addClient("AuctionUserPoolClient", {
			authFlows: {
				adminUserPassword: true,
				custom: true,
				userPassword: true,
				userSrp: true
			},
			generateSecret: true,
			// refer to https://next-auth.js.org/providers/cognito
			oAuth: {
				flows: {
					authorizationCodeGrant: true,
				},
				scopes: [
					OAuthScope.EMAIL, OAuthScope.OPENID, OAuthScope.PROFILE
				],
				callbackUrls: ["http://localhost:3000/api/auth/callback/cognito"], // read from env file
			},
			supportedIdentityProviders: [UserPoolClientIdentityProvider.COGNITO]
		});
		new CfnOutput(this, "AuctionUserPoolClientId", {
			value: this.userPoolClient.userPoolClientId
		});
	}

	private createAdminsGroup() {
		new CfnUserPoolGroup(this, "AuctionAdmins", {
			userPoolId: this.userPool.userPoolId,
			groupName: "admins",
			roleArn: this.adminRole.roleArn // add the admin role to the group
		});
	}

	private createIdentityPool() {
		this.identityPool = new CfnIdentityPool(this, "AuctionIdentityPool", {
			allowUnauthenticatedIdentities: true,
			cognitoIdentityProviders: [{ // connected to our user pool
				clientId: this.userPoolClient.userPoolClientId,
				providerName: this.userPool.userPoolProviderName
			}]
		});
		new CfnOutput(this, "AuctionIdentityPoolId", {
			value: this.identityPool.ref // output the identity pool id
		});
	}

	private createRoles() {
		this.unAuthenticatedRole = new Role(this, "CognitoDefaultUnauthenticatedRole", {
			assumedBy: new FederatedPrincipal("cognito-identity.amazonaws.com", {
				StringEquals: {
					"cognito-identity.amazonaws.com:aud": this.identityPool.ref,
				},
				"ForAnyValue:StringLike": {
					"cognito-identity.amazonaws.com:amr": "unauthenticated",
				},
			}, "sts:AssumeRoleWithWebIdentity"),
		});
		this.authenticatedRole = new Role(this, "CognitoDefaultAuthenticatedRole", {
			assumedBy: new FederatedPrincipal("cognito-identity.amazonaws.com", {
				StringEquals: {
					"cognito-identity.amazonaws.com:aud": this.identityPool.ref,
				},
				"ForAnyValue:StringLike": {
					"cognito-identity.amazonaws.com:amr": "authenticated",
				},
			}, "sts:AssumeRoleWithWebIdentity"),
		});
		this.adminRole = new Role(this, "CognitoAdminRole", {
			assumedBy: new FederatedPrincipal("cognito-identity.amazonaws.com", {
				StringEquals: {
					"cognito-identity.amazonaws.com:aud": this.identityPool.ref,
				},
				"ForAnyValue:StringLike": {
					"cognito-identity.amazonaws.com:amr": "authenticated",
				},
			}, "sts:AssumeRoleWithWebIdentity"),
		});
	}

	private attachRoles() {
		new CfnIdentityPoolRoleAttachment(this, "IdentityPoolRoleAttachment", {
			identityPoolId: this.identityPool.ref,
			roles: {
				"unauthenticated": this.unAuthenticatedRole.roleArn,
				"authenticated": this.authenticatedRole.roleArn,
			},
			roleMappings: {
				adminMapping: {
					identityProvider: `${this.userPool.userPoolProviderName}:${this.userPoolClient.userPoolClientId}`,
					type: "Token",
					ambiguousRoleResolution: "AuthenticatedRole",
				}
			}
		});
	}
}