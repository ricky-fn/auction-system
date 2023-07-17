import { handler } from "@/src/services/auction/getItemById";
import { BadRequest, InternalError } from "@/src/services/auction/utils";
import mockDBClient from "@/test/lib/db/mockDBClient";
import { GetItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { ApiRequestParams, ApiResponseList } from "auction-shared/api";
import { generateFakeItem } from "auction-shared/mocks/fakeData/bid";

const DB_ITEMS_TABLE = process.env.DB_ITEMS_TABLE as string;

// Mock the DynamoDB client
describe("Test getItemById LambdaFunction", () => {
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

	it("should return a BadRequest when queryStringParameters is not provided", async () => {
		const { body: response, statusCode } = await handler({} as any);

		const error = new BadRequest("B001", "Input parameter is required");
		const { body: expectedResponse } = error.getResponse();

		expect(console.error).toHaveBeenCalledWith("Bad Request [B001]: Input parameter is required");
		expect(JSON.parse(response).error).toEqual(JSON.parse(expectedResponse).error);
		expect(statusCode).toEqual(error.statusCode);
	});

	it("should send a query to DynamoDB and return the item", async () => {
		const queryStringParameters: ApiRequestParams["get-total-bid-amount"] = {
			itemId: "fakeItemId"
		};

		await handler({
			queryStringParameters
		} as any);

		expect(mockDBClient).toHaveReceivedCommandWith(GetItemCommand, {
			TableName: DB_ITEMS_TABLE,
			Key: {
				"itemId": {
					S: queryStringParameters.itemId
				}
			}
		});
	});

	it("should return InternalError if DynamoDB querying fail", async () => {
		const queryStringParameters: ApiRequestParams["get-total-bid-amount"] = {
			itemId: "fakeItemId"
		};
		const errorMessage = "Test";

		mockDBClient
			.on(GetItemCommand)
			.rejects(new Error(errorMessage));

		const { body: response, statusCode } = await handler({
			queryStringParameters
		} as any);

		const error = new InternalError("I001", "Test");
		const { body: expectedResponse } = error.getResponse();

		expect(console.error).toHaveBeenCalledWith("Internal Server Error [I001]: Test");
		expect(JSON.parse(response).error).toEqual(JSON.parse(expectedResponse).error);
		expect(statusCode).toEqual(error.statusCode);
	});

	it("should return the item if it exists", async () => {
		const fakeItem = generateFakeItem();
		const queryStringParameters: ApiRequestParams["get-total-bid-amount"] = {
			itemId: fakeItem.itemId
		};

		mockDBClient
			.on(GetItemCommand)
			.resolves({
				Item: marshall(fakeItem)
			});

		const { body: rawResponseData, ...result } = await handler({
			queryStringParameters
		} as any);

		const expectedResponseData = <ApiResponseList["get-item-by-id"]>{
			timestamp: expect.any(Number),
			data: fakeItem
		};

		const responseData = JSON.parse(rawResponseData);

		expect(result.statusCode).toEqual(200);

		expect(responseData).toEqual(expectedResponseData);
	});
});