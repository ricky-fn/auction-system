import "aws-sdk-client-mock-jest";
import { handler } from "@/src/services/auction/protected/createItem";
import { ApiRequestParams, ApiResponseList } from "auction-shared/api";
import { AuthorizationFail, BadRequest, InternalError, createLambdaResponse } from "@/src/services/auction/utils";
import { marshall } from "@aws-sdk/util-dynamodb";
import mockDBClient from "@/test/mocks/db/utils/mockDBClient";
import { generateCognitoAuthorizerContext } from "@/test/mocks/fakeData/auth";
import { GetItemCommand, PutItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { generateFakeUser } from "@/test/mocks/fakeData/user";
import { sharedAuthTest } from "./shared/auth";
import { sharedInputTest } from "./shared/input";
import { generateFakeItem } from "@/test/mocks/fakeData/bid";
import { PutCommand } from "@aws-sdk/lib-dynamodb";

describe("Test createItem LambdaFunction", () => {
	beforeEach(() => {
		jest.spyOn(console, "error").mockImplementationOnce(jest.fn());
		mockDBClient.reset();
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	const mockItemRequestParam: ApiRequestParams["create-item"] = {
		name: "test item",
		about: "test about",
		photo: "test photo",
		startingPrice: 100,
		expirationTime: "2h",
	};

	sharedInputTest(handler, () => {

		it("should return a BadRequest when name is not provided", async () => {
			const { body: response, statusCode } = await handler({
				body: JSON.stringify({}),
			} as any);

			const error = new BadRequest("B002", "name is required");
			const { body: expectedResponse } = error.getResponse();

			expect(console.error).toHaveBeenCalledTimes(2);
			expect(console.error).toHaveBeenCalledWith("Bad Request [B002]: name is required");
			expect(JSON.parse(response).error).toEqual(JSON.parse(expectedResponse).error);
			expect(statusCode).toEqual(error.statusCode);
		});

		it("should return a BadRequest when name is not provided", async () => {
			const mockRequestParamsWithoutName = { ...mockItemRequestParam };
			delete mockRequestParamsWithoutName.name;

			const { body: response, statusCode } = await handler({
				body: JSON.stringify(mockRequestParamsWithoutName),
			} as any);

			const error = new BadRequest("B002", "name is required");
			const { body: expectedResponse } = error.getResponse();

			expect(console.error).toHaveBeenCalledTimes(2);
			expect(console.error).toHaveBeenCalledWith("Bad Request [B002]: name is required");
			expect(JSON.parse(response).error).toEqual(JSON.parse(expectedResponse).error);
			expect(statusCode).toEqual(error.statusCode);
		});

		it("should return a BadRequest when startingPrice is not provided", async () => {
			const mockRequestParamsWithoutStartingPrice = { ...mockItemRequestParam };
			delete mockRequestParamsWithoutStartingPrice.startingPrice;

			const { body: response, statusCode } = await handler({
				body: JSON.stringify(mockRequestParamsWithoutStartingPrice),
			} as any);

			const error = new BadRequest("B003", "name is required");
			const { body: expectedResponse } = error.getResponse();

			expect(console.error).toHaveBeenCalledTimes(2);
			expect(console.error).toHaveBeenCalledWith("Bad Request [B003]: name is required");
			expect(JSON.parse(response).error).toEqual(JSON.parse(expectedResponse).error);
			expect(statusCode).toEqual(error.statusCode);
		});

		it("should return a BadRequest when startingPrice is not a number", async () => {
			const mockRequestParamsWithStringTypeStartingPrice = { ...mockItemRequestParam } as Omit<typeof mockItemRequestParam, "startingPrice"> & { startingPrice: string | number };
			mockRequestParamsWithStringTypeStartingPrice.startingPrice = "this is not a number";

			const { body: response, statusCode } = await handler({
				body: JSON.stringify(mockRequestParamsWithStringTypeStartingPrice),
			} as any);

			const error = new BadRequest("B004", "startingPrice must be a number");
			const { body: expectedResponse } = error.getResponse();

			expect(console.error).toHaveBeenCalledTimes(2);
			expect(console.error).toHaveBeenCalledWith("Bad Request [B004]: startingPrice must be a number");
			expect(JSON.parse(response).error).toEqual(JSON.parse(expectedResponse).error);
			expect(statusCode).toEqual(error.statusCode);
		});

		it("should return a BadRequest when startingPrice is smaller than 1", async () => {
			const mockRequestParamsWithNegativeStartingPrice = { ...mockItemRequestParam };
			mockRequestParamsWithNegativeStartingPrice.startingPrice = -20;

			const { body: response, statusCode } = await handler({
				body: JSON.stringify(mockRequestParamsWithNegativeStartingPrice),
			} as any);

			const error = new BadRequest("B005", "startingPrice must be greater than 0");
			const { body: expectedResponse } = error.getResponse();

			expect(console.error).toHaveBeenCalledTimes(2);
			expect(console.error).toHaveBeenCalledWith("Bad Request [B005]: startingPrice must be greater than 0");
			expect(JSON.parse(response).error).toEqual(JSON.parse(expectedResponse).error);
			expect(statusCode).toEqual(error.statusCode);
		});

		it("should return a BadRequest when expirationTime is not provided", async () => {
			const mockRequestParamsWithoutExpirationTime = { ...mockItemRequestParam };
			delete mockRequestParamsWithoutExpirationTime.expirationTime;

			const { body: response, statusCode } = await handler({
				body: JSON.stringify(mockRequestParamsWithoutExpirationTime),
			} as any);

			const error = new BadRequest("B006", "expirationTime is required");
			const { body: expectedResponse } = error.getResponse();

			expect(console.error).toHaveBeenCalledTimes(2);
			expect(console.error).toHaveBeenCalledWith("Bad Request [B006]: expirationTime is required");
			expect(JSON.parse(response).error).toEqual(JSON.parse(expectedResponse).error);
			expect(statusCode).toEqual(error.statusCode);
		});



		it("should return a BadRequest when expirationTime format is invalid", async () => {
			const mockRequestParamsWithStringTypeExpirationTime = { ...mockItemRequestParam };
			mockRequestParamsWithStringTypeExpirationTime.expirationTime = "this is not a valid format";

			const { body: response, statusCode } = await handler({
				body: JSON.stringify(mockRequestParamsWithStringTypeExpirationTime),
			} as any);

			const error = new BadRequest("B007", "expirationTime must be in the format of {number}h");
			const { body: expectedResponse } = error.getResponse();

			expect(console.error).toHaveBeenCalledTimes(2);
			expect(console.error).toHaveBeenCalledWith("Bad Request [B007]: expirationTime must be in the format of {number}h");
			expect(JSON.parse(response).error).toEqual(JSON.parse(expectedResponse).error);
			expect(statusCode).toEqual(error.statusCode);
		});
	});

	sharedAuthTest<ApiRequestParams["create-item"]>(handler, mockItemRequestParam, "POST");

	describe("Test the item creation process", () => {
		it("should return a InternalError when the item creation fails", async () => {
			const fakeUser = generateFakeUser();

			mockDBClient
				.on(GetItemCommand)
				.resolves({ Item: marshall(fakeUser) })
				.on(PutItemCommand)
				.rejects(new Error("Test"));

			const { body: response, statusCode } = await handler({
				...generateCognitoAuthorizerContext(fakeUser.id),
				body: JSON.stringify(mockItemRequestParam),
			} as any);

			const error = new InternalError("I001", "Test");
			const { body: expectedResponse } = error.getResponse();

			expect(console.error).toHaveBeenCalledTimes(2);
			expect(console.error).toHaveBeenCalledWith("Internal Server Error [I001]: Test");
			expect(JSON.parse(response).error).toEqual(JSON.parse(expectedResponse).error);
			expect(statusCode).toEqual(error.statusCode);
		});

		it("should create a new item", async () => {
			const fakeUser = generateFakeUser();

			mockDBClient
				.on(GetItemCommand)
				.resolves({ Item: marshall(fakeUser) })
				.on(PutItemCommand)
				.resolves({});

			const { body: rawResponseData, ...result } = await handler({
				...generateCognitoAuthorizerContext(fakeUser.id),
				body: JSON.stringify(mockItemRequestParam),
			} as any);

			const expectedItem = generateFakeItem({
				...mockItemRequestParam,
				itemId: expect.any(String),
				createdBy: fakeUser.id,
				createdAt: expect.any(Number),
				status: "ongoing"
			});
			const expectedResponseData = {
				timestamp: expect.any(Number),
				data: expectedItem
			};

			const responseData = JSON.parse(rawResponseData);

			expect(result.statusCode).toEqual(200);

			expect(responseData).toEqual(expectedResponseData);

			expect(mockDBClient).toHaveReceivedCommand(PutItemCommand);
		});
	});
});
