import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  getDBConnection, 
  createTable, 
  getTransactions, 
  saveTransaction, 
  deleteTransactionFromDB,
  updateTransactionInDB 
} from '../db/database';

// 1. Define Transaction Interface
export interface Transaction {
  id: string;
  amount: number;
  category: string;
  date: string; // ISO Format YYYY-MM-DD
  notes: string;
  bankName?: string;
  type: 'CREDIT' | 'DEBIT';
  source: 'SMS' | 'MANUAL';
}

// 2. Define State Interface
interface ExpenseState {
  transactions: Transaction[];
  userName: string; // Added userName here
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
}

// 3. Initial State
const initialState: ExpenseState = {
  transactions: [],
  userName: 'Guest User', // Default value
  status: 'idle',
};

// --- THUNKS (Async Actions) ---

export const loadTransactions = createAsyncThunk('expenses/load', async () => {
  const db = await getDBConnection();
  await createTable(db);
  return await getTransactions(db);
});

export const addTransaction = createAsyncThunk('expenses/add', async (transaction: Omit<Transaction, 'id'>) => {
  const db = await getDBConnection();
  const insertId = await saveTransaction(db, transaction);
  return { ...transaction, id: insertId.toString() } as Transaction;
});

export const editTransaction = createAsyncThunk('expenses/edit', async (transaction: Transaction) => {
  const db = await getDBConnection();
  await updateTransactionInDB(db, transaction);
  return transaction;
});

export const deleteTransaction = createAsyncThunk('expenses/delete', async (id: string) => {
  const db = await getDBConnection();
  await deleteTransactionFromDB(db, id);
  return id;
});

// --- SLICE ---

const expenseSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    // 4. THIS IS THE MISSING REDUCER
    setUserName: (state, action: PayloadAction<string>) => {
      state.userName = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadTransactions.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.transactions = action.payload;
      })
      .addCase(addTransaction.fulfilled, (state, action) => {
        state.transactions.unshift(action.payload);
        state.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      })
      .addCase(editTransaction.fulfilled, (state, action) => {
        const index = state.transactions.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.transactions[index] = action.payload;
          state.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
      })
      .addCase(deleteTransaction.fulfilled, (state, action) => {
        state.transactions = state.transactions.filter(t => t.id !== action.payload);
      });
  },
});

// 5. EXPORT THE ACTIONS HERE
export const { setUserName } = expenseSlice.actions; 

export default expenseSlice.reducer;