import { db } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  writeBatch,
} from "firebase/firestore";

// ─── Each user gets their own document structure: ───
// users/{uid}/data/transactions  → { items: [...] }
// users/{uid}/data/investments   → { items: [...] }
// users/{uid}/data/debts         → { items: [...] }
// users/{uid}/data/settings      → { view, activeTab }

function dataRef(uid, docName) {
  return doc(db, "users", uid, "data", docName);
}

// ─── Generic load/save ───

export async function loadData(uid, docName) {
  try {
    const snap = await getDoc(dataRef(uid, docName));
    if (snap.exists()) return snap.data().items ?? snap.data();
    return null;
  } catch (err) {
    console.error(`Failed to load ${docName}:`, err);
    return null;
  }
}

export async function saveData(uid, docName, items) {
  try {
    await setDoc(dataRef(uid, docName), { items, updatedAt: Date.now() }, { merge: true });
    return true;
  } catch (err) {
    console.error(`Failed to save ${docName}:`, err);
    return false;
  }
}

// ─── Specific helpers (for cleaner API) ───

export const loadTransactions = (uid) => loadData(uid, "transactions");
export const saveTransactions = (uid, data) => saveData(uid, "transactions", data);

export const loadInvestments = (uid) => loadData(uid, "investments");
export const saveInvestments = (uid, data) => saveData(uid, "investments", data);

export const loadDebts = (uid) => loadData(uid, "debts");
export const saveDebts = (uid, data) => saveData(uid, "debts", data);

export async function loadSettings(uid) {
  try {
    const snap = await getDoc(dataRef(uid, "settings"));
    return snap.exists() ? snap.data() : null;
  } catch { return null; }
}

export async function saveSettings(uid, settings) {
  try {
    await setDoc(dataRef(uid, "settings"), { ...settings, updatedAt: Date.now() }, { merge: true });
    return true;
  } catch { return false; }
}

// ─── Bulk export all user data ───
export async function exportAllData(uid) {
  const [transactions, investments, debts] = await Promise.all([
    loadTransactions(uid),
    loadInvestments(uid),
    loadDebts(uid),
  ]);
  return { transactions: transactions || [], investments: investments || [], debts: debts || [] };
}

// ─── Bulk import ───
export async function importAllData(uid, data) {
  const batch = writeBatch(db);
  if (data.transactions) batch.set(dataRef(uid, "transactions"), { items: data.transactions, updatedAt: Date.now() });
  if (data.investments) batch.set(dataRef(uid, "investments"), { items: data.investments, updatedAt: Date.now() });
  if (data.debts) batch.set(dataRef(uid, "debts"), { items: data.debts, updatedAt: Date.now() });
  await batch.commit();
}

// ─── Clear all data ───
export async function clearAllData(uid) {
  const batch = writeBatch(db);
  batch.set(dataRef(uid, "transactions"), { items: [], updatedAt: Date.now() });
  batch.set(dataRef(uid, "investments"), { items: [], updatedAt: Date.now() });
  batch.set(dataRef(uid, "debts"), { items: [], updatedAt: Date.now() });
  await batch.commit();
}
