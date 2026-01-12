import SmsAndroid from 'react-native-get-sms-android';
import { PermissionsAndroid, Platform } from 'react-native';
import { BANK_HEADERS, parseSmsBody, ParsedSms } from '../utils/smsPatterns';
import { store } from '../store/store';
import { addTransaction } from '../store/expenseSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_SYNC_KEY = 'last_sms_sync_time';

export const requestSmsPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        {
          title: "SMS Permission",
          message: "We need access to your SMS to track expenses automatically.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK"
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return true;
};

// --- THIS IS THE FUNCTION YOUR DASHBOARD IS LOOKING FOR ---
export const syncSmsToTransactions = async () => {
  const hasPermission = await requestSmsPermission();
  if (!hasPermission) {
    console.log('SMS Permission denied');
    return;
  }

  // 1. Get last sync time
  const lastSyncStr = await AsyncStorage.getItem(LAST_SYNC_KEY);
  const lastSync = lastSyncStr ? parseInt(lastSyncStr, 10) : 0;
  const currentTime = Date.now();

  const filter = {
    box: 'inbox',
    minDate: lastSync, 
    maxCount: 100, 
  };

  SmsAndroid.list(
    JSON.stringify(filter),
    (fail) => console.log('Failed to list SMS: ' + fail),
    async (count, smsList) => {
      const messages = JSON.parse(smsList);
      let newTransactionsCount = 0;

      // 2. Filter Bank Messages only
      const bankMessages = messages.filter((msg: any) => 
        BANK_HEADERS.some(header => msg.address.toUpperCase().includes(header))
      );

      console.log(`Found ${bankMessages.length} potential bank messages`);

      for (const msg of bankMessages) {
        // 3. Parse Logic
        const parsed: ParsedSms | null = parseSmsBody(msg.body, msg.address, msg.date);

        if (parsed) {
          // 4. Dispatch to Redux
          // Using store.dispatch directly because we are outside a React component
          store.dispatch(addTransaction({
            amount: parsed.amount,
            category: parsed.type === 'CREDIT' ? 'Income' : 'Bank Related', 
            date: parsed.date,
            notes: parsed.description,
            bankName: parsed.bank,
            type: parsed.type,
            source: 'SMS',
          }));
          newTransactionsCount++;
        }
      }

      // 5. Update Last Sync Time
      if (newTransactionsCount > 0) {
        await AsyncStorage.setItem(LAST_SYNC_KEY, currentTime.toString());
        console.log(`Synced ${newTransactionsCount} new transactions`);
      }
    }
  );
};