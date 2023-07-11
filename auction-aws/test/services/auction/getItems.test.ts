import { handler } from "@/src/services/auction/getItems";
import { ScanCommand } from "@aws-sdk/client-dynamodb";
import { ApiResponseList } from "auction-shared/api";
import { InternalError } from "@/src/services/auction/utils";
import { marshall } from "@aws-sdk/util-dynamodb";
import mockDBClient from "@/test/lib/db/mockDBClient";
import { generateFakeItem } from "auction-shared/mocks/fakeData/bid";

// Mock the DynamoDB client
describe("Test getItems LambdaFunction", () => {
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

	const mockItem = generateFakeItem();

	it("should return a list of items", async () => {
		// Mock the DynamoDB client
		mockDBClient.on(ScanCommand).resolves({
			Items: [
				marshall(mockItem)
			]
		});

		const { body: rawResponseData, ...result } = await handler();
		const expectedResponseData = <ApiResponseList["get-items"]>{
			timestamp: expect.any(Number),
			data: [mockItem]
		};

		const responseData = JSON.parse(rawResponseData);

		expect(result.statusCode).toEqual(200);

		expect(responseData).toEqual(expectedResponseData);
	});

	it.only("should return InternalError when an error occurs", async () => {
		mockDBClient.on(ScanCommand).rejects(new Error("test error"));

		const { body: response } = await handler();
		const error = new InternalError("I001", "test error");
		const { body: expectedResponse } = error.getResponse();

		expect(console.error).toBeCalledWith("Internal Server Error [I001]: test error");
		expect(JSON.parse(response).error).toEqual(JSON.parse(expectedResponse).error);
	});
});