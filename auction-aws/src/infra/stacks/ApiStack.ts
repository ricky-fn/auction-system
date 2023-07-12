import { IAppStackProps } from "../../types";
import { CfnOutput, Stack } from "aws-cdk-lib";
import { AuthorizationType, CognitoUserPoolsAuthorizer, Cors, LambdaIntegration, MethodOptions, ResourceOptions, RestApi } from "aws-cdk-lib/aws-apigateway";
import { IUserPool } from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";
import { capitalizeFirstLetter } from "../Utils";
import { StringParameter } from "aws-cdk-lib/aws-ssm";

interface ApiStackProps extends IAppStackProps {
	getItemsLambdaIntegration: LambdaIntegration,
	getUserLambdaIntegration: LambdaIntegration,
	createItemLambdaIntegration: LambdaIntegration,
	depositLambdaIntegration: LambdaIntegration,
	bidItemLambdaIntegration: LambdaIntegration,
	getTotalBidAmountLambdaIntegration: LambdaIntegration,
	userPool: IUserPool;
}

export class ApiStack extends Stack {

	constructor(scope: Construct, id: string, props: ApiStackProps) {
		super(scope, id, props);

		const api = new RestApi(this, "AuctionApi");

		const authorizer = new CognitoUserPoolsAuthorizer(this, "AuctionApiAuthorizer", {
			cognitoUserPools: [props.userPool],
			identitySource: "method.request.header.Authorization",
			authorizerName: `AuctionApiAuthorizer${capitalizeFirstLetter(props.stageConfig.stageName)}`
		});
		authorizer._attachToApi(api);

		const optionsWithAuth: MethodOptions = {
			authorizationType: AuthorizationType.COGNITO,
			authorizer: {
				authorizerId: authorizer.authorizerId
			}
		};

		const stageDomain = StringParameter.fromStringParameterAttributes(this, "StageDomain", {
			parameterName: props.stageConfig.stageDomainParamName
		}).stringValue;

		const origins = props.stageConfig.stageName === "dev" ? ["http://localhost:3000/"] : [];
		origins.push(`https://${stageDomain}/`);

		const optionsWithCors: ResourceOptions = { // define cors for all methods and origins
			defaultCorsPreflightOptions: {
				allowOrigins: origins,
				allowMethods: Cors.ALL_METHODS
			}
		};

		const getItemsResource = api.root.addResource("get-items", optionsWithCors); // attach cors to apigateway root
		getItemsResource.addMethod("GET", props.getItemsLambdaIntegration);

		const getUserResource = api.root.addResource("get-user", optionsWithCors); // attach cors to apigateway root
		getUserResource.addMethod("GET", props.getUserLambdaIntegration, optionsWithAuth);

		const createItemApiResource = api.root.addResource("create-item", optionsWithCors); // attach cors to apigateway root
		createItemApiResource.addMethod("POST", props.createItemLambdaIntegration, optionsWithAuth);

		const depositApiResource = api.root.addResource("deposit", optionsWithCors); // attach cors to apigateway root
		depositApiResource.addMethod("POST", props.depositLambdaIntegration, optionsWithAuth);

		const bidItemApiResource = api.root.addResource("bid-item", optionsWithCors); // attach cors to apigateway root
		bidItemApiResource.addMethod("POST", props.bidItemLambdaIntegration, optionsWithAuth);

		const getTotalBidAmountApiResource = api.root.addResource("get-total-bid-amount", optionsWithCors); // attach cors to apigateway root
		getTotalBidAmountApiResource.addMethod("GET", props.getTotalBidAmountLambdaIntegration, optionsWithAuth);

		new CfnOutput(this, "AuctionApiUrl", {
			value: api.url
		});
	}
}