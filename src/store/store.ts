import { configureStore } from '@reduxjs/toolkit';
import expenseReducer from './expenseSlice';

export const store = configureStore({
  reducer: {
    expenses: expenseReducer,
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({ serializableCheck: false }), // Disable checks for non-serializable data if any
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;