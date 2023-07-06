import "aws-sdk-client-mock-jest";
import { handler } from "@/src/services/auction/protected/getTotalBidAmount";
import { ApiRequestParams, ApiResponseList } from "auction-shared/api";
import { BadRequest, InternalError, createLambdaResponse } from "@/src/services/auction/utils";
import { marshall } from "@aws-sdk/util-dynamodb";
import mockDBClient from "@/test/mocks/db/utils/mockDBClient";
import { generateCognitoAuthorizerContext } from "@/test/mocks/fakeData/auth";
import { GetItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { generateFakeUser } from "@/test/mocks/fakeData/user";
import { sharedAuthTest } from "./shared/auth";
import { sharedInputTest } from "./shared/input";
import { generateFakeBidRecord, generateFakeItem } from "@/test/mocks/fakeData/bid";

describe("Test getTotalBidAmount LambdaFunction", () => {
	beforeEach(() => {
		jest.spyOn(console, "error").mockImplementationOnce(jest.fn());
		mockDBClient.reset();
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	sharedAuthTest<ApiRequestParams["get-total-bid-amount"]>(handler, {
		itemId: "fakeItemId"
	}, "GET");

	sharedInputTest(handler, () => {
		it("should return BadRequest if the itemId is not provided", async () => {
			const { body: response, statusCode } = await handler({} as any);

			const error = new BadRequest("B002", "itemId is required");
			const { body: expectedResponse } = error.getResponse();

			expect(JSON.parse(response).error).toEqual(JSON.parse(expectedResponse).error);
			expect(statusCode).toEqual(error.statusCode);
		});

		it("should return BadRequest if the itemId does not exist", async () => {
			const requestParams: ApiRequestParams["get-total-bid-amount"] = {
				itemId: "fakeItemId"
			};
			const fakeUser = generateFakeUser();

			mockDBClient
				.on(GetItemCommand)
				.resolves({ Item: marshall(fakeUser) })
				.on(GetItemCommand, {
					TableName: undefined,
					Key: {
						"itemId": {
							S: requestParams.itemId
						}
					}
				})
				.rejects(new Error("Test"));

			const { body: response, statusCode } = await handler({
				...generateCognitoAuthorizerContext(fakeUser.id),
				queryStringParameters: requestParams
			} as any);

			const error = new InternalError("I001", "Test");
			const { body: expectedResponse } = error.getResponse();

			expect(console.error).toHaveBeenCalledTimes(2);
			expect(console.error).toHaveBeenCalledWith("Internal Server Error [I001]: Test");
			expect(JSON.parse(response).error).toEqual(JSON.parse(expectedResponse).error);
			expect(statusCode).toEqual(error.statusCode);
		});
	});

	it("should return the total bid amount", async () => {
		const requestParams: ApiRequestParams["get-total-bid-amount"] = {
			itemId: "fakeItemId"
		};
		const totalBidAmount = 200;
		const fakeUser = generateFakeUser();
		const fakeItem = generateFakeItem({
			itemId: requestParams.itemId,
			startingPrice: 100,
			highestBid: totalBidAmount,
			highestBidder: fakeUser.id,
		});
		const fakeBidedItems = [
			generateFakeBidRecord({
				itemId: requestParams.itemId,
				bidderId: fakeUser.id,
				amount: totalBidAmount / 2
			}),
			generateFakeBidRecord({
				itemId: requestParams.itemId,
				bidderId: fakeUser.id,
				amount: totalBidAmount / 2
			})
		];

		mockDBClient
			.on(GetItemCommand)
			.resolves({ Item: marshall(fakeUser) })
			.on(GetItemCommand, {
				TableName: undefined,
				Key: {
					"itemId": {
						S: requestParams.itemId
					}
				}
			})
			.resolves({ Item: marshall(fakeItem) })
			.on(ScanCommand)
			.resolves({ Items: fakeBidedItems.map(item => marshall(item)) });

		const result = await handler({
			...generateCognitoAuthorizerContext(fakeUser.id),
			queryStringParameters: requestParams
		} as any);

		const expectedResponse = createLambdaResponse<ApiResponseList["get-total-bid-amount"]>(200, {
			timestamp: Date.now(),
			data: totalBidAmount
		});

		expect(mockDBClient).toHaveReceivedCommandWith(ScanCommand, {
			TableName: undefined,
			FilterExpression: "itemId = :itemId and bidderId = :bidderId",
			ExpressionAttributeValues: {
				":itemId": { S: requestParams.itemId },
				":bidderId": { S: fakeUser.id }
			}
		});
		expect(result).toEqual(expectedResponse);
	});
});
