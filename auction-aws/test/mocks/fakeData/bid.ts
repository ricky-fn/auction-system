import { uuid } from "@/src/services/auction/utils";
import { BidRecord, Item } from "auction-shared/models";

export const generateFakeItem = (item?: Partial<Item>) => {
	const mockItem: Item = {
		itemId: "test-item-id",
		createdBy: "test-user-id",
		expirationTime: "5h",
		about: "test-item-about",
		photo: "test-item-photo",
		status: "ongoing",
		name: "test-item-name",
		startingPrice: 100,
		createdAt: Date.now(),
		...item
	};

	return mockItem;
};

export const generateFakeBidedItem = (highestBid: number, highestBidder: string, lastBidTimestamp: number = Date.now()) => {
	const basicItem = generateFakeItem();
	const mockItem: Item = {
		...basicItem,
		highestBid,
		highestBidder,
		lastBidTimestamp,
		status: "ongoing"
	};

	return mockItem;
};

export const generateFakeCompletedItem = (item?: Partial<Item>): Item => {
	const basicItem = generateFakeItem();
	const mockItem: Item = {
		...basicItem,
		highestBid: 200,
		highestBidder: "test-user-id",
		lastBidTimestamp: Date.now(),
		status: "completed",
		...item
	};
	return mockItem;
};

export const generateFakeBidRecord = (bidRecord: Partial<BidRecord>) => {
	const mockBidRecord: BidRecord = {
		bidId: uuid("bid"),
		itemId: "test-item-id",
		bidderId: "test-user-id",
		amount: 100,
		timestamp: Date.now(),
		status: "pending",
		...bidRecord
	};

	return mockBidRecord;
};