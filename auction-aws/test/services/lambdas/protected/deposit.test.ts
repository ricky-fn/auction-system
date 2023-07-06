import "aws-sdk-client-mock-jest";
import { handler } from "@/src/services/auction/protected/deposit";
import { ApiRequestParams, ApiResponseList } from "auction-shared/api";
import { AuthorizationFail, BadRequest, InternalError, createLambdaResponse } from "@/src/services/auction/utils";
import { marshall } from "@aws-sdk/util-dynamodb";
import mockDBClient from "@/test/mocks/db/utils/mockDBClient";
import { generateCognitoAuthorizerContext } from "@/test/mocks/fakeData/auth";
import { GetItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { generateFakeUser } from "@/test/mocks/fakeData/user";
import { sharedAuthTest } from "./shared/auth";
import { sharedInputTest } from "./shared/input";

describe("Test deposit LambdaFunction", () => {
	beforeEach(() => {
		jest.spyOn(console, "error").mockImplementationOnce(jest.fn());
		mockDBClient.reset();
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	sharedInputTest(handler, () => {
		it("should return a BadRequest when no amount is provided", async () => {
			const { body: response, statusCode } = await handler({
				body: JSON.stringify({}),
			} as any);

			const error = new BadRequest("B002", "amount is required");
			const { body: expectedResponse } = error.getResponse();

			expect(console.error).toHaveBeenCalledTimes(2);
			expect(console.error).toHaveBeenCalledWith("Bad Request [B002]: amount is required");
			expect(JSON.parse(response).error).toEqual(JSON.parse(expectedResponse).error);
			expect(statusCode).toEqual(error.statusCode);
		});

		it("should return a BadRequest when amount is not a number", async () => {
			const { body: response, statusCode } = await handler({
				body: JSON.stringify({ amount: "abc" }),
			} as any);

			const error = new BadRequest("B003", "amount must be a number");
			const { body: expectedResponse } = error.getResponse();

			expect(console.error).toHaveBeenCalledTimes(2);
			expect(console.error).toHaveBeenCalledWith("Bad Request [B003]: amount must be a number");
			expect(JSON.parse(response).error).toEqual(JSON.parse(expectedResponse).error);
			expect(statusCode).toEqual(error.statusCode);
		});

		it("should return a BadRequest when amount is less or equal to 0", async () => {
			const { body: response, statusCode } = await handler({
				body: JSON.stringify({ amount: 0 }),
			} as any);

			const error = new BadRequest("B004", "amount must be greater than 0");
			const { body: expectedResponse } = error.getResponse();

			expect(console.error).toHaveBeenCalledTimes(2);
			expect(console.error).toHaveBeenCalledWith("Bad Request [B004]: amount must be greater than 0");
			expect(JSON.parse(response).error).toEqual(JSON.parse(expectedResponse).error);
			expect(statusCode).toEqual(error.statusCode);
		});
	});

	sharedAuthTest<ApiRequestParams["deposit"]>(handler, {
		amount: 100,
	}, "POST");

	describe("Test the deposit process", () => {
		it("should return InternalError when an error occurs", async () => {
			const fakeUser = generateFakeUser();

			// const newBalance = fakeUser.balance + amount;
			mockDBClient
				.on(GetItemCommand)
				.resolves({ Item: marshall(fakeUser) })
				.on(UpdateItemCommand)
				.rejects(new Error("Test"));

			const { body: response } = await handler(generateCognitoAuthorizerContext(fakeUser.id) as any);

			const error = new InternalError("I002", "Test");
			const { body: expectedResponse } = error.getResponse();

			expect(console.error).toHaveBeenCalledTimes(2);
			expect(console.error).toHaveBeenCalledWith("Internal Server Error [I002]: Test");
			expect(JSON.parse(response).error).toEqual(JSON.parse(expectedResponse).error);
		});

		it("should perform the database update", async () => {
			const fakeUser = generateFakeUser();
			const amount = 100;
			const newBalance = fakeUser.balance + amount;

			mockDBClient
				.on(GetItemCommand, {
					TableName: undefined,
					Key: { id: { S: fakeUser.id } },
				})
				.resolves({ Item: marshall(fakeUser) });

			const result = await handler({
				...generateCognitoAuthorizerContext(fakeUser.id),
				body: JSON.stringify({ amount }),
			} as any);

			const expectedResponse = createLambdaResponse<ApiResponseList["deposit"]>(200, {
				timestamp: Date.now(),
			});

			expect(result).toEqual(expectedResponse);

			expect(mockDBClient).toHaveReceivedCommandWith(UpdateItemCommand, {
				TableName: undefined,
				Key: { id: { S: fakeUser.id } },
				UpdateExpression: "SET #balance = :newBalance",
				ExpressionAttributeNames: { "#balance": "balance" },
				ExpressionAttributeValues: { ":newBalance": { N: newBalance.toString() } },
			});
		});
	});
});
