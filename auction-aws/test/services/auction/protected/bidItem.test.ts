import { handler, BidItemInputParameters } from "@/src/services/auction/protected/bidItem";

async function testGetUserLambdaWithAPIRequest() {
	const params: BidItemInputParameters = {
		itemId: "item-1688376211848-8681",
		bidAmount: 200
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

testGetUserLambdaWithAPIRequest();