import { useState, useMemo, useEffect } from "react";
import AuthGate from "./AuthGate";
import {
  loadTransactions, saveTransactions,
  loadInvestments, saveInvestments,
  loadDebts, saveDebts,
  loadSettings, saveSettings,
  exportAllData, importAllData,
  clearAllData as clearAllFirebase,
} from "./dataService";

const CATEGORIES = {
  income: ["Salary", "Freelance", "Investments", "Side Hustle", "Gifts", "Other Income"],
  expense: ["Housing", "Food & Dining", "Transport", "Utilities", "Entertainment", "Healthcare", "Shopping", "Education", "Subscriptions", "Other"],
};

const CATEGORY_ICONS = {
  Salary: "💰", Freelance: "💻", Investments: "📈", "Side Hustle": "🔧", Gifts: "🎁", "Other Income": "📥",
  Housing: "🏠", "Food & Dining": "🍽️", Transport: "🚗", Utilities: "⚡", Entertainment: "🎬",
  Healthcare: "🏥", Shopping: "🛍️", Education: "📚", Subscriptions: "🔄", Other: "📦",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const generateId = () => Math.random().toString(36).substr(2, 9);

const formatCurrency = (amount) => {
  const abs = Math.abs(amount);
  if (abs >= 1000000) return (amount < 0 ? "-" : "") + "$" + (abs / 1000000).toFixed(1) + "M";
  if (abs >= 1000) return (amount < 0 ? "-" : "") + "$" + (abs / 1000).toFixed(1) + "K";
  return "$" + amount.toFixed(2);
};

const SAMPLE_DATA = [
  { id: generateId(), type: "income", category: "Salary", amount: 5200, date: "2026-02-01", note: "Monthly salary" },
  { id: generateId(), type: "income", category: "Freelance", amount: 850, date: "2026-02-03", note: "Web design project" },
  { id: generateId(), type: "expense", category: "Housing", amount: 1400, date: "2026-02-01", note: "Rent" },
  { id: generateId(), type: "expense", category: "Food & Dining", amount: 45, date: "2026-02-02", note: "Groceries" },
  { id: generateId(), type: "expense", category: "Transport", amount: 60, date: "2026-02-03", note: "Gas" },
  { id: generateId(), type: "expense", category: "Utilities", amount: 130, date: "2026-02-04", note: "Electric & Water" },
  { id: generateId(), type: "expense", category: "Entertainment", amount: 25, date: "2026-02-05", note: "Streaming" },
  { id: generateId(), type: "expense", category: "Food & Dining", amount: 38, date: "2026-02-06", note: "Restaurant" },
  { id: generateId(), type: "expense", category: "Shopping", amount: 120, date: "2026-02-07", note: "Clothes" },
  { id: generateId(), type: "income", category: "Investments", amount: 320, date: "2026-02-08", note: "Dividends" },
  { id: generateId(), type: "expense", category: "Healthcare", amount: 75, date: "2026-02-09", note: "Pharmacy" },
  { id: generateId(), type: "expense", category: "Subscriptions", amount: 55, date: "2026-02-10", note: "Software tools" },
  { id: generateId(), type: "income", category: "Salary", amount: 5200, date: "2026-01-01", note: "Monthly salary" },
  { id: generateId(), type: "income", category: "Freelance", amount: 600, date: "2026-01-10", note: "Logo design" },
  { id: generateId(), type: "expense", category: "Housing", amount: 1400, date: "2026-01-01", note: "Rent" },
  { id: generateId(), type: "expense", category: "Food & Dining", amount: 420, date: "2026-01-15", note: "Monthly groceries" },
  { id: generateId(), type: "expense", category: "Transport", amount: 180, date: "2026-01-12", note: "Car maintenance" },
  { id: generateId(), type: "expense", category: "Entertainment", amount: 90, date: "2026-01-20", note: "Concert tickets" },
  { id: generateId(), type: "expense", category: "Utilities", amount: 145, date: "2026-01-05", note: "Bills" },
  { id: generateId(), type: "expense", category: "Education", amount: 200, date: "2026-01-18", note: "Online course" },
];

// Mini bar chart component
function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ width: "100%", height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)" }} />
    </div>
  );
}

// Sparkline SVG
function Sparkline({ data, color, width = 120, height = 32 }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Donut chart
function DonutChart({ data, size = 160 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div style={{ width: size, height: size }} />;
  let cumulative = 0;
  const radius = size / 2 - 10;
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = 20;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.map((d, i) => {
        const pct = d.value / total;
        const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
        cumulative += pct;
        const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
        const largeArc = pct > 0.5 ? 1 : 0;
        const x1 = cx + radius * Math.cos(startAngle);
        const y1 = cy + radius * Math.sin(startAngle);
        const x2 = cx + radius * Math.cos(endAngle);
        const y2 = cy + radius * Math.sin(endAngle);
        const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
        return <path key={i} d={path} fill="none" stroke={d.color} strokeWidth={strokeWidth} strokeLinecap="round" opacity={0.9} />;
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" fill="#fff" fontSize={18} fontWeight={700} fontFamily="'DM Sans', sans-serif">
        {formatCurrency(total)}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={11} fontFamily="'DM Sans', sans-serif">
        total
      </text>
    </svg>
  );
}

// Projection bar chart
function ProjectionChart({ monthlyData, projectionMonths = 6 }) {
  const allMonths = [];
  const now = new Date();
  
  for (let i = -5; i <= projectionMonths; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const isProjection = i > 0;
    const data = monthlyData[key] || { income: 0, expense: 0 };
    allMonths.push({
      label: MONTHS[d.getMonth()] + (d.getFullYear() !== now.getFullYear() ? ` '${String(d.getFullYear()).slice(2)}` : ""),
      income: data.income,
      expense: data.expense,
      net: data.income - data.expense,
      isProjection,
      isCurrent: i === 0,
    });
  }

  // Simple projection: average of last 3 months
  const pastMonths = allMonths.filter(m => !m.isProjection && (m.income > 0 || m.expense > 0));
  const last3 = pastMonths.slice(-3);
  const avgIncome = last3.length > 0 ? last3.reduce((s, m) => s + m.income, 0) / last3.length : 0;
  const avgExpense = last3.length > 0 ? last3.reduce((s, m) => s + m.expense, 0) / last3.length : 0;

  allMonths.forEach(m => {
    if (m.isProjection) {
      m.income = avgIncome;
      m.expense = avgExpense;
      m.net = avgIncome - avgExpense;
    }
  });

  const maxVal = Math.max(...allMonths.map(m => Math.max(m.income, m.expense)), 1);

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <div style={{ display: "flex", gap: 6, alignItems: "flex-end", minWidth: allMonths.length * 52, height: 180, padding: "0 4px" }}>
        {allMonths.map((m, i) => (
          <div key={i} style={{ flex: 1, minWidth: 44, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, opacity: m.isProjection ? 0.55 : 1 }}>
            <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 140, width: "100%" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
                <div style={{
                  height: `${(m.income / maxVal) * 100}%`,
                  background: m.isProjection ? "repeating-linear-gradient(45deg, #22c55e33, #22c55e33 2px, transparent 2px, transparent 6px)" : "linear-gradient(180deg, #22c55e, #16a34a)",
                  borderRadius: "4px 4px 0 0",
                  minHeight: m.income > 0 ? 4 : 0,
                  border: m.isProjection ? "1px dashed #22c55e55" : "none",
                  transition: "height 0.5s cubic-bezier(0.16,1,0.3,1)",
                }} />
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
                <div style={{
                  height: `${(m.expense / maxVal) * 100}%`,
                  background: m.isProjection ? "repeating-linear-gradient(45deg, #ef444433, #ef444433 2px, transparent 2px, transparent 6px)" : "linear-gradient(180deg, #ef4444, #dc2626)",
                  borderRadius: "4px 4px 0 0",
                  minHeight: m.expense > 0 ? 4 : 0,
                  border: m.isProjection ? "1px dashed #ef444455" : "none",
                  transition: "height 0.5s cubic-bezier(0.16,1,0.3,1)",
                }} />
              </div>
            </div>
            <span style={{
              fontSize: 10,
              color: m.isCurrent ? "#a78bfa" : "rgba(255,255,255,0.35)",
              fontWeight: m.isCurrent ? 700 : 400,
              fontFamily: "'DM Sans', sans-serif",
            }}>{m.label}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 12 }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: "#22c55e", display: "inline-block" }} /> Income
        </span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: "#ef4444", display: "inline-block" }} /> Expense
        </span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 10, height: 8, borderRadius: 2, border: "1px dashed rgba(255,255,255,0.3)", display: "inline-block" }} /> Projected
        </span>
      </div>
    </div>
  );
}

const PALETTE = ["#a78bfa", "#f472b6", "#38bdf8", "#22c55e", "#facc15", "#fb923c", "#e879f9", "#34d399", "#f87171", "#818cf8"];
const INVESTMENT_TYPES = ["Stocks", "ETFs", "Bonds", "Crypto", "Real Estate", "Mutual Funds", "Commodities", "Other"];
const INVESTMENT_ICONS = { Stocks: "📊", ETFs: "📈", Bonds: "🏛️", Crypto: "₿", "Real Estate": "🏘️", "Mutual Funds": "📋", Commodities: "🪙", Other: "💼" };

const DEBT_TYPES = ["Credit Card", "Student Loan", "Mortgage", "Car Loan", "Personal Loan", "Medical Debt", "Business Loan", "Other"];
const DEBT_ICONS = { "Credit Card": "💳", "Student Loan": "🎓", Mortgage: "🏡", "Car Loan": "🚘", "Personal Loan": "🤝", "Medical Debt": "🏥", "Business Loan": "🏢", Other: "📄" };

const SAMPLE_INVESTMENTS = [
  { id: generateId(), name: "AAPL", type: "Stocks", shares: 15, purchasePrice: 178.50, currentPrice: 242.30, purchaseDate: "2024-06-15", note: "Apple Inc." },
  { id: generateId(), name: "VOO", type: "ETFs", shares: 10, purchasePrice: 420.00, currentPrice: 512.80, purchaseDate: "2024-01-10", note: "S&P 500 ETF" },
  { id: generateId(), name: "BTC", type: "Crypto", shares: 0.15, purchasePrice: 42000, currentPrice: 97500, purchaseDate: "2024-03-20", note: "Bitcoin" },
  { id: generateId(), name: "MSFT", type: "Stocks", shares: 8, purchasePrice: 380.00, currentPrice: 445.60, purchaseDate: "2025-02-01", note: "Microsoft" },
  { id: generateId(), name: "BND", type: "Bonds", shares: 25, purchasePrice: 72.50, currentPrice: 73.10, purchaseDate: "2025-06-01", note: "Total Bond Market" },
];

const SAMPLE_DEBTS = [
  { id: generateId(), name: "Chase Sapphire", type: "Credit Card", balance: 3200, interestRate: 21.99, minimumPayment: 85, creditLimit: 12000, dueDate: "2026-02-25", note: "Travel rewards card" },
  { id: generateId(), name: "Federal Student Loan", type: "Student Loan", balance: 28500, interestRate: 4.99, minimumPayment: 320, creditLimit: null, dueDate: "2026-02-15", note: "Undergraduate loans" },
  { id: generateId(), name: "Toyota Financing", type: "Car Loan", balance: 14200, interestRate: 5.49, minimumPayment: 385, creditLimit: null, dueDate: "2026-02-20", note: "2024 Camry" },
];

// ─── Sync status badge ───
function SyncBadge({ status }) {
  const config = {
    loading: { color: "#facc15", label: "Loading…", icon: "◌" },
    saved: { color: "#22c55e", label: "Synced", icon: "✓" },
    saving: { color: "#a78bfa", label: "Syncing…", icon: "↻" },
    error: { color: "#ef4444", label: "Error", icon: "!" },
  };
  const c = config[status] || config.saved;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 10, color: c.color, fontFamily: "'Space Mono', monospace",
      background: `${c.color}15`, padding: "3px 8px", borderRadius: 6,
    }}>
      <span style={{ fontSize: 11, lineHeight: 1 }}>{c.icon}</span> {c.label}
    </span>
  );
}

// ─── Main export with Auth wrapper ───
export default function App() {
  return (
    <AuthGate>
      {({ user, onLogout }) => <FinanceTracker user={user} onLogout={onLogout} />}
    </AuthGate>
  );
}

function FinanceTracker({ user, onLogout }) {
  const [transactions, setTransactions] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [debts, setDebts] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState("loading");
  const [view, setView] = useState("monthly");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTx, setNewTx] = useState({ type: "expense", category: "", amount: "", date: new Date().toISOString().slice(0, 10), note: "" });
  const [editingId, setEditingId] = useState(null);
  const [showDataMenu, setShowDataMenu] = useState(false);
  // Investment modal
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [editingInvestId, setEditingInvestId] = useState(null);
  const [newInvest, setNewInvest] = useState({ name: "", type: "", shares: "", purchasePrice: "", currentPrice: "", purchaseDate: new Date().toISOString().slice(0, 10), note: "" });
  // Debt modal
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [editingDebtId, setEditingDebtId] = useState(null);
  const [newDebt, setNewDebt] = useState({ name: "", type: "", balance: "", interestRate: "", minimumPayment: "", creditLimit: "", dueDate: "", note: "" });

  const uid = user.uid;

  // ─── Load from Firebase on mount ───
  useEffect(() => {
    (async () => {
      const stored = await loadTransactions(uid);
      if (stored && stored.length > 0) {
        setTransactions(stored);
      } else {
        setTransactions(SAMPLE_DATA);
        await saveTransactions(uid, SAMPLE_DATA);
      }
      const storedInv = await loadInvestments(uid);
      if (storedInv && storedInv.length > 0) {
        setInvestments(storedInv);
      } else {
        setInvestments(SAMPLE_INVESTMENTS);
        await saveInvestments(uid, SAMPLE_INVESTMENTS);
      }
      const storedDebt = await loadDebts(uid);
      if (storedDebt && storedDebt.length > 0) {
        setDebts(storedDebt);
      } else {
        setDebts(SAMPLE_DEBTS);
        await saveDebts(uid, SAMPLE_DEBTS);
      }
      const settings = await loadSettings(uid);
      if (settings) {
        if (settings.view) setView(settings.view);
        if (settings.activeTab) setActiveTab(settings.activeTab);
      }
      setSyncStatus("saved");
      setIsLoaded(true);
    })();
  }, [uid]);

  // ─── Auto-save transactions to Firebase ───
  useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;
    setSyncStatus("saving");
    const timer = setTimeout(async () => {
      const ok = await saveTransactions(uid, transactions);
      if (!cancelled) setSyncStatus(ok ? "saved" : "error");
    }, 500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [transactions, isLoaded, uid]);

  // ─── Auto-save investments ───
  useEffect(() => {
    if (!isLoaded) return;
    const timer = setTimeout(() => { saveInvestments(uid, investments); }, 500);
    return () => clearTimeout(timer);
  }, [investments, isLoaded, uid]);

  // ─── Auto-save debts ───
  useEffect(() => {
    if (!isLoaded) return;
    const timer = setTimeout(() => { saveDebts(uid, debts); }, 500);
    return () => clearTimeout(timer);
  }, [debts, isLoaded, uid]);

  // ─── Save view/tab settings periodically ───
  useEffect(() => {
    if (!isLoaded) return;
    const timer = setTimeout(() => {
      saveSettings(uid, { view, activeTab });
    }, 500);
    return () => clearTimeout(timer);
  }, [view, activeTab, isLoaded, uid]);

  // ─── Investment CRUD ───
  const addInvestment = () => {
    if (!newInvest.name || !newInvest.type || !newInvest.shares || !newInvest.purchasePrice || !newInvest.currentPrice) return;
    const entry = { ...newInvest, shares: parseFloat(newInvest.shares), purchasePrice: parseFloat(newInvest.purchasePrice), currentPrice: parseFloat(newInvest.currentPrice) };
    if (editingInvestId) {
      setInvestments(prev => prev.map(i => i.id === editingInvestId ? { ...i, ...entry } : i));
      setEditingInvestId(null);
    } else {
      setInvestments(prev => [...prev, { ...entry, id: generateId() }]);
    }
    setNewInvest({ name: "", type: "", shares: "", purchasePrice: "", currentPrice: "", purchaseDate: new Date().toISOString().slice(0, 10), note: "" });
    setShowInvestModal(false);
  };

  const editInvestment = (inv) => {
    setNewInvest({ name: inv.name, type: inv.type, shares: inv.shares.toString(), purchasePrice: inv.purchasePrice.toString(), currentPrice: inv.currentPrice.toString(), purchaseDate: inv.purchaseDate, note: inv.note });
    setEditingInvestId(inv.id);
    setShowInvestModal(true);
  };

  const deleteInvestment = (id) => setInvestments(prev => prev.filter(i => i.id !== id));

  // ─── Debt CRUD ───
  const addDebt = () => {
    if (!newDebt.name || !newDebt.type || !newDebt.balance || !newDebt.interestRate) return;
    const entry = {
      ...newDebt,
      balance: parseFloat(newDebt.balance),
      interestRate: parseFloat(newDebt.interestRate),
      minimumPayment: newDebt.minimumPayment ? parseFloat(newDebt.minimumPayment) : 0,
      creditLimit: newDebt.creditLimit ? parseFloat(newDebt.creditLimit) : null,
    };
    if (editingDebtId) {
      setDebts(prev => prev.map(d => d.id === editingDebtId ? { ...d, ...entry } : d));
      setEditingDebtId(null);
    } else {
      setDebts(prev => [...prev, { ...entry, id: generateId() }]);
    }
    setNewDebt({ name: "", type: "", balance: "", interestRate: "", minimumPayment: "", creditLimit: "", dueDate: "", note: "" });
    setShowDebtModal(false);
  };

  const editDebt = (debt) => {
    setNewDebt({ name: debt.name, type: debt.type, balance: debt.balance.toString(), interestRate: debt.interestRate.toString(), minimumPayment: debt.minimumPayment?.toString() || "", creditLimit: debt.creditLimit?.toString() || "", dueDate: debt.dueDate || "", note: debt.note });
    setEditingDebtId(debt.id);
    setShowDebtModal(true);
  };

  const deleteDebt = (id) => setDebts(prev => prev.filter(d => d.id !== id));

  // ─── Computed: Portfolio & Debt totals ───
  const portfolioStats = useMemo(() => {
    const totalValue = investments.reduce((s, i) => s + (i.shares * i.currentPrice), 0);
    const totalCost = investments.reduce((s, i) => s + (i.shares * i.purchasePrice), 0);
    const totalGain = totalValue - totalCost;
    const gainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
    return { totalValue, totalCost, totalGain, gainPct };
  }, [investments]);

  const debtStats = useMemo(() => {
    const totalDebt = debts.reduce((s, d) => s + d.balance, 0);
    const totalMinPayment = debts.reduce((s, d) => s + (d.minimumPayment || 0), 0);
    const avgRate = debts.length > 0 ? debts.reduce((s, d) => s + d.interestRate, 0) / debts.length : 0;
    const totalCreditLimit = debts.filter(d => d.creditLimit).reduce((s, d) => s + d.creditLimit, 0);
    const creditUsed = totalCreditLimit > 0 ? (debts.filter(d => d.creditLimit).reduce((s, d) => s + d.balance, 0) / totalCreditLimit) * 100 : 0;
    return { totalDebt, totalMinPayment, avgRate, totalCreditLimit, creditUsed };
  }, [debts]);

  const netWorth = useMemo(() => {
    return portfolioStats.totalValue - debtStats.totalDebt;
  }, [portfolioStats, debtStats]);

  // ─── Data management functions ───
  const exportData = async () => {
    const data = await exportAllData(uid);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `finsight-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(url);
    setShowDataMenu(false);
  };

  const importData = () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".json";
    input.onchange = async (e) => {
      try {
        const text = await e.target.files[0].text();
        const data = JSON.parse(text);
        if (data.transactions) {
          await importAllData(uid, data);
          setTransactions(data.transactions || []);
          if (data.investments) setInvestments(data.investments);
          if (data.debts) setDebts(data.debts);
        } else if (Array.isArray(data)) {
          setTransactions(data);
          await saveTransactions(uid, data);
        } else {
          alert("Invalid file format.");
        }
      } catch { alert("Could not read file."); }
    };
    input.click();
    setShowDataMenu(false);
  };

  const clearAllData = async () => {
    if (confirm("Are you sure you want to delete ALL data? This cannot be undone.")) {
      await clearAllFirebase(uid);
      setTransactions([]); setInvestments([]); setDebts([]);
      setShowDataMenu(false);
    }
  };

  const resetToSample = async () => {
    if (confirm("Reset to sample data? Your current data will be replaced.")) {
      setTransactions(SAMPLE_DATA); setInvestments(SAMPLE_INVESTMENTS); setDebts(SAMPLE_DEBTS);
      await importAllData(uid, { transactions: SAMPLE_DATA, investments: SAMPLE_INVESTMENTS, debts: SAMPLE_DEBTS });
      setShowDataMenu(false);
    }
  };

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      if (view === "daily") return tx.date === selectedDate;
      if (view === "monthly") return tx.date.slice(0, 7) === selectedMonth;
      if (view === "yearly") return tx.date.slice(0, 4) === selectedYear;
      return true;
    });
  }, [transactions, view, selectedDate, selectedMonth, selectedYear]);

  const stats = useMemo(() => {
    const income = filtered.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = filtered.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { income, expense, net: income - expense, count: filtered.length };
  }, [filtered]);

  const categoryBreakdown = useMemo(() => {
    const map = {};
    filtered.forEach(tx => {
      if (!map[tx.category]) map[tx.category] = { total: 0, type: tx.type, count: 0 };
      map[tx.category].total += tx.amount;
      map[tx.category].count++;
    });
    return Object.entries(map)
      .map(([name, data], i) => ({ name, ...data, color: PALETTE[i % PALETTE.length] }))
      .sort((a, b) => b.total - a.total);
  }, [filtered]);

  const monthlyData = useMemo(() => {
    const map = {};
    transactions.forEach(tx => {
      const key = tx.date.slice(0, 7);
      if (!map[key]) map[key] = { income: 0, expense: 0 };
      map[key][tx.type] += tx.amount;
    });
    return map;
  }, [transactions]);

  const dailyTrend = useMemo(() => {
    if (view !== "monthly") return [];
    const days = {};
    filtered.forEach(tx => {
      const d = parseInt(tx.date.slice(8, 10));
      if (!days[d]) days[d] = 0;
      days[d] += tx.type === "income" ? tx.amount : -tx.amount;
    });
    const arr = [];
    let cum = 0;
    for (let i = 1; i <= 31; i++) {
      cum += days[i] || 0;
      arr.push(cum);
    }
    return arr;
  }, [filtered, view]);

  // Yearly projection
  const yearlyProjection = useMemo(() => {
    const monthKeys = Object.keys(monthlyData).sort();
    const last3 = monthKeys.slice(-3);
    const avgIncome = last3.length > 0 ? last3.reduce((s, k) => s + monthlyData[k].income, 0) / last3.length : 0;
    const avgExpense = last3.length > 0 ? last3.reduce((s, k) => s + monthlyData[k].expense, 0) / last3.length : 0;
    return {
      monthlyIncome: avgIncome,
      monthlyExpense: avgExpense,
      annualIncome: avgIncome * 12,
      annualExpense: avgExpense * 12,
      annualNet: (avgIncome - avgExpense) * 12,
      savingsRate: avgIncome > 0 ? ((avgIncome - avgExpense) / avgIncome * 100) : 0,
    };
  }, [monthlyData]);

  const addTransaction = () => {
    if (!newTx.category || !newTx.amount) return;
    if (editingId) {
      setTransactions(prev => prev.map(t => t.id === editingId ? { ...t, ...newTx, amount: parseFloat(newTx.amount) } : t));
      setEditingId(null);
    } else {
      setTransactions(prev => [...prev, { ...newTx, id: generateId(), amount: parseFloat(newTx.amount) }]);
    }
    setNewTx({ type: "expense", category: "", amount: "", date: new Date().toISOString().slice(0, 10), note: "" });
    setShowAddModal(false);
  };

  const deleteTransaction = (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const editTransaction = (tx) => {
    setNewTx({ type: tx.type, category: tx.category, amount: tx.amount.toString(), date: tx.date, note: tx.note });
    setEditingId(tx.id);
    setShowAddModal(true);
  };

  const cardStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16,
    padding: 20,
    backdropFilter: "blur(20px)",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(145deg, #0a0a0f 0%, #0d0d1a 30%, #111127 60%, #0a0a0f 100%)",
      color: "#fff",
      fontFamily: "'DM Sans', sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      {/* Ambient glow */}
      <div style={{
        position: "fixed", top: -200, right: -200, width: 500, height: 500,
        background: "radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "fixed", bottom: -150, left: -150, width: 400, height: 400,
        background: "radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* Loading screen */}
      {!isLoaded ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          minHeight: "80vh", gap: 16, position: "relative", zIndex: 1,
        }}>
          <div style={{
            width: 48, height: 48, border: "3px solid rgba(167,139,250,0.15)",
            borderTopColor: "#a78bfa", borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", fontFamily: "'DM Sans', sans-serif" }}>
            Loading your finances…
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
      <>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px 100px", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: "-0.02em", background: "linear-gradient(135deg, #fff 30%, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Finsight
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0, fontFamily: "'Space Mono', monospace" }}>
                {user?.displayName ? `Hi, ${user.displayName}` : user?.email ? `Hi, ${user.email.split("@")[0]}` : "Financial Tracker"}
              </p>
              <SyncBadge status={syncStatus} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Data & Account menu */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowDataMenu(!showDataMenu)}
                style={{
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10, padding: "8px 10px", cursor: "pointer", color: "rgba(255,255,255,0.5)",
                  fontSize: 16, lineHeight: 1, transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif",
                }}
                title="Settings"
              >⚙</button>
              {showDataMenu && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setShowDataMenu(false)} />
                  <div style={{
                    position: "absolute", top: "100%", right: 0, marginTop: 6, zIndex: 50,
                    background: "linear-gradient(180deg, #1e1e35, #14142a)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 14, padding: 6, minWidth: 200, boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
                  }}>
                    {/* Account section */}
                    <div style={{ padding: "8px 12px 6px", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 8,
                          background: "linear-gradient(135deg, rgba(167,139,250,0.3), rgba(129,140,248,0.3))",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 700, color: "#a78bfa",
                        }}>{(user?.displayName || user?.email || "?")[0]?.toUpperCase()}</div>
                        <div>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#fff" }}>{user?.displayName || user?.email?.split("@")[0] || "User"}</p>
                          <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'Space Mono', monospace" }}>
                            {user?.email || ""}
                          </p>
                        </div>
                      </div>
                    </div>
                    {[
                      { label: "📤 Export JSON", action: exportData },
                      { label: "📥 Import JSON", action: importData },
                      { label: "🔄 Reset to samples", action: resetToSample },
                      { label: "🗑️ Clear all data", action: clearAllData, danger: true },
                    ].map((item, i) => (
                      <button key={i} onClick={item.action} style={{
                        display: "block", width: "100%", textAlign: "left",
                        background: "transparent", border: "none", borderRadius: 10,
                        padding: "10px 12px", cursor: "pointer",
                        color: item.danger ? "#ef4444" : "rgba(255,255,255,0.7)",
                        fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                        transition: "background 0.15s",
                      }}
                        onMouseEnter={e => e.target.style.background = "rgba(255,255,255,0.06)"}
                        onMouseLeave={e => e.target.style.background = "transparent"}
                      >{item.label}</button>
                    ))}
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "4px 0" }}>
                      <button onClick={() => { onLogout(); setShowDataMenu(false); }} style={{
                        display: "block", width: "100%", textAlign: "left",
                        background: "transparent", border: "none", borderRadius: 10,
                        padding: "10px 12px", cursor: "pointer",
                        color: "#fb923c",
                        fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                        transition: "background 0.15s",
                      }}
                        onMouseEnter={e => e.target.style.background = "rgba(255,255,255,0.06)"}
                        onMouseLeave={e => e.target.style.background = "transparent"}
                      >🚪 Sign Out</button>
                    </div>
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "6px 12px" }}>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "'Space Mono', monospace" }}>
                        {transactions.length} records stored
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => { setEditingId(null); setNewTx({ type: "expense", category: "", amount: "", date: new Date().toISOString().slice(0, 10), note: "" }); setShowAddModal(true); }}
              style={{
                background: "linear-gradient(135deg, #a78bfa, #818cf8)",
                border: "none", borderRadius: 12, padding: "10px 18px",
                color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer",
                boxShadow: "0 4px 20px rgba(167,139,250,0.3)",
                transition: "transform 0.2s",
                fontFamily: "'DM Sans', sans-serif",
              }}
              onMouseEnter={e => e.target.style.transform = "scale(1.05)"}
              onMouseLeave={e => e.target.style.transform = "scale(1)"}
            >
              + Add
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div style={{ display: "flex", gap: 3, marginBottom: 16, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 4, overflowX: "auto" }}>
          {["dashboard", "transactions", "investments", "debts", "projections"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              flex: 1, padding: "10px 6px", border: "none", borderRadius: 10, cursor: "pointer",
              background: activeTab === tab ? "rgba(167,139,250,0.15)" : "transparent",
              color: activeTab === tab ? "#a78bfa" : "rgba(255,255,255,0.4)",
              fontWeight: 600, fontSize: 12, textTransform: "capitalize", whiteSpace: "nowrap",
              transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif",
            }}>{tab}</button>
          ))}
        </div>

        {/* Time Period Selector */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 3 }}>
            {["daily", "monthly", "yearly"].map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: "6px 14px", border: "none", borderRadius: 8, cursor: "pointer",
                background: view === v ? "rgba(255,255,255,0.1)" : "transparent",
                color: view === v ? "#fff" : "rgba(255,255,255,0.35)",
                fontWeight: 500, fontSize: 12, fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.2s",
              }}>{v}</button>
            ))}
          </div>
          {view === "daily" && (
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 12px", color: "#fff", fontSize: 12, fontFamily: "'Space Mono', monospace" }} />
          )}
          {view === "monthly" && (
            <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 12px", color: "#fff", fontSize: 12, fontFamily: "'Space Mono', monospace" }} />
          )}
          {view === "yearly" && (
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 12px", color: "#fff", fontSize: 12, fontFamily: "'Space Mono', monospace" }}>
              {["2024", "2025", "2026", "2027"].map(y => <option key={y} value={y} style={{ background: "#1a1a2e" }}>{y}</option>)}
            </select>
          )}
        </div>

        {/* ===== DASHBOARD ===== */}
        {activeTab === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Stats Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { label: "Income", value: stats.income, color: "#22c55e", icon: "↗" },
                { label: "Expenses", value: stats.expense, color: "#ef4444", icon: "↙" },
                { label: "Net", value: stats.net, color: stats.net >= 0 ? "#22c55e" : "#ef4444", icon: stats.net >= 0 ? "✦" : "▾" },
              ].map((s, i) => (
                <div key={i} style={{ ...cardStyle, padding: 16, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: -10, right: -10, fontSize: 48, opacity: 0.05, fontWeight: 700 }}>{s.icon}</div>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 6px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</p>
                  <p style={{ fontSize: 22, fontWeight: 700, margin: 0, color: s.color, fontFamily: "'Space Mono', monospace" }}>
                    {formatCurrency(s.value)}
                  </p>
                </div>
              ))}
            </div>

            {/* Net Worth / Portfolio / Debt Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              <div style={{ ...cardStyle, padding: 16, position: "relative", overflow: "hidden", background: "linear-gradient(135deg, rgba(167,139,250,0.08), rgba(129,140,248,0.04))", border: "1px solid rgba(167,139,250,0.15)" }}>
                <div style={{ position: "absolute", top: -10, right: -10, fontSize: 48, opacity: 0.06, fontWeight: 700 }}>◈</div>
                <p style={{ fontSize: 11, color: "rgba(167,139,250,0.7)", margin: "0 0 6px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Net Worth</p>
                <p style={{ fontSize: 22, fontWeight: 700, margin: 0, color: netWorth >= 0 ? "#a78bfa" : "#ef4444", fontFamily: "'Space Mono', monospace" }}>
                  {formatCurrency(netWorth)}
                </p>
              </div>
              <div onClick={() => setActiveTab("investments")} style={{ ...cardStyle, padding: 16, position: "relative", overflow: "hidden", cursor: "pointer", transition: "border-color 0.2s" }}>
                <div style={{ position: "absolute", top: -10, right: -10, fontSize: 48, opacity: 0.05, fontWeight: 700 }}>📈</div>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 6px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Portfolio</p>
                <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#38bdf8", fontFamily: "'Space Mono', monospace" }}>
                  {formatCurrency(portfolioStats.totalValue)}
                </p>
                <p style={{ fontSize: 11, margin: "4px 0 0", color: portfolioStats.totalGain >= 0 ? "#22c55e" : "#ef4444", fontFamily: "'Space Mono', monospace" }}>
                  {portfolioStats.totalGain >= 0 ? "+" : ""}{formatCurrency(portfolioStats.totalGain)} ({portfolioStats.gainPct.toFixed(1)}%)
                </p>
              </div>
              <div onClick={() => setActiveTab("debts")} style={{ ...cardStyle, padding: 16, position: "relative", overflow: "hidden", cursor: "pointer", transition: "border-color 0.2s" }}>
                <div style={{ position: "absolute", top: -10, right: -10, fontSize: 48, opacity: 0.05, fontWeight: 700 }}>💳</div>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 6px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Debt</p>
                <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#fb923c", fontFamily: "'Space Mono', monospace" }}>
                  {formatCurrency(debtStats.totalDebt)}
                </p>
                <p style={{ fontSize: 11, margin: "4px 0 0", color: "rgba(255,255,255,0.35)", fontFamily: "'Space Mono', monospace" }}>
                  {formatCurrency(debtStats.totalMinPayment)}/mo min
                </p>
              </div>
            </div>

            {/* Trend Sparkline */}
            {view === "monthly" && dailyTrend.length > 0 && (
              <div style={cardStyle}>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 12px", fontWeight: 500 }}>Cumulative Cash Flow</p>
                <Sparkline data={dailyTrend} color="#a78bfa" width={800} height={48} />
              </div>
            )}

            {/* Category Breakdown */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {/* Expense breakdown */}
              <div style={cardStyle}>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 16px", fontWeight: 500 }}>Expense Breakdown</p>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                  <DonutChart
                    data={categoryBreakdown.filter(c => c.type === "expense").map(c => ({ value: c.total, color: c.color }))}
                    size={140}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {categoryBreakdown.filter(c => c.type === "expense").slice(0, 5).map((c, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14 }}>{CATEGORY_ICONS[c.name] || "•"}</span>
                      <span style={{ flex: 1, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{c.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "'Space Mono', monospace", color: c.color }}>
                        {formatCurrency(c.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Income breakdown */}
              <div style={cardStyle}>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 16px", fontWeight: 500 }}>Income Sources</p>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                  <DonutChart
                    data={categoryBreakdown.filter(c => c.type === "income").map(c => ({ value: c.total, color: c.color }))}
                    size={140}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {categoryBreakdown.filter(c => c.type === "income").map((c, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14 }}>{CATEGORY_ICONS[c.name] || "•"}</span>
                      <span style={{ flex: 1, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{c.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "'Space Mono', monospace", color: c.color }}>
                        {formatCurrency(c.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div style={cardStyle}>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 12px", fontWeight: 500 }}>Recent Transactions</p>
              {filtered.slice(-5).reverse().map(tx => (
                <div key={tx.id} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}>
                  <span style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: tx.type === "income" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                  }}>
                    {CATEGORY_ICONS[tx.category] || "📦"}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>{tx.category}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{tx.note}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{
                      margin: 0, fontSize: 14, fontWeight: 600,
                      fontFamily: "'Space Mono', monospace",
                      color: tx.type === "income" ? "#22c55e" : "#ef4444",
                    }}>
                      {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                    </p>
                    <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "'Space Mono', monospace" }}>{tx.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== TRANSACTIONS ===== */}
        {activeTab === "transactions" && (
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{filtered.length} Transactions</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0, fontFamily: "'Space Mono', monospace" }}>
                Net: <span style={{ color: stats.net >= 0 ? "#22c55e" : "#ef4444" }}>{formatCurrency(stats.net)}</span>
              </p>
            </div>
            {filtered.length === 0 && (
              <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", padding: 40, fontSize: 13 }}>
                No transactions for this period. Tap + Add to get started.
              </p>
            )}
            {[...filtered].sort((a, b) => b.date.localeCompare(a.date)).map(tx => (
              <div key={tx.id} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 0",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}>
                <span style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: tx.type === "income" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                  flexShrink: 0,
                }}>
                  {CATEGORY_ICONS[tx.category] || "📦"}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{tx.category}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.note}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{
                    margin: 0, fontSize: 15, fontWeight: 600,
                    fontFamily: "'Space Mono', monospace",
                    color: tx.type === "income" ? "#22c55e" : "#ef4444",
                  }}>
                    {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                  </p>
                  <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "'Space Mono', monospace" }}>{tx.date}</p>
                </div>
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <button onClick={() => editTransaction(tx)} style={{
                    background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8,
                    padding: "6px 8px", cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: 12,
                  }}>✎</button>
                  <button onClick={() => deleteTransaction(tx.id)} style={{
                    background: "rgba(239,68,68,0.1)", border: "none", borderRadius: 8,
                    padding: "6px 8px", cursor: "pointer", color: "#ef4444", fontSize: 12,
                  }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== INVESTMENTS ===== */}
        {activeTab === "investments" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Portfolio Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              {[
                { label: "Total Value", value: portfolioStats.totalValue, color: "#38bdf8" },
                { label: "Total Cost", value: portfolioStats.totalCost, color: "rgba(255,255,255,0.5)" },
                { label: "Total Gain/Loss", value: portfolioStats.totalGain, color: portfolioStats.totalGain >= 0 ? "#22c55e" : "#ef4444", prefix: portfolioStats.totalGain >= 0 ? "+" : "" },
                { label: "Return %", value: null, display: `${portfolioStats.gainPct >= 0 ? "+" : ""}${portfolioStats.gainPct.toFixed(2)}%`, color: portfolioStats.gainPct >= 0 ? "#22c55e" : "#ef4444" },
              ].map((s, i) => (
                <div key={i} style={{ ...cardStyle, padding: 16 }}>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 6px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</p>
                  <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color: s.color, fontFamily: "'Space Mono', monospace" }}>
                    {s.display || ((s.prefix || "") + formatCurrency(s.value))}
                  </p>
                </div>
              ))}
            </div>

            {/* Add Investment Button */}
            <button onClick={() => { setEditingInvestId(null); setNewInvest({ name: "", type: "", shares: "", purchasePrice: "", currentPrice: "", purchaseDate: new Date().toISOString().slice(0, 10), note: "" }); setShowInvestModal(true); }} style={{
              background: "rgba(56,189,248,0.1)", border: "1px dashed rgba(56,189,248,0.3)",
              borderRadius: 14, padding: "14px 0", cursor: "pointer", color: "#38bdf8",
              fontWeight: 600, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.2s",
            }}>+ Add Investment</button>

            {/* Holdings list */}
            <div style={cardStyle}>
              <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 16px" }}>Holdings ({investments.length})</p>
              {investments.length === 0 && (
                <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", padding: 30, fontSize: 13 }}>No investments yet. Add your first holding above.</p>
              )}
              {investments.map(inv => {
                const value = inv.shares * inv.currentPrice;
                const cost = inv.shares * inv.purchasePrice;
                const gain = value - cost;
                const gainPct = cost > 0 ? (gain / cost) * 100 : 0;
                return (
                  <div key={inv.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{
                      width: 42, height: 42, borderRadius: 12,
                      background: "rgba(56,189,248,0.1)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
                    }}>{INVESTMENT_ICONS[inv.type] || "💼"}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{inv.name}</p>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: 4 }}>{inv.type}</span>
                      </div>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                        {inv.shares} shares @ {formatCurrency(inv.purchasePrice)} → {formatCurrency(inv.currentPrice)}
                      </p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 600, fontFamily: "'Space Mono', monospace", color: "#38bdf8" }}>{formatCurrency(value)}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, fontWeight: 600, fontFamily: "'Space Mono', monospace", color: gain >= 0 ? "#22c55e" : "#ef4444" }}>
                        {gain >= 0 ? "+" : ""}{formatCurrency(gain)} ({gainPct.toFixed(1)}%)
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <button onClick={() => editInvestment(inv)} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: 12 }}>✎</button>
                      <button onClick={() => deleteInvestment(inv.id)} style={{ background: "rgba(239,68,68,0.1)", border: "none", borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: "#ef4444", fontSize: 12 }}>✕</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Allocation Donut */}
            {investments.length > 0 && (
              <div style={cardStyle}>
                <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 16px" }}>Allocation by Type</p>
                <div style={{ display: "flex", alignItems: "center", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
                  <DonutChart
                    data={(() => {
                      const byType = {};
                      investments.forEach(inv => {
                        const val = inv.shares * inv.currentPrice;
                        byType[inv.type] = (byType[inv.type] || 0) + val;
                      });
                      return Object.entries(byType).map(([name, value], i) => ({ value, color: PALETTE[i % PALETTE.length] }));
                    })()}
                    size={150}
                  />
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {(() => {
                      const byType = {};
                      investments.forEach(inv => { const val = inv.shares * inv.currentPrice; byType[inv.type] = (byType[inv.type] || 0) + val; });
                      const total = Object.values(byType).reduce((s, v) => s + v, 0);
                      return Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([name, value], i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: PALETTE[i % PALETTE.length], display: "inline-block" }} />
                          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", minWidth: 90 }}>{INVESTMENT_ICONS[name]} {name}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "'Space Mono', monospace", color: "#38bdf8" }}>{formatCurrency(value)}</span>
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>({(value / total * 100).toFixed(0)}%)</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== DEBTS ===== */}
        {activeTab === "debts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Debt Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              {[
                { label: "Total Debt", value: debtStats.totalDebt, color: "#fb923c" },
                { label: "Monthly Minimum", value: debtStats.totalMinPayment, color: "#f87171" },
                { label: "Avg Interest Rate", value: null, display: debtStats.avgRate.toFixed(2) + "%", color: "#facc15" },
                { label: "Credit Utilization", value: null, display: debtStats.creditUsed.toFixed(0) + "%", color: debtStats.creditUsed > 30 ? "#ef4444" : "#22c55e" },
              ].map((s, i) => (
                <div key={i} style={{ ...cardStyle, padding: 16 }}>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 6px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</p>
                  <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color: s.color, fontFamily: "'Space Mono', monospace" }}>
                    {s.display || formatCurrency(s.value)}
                  </p>
                  {s.label === "Credit Utilization" && (
                    <MiniBar value={debtStats.creditUsed} max={100} color={debtStats.creditUsed > 30 ? "#ef4444" : "#22c55e"} />
                  )}
                </div>
              ))}
            </div>

            {/* Add Debt Button */}
            <button onClick={() => { setEditingDebtId(null); setNewDebt({ name: "", type: "", balance: "", interestRate: "", minimumPayment: "", creditLimit: "", dueDate: "", note: "" }); setShowDebtModal(true); }} style={{
              background: "rgba(251,146,60,0.1)", border: "1px dashed rgba(251,146,60,0.3)",
              borderRadius: 14, padding: "14px 0", cursor: "pointer", color: "#fb923c",
              fontWeight: 600, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.2s",
            }}>+ Add Debt</button>

            {/* Debt list */}
            <div style={cardStyle}>
              <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 16px" }}>Debts ({debts.length})</p>
              {debts.length === 0 && (
                <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", padding: 30, fontSize: 13 }}>No debts tracked. Add one above.</p>
              )}
              {[...debts].sort((a, b) => b.interestRate - a.interestRate).map(debt => {
                const utilization = debt.creditLimit ? (debt.balance / debt.creditLimit) * 100 : null;
                return (
                  <div key={debt.id} style={{ padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{
                        width: 42, height: 42, borderRadius: 12,
                        background: "rgba(251,146,60,0.1)",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
                      }}>{DEBT_ICONS[debt.type] || "📄"}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{debt.name}</p>
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: 4 }}>{debt.type}</span>
                        </div>
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                          {debt.interestRate}% APR • {formatCurrency(debt.minimumPayment || 0)}/mo min{debt.dueDate ? ` • Due ${debt.dueDate}` : ""}
                        </p>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p style={{ margin: 0, fontSize: 16, fontWeight: 700, fontFamily: "'Space Mono', monospace", color: "#fb923c" }}>
                          {formatCurrency(debt.balance)}
                        </p>
                        {debt.creditLimit && (
                          <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'Space Mono', monospace" }}>
                            of {formatCurrency(debt.creditLimit)} limit
                          </p>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                        <button onClick={() => editDebt(debt)} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: 12 }}>✎</button>
                        <button onClick={() => deleteDebt(debt.id)} style={{ background: "rgba(239,68,68,0.1)", border: "none", borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: "#ef4444", fontSize: 12 }}>✕</button>
                      </div>
                    </div>
                    {utilization !== null && (
                      <div style={{ marginTop: 8, marginLeft: 54 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Utilization</span>
                          <span style={{ fontSize: 10, color: utilization > 30 ? "#ef4444" : "#22c55e", fontFamily: "'Space Mono', monospace" }}>{utilization.toFixed(0)}%</span>
                        </div>
                        <MiniBar value={utilization} max={100} color={utilization > 30 ? "#ef4444" : utilization > 10 ? "#facc15" : "#22c55e"} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Payoff Projection */}
            {debts.length > 0 && (
              <div style={cardStyle}>
                <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>Payoff Projection</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "0 0 16px" }}>Estimated months to pay off at minimum payments</p>
                {debts.map((debt, i) => {
                  let months = 0;
                  if (debt.minimumPayment > 0 && debt.interestRate > 0) {
                    const monthlyRate = debt.interestRate / 100 / 12;
                    const payment = debt.minimumPayment;
                    const balance = debt.balance;
                    if (payment > balance * monthlyRate) {
                      months = Math.ceil(-Math.log(1 - (balance * monthlyRate / payment)) / Math.log(1 + monthlyRate));
                    } else {
                      months = 999; // never pays off
                    }
                  } else if (debt.minimumPayment > 0) {
                    months = Math.ceil(debt.balance / debt.minimumPayment);
                  }
                  const years = Math.floor(months / 12);
                  const remainMonths = months % 12;
                  const timeStr = months >= 999 ? "Never (increase payments)" : years > 0 ? `${years}y ${remainMonths}m` : `${remainMonths}m`;
                  const totalInterest = months < 999 && debt.interestRate > 0 ? (debt.minimumPayment * months) - debt.balance : 0;
                  return (
                    <div key={debt.id} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", gap: 6 }}>
                          {DEBT_ICONS[debt.type]} {debt.name}
                        </span>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "'Space Mono', monospace", color: months >= 999 ? "#ef4444" : "#fb923c" }}>{timeStr}</span>
                          {totalInterest > 0 && (
                            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginLeft: 8 }}>({formatCurrency(totalInterest)} interest)</span>
                          )}
                        </div>
                      </div>
                      <MiniBar value={months >= 999 ? 100 : Math.min(months, 360)} max={360} color={months > 120 ? "#ef4444" : months > 60 ? "#facc15" : "#22c55e"} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===== PROJECTIONS ===== */}
        {activeTab === "projections" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Projection Chart */}
            <div style={cardStyle}>
              <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>Income vs Expense Forecast</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "0 0 16px" }}>Based on 3-month rolling average</p>
              <ProjectionChart monthlyData={monthlyData} />
            </div>

            {/* Projection Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={cardStyle}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Projected Annual Income</p>
                <p style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "#22c55e", fontFamily: "'Space Mono', monospace" }}>
                  {formatCurrency(yearlyProjection.annualIncome)}
                </p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "4px 0 0" }}>
                  ~{formatCurrency(yearlyProjection.monthlyIncome)}/mo
                </p>
              </div>
              <div style={cardStyle}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Projected Annual Expense</p>
                <p style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "#ef4444", fontFamily: "'Space Mono', monospace" }}>
                  {formatCurrency(yearlyProjection.annualExpense)}
                </p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "4px 0 0" }}>
                  ~{formatCurrency(yearlyProjection.monthlyExpense)}/mo
                </p>
              </div>
              <div style={cardStyle}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Projected Annual Savings</p>
                <p style={{
                  fontSize: 24, fontWeight: 700, margin: 0, fontFamily: "'Space Mono', monospace",
                  color: yearlyProjection.annualNet >= 0 ? "#22c55e" : "#ef4444",
                }}>
                  {formatCurrency(yearlyProjection.annualNet)}
                </p>
              </div>
              <div style={cardStyle}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Savings Rate</p>
                <p style={{
                  fontSize: 24, fontWeight: 700, margin: 0, fontFamily: "'Space Mono', monospace",
                  color: yearlyProjection.savingsRate >= 20 ? "#22c55e" : yearlyProjection.savingsRate >= 10 ? "#facc15" : "#ef4444",
                }}>
                  {yearlyProjection.savingsRate.toFixed(1)}%
                </p>
                <MiniBar value={yearlyProjection.savingsRate} max={50} color={yearlyProjection.savingsRate >= 20 ? "#22c55e" : "#facc15"} />
              </div>
            </div>

            {/* Category Projections */}
            <div style={cardStyle}>
              <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>Monthly Budget Analysis</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "0 0 16px" }}>Average monthly spend by category</p>
              {(() => {
                const monthCount = Math.max(Object.keys(monthlyData).length, 1);
                const catAvg = {};
                transactions.filter(t => t.type === "expense").forEach(tx => {
                  if (!catAvg[tx.category]) catAvg[tx.category] = 0;
                  catAvg[tx.category] += tx.amount;
                });
                const entries = Object.entries(catAvg).map(([name, total]) => ({ name, avg: total / monthCount })).sort((a, b) => b.avg - a.avg);
                const maxAvg = entries.length > 0 ? entries[0].avg : 1;
                return entries.map((e, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", gap: 6 }}>
                        {CATEGORY_ICONS[e.name] || "📦"} {e.name}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "'Space Mono', monospace", color: "#f87171" }}>
                        {formatCurrency(e.avg)}/mo
                      </span>
                    </div>
                    <MiniBar value={e.avg} max={maxAvg} color={PALETTE[i % PALETTE.length]} />
                  </div>
                ));
              })()}
            </div>
          </div>
        )}
      </div>

      {/* ===== ADD/EDIT MODAL ===== */}
      {showAddModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100,
        }} onClick={() => setShowAddModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "linear-gradient(180deg, #1a1a2e, #0f0f1a)",
            borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 500,
            padding: 24, maxHeight: "80vh", overflowY: "auto",
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            <div style={{ width: 40, height: 4, background: "rgba(255,255,255,0.15)", borderRadius: 2, margin: "0 auto 20px" }} />
            <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700 }}>
              {editingId ? "Edit Transaction" : "New Transaction"}
            </h3>

            {/* Type Toggle */}
            <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 4 }}>
              {["income", "expense"].map(t => (
                <button key={t} onClick={() => setNewTx(prev => ({ ...prev, type: t, category: "" }))} style={{
                  flex: 1, padding: "10px 0", border: "none", borderRadius: 10, cursor: "pointer",
                  background: newTx.type === t ? (t === "income" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)") : "transparent",
                  color: newTx.type === t ? (t === "income" ? "#22c55e" : "#ef4444") : "rgba(255,255,255,0.4)",
                  fontWeight: 600, fontSize: 14, textTransform: "capitalize",
                  fontFamily: "'DM Sans', sans-serif",
                }}>{t}</button>
              ))}
            </div>

            {/* Amount */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Amount</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", fontSize: 20, fontWeight: 700 }}>$</span>
                <input
                  type="number" step="0.01" placeholder="0.00" value={newTx.amount}
                  onChange={e => setNewTx(prev => ({ ...prev, amount: e.target.value }))}
                  style={{
                    width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "14px 14px 14px 32px",
                    color: "#fff", fontSize: 20, fontWeight: 700, fontFamily: "'Space Mono', monospace",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Category */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Category</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {CATEGORIES[newTx.type].map(cat => (
                  <button key={cat} onClick={() => setNewTx(prev => ({ ...prev, category: cat }))} style={{
                    padding: "8px 14px", borderRadius: 10, cursor: "pointer",
                    background: newTx.category === cat ? "rgba(167,139,250,0.2)" : "rgba(255,255,255,0.04)",
                    border: newTx.category === cat ? "1px solid rgba(167,139,250,0.4)" : "1px solid rgba(255,255,255,0.08)",
                    color: newTx.category === cat ? "#a78bfa" : "rgba(255,255,255,0.5)",
                    fontSize: 12, fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
                    transition: "all 0.15s",
                  }}>
                    {CATEGORY_ICONS[cat]} {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Date</label>
              <input
                type="date" value={newTx.date}
                onChange={e => setNewTx(prev => ({ ...prev, date: e.target.value }))}
                style={{
                  width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 14px",
                  color: "#fff", fontSize: 14, fontFamily: "'Space Mono', monospace", outline: "none",
                }}
              />
            </div>

            {/* Note */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Note</label>
              <input
                type="text" placeholder="What's this for?" value={newTx.note}
                onChange={e => setNewTx(prev => ({ ...prev, note: e.target.value }))}
                style={{
                  width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 14px",
                  color: "#fff", fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none",
                }}
              />
            </div>

            {/* Submit */}
            <button onClick={addTransaction} disabled={!newTx.category || !newTx.amount} style={{
              width: "100%", padding: "14px 0", border: "none", borderRadius: 14, cursor: "pointer",
              background: (!newTx.category || !newTx.amount) ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg, #a78bfa, #818cf8)",
              color: (!newTx.category || !newTx.amount) ? "rgba(255,255,255,0.2)" : "#fff",
              fontWeight: 700, fontSize: 16, fontFamily: "'DM Sans', sans-serif",
              boxShadow: (!newTx.category || !newTx.amount) ? "none" : "0 4px 20px rgba(167,139,250,0.3)",
              transition: "all 0.2s",
            }}>
              {editingId ? "Update Transaction" : "Add Transaction"}
            </button>
          </div>
        </div>
      )}

      {/* ===== INVESTMENT MODAL ===== */}
      {showInvestModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100,
        }} onClick={() => setShowInvestModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "linear-gradient(180deg, #1a1a2e, #0f0f1a)",
            borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 500,
            padding: 24, maxHeight: "80vh", overflowY: "auto",
            border: "1px solid rgba(56,189,248,0.15)",
          }}>
            <div style={{ width: 40, height: 4, background: "rgba(255,255,255,0.15)", borderRadius: 2, margin: "0 auto 20px" }} />
            <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700, color: "#38bdf8" }}>
              {editingInvestId ? "Edit Investment" : "New Investment"}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Name */}
              <div>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Name / Ticker</label>
                <input type="text" placeholder="e.g. AAPL, Bitcoin" value={newInvest.name}
                  onChange={e => setNewInvest(prev => ({ ...prev, name: e.target.value }))}
                  style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 14px", color: "#fff", fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none" }} />
              </div>
              {/* Type */}
              <div>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Type</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {INVESTMENT_TYPES.map(t => (
                    <button key={t} onClick={() => setNewInvest(prev => ({ ...prev, type: t }))} style={{
                      padding: "8px 12px", borderRadius: 10, cursor: "pointer",
                      background: newInvest.type === t ? "rgba(56,189,248,0.2)" : "rgba(255,255,255,0.04)",
                      border: newInvest.type === t ? "1px solid rgba(56,189,248,0.4)" : "1px solid rgba(255,255,255,0.08)",
                      color: newInvest.type === t ? "#38bdf8" : "rgba(255,255,255,0.5)",
                      fontSize: 12, fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
                    }}>{INVESTMENT_ICONS[t]} {t}</button>
                  ))}
                </div>
              </div>
              {/* Shares + Prices */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Shares/Units</label>
                  <input type="number" step="any" placeholder="0" value={newInvest.shares}
                    onChange={e => setNewInvest(prev => ({ ...prev, shares: e.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 10px", color: "#fff", fontSize: 14, fontFamily: "'Space Mono', monospace", outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Buy Price</label>
                  <input type="number" step="0.01" placeholder="$0" value={newInvest.purchasePrice}
                    onChange={e => setNewInvest(prev => ({ ...prev, purchasePrice: e.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 10px", color: "#fff", fontSize: 14, fontFamily: "'Space Mono', monospace", outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Current Price</label>
                  <input type="number" step="0.01" placeholder="$0" value={newInvest.currentPrice}
                    onChange={e => setNewInvest(prev => ({ ...prev, currentPrice: e.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 10px", color: "#fff", fontSize: 14, fontFamily: "'Space Mono', monospace", outline: "none" }} />
                </div>
              </div>
              {/* Date + Note */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Purchase Date</label>
                  <input type="date" value={newInvest.purchaseDate}
                    onChange={e => setNewInvest(prev => ({ ...prev, purchaseDate: e.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 10px", color: "#fff", fontSize: 13, fontFamily: "'Space Mono', monospace", outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Note</label>
                  <input type="text" placeholder="Optional note" value={newInvest.note}
                    onChange={e => setNewInvest(prev => ({ ...prev, note: e.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 10px", color: "#fff", fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none" }} />
                </div>
              </div>
              <button onClick={addInvestment} disabled={!newInvest.name || !newInvest.type || !newInvest.shares || !newInvest.purchasePrice || !newInvest.currentPrice} style={{
                width: "100%", padding: "14px 0", border: "none", borderRadius: 14, cursor: "pointer",
                background: (!newInvest.name || !newInvest.type) ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg, #38bdf8, #818cf8)",
                color: (!newInvest.name || !newInvest.type) ? "rgba(255,255,255,0.2)" : "#fff",
                fontWeight: 700, fontSize: 16, fontFamily: "'DM Sans', sans-serif",
                boxShadow: (!newInvest.name || !newInvest.type) ? "none" : "0 4px 20px rgba(56,189,248,0.3)",
                transition: "all 0.2s",
              }}>{editingInvestId ? "Update Investment" : "Add Investment"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== DEBT MODAL ===== */}
      {showDebtModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100,
        }} onClick={() => setShowDebtModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "linear-gradient(180deg, #1a1a2e, #0f0f1a)",
            borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 500,
            padding: 24, maxHeight: "80vh", overflowY: "auto",
            border: "1px solid rgba(251,146,60,0.15)",
          }}>
            <div style={{ width: 40, height: 4, background: "rgba(255,255,255,0.15)", borderRadius: 2, margin: "0 auto 20px" }} />
            <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700, color: "#fb923c" }}>
              {editingDebtId ? "Edit Debt" : "New Debt"}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Name */}
              <div>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Debt Name</label>
                <input type="text" placeholder="e.g. Chase Sapphire, Student Loan" value={newDebt.name}
                  onChange={e => setNewDebt(prev => ({ ...prev, name: e.target.value }))}
                  style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 14px", color: "#fff", fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none" }} />
              </div>
              {/* Type */}
              <div>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Type</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {DEBT_TYPES.map(t => (
                    <button key={t} onClick={() => setNewDebt(prev => ({ ...prev, type: t }))} style={{
                      padding: "8px 12px", borderRadius: 10, cursor: "pointer",
                      background: newDebt.type === t ? "rgba(251,146,60,0.2)" : "rgba(255,255,255,0.04)",
                      border: newDebt.type === t ? "1px solid rgba(251,146,60,0.4)" : "1px solid rgba(255,255,255,0.08)",
                      color: newDebt.type === t ? "#fb923c" : "rgba(255,255,255,0.5)",
                      fontSize: 12, fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
                    }}>{DEBT_ICONS[t]} {t}</button>
                  ))}
                </div>
              </div>
              {/* Balance + Rate */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Balance</label>
                  <input type="number" step="0.01" placeholder="$0" value={newDebt.balance}
                    onChange={e => setNewDebt(prev => ({ ...prev, balance: e.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 10px", color: "#fff", fontSize: 14, fontFamily: "'Space Mono', monospace", outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Interest Rate %</label>
                  <input type="number" step="0.01" placeholder="0%" value={newDebt.interestRate}
                    onChange={e => setNewDebt(prev => ({ ...prev, interestRate: e.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 10px", color: "#fff", fontSize: 14, fontFamily: "'Space Mono', monospace", outline: "none" }} />
                </div>
              </div>
              {/* Min Payment + Credit Limit */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Min Payment/mo</label>
                  <input type="number" step="0.01" placeholder="$0" value={newDebt.minimumPayment}
                    onChange={e => setNewDebt(prev => ({ ...prev, minimumPayment: e.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 10px", color: "#fff", fontSize: 14, fontFamily: "'Space Mono', monospace", outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Credit Limit (opt)</label>
                  <input type="number" step="0.01" placeholder="$0" value={newDebt.creditLimit}
                    onChange={e => setNewDebt(prev => ({ ...prev, creditLimit: e.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 10px", color: "#fff", fontSize: 14, fontFamily: "'Space Mono', monospace", outline: "none" }} />
                </div>
              </div>
              {/* Due Date + Note */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Due Date</label>
                  <input type="date" value={newDebt.dueDate}
                    onChange={e => setNewDebt(prev => ({ ...prev, dueDate: e.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 10px", color: "#fff", fontSize: 13, fontFamily: "'Space Mono', monospace", outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Note</label>
                  <input type="text" placeholder="Optional note" value={newDebt.note}
                    onChange={e => setNewDebt(prev => ({ ...prev, note: e.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 10px", color: "#fff", fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none" }} />
                </div>
              </div>
              <button onClick={addDebt} disabled={!newDebt.name || !newDebt.type || !newDebt.balance || !newDebt.interestRate} style={{
                width: "100%", padding: "14px 0", border: "none", borderRadius: 14, cursor: "pointer",
                background: (!newDebt.name || !newDebt.type) ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg, #fb923c, #f87171)",
                color: (!newDebt.name || !newDebt.type) ? "rgba(255,255,255,0.2)" : "#fff",
                fontWeight: 700, fontSize: 16, fontFamily: "'DM Sans', sans-serif",
                boxShadow: (!newDebt.name || !newDebt.type) ? "none" : "0 4px 20px rgba(251,146,60,0.3)",
                transition: "all 0.2s",
              }}>{editingDebtId ? "Update Debt" : "Add Debt"}</button>
            </div>
          </div>
        </div>
      )}

      </>
      )}

      {/* Change PIN modal from auth */}
      {/* Auth modals handled by AuthGate */}

      <style>{`
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1) opacity(0.5); }
        input[type="month"]::-webkit-calendar-picker-indicator { filter: invert(1) opacity(0.5); }
        input::placeholder { color: rgba(255,255,255,0.2); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
      `}</style>
    </div>
  );
}
