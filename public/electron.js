const { app, BrowserWindow, session, shell, dialog } = require('electron');
const path = require('path');
const url = require('url');

// Enhanced Electron configurations for intranet/corporate environments
// These switches help the app work in restrictive corporate networks like Postman does
app.commandLine.appendSwitch('ignore-certificate-errors');           // Ignore cert errors for self-signed certs
app.commandLine.appendSwitch('ignore-certificate-errors-spki-list'); // Ignore cert pinning issues
app.commandLine.appendSwitch('ignore-ssl-errors');                   // Ignore SSL errors
app.commandLine.appendSwitch('allow-running-insecure-content');      // Allow mixed content
app.commandLine.appendSwitch('disable-web-security');                // Disable CORS for intranet APIs
app.commandLine.appendSwitch('ignore-urlfetcher-cert-requests');     // Ignore cert requests in fetcher

// Check if we're running in development or production
const isDev = process.env.NODE_ENV === 'development';

// Store reference to main window to prevent garbage collection
let mainWindow;
// Add reference to splash screen window
let splashWindow;
// Store reference to auth check interval so we can clear it
let authCheckInterval;

let isQuitting = false;

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Ensure only one instance of the app runs at a time
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  // Handle second instance launch - focus the main window or process the auth URLs
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      
      // Handle potential auth URL in the command line args
      const authUrl = getAuthUrlFromArgs(commandLine);
      if (authUrl) {
        handleAuthUrl(authUrl);
      }
    }
  });
}

// Protocol registration for macOS
app.on('will-finish-launching', () => {
  // Handle open-url events (macOS)
  app.on('open-url', (event, url) => {
    event.preventDefault();
    handleAuthUrl(url);
  });
});

// Extract and process auth URL from command line arguments
function getAuthUrlFromArgs(args) {
  // Check the arguments for auth protocol URLs
  return args.find(arg => arg.startsWith('authrator://'));
}

// Process authenticated user data after redirect
function handleAuthUrl(authUrl) {
  try {
    console.log('Processing auth URL:', authUrl);
    const urlObj = new URL(authUrl);
    
    // Check if this is a success or failure
    if (urlObj.pathname === '/auth/success') {
      // Get the encoded token from URL params
      const token = urlObj.searchParams.get('token');
      if (token) {
        processAuthToken(token);
      } else {
        console.error('No token found in auth URL');
        showAuthError('No authentication token was received.');
      }
    } else if (urlObj.pathname === '/auth/failed') {
      // Handle auth failure
      showAuthError('Google authentication failed');
    }
  } catch (error) {
    console.error('Error processing auth URL:', error);
    showAuthError('Failed to process authentication data');
  }
}

// Process the authentication token
function processAuthToken(token) {
  try {
    // Decode the base64 token and parse the JSON
    const userData = JSON.parse(atob(token));
    
    console.log('Received user data:', userData);
    
    // Store user data in localStorage and set a specific flag for auth success
    mainWindow.webContents.executeJavaScript(`
      localStorage.setItem('userId', '${userData.id}');
      localStorage.setItem('user', '${JSON.stringify(userData)}');
      
      // Set an auth success flag to indicate successful authentication
      localStorage.setItem('auth_success_timestamp', '${Date.now()}');
      
      // Force navigation using location replace to avoid history issues
      window.location.replace('#/app');
      
      // Also trigger a custom event that the app can listen for
      const authEvent = new CustomEvent('auth_success_event');
      window.dispatchEvent(authEvent);
      
      console.log('Authentication successful! Redirecting to dashboard...');
    `);
    
    // As an additional measure, reload the app after a short delay
    setTimeout(() => {
      if (mainWindow) {
        mainWindow.reload();
        
        // After reload, check and redirect if needed
        mainWindow.webContents.once('did-finish-load', () => {
          mainWindow.webContents.executeJavaScript(`
            const user = localStorage.getItem('user');
            const authSuccess = localStorage.getItem('auth_success_timestamp');
            
            if (user && authSuccess) {
              // If we just authenticated successfully, ensure we're on dashboard
              window.location.replace('#/app');
            }
          `);
        });
      }
    }, 500);
  } catch (error) {
    console.error('Error processing auth token:', error);
    showAuthError('Failed to process authentication data');
  }
}

// Show an error dialog for authentication issues
function showAuthError(message) {
  dialog.showErrorBox('Authentication Error', message);
  
  // Also display in the app
  if (mainWindow) {
    mainWindow.webContents.executeJavaScript(`
      console.error('Authentication error: ${message}');
    `);
  }
}


function checkForPendingAuth() {
  // >>> NEW early-exit if the app is in the middle of quitting
  if (isQuitting) return;

  // Check if mainWindow exists and is not destroyed
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  // Additional safety check for webContents
  if (!mainWindow.webContents || mainWindow.webContents.isDestroyed()) {
    return;
  }

  try {                                 // <<< WRAPPED IN try/catch
    mainWindow.webContents.executeJavaScript(`
      (function() {
        const pendingAuth = localStorage.getItem('authrator_pending_auth');
        if (pendingAuth) {
          // Clear the pending auth
          localStorage.removeItem('authrator_pending_auth');
          return pendingAuth;
        }
        return null;
      })()
    `).then(token => {
      if (token) {
        console.log('Found pending auth token');
        processAuthToken(token);
      }
    }).catch(err => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        console.error('Error checking for pending auth:', err);
      }
    });
  } catch (err) {
    // Swallow the “Object has been destroyed” error that appears
    if (!isQuitting) {
      console.error('Error checking for pending auth:', err);
    }
  }
}


// Create splash screen window
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 400,
    transparent: process.platform === 'darwin', // Only use transparency on macOS
    backgroundColor: process.platform === 'darwin' ? null : '#0f172a', // Use solid color on Windows
    frame: false,
    alwaysOnTop: true,
    center: true,
    roundedCorners: true,
    resizable: false,
    skipTaskbar: true, // Don't show in taskbar
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
    },
    show: false, // Don't show until content is loaded
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  splashWindow.on('closed', () => (splashWindow = null));
  splashWindow.webContents.on('did-finish-load', () => {
    splashWindow.show();
    
    // Set a maximum timeout for the splash screen (10 seconds)
    setTimeout(() => {
      if (splashWindow) {
        splashWindow.close();
        if (mainWindow && !mainWindow.isVisible()) {
          mainWindow.show();
        }
      }
    }, 10000);
  });
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true, // Change to true for better security
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
    },
    roundedCorners: true,
    icon: path.join(__dirname, 'icon.png'),
    autoHideMenuBar: true,
    show: false, // Don't show the main window until it's ready
  });

  // Load the index.html file
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  
  // Configure the session to allow access to localhost even when offline
  configureLocalNetworkAccess(mainWindow);
  
  // Add global error handler to prevent crashes
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('Renderer process crashed:', details.reason);
    try {
      // Try to restart the renderer rather than letting it crash with white screen
      mainWindow.reload();
    } catch (err) {
      console.error('Failed to reload after crash:', err);
    }
  });
  
  // Handle uncaught exceptions in the renderer process
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    if (level === 3) { // Error level
      console.error(`Renderer console error: ${message}`);
    }
  });
  
  // Add global error handler to prevent crashes
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('Renderer process crashed:', details.reason);
    try {
      // Try to restart the renderer rather than letting it crash with white screen
      mainWindow.reload();
    } catch (err) {
      console.error('Failed to reload after crash:', err);
    }
  });
  
  // Handle uncaught exceptions in the renderer process
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    if (level === 3) { // Error level
      console.error(`Renderer console error: ${message}`);
    }
  });
  
  // Handle external URLs
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    console.log('Opening external URL:', url);
    
    // For auth URLs, special handling
    if (url.includes('auth-redirect.html') || url.includes('auth-electron.html')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    
    // For Google auth and other external URLs, open in default browser
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    
    return { action: 'allow' };
  });
  
  // Set up page load handler to check for auth data and close splash screen
  mainWindow.webContents.on('did-finish-load', () => {
    // Check for pending authentication after page load
    checkForPendingAuth();
    
    // Close splash screen and show main window
    if (splashWindow) {
      splashWindow.close();
    }
    mainWindow.show();
  });
  
  // Log any errors
  mainWindow.webContents.on('did-fail-load', (e, code, desc) => {
    console.error('Failed to load:', code, desc);
  });
  
  // Set up periodic checks for auth data (for when protocol handler fails)
  authCheckInterval = setInterval(checkForPendingAuth, 3000);
  
  // Clean up interval when window is closed
  mainWindow.on('closed', () => {
    if (authCheckInterval) {
      clearInterval(authCheckInterval);
      authCheckInterval = null;
    }
    mainWindow = null;
  });
  
  // Clean up interval when window is being closed (before-quit event)
  mainWindow.on('close', () => {
    if (authCheckInterval) {
      clearInterval(authCheckInterval);
      authCheckInterval = null;
    }
  });
}

// Configure session to handle network requests properly
function configureLocalNetworkAccess(win) {
  // Handle permissions for local network access
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    // Always allow local network access
    if (permission === 'media' || 
        permission === 'geolocation' || 
        permission === 'notifications' || 
        permission === 'midi' || 
        permission === 'midiSysex') {
      return callback(false);
    }
    
    return callback(true);
  });
  
  // Set net.disableNetworkSpecs to false to allow local network access
  // This helps with allowing network requests when app is offline
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, 
    (details, callback) => {
      // Don't cancel any requests, especially local ones
      callback({ cancel: false });
    }
  );
  
  // Handle connection errors for localhost/127.0.0.1 requests
  session.defaultSession.webRequest.onErrorOccurred((details) => {
    if (details.error && (
        details.error.includes('ERR_CONNECTION_REFUSED') || 
        details.error.includes('net::ERR_CONNECTION_REFUSED')
      )) {
      console.log('Connection refused error:', details.url);
      // Log additional details to help with debugging
      if (win && !win.isDestroyed()) {
        win.webContents.executeJavaScript(`
          console.error('Connection refused for URL: ${details.url}');
        `).catch(err => {
          console.error('Failed to log in renderer:', err);
        });
      }
    }
  });
  
  // Enhanced CORS and security handling for intranet environments
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    // Helper function to check if URL is internal (reusing the same logic from certificate verification)
    const isInternalUrl = (url) => {
      try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;
        
        // Private IP ranges
        const isPrivateIP = (ip) => {
          const cleanIP = ip.split(':')[0];
          const ipv4Patterns = [
            /^127\./,           // 127.0.0.0/8 (localhost)
            /^10\./,            // 10.0.0.0/8 (private)
            /^192\.168\./,      // 192.168.0.0/16 (private)
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // 172.16.0.0/12 (private)
            /^169\.254\./,      // 169.254.0.0/16 (link-local)
            /^fc00:/,           // IPv6 unique local
            /^fe80:/,           // IPv6 link-local
            /^::1$/             // IPv6 loopback
          ];
          return ipv4Patterns.some(pattern => pattern.test(cleanIP));
        };
        
        // Internal hostname patterns
        const isInternalHostname = (hostname) => {
          const internalPatterns = [
            /\.local$/,         /\.internal$/,      /\.corp$/,          /\.lan$/,           
            /\.intranet$/,      /^localhost$/,      /\.test$/,          /\.dev$/,           
            /\.staging$/,       /\.uat$/,           /\.sit$/,           /\.preprod$/,       
            /\.apps\./,         /\.ocp\d*/,         /\.k8s/,            /\.cluster/,        
            /^[^.]+$/           // No TLD (hostname only, likely internal)
          ];
          return internalPatterns.some(pattern => pattern.test(hostname.toLowerCase()));
        };
        
        return isPrivateIP(hostname) || 
               isInternalHostname(hostname) || 
               hostname === 'localhost' || 
               hostname === '127.0.0.1' ||
               !hostname.includes('.') ||
               hostname.split('.').every(part => 
                 !isNaN(parseInt(part)) && parseInt(part) >= 0 && parseInt(part) <= 255
               );
      } catch {
        return false;
      }
    };
    
    // Always add permissive CORS headers for all requests to support intranet APIs
    // This approach is more permissive like Postman to ensure corporate APIs work
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Access-Control-Allow-Origin': ['*'],
        'Access-Control-Allow-Methods': ['GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD'],
        'Access-Control-Allow-Headers': ['*'],
        'Access-Control-Allow-Credentials': ['true'],
        'Access-Control-Expose-Headers': ['*']
      }
    });
  });

  // Handle preflight OPTIONS requests for CORS
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    // Allow all requests to pass through - especially important for intranet APIs
    callback({ cancel: false });
  });
  
  // Generic certificate handling for intranet environments
  session.defaultSession.setCertificateVerifyProc((request, callback) => {
    const { hostname } = request;
    
    // Helper function to check if an IP is in a private range
    const isPrivateIP = (ip) => {
      // Remove any port numbers
      const cleanIP = ip.split(':')[0];
      
      // Check for private IPv4 ranges
      const ipv4Patterns = [
        /^127\./,           // 127.0.0.0/8 (localhost)
        /^10\./,            // 10.0.0.0/8 (private)
        /^192\.168\./,      // 192.168.0.0/16 (private)
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // 172.16.0.0/12 (private)
        /^169\.254\./,      // 169.254.0.0/16 (link-local)
        /^fc00:/,           // IPv6 unique local
        /^fe80:/,           // IPv6 link-local
        /^::1$/             // IPv6 loopback
      ];
      
      return ipv4Patterns.some(pattern => pattern.test(cleanIP));
    };
    
    // Helper function to check if hostname appears to be internal
    const isInternalHostname = (hostname) => {
      // Check for common internal TLDs and patterns
      const internalPatterns = [
        /\.local$/,         // .local domains
        /\.internal$/,      // .internal domains
        /\.corp$/,          // .corp domains
        /\.lan$/,           // .lan domains
        /\.intranet$/,      // .intranet domains
        /^localhost$/,      // localhost
        /\.test$/,          // .test domains (often used internally)
        /\.dev$/,           // .dev domains (often used internally)
        /\.staging$/,       // .staging domains
        /\.uat$/,           // .uat domains
        /\.sit$/,           // .sit domains
        /\.preprod$/,       // .preprod domains
        // Company-specific patterns that are commonly internal
        /\.apps\./,         // OpenShift/Kubernetes apps pattern
        /\.ocp\d*/,         // OpenShift pattern
        /\.k8s/,            // Kubernetes pattern
        /\.cluster/,        // Cluster pattern
        // No TLD (hostname only, likely internal)
        /^[^.]+$/
      ];
      
      return internalPatterns.some(pattern => pattern.test(hostname.toLowerCase()));
    };
    
    // Comprehensive check for internal/intranet environments
    const isInternalRequest = 
      isPrivateIP(hostname) ||                    // Private IP ranges
      isInternalHostname(hostname) ||             // Internal hostname patterns
      hostname === 'localhost' ||                // Explicit localhost
      hostname === '127.0.0.1' ||               // Explicit loopback
      !hostname.includes('.') ||                 // Single word hostnames (likely internal)
      hostname.split('.').every(part =>          // All numeric (IP address)
        !isNaN(parseInt(part)) && parseInt(part) >= 0 && parseInt(part) <= 255
      );
    
    if (isInternalRequest) {
      // For internal requests, bypass certificate verification
      // This allows self-signed certs and invalid certificates common in corporate environments
      callback(0);
    } else {
      // For external requests, use default verification
      // This maintains security for public internet requests
      callback(-3);
    }
  });
  
  // Additional session configurations for intranet environments
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    // Allow all permissions for intranet usage (similar to Postman's permissive approach)
    callback(true);
  });
  
  // Set user agent to mimic a standard browser for better compatibility
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Authrator/1.0';
    callback({ requestHeaders: details.requestHeaders });
  });
  
  // Handle mixed content scenarios common in corporate environments
  session.defaultSession.setPermissionCheckHandler(() => {
    return true; // Allow all permissions for intranet compatibility
  });
}

// Register the protocol handler
app.setAsDefaultProtocolClient('authrator');

// Create window once the app is ready
app.whenReady().then(() => {
  // First create the splash screen
  createSplashWindow();
  
  // Then create the main window
  setTimeout(() => {
    createWindow();
  }, 1000); // Give the splash screen a moment to display
  
  // Check for auth URL in the command line args
  const authUrl = getAuthUrlFromArgs(process.argv);
  if (authUrl) {
    console.log('Found auth URL in command line args:', authUrl);
    handleAuthUrl(authUrl);
  }
});

app.on('window-all-closed', () => {
  // Clean up the auth check interval
  if (authCheckInterval) {
    clearInterval(authCheckInterval);
    authCheckInterval = null;
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Clean up resources before app quits
app.on('before-quit', () => {
  // >>> SET quitting flag so other routines know to stop
  isQuitting = true;

  // Clear the auth check interval
  if (authCheckInterval) {
    clearInterval(authCheckInterval);
    authCheckInterval = null;
  }
});