import { Item, Items, User } from "./models";

export interface ApiResponse<T> {
  timestamp: number;
  data?: T;
}

export interface ApiResponseList {
  'get-user': ApiResponse<User>;
  'create-item': ApiResponse<Item>;
  'get-items': ApiResponse<Items>;
  'deposit': ApiResponse<null>;
  'bid-item': ApiResponse<Item>;
}

export interface ApiRequestParams {
  'get-user': undefined;
  'create-item': Omit<Item, "itemId" | "createdBy" | "highestBid" | "highestBidder" | "lastBidTimestamp" | "timestamp" | "createdAt" | "status">;
  'get-items': undefined;
  'deposit': { amount: number };
  'bid-item': { itemId: string, bidAmount: number };
}