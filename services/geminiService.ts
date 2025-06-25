
import { Transaction, ProcessedTransaction, AnomalyStatus } from '../types';
import { REQUIRED_COLUMNS } from "../constants";

function parseCSVToObjects(csvText: string): Transaction[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const rawHeaders = lines[0].split(',');
  const headers = rawHeaders.map(h => h.trim().toLowerCase());

  const missingHeaders = REQUIRED_COLUMNS.filter(col => !headers.includes(col.toLowerCase()));
  if (missingHeaders.length > 0) {
    throw new Error(`CSV is missing required columns: ${missingHeaders.join(', ')}. Found headers: ${rawHeaders.map(h => h.trim()).join(', ')}`);
  }
  
  const transactions: Transaction[] = [];
  const colIndices: Record<string, number> = {};
  REQUIRED_COLUMNS.forEach(col => {
    colIndices[col.toLowerCase()] = headers.indexOf(col.toLowerCase());
  });

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue; // Skip empty lines
    
    const values = lines[i].split(',');
    const transactionData: { [key: string]: string | number } = {}; 
    
    REQUIRED_COLUMNS.forEach(colName => {
        const lowerColName = colName.toLowerCase();
        const index = colIndices[lowerColName];
        const value = values[index] ? values[index].trim() : '';

        if (lowerColName === 'amount') {
            transactionData[colName] = parseFloat(value) || 0;
        } else {
            transactionData[colName] = value;
        }
    });
    
    // Add any extra columns not in REQUIRED_COLUMNS
    headers.forEach((header, index) => {
        if (!REQUIRED_COLUMNS.map(rc => rc.toLowerCase()).includes(header)) {
            transactionData[header] = values[index] ? values[index].trim() : '';
        }
    });

    transactions.push(transactionData as Transaction);
  }
  return transactions;
}

function calculateStdDev(arr: number[], mean: number): number {
    if (arr.length === 0) return 0;
    const variance = arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
}

export const analyzeTransactions = async (csvText: string): Promise<ProcessedTransaction[]> => {
  try {
    const transactions = parseCSVToObjects(csvText);
    if (transactions.length === 0) {
        return [];
    }

    const categoryStats: Map<string, { mean: number, stdDev: number, amounts: number[] }> = new Map();
    transactions.forEach(tx => {
        if (!categoryStats.has(tx.category)) {
            categoryStats.set(tx.category, { mean: 0, stdDev: 0, amounts: [] });
        }
        categoryStats.get(tx.category)!.amounts.push(tx.amount);
    });

    categoryStats.forEach(stats => {
        if (stats.amounts.length > 0) {
            stats.mean = stats.amounts.reduce((sum, val) => sum + val, 0) / stats.amounts.length;
            stats.stdDev = calculateStdDev(stats.amounts, stats.mean);
        }
    });

    const vendorBaseline: Map<string, Map<string, number>> = new Map();
    transactions.forEach(tx => {
        if (!vendorBaseline.has(tx.category)) {
            vendorBaseline.set(tx.category, new Map());
        }
        const categoryVendors = vendorBaseline.get(tx.category)!;
        categoryVendors.set(tx.vendor, (categoryVendors.get(tx.vendor) || 0) + 1);
    });
    
    const seenTransactionKeys = new Set<string>();

    const processedTransactions: ProcessedTransaction[] = transactions.map((tx) => {
        let anomalyScore = 0;
        const reasons: string[] = [];

        const catStats = categoryStats.get(tx.category);
        if (catStats && catStats.stdDev > 0) {
            const zScore = Math.abs((tx.amount - catStats.mean) / catStats.stdDev);
            if (zScore > 3) {
                anomalyScore += 0.4;
                reasons.push(`Amount significantly deviates from category average (Z-score: ${zScore.toFixed(2)}).`);
            } else if (zScore > 2) {
                anomalyScore += 0.2;
                reasons.push(`Amount deviates from category average (Z-score: ${zScore.toFixed(2)}).`);
            }
        } else if (catStats && catStats.amounts.length === 1 && tx.amount !== 0) {
             if (tx.amount > (catStats.mean || 0) * 2 && tx.amount > 1000) { 
                // Potential outlier if single transaction and significantly larger than expected for similar single items or a default mean.
             }
        }

        const categoryVendors = vendorBaseline.get(tx.category);
        if (categoryVendors) {
            const vendorCount = categoryVendors.get(tx.vendor) || 0;
            const totalTransactionsInCategory = categoryStats.get(tx.category)?.amounts.length || 0;
            if (vendorCount <= 1 && totalTransactionsInCategory > 5) { 
                anomalyScore += 0.25;
                reasons.push(`Rare vendor '${tx.vendor}' for category '${tx.category}'.`);
            }
        }

        try {
            const transactionDate = new Date(tx.date); 
            const dayOfWeek = transactionDate.getDay(); 
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                anomalyScore += 0.1;
                reasons.push("Transaction occurred on a weekend.");
            }
        } catch (e) {
            console.warn(`Could not parse date for transaction ${tx.transaction_id}: ${tx.date}`);
        }

        const transactionKey = `${tx.vendor}-${tx.amount}-${tx.category}-${tx.date}`;
        if (seenTransactionKeys.has(transactionKey)) {
            anomalyScore += 0.4;
            reasons.push("Potential duplicate of an earlier transaction (same vendor, amount, category, date).");
        } else {
            seenTransactionKeys.add(transactionKey);
        }
        
        const finalScore = Math.min(1, Math.max(0, anomalyScore));
        let status: AnomalyStatus;
        if (finalScore >= 0.7) {
            status = AnomalyStatus.Anomalous;
        } else if (finalScore >= 0.3) {
            status = AnomalyStatus.Suspicious;
        } else {
            status = AnomalyStatus.Normal;
        }

        return {
            ...tx,
            amount: Number(tx.amount), 
            anomaly_score: finalScore,
            anomaly_status: status,
            reason: reasons.length > 0 ? reasons.join(" ") : (status === AnomalyStatus.Normal ? "Normal transaction." : "No specific anomaly flags, but score elevated.")
        };
    });

    return processedTransactions;

  } catch (error) {
    console.error("Error analyzing transactions locally:", error);
    let errorMessage = "Failed to analyze transactions. ";
    if (error instanceof Error) {
        errorMessage += error.message;
    } else {
        errorMessage += "An unknown error occurred.";
    }
    throw new Error(errorMessage);
  }
};
