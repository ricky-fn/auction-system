import { APIGatewayProxyEvent } from "aws-lambda/trigger/api-gateway-proxy";
import { handler } from "@/src/services/auction/protected/getUser";

async function testGetUserLambdaWithAPIRequest() {
	const result = await handler({
		requestContext: {
			authorizer: {
				claims: {
					"cognito:username": "ricky"
				}
			}
		}
	} as any);

	console.log(result);
}

testGetUserLambdaWithAPIRequest();