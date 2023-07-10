import "aws-sdk-client-mock-jest";
import { handler } from "@/src/services/auction/checkStatus";
import { BatchGetItemCommand, BatchWriteItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import mockDBClient from "@/test/lib/db/mockDBClient";
import { generateFakeBidRecord, generateFakeExpiredItem } from "auction-shared/mocks/fakeData/bid";
import { generateFakeUser } from "auction-shared/mocks/fakeData/user";

const DB_ITEMS_TABLE = process.env.DB_ITEMS_TABLE as string;
const DB_BIDS_TABLE = process.env.DB_BIDS_TABLE as string;
const DB_USERS_TABLE = process.env.DB_USERS_TABLE as string;

describe("Test checkStatus LambdaFunction", () => {
	beforeEach(() => {
		mockDBClient.reset();
	});

	it("Should stop if item list is empty", async () => {
		mockDBClient.on(ScanCommand).resolves({ Items: [] });

		await handler();

		expect(mockDBClient).toHaveReceivedCommandTimes(ScanCommand, 1);
	});

	it("Should update the status of ongoing items to completed directly if none bid record is found", async () => {
		const fakeExpiredItem = generateFakeExpiredItem();

		mockDBClient
			.on(ScanCommand, {
				TableName: DB_ITEMS_TABLE,
				FilterExpression: "#status = :statusValue",
				ExpressionAttributeNames: {
					"#status": "status",
				},
				ExpressionAttributeValues: {
					":statusValue": {
						S: "ongoing"
					},
				},
			})
			.resolves({ Items: [marshall(fakeExpiredItem)] })
			.on(ScanCommand, {
				TableName: DB_BIDS_TABLE,
				FilterExpression: "#itemId = :itemIdValue",
				ExpressionAttributeNames: {
					"#itemId": "itemId",
				},
				ExpressionAttributeValues: {
					":itemIdValue": {
						S: fakeExpiredItem.itemId,
					},
				},
			})
			.resolves({ Items: [] });

		await handler();

		expect(mockDBClient).toHaveReceivedCommandWith(BatchWriteItemCommand, {
			RequestItems: {
				[DB_ITEMS_TABLE]: [
					{
						PutRequest: {
							Item: marshall({
								...fakeExpiredItem,
								status: "completed",
							})
						}
					}
				]
			}
		});
	});

	it("Should refund other bidders if there is a highest bidder", async () => {
		const fakeBidder = generateFakeUser();
		const fakeHighestBidder = generateFakeUser();
		const fakeExpiredItem = generateFakeExpiredItem({
			highestBidder: fakeHighestBidder.id,
			highestBid: 100
		});
		const fakeHighestBid = generateFakeBidRecord({
			itemId: fakeExpiredItem.itemId,
			bidderId: fakeHighestBidder.id,
			amount: 100
		});
		const fakeBid = generateFakeBidRecord({
			itemId: fakeExpiredItem.itemId,
			bidderId: fakeBidder.id,
			amount: 50
		});

		mockDBClient
			// Get the expired items
			.on(ScanCommand, {
				TableName: DB_ITEMS_TABLE,
				FilterExpression: "#status = :statusValue",
				ExpressionAttributeNames: {
					"#status": "status",
				},
				ExpressionAttributeValues: {
					":statusValue": {
						S: "ongoing"
					},
				},
			})
			.resolves({ Items: [marshall(fakeExpiredItem)] });

		mockDBClient
			.on(ScanCommand, {
				TableName: DB_BIDS_TABLE,
				FilterExpression: "#itemId = :itemIdValue",
				ExpressionAttributeNames: {
					"#itemId": "itemId",
				},
				ExpressionAttributeValues: {
					":itemIdValue": {
						S: fakeExpiredItem.itemId,
					},
				},
			})
			.resolves({ Items: [marshall(fakeHighestBid), marshall(fakeBid)] });

		mockDBClient
			.on(BatchGetItemCommand, {
				RequestItems: {
					[DB_USERS_TABLE]: {
						Keys: [
							{
								id: {
									S: fakeBidder.id
								}
							},
						]
					}
				}
			})
			.resolves({
				Responses: {
					[DB_USERS_TABLE]: [marshall(fakeBidder)]
				}
			});

		await handler();

		// expect fakeBidder's balance to be updated
		expect(mockDBClient).toHaveReceivedCommandWith(BatchWriteItemCommand, {
			RequestItems: {
				[DB_USERS_TABLE]: [
					{
						PutRequest: {
							Item: marshall({
								...fakeBidder,
								balance: fakeBidder.balance + fakeBid.amount
							})
						}
					}
				]
			}
		});

		// expect fakeHighestBidder's bid record to be updated
		expect(mockDBClient).toHaveReceivedCommandWith(BatchWriteItemCommand, {
			RequestItems: {
				[DB_BIDS_TABLE]: [
					{
						PutRequest: {
							Item: marshall({
								...fakeHighestBid,
								status: "completed",
							})
						}
					},
				]
			}
		});

		// expect fakeBidder bid record to be updated
		expect(mockDBClient).toHaveReceivedCommandWith(BatchWriteItemCommand, {
			RequestItems: {
				[DB_BIDS_TABLE]: [
					{
						PutRequest: {
							Item: marshall({
								...fakeBid,
								status: "refunded"
							})
						}
					}
				]
			}
		});
	});
});