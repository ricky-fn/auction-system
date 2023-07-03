import { ItemsAction, ItemsActionTypes } from "../actions/itemsActions";

export interface ItemData {
  itemId: string;
  name: string;
  startingPrice: number;
  timestamp: number,
  expirationTime: number,
  highestBid: number;
  highestBidder: string;
  createdBy: string;
}

type ItemsState = ItemData[];

const initialState: ItemsState = [];

export const itemsReducer = (state = initialState, action: ItemsAction): ItemsState => {
  switch (action.type) {
    case ItemsActionTypes.ADD_ITEM:
      return [...state, action.payload];
    case ItemsActionTypes.SET_ITEMS:
      return action.payload;
    case ItemsActionTypes.BID_ITEM:
      return state.map((item) => item.itemId === action.payload.itemId ? action.payload : item);
    default:
      return state;
  }
};