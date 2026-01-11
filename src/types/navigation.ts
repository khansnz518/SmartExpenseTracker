  export type RootStackParamList = {
    Splash: undefined;
    Onboarding: undefined;
    SmsPermission: undefined;
    Dashboard: undefined;
    // Update this line:
    AddExpense: { transaction?: Transaction } | undefined; 
    TransactionHistory: undefined;
  };