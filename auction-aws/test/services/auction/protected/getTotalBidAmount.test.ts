import { handler } from "@/src/services/auction/protected/getTotalBidAmount";
import { ApiRequestParams } from "auction-shared/api";

async function testGetUserLambdaWithAPIRequest() {
	const params: ApiRequestParams["get-total-bid-amount"] = {
		itemId: "item-1688376211848-8681"
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