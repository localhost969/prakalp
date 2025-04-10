import React from 'react';
import styles from './Navbar.module.css';

interface NavbarProps {
  activeTab: 'dashboard' | 'about';
  setActiveTab: (tab: 'dashboard' | 'about') => void;
  voiceEnabled: boolean;
  setVoiceEnabled: (enabled: boolean) => void;
  onManualRead: () => void;
  countdown: number;
  refreshInterval: number;
  onRefresh: () => void;
  refreshing: boolean;
  lastUpdateTime: string | null;
}

// SVG icons as components for better theming
const SpeakerIcon = () => (
  <svg 
    width="18" 
    height="18" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
  </svg>
);

const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  voiceEnabled,
  setVoiceEnabled,
  onManualRead,
  countdown,
  refreshInterval,
  onRefresh,
  refreshing,
  lastUpdateTime
}) => {
  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.logoArea}>
          <h1 className={styles.titleLarge}>IoT based Patient Health Monitoring System</h1>
          <h1 className={styles.titleShort}>IoT Health Monitor</h1>
        </div>
        
        <div className={styles.controlsRow}>
          <div className={styles.controls}>
            <div className={styles.voiceControl}>
              <label htmlFor="voiceToggle" className={styles.voiceToggleLabel}>Voice:</label>
              <div className={styles.toggleSwitch}>
                <input
                  type="checkbox"
                  id="voiceToggle"
                  checked={voiceEnabled}
                  onChange={() => setVoiceEnabled(!voiceEnabled)}
                  className={styles.voiceToggleCheckbox}
                />
                <label htmlFor="voiceToggle" className={styles.toggleSlider}></label>
              </div>
              
              {voiceEnabled && (
                <button 
                  onClick={onManualRead}
                  className={styles.readDataButton}
                  title="Read Current Health Status"
                  aria-label="Read Current Health Status Aloud"
                >
                  <span className={styles.readIcon}>
                    <SpeakerIcon />
                  </span>
                </button>
              )}
            </div>

            <div className={styles.refreshControls}>
              <div className={styles.countdownTimer}>
                <div className={styles.countdownInner} style={{ width: `${(countdown / refreshInterval) * 100}%` }}></div>
                <span>{countdown}s</span>
              </div>
              <button 
                className={`${styles.refreshButton} ${refreshing ? styles.spinning : ''}`} 
                onClick={onRefresh}
                disabled={refreshing}
                title="Refresh Data"
              >
                ↻
              </button>
              <div className={styles.lastUpdated}>
                {lastUpdateTime || 'N/A'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Full-width tabs row */}
        <div className={styles.fullWidthTabsRow}>
          <nav className={styles.fullWidthTabs}>
            <button 
              className={`${styles.fullWidthTabButton} ${activeTab === 'dashboard' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
            <button 
              className={`${styles.fullWidthTabButton} ${activeTab === 'about' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('about')}
            >
              About
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
