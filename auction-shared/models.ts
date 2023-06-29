export type User = {
  id: string;
  password?: string;
  email?: string;
  balance: number;
  create_at: number;
  given_name?: string;
  family_name?: string;
}

export type Item = {
  itemId: string;
  createdBy: string;
  expirationTime: number;
  highestBid: number;
  highestBidder: string;
  lastBidTimestamp?: number;
  name: string;
  startingPrice: number;
  timestamp: number;
}

export type Items = Item[]

export type Session = {
  sessionId: string;
  userId: string;
  expiryTime: number;
}

