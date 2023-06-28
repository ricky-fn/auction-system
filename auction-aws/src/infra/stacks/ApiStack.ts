import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { AuthorizationType, CognitoUserPoolsAuthorizer, Cors, LambdaIntegration, MethodOptions, ResourceOptions, RestApi } from "aws-cdk-lib/aws-apigateway";
import { IUserPool } from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

interface ApiStackProps extends StackProps {
	getItemsLambdaIntegration: LambdaIntegration,
	getUserLambdaIntegration: LambdaIntegration,
	userPool: IUserPool;
}

export class ApiStack extends Stack {

	constructor(scope: Construct, id: string, props: ApiStackProps) {
		super(scope, id, props);

		const api = new RestApi(this, "AuctionApi");

		const authorizer = new CognitoUserPoolsAuthorizer(this, "AuctionApiAuthorizer", {
			cognitoUserPools: [props.userPool],
			identitySource: "method.request.header.Authorization"
		});
		authorizer._attachToApi(api);

		const optionsWithAuth: MethodOptions = {
			authorizationType: AuthorizationType.COGNITO,
			authorizer: {
				authorizerId: authorizer.authorizerId
			}
		};

		const optionsWithCors: ResourceOptions = { // define cors for all methods and origins
			defaultCorsPreflightOptions: {
				allowOrigins: Cors.ALL_ORIGINS, // ! do not use this in production
				allowMethods: Cors.ALL_METHODS // ! do not use this in production
			}
		};

		const getItemsResource = api.root.addResource("get-items", optionsWithCors); // attach cors to apigateway root
		getItemsResource.addMethod("GET", props.getItemsLambdaIntegration);

		const getUserResource = api.root.addResource("get-user", optionsWithCors); // attach cors to apigateway root
		getUserResource.addMethod("GET", props.getUserLambdaIntegration, optionsWithAuth);

		new CfnOutput(this, "AuctionApiUrl", {
			value: api.url
		});
	}
}