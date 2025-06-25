
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import TransactionTable from './components/TransactionTable';
import LoadingSpinner from './components/LoadingSpinner';
import { analyzeTransactions } from './services/geminiService';
import { Transaction, ProcessedTransaction, AnomalyStatus, Filters, DateRange } from './types';
import { BRANDING_CONFIG, REQUIRED_COLUMNS } from './constants';

const App: React.FC = () => {
  const { brand } = BRANDING_CONFIG;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [processedTransactions, setProcessedTransactions] = useState<ProcessedTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<ProcessedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const initialFilters: Filters = {
    dateRange: { startDate: null, endDate: null },
    account: 'All',
    category: 'All',
    status: AnomalyStatus.All,
    searchTerm: '',
  };
  const [filters, setFilters] = useState<Filters>(initialFilters);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (file.type !== 'text/csv') {
      setError('Invalid file type. Please upload a CSV file.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTransactions([]);
    setProcessedTransactions([]);
    setFilters(initialFilters); // Reset filters on new file upload

    const reader = new FileReader();
    reader.onload = async (e) => {
      const csvText = e.target?.result as string;
      try {
        // Basic CSV header validation client-side before sending to Gemini
        const firstLine = csvText.slice(0, csvText.indexOf('\n')).trim();
        const headers = firstLine.split(',').map(h => h.trim());
        const missingHeaders = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
        if (missingHeaders.length > 0) {
          throw new Error(`CSV is missing required columns: ${missingHeaders.join(', ')}. Found: ${headers.join(', ')}`);
        }

        const results = await analyzeTransactions(csvText);
        setProcessedTransactions(results);
      } catch (err: any) {
        setError(err.message || 'An error occurred during processing.');
        setProcessedTransactions([]); // Clear any partial data
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
  };
  
  const handleFilterChange = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    let currentFiltered = [...processedTransactions];

    // Date Range
    if (filters.dateRange.startDate) {
        currentFiltered = currentFiltered.filter(tx => new Date(tx.date) >= filters.dateRange.startDate!);
    }
    if (filters.dateRange.endDate) {
        currentFiltered = currentFiltered.filter(tx => new Date(tx.date) <= filters.dateRange.endDate!);
    }
    // Account
    if (filters.account !== 'All') {
      currentFiltered = currentFiltered.filter(tx => tx.account === filters.account);
    }
    // Category
    if (filters.category !== 'All') {
      currentFiltered = currentFiltered.filter(tx => tx.category === filters.category);
    }
    // Status
    if (filters.status !== AnomalyStatus.All) {
      currentFiltered = currentFiltered.filter(tx => tx.anomaly_status === filters.status);
    }
    // Search Term (Vendor or ID)
    if (filters.searchTerm) {
        const searchTermLower = filters.searchTerm.toLowerCase();
        currentFiltered = currentFiltered.filter(tx => 
            tx.vendor.toLowerCase().includes(searchTermLower) || 
            tx.transaction_id.toLowerCase().includes(searchTermLower)
        );
    }

    setFilteredTransactions(currentFiltered);
  }, [processedTransactions, filters]);


  const exportFlaggedTransactions = () => {
    const flagged = processedTransactions.filter(
      tx => tx.anomaly_status === AnomalyStatus.Anomalous || tx.anomaly_status === AnomalyStatus.Suspicious
    );
    if (flagged.length === 0) {
      alert("No flagged transactions (Suspicious or Anomalous) to export.");
      return;
    }

    const headers = Object.keys(flagged[0]).join(',');
    const csvRows = flagged.map(row =>
      Object.values(row)
        .map(value => (typeof value === 'string' && value.includes(',')) ? `"${value}"` : value)
        .join(',')
    );
    const csvContent = [headers, ...csvRows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'flagged_transactions.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };


  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f0f2f5' }}>
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8 space-y-8">
        <section id="app-description" className="p-6 bg-white rounded-lg shadow-xl text-center">
          <h2 className={`text-3xl font-bold mb-3 text-[${brand.colors.secondary}]`}>Anomaly Detection in Financial Data</h2>
          <p className="text-gray-700 mb-2">
            Upload your financial transaction or accounting data (CSV format).
          </p>
          <p className="text-gray-600 text-sm">
            This AI-powered app detects unusual patterns or outliers that may indicate fraud, data entry errors, policy violations, or unexpected opportunities.
          </p>
        </section>

        <FileUpload onFileUpload={handleFileUpload} isLoading={isLoading} />

        {error && (
          <div className="p-4 my-4 text-sm text-red-700 bg-red-100 rounded-lg shadow" role="alert">
            <span className="font-medium">Error!</span> {error}
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <LoadingSpinner />
          </div>
        )}

        {!isLoading && !error && processedTransactions.length > 0 && (
          <>
            <Dashboard 
              transactions={filteredTransactions} 
              filters={filters}
              onFilterChange={handleFilterChange}
              onExport={exportFlaggedTransactions}
            />
            <TransactionTable transactions={filteredTransactions} />
          </>
        )}
        
        {!isLoading && !error && processedTransactions.length === 0 && !transactions.length && (
           <div className="text-center p-6 bg-white rounded-lg shadow-xl">
             <p className={`text-lg text-[${brand.colors.secondary}]`}>Upload a CSV file to begin analysis.</p>
           </div>
        )}

      </main>
      <Footer />
    </div>
  );
};

export default App;
