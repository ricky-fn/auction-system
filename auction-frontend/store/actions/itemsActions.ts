import { ItemData } from "../reducers/ItemsReducer";

export enum ItemsActionTypes {
  ADD_ITEM = 'ADD_ITEM',
  SET_ITEMS = 'SET_ITEMS',
  BID_ITEM = 'BID_ITEM',
}

export const addItem = (item: ItemData) => {
  return { type: ItemsActionTypes.ADD_ITEM, payload: item };
};

export const setItems = (items: ItemData[]) => {
  return { type: ItemsActionTypes.SET_ITEMS, payload: items };
};

export const bidItem = (item: ItemData) => {
  return { type: ItemsActionTypes.BID_ITEM, payload: item };
};

export type ItemsAction =
  | { type: ItemsActionTypes.ADD_ITEM; payload: ItemData }
  | { type: ItemsActionTypes.SET_ITEMS; payload: ItemData[] }
  | { type: ItemsActionTypes.BID_ITEM; payload: ItemData };