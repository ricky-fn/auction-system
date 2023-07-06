import "aws-sdk-client-mock-jest";
import { handler } from "@/src/services/auction/protected/getUser";
import { GetItemCommand } from "@aws-sdk/client-dynamodb";
import { User } from "auction-shared/models";
import { ApiResponseList } from "auction-shared/api";
import { AuthorizationFail, createLambdaResponse } from "@/src/services/auction/utils";
import { marshall } from "@aws-sdk/util-dynamodb";
import mockDBClient from "@/test/mocks/db/utils/mockDBClient";
import { generateCognitoAuthorizerContext, generateCognitoAuthorizerWithoutUserName } from "@/test/mocks/fakeData/auth";

// Mock the DynamoDB client

describe("Test getUser LambdaFunction", () => {
	beforeEach(() => {
		mockDBClient.reset();
	});

	it("should return the user when a valid userId is provided", async () => {
		const userId = "testUserId";
		const mockUser: User = {
			id: userId,
			password: "password",
			email: "test@example.com",
			balance: 100,
			create_at: 1626432420000,
			given_name: "John",
			family_name: "Doe",
			picture: "https://example.com/avatar.jpg",
		};

		mockDBClient
			.on(GetItemCommand)
			.resolves({
				Item: marshall(mockUser)
			});

		const result = await handler(generateCognitoAuthorizerContext(userId) as any);

		const expectedResponse = createLambdaResponse<ApiResponseList["get-user"]>(200, {
			timestamp: Date.now(),
			data: mockUser
		});

		expect(result).toEqual(expectedResponse);
		expect(mockDBClient).toHaveReceivedCommandWith(GetItemCommand, {
			TableName: undefined,
			Key: { id: { S: userId } },
		});
	});

	it("should return AuthorizationFail when no userId is provided", async () => {
		const { body: response } = await handler(generateCognitoAuthorizerWithoutUserName() as any);

		const error = new AuthorizationFail("A001", "username is required");
		const { body: expectedResponse } = error.getResponse();

		expect(JSON.parse(response).error).toEqual(JSON.parse(expectedResponse).error);
	});
});
