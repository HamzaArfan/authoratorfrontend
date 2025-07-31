import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend
);

const ResponseAnalytics = ({ api }) => {
  if (!api?.responseData) return null;

  // Transform request history for time series
  const timeSeriesData = api.requestHistory?.slice(-10).map((request, index) => ({
    id: index + 1,
    time: typeof request.responseTime === 'number' ? request.responseTime : 0,
    status: request.status,
    success: request.success,
    timestamp: new Date(request.timestamp).toLocaleTimeString()
  })) || [];

  // Enhanced status distribution data
  const statusData = api.requestHistory?.reduce((acc, request) => {
    const statusGroup = Math.floor(request.status / 100) * 100;
    const statusLabel = {
      200: 'Success',
      300: 'Redirect',
      400: 'Client Error',
      500: 'Server Error',
      0: 'Network Error'
    }[statusGroup] || 'Unknown';
    
    acc[statusGroup] = {
      count: (acc[statusGroup]?.count || 0) + 1,
      label: statusLabel
    };
    return acc;
  }, {}) || {};

  const statusChartData = Object.entries(statusData).map(([status, data]) => ({
    status: data.label,
    count: data.count,
    label: `${data.label}: ${data.count}`
  }));

  const COLORS = ['#06B6D4', '#818CF8', '#FBBF24', '#EC4899', '#EF4444'];
  const DARK_COLORS = ['#22D3EE', '#A5B4FC', '#FDE68A', '#F472B6', '#FCA5A5'];

  const sizeData = api.requestHistory?.slice(-10).map((request, index) => ({
    id: index + 1,
    size: request.responseSize / 1024,
    timestamp: new Date(request.timestamp).toLocaleTimeString()
  })) || [];

  // Calculate success rate
  const successRate = api.requestHistory?.length > 0
    ? ((api.requestHistory.filter(req => req.success).length / api.requestHistory.length) * 100).toFixed(1)
    : 0;

  const avgResponseTime = api.requestHistory?.length > 0
    ? (api.requestHistory.reduce((sum, req) => sum + req.responseTime, 0) / api.requestHistory.length).toFixed(1)
    : 0;

  // Chart.js data config for Response Time Chart
  const responseTimeChartData = {
    labels: timeSeriesData.map(item => item.timestamp),
    datasets: [
      {
        label: 'Response Time (ms)',
        data: timeSeriesData.map(item => item.time),
        borderColor: '#06B6D4',
        backgroundColor: 'rgba(6, 182, 212, 0.2)',
        borderWidth: 2,
        tension: 0.4,
        pointBackgroundColor: '#06B6D4',
        pointBorderColor: '#fff',
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ]
  };

  // Chart.js data config for Status Distribution Chart
  const statusDistributionData = {
    labels: statusChartData.map(item => item.status),
    datasets: [
      {
        data: statusChartData.map(item => item.count),
        backgroundColor: window.matchMedia('(prefers-color-scheme: dark)').matches ? DARK_COLORS : COLORS,
        borderWidth: 0,
        hoverOffset: 5,
      }
    ]
  };

  // Chart.js data config for Response Size Chart
  const responseSizeChartData = {
    labels: sizeData.map(item => item.timestamp),
    datasets: [
      {
        label: 'Size (KB)',
        data: sizeData.map(item => item.size),
        backgroundColor: '#818CF8',
        borderColor: '#6366F1',
        borderWidth: 1,
        borderRadius: 4,
      }
    ]
  };

  // Common chart options
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 12,
          },
          color: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#F3F4F6' : '#4B5563',
        },
      },
      tooltip: {
        backgroundColor: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#374151' : '#fff',
        titleColor: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#F3F4F6' : '#111827',
        bodyColor: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#D1D5DB' : '#4B5563',
        borderColor: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#4B5563' : '#E5E7EB',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 6,
      },
    },
  };

  // Line chart options
  const lineChartOptions = {
    ...commonOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#D1D5DB' : '#4B5563',
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#D1D5DB' : '#4B5563',
        }
      }
    }
  };

  // Bar chart options
  const barChartOptions = {
    ...commonOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#D1D5DB' : '#4B5563',
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#D1D5DB' : '#4B5563',
        }
      }
    }
  };

  // Pie chart options
  const pieChartOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      legend: {
        ...commonOptions.plugins.legend,
        position: 'right',
      },
      tooltip: {
        ...commonOptions.plugins.tooltip,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <div className="flex-1 overflow-auto p-6 space-y-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-100">
            Current Request Metrics
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/30 dark:to-blue-900/30 p-4 rounded-xl">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Response Time</p>
              <div className="flex items-baseline">
                <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                  {api.responseData.responseTime || 0}
                </p>
                <span className="ml-1 text-sm font-medium text-gray-500 dark:text-gray-400">ms</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Avg: {avgResponseTime}ms
              </p>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 p-4 rounded-xl">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Success Rate</p>
              <div className="flex items-baseline">
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {successRate}
                </p>
                <span className="ml-1 text-sm font-medium text-gray-500 dark:text-gray-400">%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-100">
            Response Time Trend
          </h3>
          <div className="h-64">
            <Line data={responseTimeChartData} options={lineChartOptions} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-100">
            Status Distribution
          </h3>
          <div className="h-64">
            <Pie data={statusDistributionData} options={pieChartOptions} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-100">
            Response Size Trend
          </h3>
          <div className="h-64">
            <Bar data={responseSizeChartData} options={barChartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponseAnalytics;