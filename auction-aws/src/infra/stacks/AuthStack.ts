import { Aws, SecretValue, StackProps } from "aws-cdk-lib";
import { CfnIdentityPool, CfnIdentityPoolRoleAttachment, OAuthScope, ProviderAttribute, UserPool, UserPoolClient, UserPoolClientIdentityProvider, UserPoolIdentityProviderGoogle, UserPoolOperation } from "aws-cdk-lib/aws-cognito";
import { Effect, FederatedPrincipal, PolicyStatement, Role } from "aws-cdk-lib/aws-iam";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { IBucket } from "aws-cdk-lib/aws-s3";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";
import BaseStack from "./BaseStack";
import { IAuctionStageConfig, IStackCfnOutputObject } from "../../types";

interface AuthStackProps extends StackProps {
	userSignUpLambda: NodejsFunction
	userSignInLambda: NodejsFunction
	photosBucket: IBucket
}

export class AuthStack extends BaseStack {
	public envFromCfnOutputs: IStackCfnOutputObject;

	public userPool: UserPool;
	private userPoolClient: UserPoolClient;
	private identityPool: CfnIdentityPool;
	private authenticatedRole: Role;
	private unAuthenticatedRole: Role;
	private googleIdentityProvider: UserPoolIdentityProviderGoogle;

	constructor(scope: Construct, id: string, props: AuthStackProps) {
		super(scope, id, props);

		this.createUserPool();
		this.createGoogleIdentityPool();
		this.createUserPoolClient();
		this.createAuthTriggers(props);
		this.createIdentityPool();
		this.createRoles(props.photosBucket);
		this.attachRoles(); // attach roles to the identity pool


		this.addEnvFromCfnOutputs("AuctionAuthRegion", Aws.REGION);
	}

	private createUserPool() {
		this.userPool = new UserPool(this, `AuctionUserPool${this.suffix}`, {
			selfSignUpEnabled: false,
			signInAliases: {
				username: true,
			}
		});

		const CognitoDomain = this.userPool.addDomain(`AuctionUserPoolDomain${this.suffix}`, {
			cognitoDomain: {
				domainPrefix: `auction-${this.stageName.toLowerCase()}`
			}
		});

		this.addEnvFromCfnOutputs("AuctionUserPoolDomain", `${CognitoDomain.domainName}.auth.${Aws.REGION}.amazoncognito.com`);

		this.addEnvFromCfnOutputs("AuctionUserPoolId", this.userPool.userPoolId);
	}
	private createUserPoolClient() {
		const stageDomain = StringParameter.fromStringParameterAttributes(this, "StageDomain", {
			parameterName: this.stageConfig.stageDomainParamName
		}).stringValue;

		const callbackUrls = this.stageName === "DEVELOPMENT" ? ["http://localhost:3000/api/auth/callback/cognito"] : [];
		callbackUrls.push(`https://${stageDomain}/api/auth/callback/cognito`);

		this.userPoolClient = this.userPool.addClient("AuctionUserPoolClient", {
			userPoolClientName: "AuctionCognitoGoogle",
			authFlows: {
				adminUserPassword: true,
				custom: true,
				userPassword: true,
				userSrp: true,
			},
			generateSecret: true,
			// refer to https://next-auth.js.org/providers/cognito
			oAuth: {
				flows: {
					// implicitCodeGrant: true,
					authorizationCodeGrant: true,
				},
				scopes: [
					OAuthScope.EMAIL, OAuthScope.OPENID, OAuthScope.PROFILE
				],
				callbackUrls
			},
			supportedIdentityProviders: [UserPoolClientIdentityProvider.GOOGLE, UserPoolClientIdentityProvider.COGNITO]
		});

		this.userPoolClient.node.addDependency(this.googleIdentityProvider);

		this.addEnvFromCfnOutputs("AuctionUserPoolClientSecret", this.userPoolClient.userPoolClientSecret.toString());
		this.addEnvFromCfnOutputs("AuctionUserPoolClientId", this.userPoolClient.userPoolClientId);
	}

	private createAuthTriggers(props: AuthStackProps) {
		this.userPool.addTrigger(UserPoolOperation.PRE_SIGN_UP, props.userSignUpLambda);
		this.userPool.addTrigger(UserPoolOperation.PRE_AUTHENTICATION, props.userSignInLambda);
	}

	// private createAdminsGroup() {
	// 	new CfnUserPoolGroup(this, "AuctionAdmins", {
	// 		userPoolId: this.userPool.userPoolId,
	// 		groupName: "admins",
	// 		// roleArn: this.adminRole.roleArn // add the admin role to the group
	// 	});
	// }

	// reference: https://aws-cdk.com/cognito-google
	private createGoogleIdentityPool() {
		this.googleIdentityProvider = new UserPoolIdentityProviderGoogle(this, "AuctionGoogleIdentityProvider", {
			userPool: this.userPool,
			// for security reasons, we should read these from ssm parameters
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecretValue: SecretValue.secretsManager("GOOGLE_CLIENT_SECRET"),
			scopes: ["email", "openid", "profile"],
			attributeMapping: {
				email: ProviderAttribute.GOOGLE_EMAIL,
				givenName: ProviderAttribute.GOOGLE_GIVEN_NAME,
				familyName: ProviderAttribute.GOOGLE_FAMILY_NAME,
				nickname: ProviderAttribute.GOOGLE_NAME,
				profilePicture: ProviderAttribute.GOOGLE_PICTURE,
				custom: {
					email_verified: ProviderAttribute.other("email_verified"),
				}
			}
		});
	}

	private createIdentityPool() {
		this.identityPool = new CfnIdentityPool(this, `AuctionIdentityPool${this.suffix}`, {
			allowUnauthenticatedIdentities: true,
			cognitoIdentityProviders: [{ // connected to our user pool
				clientId: this.userPoolClient.userPoolClientId,
				providerName: this.userPool.userPoolProviderName
			}]
		});
		this.addEnvFromCfnOutputs("AuctionIdentityPoolId", this.identityPool.ref);
	}

	private createRoles(photosBucket: IBucket) {
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
		this.authenticatedRole.addToPolicy(new PolicyStatement({
			effect: Effect.ALLOW,
			actions: ["s3:PutObject", "s3:PutObjectAcl"],
			resources: [photosBucket.bucketArn + "/*"]
		}));
	}

	private attachRoles() {
		new CfnIdentityPoolRoleAttachment(this, "IdentityPoolRoleAttachment", {
			identityPoolId: this.identityPool.ref,
			roles: {
				"unauthenticated": this.unAuthenticatedRole.roleArn,
				"authenticated": this.authenticatedRole.roleArn,
			}
			// roleMappings: {
			// 	adminMapping: {
			// 		identityProvider: `${this.userPool.userPoolProviderName}:${this.userPoolClient.userPoolClientId}`,
			// 		type: "Token",
			// 		ambiguousRoleResolution: "AuthenticatedRole",
			// 	}
			// }
		});
	}
}