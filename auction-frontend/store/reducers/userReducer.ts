import { DeductAction, DepositAction, LoginAction, UserAction, UserActionTypes } from "../actions/userActions";
import { User } from "auction-shared/models";

const initialState: Partial<User> = {};

export const userReducer = (state = initialState, action: UserAction) => {
  const { payload: loginPayload } = action as LoginAction;
  const { payload: depositPayload } = action as DepositAction;
  const { payload: deductPayload } = action as DeductAction;

  switch (action.type) {
    case UserActionTypes.LOGIN:
      return {
        ...state,
        ...loginPayload,
      };
    case 'LOGOUT':
      return {};
    case 'DEPOSIT':
      return {
        ...state,
        balance: state.balance! + depositPayload.amount,
      };
    case 'DEDUCT':
      return {
        ...state,
        balance: state.balance! - deductPayload.amount,
      };
    default:
      return state;
  }
};