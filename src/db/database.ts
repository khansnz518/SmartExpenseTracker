import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

const DB_NAME = 'SmartExpense.db';
const TABLE_NAME = 'transactions';

export const getDBConnection = async () => {
  return SQLite.openDatabase({ name: DB_NAME, location: 'default' });
};

export const createTable = async (db: SQLite.SQLiteDatabase) => {
  // Create table if it doesn't exist
  const query = `CREATE TABLE IF NOT EXISTS ${TABLE_NAME}(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        date TEXT NOT NULL,
        notes TEXT,
        bankName TEXT,
        type TEXT NOT NULL,
        source TEXT DEFAULT 'MANUAL' 
    );`;
  await db.executeSql(query);
};

export const getTransactions = async (db: SQLite.SQLiteDatabase) => {
  try {
    const transactions: any[] = [];
    const results = await db.executeSql(`SELECT * FROM ${TABLE_NAME} ORDER BY date DESC`);
    results.forEach(result => {
      for (let i = 0; i < result.rows.length; i++) {
        // Convert ID to string to match our Redux type
        let item = result.rows.item(i);
        item.id = item.id.toString(); 
        transactions.push(item);
      }
    });
    return transactions;
  } catch (error) {
    console.error(error);
    throw Error('Failed to get transactions');
  }
};

export const saveTransaction = async (db: SQLite.SQLiteDatabase, transaction: any) => {
  const insertQuery = `
    INSERT INTO ${TABLE_NAME} (amount, category, date, notes, bankName, type, source) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const result = await db.executeSql(insertQuery, [
    transaction.amount,
    transaction.category,
    transaction.date,
    transaction.notes,
    transaction.bankName,
    transaction.type,
    transaction.source || 'MANUAL',
  ]);
  return result[0].insertId; // Return the new Auto-ID
};

export const updateTransactionInDB = async (db: SQLite.SQLiteDatabase, transaction: any) => {
  const updateQuery = `
    UPDATE ${TABLE_NAME} 
    SET amount = ?, category = ?, date = ?, notes = ?, bankName = ?, type = ?
    WHERE id = ?
  `;
  await db.executeSql(updateQuery, [
    transaction.amount,
    transaction.category,
    transaction.date,
    transaction.notes,
    transaction.bankName,
    transaction.type,
    transaction.id // Ensure ID is passed for WHERE clause
  ]);
};

export const deleteTransactionFromDB = async (db: SQLite.SQLiteDatabase, id: number | string) => {
  const deleteQuery = `DELETE FROM ${TABLE_NAME} WHERE id = ?`;
  await db.executeSql(deleteQuery, [id]);
};