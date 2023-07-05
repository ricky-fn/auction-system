import { handler } from "@/src/services/auction/protected/deposit";
import { ApiRequestParams } from "auction-shared/api";

async function testDepositLambdaWithAPIRequest() {
	const params: ApiRequestParams["deposit"] = {
		amount: 100
	};

	const result = await handler({
		requestContext: {
			authorizer: {
				claims: {
					"cognito:username": "ricky"
				}
			}
		},
		body: JSON.stringify(params)
	} as any);

	console.log(result);
}

testDepositLambdaWithAPIRequest();