import { ItemData } from "./ItemsReducer";
import { UserData } from "./userReducer";

export interface LoginResponse {
  user: UserData;
  timestamp: number;
}

export interface DepositResponse {
  amount: number;
  timestamp: number;
}

export interface ItemCreationResponse {
  item: ItemData;
  timestamp: number;
}

export interface BidItemResponse {
  item: ItemData;
  timestamp: number;
}

export interface EndpointsState {
  loginEndpoint: string;
  getItemsEndpoint: string;
  registerEndpoint: string;
  validateTokenEndpoint: string;
  depositEndpoint: string;
  itemCreationEndpoint: string;
  bidItemEndpoint: string;
  logoutEndpoint: string;
}

const initialState: EndpointsState = {
  loginEndpoint: ' https://q6y7yqelab.execute-api.us-east-1.amazonaws.com/Prod/login',
  registerEndpoint: ' https://q6y7yqelab.execute-api.us-east-1.amazonaws.com/Prod/register',
  getItemsEndpoint: 'https://q6y7yqelab.execute-api.us-east-1.amazonaws.com/Prod/get-items',
  validateTokenEndpoint: 'https://q6y7yqelab.execute-api.us-east-1.amazonaws.com/Prod/session',
  depositEndpoint: 'https://q6y7yqelab.execute-api.us-east-1.amazonaws.com/Prod/deposit',
  itemCreationEndpoint: 'https://q6y7yqelab.execute-api.us-east-1.amazonaws.com/Prod/create',
  bidItemEndpoint: 'https://q6y7yqelab.execute-api.us-east-1.amazonaws.com/Prod/bid',
  logoutEndpoint: 'https://q6y7yqelab.execute-api.us-east-1.amazonaws.com/Prod/logout'
};

type EndpointsAction = {
  type: 'UPDATE_ENDPOINTS';
  payload: Partial<EndpointsState>;
};

export const endpointsReducer = (
  state: EndpointsState = initialState,
  action: EndpointsAction
): EndpointsState => {
  switch (action.type) {
    case 'UPDATE_ENDPOINTS':
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
};