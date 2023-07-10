import "aws-sdk-client-mock-jest";
import { handler } from "@/src/services/auction/protected/getTotalBidAmount";
import { ApiRequestParams, ApiResponseList } from "auction-shared/api";
import { BadRequest, InternalError, createLambdaResponse } from "@/src/services/auction/utils";
import { marshall } from "@aws-sdk/util-dynamodb";
import mockDBClient from "@/test/lib/db/mockDBClient";
import { generateCognitoAuthorizerContext } from "auction-shared/mocks/fakeData/auth";
import { GetItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { generateFakeUser } from "auction-shared/mocks/fakeData/user";
import { sharedAuthTest } from "./shared/auth";
import { sharedInputTest } from "./shared/input";
import { generateFakeBidRecord, generateFakeItem } from "auction-shared/mocks/fakeData/bid";

const DB_ITEMS_TABLE = process.env.DB_ITEMS_TABLE as string;
const DB_BIDS_TABLE = process.env.DB_BIDS_TABLE as string;

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
				TableName: DB_ITEMS_TABLE,
				Key: {
					"itemId": {
						S: requestParams.itemId
					}
				}
			})
			.resolves({ Item: marshall(fakeItem) })
			.on(ScanCommand)
			.resolves({ Items: fakeBidedItems.map(item => marshall(item)) });

		const { body: rawResponseData, statusCode } = await handler({
			...generateCognitoAuthorizerContext(fakeUser.id),
			queryStringParameters: requestParams
		} as any);

		const expectedResponseData = <ApiResponseList["get-total-bid-amount"]>{
			timestamp: expect.any(Number),
			data: totalBidAmount
		};

		expect(mockDBClient).toHaveReceivedCommandWith(ScanCommand, {
			TableName: DB_BIDS_TABLE,
			FilterExpression: "itemId = :itemId and bidderId = :bidderId",
			ExpressionAttributeValues: {
				":itemId": { S: requestParams.itemId },
				":bidderId": { S: fakeUser.id }
			}
		});

		expect(statusCode).toEqual(200);

		const responseData = JSON.parse(rawResponseData);
		expect(responseData).toEqual(expectedResponseData);
	});
});
