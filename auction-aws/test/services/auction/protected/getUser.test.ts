import "aws-sdk-client-mock-jest";
import { handler } from "@/src/services/auction/protected/getUser";
import { GetItemCommand } from "@aws-sdk/client-dynamodb";
import { User } from "auction-shared/models";
import { ApiResponseList } from "auction-shared/api";
import { createLambdaResponse } from "@/src/services/auction/utils";
import { marshall } from "@aws-sdk/util-dynamodb";
import mockDBClient from "@/test/mocks/db/utils/mockDBClient";
import { generateCognitoAuthorizerContext } from "@/test/mocks/fakeData/auth";
import { sharedAuthTest } from "./shared/auth";
import { generateFakeUser } from "@/test/mocks/fakeData/user";

const DB_USERS_TABLE = process.env.DB_USERS_TABLE as string;

describe("Test getUser LambdaFunction", () => {
	beforeEach(() => {
		mockDBClient.reset();
	});

	sharedAuthTest(handler);

	it("should return the user when a valid userId is provided", async () => {
		const mockUser: User = generateFakeUser();

		mockDBClient
			.on(GetItemCommand)
			.resolves({
				Item: marshall(mockUser)
			});

		const result = await handler(generateCognitoAuthorizerContext(mockUser.id) as any);

		const expectedResponse = createLambdaResponse<ApiResponseList["get-user"]>(200, {
			timestamp: Date.now(),
			data: mockUser
		});

		expect(result).toEqual(expectedResponse);
		expect(mockDBClient).toHaveReceivedCommandWith(GetItemCommand, {
			TableName: DB_USERS_TABLE,
			Key: { id: { S: mockUser.id } },
		});
	});
});
