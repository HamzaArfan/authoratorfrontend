/**
 * Authrator Desktop Client Download Handler
 * 
 * This script manages the download of the Authrator desktop client
 * based on the user's operating system.
 */

// Track download events for analytics
function trackDownload(osType) {
  // This function would integrate with your analytics system
  // For now, we'll just log to the console
  console.log(`Download initiated for ${osType} platform`);
  
  // Example of how you might send this to an analytics endpoint
  if (window.fetch) {
    fetch('/api/analytics/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        platform: osType,
        timestamp: new Date().toISOString(),
        // Any other relevant data
      }),
    }).catch(err => {
      console.error('Failed to track download:', err);
    });
  }
}

// Detect OS and return appropriate download link
function getDownloadLink() {
  const userAgent = navigator.userAgent.toLowerCase();
  let osType = 'unknown';
  let downloadLink = '';
  
  if (userAgent.indexOf('win') !== -1) {
    osType = 'windows';
    downloadLink = '/downloads/authrator-win.exe';
  } else if (userAgent.indexOf('mac') !== -1) {
    osType = 'mac';
    downloadLink = '/downloads/authrator-mac.dmg';
  } else if (userAgent.indexOf('linux') !== -1) {
    osType = 'linux';
    downloadLink = '/downloads/authrator-linux.AppImage';
  } else {
    // Default to Windows version
    osType = 'default-windows';
    downloadLink = '/downloads/authrator-win.exe';
  }
  
  // Track the download event
  trackDownload(osType);
  
  return downloadLink;
}

// Initiate download
function initiateDownload() {
  const downloadLink = getDownloadLink();
  window.location.href = downloadLink;
}

// Export functions for use in other scripts
window.AuthratorDownload = {
  getDownloadLink,
  initiateDownload,
  trackDownload
}; 