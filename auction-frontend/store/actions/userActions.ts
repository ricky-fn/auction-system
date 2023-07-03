import { Action, Dispatch } from 'redux';
import axios from 'axios';
import { setLoading } from './appActions';
import { ThunkAction } from 'redux-thunk';
import { DepositResponse, LoginResponse } from '../reducers/endpointsReducer';
import { RootState } from '../reducers';
import { UserData } from '../reducers/userReducer';

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

export const checkSession = (): ThunkAction<void, RootState, unknown, Action> => {
  return (dispatch: Dispatch, getState: () => RootState) => {
    const rawUserData: string | null = localStorage.getItem('userData');
    const userData: UserData = rawUserData ? JSON.parse(rawUserData) : null;
    if (userData) {
      const { validateTokenEndpoint } = getState().endpoints
      dispatch(setLoading(true))
      axios
        .post(validateTokenEndpoint, { sessionId: userData.sessionId })
        .then((response) => {
          const data: LoginResponse = response.data;
          dispatch(login(data));
        })
        .catch(() => {
          dispatch(logout());
        }).finally(() => {
          dispatch(setLoading(false))
        });
    } else {
      dispatch(logout());
    }
  };
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