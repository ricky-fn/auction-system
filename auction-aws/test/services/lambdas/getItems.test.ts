import { handler } from "@/src/services/auction/getItems";
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { ApiResponseList } from "auction-shared/api";
import { InternalError, createLambdaResponse } from "@/src/services/auction/utils";
import { MarshallType } from "@/test/types";
import { Item } from "auction-shared/models";
import { marshall } from "@aws-sdk/util-dynamodb";

type MarshallItem = MarshallType<Item>;

// Mock the DynamoDB client
const ddbMock = mockClient(DynamoDBClient);

describe("Test getItems LambdaFunction", () => {
	beforeEach(() => {
		ddbMock.reset();
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
		ddbMock.on(ScanCommand).resolves({
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
		ddbMock.on(ScanCommand).rejects(new Error("test error"));

		const { body: response } = await handler();
		const error = new InternalError("I001", "test error");
		const { body: expectedResponse } = error.getResponse();

		expect(JSON.parse(response).error).toEqual(JSON.parse(expectedResponse).error);
		expect(error.errorMessage).toEqual("test error");
	});
});