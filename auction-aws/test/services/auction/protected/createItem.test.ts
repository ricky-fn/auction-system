import { handler, createItemInputParameters } from "@/src/services/auction/protected/createItem";

async function testGetUserLambdaWithAPIRequest() {
	const params: createItemInputParameters = {
		expirationTime: "2h",
		name: "first item",
		startingPrice: 100,
		about: "hello first item",
		photo: "123"
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