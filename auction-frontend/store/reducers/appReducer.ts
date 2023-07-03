import { AppAction, AppActionTypes } from '../actions/appActions';

export type ToastVariant = "success" | "error" | "warning"

export interface AppData {
  isLoading: boolean,
  toastType: ToastVariant,
  toastMessage: null | string,
  showToast: boolean
}

export interface ToastData {
  type: ToastVariant,
  message: string,
}

const initialState: AppData = {
  isLoading: false,
  toastType: "success",
  toastMessage: null,
  showToast: false
};

export const appReducer = (state = initialState, action: AppAction) => {
  switch (action.type) {
    case AppActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    case AppActionTypes.SHOW_TOAST:
      return {
        ...state,
        toastType: action.payload.type,
        toastMessage: action.payload.message,
        showToast: true
      }
    case AppActionTypes.HIDE_TOAST:
      return {
        ...state,
        showToast: false
      }
    default:
      return state;
  }
};