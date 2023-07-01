import { Item, User } from "./models";

export interface ApiResponse<T> {
  timestamp: number;
  data: T;
}

export interface ApiList {
  user: ApiResponse<{ user: User }>;
  'create-item': ApiResponse<{ item: Item }>;
}