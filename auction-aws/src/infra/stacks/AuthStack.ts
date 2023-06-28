import { Aws, CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { CfnUserPoolGroup, OAuthScope, ProviderAttribute, UserPool, UserPoolClient, UserPoolClientIdentityProvider, UserPoolIdentityProviderGoogle, UserPoolOperation } from "aws-cdk-lib/aws-cognito";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

interface AuthStackProps extends StackProps {
	userSignUpLambda: NodejsFunction;
	userSignInLambda: NodejsFunction;
}

export class AuthStack extends Stack {

	public userPool: UserPool;
	private userPoolClient: UserPoolClient;

	constructor(scope: Construct, id: string, props: AuthStackProps) {
		super(scope, id, props);

		this.createUserPool();
		this.createGoogleIdentityPool();
		this.createUserPoolClient();
		this.createAuthTriggers(props);

		new CfnOutput(this, "AuctionAuthRegion", {
			value: Aws.REGION
		});
	}

	private createUserPool() {
		this.userPool = new UserPool(this, "AuctionUserPool", {
			selfSignUpEnabled: true,
			signInAliases: {
				username: true,
			}
		});

		const CognitoDomain = this.userPool.addDomain("AuctionUserPoolDomain", {
			cognitoDomain: {
				domainPrefix: "auction"
			}
		});

		new CfnOutput(this, "AuctionUserPoolDomain", {
			value: `${CognitoDomain.domainName}.auth.${Aws.REGION}.amazoncognito.com`
		});

		new CfnOutput(this, "AuctionUserPoolId", {
			value: this.userPool.userPoolId
		});
	}
	private createUserPoolClient() {
		this.userPoolClient = this.userPool.addClient("AuctionUserPoolClient", {
			userPoolClientName: "AuctionCognitoGoogle",
			authFlows: {
				adminUserPassword: true,
				custom: true,
				userPassword: true,
				userSrp: true,
			},
			// generateSecret: true, // ! turn it on for production
			// refer to https://next-auth.js.org/providers/cognito
			oAuth: {
				flows: {
					// implicitCodeGrant: true,
					authorizationCodeGrant: true,
				},
				scopes: [
					OAuthScope.EMAIL, OAuthScope.OPENID, OAuthScope.PROFILE
				],
				callbackUrls: ["http://localhost:3000/api/auth/callback/cognito"], // ! read from env file
			},
			supportedIdentityProviders: [UserPoolClientIdentityProvider.GOOGLE, UserPoolClientIdentityProvider.COGNITO]
		});
		// new CfnOutput(this, "AuctionUserPoolClientSecret", {
		// 	value: this.userPoolClient.userPoolClientSecret.toString()
		// });
		new CfnOutput(this, "AuctionUserPoolClientId", {
			value: this.userPoolClient.userPoolClientId
		});
	}

	private createAuthTriggers(props: AuthStackProps) {
		this.userPool.addTrigger(UserPoolOperation.PRE_SIGN_UP, props.userSignUpLambda);
		this.userPool.addTrigger(UserPoolOperation.PRE_AUTHENTICATION, props.userSignInLambda);
	}

	private createAdminsGroup() {
		new CfnUserPoolGroup(this, "AuctionAdmins", {
			userPoolId: this.userPool.userPoolId,
			groupName: "admins",
			// roleArn: this.adminRole.roleArn // add the admin role to the group
		});
	}

	// reference: https://aws-cdk.com/cognito-google
	private createGoogleIdentityPool() {
		new UserPoolIdentityProviderGoogle(this, "AuctionGoogleIdentityProvider", {
			userPool: this.userPool,
			clientId: "800113811294-etpqqag073u3jh9komps2oc2k4nr5te2.apps.googleusercontent.com", // ! read from env file
			clientSecret: "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", // ! read from env file
			scopes: ["email", "openid", "profile"],
			attributeMapping: {
				email: ProviderAttribute.GOOGLE_EMAIL,
				givenName: ProviderAttribute.GOOGLE_GIVEN_NAME,
				familyName: ProviderAttribute.GOOGLE_FAMILY_NAME,
				nickname: ProviderAttribute.GOOGLE_NAME,
				custom: {
					email_verified: ProviderAttribute.other("email_verified"),
				}
			}
		});
	}
}