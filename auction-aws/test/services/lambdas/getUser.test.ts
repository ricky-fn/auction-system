import { handler } from "@/src/services/auction/protected/getUser";
import { mockClient } from "aws-sdk-client-mock";
import { AttributeValue, DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { User } from "auction-shared/models";
import { ApiResponseList } from "auction-shared/api";
import { AuthorizationFail, createLambdaResponse } from "@/src/services/auction/utils";

type MarshallType<T> = {
	[K in keyof T]: AttributeValue;
};

type MarshallUser = MarshallType<User>;

// Mock the DynamoDB client
const ddbMock = mockClient(DynamoDBClient);

describe("getUserByUsername", () => {
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
				Item: {
					id: { S: userId },
					password: { S: mockUser.password },
					email: { S: mockUser.email },
					balance: { N: String(mockUser.balance) },
					create_at: { N: String(mockUser.create_at) },
					given_name: { S: mockUser.given_name },
					family_name: { S: mockUser.family_name },
					picture: { S: mockUser.picture },
				} as MarshallUser
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
		const result = await handler({
			requestContext: {
				authorizer: {
					claims: {}
				}
			}
		} as any);

		expect(result.body).toContain("A001 Authorization Failed");
	});
});
