
import React from 'react';
import { ProcessedTransaction, AnomalyStatus, ChartDataItem, CategoryAnomalyRate, Filters } from '../types';
import { BRANDING_CONFIG } from '../constants';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface DashboardProps {
  transactions: ProcessedTransaction[];
  filters: Filters;
  onFilterChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  onExport: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, filters, onFilterChange, onExport }) => {
  const { brand } = BRANDING_CONFIG;

  const statusColors: Record<AnomalyStatus, string> = {
    [AnomalyStatus.Normal]: '#22C55E', // green-500
    [AnomalyStatus.Suspicious]: brand.colors.primary, // #FFDF00
    [AnomalyStatus.Anomalous]: '#EF4444', // red-500
    [AnomalyStatus.All]: '#6B7280' // gray-500 - not used in chart directly
  };

  const anomalyDistribution: ChartDataItem[] = React.useMemo(() => {
    const counts = transactions.reduce((acc, tx) => {
      acc[tx.anomaly_status] = (acc[tx.anomaly_status] || 0) + 1;
      return acc;
    }, {} as Record<AnomalyStatus, number>);
    
    return Object.entries(counts).map(([name, value]) => ({
      name: name as AnomalyStatus,
      value,
    })).filter(item => item.name !== AnomalyStatus.All);
  }, [transactions]);

  const topOutliersByAmount: ChartDataItem[] = React.useMemo(() => {
    return [...transactions]
      .filter(tx => tx.anomaly_status === AnomalyStatus.Anomalous || tx.anomaly_status === AnomalyStatus.Suspicious)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(tx => ({ name: `${tx.transaction_id} (${tx.vendor})`, value: tx.amount }));
  }, [transactions]);

  const categoryAnomalyRates: CategoryAnomalyRate[] = React.useMemo(() => {
    const categoryData: Record<string, { total: number; anomalies: number }> = {};
    transactions.forEach(tx => {
      if (!categoryData[tx.category]) {
        categoryData[tx.category] = { total: 0, anomalies: 0 };
      }
      categoryData[tx.category].total++;
      if (tx.anomaly_status === AnomalyStatus.Anomalous || tx.anomaly_status === AnomalyStatus.Suspicious) {
        categoryData[tx.category].anomalies++;
      }
    });
    return Object.entries(categoryData).map(([name, data]) => ({
      name,
      value: data.total > 0 ? (data.anomalies / data.total) * 100 : 0,
      total: data.total,
      anomalies: data.anomalies
    })).sort((a,b) => b.value - a.value);
  }, [transactions]);

 const timeBasedAnomalySpikes: ChartDataItem[] = React.useMemo(() => {
    const dateMap: Record<string, number> = {};
    transactions.forEach(tx => {
        if (tx.anomaly_status === AnomalyStatus.Anomalous || tx.anomaly_status === AnomalyStatus.Suspicious) {
            const datePart = tx.date.split('T')[0]; // Assuming ISO date string
            dateMap[datePart] = (dateMap[datePart] || 0) + 1;
        }
    });
    return Object.entries(dateMap)
        .map(([date, count]) => ({ name: date, value: count }))
        .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());
}, [transactions]);


  const uniqueAccounts = React.useMemo(() => ['All', ...new Set(transactions.map(tx => tx.account))], [transactions]);
  const uniqueCategories = React.useMemo(() => ['All', ...new Set(transactions.map(tx => tx.category))], [transactions]);

  if (transactions.length === 0) {
    return <p className="text-center text-gray-500 py-8">No data processed yet. Upload a file to see the dashboard.</p>;
  }

  const ChartContainer: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white p-4 rounded-lg shadow-lg" style={{borderColor: brand.colors.secondary}}>
      <h3 className="text-lg font-semibold mb-3" style={{ color: brand.colors.secondary }}>{title}</h3>
      <div style={{ width: '100%', height: 300 }}>
        {children}
      </div>
    </div>
  );
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'startDate' | 'endDate') => {
    const newDate = e.target.value ? new Date(e.target.value) : null;
    onFilterChange('dateRange', { ...filters.dateRange, [type]: newDate });
  };


  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <div className="p-4 bg-white rounded-lg shadow-lg">
        <h3 className={`text-xl font-semibold mb-4 text-[${brand.colors.secondary}]`}>Filters & Export</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-4 items-end">
          <div>
            <label htmlFor="startDate" className={`block text-sm font-medium text-[${brand.colors.secondary}]`}>Start Date</label>
            <input type="date" id="startDate" name="startDate"
                   value={filters.dateRange.startDate ? filters.dateRange.startDate.toISOString().split('T')[0] : ''}
                   onChange={(e) => handleDateChange(e, 'startDate')}
                   className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[${brand.colors.primary}] focus:ring focus:ring-[${brand.colors.primary}] focus:ring-opacity-50 p-2`} />
          </div>
          <div>
            <label htmlFor="endDate" className={`block text-sm font-medium text-[${brand.colors.secondary}]`}>End Date</label>
            <input type="date" id="endDate" name="endDate"
                   value={filters.dateRange.endDate ? filters.dateRange.endDate.toISOString().split('T')[0] : ''}
                   onChange={(e) => handleDateChange(e, 'endDate')}
                   className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[${brand.colors.primary}] focus:ring focus:ring-[${brand.colors.primary}] focus:ring-opacity-50 p-2`} />
          </div>
          <div>
            <label htmlFor="accountFilter" className={`block text-sm font-medium text-[${brand.colors.secondary}]`}>Account</label>
            <select id="accountFilter" value={filters.account} onChange={(e) => onFilterChange('account', e.target.value)}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[${brand.colors.primary}] focus:ring focus:ring-[${brand.colors.primary}] focus:ring-opacity-50 p-2`}>
              {uniqueAccounts.map(acc => <option key={acc} value={acc}>{acc}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="categoryFilter" className={`block text-sm font-medium text-[${brand.colors.secondary}]`}>Category</label>
            <select id="categoryFilter" value={filters.category} onChange={(e) => onFilterChange('category', e.target.value)}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[${brand.colors.primary}] focus:ring focus:ring-[${brand.colors.primary}] focus:ring-opacity-50 p-2`}>
              {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="statusFilter" className={`block text-sm font-medium text-[${brand.colors.secondary}]`}>Anomaly Status</label>
            <select id="statusFilter" value={filters.status} onChange={(e) => onFilterChange('status', e.target.value as AnomalyStatus)}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[${brand.colors.primary}] focus:ring focus:ring-[${brand.colors.primary}] focus:ring-opacity-50 p-2`}>
              {Object.values(AnomalyStatus).map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
           <div>
            <label htmlFor="searchTerm" className={`block text-sm font-medium text-[${brand.colors.secondary}]`}>Search Term (Vendor, ID)</label>
            <input type="text" id="searchTerm" value={filters.searchTerm} onChange={(e) => onFilterChange('searchTerm', e.target.value)}
                   placeholder="e.g., Unfamiliar Airways or T1001"
                   className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[${brand.colors.primary}] focus:ring focus:ring-[${brand.colors.primary}] focus:ring-opacity-50 p-2`} />
          </div>
        </div>
        <button 
            onClick={onExport}
            className={`py-2 px-4 rounded-lg font-semibold text-white transition-colors duration-300 bg-[${brand.colors.secondary}] hover:bg-opacity-80 focus:ring-4 focus:ring-[${brand.colors.primary}] focus:ring-opacity-50`}
            style={{backgroundColor: brand.colors.secondary}}
            >
            Export Flagged Transactions
        </button>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartContainer title="Anomaly Distribution">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={anomalyDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {anomalyDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={statusColors[entry.name as AnomalyStatus]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Top 5 Outliers by Amount">
          <ResponsiveContainer>
            <BarChart data={topOutliersByAmount} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" stroke={brand.colors.secondary}/>
              <YAxis dataKey="name" type="category" width={150} stroke={brand.colors.secondary} />
              <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="value" name="Amount" fill={brand.colors.primary} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Category-wise Anomaly Rates (%)">
          <ResponsiveContainer>
            <BarChart data={categoryAnomalyRates} margin={{ top: 5, right: 30, left: 20, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} stroke={brand.colors.secondary}/>
              <YAxis stroke={brand.colors.secondary}/>
              <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
              <Legend />
              <Bar dataKey="value" name="Anomaly Rate" fill={brand.colors.secondary} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        <ChartContainer title="Time-based Anomaly Spikes">
          <ResponsiveContainer>
            <LineChart data={timeBasedAnomalySpikes} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke={brand.colors.secondary} />
              <YAxis stroke={brand.colors.secondary} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" name="Anomalies" stroke={brand.colors.primary} strokeWidth={2} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
};

export default Dashboard;
