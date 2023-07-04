import { DepositResponse, LoginResponse } from '../reducers/endpointsReducer';

export enum UserActionTypes {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  DEPOSIT = 'DEPOSIT',
}

export const login = (userData: LoginResponse) => {
  return { type: UserActionTypes.LOGIN, payload: userData };
};

export const logout = () => {
  return { type: UserActionTypes.LOGOUT };
};

export const deposit = (amount: number) => {
  return { type: UserActionTypes.DEPOSIT, payload: { amount } };
};

interface LoginAction {
  type: UserActionTypes.LOGIN;
  payload: LoginResponse;
}

interface DepositAction {
  type: UserActionTypes.DEPOSIT;
  payload: DepositResponse;
}

interface LogoutAction {
  type: UserActionTypes.LOGOUT;
  payload: null;
}

export type UserAction = LoginAction | LogoutAction | DepositAction;