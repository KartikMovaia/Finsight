import { createContext, useContext, useState, useEffect } from "react";

const LANG_KEY = "finsight-lang";
const CURRENCY_KEY = "finsight-currency";

const CURRENCIES = {
  USD: { symbol: "$", code: "USD", name: "US Dollar", locale: "en-US" },
  EUR: { symbol: "€", code: "EUR", name: "Euro", locale: "de-DE" },
  INR: { symbol: "₹", code: "INR", name: "Indian Rupee", locale: "en-IN" },
  PLN: { symbol: "zł", code: "PLN", name: "Polish Złoty", locale: "pl-PL" },
  GBP: { symbol: "£", code: "GBP", name: "British Pound", locale: "en-GB" },
  JPY: { symbol: "¥", code: "JPY", name: "Japanese Yen", locale: "ja-JP" },
  HKD: { symbol: "HK$", code: "HKD", name: "Hong Kong Dollar", locale: "en-HK" },
};

const translations = {
  en: {
    // ─── Common ───
    appName: "Finsight",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    close: "Close",
    confirm: "Confirm",
    optional: "Optional",
    loading: "Loading…",
    synced: "Synced",
    syncing: "Syncing…",
    error: "Error",
    total: "total",

    // ─── Auth ───
    signIn: "Sign In",
    signUp: "Create Account",
    signOut: "Sign Out",
    email: "Email",
    password: "Password",
    name: "Name",
    yourName: "Your name",
    forgotPassword: "Forgot password?",
    noAccount: "Don't have an account? Sign up",
    hasAccount: "Already have an account? Sign in",
    createYourAccount: "Create your account",
    signInToAccount: "Sign in to your account",
    resetSent: "Password reset email sent! Check your inbox.",
    continueWithGoogle: "Continue with Google",
    or: "or",
    cloudSyncNote: "Your data is stored securely in the cloud\nand syncs across all your devices.",
    authErrors: {
      "auth/email-already-in-use": "An account with this email already exists",
      "auth/invalid-email": "Please enter a valid email address",
      "auth/weak-password": "Password must be at least 6 characters",
      "auth/user-not-found": "No account found with this email",
      "auth/wrong-password": "Incorrect password",
      "auth/invalid-credential": "Incorrect email or password",
      "auth/too-many-requests": "Too many attempts. Please try again later",
    },
    enterNameError: "Please enter your name",
    passwordLengthError: "Password must be at least 6 characters",
    googleSignInFailed: "Google sign-in failed. Please try again.",
    resetEmailError: "Could not send reset email. Check your address.",
    enterEmailFirst: "Enter your email first",

    // ─── Tabs ───
    dashboard: "Dashboard",
    transactions: "Transactions",
    investments: "Investments",
    debts: "Debts",
    projections: "Projections",
    aiAdvisor: "AI Advisor",

    // ─── Time periods ───
    daily: "Daily",
    monthly: "Monthly",
    yearly: "Yearly",

    // ─── Dashboard ───
    income: "Income",
    expenses: "Expenses",
    net: "Net",
    netWorth: "Net Worth",
    portfolio: "Portfolio",
    totalDebt: "Total Debt",
    moMin: "/mo min",
    cumulativeCashFlow: "Cumulative Cash Flow",
    expenseBreakdown: "Expense Breakdown",
    incomeSources: "Income Sources",
    recentTransactions: "Recent Transactions",
    noTransactionsYet: "No transactions recorded in this period.",
    categoryBreakdown: "Category Breakdown",
    top5: "Top 5",

    // ─── Transactions ───
    addTransaction: "Add Transaction",
    newTransaction: "New Transaction",
    editTransaction: "Edit Transaction",
    updateTransaction: "Update Transaction",
    noTransactions: "No transactions in this period. Tap + to add one.",
    amount: "Amount",
    date: "Date",
    note: "Note",
    optionalNote: "Optional note",
    category: "Category",
    type: "Type",
    selectCategory: "Select category",

    // ─── Investments ───
    addInvestment: "+ Add Investment",
    newInvestment: "New Investment",
    editInvestment: "Edit Investment",
    updateInvestment: "Update Investment",
    holdings: "Holdings",
    totalValue: "Total Value",
    totalCost: "Total Cost",
    totalGainLoss: "Total Gain/Loss",
    returnPct: "Return %",
    allocationByType: "Allocation by Type",
    nameTicker: "Name / Ticker",
    sharesUnits: "Shares/Units",
    buyPrice: "Buy Price",
    currentPrice: "Current Price",
    purchaseDate: "Purchase Date",
    noInvestments: "No investments yet. Add your first holding above.",

    // ─── Debts ───
    addDebt: "+ Add Debt",
    newDebt: "New Debt",
    editDebt: "Edit Debt",
    updateDebt: "Update Debt",
    debtName: "Debt Name",
    monthlyMinimum: "Monthly Minimum",
    avgInterestRate: "Avg Interest Rate",
    creditUtilization: "Credit Utilization",
    balance: "Balance",
    interestRate: "Interest Rate %",
    minPaymentMo: "Min Payment/mo",
    creditLimit: "Credit Limit (opt)",
    dueDate: "Due Date",
    utilization: "Utilization",
    noDebts: "No debts tracked. Add one above.",
    payoffProjection: "Payoff Projection",
    payoffSubtitle: "Estimated months to pay off at minimum payments",
    never: "Never (increase payments)",
    interest: "interest",
    ofLimit: "of",
    limit: "limit",

    // ─── Projections ───
    incomeVsExpenseForecast: "Income vs Expense Forecast",
    projected: "Projected",
    annualProjections: "Annual Projections",
    projectedIncome: "Projected Income",
    projectedExpenses: "Projected Expenses",
    projectedSavings: "Projected Savings",
    perMonth: "/mo",
    savingsRate: "Savings Rate",
    monthlyBudgetByCategory: "Monthly Budget by Category",
    avgMonthlySpend: "Average monthly spend by category",

    // ─── Settings / Data Menu ───
    settings: "Settings",
    exportJson: "📤 Export JSON",
    importJson: "📥 Import JSON",
    resetToSamples: "🔄 Reset to samples",
    clearAllData: "🗑️ Clear all data",
    records: "records",
    deleteAllConfirm: "Are you sure you want to delete ALL data? This cannot be undone.",
    resetConfirm: "Reset to sample data? Your current data will be replaced.",
    invalidFileFormat: "Invalid file format.",
    couldNotReadFile: "Could not read file.",
    language: "🌐 Language",
    currency: "💱 Currency",

    // ─── AI Advisor ───
    aiTitle: "Finsight AI",
    aiSubtitle: "Powered by Gemini • Knows your finances",
    aiSetupTitle: "Finsight AI Advisor",
    aiSetupDesc: "Get personalized financial advice, savings plans, debt strategies, and budget recommendations — all based on your actual financial data.",
    aiSetupSteps: "Setup — Free Gemini API Key",
    aiStep1: "Go to",
    aiStep2: 'Click "Create API Key"',
    aiStep3: "Copy the key and paste it below",
    aiKeyNote: "🔒 Your key is stored locally on your device only — never sent to our servers.\nGemini offers a generous free tier (~1500 requests/day).",
    aiConnect: "Connect",
    aiPasteKey: "Paste your Gemini API key",
    clearChat: "Clear chat",
    askPlaceholder: "Ask about your finances, set a goal, get advice…",
    aiEmptyState: "Ask me anything about your finances, or try a quick prompt:",
    analyzing: "Analyzing your finances…",
    allModelsExhausted: "All models exhausted. Try enabling billing on Google Cloud (you can set a $0 budget).",

    // ─── Quick Prompts ───
    qpSpending: "📊 Analyze my spending",
    qpSavings: "🎯 Set a savings goal",
    qpDebt: "💳 Debt payoff plan",
    qpHouse: "🏠 Save for a house",
    qpInvest: "📈 Investment advice",
    qpEmergency: "🚨 Emergency fund",
    qpBudget: "📋 Monthly budget",
    qpHealth: "🏖️ Financial health check",
  },

  hi: {
    // ─── Common ───
    appName: "Finsight",
    save: "सहेजें",
    cancel: "रद्द करें",
    delete: "हटाएं",
    edit: "संपादित करें",
    add: "जोड़ें",
    close: "बंद करें",
    confirm: "पुष्टि करें",
    optional: "वैकल्पिक",
    loading: "लोड हो रहा है…",
    synced: "सिंक हो गया",
    syncing: "सिंक हो रहा है…",
    error: "त्रुटि",
    total: "कुल",

    // ─── Auth ───
    signIn: "साइन इन करें",
    signUp: "खाता बनाएं",
    signOut: "साइन आउट",
    email: "ईमेल",
    password: "पासवर्ड",
    name: "नाम",
    yourName: "आपका नाम",
    forgotPassword: "पासवर्ड भूल गए?",
    noAccount: "खाता नहीं है? साइन अप करें",
    hasAccount: "पहले से खाता है? साइन इन करें",
    createYourAccount: "अपना खाता बनाएं",
    signInToAccount: "अपने खाते में साइन इन करें",
    resetSent: "पासवर्ड रीसेट ईमेल भेजा गया! अपना इनबॉक्स देखें।",
    continueWithGoogle: "Google से जारी रखें",
    or: "या",
    cloudSyncNote: "आपका डेटा क्लाउड में सुरक्षित रूप से संग्रहीत है\nऔर आपके सभी उपकरणों में सिंक होता है।",
    authErrors: {
      "auth/email-already-in-use": "इस ईमेल से पहले से एक खाता मौजूद है",
      "auth/invalid-email": "कृपया एक मान्य ईमेल पता दर्ज करें",
      "auth/weak-password": "पासवर्ड कम से कम 6 अक्षर का होना चाहिए",
      "auth/user-not-found": "इस ईमेल से कोई खाता नहीं मिला",
      "auth/wrong-password": "गलत पासवर्ड",
      "auth/invalid-credential": "गलत ईमेल या पासवर्ड",
      "auth/too-many-requests": "बहुत अधिक प्रयास। कृपया बाद में पुनः प्रयास करें",
    },
    enterNameError: "कृपया अपना नाम दर्ज करें",
    passwordLengthError: "पासवर्ड कम से कम 6 अक्षर का होना चाहिए",
    googleSignInFailed: "Google साइन-इन विफल। कृपया पुनः प्रयास करें।",
    resetEmailError: "रीसेट ईमेल नहीं भेजा जा सका। अपना पता जांचें।",
    enterEmailFirst: "पहले अपना ईमेल दर्ज करें",

    // ─── Tabs ───
    dashboard: "डैशबोर्ड",
    transactions: "लेनदेन",
    investments: "निवेश",
    debts: "कर्ज़",
    projections: "अनुमान",
    aiAdvisor: "AI सलाहकार",

    // ─── Time periods ───
    daily: "दैनिक",
    monthly: "मासिक",
    yearly: "वार्षिक",

    // ─── Dashboard ───
    income: "आय",
    expenses: "खर्चे",
    net: "शुद्ध",
    netWorth: "कुल संपत्ति",
    portfolio: "पोर्टफोलियो",
    totalDebt: "कुल कर्ज़",
    moMin: "/माह न्यूनतम",
    cumulativeCashFlow: "संचयी नकदी प्रवाह",
    expenseBreakdown: "खर्च विवरण",
    incomeSources: "आय स्रोत",
    recentTransactions: "हाल के लेनदेन",
    noTransactionsYet: "इस अवधि में कोई लेनदेन दर्ज नहीं है।",
    categoryBreakdown: "श्रेणी विवरण",
    top5: "शीर्ष 5",

    // ─── Transactions ───
    addTransaction: "लेनदेन जोड़ें",
    newTransaction: "नया लेनदेन",
    editTransaction: "लेनदेन संपादित करें",
    updateTransaction: "लेनदेन अपडेट करें",
    noTransactions: "इस अवधि में कोई लेनदेन नहीं। + दबाकर जोड़ें।",
    amount: "राशि",
    date: "तारीख",
    note: "नोट",
    optionalNote: "वैकल्पिक नोट",
    category: "श्रेणी",
    type: "प्रकार",
    selectCategory: "श्रेणी चुनें",

    // ─── Investments ───
    addInvestment: "+ निवेश जोड़ें",
    newInvestment: "नया निवेश",
    editInvestment: "निवेश संपादित करें",
    updateInvestment: "निवेश अपडेट करें",
    holdings: "होल्डिंग्स",
    totalValue: "कुल मूल्य",
    totalCost: "कुल लागत",
    totalGainLoss: "कुल लाभ/हानि",
    returnPct: "रिटर्न %",
    allocationByType: "प्रकार के अनुसार आवंटन",
    nameTicker: "नाम / टिकर",
    sharesUnits: "शेयर/इकाइयां",
    buyPrice: "खरीद मूल्य",
    currentPrice: "वर्तमान मूल्य",
    purchaseDate: "खरीद तारीख",
    noInvestments: "अभी कोई निवेश नहीं। ऊपर अपनी पहली होल्डिंग जोड़ें।",

    // ─── Debts ───
    addDebt: "+ कर्ज़ जोड़ें",
    newDebt: "नया कर्ज़",
    editDebt: "कर्ज़ संपादित करें",
    updateDebt: "कर्ज़ अपडेट करें",
    debtName: "कर्ज़ का नाम",
    monthlyMinimum: "मासिक न्यूनतम",
    avgInterestRate: "औसत ब्याज दर",
    creditUtilization: "क्रेडिट उपयोग",
    balance: "शेष राशि",
    interestRate: "ब्याज दर %",
    minPaymentMo: "न्यूनतम भुगतान/माह",
    creditLimit: "क्रेडिट सीमा (वैकल्पिक)",
    dueDate: "देय तारीख",
    utilization: "उपयोग",
    noDebts: "कोई कर्ज़ ट्रैक नहीं। ऊपर जोड़ें।",
    payoffProjection: "भुगतान अनुमान",
    payoffSubtitle: "न्यूनतम भुगतान पर अनुमानित महीने",
    never: "कभी नहीं (भुगतान बढ़ाएं)",
    interest: "ब्याज",
    ofLimit: "की",
    limit: "सीमा",

    // ─── Projections ───
    incomeVsExpenseForecast: "आय बनाम खर्च पूर्वानुमान",
    projected: "अनुमानित",
    annualProjections: "वार्षिक अनुमान",
    projectedIncome: "अनुमानित आय",
    projectedExpenses: "अनुमानित खर्चे",
    projectedSavings: "अनुमानित बचत",
    perMonth: "/माह",
    savingsRate: "बचत दर",
    monthlyBudgetByCategory: "श्रेणी के अनुसार मासिक बजट",
    avgMonthlySpend: "श्रेणी के अनुसार औसत मासिक खर्च",

    // ─── Settings / Data Menu ───
    settings: "सेटिंग्स",
    exportJson: "📤 JSON निर्यात करें",
    importJson: "📥 JSON आयात करें",
    resetToSamples: "🔄 नमूना डेटा पर रीसेट करें",
    clearAllData: "🗑️ सभी डेटा हटाएं",
    records: "रिकॉर्ड",
    deleteAllConfirm: "क्या आप वाकई सभी डेटा हटाना चाहते हैं? यह पूर्ववत नहीं किया जा सकता।",
    resetConfirm: "नमूना डेटा पर रीसेट करें? आपका वर्तमान डेटा बदल जाएगा।",
    invalidFileFormat: "अमान्य फ़ाइल प्रारूप।",
    couldNotReadFile: "फ़ाइल पढ़ नहीं सकी।",
    language: "🌐 भाषा",
    currency: "💱 मुद्रा",

    // ─── AI Advisor ───
    aiTitle: "Finsight AI",
    aiSubtitle: "Gemini द्वारा संचालित • आपकी वित्तीय जानकारी है",
    aiSetupTitle: "Finsight AI सलाहकार",
    aiSetupDesc: "व्यक्तिगत वित्तीय सलाह, बचत योजनाएं, कर्ज़ रणनीतियां और बजट सिफारिशें प्राप्त करें — सब आपके वास्तविक वित्तीय डेटा पर आधारित।",
    aiSetupSteps: "सेटअप — मुफ्त Gemini API Key",
    aiStep1: "जाएं",
    aiStep2: '"Create API Key" पर क्लिक करें',
    aiStep3: "कुंजी कॉपी करें और नीचे पेस्ट करें",
    aiKeyNote: "🔒 आपकी कुंजी केवल आपके डिवाइस पर संग्रहीत है — हमारे सर्वर पर कभी नहीं भेजी जाती।\nGemini एक उदार मुफ्त टियर (~1500 अनुरोध/दिन) प्रदान करता है।",
    aiConnect: "कनेक्ट करें",
    aiPasteKey: "अपनी Gemini API कुंजी पेस्ट करें",
    clearChat: "चैट साफ़ करें",
    askPlaceholder: "अपनी वित्तीय स्थिति के बारे में पूछें, लक्ष्य बनाएं, सलाह लें…",
    aiEmptyState: "अपने वित्त के बारे में कुछ भी पूछें, या एक त्वरित प्रॉम्प्ट आज़माएं:",
    analyzing: "आपकी वित्तीय स्थिति का विश्लेषण हो रहा है…",
    allModelsExhausted: "सभी मॉडल समाप्त। Google Cloud पर बिलिंग सक्षम करें ($0 बजट सेट कर सकते हैं)।",

    // ─── Quick Prompts ───
    qpSpending: "📊 खर्च विश्लेषण",
    qpSavings: "🎯 बचत लक्ष्य",
    qpDebt: "💳 कर्ज़ भुगतान योजना",
    qpHouse: "🏠 घर के लिए बचत",
    qpInvest: "📈 निवेश सलाह",
    qpEmergency: "🚨 आपातकालीन फंड",
    qpBudget: "📋 मासिक बजट",
    qpHealth: "🏖️ वित्तीय स्वास्थ्य जांच",
  },
};

// ─── Context + Provider ───
const LangContext = createContext();

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem(LANG_KEY) || "en"; } catch { return "en"; }
  });
  const [currency, setCurrency] = useState(() => {
    try { return localStorage.getItem(CURRENCY_KEY) || "USD"; } catch { return "USD"; }
  });

  useEffect(() => {
    try { localStorage.setItem(LANG_KEY, lang); } catch {}
  }, [lang]);

  useEffect(() => {
    try { localStorage.setItem(CURRENCY_KEY, currency); } catch {}
  }, [currency]);

  const t = (key) => {
    const keys = key.split(".");
    let val = translations[lang];
    for (const k of keys) {
      val = val?.[k];
    }
    return val ?? translations.en[key] ?? key;
  };

  const cur = CURRENCIES[currency] || CURRENCIES.USD;

  const formatCurrency = (amount) => {
    const abs = Math.abs(amount);
    const sign = amount < 0 ? "-" : "";
    const sym = cur.symbol;
    // For JPY, no decimals needed
    const decimals = currency === "JPY" ? 0 : 2;

    if (abs >= 1000000) return sign + sym + (abs / 1000000).toFixed(1) + "M";
    if (abs >= 100000) return sign + sym + (abs / 1000).toFixed(0) + "K";
    if (abs >= 10000) return sign + sym + (abs / 1000).toFixed(1) + "K";
    return sign + sym + abs.toFixed(decimals);
  };

  return (
    <LangContext.Provider value={{
      lang, setLang, t,
      languages: { en: "English", hi: "हिंदी" },
      currency, setCurrency, formatCurrency,
      currencies: CURRENCIES, cur,
    }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
