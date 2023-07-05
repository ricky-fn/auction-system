import { handler, BidItemInputParameters } from "@/src/services/auction/protected/bidItem";

async function testGetUserLambdaWithAPIRequest() {
	const params: BidItemInputParameters = {
		itemId: "item-1688376211848-8681",
		bidAmount: 500
	};

	const result = await handler({
		requestContext: {
			authorizer: {
				claims: {
					"cognito:username": "Google_108126319111382245486"
				}
			}
		},
		body: JSON.stringify(params)
	} as any);

	console.log(result);
}

testGetUserLambdaWithAPIRequest();