import { Item, Items, User } from "./models";

export interface ApiResponse<T> {
  timestamp: number;
  data?: T;
}

export interface ApiList {
  'get-user': ApiResponse<User>;
  'create-item': ApiResponse<Item>;
  'get-items': ApiResponse<Items>;
  'deposit': ApiResponse<null>;
}