import { AuthorizationFail, InternalError } from "@/src/services/auction/utils";
import mockDBClient from "@/test/mocks/db/utils/mockDBClient";
import { generateCognitoAuthorizerContext, generateCognitoAuthorizerWithoutUserName } from "@/test/mocks/fakeData/auth";
import { GetItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";

type LambdaHandler = (
	event: APIGatewayProxyEvent,
	context?: Context
) => Promise<APIGatewayProxyResult>;

export const sharedAuthTest = (handler: LambdaHandler) => {
	describe("Test the authorization process", () => {
		it("should return AuthorizationFail when no userId is provided", async () => {
			const { body: response } = await handler(generateCognitoAuthorizerWithoutUserName() as any);

			const error = new AuthorizationFail("A001", "username is required");
			const { body: expectedResponse } = error.getResponse();

			expect(console.error).toHaveBeenCalledTimes(2);
			expect(console.error).toHaveBeenCalledWith("Authorization Failure [A001]: username is required");
			expect(JSON.parse(response).error).toEqual(JSON.parse(expectedResponse).error);
		});

		it("should return InternalError when an error occurs", async () => {
			const userId = "test";
			mockDBClient
				.on(GetItemCommand)
				.rejects(new Error("Test"));

			const { body: response } = await handler({
				...generateCognitoAuthorizerContext(userId),
				body: JSON.stringify({ amount: 100 }),
			} as any);

			const error = new InternalError("I001", "An error occurred");
			const { body: expectedResponse } = error.getResponse();

			expect(console.error).toHaveBeenCalledTimes(2);
			expect(console.error).toHaveBeenCalledWith("Internal Server Error [I001]: Test");
			expect(JSON.parse(response).error).toEqual(JSON.parse(expectedResponse).error);
		});

		it("should return AuthorizationFail when no user is found", async () => {
			const userId = "test";
			mockDBClient
				.on(GetItemCommand, {
					TableName: undefined,
					Key: { id: { S: userId } },
				})
				.resolves({ Item: undefined });

			const { body: response } = await handler(generateCognitoAuthorizerContext(userId) as any);

			const error = new AuthorizationFail("A002", "User not found");
			const { body: expectedResponse } = error.getResponse();

			expect(console.error).toHaveBeenCalledTimes(2);
			expect(console.error).toHaveBeenCalledWith("Authorization Failure [A002]: User not found");
			expect(JSON.parse(response).error).toEqual(JSON.parse(expectedResponse).error);
		});
	});
};