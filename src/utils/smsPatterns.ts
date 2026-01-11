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
const MERCHANT_REGEX = /(?:at|to|info)\s+([A-Za-z0-9\s\*\.\-]+?)(?=\s+(?:on|from|thru|using|Ref|Avl)|$)/i;

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

  // D. Extract Description
  let description = 'Unknown Transaction';
  if (isDebit) {
    const merchantMatch = body.match(MERCHANT_REGEX);
    description = merchantMatch ? merchantMatch[1].trim() : 'Debit Transaction';
  } else {
    description = 'Bank Credit';
  }

  // E. Determine Bank Name
  let bankName = 'Unknown Bank';
  BANK_HEADERS.forEach(header => {
    if (address.toUpperCase().includes(header)) {
      bankName = header.replace('BK', '').replace('BNK', '').replace('SMS', '');
    }
  });

  return {
    amount,
    type: isDebit ? 'DEBIT' : 'CREDIT',
    account,
    date: new Date(timestamp).toISOString().split('T')[0],
    bank: bankName,
    description: description.substring(0, 30),
  };
};