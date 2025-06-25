
import React, { useState, useMemo } from 'react';
import { ProcessedTransaction, AnomalyStatus } from '../types';
import { BRANDING_CONFIG, ITEMS_PER_PAGE } from '../constants';

interface TransactionTableProps {
  transactions: ProcessedTransaction[];
}

type SortKey = keyof ProcessedTransaction;
type SortOrder = 'asc' | 'desc';

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions }) => {
  const { brand } = BRANDING_CONFIG;
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      let comparison = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      } else if (typeof valA === 'string' && typeof valB === 'string') {
        comparison = valA.localeCompare(valB);
      }
      // Removed incorrect 'instanceof Date' check as 'date' field is string
      // and handled by the string comparison above.
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [transactions, sortKey, sortOrder]);

  const totalPages = Math.ceil(sortedTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = sortedTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const getStatusColor = (status: AnomalyStatus) => {
    switch (status) {
      case AnomalyStatus.Anomalous: return 'bg-red-500 text-white';
      case AnomalyStatus.Suspicious: return `bg-[${brand.colors.primary}] text-[${brand.colors.secondary}]`; // Yellow with dark text
      case AnomalyStatus.Normal: return 'bg-green-500 text-white';
      default: return 'bg-gray-300 text-black';
    }
  };
  
  const SortIcon: React.FC<{ order: SortOrder | null }> = ({ order }) => {
    if (order === 'asc') return <span className="ml-1">▲</span>;
    if (order === 'desc') return <span className="ml-1">▼</span>;
    return <span className="ml-1 text-gray-400">↕</span>;
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }

    return (
      <nav className="mt-6 flex justify-center">
        <ul className="inline-flex -space-x-px">
          <li>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`py-2 px-3 ml-0 leading-tight text-gray-500 bg-white rounded-l-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50`}
            >
              Previous
            </button>
          </li>
          {pageNumbers.map(number => (
            <li key={number}>
              <button
                onClick={() => setCurrentPage(number)}
                className={`py-2 px-3 leading-tight ${currentPage === number ? `text-white bg-[${brand.colors.secondary}] border-[${brand.colors.secondary}]` : `text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700`}`}
              >
                {number}
              </button>
            </li>
          ))}
          <li>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`py-2 px-3 leading-tight text-gray-500 bg-white rounded-r-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50`}
            >
              Next
            </button>
          </li>
        </ul>
      </nav>
    );
  };
  
  const headers: { key: SortKey; label: string; sortable: boolean }[] = [
    { key: 'transaction_id', label: 'ID', sortable: true },
    { key: 'date', label: 'Date', sortable: true },
    { key: 'amount', label: 'Amount', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'account', label: 'Account', sortable: true },
    { key: 'vendor', label: 'Vendor', sortable: true },
    { key: 'anomaly_score', label: 'Score', sortable: true },
    { key: 'anomaly_status', label: 'Status', sortable: true },
    { key: 'reason', label: 'Reason', sortable: false },
  ];


  if (transactions.length === 0) {
    return <p className="text-center text-gray-500 py-8">No transactions to display. Upload a CSV file to get started.</p>;
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-xl overflow-x-auto">
      <h3 className={`text-2xl font-semibold mb-4 text-[${brand.colors.secondary}]`}>Transaction Details</h3>
      <div className="min-w-full overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className={`bg-[${brand.colors.secondary}]`}>
            <tr>
              {headers.map(header => (
                <th 
                  key={header.key}
                  scope="col" 
                  className={`px-4 py-3 text-left text-xs font-medium text-[${brand.colors.primary}] uppercase tracking-wider ${header.sortable ? 'cursor-pointer hover:bg-opacity-80' : ''}`}
                  onClick={header.sortable ? () => handleSort(header.key as SortKey) : undefined}
                  style={{backgroundColor: brand.colors.secondary, color: brand.colors.primary}}
                >
                  {header.label}
                  {header.sortable && <SortIcon order={sortKey === header.key ? sortOrder : null} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedTransactions.map((tx) => (
              <tr key={tx.transaction_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{tx.transaction_id}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{tx.date}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right">{typeof tx.amount === 'number' ? tx.amount.toFixed(2) : tx.amount}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{tx.category}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{tx.account}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{tx.vendor}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-center">{typeof tx.anomaly_score === 'number' ? tx.anomaly_score.toFixed(2) : tx.anomaly_score}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(tx.anomaly_status)}`}>
                    {tx.anomaly_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate" title={tx.reason}>{tx.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {renderPagination()}
    </div>
  );
};

export default TransactionTable;
