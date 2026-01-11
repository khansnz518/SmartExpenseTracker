Smart Expense Tracker
A React Native application that automatically tracks your expenses by parsing transactional SMS messages. It features a secure, local-first architecture using SQLite for data persistence.

📱 Features
Automated Tracking: Reads bank SMS (Android only) to automatically log debits and credits.

Smart Parsing: Extracts amount, bank name, date, and merchant/description using Regex.

Visual Dashboard: View spending breakdown via Pie Charts and monthly summaries.

Secure & Private:

Local Storage: All data is stored locally on the device using SQLite.

Manual Entry: option to add cash transactions manually.

🛠 Tech Stack
Framework: React Native (CLI)

Language: TypeScript

State Management: Redux Toolkit

Database: SQLite (react-native-sqlite-storage)

UI Library: React Native Paper

Animations: React Native Reanimated

SMS Access: react-native-get-sms-android

🚀 Setup Instructions
Prerequisites
Node.js (v18+)

Java Development Kit (JDK 17)

Android Studio (for Android Simulator/SDK)

Xcode (for iOS Simulator - Note: SMS features are Android only)

1. Clone & Install
Bash

git clone https://github.com/khansnz518/SmartExpenseTracker.git
cd SmartExpenseTracker

# Install Javascript Dependencies
npm install

# Install iOS Pods (Mac Only)
cd ios && pod install && cd ..
2. Configure Native Permissions
Android (android/app/src/main/AndroidManifest.xml): Ensure these permissions are inside the <manifest> tag:

XML

<uses-permission android:name="android.permission.READ_SMS" />

3. Run the App
For Android:

Bash

npx react-native run-android
For iOS:

Bash

npx react-native run-ios
🔍 SMS Parsing Logic
The app uses a specific set of rules to ensure only financial transactions are logged, ignoring OTPs and personal messages.

1. Sender Identification (Filtering)
We only process messages from known banking headers.

Logic: The sender ID must contain specific keywords.

Keywords: HDFCBK, SBIINB, ICICIB, AXISBK, KOTAKB, INDUSB, BOITXT, PNBSMS, CANARA, UNIONB, YESBNK, BOIIND.

2. Transaction Type Detection
We check the message body for keywords to classify the transaction.

Debit Keywords: debited, spent, purchase, sent, paid.

Credit Keywords: credited, received, deposited, added.

If neither are found, the message is ignored.

3. Regex Extraction
We use Regular Expressions to extract specific data points:

A. Extracting Amount Captures formats like "Rs. 500", "INR 1,200.50", "Rs 500".

TypeScript

const AMOUNT_REGEX = /(?:Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)/i;
B. Extracting Account Number Captures the last 3-4 digits of the account (e.g., "A/c X1234").

TypeScript

const ACCOUNT_REGEX = /[Aa]\/c\s*[X]*(\d{3,4})/;
C. Extracting Merchant / Description Attempts to find who the money was sent to by looking for text following "at", "to", or "info".

TypeScript

const MERCHANT_REGEX = /(?:at|to|info)\s+([A-Za-z0-9\s\*\.\-]+?)(?=\s+(?:on|from|thru|using|Ref|Avl)|$)/i;