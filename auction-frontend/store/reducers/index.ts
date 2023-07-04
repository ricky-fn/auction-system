import { legacy_createStore as createStore, applyMiddleware, combineReducers, Store, AnyAction } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import { UserData, userReducer } from './userReducer';
import { AppData, appReducer } from './appReducer';
import { ItemData, itemsReducer } from './ItemsReducer';
import { EndpointsState, endpointsReducer } from './endpointsReducer';
import thunkMiddleware, { ThunkDispatch } from 'redux-thunk';

export interface RootState {
  user: UserData;
  items: ItemData[];
  endpoints: EndpointsState;
  app: AppData
}

const rootReducer = combineReducers({
  app: appReducer,
  user: userReducer,
  items: itemsReducer,
  endpoints: endpointsReducer
});

const store: Store<RootState, AnyAction> & { dispatch: ThunkDispatch<RootState, unknown, AnyAction> } = createStore(
  rootReducer,
  composeWithDevTools(applyMiddleware(thunkMiddleware))
);

export default store;
