import "aws-sdk-client-mock-jest";
import { handler } from "@/src/services/auction/protected/bidItem";
import { ApiRequestParams } from "auction-shared/api";
import { BadRequest, uuid } from "@/src/services/auction/utils";
import { marshall } from "@aws-sdk/util-dynamodb";
import mockDBClient from "@/test/mocks/db/utils/mockDBClient";
import { generateCognitoAuthorizerContext } from "@/test/mocks/fakeData/auth";
import { GetItemCommand, PutItemCommand, ScanCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { generateFakeUser } from "@/test/mocks/fakeData/user";
import { sharedAuthTest } from "./shared/auth";
import { sharedInputTest } from "./shared/input";
import { generateFakeBidRecord, generateFakeCompletedItem, generateFakeItem } from "@/test/mocks/fakeData/bid";

const DB_ITEMS_TABLE = process.env.DB_ITEMS_TABLE as string;
const DB_BIDS_TABLE = process.env.DB_BIDS_TABLE as string;
const DB_USERS_TABLE = process.env.DB_USERS_TABLE as string;

describe("Test bidItem LambdaFunction", () => {
	beforeEach(() => {
		jest.spyOn(console, "error").mockImplementationOnce(jest.fn());
		mockDBClient.reset();
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	const mockBidItemRequestParam: ApiRequestParams["bid-item"] = {
		itemId: "itemId",
		bidAmount: 200,
	};

	describe("Test the bidding process", () => {
		it("should return a BadRequest when the item does not exist", async () => {
			const fakeUser = generateFakeUser();
			mockDBClient
				.on(GetItemCommand, {
					TableName: DB_USERS_TABLE,
					Key: {
						"id": { S: fakeUser.id },
					}
				})
				.resolves({ Item: marshall(fakeUser) })
				.on(GetItemCommand, {
					TableName: DB_ITEMS_TABLE,
					Key: {
						"itemId": { S: mockBidItemRequestParam.itemId },
					}
				})
				.resolves({ Item: undefined });

			const { body: response, statusCode } = await handler({
				...generateCognitoAuthorizerContext(fakeUser.id),
				body: JSON.stringify(mockBidItemRequestParam),
			} as any);

			const error = new BadRequest("B006", "Item not found");
			const { body: expectedResponse } = error.getResponse();

			expect(console.error).toHaveBeenCalledTimes(2);
			expect(statusCode).toEqual(error.statusCode);
			expect(console.error).toHaveBeenCalledWith("Bad Request [B006]: Item not found");
			expect(JSON.parse(response).error).toEqual(JSON.parse(expectedResponse).error);
		});

		it("should return a BadRequest when the item status is completed", async () => {
			const fakeUser = generateFakeUser();
			const fakeItem = generateFakeCompletedItem({
				itemId: mockBidItemRequestParam.itemId,
				highestBid: mockBidItemRequestParam.bidAmount,
				highestBidder: fakeUser.id,
			});
			mockDBClient
				.on(GetItemCommand, {
					TableName: DB_USERS_TABLE,
					Key: {
						"id": { S: fakeUser.id },
					}
				})
				.resolves({ Item: marshall(fakeUser) })
				.on(GetItemCommand, {
					TableName: DB_ITEMS_TABLE,
					Key: {
						"itemId": { S: mockBidItemRequestParam.itemId },
					}
				})
				.resolves({ Item: marshall(fakeItem) });

			const { body: response, statusCode } = await handler({
				...generateCognitoAuthorizerContext(fakeUser.id),
				body: JSON.stringify(mockBidItemRequestParam),
			} as any);

			const error = new BadRequest("B007", "auction is completed");
			const { body: expectedResponse } = error.getResponse();

			expect(console.error).toHaveBeenCalledTimes(2);
			expect(statusCode).toEqual(error.statusCode);
			expect(console.error).toHaveBeenCalledWith("Bad Request [B007]: auction is completed");
			expect(JSON.parse(response).error).toEqual(JSON.parse(expectedResponse).error);
		});

		it("should return a BadRequest if the user is the owner of the item", async () => {
			const fakeUser = generateFakeUser();
			const fakeItem = generateFakeItem({
				itemId: mockBidItemRequestParam.itemId,
				createdBy: fakeUser.id,
			});
			mockDBClient
				.on(GetItemCommand, {
					TableName: DB_USERS_TABLE,
					Key: {
						"id": { S: fakeUser.id },
					}
				})
				.resolves({ Item: marshall(fakeUser) })
				.on(GetItemCommand, {
					TableName: DB_ITEMS_TABLE,
					Key: {
						"itemId": { S: mockBidItemRequestParam.itemId },
					}
				})
				.resolves({ Item: marshall(fakeItem) });

			const { body: response, statusCode } = await handler({
				...generateCognitoAuthorizerContext(fakeUser.id),
				body: JSON.stringify(mockBidItemRequestParam),
			} as any);

			const error = new BadRequest("B008", "You cannot bid your own item");
			const { body: expectedResponse } = error.getResponse();

			expect(console.error).toHaveBeenCalledTimes(2);
			expect(statusCode).toEqual(error.statusCode);
			expect(console.error).toHaveBeenCalledWith("Bad Request [B008]: You cannot bid your own item");
			expect(JSON.parse(response).error).toEqual(JSON.parse(expectedResponse).error);
		});

		it("should return a BadRequest if user's balance is not enough", async () => {
			const fakeUser = generateFakeUser();
			const fakeItem = generateFakeItem({
				itemId: mockBidItemRequestParam.itemId,
			});
			const mockRequestParamsWithInsufficientBalance = {
				...mockBidItemRequestParam,
				bidAmount: fakeUser.balance + 1,
			};
			mockDBClient
				.on(GetItemCommand, {
					TableName: DB_USERS_TABLE,
					Key: {
						"id": { S: fakeUser.id },
					}
				})
				.resolves({ Item: marshall(fakeUser) })
				.on(GetItemCommand, {
					TableName: DB_ITEMS_TABLE,
					Key: {
						"itemId": { S: mockBidItemRequestParam.itemId },
					}
				})
				.resolves({ Item: marshall(fakeItem) });

			const { body: response, statusCode } = await handler({
				...generateCognitoAuthorizerContext(fakeUser.id),
				body: JSON.stringify(mockRequestParamsWithInsufficientBalance),
			} as any);

			const error = new BadRequest("B009", "Insufficient balance to bid the item");
			const { body: expectedResponse } = error.getResponse();

			expect(console.error).toHaveBeenCalledTimes(2);
			expect(statusCode).toEqual(error.statusCode);
			expect(console.error).toHaveBeenCalledWith("Bad Request [B009]: Insufficient balance to bid the item");
			expect(JSON.parse(response).error).toEqual(JSON.parse(expectedResponse).error);
		});

		describe("Test empty bid history", () => {
			it("should return a BadRequest if the bid amount is lower than the starting price", async () => {
				const fakeItem = generateFakeItem({
					itemId: mockBidItemRequestParam.itemId,
					startingPrice: mockBidItemRequestParam.bidAmount + 1
				});
				const fakeBidder = generateFakeUser({
					id: uuid("bidder"),
					balance: mockBidItemRequestParam.bidAmount,
				});

				mockDBClient
					.on(GetItemCommand, {
						TableName: DB_USERS_TABLE,
						Key: {
							"id": { S: fakeBidder.id },
						}
					})
					.resolves({ Item: marshall(fakeBidder) })
					.on(GetItemCommand, {
						TableName: DB_ITEMS_TABLE,
						Key: {
							"itemId": { S: mockBidItemRequestParam.itemId },
						}
					})
					.resolves({ Item: marshall(fakeItem) })
					.on(ScanCommand)
					.resolves({ Items: [] });

				const { body: response, statusCode } = await handler({
					...generateCognitoAuthorizerContext(fakeBidder.id),
					body: JSON.stringify(mockBidItemRequestParam),
				} as any);

				const error = new BadRequest("B010", "Bid amount is lower than the current highest bid");
				const { body: expectedResponse } = error.getResponse();

				expect(console.error).toHaveBeenCalledTimes(2);
				expect(statusCode).toEqual(error.statusCode);
				expect(console.error).toHaveBeenCalledWith("Bad Request [B010]: Bid amount is lower than the current highest bid");
				expect(JSON.parse(response).error).toEqual(JSON.parse(expectedResponse).error);

			});
		});

		describe("Test non-empty bid history", () => {
			it("should return a BadRequest if the previous bid happened less than 5 seconds ago", async () => {
				const lastBidTimestamp = new Date().getTime() - 4000;
				const lastBidAmount = mockBidItemRequestParam.bidAmount - 1;
				const fakeBidder = generateFakeUser({
					id: uuid("bidder"),
					balance: mockBidItemRequestParam.bidAmount,
				});
				const fakeItem = generateFakeItem({
					itemId: mockBidItemRequestParam.itemId,
					startingPrice: 1,
					highestBid: lastBidAmount,
					highestBidder: fakeBidder.id,
					lastBidTimestamp,
				});
				const fakeBidRecord = generateFakeBidRecord({
					bidderId: fakeBidder.id,
					itemId: mockBidItemRequestParam.itemId,
					timestamp: lastBidTimestamp,
					amount: lastBidAmount,
				});

				mockDBClient
					.on(GetItemCommand, {
						TableName: DB_USERS_TABLE,
						Key: {
							"id": { S: fakeBidder.id },
						}
					})
					.resolves({ Item: marshall(fakeBidder) })
					.on(GetItemCommand, {
						TableName: DB_ITEMS_TABLE,
						Key: {
							"itemId": { S: mockBidItemRequestParam.itemId },
						}
					})
					.resolves({ Item: marshall(fakeItem) })
					.on(ScanCommand)
					.resolves({ Items: [marshall(fakeBidRecord)] });

				const { body: response, statusCode } = await handler({
					...generateCognitoAuthorizerContext(fakeBidder.id),
					body: JSON.stringify(mockBidItemRequestParam),
				} as any);

				const error = new BadRequest("B011", "Please wait at least 5 seconds between bids");
				const { body: expectedResponse } = error.getResponse();

				expect(console.error).toHaveBeenCalledTimes(2);
				expect(statusCode).toEqual(error.statusCode);
				expect(console.error).toHaveBeenCalledWith("Bad Request [B011]: Please wait at least 5 seconds between bids");
				expect(JSON.parse(response).error).toEqual(JSON.parse(expectedResponse).error);
			});

			it("should return a BadRequest if the total bid amount is lower than the current highest bid", async () => {
				const highestBidAmount = mockBidItemRequestParam.bidAmount + 100;
				const startingPrice = 1;
				const totalBidAmount = 2;
				const fakeBidder = generateFakeUser({
					id: uuid("bidder"),
					balance: mockBidItemRequestParam.bidAmount,
				});
				const fakeHighestBidder = generateFakeUser({
					id: uuid("bidder"),
				});
				const fakeItem = generateFakeItem({
					itemId: mockBidItemRequestParam.itemId,
					startingPrice,
					highestBid: highestBidAmount,
					highestBidder: fakeHighestBidder.id,
				});
				const fakeBidRecord = generateFakeBidRecord({
					bidderId: fakeBidder.id,
					itemId: mockBidItemRequestParam.itemId,
					amount: totalBidAmount
				});

				mockDBClient
					.on(GetItemCommand, {
						TableName: DB_USERS_TABLE,
						Key: {
							"id": { S: fakeBidder.id },
						}
					})
					.resolves({ Item: marshall(fakeBidder) })
					.on(GetItemCommand, {
						TableName: DB_ITEMS_TABLE,
						Key: {
							"itemId": { S: mockBidItemRequestParam.itemId },
						}
					})
					.resolves({ Item: marshall(fakeItem) })
					.on(ScanCommand)
					.resolves({ Items: [marshall(fakeBidRecord)] });

				const { body: response, statusCode } = await handler({
					...generateCognitoAuthorizerContext(fakeBidder.id),
					body: JSON.stringify(mockBidItemRequestParam),
				} as any);

				const error = new BadRequest("B010", "Bid amount is lower than the current highest bid");
				const { body: expectedResponse } = error.getResponse();

				expect(console.error).toHaveBeenCalledTimes(2);
				expect(statusCode).toEqual(error.statusCode);
				expect(console.error).toHaveBeenCalledWith("Bad Request [B010]: Bid amount is lower than the current highest bid");
				expect(JSON.parse(response).error).toEqual(JSON.parse(expectedResponse).error);
			});
		});

		it("should update user's balance and item's highest bid and store the bid record", async () => {
			const startingPrice = 1;
			const fakeBidder = generateFakeUser({
				id: uuid("bidder"),
				balance: mockBidItemRequestParam.bidAmount,
			});
			const fakeItem = generateFakeItem({
				itemId: mockBidItemRequestParam.itemId,
				startingPrice,
			});

			const expectedUpdatedBalance = fakeBidder.balance - mockBidItemRequestParam.bidAmount;

			mockDBClient
				.on(GetItemCommand, {
					TableName: DB_USERS_TABLE,
					Key: {
						"id": { S: fakeBidder.id },
					}
				})
				.resolves({ Item: marshall(fakeBidder) })
				.on(GetItemCommand, {
					TableName: DB_ITEMS_TABLE,
					Key: {
						"itemId": { S: mockBidItemRequestParam.itemId },
					}
				})
				.resolves({ Item: marshall(fakeItem) })
				.on(ScanCommand)
				.resolves({ Items: [] });

			const { body: rawResponseData, statusCode } = await handler({
				...generateCognitoAuthorizerContext(fakeBidder.id),
				body: JSON.stringify(mockBidItemRequestParam),
			} as any);

			// expect user's balance to be updated
			expect(mockDBClient).toHaveReceivedCommandWith(UpdateItemCommand, {
				TableName: DB_USERS_TABLE,
				Key: {
					"id": { S: fakeBidder.id },
				},
				UpdateExpression: "SET #balance = :newBalance",
				ExpressionAttributeNames: {
					"#balance": "balance",
				},
				ExpressionAttributeValues: {
					":newBalance": { N: expectedUpdatedBalance.toString() },
				}
			});

			// expect item's highest bid to be updated
			expect(mockDBClient).toHaveReceivedCommandWith(UpdateItemCommand, {
				TableName: DB_ITEMS_TABLE,
				Key: {
					"itemId": { S: mockBidItemRequestParam.itemId },
				},
				UpdateExpression: "SET #highestBid = :highestBid, #lastBidTimestamp = :lastBidTimestamp, #highestBidder = :highestBidder",
				ExpressionAttributeNames: {
					"#highestBid": "highestBid",
					"#highestBidder": "highestBidder",
					"#lastBidTimestamp": "lastBidTimestamp",
				},
				ExpressionAttributeValues: {
					":highestBid": { N: mockBidItemRequestParam.bidAmount.toString() },
					":highestBidder": { S: fakeBidder.id },
					":lastBidTimestamp": { N: expect.any(String) },
				}
			});

			// expect bid record to be stored
			expect(mockDBClient).toHaveReceivedCommandWith(PutItemCommand, {
				TableName: DB_BIDS_TABLE,
				Item: {
					"bidId": { S: expect.any(String) },
					"itemId": { S: mockBidItemRequestParam.itemId },
					"bidderId": { S: fakeBidder.id },
					"amount": { N: mockBidItemRequestParam.bidAmount.toString() },
					"timestamp": { N: expect.any(String) },
					"status": { S: "pending" },
				}
			});

			expect(statusCode).toEqual(200);

			const expectedItem = {
				...fakeItem,
				highestBid: mockBidItemRequestParam.bidAmount,
				highestBidder: fakeBidder.id,
				lastBidTimestamp: expect.any(Number),
			};
			const expectedResponseData = {
				timestamp: expect.any(Number),
				data: expectedItem,
			};

			const responseData = JSON.parse(rawResponseData);

			expect(responseData).toEqual(expectedResponseData);
		});
	});
});