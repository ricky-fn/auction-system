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
  'get-total-bid-amount': ApiResponse<number>;
  'get-item-by-id': ApiResponse<Item>;
}

export interface ApiRequestParams {
  'get-user': undefined;
  'create-item': Pick<Item, "expirationTime" | "name" | "startingPrice" | "about" | "photo">;
  'get-items': undefined;
  'deposit': { amount: number };
  'bid-item': { itemId: string, bidAmount: number };
  'get-total-bid-amount': { itemId: string };
  'update-amplify-env': { params: { [key: string]: string } };
  'get-item-by-id': { itemId: string };
}