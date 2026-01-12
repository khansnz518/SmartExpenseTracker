export interface ParsedSms {
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  account: string | null;
  date: string; // ISO format
  bank: string;
  description: string;
}

// Common Indian Bank Headers
export const BANK_HEADERS = [
  'HDFCBK', 'SBIINB', 'ICICIB', 'AXISBK', 'KOTAKB', 'INDUSB', 'BOITXT', 'PNBSMS', 'CANARA', 'UNIONB', 'YESBNK', 'BOIIND'
];

const AMOUNT_REGEX = /(?:Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)/i;
const ACCOUNT_REGEX = /[Aa]\/c\s*[X]*(\d{3,4})/;

export const parseSmsBody = (body: string, address: string, timestamp: number): ParsedSms | null => {
  // A. Check for keywords
  const isDebit = /debited|spent|purchase|sent|paid/i.test(body);
  const isCredit = /credited|received|deposited|added/i.test(body);

  if (!isDebit && !isCredit) return null;

  // B. Extract Amount
  const amountMatch = body.match(AMOUNT_REGEX);
  if (!amountMatch) return null;
  
  const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  if (isNaN(amount)) return null;

  // C. Extract Account
  const accountMatch = body.match(ACCOUNT_REGEX);
  const account = accountMatch ? accountMatch[1] : null;

  // D. Determine Bank Name (Moved up so we can use it for description)
  let bankName = 'Unknown Bank';
  
  // Helper to map headers to cleaner names
  // You can expand this map for better looking names
  const headerMap: { [key: string]: string } = {
    'HDFCBK': 'HDFC Bank',
    'SBIINB': 'SBI',
    'ICICIB': 'ICICI Bank',
    'AXISBK': 'Axis Bank',
    'KOTAKB': 'Kotak Bank',
    'INDUSB': 'IndusInd Bank',
    'CANARA': 'Canara Bank',
    'UNIONB': 'Union Bank',
    'YESBNK': 'Yes Bank'
  };

  // Loop through headers to find a match
  for (const header of BANK_HEADERS) {
    if (address.toUpperCase().includes(header)) {
        // Use the map if available, otherwise just clean the string
        bankName = headerMap[header] || header.replace('BK', '').replace('BNK', '').replace('SMS', '');
        break; // Stop after finding the first match
    }
  }

  return {
    amount,
    type: isDebit ? 'DEBIT' : 'CREDIT',
    account,
    date: new Date(timestamp).toISOString().split('T')[0],
    bank: bankName,
    description: bankName,
  };
};