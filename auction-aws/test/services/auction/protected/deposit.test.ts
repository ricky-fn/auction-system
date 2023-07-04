import { handler, DepositInputParameters } from "@/src/services/auction/protected/deposit";

async function testDepositLambdaWithAPIRequest() {
	const params: DepositInputParameters = {
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