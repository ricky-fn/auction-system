import { User } from "auction-shared/models";

export enum UserActionTypes {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  DEPOSIT = 'DEPOSIT',
  DEDUCT = 'DEDUCT',
}

export interface LoginAction {
  type: UserActionTypes.LOGIN;
  payload: User;
}

export interface DepositAction {
  type: UserActionTypes.DEPOSIT;
  payload: { amount: number };
}

export interface LogoutAction {
  type: UserActionTypes.LOGOUT;
  payload: null;
}

export interface DeductAction {
  type: UserActionTypes.DEDUCT;
  payload: { amount: number };
}

export const login = (user: User) => {
  return { type: UserActionTypes.LOGIN, payload: user };
};

export const logout = () => {
  return { type: UserActionTypes.LOGOUT };
};

export const deposit = (amount: number) => {
  return { type: UserActionTypes.DEPOSIT, payload: { amount } };
};

export const deduct = (amount: number) => {
  return { type: UserActionTypes.DEDUCT, payload: { amount } };
};

export type UserAction = LoginAction | LogoutAction | DepositAction | DeductAction;