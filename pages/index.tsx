import React, { useEffect, useState, useRef } from 'react';
import { NextPage } from 'next';
import Image from 'next/image';
import styles from '../styles/Home.module.css';
import { Chart, registerables, ChartData, ChartOptions } from 'chart.js';
import { Line } from 'react-chartjs-2';
// @ts-ignore - Keep suppressing jsPDF AutoTable for now if needed
import 'jspdf-autotable'; 
import annotationPlugin from 'chartjs-plugin-annotation'; // Import the annotation plugin
import VoiceAssistant from '../components/VoiceAssistant';
import Navbar from '../components/Navbar';

// Register Chart.js components and the annotation plugin
Chart.register(...registerables, annotationPlugin);

interface HealthData {
  id: string;
  temperature: number;
  humidity: number;
  heart_rate: number;
  timestamp: string;
}

interface TeamMember {
  name: string;
  role: string;
}

// --- Constants for thresholds ---
const TEMP_HIGH = 37.5;
const TEMP_LOW = 35.0;
const HR_HIGH = 100;
const HR_LOW = 60;
const HUMIDITY_HIGH = 80;
const HUMIDITY_LOW = 30;

// Add these constants near other constants at the top
const TEMP_CRITICAL_HIGH = 38.5;
const TEMP_CRITICAL_LOW = 34.0;
const HR_CRITICAL_HIGH = 120;
const HR_CRITICAL_LOW = 50;
const HUMIDITY_CRITICAL_HIGH = 90;
const HUMIDITY_CRITICAL_LOW = 20;

const Home: NextPage = () => {
  const [healthData, setHealthData] = useState<HealthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'about'>('dashboard');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [activeMetric, setActiveMetric] = useState<'temperature' | 'heart_rate' | 'humidity' | 'all'>('all');
  // --- New State ---
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [alertMessage, setAlertMessage] = useState<string | null>(null); // For voice alerts
  const [voiceEnabled, setVoiceEnabled] = useState(true); // Control for voice alerts
  const [manualReadRequest, setManualReadRequest] = useState(0);
  const [refreshTriggered, setRefreshTriggered] = useState(false);
  const [latestData, setLatestData] = useState<HealthData | null>(null);

  const refreshInterval = 60; // seconds
  const chartRef = useRef<any>(null); // Keep using 'any' for simplicity with gradients if strict typing is complex

  const teamMembers: TeamMember[] = [
    { name: "K Vijay Ratna Babu", role: "Mentor" },
    { name: "Nalgonda Lokesh", role: "Team Leader" },
    { name: "Loukith Jaiswal", role: "Team Member" },
    { name: "Vardhan Boya", role: "Team Member" },
    
    { name: "Pratapa Siddhartha", role: "Team Member" },
  ];

  // --- Data Fetching (no major changes needed here initially) ---
  const fetchData = async () => {
    setRefreshing(true);
    setRefreshTriggered(true); // Indicate refresh was triggered
    try {
      const response = await fetch('https://iot25.vercel.app/api/data');
      if (!response.ok) throw new Error(`Failed to fetch data: ${response.statusText}`);
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        setHealthData(data);
        setLatestData(data[0]); // Set latest data from first item
        setError(null);
      } else {
        throw new Error('Invalid data format received');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(`Error fetching data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setCountdown(refreshInterval); 
      
      // Reset refresh trigger after a delay
      setTimeout(() => {
        setRefreshTriggered(false);
      }, 2000);
    }
  };

  // --- Initial fetch and interval ---
  useEffect(() => {
    fetchData();
    
    const interval = setInterval(fetchData, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, []); // This useEffect remains first in component

  // --- Countdown timer ---
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prevCount => {
        if (prevCount <= 1) return refreshInterval;
        return prevCount - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- Recommendation and Alert Logic ---
  useEffect(() => {
    if (latestData) {
      const { temperature, humidity, heart_rate } = latestData;
      const newRecommendations: string[] = [];
      let criticalAlert: string | null = null;

      // Temperature checks
      if (temperature > TEMP_HIGH) {
        newRecommendations.push("High temperature detected. Monitor for fever symptoms.");
        criticalAlert = criticalAlert || `Warning: Patient's temperature is high.`;
      } else if (temperature < TEMP_LOW) {
        newRecommendations.push("Body temperature below normal range. Provide additional blankets and warm fluids. Monitor for shivering or discomfort.");
        criticalAlert = criticalAlert || `Alert: Patient's body temperature below normal range.`;
      }

      // Heart Rate checks with automatic notification for significant spikes
      if (heart_rate > HR_HIGH + 15) { // Significant elevation
        newRecommendations.push("Significant heart rate elevation detected. System has sent automatic notification to attending physician. Ensure patient is resting comfortably.");
        criticalAlert = criticalAlert || `URGENT: Significant heart rate elevation detected. Doctor notified.`;
      } else if (heart_rate > HR_HIGH) {
        newRecommendations.push("Heart rate elevated above resting range. Recommend rest, deep breathing, and adequate hydration. Monitor for additional symptoms.");
        criticalAlert = criticalAlert || `Alert: Patient's heart rate elevated.`;
      } else if (heart_rate < HR_LOW) {
        newRecommendations.push("Low heart rate detected. Monitor closely.");
        criticalAlert = criticalAlert || `Warning: Patient's heart rate is low.`;
      }

      // Humidity checks
      if (humidity > HUMIDITY_HIGH) {
        newRecommendations.push("Room humidity exceeds comfort range. Adjust climate control or use dehumidifier to improve air quality and breathing comfort.");
      } else if (humidity < HUMIDITY_LOW) {
        newRecommendations.push("Room humidity below optimal range. Consider room humidifier to prevent dry skin and respiratory discomfort. Encourage regular fluid intake.");
        criticalAlert = criticalAlert || "Recommendation: Adjust room humidity for patient comfort.";
      }

      // Combined checks
      if (humidity > HUMIDITY_HIGH && temperature > TEMP_HIGH) {
        newRecommendations.push("High temperature with elevated humidity may impact body cooling. Improve air circulation and consider cooling measures to enhance comfort.");
      }
      if (humidity < HUMIDITY_LOW && heart_rate > HR_HIGH) {
         newRecommendations.push("Elevated heart rate in dry conditions suggests possible fluid needs. Recommend increased water intake and monitor for improvement.");
         criticalAlert = criticalAlert || "Alert: Possible dehydration indicators present.";
      }
      if (humidity < HUMIDITY_LOW && temperature > 37.0) {
         newRecommendations.push("Slightly elevated temperature in dry conditions may increase fluid requirements. Ensure adequate hydration and respiratory comfort.");
      }

      if (newRecommendations.length === 0) {
        newRecommendations.push("All vital signs within normal parameters. Continue routine monitoring per care schedule.");
      }

      setRecommendations(newRecommendations);

      // Set alert only if different from the last one to avoid repetition
      if (criticalAlert && criticalAlert !== alertMessage) {
         setAlertMessage(criticalAlert);
      } else if (!criticalAlert) {
         setAlertMessage(null); // Clear alert if conditions normalize
      }
    }
  }, [latestData]); // Rerun when healthData changes

  // --- Formatting and Status Logic (keep existing functions) ---
  const formatTime = (timestamp: string): string => {
    try {
      // IMPORTANT: Append 'Z' to treat the input string as UTC
      const date = new Date(timestamp + 'Z'); 
      if (isNaN(date.getTime())) throw new Error('Invalid date');

      // Use Intl.DateTimeFormat for robust time zone conversion and formatting
      const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata', // Specify IST time zone
        // timeZoneName: 'shortOffset' // Removed this to simplify output slightly
      };
      
      // Format the date directly into IST
      const formattedString = new Intl.DateTimeFormat('en-IN', options).format(date);
      
      // Reconstruct slightly to match the previous "Date, Time AM/PM" format
      const parts = formattedString.split(', ');
      if (parts.length === 2) {
          const datePart = parts[0];
          const timePart = parts[1]; // This part already includes AM/PM
          return `${datePart}, ${timePart}`; 
      }
      
      // Fallback if format is unexpected (less likely now)
      return formattedString;

    } catch (err) {
      console.error('Date formatting error:', err);
      return 'Invalid date';
    }
  };

  const getStatusClass = (value: number, type: 'temperature' | 'heart_rate' | 'humidity'): string => {
    switch (type) {
      case 'temperature':
        if (value >= TEMP_CRITICAL_HIGH) return styles.criticalHigh;
        if (value > TEMP_HIGH) return styles.high;
        if (value < TEMP_CRITICAL_LOW) return styles.criticalLow;
        if (value < TEMP_LOW) return styles.low;
        return styles.normal;
      case 'heart_rate':
        if (value >= HR_CRITICAL_HIGH) return styles.criticalHigh;
        if (value > HR_HIGH) return styles.high;
        if (value < HR_CRITICAL_LOW) return styles.criticalLow;
        if (value < HR_LOW) return styles.low;
        return styles.normal;
      case 'humidity':
        if (value >= HUMIDITY_CRITICAL_HIGH) return styles.criticalHigh;
        if (value > HUMIDITY_HIGH) return styles.high;
        if (value < HUMIDITY_CRITICAL_LOW) return styles.criticalLow;
        if (value < HUMIDITY_LOW) return styles.low;
        return styles.normal;
      default:
        return styles.normal;
    }
  };

  // --- Chart Data Preparation (minor adjustments possible for style) ---
  const prepareChartData = (): ChartData<'line'> => {
    if (!healthData || healthData.length === 0) {
      return { labels: [], datasets: [{ label: 'No data available', data: [], borderColor: '#dc3545', backgroundColor: 'rgba(220, 53, 69, 0.1)', borderWidth: 2 }] };
    }

    const chartData = [...healthData].reverse().slice(0, 30); // Use last 30 points
    
    // Generate labels using IST time
    const labels = chartData.map(item => {
      try {
        // Parse as UTC
        const date = new Date(item.timestamp + 'Z');
        if (isNaN(date.getTime())) throw new Error('Invalid date');

        // Format specifically for HH:MM AM/PM in IST for the chart axis label
        const options: Intl.DateTimeFormatOptions = {
          hour: 'numeric', // Use 'numeric' for potentially shorter hours like '9' instead of '09'
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Kolkata'
        };
        // Format and make AM/PM lowercase for brevity on the axis
        return new Intl.DateTimeFormat('en-IN', options).format(date).replace(' AM', 'am').replace(' PM', 'pm'); 
      } catch { 
        return 'Invalid'; 
      }
    });

    // Gradient creation (keep existing safe approach)
    let tempGradient = 'rgba(220, 53, 69, 0.2)';
    let heartGradient = 'rgba(0, 123, 255, 0.2)';
    let humidGradient = 'rgba(40, 167, 69, 0.2)';
    
    try {
      const chart = chartRef.current;
      if (chart && chart.ctx) {
        const ctx = chart.ctx;
        const createGradient = (color1: string, color2: string) => {
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, color1);
          gradient.addColorStop(1, color2);
          return gradient;
        };
        tempGradient = createGradient('rgba(220, 53, 69, 0.5)', 'rgba(220, 53, 69, 0.05)'); // Enhanced gradient
        heartGradient = createGradient('rgba(0, 123, 255, 0.5)', 'rgba(0, 123, 255, 0.05)');
        humidGradient = createGradient('rgba(40, 167, 69, 0.5)', 'rgba(40, 167, 69, 0.05)');
      }
    } catch (err) {
      console.error('Error creating gradients:', err);
    }

    const datasets = [
      {
        label: 'Temperature (°C)',
        data: chartData.map(item => item.temperature),
        borderColor: '#dc3545', // Red
        backgroundColor: tempGradient,
        borderWidth: 2, // Slightly thinner line
        tension: 0.4,
        fill: true,
        pointRadius: 2, // Smaller points
        pointHoverRadius: 5,
        pointBackgroundColor: '#dc3545',
        hidden: activeMetric !== 'temperature' && activeMetric !== 'all',
      },
      {
        label: 'Heart Rate (BPM)',
        data: chartData.map(item => item.heart_rate),
        borderColor: '#007bff', // Blue
        backgroundColor: heartGradient,
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 2,
        pointHoverRadius: 5,
        pointBackgroundColor: '#007bff',
        hidden: activeMetric !== 'heart_rate' && activeMetric !== 'all',
      },
      {
        label: 'Humidity (%)',
        data: chartData.map(item => item.humidity),
        borderColor: '#28a745', // Green
        backgroundColor: humidGradient,
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 2,
        pointHoverRadius: 5,
        pointBackgroundColor: '#28a745',
        hidden: activeMetric !== 'humidity' && activeMetric !== 'all',
      }
    ];

    return { labels, datasets };
  };

  // --- Chart Options (minor style refinements) ---
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: false,
        grid: { color: 'rgba(0,0,0,0.05)' },
        border: { display: false },
        ticks: { font: { size: 11 }, padding: 10, color: '#666' }
      },
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 8, font: { size: 11 }, padding: 10, color: '#666' }
      }
    },
    plugins: {
      legend: { display: true, position: 'bottom', labels: { boxWidth: 15, padding: 20, font: { size: 12 } }},
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)', // Darker tooltip
        titleColor: '#fff',
        bodyColor: '#eee',
        borderColor: '#333',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 4,
        // ... (keep existing callbacks)
        callbacks: {
            title: function(tooltipItems) {
              try {
                if (tooltipItems.length > 0) {
                  const index = tooltipItems[0].dataIndex;
                  // Access the same reversed data used for the chart
                  const reversedData = [...healthData].reverse().slice(0, 30); 
                  if (index >= 0 && index < reversedData.length) {
                    const timestamp = reversedData[index].timestamp;
                    // formatTime now correctly handles UTC -> IST conversion
                    const fullIstTime = formatTime(timestamp); 
                    // Extract time part (already formatted with AM/PM)
                    const timePart = fullIstTime.split(',')[1] || 'N/A'; 
                    return `Time: ${timePart}`; 
                  }
                }
              } catch (err) { console.error('Error formatting tooltip title:', err); }
              return 'Time: Unknown';
            },
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) { label += ': '; }
              if (context.parsed.y !== null) {
                // Use includes for flexibility in label names
                if (label.toLowerCase().includes('temp')) { label += context.parsed.y.toFixed(1) + '°C'; } 
                else if (label.toLowerCase().includes('heart')) { label += context.parsed.y + ' BPM'; } 
                else if (label.toLowerCase().includes('humid')) { label += context.parsed.y + '%'; } 
                else { label += context.parsed.y; } // Fallback
              }
              return label;
            }
        }
      }
    },
    interaction: { mode: 'nearest', axis: 'x', intersect: false },
    animations: { // Keep smooth animations
      tension: { duration: 800, easing: 'easeOutQuad', from: 0.2, to: 0.4 }
    },
    elements: { line: { borderJoinStyle: 'round' }, point: { hitRadius: 15 } } // Larger hit radius
  };

  // --- CSV Export (Keep as is, formatTime is now IST) ---
  const exportToCSV = () => {
    try {
      const headers = ['Timestamp (IST)', 'Temperature (°C)', 'Heart Rate (BPM)', 'Humidity (%)']; // Update header
      const csvData = healthData.map(item => [
        `"${formatTime(item.timestamp)}"`, // Enclose timestamp in quotes in case it contains commas
        item.temperature, 
        item.heart_rate, 
        item.humidity
      ]);
      // Use newline correctly and join rows with newline
      let csvContent = headers.join(',') + '\n' + csvData.map(row => row.join(',')).join('\n'); 
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'health-data.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV export error:', err);
      alert('Error exporting CSV. Please try again.');
    }
  };

  // --- Pagination Logic (Keep as is) ---
  const indexOfLastItem = currentPage * itemsPerPage;     
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;  
  const currentItems = healthData.slice(indexOfFirstItem, indexOfLastItem);                     
  const totalPages = Math.ceil(healthData.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  // --- Render the page structure always, with conditional content loading ---
  return (
    <div className={styles.container}>
      <VoiceAssistant 
        healthData={healthData}
        recommendations={recommendations}
        enabled={voiceEnabled} 
        manualReadRequest={manualReadRequest}
        refreshClicked={refreshTriggered}
      />
      
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        voiceEnabled={voiceEnabled}
        setVoiceEnabled={setVoiceEnabled}
        onManualRead={() => setManualReadRequest(prev => prev + 1)}
        countdown={countdown}
        refreshInterval={refreshInterval}
        onRefresh={fetchData}
        refreshing={refreshing}
        lastUpdateTime={latestData ? formatTime(latestData.timestamp).split(',')[1] : null}
      />

      <main className={styles.main}>
        {/* Professional loader that only affects the content */}
        {loading ? (
          <div className={styles.contentLoader}>
            <div className={styles.loaderWrapper}>
              <div className={styles.spinnerContainer}>
                <div className={styles.spinnerCircle}></div>
              </div>
              <p className={styles.loaderText}>Loading health data...</p>
            </div>
          </div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : activeTab === 'dashboard' ? (
          <div className={styles.dashboardLayout}>
            {/* --- Rest of the dashboard components remain unchanged --- */}
            {/* --- SECTION 1: Current Status & Recommendations --- */}
            <section className={styles.currentStatusSection}>
              {/* ...existing code... */}
              <h2 className={styles.sectionTitle}>Current Patient Status</h2>
              {latestData ? (
                <div className={styles.statusGrid}>
                   {/* Temperature Card */}
                   <div className={`${styles.statusCard} ${getStatusClass(latestData.temperature, 'temperature')}`}>
                     <div className={styles.statusIcon}>🌡️</div>
                     <div className={styles.statusValue}>{latestData.temperature.toFixed(1)}°C</div>
                     <div className={styles.statusLabel}>Temperature</div>
                   </div>
                   {/* Heart Rate Card */}
                   <div className={`${styles.statusCard} ${getStatusClass(latestData.heart_rate, 'heart_rate')}`}>
                     <div className={styles.statusIcon}>❤️</div>
                     <div className={styles.statusValue}>{latestData.heart_rate} BPM</div>
                     <div className={styles.statusLabel}>Heart Rate</div>
                   </div>
                   {/* Humidity Card */}
                   <div className={`${styles.statusCard} ${getStatusClass(latestData.humidity, 'humidity')}`}>
                     <div className={styles.statusIcon}>💧</div>
                     <div className={styles.statusValue}>{latestData.humidity}%</div>
                     <div className={styles.statusLabel}>Humidity</div>
                   </div>
                </div>
              ) : (
                <p className={styles.noDataMessageSmall}>Waiting for initial data...</p>
              )}

              {/* Recommendations Area */}
              {recommendations.length > 0 && (
                 <div className={styles.recommendationsBox}>
                    <h3 className={styles.recommendationsTitle}>Recommendations & Alerts</h3>
                    <ul className={styles.recommendationsList}>
                       {recommendations.map((rec, index) => (
                         <li key={index} className={styles.recommendationItem}>
                           <span className={styles.recIcon}>💡</span> {rec}
                         </li>
                       ))}
                    </ul>
                 </div>
              )}
            </section>

            {/* --- SECTION 2: Data Trends (Graph) --- */}
            <section className={styles.graphSection}>
              {/* ...existing code... */}
              <div className={styles.graphHeader}>
                 <h2 className={styles.sectionTitle}>Health Data Trends</h2>
                 <div className={styles.metricTabs}>
                   <button 
                     className={`${styles.metricTab} ${activeMetric === 'all' ? styles.activeMetricTab : ''}`}
                     onClick={() => setActiveMetric('all')} > All </button>
                   <button 
                     className={`${styles.metricTab} ${activeMetric === 'temperature' ? styles.activeMetricTab : ''}`}
                     onClick={() => setActiveMetric('temperature')} > Temp </button>
                   <button 
                     className={`${styles.metricTab} ${activeMetric === 'heart_rate' ? styles.activeMetricTab : ''}`}
                     onClick={() => setActiveMetric('heart_rate')} > Heart Rate </button>
                   <button 
                     className={`${styles.metricTab} ${activeMetric === 'humidity' ? styles.activeMetricTab : ''}`}
                     onClick={() => setActiveMetric('humidity')} > Humidity </button>
                 </div>
              </div>
              <div className={styles.graphContainer}>
                {healthData.length > 0 ? (
                  <React.Suspense fallback={<div className={styles.loaderSmall}>Loading Chart...</div>}>
                    <Line data={prepareChartData()} options={chartOptions} ref={chartRef} redraw={false} />
                  </React.Suspense>
                ) : (
                  <div className={styles.noDataMessage}>No historical data to display chart.</div>
                )}
              </div>
              {/* Add ranges under graph */}
              <div className={styles.legendRanges}>
                <p><strong>Temperature:</strong> Critical: &lt;{TEMP_CRITICAL_LOW}°C, {TEMP_CRITICAL_HIGH}°C+ | Normal: {TEMP_LOW}°C - {TEMP_HIGH}°C</p>
                <p><strong>Heart Rate:</strong> Critical: &lt;{HR_CRITICAL_LOW}, {HR_CRITICAL_HIGH}+ BPM | Normal: {HR_LOW} - {HR_HIGH} BPM</p>
                <p><strong>Humidity:</strong> Critical: &lt;{HUMIDITY_CRITICAL_LOW}%, {HUMIDITY_CRITICAL_HIGH}%+ | Normal: {HUMIDITY_LOW}% - {HUMIDITY_HIGH}%</p>
              </div>
            </section>

            {/* --- SECTION 3: Data Log (Table) --- */}
            <section className={styles.tableSection}>
              {/* ...existing code... */}
              <div className={styles.tableHeader}>
                 <h2 className={styles.sectionTitle}>Data Log</h2>
                 <button className={`${styles.exportButton} ${styles.csvButton}`} onClick={exportToCSV}>
                   Export CSV
                 </button>
               </div>
               <div className={styles.tableContainer}>
                 <table className={styles.dataTable}>
                   <thead>
                     <tr>
                       <th className={styles.timeColumn}>Timestamp</th>
                       <th>
                         <div className={styles.columnHeader}>
                           Temperature
                           <span className={styles.healthyRange}>
                             Normal: {TEMP_LOW}°C - {TEMP_HIGH}°C
                           </span>
                         </div>
                       </th>
                       <th>
                         <div className={styles.columnHeader}>
                           Heart Rate
                           <span className={styles.healthyRange}>
                             Normal: {HR_LOW} - {HR_HIGH} BPM
                           </span>
                         </div>
                       </th>
                       <th>
                         <div className={styles.columnHeader}>
                           Humidity
                           <span className={styles.healthyRange}>
                             Normal: {HUMIDITY_LOW}% - {HUMIDITY_HIGH}%
                           </span>
                         </div>
                       </th>
                     </tr>
                   </thead>
                   <tbody>
                     {currentItems.length > 0 ? currentItems.map((log) => (
                       <tr key={log.id}>
                         <td className={styles.timeColumn}>
                           <div className={styles.timeDisplay}>
                             <div className={styles.timeDetails}>
                               <div className={styles.timeDate}>{formatTime(log.timestamp).split(',')[0]}</div>
                               <div className={styles.timeHour}>{formatTime(log.timestamp).split(',')[1]}</div>
                             </div>
                           </div>
                         </td>
                         <td className={getStatusClass(log.temperature, 'temperature')}>
                           <div className={styles.tableValue}>
                             <div className={styles.statusIndicator}></div> {log.temperature.toFixed(1)}°C
                           </div>
                         </td>
                         <td className={getStatusClass(log.heart_rate, 'heart_rate')}>
                            <div className={styles.tableValue}>
                             <div className={styles.statusIndicator}></div> {log.heart_rate} BPM
                           </div>
                         </td>
                         <td className={getStatusClass(log.humidity, 'humidity')}>
                            <div className={styles.tableValue}>
                             <div className={styles.statusIndicator}></div> {log.humidity}%
                           </div>
                         </td>
                       </tr>
                     )) : (
                        <tr><td colSpan={4} className={styles.noDataMessageSmall}>No data entries yet.</td></tr>
                     )}
                   </tbody>
                 </table>
               </div>

{/* Status Legend */}
<div className={styles.statusLegend}>
  <div className={styles.legendTitle}>Status Indicators:</div>
  <div className={styles.legendItems}>
    <div className={styles.legendItem}>
      <div className={`${styles.legendIndicator} ${styles.criticalHighIndicator}`}></div>
      <span>Critical High</span>
    </div>
    <div className={styles.legendItem}>
      <div className={`${styles.legendIndicator} ${styles.highIndicator}`}></div>
      <span>High</span>
    </div>
    <div className={styles.legendItem}>
      <div className={`${styles.legendIndicator} ${styles.normalIndicator}`}></div>
      <span>Normal</span>
    </div>
    <div className={styles.legendItem}>
      <div className={`${styles.legendIndicator} ${styles.lowIndicator}`}></div>
      <span>Low</span>
    </div>
    <div className={styles.legendItem}>
      <div className={`${styles.legendIndicator} ${styles.criticalLowIndicator}`}></div>
      <span>Critical Low</span>
    </div>
  </div>
</div>

{/* Pagination Controls */}
               {totalPages > 1 && (
                 <div className={styles.pagination}>
                    <div className={styles.pageControls}>
                     <button onClick={prevPage} disabled={currentPage === 1} className={styles.paginationButton}> Prev </button>
                     <span className={styles.pageInfo}> Page {currentPage} of {totalPages} </span>
                     <button onClick={nextPage} disabled={currentPage === totalPages} className={styles.paginationButton}> Next </button>
                    </div>
                    <div className={styles.itemsPerPageControl}>
                     <label htmlFor="itemsPerPage">Per page:</label>
                     <select id="itemsPerPage" value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className={styles.itemsPerPageSelect} >
                       <option value={5}>5</option>
                       <option value={10}>10</option>
                       <option value={20}>20</option>
                     </select>
                    </div>
                 </div>
               )}
            </section>
          </div>
        ) : (
          // --- About Section remains the same ---
          <div className={styles.aboutSection}>
            {/* ...existing code... */}
            <div className={styles.projectInfo}>
              <h2>Project Overview</h2>
              <p>
                This project presents an IoT-based health monitoring system using an ESP32
                microcontroller. It integrates a temperature and humidity sensor (DHT11) and a heart rate
                sensor to collect vital health data. The collected data is:
              </p>
              <ul className={styles.featureList}>
                <li>Displayed on an OLED screen for immediate viewing.</li>
                <li>Monitored remotely via the Blynk app, providing real-time updates on a mobile device.</li>
                <li>Sent as an SMS alert through Twilio if any abnormal values (like high temperature or irregular heart rate) are detected.</li>
                <li>Posted to this custom web interface, enabling remote monitoring from any browser.</li>
              </ul>
              <p>
                This multi-platform approach ensures comprehensive health tracking, real-time alerts, and
                user-friendly access. The system is ideal for patient care, elderly monitoring, and health
                awareness in remote areas.
              </p>

              <div className={styles.architectureSection}>
                <h3>System Architecture</h3>
                <div className={styles.architectureImage}>
                  <Image 
                    src="https://i.ibb.co/RdGT7Lg/image.png"
                    alt="System Architecture Diagram"
                    width={800}
                    height={400}
                    unoptimized={true}
                    className={styles.archImg}
                  />
                </div>
              </div>
            </div>

            <div className={styles.teamSection}>
              <h2>Team Members</h2>
              <div className={styles.teamGrid}>
                <div className={styles.mentorRow}>
                  <div className={styles.teamMember}>
                    <div className={styles.memberAvatar}>
                      {teamMembers[0].name.charAt(0)}
                    </div>
                    <div className={styles.memberInfo}>
                      <h3>{teamMembers[0].name}</h3>
                      <p>{teamMembers[0].role}</p>
                    </div>
                  </div>
                </div>
                <div className={styles.membersGrid}>
                  {teamMembers.slice(1).map((member, index) => (
                    <div key={index} className={styles.teamMember}>
                      <div className={styles.memberAvatar}>
                        {member.name.charAt(0)}
                      </div>
                      <div className={styles.memberInfo}>
                        <h3>{member.name}</h3>
                        <p>{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- Footer --- Always rendered */}
      <footer className={styles.footer}>
        <p>This project was made for PRAKALP-2025 </p>
        
      </footer>
    </div>
  );
};

export default Home;
