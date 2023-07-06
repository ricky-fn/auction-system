import { handler } from "@/src/services/auction/protected/getUser";
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { User } from "auction-shared/models";
import { ApiResponseList } from "auction-shared/api";
import { AuthorizationFail, createLambdaResponse } from "@/src/services/auction/utils";
import { marshall } from "@aws-sdk/util-dynamodb";

// Mock the DynamoDB client
const ddbMock = mockClient(DynamoDBClient);

describe("Test getUser LambdaFunction", () => {
	beforeEach(() => {
		ddbMock.reset();
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

		ddbMock
			.on(GetItemCommand, {
				TableName: undefined,
				Key: { id: { S: userId } },
			})
			.resolves({
				Item: marshall(mockUser)
			});

		const result = await handler({
			requestContext: {
				authorizer: {
					claims: {
						"cognito:username": userId
					}
				}
			}
		} as any);

		const expectedResponse = createLambdaResponse<ApiResponseList["get-user"]>(200, {
			timestamp: Date.now(),
			data: mockUser
		});

		expect(result).toEqual(expectedResponse);
	});

	it("should return AuthorizationFail when no userId is provided", async () => {
		const { body: response } = await handler({
			requestContext: {
				authorizer: {
					claims: {}
				}
			}
		} as any);

		const error = new AuthorizationFail("A001", "username is required");
		const { body: expectedResponse } = error.getResponse();

		expect(JSON.parse(response).error).toEqual(JSON.parse(expectedResponse).error);
		expect(error.errorMessage).toEqual("username is required");
	});
});
