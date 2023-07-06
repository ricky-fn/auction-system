import { handler } from "@/src/services/auction/getItems";
import { ScanCommand } from "@aws-sdk/client-dynamodb";
import { ApiResponseList } from "auction-shared/api";
import { InternalError, createLambdaResponse } from "@/src/services/auction/utils";
import { MarshallType } from "@/test/types";
import { Item } from "auction-shared/models";
import { marshall } from "@aws-sdk/util-dynamodb";
import mockDBClient from "@/test/mocks/db/utils/mockDBClient";

type MarshallItem = MarshallType<Item>;

// Mock the DynamoDB client
describe("Test getItems LambdaFunction", () => {
	beforeEach(() => {
		mockDBClient.reset();
	});

	const mockItem: Item = {
		itemId: "test-item-id",
		createdBy: "test-user-id",
		expirationTime: "5h",
		about: "test-item-about",
		photo: "test-item-photo",
		status: "ongoing",
		name: "test-item-name",
		startingPrice: 100,
		createdAt: Date.now()
	};

	it("should return a list of items", async () => {
		// Mock the DynamoDB client
		mockDBClient.on(ScanCommand).resolves({
			Items: [
				marshall(mockItem) as MarshallItem
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