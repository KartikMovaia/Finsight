// ─── Gemini AI Service ───
// Uses the Gemini API with automatic model fallback

// Models to try in order — each with its correct API version
const MODELS = [
  { name: "gemini-2.0-flash", version: "v1beta" },
  { name: "gemini-2.0-flash-lite", version: "v1beta" },
  { name: "gemini-1.5-flash", version: "v1" },
  { name: "gemini-1.5-flash-8b", version: "v1" },
  { name: "gemini-1.5-pro", version: "v1" },
  { name: "gemini-1.0-pro", version: "v1" },
];

function buildFinancialContext(data) {
  const { transactions, investments, debts, stats, portfolioStats, debtStats, netWorth, yearlyProjection } = data;

  // Summarize recent transactions by category
  const expenseByCategory = {};
  const incomeByCategory = {};
  transactions.forEach(tx => {
    if (tx.type === "expense") {
      expenseByCategory[tx.category] = (expenseByCategory[tx.category] || 0) + tx.amount;
    } else {
      incomeByCategory[tx.category] = (incomeByCategory[tx.category] || 0) + tx.amount;
    }
  });

  return `
## User's Financial Snapshot

### Income & Expenses (Current Period)
- Total Income: $${stats.income.toFixed(2)}
- Total Expenses: $${stats.expense.toFixed(2)}
- Net Cash Flow: $${stats.net.toFixed(2)}

### Income Sources
${Object.entries(incomeByCategory).map(([cat, amt]) => `- ${cat}: $${amt.toFixed(2)}`).join("\n") || "- No income recorded"}

### Expense Breakdown
${Object.entries(expenseByCategory).map(([cat, amt]) => `- ${cat}: $${amt.toFixed(2)}`).join("\n") || "- No expenses recorded"}

### Investment Portfolio
- Total Value: $${portfolioStats.totalValue.toFixed(2)}
- Total Cost Basis: $${portfolioStats.totalCost.toFixed(2)}
- Total Gain/Loss: $${portfolioStats.totalGain.toFixed(2)} (${portfolioStats.gainPct.toFixed(1)}%)
${investments.map(i => `- ${i.name} (${i.type}): ${i.shares} shares, bought at $${i.purchasePrice}, now $${i.currentPrice}`).join("\n") || "- No investments"}

### Debts
- Total Debt: $${debtStats.totalDebt.toFixed(2)}
- Monthly Minimum Payments: $${debtStats.totalMinPayment.toFixed(2)}
- Average Interest Rate: ${debtStats.avgRate.toFixed(2)}%
- Credit Utilization: ${debtStats.creditUsed.toFixed(0)}%
${debts.map(d => `- ${d.name} (${d.type}): $${d.balance.toFixed(2)} at ${d.interestRate}% APR, min $${d.minimumPayment}/mo`).join("\n") || "- No debts"}

### Net Worth
$${netWorth.toFixed(2)}

### Projections (Annual, based on 3-month average)
- Projected Annual Income: $${yearlyProjection.annualIncome.toFixed(2)}
- Projected Annual Expenses: $${yearlyProjection.annualExpense.toFixed(2)}
- Projected Annual Savings: $${yearlyProjection.annualNet.toFixed(2)}
- Savings Rate: ${yearlyProjection.savingsRate.toFixed(1)}%
`.trim();
}

const SYSTEM_PROMPT = `You are Finsight AI, a friendly and knowledgeable personal finance advisor built into the Finsight finance tracking app. You have access to the user's real financial data (provided below).

Your role:
1. Analyze their spending patterns and give actionable advice
2. Help create financial plans to achieve specific goals (saving for a house, paying off debt, building emergency fund, retirement, etc.)
3. Identify areas where they can cut expenses
4. Suggest investment strategies based on their current portfolio
5. Create debt payoff strategies (avalanche vs snowball method)
6. Calculate timelines for financial goals
7. Give budget recommendations based on their income

Rules:
- Be conversational, warm, and encouraging — not preachy
- Use specific numbers from their data — don't be vague
- When creating a plan, break it into clear monthly steps
- If they don't have enough data, say so and ask for more context
- Format responses with clear sections, use bullet points sparingly
- Keep responses concise but thorough — aim for 150-300 words
- Use $ for currency, no need for currency codes
- You are NOT a certified financial advisor — remind them of this for major decisions
- Never recommend specific stock picks — suggest categories/strategies instead`;

async function tryModel(model, version, apiKey, contents) {
  const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;
  
  // Only v1beta models reliably support system_instruction
  const useSystemInstruction = version === "v1beta";
  
  const body = {
    contents: useSystemInstruction ? contents : [
      { role: "user", parts: [{ text: SYSTEM_PROMPT + "\n\nPlease confirm you understand these instructions." }] },
      { role: "model", parts: [{ text: "Understood. I'm Finsight AI, your personal finance advisor. I have access to your financial data and I'm ready to help." }] },
      ...contents,
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
      topP: 0.9,
    },
  };
  
  if (useSystemInstruction) {
    body.system_instruction = { parts: [{ text: SYSTEM_PROMPT }] };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err.error?.message || `${response.status}`;
    const msgLower = msg.toLowerCase();
    const isQuota = response.status === 429 || msgLower.includes("quota") || msgLower.includes("limit");
    const isNotFound = response.status === 404 || msgLower.includes("not found");
    const isUnsupported = msgLower.includes("unknown name") || msgLower.includes("not supported") || msgLower.includes("invalid");
    const isRetryable = isQuota || isNotFound || isUnsupported;
    return { ok: false, isRetryable, error: msg };
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return { ok: false, isRetryable: true, error: "Empty response" };
  return { ok: true, text, model };
}

export async function chatWithGemini(apiKey, messages, financialData, lang = "en", currencySymbol = "$") {
  const context = buildFinancialContext(financialData);
  const langInstruction = lang === "hi" ? "\n\nIMPORTANT: The user prefers Hindi (हिंदी). Always respond in Hindi. Use Devanagari script. You may use English for financial terms, tickers, and numbers." : "";
  const currencyInstruction = `\n\nCurrency: Use the symbol "${currencySymbol}" for all monetary values.`;
  const contents = [];
  const firstUserIdx = messages.findIndex(m => m.role === "user");

  messages.forEach((msg, i) => {
    const role = msg.role === "user" ? "user" : "model";
    let text = msg.content;
    if (i === firstUserIdx) {
      text = `[Financial Data Context]\n${context}${langInstruction}${currencyInstruction}\n\n[User Question]\n${text}`;
    }
    contents.push({ role, parts: [{ text }] });
  });

  const errors = [];

  for (const { name: model, version } of MODELS) {
    console.log(`[Finsight AI] Trying ${model} (${version})...`);
    const result = await tryModel(model, version, apiKey, contents);

    if (result.ok) {
      console.log(`[Finsight AI] ✓ Success with ${result.model}`);
      return result.text;
    }

    errors.push(`${model}: ${result.error}`);
    console.warn(`[Finsight AI] ✗ ${model} failed: ${result.error}`);

    // Continue to next model if retryable (quota, not found, unsupported feature)
    // For fatal errors (bad API key), stop immediately
    if (!result.isRetryable) {
      throw new Error(result.error);
    }
  }

  throw new Error(
    `All models exhausted. This usually means the free tier isn't available in your region. Try enabling billing on Google Cloud (you can set a $0 budget).\n\nDetails:\n${errors.map(e => `• ${e}`).join("\n")}`
  );
}

// ─── Quick Prompts ───
export const QUICK_PROMPTS = [
  { label: "📊 Analyze my spending", prompt: "Analyze my spending patterns. Where am I spending the most? What can I cut back on?" },
  { label: "🎯 Set a savings goal", prompt: "Help me create a plan to save $10,000 in the next 12 months based on my current income and expenses." },
  { label: "💳 Debt payoff plan", prompt: "Create a debt payoff strategy for me. Compare the avalanche and snowball methods with my specific debts and tell me which saves more money." },
  { label: "🏠 Save for a house", prompt: "I want to save for a house down payment of $50,000. Based on my finances, how long will it take and what changes should I make?" },
  { label: "📈 Investment advice", prompt: "Review my investment portfolio. Is it well-diversified? What adjustments would you suggest for long-term growth?" },
  { label: "🚨 Emergency fund", prompt: "Do I have enough for an emergency fund? Based on my expenses, how much should I have saved and how long will it take to build it?" },
  { label: "📋 Monthly budget", prompt: "Create a detailed monthly budget for me based on my income and current spending. Use the 50/30/20 rule as a starting point." },
  { label: "🏖️ Financial health check", prompt: "Give me an overall financial health assessment. What am I doing well? What needs immediate attention?" },
];
