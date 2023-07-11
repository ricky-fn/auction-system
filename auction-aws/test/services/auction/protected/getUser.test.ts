import "aws-sdk-client-mock-jest";
import { handler } from "@/src/services/auction/protected/getUser";
import { GetItemCommand } from "@aws-sdk/client-dynamodb";
import { User } from "auction-shared/models";
import { ApiResponseList } from "auction-shared/api";
import { createLambdaResponse } from "@/src/services/auction/utils";
import { marshall } from "@aws-sdk/util-dynamodb";
import mockDBClient from "@/test/lib/db/mockDBClient";
import { generateCognitoAuthorizerContext } from "auction-shared/mocks/fakeData/auth";
import { sharedAuthTest } from "./shared/auth";
import { generateFakeUser } from "auction-shared/mocks/fakeData/user";

const DB_USERS_TABLE = process.env.DB_USERS_TABLE as string;

describe("Test getUser LambdaFunction", () => {
	beforeEach(() => {
		mockDBClient.reset();
		jest.spyOn(console, "error");
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore jest.spyOn adds this functionality
		console.error.mockImplementation(() => null);
	});

	afterEach(() => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore jest.spyOn adds this functionality
		console.error.mockRestore();
	});

	sharedAuthTest(handler);

	it("should return the user when a valid userId is provided", async () => {
		const mockUser: User = generateFakeUser();

		mockDBClient
			.on(GetItemCommand)
			.resolves({
				Item: marshall(mockUser)
			});

		const { body: rawResponseData, ...result } = await handler(generateCognitoAuthorizerContext(mockUser.id) as any);

		const expectedResponseData = <ApiResponseList["get-user"]>{
			timestamp: expect.any(Number),
			data: mockUser
		};

		const responseData = JSON.parse(rawResponseData);

		expect(result.statusCode).toEqual(200);

		expect(responseData).toEqual(expectedResponseData);

		expect(mockDBClient).toHaveReceivedCommandWith(GetItemCommand, {
			TableName: DB_USERS_TABLE,
			Key: { id: { S: mockUser.id } },
		});
	});
});
