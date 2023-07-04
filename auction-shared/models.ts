export type User = {
  id: string;
  password?: string;
  email?: string;
  balance: number;
  create_at: number;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export type Item = {
  itemId: string;
  createdBy: string;
  expirationTime: string;
  highestBid?: number;
  highestBidder?: string;
  lastBidTimestamp?: number;
  name: string;
  startingPrice: number;
  createdAt: number;
  about: string;
  photo: string;
  status: ItemStatus;
}

export type ItemStatus = 'ongoing' | 'completed'

export type Items = Item[]

export type Session = {
  sessionId: string;
  userId: string;
  expiryTime: number;
}

