import { combineReducers, Store, AnyAction, PreloadedState } from 'redux';
import { configureStore } from '@reduxjs/toolkit';
import { appReducer } from './appReducer';
import thunkMiddleware from 'redux-thunk';

const rootReducer = combineReducers({
  app: appReducer,
});

export function setupStore(preloadedState?: PreloadedState<RootState>): Store<RootState, AnyAction> {
  const store = configureStore({
    reducer: rootReducer,
    middleware: [thunkMiddleware],
    devTools: process.env.NODE_ENV !== 'production',
    preloadedState
  });
  return store;
}

export type RootState = ReturnType<typeof rootReducer>
export type AppStore = ReturnType<typeof setupStore>
export type AppDispatch = AppStore['dispatch']