import { handler } from "@/src/services/auction/getItems";
import { ScanCommand } from "@aws-sdk/client-dynamodb";
import { ApiResponseList } from "auction-shared/api";
import { InternalError, createLambdaResponse } from "@/src/services/auction/utils";
import { marshall } from "@aws-sdk/util-dynamodb";
import mockDBClient from "@/test/mocks/db/utils/mockDBClient";
import { generateFakeItem } from "@/test/mocks/fakeData/bid";

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

		const response = await handler();
		const expectedResponse = createLambdaResponse<ApiResponseList["get-items"]>(200, {
			timestamp: Date.now(),
			data: [mockItem]
		});

		expect(response).toEqual(expectedResponse);
	});

	it.only("should return InternalError when an error occurs", async () => {
		mockDBClient.on(ScanCommand).rejects(new Error("test error"));

		const { body: response } = await handler();
		const error = new InternalError("I001", "test error");
		const { body: expectedResponse } = error.getResponse();

		expect(JSON.parse(response).error).toEqual(JSON.parse(expectedResponse).error);
	});
});