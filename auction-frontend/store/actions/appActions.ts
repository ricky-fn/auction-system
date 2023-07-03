import { ToastData } from "../reducers/appReducer";

export enum AppActionTypes {
  SET_LOADING = 'SET_LOADING',
  SHOW_TOAST = 'SHOW_TOAST',
  HIDE_TOAST = 'HIDE_TOAST',
}

export const setLoading = (isLoading: boolean) => ({
  type: AppActionTypes.SET_LOADING,
  payload: isLoading,
});

export const showToast = (toast: ToastData) => ({
  type: AppActionTypes.SHOW_TOAST,
  payload: toast,
})

export const hideToast = () => ({
  type: AppActionTypes.HIDE_TOAST,
})

export type AppAction =
  | { type: AppActionTypes.SET_LOADING; payload: boolean }
  | { type: AppActionTypes.SHOW_TOAST; payload: ToastData }
  | { type: AppActionTypes.HIDE_TOAST };