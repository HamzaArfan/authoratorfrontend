import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('30d'); 
  const navigate = useNavigate();

  useEffect(() => {
    const adminUser = localStorage.getItem('adminUser');
    
    if (!adminUser) {
      navigate('/admin');
      return;
    }
    
    fetchStats();
  }, [navigate, timeRange]);

  const fetchStats = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const adminUser = JSON.parse(localStorage.getItem('adminUser'));
      
      const response = await axios.get('https://authrator.com/db-api/api/admin/stats', {
        headers: {
          Authorization: `Bearer ${adminUser.id}`
        }
      });
      
      if (response.data.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load statistics. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    navigate('/admin');
  };

  const prepareChartData = () => {
    if (!stats) return null;
    
    let filteredVisits = [...stats.visitsPerDay];
    let filteredDownloads = [...stats.downloadsPerDay];
    
    if (timeRange !== 'all') {
      const daysToInclude = timeRange === '7d' ? 7 : 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToInclude);
      
      filteredVisits = filteredVisits.filter(item => new Date(item.date) >= cutoffDate);
      filteredDownloads = filteredDownloads.filter(item => new Date(item.date) >= cutoffDate);
    }
    
    const labels = filteredVisits.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    const visitCounts = filteredVisits.map(item => item.count);
    const downloadCounts = filteredDownloads.map(item => item.count);
    
    return {
      labels,
      datasets: [
        {
          label: 'Visits',
          data: visitCounts,
          borderColor: 'rgba(147, 51, 234, 0.8)',
          backgroundColor: 'rgba(147, 51, 234, 0.2)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(147, 51, 234, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(147, 51, 234, 1)',
          tension: 0.3,
        },
        {
          label: 'Downloads',
          data: downloadCounts,
          borderColor: 'rgba(168, 85, 247, 0.8)', 
          backgroundColor: 'rgba(168, 85, 247, 0.2)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(168, 85, 247, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(168, 85, 247, 1)',
          tension: 0.3,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          pointStyle: 'circle',
          color: 'rgba(0, 0, 0, 0.7)',
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: 'rgba(0, 0, 0, 0.9)',
        bodyColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: 'rgba(147, 51, 234, 0.2)',
        borderWidth: 1,
        titleFont: {
          size: 14,
          family: "'Inter', sans-serif",
        },
        bodyFont: {
          size: 13,
          family: "'Inter', sans-serif",
        },
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
      },
      title: {
        display: true,
        text: 'User Activity',
        color: 'rgba(79, 20, 140, 0.8)',
        font: {
          size: 18,
          family: "'Inter', sans-serif",
          weight: '500',
        },
        padding: {
          bottom: 20,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(147, 51, 234, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(79, 20, 140, 0.7)',
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
          padding: 10,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(79, 20, 140, 0.7)',
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
          padding: 10,
        },
      },
    },
    elements: {
      point: {
        radius: 3,
        hoverRadius: 5,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-white text-gray-900 font-sans">
      {/* Header */}
      <header className="relative bg-white/90 backdrop-blur-lg border-b border-purple-100 px-6 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-md">
            <span className="text-xl font-bold text-white">A</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-purple-600">Authrator</span> <span className="text-gray-600">Admin</span>
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 rounded-lg transition duration-300 backdrop-blur-sm shadow-md flex items-center space-x-2"
        >
          <span>Logout</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-purple-100 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-purple-800 mb-1">Dashboard Overview</h2>
              <p className="text-purple-600 text-sm">Monitor your platform's performance and user engagement</p>
            </div>
            <div className="flex space-x-2 p-1 bg-purple-100 rounded-lg shadow-inner">
              <button
                onClick={() => setTimeRange('7d')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition duration-300 ${
                  timeRange === '7d'
                    ? 'bg-purple-500 text-white shadow-md'
                    : 'text-purple-600 hover:bg-white'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setTimeRange('30d')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition duration-300 ${
                  timeRange === '30d'
                    ? 'bg-purple-500 text-white shadow-md'
                    : 'text-purple-600 hover:bg-white'
                }`}
              >
                30 Days
              </button>
              <button
                onClick={() => setTimeRange('all')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition duration-300 ${
                  timeRange === 'all'
                    ? 'bg-purple-500 text-white shadow-md'
                    : 'text-purple-600 hover:bg-white'
                }`}
              >
                All Time
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="relative">
                <div className="w-12 h-12 border-t-2 border-r-2 border-purple-300 border-opacity-50 rounded-full animate-spin"></div>
                <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-r-2 border-purple-500 border-opacity-80 rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/30 text-red-600 px-6 py-6 rounded-xl text-center shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>{error}</p>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="bg-white rounded-xl p-6 shadow-lg border border-purple-100 relative overflow-hidden group">
                  <h3 className="text-purple-600 text-lg font-medium mb-1">Total Visits</h3>
                  <p className="text-4xl font-bold text-purple-700">{stats?.totalVisits/2 || 0}</p>
                  <div className="mt-4 flex items-center text-sm text-purple-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>Unique users</span>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg border border-purple-100 relative overflow-hidden group">
                  <h3 className="text-purple-600 text-lg font-medium mb-1">Total Downloads</h3>
                  <p className="text-4xl font-bold text-purple-700">{stats?.totalDownloads || 0}</p>
                  <div className="mt-4 flex items-center text-sm text-purple-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    <span>Total file downloads</span>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-purple-100 mb-4">
                <div className="h-96">
                  {stats && <Line data={prepareChartData()} options={chartOptions} />}
                </div>
              </div>
              
              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <div className="bg-white rounded-lg p-4 shadow-lg border border-purple-100 flex items-center">
                  <div className="bg-purple-500/10 rounded-lg p-3 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-purple-600 text-sm font-medium">Conversion Rate</h3>
                    <p className="text-xl font-bold text-purple-700">{stats ? ((stats.totalDownloads / (stats.totalVisits/2)) * 100).toFixed(1) : 0}%</p>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-lg border border-purple-100 flex items-center">
                  <div className="bg-purple-500/10 rounded-lg p-3 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-purple-600 text-sm font-medium">Avg. Daily Visitors</h3>
                    <p className="text-xl font-bold text-purple-700">{stats && stats.visitsPerDay.length > 0 ? Math.round((stats.totalVisits/2) / stats.visitsPerDay.length) : 0}</p>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-lg border border-purple-100 flex items-center">
                  <div className="bg-purple-500/10 rounded-lg p-3 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-purple-600 text-sm font-medium">Growth Rate</h3>
                    <p className="text-xl font-bold text-purple-700">+{stats && stats.visitsPerDay.length > 7 ? Math.round(((stats.visitsPerDay.slice(-7).reduce((a, b) => a + b.count, 0) / stats.visitsPerDay.slice(-14, -7).reduce((a, b) => a + b.count, 0)) - 1) * 100) : 0}%</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;