import axios from "axios";
import { UserAction, UserActionTypes } from "../actions/userActions";
import { DepositResponse, LoginResponse } from "./endpointsReducer";

export interface UserData {
  userId?: string | null;
  balance?: number;
  createdDate?: number;
  sessionId?: string;
}

const initialState: UserData = {};

export const userReducer = (state = initialState, action: UserAction) => {
  const loginPayload = action.payload as LoginResponse;
  const depositPayload = action.payload as DepositResponse;

  switch (action.type) {
    case UserActionTypes.LOGIN:
      // Store session token in local storage
      localStorage.setItem('userData', JSON.stringify(loginPayload.user));

      // Update the authorization header when a user logs in
      axios.defaults.headers.common['Authorization'] = `Bearer ${loginPayload.user.sessionId}`;

      return {
        ...state,
        ...loginPayload.user,
      };
    case 'LOGOUT':
      // Remove session token from local storage
      localStorage.removeItem('userData');

      // Remove the authorization header when a user logs out
      delete axios.defaults.headers.common['Authorization'];

      return {};
    case 'DEPOSIT':
      return {
        ...state,
        balance: depositPayload.amount,
      };
    default:
      return state;
  }
};