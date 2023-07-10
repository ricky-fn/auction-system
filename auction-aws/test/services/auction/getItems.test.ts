import { handler } from "@/src/services/auction/getItems";
import { ScanCommand } from "@aws-sdk/client-dynamodb";
import { ApiResponseList } from "auction-shared/api";
import { InternalError, createLambdaResponse } from "@/src/services/auction/utils";
import { marshall } from "@aws-sdk/util-dynamodb";
import mockDBClient from "@/test/lib/db/mockDBClient";
import { generateFakeItem } from "auction-shared/mocks/fakeData/bid";

// Mock the DynamoDB client
describe("Test getItems LambdaFunction", () => {
	beforeEach(() => {
		mockDBClient.reset();
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

	it("should return InternalError when an error occurs", async () => {
		mockDBClient.on(ScanCommand).rejects(new Error("test error"));

		const { body: response } = await handler();
		const error = new InternalError("I001", "test error");
		const { body: expectedResponse } = error.getResponse();

		expect(JSON.parse(response).error).toEqual(JSON.parse(expectedResponse).error);
	});
});