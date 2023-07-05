import { handler } from "@/src/services/auction/protected/bidItem";
import { ApiRequestParams } from "auction-shared/api";

async function testGetUserLambdaWithAPIRequest() {
	const params: ApiRequestParams["bid-item"] = {
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