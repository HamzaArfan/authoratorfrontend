import React, { useState, useRef, useEffect } from 'react';
import { Settings,Check, Trash, AlertTriangle, Clock,Send, Folder,Menu, Plus,Search,Edit2, X, ChevronDown, Save ,Sun,Moon, PlusCircle, FolderClosed, FolderPlus, Database, Lock, Code, CodeSquare, Circle, ExternalLink, ArrowUpDown, Download, Upload, Copy, Trash2, Pencil, MoreVertical, Play, Terminal, FolderCheckIcon, HistoryIcon, Info, MessageSquare, Wifi, WifiOff, KeyRound, Cookie, MousePointer2, Antenna, Rotate3d, TerminalSquare, Dot, MoreHorizontal, LayoutTemplate, DatabaseZapIcon, CloudLightningIcon, Atom, ZapIcon, Globe, Key, AlertCircle, FileX, ShieldCheck, ChevronRight, ChevronLeft, Settings2, HelpCircle, Book, Mail } from 'lucide-react';
import ResponseAnalytics from './ResponseAnalytics';
import logo from "./imgpsh.png"
import EnvironmentManager from './EnvironmentManager';
import RequestHistory from './History';
import CustomDropdown from './CustomDropdown';
import PerformanceTestingPanel, { PerformanceTestingNotification } from './PerformanceTesting';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';
import ApiTabs from './ApiTabs';
import Checkbox from './Checkbox';
import RequestHistoryPanel from './History';
import AuthTemplateManager from './AuthTemplateManager';
import EnvironmentManagementPanel from './EnvironmentManager';
import InfoSection from './InfoSection';
import DesktopDownload from './DesktopDownload';
import PostmanImportExport from './PostmanImportExport';
import { useCallback } from 'react';
import debounce from 'lodash/debounce';
import axios from 'axios';
import {useNavigate} from "react-router-dom";
import RenameModal from './RenameModel';
import Toast from './Toast';
import EnhancedJsonViewer from './EnhancedJsonViewer';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://authrator.com/db-api/api';

const createDebouncedUpdate = (updateFn) => {
  return debounce(updateFn, 5000, { maxWait: 5000 });
};

// Functions for localStorage persistence of default header settings
const saveDefaultHeaderSettings = (settings) => {
  try {
    localStorage.setItem('authrator_default_header_settings', JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save default header settings:', error);
  }
};

const loadDefaultHeaderSettings = () => {
  try {
    const savedSettings = localStorage.getItem('authrator_default_header_settings');
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
  } catch (error) {
    console.error('Failed to load default header settings:', error);
  }
  // Return default settings if none saved or error occurred
  return {
    enableUserAgent: true,
    enableCacheControl: true,
    enableConnection: true
  };
};

// Function to get default headers that should be added to every API request (like Postman)
const getDefaultHeaders = () => [
  { key: 'User-Agent', value: 'Authrator-Client' },
  { key: 'Cache-Control', value: 'no-cache' },
  { key: 'Connection', value: 'keep-alive' }
];

// Function to get enabled default headers based on settings
const getEnabledDefaultHeaders = (settings) => {
  // If no settings provided, use localStorage settings
  const finalSettings = settings && Object.keys(settings).length > 0 ? settings : loadDefaultHeaderSettings();
  const allDefaults = getDefaultHeaders();
  return allDefaults.filter(header => {
    switch(header.key) {
      case 'User-Agent':
        return finalSettings?.enableUserAgent !== false; // Default enabled
      case 'Cache-Control':
        return finalSettings?.enableCacheControl !== false; // Default enabled
      case 'Connection':
        return finalSettings?.enableConnection !== false; // Default enabled
      default:
        return true;
    }
  });
};

// Function to ensure API has all enabled default headers
const ensureApiHasDefaultHeaders = (existingHeaders, settings = {}) => {
  const headers = [...existingHeaders];
  const headerKeys = headers.map(h => h.key.toLowerCase());
  
  // If no settings provided, use localStorage settings
  const finalSettings = settings && Object.keys(settings).length > 0 ? settings : loadDefaultHeaderSettings();
  
  // Add enabled default headers if they don't already exist
  const enabledDefaults = getEnabledDefaultHeaders(finalSettings);
  enabledDefaults.forEach(defaultHeader => {
    if (!headerKeys.includes(defaultHeader.key.toLowerCase())) {
      headers.push(defaultHeader);
    }
  });
  
  return headers;
};

// Function to get appropriate Content-Type based on body type and format
const getContentTypeForBody = (bodyType, rawFormat = 'json') => {
  switch (bodyType) {
    case 'raw':
      switch (rawFormat) {
        case 'json':
          return 'application/json';
        case 'xml':
          return 'application/xml';
        case 'text':
          return 'text/plain';
        default:
          return 'application/json';
      }
    case 'formData':
      return 'multipart/form-data';
    case 'urlencoded':
      return 'application/x-www-form-urlencoded';
    default:
      return null;
  }
};

// Function to manage Content-Type header based on body configuration
const manageContentTypeHeader = (headers, body) => {
  const newHeaders = [...headers];
  const contentTypeIndex = newHeaders.findIndex(h => h.key.toLowerCase() === 'content-type');
  const requiredContentType = getContentTypeForBody(body.type, body.rawFormat);
  
  // Check if body has meaningful content
  const hasContent = body.type !== 'none' && (
    (body.type === 'raw' && body.content?.trim()) ||
    (body.type === 'formData' && body.formData?.some(item => item.key?.trim() || item.value?.trim())) ||
    (body.type === 'urlencoded' && body.urlencoded?.some(item => item.key?.trim() || item.value?.trim()))
  );
  
  // If body type is 'none' or has no meaningful content, remove Content-Type header if it exists
  if (!hasContent) {
    if (contentTypeIndex !== -1) {
      newHeaders.splice(contentTypeIndex, 1);
    }
    return newHeaders;
  }
  
  // If we need a Content-Type header and body has content
  if (requiredContentType) {
    if (contentTypeIndex !== -1) {
      // Update existing Content-Type header
      newHeaders[contentTypeIndex].value = requiredContentType;
    } else {
      // Add new Content-Type header
      newHeaders.push({ key: 'Content-Type', value: requiredContentType });
    }
  }
  
  return newHeaders;
};

// Function to check if a header is auto-managed (cannot be deleted/edited)
const isAutoManagedHeader = (headerKey, body) => {
  const defaultHeaders = ['User-Agent', 'Cache-Control', 'Connection'];
  const isDefaultHeader = defaultHeaders.includes(headerKey);
  
  // Content-Type is auto-managed when body has meaningful content
  const isAutoContentType = headerKey.toLowerCase() === 'content-type' && body.type !== 'none' && (
    (body.type === 'raw' && body.content?.trim()) ||
    (body.type === 'formData' && body.formData?.some(item => item.key?.trim() || item.value?.trim())) ||
    (body.type === 'urlencoded' && body.urlencoded?.some(item => item.key?.trim() || item.value?.trim()))
  );
  
  return isDefaultHeader || isAutoContentType;
};

const JwtDecoder = () => {
  const [token, setToken] = useState('');
  const [decodedHeader, setDecodedHeader] = useState(null);
  const [decodedPayload, setDecodedPayload] = useState(null);
  const [error, setError] = useState(null);

  const decodeJwt = (token) => {
    try {
      setError(null);
      
      if (!token || token.trim() === '') {
        setDecodedHeader(null);
        setDecodedPayload(null);
        return;
      }
      
      const parts = token.split('.');
      if (parts.length !== 3) {
        setError('Invalid JWT token format. Expected format: header.payload.signature');
        setDecodedHeader(null);
        setDecodedPayload(null);
        return;
      }
      
      const base64UrlDecode = (str) => {
        let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
          base64 += '=';
        }
        try {
          return JSON.parse(atob(base64));
        } catch (e) {
          return atob(base64);
        }
      };
      
      try {
        const header = base64UrlDecode(parts[0]);
        setDecodedHeader(header);
      } catch (e) {
        setError('Failed to decode header: ' + e.message);
        setDecodedHeader(null);
      }
      
      try {
        const payload = base64UrlDecode(parts[1]);
        setDecodedPayload(payload);
      } catch (e) {
        setError('Failed to decode payload: ' + e.message);
        setDecodedPayload(null);
      }
    } catch (e) {
      setError('Error decoding token: ' + e.message);
      setDecodedHeader(null);
      setDecodedPayload(null);
    }
  };

  useEffect(() => {
    decodeJwt(token);
  }, [token]);

  const formatJwtData = (data) => {
    if (!data) return null;
    
    return (
      <div className="mt-4 space-y-2">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="bg-gray-50 dark:bg-zinc-800 p-2 rounded">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{key}</div>
            <div className="text-sm font-mono break-all dark:text-white">
              {typeof value === 'object' 
                ? JSON.stringify(value, null, 2) 
                : String(value)
              }
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto">
      <h2 className="text-lg font-semibold dark:text-white mb-4">JWT Decoder</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Enter JWT Token
        </label>
        <textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste your JWT token here"
          className="w-full h-24 px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded-md dark:bg-zinc-800 dark:text-white"
        />
      </div>
      
      {error && (
        <div className="mb-4 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-md text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
      
      {(decodedHeader || decodedPayload) && (
        <div className="border border-gray-200 dark:border-zinc-700 rounded-md divide-y divide-gray-200 dark:divide-gray-700">
          {decodedHeader && (
            <div className="p-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Header</h3>
              <pre className="bg-gray-50 dark:bg-zinc-800 p-2 rounded text-xs overflow-x-auto dark:text-white">
                {JSON.stringify(decodedHeader, null, 2)}
              </pre>
            </div>
          )}
          
          {decodedPayload && (
            <div className="p-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Payload</h3>
              {formatJwtData(decodedPayload)}
            </div>
          )}
          
          <div className="p-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Signature</h3>
            <div className="bg-gray-50 dark:bg-zinc-800 p-2 rounded text-xs text-gray-500 dark:text-gray-400">
              [Signature encoded data]
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const KeyGenerator = () => {
  const [privateKey, setPrivateKey] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [certificate, setCertificate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  // Create a helper function to handle copying
  const handleCopy = (keyType, text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyType);
    
    // Reset the copied state after 2 seconds
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };
  const [certDetails, setCertDetails] = useState({
    countryName: '',
    stateOrProvince: '',
    localityName: '',
    organizationName: '',
    organizationalUnitName: '',
    commonName: '',
    emailAddress: ''
  });

  // Add isElectron function to KeyGenerator component
  const isElectron = () => {
    return navigator.userAgent.indexOf('Electron') !== -1 ||
           (window && window.process && window.process.versions && window.process.versions.electron);
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCertDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const generateKeys = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setSuccess(false);
  
      const forge = require('node-forge');
  
      if (isElectron()) {
        // Use Web Crypto API only (no forge randomness)
        const subtle = window.crypto.subtle;
  
        const keyPair = await subtle.generateKey(
          {
            name: "RSASSA-PKCS1-v1_5",
            modulusLength: 2048,
            publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
            hash: "SHA-256"
          },
          true,
          ["sign", "verify"]
        );
  
        const privateKey = await subtle.exportKey("pkcs8", keyPair.privateKey);
        const publicKey = await subtle.exportKey("spki", keyPair.publicKey);
  
        // Convert ArrayBuffers to PEM
        const arrayBufferToBase64 = (buffer) => {
          const binary = String.fromCharCode.apply(null, new Uint8Array(buffer));
          return window.btoa(binary);
        };
  
        const wrapPem = (base64, type) => {
          const lines = base64.match(/.{1,64}/g).join('\n');
          return `-----BEGIN ${type}-----\n${lines}\n-----END ${type}-----`;
        };
  
        const privateKeyPem = wrapPem(arrayBufferToBase64(privateKey), "PRIVATE KEY");
        const publicKeyPem = wrapPem(arrayBufferToBase64(publicKey), "PUBLIC KEY");
  
        setPrivateKey(privateKeyPem);
        setPublicKey(publicKeyPem);
        setCertificate(''); // Or generate a dummy self-signed cert if needed
  
        localStorage.setItem('jwt_keys', JSON.stringify({
          privateKey: privateKeyPem,
          publicKey: publicKeyPem,
          certificate: ''
        }));
  
        setSuccess(true);
  
      } else {
        // Browser / default behavior (Forge + entropy)
        const getRandomValues = (length) => {
          const array = new Uint8Array(length);
          window.crypto.getRandomValues(array);
          return array;
        };
  
        const entropy = getRandomValues(64);
        const entropyStr = Array.from(entropy).map(b => b.toString(16).padStart(2, '0')).join('');
        
        forge.random.collect(entropyStr);
        forge.random.collect(navigator.userAgent);
        forge.random.collect(new Date().toString());
        forge.random.collect(window.performance.now().toString());
  
        const keypair = forge.pki.rsa.generateKeyPair({
          bits: 2048,
          workers: -1
        });
  
        const cert = forge.pki.createCertificate();
        cert.publicKey = keypair.publicKey;
        cert.serialNumber = '01';
        cert.validity.notBefore = new Date();
        cert.validity.notAfter = new Date();
        cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
  
        const attrs = [{
          name: 'commonName',
          value: certDetails.commonName || 'localhost'
        }, {
          name: 'countryName',
          value: certDetails.countryName || 'US'
        }, {
          shortName: 'ST',
          value: certDetails.stateOrProvince || 'State'
        }, {
          name: 'localityName',
          value: certDetails.localityName || 'Locality'
        }, {
          name: 'organizationName',
          value: certDetails.organizationName || 'Organization'
        }, {
          shortName: 'OU',
          value: certDetails.organizationalUnitName || 'Unit'
        }, {
          name: 'emailAddress',
          value: certDetails.emailAddress || 'email@example.com'
        }];
  
        cert.setSubject(attrs);
        cert.setIssuer(attrs);
        cert.sign(keypair.privateKey, forge.md.sha256.create());
  
        const privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);
        const publicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey);
        const certificatePem = forge.pki.certificateToPem(cert);
  
        setPrivateKey(privateKeyPem);
        setPublicKey(publicKeyPem);
        setCertificate(certificatePem);
  
        localStorage.setItem('jwt_keys', JSON.stringify({
          privateKey: privateKeyPem,
          publicKey: publicKeyPem,
          certificate: certificatePem
        }));
  
        setSuccess(true);
      }
  
    } catch (err) {
      console.error('Error generating keys:', err);
      setError(`Error generating keys: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };
  

  return (
    <div className="p-4 h-full overflow-y-auto">
      <h3 className="text-lg font-semibold mb-4 sticky top-0 bg-white dark:bg-zinc-900 py-2 text-gray-800 dark:text-gray-100">Generate JWT Keys</h3>
      
      <div className="space-y-4">

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Country Name (Two Letter Code)</label>
          <input
            type="text"
            name="countryName"
            value={certDetails.countryName}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
            placeholder="US"
            maxLength={2}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">State or Province</label>
          <input
            type="text"
            name="stateOrProvince"
            value={certDetails.stateOrProvince}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
            placeholder="California"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Locality Name</label>
          <input
            type="text"
            name="localityName"
            value={certDetails.localityName}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
            placeholder="San Francisco"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Organization Name</label>
          <input
            type="text"
            name="organizationName"
            value={certDetails.organizationName}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
            placeholder="Company Name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Organizational Unit Name</label>
          <input
            type="text"
            name="organizationalUnitName"
            value={certDetails.organizationalUnitName}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
            placeholder="IT Department"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Common Name</label>
          <input
            type="text"
            name="commonName"
            value={certDetails.commonName}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
            placeholder="example.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Email Address</label>
          <input
            type="email"
            name="emailAddress"
            value={certDetails.emailAddress}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
            placeholder="user@example.com"
          />
        </div>

        <button
          onClick={generateKeys}
          disabled={isGenerating}
          className="w-full bg-purple-500 text-white py-2 px-4 rounded hover:bg-pruple-600 dark:bg-purple-600 dark:hover:bg-purple-700 disabled:bg-gray-400 dark:disabled:bg-gray-600"
        >
          {isGenerating ? 'Generating...' : 'Generate Keys'}
        </button>

        {error && (
          <div className="text-red-600 dark:text-red-400 mt-2">{error}</div>
        )}

{success && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-100">Generated Keys:</h4>
            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Private Key (for JWT Signing):</label>
                <textarea
                  value={privateKey}
                  readOnly
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded font-mono text-sm bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
                  rows={4}
                />
                <div className="flex items-center justify-between mt-2">
                  <button 
                    onClick={() => handleCopy('privateKey', privateKey)}
                    className="bg-purple-500 text-white py-1 px-2 rounded text-xs hover:bg-purple-600"
                  >
                    Copy Private Key
                  </button>
                  {copiedKey === 'privateKey' && (
                    <span className="text-green-600 text-xs">Copied!</span>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Public Key (for JWT Verification):</label>
                <textarea
                  value={publicKey}
                  readOnly
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded font-mono text-sm bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
                  rows={4}
                />
                <div className="flex items-center justify-between mt-2">
                  <button 
                    onClick={() => handleCopy('publicKey', publicKey)}
                    className="bg-purple-500 text-white py-1 px-2 rounded text-xs hover:bg-purple-600"
                  >
                    Copy Public Key
                  </button>
                  {copiedKey === 'publicKey' && (
                    <span className="text-green-600 text-xs">Copied!</span>
                  )}
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Use this public key to verify JWT tokens signed with the private key above.
                </p>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Certificate:</label>
                <textarea
                  value={certificate}
                  readOnly
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded font-mono text-sm bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
                  rows={4}
                />
                <div className="flex items-center justify-between mt-2">
                  <button 
                    onClick={() => handleCopy('certificate', certificate)}
                    className="bg-purple-500 text-white py-1 px-2 rounded text-xs hover:bg-purple-600"
                  >
                    Copy Certificate
                  </button>
                  {copiedKey === 'certificate' && (
                    <span className="text-green-600 text-xs">Copied!</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Info Modal Component
const InfoModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  // You can change this version number as needed
  const appVersion = "1.2.0";
  
  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
      />
      <div 
        className={`
          fixed left-14 bottom-24 z-50 w-80 sm:w-64 
          bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden
          transform transition-all duration-300 ease-out
          border border-gray-100 dark:border-zinc-700
          animate-modal-slide-in
        `}
        style={{ 
          boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.5), 0 8px 10px -6px rgba(124, 58, 237, 0.3)",
          transformOrigin: "bottom left"
        }}
      >
        <div className="px-6 py-5 bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <img src={logo} alt="Authrator Logo" className="h-10 w-10 rounded-lg shadow-md" />
              <h2 className="text-xl font-bold text-white">Authrator</h2>
            </div>
            <button 
              onClick={onClose} 
              className="text-white hover:text-gray-200 bg-white bg-opacity-20 rounded-full p-1 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-5">  
          <div className="space-y-2">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">The ultimate API testing tool</p>
            <p className="text-gray-500 dark:text-gray-500 text-sm">Version {appVersion}</p>
          </div>
          
          <div className="space-y-4 w-fit">
            <div className="flex items-center space-x-4 p-3 bg-purple-50 dark:bg-zinc-800 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-sm dark:text-white">Built by</h4>
                <a href='https://provayu.com/' target='_blank' rel='noopener noreferrer' className="text-purple-600 dark:text-purple-400 font-medium text-sm">Provayu</a>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-zinc-800 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-sm dark:text-white">Contact</h4>
                <a 
                  href="mailto:support@authrator.com"
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                >
                  support@authrator.com
                </a>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-indigo-50 dark:bg-zinc-800 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <Book className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-sm dark:text-white">Documentation</h4>
                <a 
                  href="https://docs.authrator.app" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm"
                >
                  docs.authrator.app
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const App = () => {
  const [collections, setCollections] = useState([]);
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [activeSubfolderId, setActiveSubfolderId] = useState(null);
  const [expandedCollections, setExpandedCollections] = useState(new Set());
  const [expandedSubfolders, setExpandedSubfolders] = useState(new Set());
  const [dbTemplates, setDbTemplates] = useState([]);
  const [activeApiId, setActiveApiId] = useState(null);
  const [activeTab, setActiveTab] = useState('params');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [openTabs, setOpenTabs] = React.useState([]);
  const [editingName, setEditingName] = useState(null);
  const [editingType, setEditingType] = useState(null);
  const [newName, setNewName] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [environments, setEnvironments] = useState([]);
  const [activeEnvironment, setActiveEnvironment] = useState(null);
  const [error, setError] = useState(null);
  const [isPerformanceTesting, setIsPerformanceTesting] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('collections');
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(280);
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(70);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [activeRightSection, setActiveRightSection] = useState('code');
  const [selectedColor, setSelectedColor] = useState('#FF6B6B');
  const [recentUrls, setRecentUrls] = useState([]);
  const [showUrlSuggestions, setShowUrlSuggestions] = useState(false);
  const navigate = useNavigate();
  const [customJwtConfigs, setCustomJwtConfigs] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  // JWT decoder is now in the right sidebar instead of a modal

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverTarget, setDragOverTarget] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);

  // Import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [showEnvironmentDropdown, setShowEnvironmentDropdown] = useState(false);

  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  
  const [isPerformanceTestRunning, setIsPerformanceTestRunning] = useState(false);
  const [isPerformanceTabActive, setIsPerformanceTabActive] = useState(false);
  const [performanceTestingState, setPerformanceTestingState] = useState({
    initialApi: null,
    initialCollection: null,
    results: null
  });
  

  
  // Handler for performance test status changes
  const handlePerformanceTestStatusChange = useCallback((isRunning) => {
    setIsPerformanceTestRunning(isRunning);
  }, []);

  // Handler for showing the performance testing panel from notification
  const handleShowPerformancePanel = useCallback(() => {
    setActiveSection(null);
    setIsPerformanceTesting(true);
    setIsPerformanceTabActive(true);
  }, []);

  // Drag and Drop Handlers
  const handleDragStart = (e, api, sourceCollectionId, sourceSubfolderId = null) => {
    const dragData = {
      api,
      sourceCollectionId,
      sourceSubfolderId
    };
    setDraggedItem(dragData);
    setIsDragActive(true);
    
    // Set drag data for cross-browser compatibility
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
    
    // Add visual feedback
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    setDraggedItem(null);
    setDragOverTarget(null);
    setIsDragActive(false);
    e.target.style.opacity = '1';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, targetCollectionId, targetSubfolderId = null) => {
    e.preventDefault();
    const targetId = targetSubfolderId || targetCollectionId;
    setDragOverTarget(targetId);
  };

  const handleDragLeave = (e) => {
    // Only clear if we're actually leaving the drop zone
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverTarget(null);
    }
  };

  const handleDrop = async (e, targetCollectionId, targetSubfolderId = null) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragOverTarget(null);
    setIsDragActive(false);
    
    if (!draggedItem) return;

    const { api, sourceCollectionId, sourceSubfolderId } = draggedItem;
    
    // Don't move if dropped on same location
    if (sourceCollectionId === targetCollectionId && sourceSubfolderId === targetSubfolderId) {
      setDraggedItem(null);
      return;
    }
    
    try {
      if (targetSubfolderId) {
        // Moving to a subfolder
        await moveApiToSubfolder(
          api.id, 
          sourceCollectionId, 
          targetCollectionId, 
          targetSubfolderId, 
          sourceSubfolderId
        );
      } else {
        // Moving to collection root
        await moveApiToCollection(api.id, sourceCollectionId, targetCollectionId);
      }
      
      // Show success message
      showToastMessage(`Moved "${api.name}" successfully`, 'success');
    } catch (error) {
      console.error('Error moving API:', error);
      showToastMessage(`Failed to move "${api.name}"`, 'error');
    }
    
    setDraggedItem(null);
  };

  // Export single collection function
  const handleExportCollection = (collection) => {
    try {
      // Convert Authrator collection to Postman format
      const postmanCollection = {
        info: {
          _postman_id: `${collection.id}-${Date.now()}`,
          name: collection.name,
          schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
          _exporter_id: "authrator",
          description: `Exported from Authrator on ${new Date().toISOString()}`
        },
        item: []
      };

      // Convert APIs to Postman items
      if (collection.apis && collection.apis.length > 0) {
        collection.apis.forEach(api => {
          const postmanItem = {
            name: api.name,
            request: {
              method: api.method,
              header: (api.headers || []).map(h => ({
                key: h.key,
                value: h.value,
                disabled: h.disabled || false
              })),
              url: (() => {
                // Parse URL to separate base URL from embedded query parameters
                let cleanUrl = api.url;
                const allQueryParams = [];
                
                try {
                  if (api.url) {
                    const urlObj = new URL(api.url.startsWith('http') ? api.url : `https://${api.url}`);
                    
                    // Extract query parameters from URL
                    urlObj.searchParams.forEach((value, key) => {
                      allQueryParams.push({
                        key: key,
                        value: value,
                        disabled: false
                      });
                    });
                    
                    // Get clean base URL
                    cleanUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
                  }
                } catch (error) {
                  // If URL parsing fails, just use the original URL and try to extract query params manually
                  cleanUrl = api.url.split('?')[0];
                }
                
                // Add query parameters from api.queryParams array
                if (api.queryParams && Array.isArray(api.queryParams)) {
                  api.queryParams.forEach(param => {
                    if (param.key) {
                      // Check if this key already exists from URL
                      const existingIndex = allQueryParams.findIndex(p => p.key === param.key);
                      if (existingIndex >= 0) {
                        // Replace with the one from queryParams array
                        allQueryParams[existingIndex] = {
                          key: param.key || '',
                          value: param.value || '',
                          disabled: param.enabled === false
                        };
                      } else {
                        // Add new parameter
                        allQueryParams.push({
                          key: param.key || '',
                          value: param.value || '',
                          disabled: param.enabled === false
                        });
                      }
                    }
                  });
                }
                
                // Filter enabled parameters for raw URL
                const enabledParams = allQueryParams.filter(p => !p.disabled && p.key);
                const rawUrl = enabledParams.length > 0 
                  ? `${cleanUrl}?${enabledParams.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value || '')}`).join('&')}`
                  : cleanUrl;
                
                return {
                  raw: rawUrl,
                  query: allQueryParams
                };
              })()
            }
          };

          // Add body if exists
          if (api.body && api.body.type !== 'none') {
            if (api.body.type === 'raw') {
              postmanItem.request.body = {
                mode: 'raw',
                raw: typeof api.body.content === 'string' ? api.body.content : JSON.stringify(api.body.content),
                options: {
                  raw: {
                    language: 'json'
                  }
                }
              };
            } else if (api.body.type === 'formData') {
              postmanItem.request.body = {
                mode: 'formdata',
                formdata: (api.body.formData || []).map(f => ({
                  key: f.key,
                  value: f.value,
                  type: f.type || 'text'
                }))
              };
            } else if (api.body.type === 'urlencoded') {
              postmanItem.request.body = {
                mode: 'urlencoded',
                urlencoded: (api.body.urlencoded || []).map(u => ({
                  key: u.key,
                  value: u.value
                }))
              };
            }
          }

          postmanCollection.item.push(postmanItem);
        });
      }

      // Convert subfolders to Postman folders
      if (collection.subfolders && collection.subfolders.length > 0) {
        collection.subfolders.forEach(subfolder => {
          const postmanFolder = {
            name: subfolder.name,
            item: []
          };

          if (subfolder.apis && subfolder.apis.length > 0) {
            subfolder.apis.forEach(api => {
              const postmanItem = {
                name: api.name,
                request: {
                  method: api.method,
                  header: (api.headers || []).map(h => ({
                    key: h.key,
                    value: h.value,
                    disabled: h.disabled || false
                  })),
                  url: (() => {
                    // Parse URL to separate base URL from embedded query parameters
                    let cleanUrl = api.url;
                    const allQueryParams = [];
                    
                    try {
                      if (api.url) {
                        const urlObj = new URL(api.url.startsWith('http') ? api.url : `https://${api.url}`);
                        
                        // Extract query parameters from URL
                        urlObj.searchParams.forEach((value, key) => {
                          allQueryParams.push({
                            key: key,
                            value: value,
                            disabled: false
                          });
                        });
                        
                        // Get clean base URL
                        cleanUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
                      }
                    } catch (error) {
                      // If URL parsing fails, just use the original URL and try to extract query params manually
                      cleanUrl = api.url.split('?')[0];
                    }
                    
                    // Add query parameters from api.queryParams array
                    if (api.queryParams && Array.isArray(api.queryParams)) {
                      api.queryParams.forEach(param => {
                        if (param.key) {
                          // Check if this key already exists from URL
                          const existingIndex = allQueryParams.findIndex(p => p.key === param.key);
                          if (existingIndex >= 0) {
                            // Replace with the one from queryParams array
                            allQueryParams[existingIndex] = {
                              key: param.key || '',
                              value: param.value || '',
                              disabled: param.enabled === false
                            };
                          } else {
                            // Add new parameter
                            allQueryParams.push({
                              key: param.key || '',
                              value: param.value || '',
                              disabled: param.enabled === false
                            });
                          }
                        }
                      });
                    }
                    
                    // Filter enabled parameters for raw URL
                    const enabledParams = allQueryParams.filter(p => !p.disabled && p.key);
                    const rawUrl = enabledParams.length > 0 
                      ? `${cleanUrl}?${enabledParams.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value || '')}`).join('&')}`
                      : cleanUrl;
                    
                    return {
                      raw: rawUrl,
                      query: allQueryParams
                    };
                  })()
                }
              };

              // Add body if exists
              if (api.body && api.body.type !== 'none') {
                if (api.body.type === 'raw') {
                  postmanItem.request.body = {
                    mode: 'raw',
                    raw: typeof api.body.content === 'string' ? api.body.content : JSON.stringify(api.body.content),
                    options: {
                      raw: {
                        language: 'json'
                      }
                    }
                  };
                } else if (api.body.type === 'formData') {
                  postmanItem.request.body = {
                    mode: 'formdata',
                    formdata: (api.body.formData || []).map(f => ({
                      key: f.key,
                      value: f.value,
                      type: f.type || 'text'
                    }))
                  };
                } else if (api.body.type === 'urlencoded') {
                  postmanItem.request.body = {
                    mode: 'urlencoded',
                    urlencoded: (api.body.urlencoded || []).map(u => ({
                      key: u.key,
                      value: u.value
                    }))
                  };
                }
              }

              postmanFolder.item.push(postmanItem);
            });
          }

          postmanCollection.item.push(postmanFolder);
        });
      }

      // Download the file
      const blob = new Blob([JSON.stringify(postmanCollection, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${collection.name.replace(/[^a-zA-Z0-9]/g, '_')}.postman_collection.json`;
      document.body.appendChild(a);
      a.click();
      
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showToastMessage(`Exported "${collection.name}" successfully`, 'success');
    } catch (error) {
      console.error('Error exporting collection:', error);
      showToastMessage(`Failed to export "${collection.name}"`, 'error');
    }
  };

  // Update global flag for test state
  useEffect(() => {
    // Set a global flag for other components
    window.isPerformanceTestRunning = isPerformanceTestRunning;
  }, [isPerformanceTestRunning]);
  
  // Update isPerformanceTabActive when isPerformanceTesting changes
  useEffect(() => {
    if (isPerformanceTesting) {
      setIsPerformanceTabActive(true);
    } else {
      setIsPerformanceTabActive(false);
    }
  }, [isPerformanceTesting]);
  
  // Update initialApi and initialCollection when opening performance testing
  useEffect(() => {
    if (isPerformanceTesting && getActiveApi) {
      setPerformanceTestingState(prevState => ({
        ...prevState,
        initialApi: activeFolderId && activeApiId ? getActiveApi() : null,
        initialCollection: activeFolderId ? collections.find(c => c.id === activeFolderId) : null
      }));
    }
  }, [isPerformanceTesting, activeFolderId, activeApiId, collections]);
  
  // Add animation keyframes for the modal
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes modalSlideIn {
        from {
          opacity: 0;
          transform: translateY(20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      
      .animate-modal-slide-in {
        animation: modalSlideIn 0.25s ease-out forwards;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Load recent URLs from localStorage
  useEffect(() => {
    try {
      const storedRecentUrls = localStorage.getItem('recentUrls');
      if (storedRecentUrls) {
        const parsedUrls = JSON.parse(storedRecentUrls);
        setRecentUrls(parsedUrls);
      }
    } catch (error) {
      console.error("Error loading recent URLs from localStorage:", error);
    }
  }, []);

  // Remove this useEffect as it's causing ESLint errors
  // We'll add keyboard shortcuts directly to the URL input instead
  
  // Function to add a URL to recent URLs list
  const addToRecentUrls = (url) => {
    if (!url || url.trim() === '') return;
    
    setRecentUrls(prevUrls => {
      // Remove the URL if it already exists in the list
      const filteredUrls = prevUrls.filter(item => item !== url);
      // Add the URL to the beginning of the list
      const newUrls = [url, ...filteredUrls].slice(0, 10); // Keep only the 10 most recent URLs
      
      // Save to localStorage
      localStorage.setItem('recentUrls', JSON.stringify(newUrls));
      
      return newUrls;
    });
  };

  useEffect(() => {
    try {
      const storedData = localStorage.getItem('app_environments');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        
        if (parsedData.environments) {
          setEnvironments(parsedData.environments);
          
          if (parsedData.activeEnvironmentId) {
            const activeEnv = parsedData.environments.find(env => env.id === parsedData.activeEnvironmentId);
            if (activeEnv) {
              setActiveEnvironment(activeEnv);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error loading environments from localStorage:", error);
    }
  }, []);

  const createTestEnv = () => {
    try {

      const testEnv = {
        id: `env_${Date.now()}`,
        name: 'Test Environment',
        variables: {
          'testVar': {
            initialValue: 'test-value',
            currentValue: 'test-value',
            type: 'text'
          },
          'apiUrl': {
            initialValue: 'https://api.example.com',
            currentValue: 'https://api.example.com',
            type: 'text'
          }
        }
      };
      

      localStorage.setItem('app_environments', JSON.stringify({
        environments: [testEnv],
        activeEnvironmentId: testEnv.id,
        globalVariables: {
          'globalVar': {
            initialValue: 'global-value',
            currentValue: 'global-value',
            type: 'text'
          }
        }
      }));
      
      console.log("Setting environments with test environment:", [testEnv]);
      setEnvironments([testEnv]);
      console.log("Setting active environment:", testEnv);
      setActiveEnvironment(testEnv);
      
      alert('Test environment created! You should see it in the environment dropdown.');
    } catch (error) {
      console.error("Error creating test environment:", error);
      alert('Error creating test environment: ' + error.message);
    }
  };


  useEffect(() => {
    const savedTabs = localStorage.getItem('openTabs');
    if (savedTabs) {
      try {
        const parsedTabs = JSON.parse(savedTabs);
        setOpenTabs(parsedTabs);
        
        // If no saved tabs exist, don't auto-create - user may have intentionally deleted them
      } catch (error) {
        console.error('Error parsing saved tabs:', error);
      }
    }
    
    // For unauthorized users, check if they need a default tab after initial load
    setTimeout(() => {
      const isUnauthorized = !localStorage.getItem('user');
      const userClosedAllTabs = localStorage.getItem('user_closed_all_tabs');
      
      if (isUnauthorized && openTabs.length === 0 && userClosedAllTabs !== 'true') {
        console.log('Creating default tab for unauthorized user');
        forceCreateDefaultTab();
      }
    }, 500);
  }, []);


  useEffect(() => {
    if (collections.length > 0) {
      if (openTabs.length > 0) {
        const validTabs = openTabs.filter(tab => {
          return collections.some(folder => {
            // Check direct APIs in collection
            const hasDirectApi = folder.apis.some(api => api.id === tab.id);
            if (hasDirectApi) return true;
            
            // Check APIs in subfolders
            const hasSubfolderApi = (folder.subfolders || []).some(subfolder => 
              subfolder.apis.some(api => api.id === tab.id)
            );
            
            return hasSubfolderApi;
          });
        });
        
        if (validTabs.length !== openTabs.length) {
          setOpenTabs(validTabs);
          localStorage.setItem('openTabs', JSON.stringify(validTabs));
          
          // If no valid tabs remain due to filtering, only create default if user didn't intentionally close them
          if (validTabs.length === 0) {
            const userClosedAllTabs = localStorage.getItem('user_closed_all_tabs');
            if (userClosedAllTabs !== 'true') {
              ensureDefaultTabExists();
            }
          }
        }
        
        if (!activeApiId && validTabs.length > 0) {
          const firstValidTab = validTabs[0];
          const apiLocation = findApiInCollections(firstValidTab.id);
          
          if (apiLocation) {
            setActiveApiId(firstValidTab.id);
            setActiveFolderId(apiLocation.collection.id);
            setActiveSubfolderId(apiLocation.subfolder?.id || null);
          }
        }
      }
    }
  }, [collections, openTabs, activeApiId]);

  // Note: Header management is now handled directly in fetchCollections to prevent race conditions

  const [isRenameModalOpen, setIsRenameModalOpen] = React.useState(false);
  const [itemToRename, setItemToRename] = React.useState(null);
  const [itemType, setItemType] = React.useState(null);
  const [itemName, setItemName] = React.useState('');

  const openRenameModal = (id, type, name) => {
    setItemToRename(id);
    setItemType(type);
    setItemName(name);
    setIsRenameModalOpen(true);
  };

  const handleRenameSubmit = (newName, color) => {
    handleRename(itemToRename, itemType, newName, color);
    setIsRenameModalOpen(false);
    setItemToRename(null);
    setItemType(null);
    setItemName('');
  };

  const isElectron = () => {
    return navigator.userAgent.indexOf('Electron') !== -1 || 
           (window && window.process && window.process.versions && window.process.versions.electron);
  };

  // Function to clear all relevant localStorage data
  const clearLocalStorageData = () => {
    // Clear collections and API data
    localStorage.removeItem('offline_collections');
    localStorage.removeItem('openTabs');
    localStorage.removeItem('requestHistory');
    
    // Clear environment data
    localStorage.removeItem('app_environments');
    
    // Clear any API-specific view formats and response panel settings
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('viewFormat-') || 
          key.startsWith('responsePanelHeight') ||
          key.startsWith('api-tabs') ||
          key.includes('tabs')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('Local storage data cleared');
  };
  
const [isOffline, setIsOffline] = useState(false);
  const isElectronOffline = () => {
    const isElectronApp = isElectron();
    const browserOffline = !navigator.onLine;
    // remote_offline is set in App.js when cloud connectivity check fails
    const remoteOffline = localStorage.getItem('remote_offline') === 'true';
    return isElectronApp && (browserOffline || remoteOffline);
  };

  const getLocalCollections = () => {
    const collections = localStorage.getItem('offline_collections');
    if (collections) {
      const parsed = JSON.parse(collections);
      // Ensure backward compatibility - if collections don't have subfolders, add empty array
      return parsed.map(collection => ({
        ...collection,
        subfolders: collection.subfolders || []
      }));
    }
    return [];
  };
  
  const saveLocalCollections = (collections) => {
    localStorage.setItem('offline_collections', JSON.stringify(collections));
  };
  
  const getNextLocalId = (prefix) => {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  };

  // Helper functions for subfolder operations
  const findApiInCollections = (apiId) => {
    for (const collection of collections) {
      // Check direct APIs in collection
      const directApi = collection.apis.find(api => api.id === apiId);
      if (directApi) {
        return { collection, subfolder: null, api: directApi };
      }
      
      // Check APIs in subfolders
      for (const subfolder of collection.subfolders || []) {
        const subfolderApi = subfolder.apis.find(api => api.id === apiId);
        if (subfolderApi) {
          return { collection, subfolder, api: subfolderApi };
        }
      }
    }
    return null;
  };

  const findCollectionById = (collectionId) => {
    return collections.find(collection => collection.id === collectionId);
  };

  const findSubfolderById = (collectionId, subfolderId) => {
    const collection = findCollectionById(collectionId);
    if (!collection) return null;
    return collection.subfolders?.find(subfolder => subfolder.id === subfolderId) || null;
  };

  // Helper functions for managing expanded state
  const toggleCollectionExpansion = (collectionId) => {
    setExpandedCollections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(collectionId)) {
        newSet.delete(collectionId);
      } else {
        newSet.add(collectionId);
      }
      return newSet;
    });
  };

  const toggleSubfolderExpansion = (subfolderId) => {
    setExpandedSubfolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subfolderId)) {
        newSet.delete(subfolderId);
      } else {
        newSet.add(subfolderId);
      }
      return newSet;
    });
  };
  
  useEffect(() => {
    const loadJwtConfigs = async () => {
      try {
        const response = await fetch('Authrator/authratorf/src/jwt-configs.json');
        const configs = await response.json();
        setCustomJwtConfigs(configs);
      } catch (error) {
        console.error('Failed to load JWT configurations:', error);
      }
    };
    
    loadJwtConfigs();
  }, []);

  

  const [isMobile, setIsMobile] = useState(false);
  const [userId, setUserId] = useState(localStorage.getItem('userId'));
  

  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('user'));
  
  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleSignupClick = () => {
    navigate('/signup');
  };
  
  const openRequestInTab = (historyRequest, targetCollectionId = null) => {
    setActiveSection('collections');
    
    // If a specific target collection is provided, use that instead of looking for existing folder
    if (targetCollectionId) {
      const targetCollection = collections.find(folder => folder.id === targetCollectionId);
      
      if (targetCollection) {
        // Create the API object with isFromHistory flag
        const newApi = {
          id: `api-${Date.now()}`,
          name: historyRequest.apiName || historyRequest.url.split('/').pop(),
          method: historyRequest.method,
          url: historyRequest.url,
          headers: ensureApiHasDefaultHeaders(historyRequest.requestDetails?.headers || [], historyRequest.settings || {}),
          queryParams: historyRequest.requestDetails?.queryParams || [],
          body: historyRequest.requestDetails?.body || {},
          auth: historyRequest.requestDetails?.auth || { type: 'none' },
          settings: historyRequest.settings || {},
          isFromHistory: false // Not marking as from history since we're saving it
        };
        
        // If we're online and not in a temporary collection, save to server
        if (!isElectronOffline() && !targetCollectionId.startsWith('temp-') && !targetCollectionId.startsWith('local-')) {
          // Create the API on the server
          fetch('https://authrator.com/db-api/api/apis', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              collectionId: targetCollectionId,
              name: newApi.name,
              method: newApi.method,
              url: newApi.url
            }),
          })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              // Update the API with the server ID
              const serverApi = {
                ...newApi,
                id: data.api._id
              };
              
              // Update collections with the server API
              const updatedCollections = collections.map(folder => {
                if (folder.id === targetCollectionId) {
                  return {
                    ...folder,
                    apis: folder.apis.map(api => 
                      api.id === newApi.id ? serverApi : api
                    )
                  };
                }
                return folder;
              });
              
              setCollections(updatedCollections);
              
              // Update active API ID if needed
              if (activeApiId === newApi.id) {
                setActiveApiId(serverApi.id);
              }
              
              // Update open tabs
              setOpenTabs(prevTabs => 
                prevTabs.map(tab => 
                  tab.id === newApi.id ? { ...tab, id: serverApi.id } : tab
                )
              );
              
              // Update the API details on the server
              fetch(`https://authrator.com/db-api/api/apis/${serverApi.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  headers: newApi.headers,
                  queryParams: newApi.queryParams,
                  body: newApi.body,
                  auth: newApi.auth,
                  settings: newApi.settings
                }),
              }).catch(error => {
                console.error('Error updating API details:', error);
              });
            }
          })
          .catch(error => {
            console.error('Error saving API to server:', error);
          });
        }
        
        // Add the new API to the target collection
        const updatedCollections = collections.map(folder => {
          if (folder.id === targetCollectionId) {
            return {
              ...folder,
              apis: [...folder.apis, newApi]
            };
          }
          return folder;
        });
        
        setCollections(updatedCollections);
        openNewTab(targetCollectionId, newApi);
        return;
      }
    }
    
    // Original logic for when no target collection is specified
    const existingFolder = collections.find(folder => 
      folder.id === historyRequest.folderId || folder.name === historyRequest.folderName
    );
    
    // Create the API object with isFromHistory flag
    const newApi = {
      id: historyRequest.apiId || `api-${Date.now()}`,
      name: historyRequest.apiName || historyRequest.url.split('/').pop(),
      method: historyRequest.method,
      url: historyRequest.url,
      headers: historyRequest.requestDetails?.headers || [],
      queryParams: historyRequest.requestDetails?.queryParams || [],
      body: historyRequest.requestDetails?.body || {},
      auth: historyRequest.requestDetails?.auth || { type: 'none' },
      settings: historyRequest.settings || {},
      isFromHistory: true // Add this flag
    };
  
    if (existingFolder) {
      // Add the new API to existing folder without checking for duplicates
      const updatedCollections = collections.map(folder => {
        if (folder.id === existingFolder.id) {
          return {
            ...folder,
            apis: [...folder.apis, newApi]
          };
        }
        return folder;
      });
      
      setCollections(updatedCollections);
      openNewTab(existingFolder.id, newApi);
    } else {
      // Create new folder and add API
      const newFolder = {
        id: `folder-${Date.now()}`,
        name: 'History Requests 9999999',
        apis: [newApi]
      };
      
      setCollections([...collections, newFolder]);
      openNewTab(newFolder.id, newApi);
    }
  };
        
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) return;
        
        const response = await axios.get(`${API_BASE_URL}/templates/${userId}`);
        if (response.data.success) {
          setDbTemplates(response.data.templates);
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
      }
    };
  
    fetchTemplates();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const mobileMenuItems = [
    { icon: Play, label: 'Runner' },
    { icon: Antenna, label: 'Capture' },
    { icon: MousePointer2, label: 'Auto-Select' },
    { icon: Cookie, label: 'Cookies' },
    { icon: KeyRound, label: 'Vault' },
    { icon: Trash2, label: 'Trash' }
  ];

  
const FooterButton = ({ icon: Icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className="flex items-center space-x-1 hover:text-gray-900 dark:hover:text-gray-300 whitespace-nowrap"
  >
    <Icon className="w-3.5 h-3.5" />
    <span className="hidden sm:inline">{label}</span>
  </button>
);

  const MIN_LEFT_SIDEBAR_WIDTH = 60;
  const MIN_RIGHT_SIDEBAR_WIDTH = 70;
  const MAX_LEFT_SIDEBAR_WIDTH = 400;
  const MAX_RIGHT_SIDEBAR_WIDTH = 70;

  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      if (isMobileView) {
        setIsRightSidebarCollapsed(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);





  const handleLeftResize = (e, { size }) => {
    if (!isMobile) {
      if (size.width <= MIN_LEFT_SIDEBAR_WIDTH) {
        setIsLeftSidebarCollapsed(true);
        setLeftSidebarWidth(MIN_LEFT_SIDEBAR_WIDTH);
      } else {
        setIsLeftSidebarCollapsed(false);
        setLeftSidebarWidth(size.width);
      }
    }
  };

  const handleRightResize = (e, { size }) => {
    if (!isMobile) {
      const MIN_RIGHT_SIDEBAR_WIDTH = 70;
      const newWidth = size.width;
      
      if (newWidth <= MIN_RIGHT_SIDEBAR_WIDTH) {
        setIsRightSidebarCollapsed(true);
        setRightSidebarWidth(MIN_RIGHT_SIDEBAR_WIDTH);
      } else {
        setIsRightSidebarCollapsed(false);
        setRightSidebarWidth(newWidth);
      }
    }
  };

  const toggleRightSidebar = () => {
    if (isRightSidebarCollapsed) {
      setIsRightSidebarCollapsed(false);
      setRightSidebarWidth(280); // Default expanded width
    } else {
      setIsRightSidebarCollapsed(true);
      setRightSidebarWidth(70); // Collapsed width showing only icons
    }
  };
  
  const ensureTempCollectionExists = async () => {
    // Check if temp collection already exists in state
    const tempCollection = collections.find(folder => folder.id === 'temp-99999');
    if (tempCollection) return tempCollection;
    
    // Create a new temp collection in memory only (not on server)
    const newTempCollection = {
      id: 'temp-99999',
      name: 'Unsaved Requests',
      apis: [],
      subfolders: [],
      isTemporary: true // Flag to identify this is a temporary collection
    };
    
    // Add the temp collection to state
    const updatedCollections = [...collections, newTempCollection];
    setCollections(updatedCollections);
    
    // If in Electron offline mode or anonymous user, save to localStorage
    if (isElectronOffline() || !isLoggedIn) {
      saveLocalCollections(updatedCollections);
    }
    
    return newTempCollection;
  };

  // Function to ensure there's always at least one default API tab
  const ensureDefaultTabExists = async () => {
    // Check if user has intentionally closed all tabs
    const userClosedAllTabs = localStorage.getItem('user_closed_all_tabs');
    
    // Only create default tab if no tabs are currently open AND user hasn't intentionally closed them
    if (openTabs.length === 0 && userClosedAllTabs !== 'true') {
      console.log('No tabs open, creating default tab...');
      
      // Create a default API in the temp collection
      const tempCollection = await ensureTempCollectionExists();
      
      const defaultApiId = `temp-${Date.now()}-default`;
      const defaultApi = {
        id: defaultApiId,
        name: 'New Request',
        method: 'GET',
        url: "",
        headers: getEnabledDefaultHeaders({}),
        queryParams: [],
        body: {
          type: "none",
          content: "",
          formData: [],
          urlencoded: [],
        },
        scripts: {
          preRequest: "",
          tests: "",
        },
        auth: {
          type: "none",
          jwt: { key: "", value: "", pairs: [] },
          avqJwt: { value: "" },
        },
        responseData: null,
        activeResponseTab: "response-body",
        isTemporary: true,
        isDefault: true // Flag to identify this as a default tab
      };
      
      // Update collections state to include the default API
      setCollections(prevCollections => {
        const updatedCollections = prevCollections.map(folder => {
          if (folder.id === 'temp-99999') {
            return {
              ...folder,
              apis: [...folder.apis, defaultApi]
            };
          }
          return folder;
        });
        
        // If temp collection doesn't exist in prevCollections, add it
        if (!prevCollections.find(f => f.id === 'temp-99999')) {
          updatedCollections.push({
            ...tempCollection,
            apis: [defaultApi]
          });
        }
        
        return updatedCollections;
      });
      
      // Create the default tab
      const defaultTab = {
        id: defaultApiId,
        name: 'New Request',
        method: 'GET',
        folderId: 'temp-99999',
        subfolderId: null
      };
      
      // Set the tab as open and active
      setOpenTabs([defaultTab]);
      localStorage.setItem('openTabs', JSON.stringify([defaultTab]));
      setActiveApiId(defaultApiId);
      setActiveFolderId('temp-99999');
      setActiveSubfolderId(null);
      
      console.log('Default tab created successfully');
    }
  };

  // Function to force creation of default tab (used in login, logout, signup scenarios)
  const forceCreateDefaultTab = async () => {
    console.log('Force creating default tab...');
    
    // Clear the user closed all tabs flag since we're creating a new one
    localStorage.removeItem('user_closed_all_tabs');
    
    // Create a default API in the temp collection
    const tempCollection = await ensureTempCollectionExists();
    
    const defaultApiId = `temp-${Date.now()}-default`;
    const defaultApi = {
      id: defaultApiId,
      name: 'New Request',
      method: 'GET',
      url: "",
      headers: getEnabledDefaultHeaders({}),
      queryParams: [],
      body: {
        type: "none",
        content: "",
        formData: [],
        urlencoded: [],
      },
      scripts: {
        preRequest: "",
        tests: "",
      },
      auth: {
        type: "none",
        jwt: { key: "", value: "", pairs: [] },
        avqJwt: { value: "" },
      },
      responseData: null,
      activeResponseTab: "response-body",
      isTemporary: true,
      isDefault: true // Flag to identify this as a default tab
    };
    
    // Update collections state to include the default API
    setCollections(prevCollections => {
      const updatedCollections = prevCollections.map(folder => {
        if (folder.id === 'temp-99999') {
          return {
            ...folder,
            apis: [...folder.apis, defaultApi]
          };
        }
        return folder;
      });
      
      // If temp collection doesn't exist in prevCollections, add it
      if (!prevCollections.find(f => f.id === 'temp-99999')) {
        updatedCollections.push({
          ...tempCollection,
          apis: [defaultApi]
        });
      }
      
      return updatedCollections;
    });
    
    // Create the default tab
    const defaultTab = {
      id: defaultApiId,
      name: 'New Request',
      method: 'GET',
      folderId: 'temp-99999',
      subfolderId: null
    };
    
    // Set the tab as open and active
    setOpenTabs([defaultTab]);
    localStorage.setItem('openTabs', JSON.stringify([defaultTab]));
    setActiveApiId(defaultApiId);
    setActiveFolderId('temp-99999');
    setActiveSubfolderId(null);
    
    console.log('Default tab force created successfully');
  };


  const handleApiClick = (folderId, api, subfolderId = null) => {
    if (isMobile) {
      setIsMobileSidebarOpen(false);
    }
    
    // If performance testing is running, just hide the panel but don't reset it
    if (isPerformanceTestRunning) {
      setIsPerformanceTesting(false);
      setIsPerformanceTabActive(false);
    } else {
      setIsPerformanceTesting(false);
    }
    
    // Set folder, subfolder and API IDs
    setActiveFolderId(folderId);
    setActiveSubfolderId(subfolderId);
    setActiveApiId(api.id);
    
    // Keep sidebar visible by setting activeSection to 'collections'
    // This won't interfere with showing the request panel now
    setActiveSection('collections');
    
    // Open in a new tab if it's not already open
    const tabExists = openTabs.some(tab => tab.id === api.id);
    if (!tabExists) {
      openNewTab(folderId, api, subfolderId);
    }
  };

  const handleRename = async (id, type, newName, color) => {
    try {
      // Check if this is a temporary collection or API or user is not logged in
      const isTemp = type === 'collection' 
        ? id === 'temp-99999' 
        : id.toString().includes('temp-') || openTabs.some(tab => tab.id === id && tab.folderId === 'temp-99999');
      
      // Update temporary items directly in state without API call
      if (isTemp || isElectronOffline() || !isLoggedIn) {
        // For temporary or offline items, update directly in state
        const updatedCollections = collections.map(folder => {
          if (type === 'collection' && folder.id === id) {
            return { ...folder, name: newName, color: color || folder.color };
          } else if (type === 'subfolder') {
            return {
              ...folder,
              subfolders: (folder.subfolders || []).map(subfolder => 
                subfolder.id === id ? { ...subfolder, name: newName } : subfolder
              )
            };
          } else if (type === 'api') {
            return {
              ...folder,
              apis: folder.apis.map(api => 
                api.id === id ? { ...api, name: newName } : api
              ),
              subfolders: (folder.subfolders || []).map(subfolder => ({
                ...subfolder,
                apis: subfolder.apis.map(api => 
                  api.id === id ? { ...api, name: newName } : api
                )
              }))
            };
          }
          return folder;
        });
        
        setCollections(updatedCollections);
        
        // Update open tabs if an API was renamed
        if (type === 'api') {
          const updatedTabs = openTabs.map(tab => 
            tab.id === id ? { ...tab, name: newName } : tab
          );
          
          setOpenTabs(updatedTabs);
          
          // Save updated tabs to localStorage
          localStorage.setItem('openTabs', JSON.stringify(updatedTabs));
        }
        
        // Save to localStorage if in offline mode or anonymous user
        if (isElectronOffline() || !isLoggedIn) {
          saveLocalCollections(updatedCollections);
        }
        
        return;
      }
      
      // Regular API call for non-temporary items
      const endpoint = type === 'collection' 
        ? `${API_BASE_URL}/collections/${id}/rename`
        : type === 'subfolder'
        ? `${API_BASE_URL}/subfolders/${id}/rename`
        : `${API_BASE_URL}/apis/${id}/rename`;
  
      const response = await axios.put(endpoint, { newName, color });
  
      if (response.data.success) {
        // Update the collections state with the new name
        setCollections(collections.map(folder => {
          if (type === 'collection' && folder.id === id) {
            return { ...folder, name: newName, color: color || folder.color };
          } else if (type === 'subfolder') {
            return {
              ...folder,
              subfolders: (folder.subfolders || []).map(subfolder => 
                subfolder.id === id ? { ...subfolder, name: newName } : subfolder
              )
            };
          } else if (type === 'api') {
            return {
              ...folder,
              apis: folder.apis.map(api => 
                api.id === id ? { ...api, name: newName } : api
              ),
              subfolders: (folder.subfolders || []).map(subfolder => ({
                ...subfolder,
                apis: subfolder.apis.map(api => 
                  api.id === id ? { ...api, name: newName } : api
                )
              }))
            };
          }
          return folder;
        }));
        
        // Update open tabs if an API was renamed
        if (type === 'api') {
          setOpenTabs(openTabs.map(tab => 
            tab.id === id ? { ...tab, name: newName } : tab
          ));
          
          // Save updated tabs to localStorage
          localStorage.setItem('openTabs', JSON.stringify(openTabs.map(tab => 
            tab.id === id ? { ...tab, name: newName } : tab
          )));
        }
      }
    } catch (error) {
      console.error('Error renaming:', error);
      setError('Failed to rename ' + type);
    } finally {
      setEditingName(null);
      setEditingType(null);
      setNewName('');
    }
  };
  
  const navigationItems = [
    { id: 'collections', icon: FolderCheckIcon, label: 'Collections' },
    { id: 'environments', icon: Database, label: 'Environments' },
    { id: 'history', icon: HistoryIcon, label: 'History' },
    { id: 'settings', icon:ZapIcon, label: 'Performance Testing' },
    { id: 'authTemplates', icon: LayoutTemplate, label: 'authTemplates' }
  ];
  const rightNavigationItems = [
    // { id: 'code', icon: Code, label: 'Response' },
    // { id: 'details', icon:Info, label: 'Details' },
    // { id: 'comments', icon: MessageSquare, label: 'Comments' },
    { id: 'importExport', icon: ArrowUpDown, label: 'Import/Export' },
    { id: 'jwt', icon: KeyRound, label: 'JWT Decoder' },
    { id: 'keyGenerator', icon: Key, label: 'JWT Keys' },
    { id: 'desktopDownload', icon: Download, label: 'Desktop App' },
    { id: 'info', icon: HelpCircle, label: 'Info' }
  ];

  const handleMobileNavClick = (sectionId) => {
    // Only change section if it's not already the active section
    // This ensures we don't reset to null when clicking on the same section
    setActiveSection(sectionId);
    setIsMobileSidebarOpen(false);
    
    // If performance testing is running, just hide the panel but don't reset it
    if (isPerformanceTestRunning) {
      setIsPerformanceTesting(false);
      setIsPerformanceTabActive(false);
    } else {
      setIsPerformanceTesting(false);
    }
  };

const renderApiItem = (folder, api, subfolderId = null) => {
    if (api.isFromHistory) {
      return (
        <></>
      );
    }
    
    return (
      <div key={api.id} className="relative ml-2 p-2 rounded-lg cursor-pointer group">
        <div
          className={`flex items-center justify-between space-x-2 min-w-0 ${
            activeApiId === api.id
              ? 'bg-purple-50 dark:bg-zinc-800 pl-1 pr-1 rounded-lg'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800 pl-1 pr-1 rounded-lg'
          } ${isDragActive && draggedItem?.api.id === api.id ? 'opacity-50' : ''}`}
          draggable={true}
          onDragStart={(e) => handleDragStart(e, api, folder.id, subfolderId)}
          onDragEnd={handleDragEnd}
          onClick={(e) => {
            // Don't open if currently dragging
            if (isDragActive) {
              e.preventDefault();
              return;
            }
            
            openNewTab(folder.id, api, subfolderId);
            setIsSidebarOpen(false);
            
            // Set folder, subfolder and API IDs
            setActiveFolderId(folder.id);
            setActiveSubfolderId(subfolderId);
            setActiveApiId(api.id);
            
            // Keep sidebar visible by setting activeSection to 'collections'
            // This won't interfere with showing the request panel now
            setActiveSection('collections');

            // If performance testing is running, just hide the panel but don't reset it
            if (isPerformanceTestRunning) {
              setIsPerformanceTesting(false);
              setIsPerformanceTabActive(false);
            } else {
              setIsPerformanceTesting(false);
            }
          }}
        >
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <span className={`flex-shrink-0 px-2 py-0.5 rounded-md text-xs font-semibold tracking-wide ${
              {
                GET: 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300',
                POST: 'bg-purple-100 dark:bg-zinc-800 text-purple-700 dark:text-blue-300',
                PUT: 'bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300',
                DELETE: 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300',
                PATCH: 'bg-purple-100 dark:bg-zinc-800 text-purple-700 dark:text-blue-300',
              }[api.method]
            }`}>
              {api.method}
            </span>
            <span 
              className="truncate text-sm text-gray-700 dark:text-gray-300"
              title={api.url || 'No URL set'}
            >
              {api.name}
            </span>
          </div>
          <CustomDropdown trigger={<MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                openRenameModal(api.id, 'api', api.name);
                // Close the dropdown by setting isOpen to false
                const dropdownElement = e.currentTarget.closest('.relative');
                if (dropdownElement) {
                  const dropdownButton = dropdownElement.querySelector('button');
                  if (dropdownButton) {
                    dropdownButton.click();
                  }
                }
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center space-x-2"
            >
              <Pencil className="w-4 h-4" />
              <span>Rename</span>
            </button>
            
            {/* Move API options */}
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 border-t border-gray-200 dark:border-gray-600">
              Move to
            </div>
            {collections
              .filter(c => c.id !== 'temp-99999' && c.name !== 'History Requests 9999999')
              .map(collection => (
                <div key={collection.id}>
                  {/* Collection Option */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const currentLocation = findApiInCollections(api.id);
                      if (currentLocation) {
                        if (currentLocation.subfolder) {
                          // Move from subfolder to collection root
                          moveApiToCollection(api.id, currentLocation.collection.id, collection.id);
                        } else {
                          // Move from collection to collection
                          moveApiToCollection(api.id, currentLocation.collection.id, collection.id);
                        }
                      }
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center space-x-2"
                    disabled={folder.id === collection.id && !subfolderId}
                  >
                    <FolderClosed className="w-4 h-4" />
                    <span className="truncate">{collection.name}</span>
                  </button>
                  
                  {/* Subfolders Options */}
                  {collection.subfolders?.map(targetSubfolder => (
                    <button
                      key={targetSubfolder.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        const currentLocation = findApiInCollections(api.id);
                        if (currentLocation) {
                          moveApiToSubfolder(
                            api.id, 
                            currentLocation.collection.id, 
                            collection.id, 
                            targetSubfolder.id, 
                            currentLocation.subfolder?.id
                          );
                        }
                      }}
                      className="w-full px-4 py-2 pl-8 text-left text-sm hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center space-x-2"
                      disabled={subfolderId === targetSubfolder.id}
                    >
                      <Folder className="w-3 h-3" />
                      <span className="truncate text-xs">{targetSubfolder.name}</span>
                    </button>
                  ))}
                </div>
              ))}
              
            <div className="border-t border-gray-200 dark:border-gray-600 mt-2"></div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(api.id, 'api');
                setIsRenameModalOpen(false)
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center space-x-2 text-red-600"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </CustomDropdown>
        </div>
      </div>
    );
  };

  const renderSidebarContent = () => {
    switch (activeSection) {
      case 'collections':
        return (
          <div className="flex-1">
            {/* Import Button */}
            <div className="p-2 border-b border-gray-200 dark:border-gray-700 mb-4">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="w-full flex items-center justify-center p-3 bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                <span className="font-medium">Import Collection</span>
              </button>
            </div>

            {collections
              .filter(folder => folder.id === 'temp-99999')
              .map(tempFolder => (
                <div key={tempFolder.id} className="mb-4">
                  {tempFolder.apis.length > 0 && (
                    <div className="px-2 mb-1">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 pt-3 pl-2">
                        Unsaved Requests
                      </div>
                      {tempFolder.apis.map(api => (
                        <div 
                          key={api.id} 
                          className={`flex items-center justify-between space-x-2 min-w-0 p-2 rounded-lg cursor-pointer
                            ${activeApiId === api.id
                              ? 'bg-purple-100 dark:bg-zinc-800'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                            } ${isDragActive && draggedItem?.api.id === api.id ? 'opacity-50' : ''}`}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, api, tempFolder.id)}
                          onDragEnd={handleDragEnd}
                          onClick={(e) => {
                            // Don't open if currently dragging
                            if (isDragActive) {
                              e.preventDefault();
                              return;
                            }
                            handleApiClick(tempFolder.id, api);
                          }}
                        >
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <span className={`flex-shrink-0 px-2 py-0.5 rounded-md text-xs font-semibold tracking-wide ${
                              {
                                GET: 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300',
                                POST: 'bg-purple-100 dark:bg-zinc-800 text-purple-700 dark:text-blue-300',
                                PUT: 'bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300',
                                DELETE: 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300',
                                PATCH: 'bg-purple-100 dark:bg-zinc-800 text-purple-700 dark:text-blue-300',
                              }[api.method]
                            }`}>
                              {api.method}
                            </span>
                            <span 
                              className="truncate text-sm text-gray-700 dark:text-gray-300"
                              title={api.url || 'No URL set'}
                            >
                              {api.name}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <CustomDropdown trigger={<MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />}>
                              <div className="py-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openRenameModal(api.id, 'api', api.name);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center space-x-2"
                                >
                                  <Pencil className="w-4 h-4" />
                                  <span>Rename</span>
                                </button>
                                <div className="px-4 py-2 text-xs font-semibold text-gray-500">
                                  Save to Collection
                                </div>
                                {collections
                                  .filter(c => c.id !== 'temp-99999' && c.name !== 'History Requests 9999999')
                                  .map(collection => (
                                    <div key={collection.id}>
                                      {/* Collection Option */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          moveApiToCollection(api.id, tempFolder.id, collection.id);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center space-x-2"
                                      >
                                        <FolderClosed className="w-4 h-4" />
                                        <span className="truncate">{collection.name}</span>
                                      </button>
                                      
                                      {/* Subfolders Options */}
                                      {collection.subfolders?.map(subfolder => (
                                        <button
                                          key={subfolder.id}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            moveApiToSubfolder(api.id, tempFolder.id, collection.id, subfolder.id);
                                          }}
                                          className="w-full px-4 py-2 pl-8 text-left text-sm hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center space-x-2"
                                        >
                                          <Folder className="w-3 h-3" />
                                          <span className="truncate text-xs">{subfolder.name}</span>
                                        </button>
                                      ))}
                                    </div>
                                  ))}
                              </div>
                            </CustomDropdown>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

            {collections
              .filter(folder => folder.id !== 'temp-99999' && folder.name !== 'Unsaved Requests'  && folder.name !== 'History Requests 9999999')
              .map((folder) => (
                <div key={folder.id} className="p-2">
                  {/* Collection Header */}
                  <div 
                    className={`flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-150 cursor-pointer group ${
                      dragOverTarget === folder.id ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-400 border-dashed' : ''
                    }`}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter(e, folder.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, folder.id)}
                  >
                    <div 
                      className="flex items-center space-x-2 flex-1 min-w-0"
                      onClick={() => {
                        toggleCollectionExpansion(folder.id);
                        setActiveFolderId(folder.id);
                        setIsMobileSidebarOpen(false);
                      }}
                    >
                      {/* Expansion chevron */}
                      {(folder.subfolders?.length > 0 || folder.apis?.length > 0) && (
                        expandedCollections.has(folder.id) 
                          ? <ChevronDown className="w-4 h-4 flex-shrink-0 text-gray-400" />
                          : <ChevronRight className="w-4 h-4 flex-shrink-0 text-gray-400" />
                      )}
                      <FolderClosed 
                        className="w-4 h-4 flex-shrink-0" 
                        style={{ color: folder.color || '#4ECDC4' }} 
                      />
                      <span className="truncate font-medium text-gray-800 dark:text-gray-300">
                        {folder.name}
                      </span>
                    </div>
                   
                    <div className="flex items-center space-x-1 ">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          createNewApi(folder.id);
                        }}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-md"
                        title="Add API"
                      >
                        <PlusCircle className="w-4 h-4 text-gray-500 dark:text-gray-400 -ml-2" />
                      </button>
                      <CustomDropdown trigger={<MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400 z-100 mr-[10px]" />}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            createNewSubfolder(folder.id);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center space-x-2"
                        >
                          <FolderPlus className="w-4 h-4" />
                          <span>New Subfolder</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedColor(folder.color || '#FF6B6B');
                            openRenameModal(folder.id, 'collection', folder.name);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center space-x-2"
                        >
                          <Pencil className="w-4 h-4" />
                          <span>Rename</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportCollection(folder);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center space-x-2"
                        >
                          <Download className="w-4 h-4" />
                          <span>Export Collection</span>
                        </button>
                        <button
                          onClick={() => handleDelete(folder.id)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center space-x-2 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </CustomDropdown>
                    </div>
                  </div>

                  {/* Collection Content - APIs and Subfolders */}
                  {expandedCollections.has(folder.id) && (
                    <div className="ml-4 border-l border-gray-200 dark:border-gray-700 pl-2">
                      {/* Direct APIs in collection */}
                      {folder.apis?.map((api) => renderApiItem(folder, api))}
                      
                      {/* Subfolders */}
                      {folder.subfolders?.map((subfolder) => (
                        <div key={subfolder.id} className="mb-2">
                          {/* Subfolder Header */}
                          <div 
                            className={`flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-150 cursor-pointer group ${
                              dragOverTarget === subfolder.id ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-400 border-dashed' : ''
                            }`}
                            onDragOver={handleDragOver}
                            onDragEnter={(e) => handleDragEnter(e, folder.id, subfolder.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, folder.id, subfolder.id)}
                          >
                            <div 
                              className="flex items-center space-x-2 flex-1 min-w-0"
                              onClick={() => {
                                toggleSubfolderExpansion(subfolder.id);
                                setActiveSubfolderId(subfolder.id);
                                setActiveFolderId(folder.id);
                              }}
                            >
                              {/* Subfolder expansion chevron */}
                              {subfolder.apis?.length > 0 && (
                                expandedSubfolders.has(subfolder.id) 
                                  ? <ChevronDown className="w-3 h-3 flex-shrink-0 text-gray-400" />
                                  : <ChevronRight className="w-3 h-3 flex-shrink-0 text-gray-400" />
                              )}
                              <Folder className="w-3 h-3 flex-shrink-0 text-gray-500" />
                              <span className="truncate text-sm text-gray-700 dark:text-gray-300">
                                {subfolder.name}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  createNewApiInSubfolder(folder.id, subfolder.id);
                                }}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-md"
                                title="Add API to subfolder"
                              >
                                <PlusCircle className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                              </button>
                              <CustomDropdown trigger={<MoreVertical className="w-3 h-3 text-gray-500 dark:text-gray-400" />}>
                                <button
                                  onClick={() => openRenameModal(subfolder.id, 'subfolder', subfolder.name)}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center space-x-2"
                                >
                                  <Pencil className="w-4 h-4" />
                                  <span>Rename</span>
                                </button>
                                <button
                                  onClick={() => handleDelete(subfolder.id, 'subfolder')}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center space-x-2 text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>Delete</span>
                                </button>
                              </CustomDropdown>
                            </div>
                          </div>

                          {/* Subfolder APIs */}
                          {expandedSubfolders.has(subfolder.id) && (
                            <div className="ml-4 border-l border-gray-200 dark:border-gray-700 pl-2">
                              {subfolder.apis?.map((api) => renderApiItem(folder, api, subfolder.id))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              

          </div>
        );
      
      case 'environments':
        return (
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg">
          <span>Environment Management</span>
           
            <DatabaseZapIcon className="w-5 h-5" />
        
        </div>
        );
      
      case 'history':
        return (
          <div className="p-4">
            <RequestHistory 
                collections={collections}
  className="w-full"
            />
          </div>
        );
      
      case 'settings':
        return (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg">
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700"
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-purple-400" />}
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg">
              <span>Performance Testing</span>
              <button
                onClick={() => setIsPerformanceTesting(!isPerformanceTesting)}
                className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700"
              >
                <CloudLightningIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        );

        case 'authTemplates':
          return (
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg">
              <span> Auth Template</span>
               
                <LayoutTemplate className="w-5 h-5" />
            
            </div>
          );
    }
  };
// Add this function to move APIs from temp to real collections
const moveApiToCollection = async (apiId, sourceFolderId, targetFolderId) => {
  try {
    // Find the API in the source folder
    const sourceFolder = collections.find(folder => folder.id === sourceFolderId);
    if (!sourceFolder) return;
    
    // Try to locate the API either at collection root or within any subfolder
    let apiToMove = sourceFolder.apis.find((api) => api.id === apiId);
    if (!apiToMove && sourceFolder.subfolders && sourceFolder.subfolders.length > 0) {
      for (const sub of sourceFolder.subfolders) {
        const found = sub.apis.find((api) => api.id === apiId);
        if (found) {
          apiToMove = found;
          break;
        }
      }
    }

    if (!apiToMove) return;
    
    // Helper to build updated collections that works even when source and target are the same collection
    const buildUpdatedCollections = (collectionsArr, newApiObj = apiToMove) => {
      return collectionsArr.map((folder) => {
        // Ignore unrelated folders
        if (folder.id !== sourceFolderId && folder.id !== targetFolderId) {
          return folder;
        }

        let updatedFolder = { ...folder };

        // Remove from source location (root or any subfolder)
        if (folder.id === sourceFolderId) {
          // Remove from collection root first
          updatedFolder.apis = updatedFolder.apis.filter((api) => api.id !== apiId);

          // Also remove from every subfolder just in case it resides there
          if (updatedFolder.subfolders && updatedFolder.subfolders.length > 0) {
            updatedFolder.subfolders = updatedFolder.subfolders.map((sub) => ({
              ...sub,
              apis: sub.apis.filter((api) => api.id !== apiId),
            }));
          }
        }

        // Add to target collection
        if (folder.id === targetFolderId) {
          updatedFolder.apis = [...updatedFolder.apis, newApiObj];
        }

        return updatedFolder;
      });
    };
    
    // Handle Electron offline mode or anonymous users
    if (isElectronOffline() || !isLoggedIn) {
      // Create a new API object with a local ID if coming from temp collection
      const newApi = sourceFolderId === 'temp-99999' 
        ? { ...apiToMove, id: getNextLocalId('local-api'), isTemporary: false } 
        : { ...apiToMove };

      const updatedCollections = buildUpdatedCollections(collections, newApi);

      // Update state & storage
      setCollections(updatedCollections);
      saveLocalCollections(updatedCollections);

      // Update active API ID if it was moved
      if (activeApiId === apiId) {
        setActiveApiId(newApi.id);
      }

      // Update open tabs
      if (openTabs.some((tab) => tab.id === apiId)) {
        const updatedTabs = openTabs.map((tab) =>
          tab.id === apiId ? { ...tab, id: newApi.id, folderId: targetFolderId, subfolderId: null } : tab
        );
        setOpenTabs(updatedTabs);
        localStorage.setItem('openTabs', JSON.stringify(updatedTabs));
      }

      return;
    }

    // If moving from temporary collection, create on server
    if (sourceFolderId === 'temp-99999') {
      // Create the API on the server in the target collection
      const response = await fetch('https://authrator.com/db-api/api/apis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collectionId: targetFolderId,
          name: apiToMove.name,
          method: apiToMove.method,
          url: apiToMove.url || "",
        }),
      });

      const data = await response.json();
      if (data.success) {
        const newServerApi = {
          ...apiToMove,
          id: data.api._id,
          isTemporary: false,
        };

        const updatedCollections = buildUpdatedCollections(collections, newServerApi);
        setCollections(updatedCollections);

        if (activeApiId === apiId) {
          setActiveApiId(newServerApi.id);
        }

        setOpenTabs((prevTabs) =>
          prevTabs.map((tab) => (tab.id === apiId ? { ...tab, id: newServerApi.id, folderId: targetFolderId, subfolderId: null } : tab))
        );
      }
    } else {
      // Moving between regular collections (or within same) - update on server
      let serverSuccess = false;

      if (sourceFolderId === targetFolderId) {
        // Moving to root within same collection – just clear subfolderId
        const respIntra = await fetch(`https://authrator.com/db-api/api/apis/${apiId}/move-to-subfolder`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ subfolderId: null }),
        });
        serverSuccess = respIntra.ok;
      } else {
        // Moving across collections
        const respInter = await fetch(`https://authrator.com/db-api/api/apis/${apiId}/move`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ newCollectionId: targetFolderId }),
        });
        serverSuccess = respInter.ok;
      }

      if (serverSuccess) {
        const updatedCollections = buildUpdatedCollections(collections, apiToMove);
        setCollections(updatedCollections);

        // Update open tabs
        setOpenTabs((prevTabs) =>
          prevTabs.map((tab) => (tab.id === apiId ? { ...tab, folderId: targetFolderId, subfolderId: null } : tab))
        );
      }
    }
  } catch (error) {
    console.error('Error moving API:', error);
  }
};

// Move API to subfolder
const moveApiToSubfolder = async (apiId, sourceCollectionId, targetCollectionId, targetSubfolderId, sourceSubfolderId = null) => {
  try {
    const apiData = findApiInCollections(apiId);
    if (!apiData) return;
    
    const { api: apiToMove } = apiData;

    // Helper to build updated collections ensuring both removal and addition (even when source & target are same collection)
    const buildUpdatedCollections = (collectionsArr) => {
      return collectionsArr.map((collection) => {
        // Only mutate collections that are source or target
        if (collection.id !== sourceCollectionId && collection.id !== targetCollectionId) {
          return collection;
        }

        let updatedCollection = { ...collection };

        // Handle removal logic (if this is the source collection)
        if (collection.id === sourceCollectionId) {
          if (sourceSubfolderId) {
            // Remove from source subfolder
            updatedCollection.subfolders = updatedCollection.subfolders.map((subfolder) =>
              subfolder.id === sourceSubfolderId
                ? { ...subfolder, apis: subfolder.apis.filter((api) => api.id !== apiId) }
                : subfolder
            );
          } else {
            // Remove from collection root
            updatedCollection.apis = updatedCollection.apis.filter((api) => api.id !== apiId);
          }
        }

        // Handle addition logic (if this is the target collection)
        if (collection.id === targetCollectionId) {
          updatedCollection.subfolders = updatedCollection.subfolders.map((subfolder) =>
            subfolder.id === targetSubfolderId
              ? { ...subfolder, apis: [...subfolder.apis, apiToMove] }
              : subfolder
          );
        }

        return updatedCollection;
      });
    };

    // Handle Electron offline mode or anonymous users
    if (isElectronOffline() || !isLoggedIn) {
      const updatedCollections = buildUpdatedCollections(collections);
      setCollections(updatedCollections);
      saveLocalCollections(updatedCollections);

      // Update open tabs
      if (openTabs.some((tab) => tab.id === apiId)) {
        const updatedTabs = openTabs.map((tab) =>
          tab.id === apiId ? { ...tab, folderId: targetCollectionId, subfolderId: targetSubfolderId } : tab
        );
        setOpenTabs(updatedTabs);
        localStorage.setItem('openTabs', JSON.stringify(updatedTabs));
      }

      return;
    }

    // Online mode - update on server first
    const response = await fetch(`https://authrator.com/db-api/api/apis/${apiId}/move-to-subfolder`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subfolderId: targetSubfolderId,
      }),
    });

    if (response.ok) {
      const updatedCollections = buildUpdatedCollections(collections);
      setCollections(updatedCollections);

      // Update open tabs
      setOpenTabs((prevTabs) =>
        prevTabs.map((tab) =>
          tab.id === apiId ? { ...tab, folderId: targetCollectionId, subfolderId: targetSubfolderId } : tab
        )
      );
    }
  } catch (error) {
    console.error('Error moving API to subfolder:', error);
  }
};

  
  const handleEnvironmentChange = (env) => {
    console.log("Environment changed to:", env);
    setActiveEnvironment(env);
    
    // Save to localStorage
    try {
      const storedData = localStorage.getItem('app_environments');
      let dataToUpdate = { environments: environments, globalVariables: {} };
      
      if (storedData) {
        dataToUpdate = JSON.parse(storedData);
      }
      
      dataToUpdate.activeEnvironmentId = env?.id || null;
      localStorage.setItem('app_environments', JSON.stringify(dataToUpdate));
      
      // In a real implementation, you would also save to the server here
      // For example:
      // fetch(`${API_BASE_URL}/environments/active`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ activeEnvironmentId: env?.id || null })
      // }).catch(err => console.error("Error saving active environment to server:", err));
    } catch (error) {
      console.error("Error saving active environment:", error);
    }
  };
  
  const handleAddEnvironment = (env) => {
    console.log("Adding environment:", env);
    const newEnv = { ...env, id: `env_${Date.now()}` };
    
    setEnvironments(prevEnvironments => {
      const updatedEnvironments = [...prevEnvironments, newEnv];
      console.log("Updated environments:", updatedEnvironments);
      
      // Save to localStorage
      try {
        const storedData = localStorage.getItem('app_environments');
        let dataToUpdate = { environments: updatedEnvironments, activeEnvironmentId: activeEnvironment?.id || null, globalVariables: {} };
        
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          dataToUpdate = {
            ...parsedData,
            environments: updatedEnvironments
          };
        }
        
        localStorage.setItem('app_environments', JSON.stringify(dataToUpdate));
        
        // In a real implementation, you would also save to the server here
        // For example:
        // fetch(`${API_BASE_URL}/environments`, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(newEnv)
        // }).catch(err => console.error("Error saving environment to server:", err));
      } catch (error) {
        console.error("Error saving environment:", error);
      }
      
      return updatedEnvironments;
    });
  };
  
  const handleDeleteEnvironment = (id) => {
    console.log("Deleting environment with id:", id);
    setEnvironments(prevEnvironments => {
      const updatedEnvironments = prevEnvironments.filter(env => env.id !== id);
      console.log("Updated environments after deletion:", updatedEnvironments);
      
      // Save to localStorage
      try {
        const storedData = localStorage.getItem('app_environments');
        let dataToUpdate = { environments: updatedEnvironments, activeEnvironmentId: activeEnvironment?.id || null, globalVariables: {} };
        
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          dataToUpdate = {
            ...parsedData,
            environments: updatedEnvironments
          };
          
          // If we deleted the active environment, update that too
          if (parsedData.activeEnvironmentId === id) {
            dataToUpdate.activeEnvironmentId = null;
            setActiveEnvironment(null);
          }
        }
        
        localStorage.setItem('app_environments', JSON.stringify(dataToUpdate));
        
        // In a real implementation, you would also delete from the server here
        // For example:
        // fetch(`${API_BASE_URL}/environments/${id}`, {
        //   method: 'DELETE'
        // }).catch(err => console.error("Error deleting environment from server:", err));
      } catch (error) {
        console.error("Error saving environment deletion:", error);
      }
      
      return updatedEnvironments;
    });
  };
  
  const handleUpdateEnvironment = (id, updatedEnv) => {
    console.log("Updating environment:", id, updatedEnv);
    setEnvironments(prevEnvironments => {
      const updatedEnvironments = prevEnvironments.map(env =>
      env.id === id ? { ...env, ...updatedEnv } : env
      );
      console.log("Updated environments after update:", updatedEnvironments);
      
      // Save to localStorage
      try {
        const storedData = localStorage.getItem('app_environments');
        let dataToUpdate = { environments: updatedEnvironments, activeEnvironmentId: activeEnvironment?.id || null, globalVariables: {} };
        
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          dataToUpdate = {
            ...parsedData,
            environments: updatedEnvironments
          };
        }
        
        localStorage.setItem('app_environments', JSON.stringify(dataToUpdate));
        
        // If we're updating the active environment, update that reference too
        if (activeEnvironment?.id === id) {
          const updatedActiveEnv = updatedEnvironments.find(env => env.id === id);
          setActiveEnvironment(updatedActiveEnv);
        }
        
        // In a real implementation, you would also update on the server here
        // For example:
        // fetch(`${API_BASE_URL}/environments/${id}`, {
        //   method: 'PUT',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(updatedEnv)
        // }).catch(err => console.error("Error updating environment on server:", err));
      } catch (error) {
        console.error("Error saving environment update:", error);
      }
      
      return updatedEnvironments;
    });
  };
  
  useEffect(() => {
    setOpenTabs(prevTabs => 
      prevTabs.map(tab => {
        const apiLocation = findApiInCollections(tab.id);
        if (apiLocation) {
          return {
            ...tab,
            method: apiLocation.api.method,
            name: apiLocation.api.name,
            folderId: apiLocation.collection.id,
            subfolderId: apiLocation.subfolder?.id || null
          };
        }
        return tab;
      })
    );
  }, [collections]);

  const [scriptType, setScriptType] = useState('pre-request');
  const [consoleOutput, setConsoleOutput] = useState([]);
 
 


  const closeTab = (apiId) => {
    // First check if this is a temporary API in the temp collection
    const tempCollection = collections.find(folder => folder.id === 'temp-99999');
    if (tempCollection) {
      const tempApi = tempCollection.apis.find(api => api.id === apiId);
      if (tempApi && tempApi.isTemporary) {
        // Delete the API from the temp collection
        setCollections(prevCollections => {
          const updatedCollections = prevCollections.map(folder => {
            if (folder.id === 'temp-99999') {
              return {
                ...folder,
                apis: folder.apis.filter(api => api.id !== apiId)
              };
            }
            return folder;
          });
          
          // Save updated collections to localStorage for unauthorized users
          if (!localStorage.getItem('userId')) {
            saveLocalCollections(updatedCollections);
          }
          
          return updatedCollections;
        });
      }
    }
  
    // Check if this is an unsaved API (has temp- prefix in ID)
    if (apiId.startsWith('temp-')) {
      // Find and remove the API from any collection or subfolder
      setCollections(prevCollections => {
        const updatedCollections = prevCollections.map(folder => ({
          ...folder,
          apis: folder.apis.filter(api => api.id !== apiId),
          subfolders: (folder.subfolders || []).map(subfolder => ({
            ...subfolder,
            apis: subfolder.apis.filter(api => api.id !== apiId)
          }))
        }));
        
        // Save updated collections to localStorage for unauthorized users
        if (!localStorage.getItem('userId')) {
          saveLocalCollections(updatedCollections);
        }
        
        return updatedCollections;
      });
    }
  
    // Remove the tab from openTabs regardless of whether it's temporary or saved
    setOpenTabs(prevTabs => {
      const newTabs = prevTabs.filter(tab => tab.id !== apiId);
      // If this was the last tab, clear active states and set flag to indicate user intentionally cleared tabs
      if (newTabs.length === 0) {
        setActiveApiId(null);
        setActiveFolderId(null);
        setActiveSubfolderId(null);
        
        // Set flag to indicate user intentionally closed all tabs
        localStorage.setItem('user_closed_all_tabs', 'true');
      }
      
      // Save updated tabs to localStorage
      localStorage.setItem('openTabs', JSON.stringify(newTabs));
      
      return newTabs;
    });
    
    // Update active API and folder if needed
    if (activeApiId === apiId) {
      const remainingTabs = openTabs.filter(tab => tab.id !== apiId);
      if (remainingTabs.length > 0) {
        setActiveApiId(remainingTabs[0].id);
        setActiveFolderId(remainingTabs[0].folderId);
        setActiveSubfolderId(remainingTabs[0].subfolderId || null);
      } else {
        setActiveApiId(null);
        setActiveFolderId(null);
        setActiveSubfolderId(null);
      }
    }
  };
  
    const openNewTab = (folderId, api, subfolderId = null) => {
      if (!openTabs.find(tab => tab.id === api.id)) {
        const newTabs = [...openTabs, { 
          id: api.id, 
          name: api.name, 
          method: api.method,
          folderId: folderId,
          subfolderId: subfolderId
        }];
        setOpenTabs(newTabs);
        
        // Save tabs to localStorage
        localStorage.setItem('openTabs', JSON.stringify(newTabs));
        
        // Clear the flag since user is actively opening tabs
        localStorage.removeItem('user_closed_all_tabs');
      }
      setActiveFolderId(folderId);
      setActiveSubfolderId(subfolderId);
      setActiveApiId(api.id);
    };
    const toggleDarkMode = () => {
      setIsDarkMode(!isDarkMode);
    };
    useEffect(() => {
      const fetchCollections = async () => {
        try {
          // Check if user is logged in
          const userId = localStorage.getItem('userId');
          const user = localStorage.getItem('user');
          
          if (userId && user && navigator.onLine) {
            // For logged-in users, fetch from API
            const response = await fetch(`https://authrator.com/db-api/api/collections/${userId}`);
            const data = await response.json();
            if (data.success) {
              // Make sure all collections have a default color, subfolders array, and default headers
              const collectionsWithColorsAndSubfolders = data.collections.map(collection => ({
                ...collection,
                color: collection.color || '#FF6B6B', // Ensure color exists with default
                subfolders: collection.subfolders || [], // Ensure subfolders exists
                // Ensure all APIs have default headers
                apis: (collection.apis || []).map(api => ({
                  ...api,
                  headers: ensureApiHasDefaultHeaders(api.headers || [], api.settings || {})
                }))
              }));
              
              // Also ensure subfolders have default headers
              const collectionsWithHeaders = collectionsWithColorsAndSubfolders.map(collection => ({
                ...collection,
                subfolders: (collection.subfolders || []).map(subfolder => ({
                  ...subfolder,
                  apis: (subfolder.apis || []).map(api => ({
                    ...api,
                    headers: ensureApiHasDefaultHeaders(api.headers || [], api.settings || {})
                  }))
                }))
              }));
              
              setCollections(collectionsWithHeaders);

              // Also save these to localStorage to handle refreshes better
              if (isElectron()) {
                saveLocalCollections(collectionsWithHeaders);
              }
            }
          } else {
            // For anonymous or offline users, load from localStorage
            const localCollections = getLocalCollections();
            if (!localCollections || localCollections.length === 0) {
              // Initialize with empty collections if none exist
              saveLocalCollections([]);
              setCollections([]);
            } else {
              // Make sure all collections have colors, subfolders, and default headers
              const localCollectionsWithColorsAndSubfolders = localCollections.map(collection => ({
                ...collection,
                color: collection.color || '#FF6B6B',
                subfolders: collection.subfolders || [],
                // Ensure all APIs have default headers
                apis: (collection.apis || []).map(api => ({
                  ...api,
                  headers: ensureApiHasDefaultHeaders(api.headers || [], api.settings || {})
                }))
              }));
              
              // Also ensure subfolders have default headers
              const localCollectionsWithHeaders = localCollectionsWithColorsAndSubfolders.map(collection => ({
                ...collection,
                subfolders: (collection.subfolders || []).map(subfolder => ({
                  ...subfolder,
                  apis: (subfolder.apis || []).map(api => ({
                    ...api,
                    headers: ensureApiHasDefaultHeaders(api.headers || [], api.settings || {})
                  }))
                }))
              }));
              
              setCollections(localCollectionsWithHeaders);
              saveLocalCollections(localCollectionsWithHeaders);
            }
          }
        } catch (error) {
          console.error('Error fetching collections:', error);
          // Fallback to local collections on error
          const localCollections = getLocalCollections();
          // Ensure colors, subfolders, and headers exist in fallback as well
          const localCollectionsWithColorsAndSubfolders = (localCollections || []).map(collection => ({
            ...collection,
            color: collection.color || '#FF6B6B',
            subfolders: collection.subfolders || [],
            // Ensure all APIs have default headers
            apis: (collection.apis || []).map(api => ({
              ...api,
              headers: ensureApiHasDefaultHeaders(api.headers || [], api.settings || {})
            }))
          }));
          
          // Also ensure subfolders have default headers
          const localCollectionsWithHeaders = localCollectionsWithColorsAndSubfolders.map(collection => ({
            ...collection,
            subfolders: (collection.subfolders || []).map(subfolder => ({
              ...subfolder,
              apis: (subfolder.apis || []).map(api => ({
                ...api,
                headers: ensureApiHasDefaultHeaders(api.headers || [], api.settings || {})
              }))
            }))
          }));
          
          setCollections(localCollectionsWithHeaders);
          saveLocalCollections(localCollectionsWithHeaders);
                  }
          
          // For unauthorized users, create default tab after collections load
          setTimeout(() => {
            const isUnauthorized = !localStorage.getItem('user');
            const userClosedAllTabs = localStorage.getItem('user_closed_all_tabs');
            
            if (isUnauthorized && openTabs.length === 0 && userClosedAllTabs !== 'true') {
              console.log('Creating default tab for unauthorized user after collections load');
              forceCreateDefaultTab();
            }
          }, 100);
        };
    
      fetchCollections();
    }, [userId]);

    const handleSignOut = () => {
      // Clear all app data
      clearLocalStorageData();
      
      // Clear auth data
      localStorage.removeItem('userId');
      localStorage.removeItem('user');
      localStorage.removeItem('auth_success_timestamp');
      
      // Reset state
      setCollections([]);
      setOpenTabs([]);
      setActiveApiId(null);
      setActiveFolderId(null);
      setActiveSubfolderId(null);
      setEnvironments([]);
      setActiveEnvironment(null);
      
      // Force create default tab after clearing data on logout
      setTimeout(() => forceCreateDefaultTab(), 100);
      
      // For electron, stay on dashboard with default tab, for web go to landing
      if (isElectron()) {
        // Stay on current page but with fresh state
        window.location.reload();
      } else {
        navigate('/');
      }
    }
    
    // Subfolder management functions
    const createNewSubfolder = async (collectionId) => {
      const userId = localStorage.getItem('userId');
      const isUserLoggedIn = !!localStorage.getItem('user');
      
      // If in Electron and offline, or user is not logged in, create a local subfolder
      if (isElectronOffline() || !isUserLoggedIn) {
        const localSubfolderId = getNextLocalId('local-subfolder');
        const newSubfolder = {
          id: localSubfolderId,
          name: 'New Subfolder',
          apis: [],
          isOffline: true
        };
        
        const updatedCollections = collections.map(collection => {
          if (collection.id === collectionId) {
            return {
              ...collection,
              subfolders: [...(collection.subfolders || []), newSubfolder]
            };
          }
          return collection;
        });
        
        setCollections(updatedCollections);
        setActiveSubfolderId(localSubfolderId);
        
        // Save to local storage
        saveLocalCollections(updatedCollections);
        
        // Open rename modal for subfolder
        openRenameModal(localSubfolderId, 'subfolder', newSubfolder.name);
        return;
      }
      
      // Online mode for logged in users
      try {
        const response = await fetch('https://authrator.com/db-api/api/subfolders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'New Subfolder',
            collectionId
          }),
        });
        
        const data = await response.json();
        if (data.success) {
          const newSubfolder = {
            id: data.subfolder._id,
            name: 'New Subfolder',
            apis: []
          };
          
          const updatedCollections = collections.map(collection => {
            if (collection.id === collectionId) {
              return {
                ...collection,
                subfolders: [...(collection.subfolders || []), newSubfolder]
              };
            }
            return collection;
          });
          
          setCollections(updatedCollections);
          setActiveSubfolderId(newSubfolder.id);
          
          // Open rename modal for subfolder
          openRenameModal(newSubfolder.id, 'subfolder', newSubfolder.name);
        }
      } catch (error) {
        console.error('Error creating subfolder:', error);
        // Fallback to create local subfolder
        const localSubfolderId = getNextLocalId('local-subfolder');
        const newSubfolder = {
          id: localSubfolderId,
          name: 'New Subfolder',
          apis: [],
          isOffline: true
        };
        
        const updatedCollections = collections.map(collection => {
          if (collection.id === collectionId) {
            return {
              ...collection,
              subfolders: [...(collection.subfolders || []), newSubfolder]
            };
          }
          return collection;
        });
        
        setCollections(updatedCollections);
        saveLocalCollections(updatedCollections);
        openRenameModal(localSubfolderId, 'subfolder', newSubfolder.name);
      }
    };

    const createNewFolder = async () => {
      const userId = localStorage.getItem('userId');
      const isUserLoggedIn = !!localStorage.getItem('user');
      
      // If in Electron and offline, or user is not logged in, create a local collection
      if (isElectronOffline() || !isUserLoggedIn) {
        const localFolderId = getNextLocalId('local-folder');
        const newFolder = {
          id: localFolderId,
          name: 'New Collection',
          apis: [],
          subfolders: [],
          isOffline: true,
          color: selectedColor
        };
        
        const updatedCollections = [...collections, newFolder];
        setCollections(updatedCollections);
        setActiveFolderId(localFolderId);
        setActiveApiId(null);
        
        // Save to local storage
        saveLocalCollections(updatedCollections);
        
        // Open the rename modal immediately after creating the collection
        openRenameModal(localFolderId, 'collection', newFolder.name);
        return;
      }
      
      // Online mode for logged in users
      try {
        const response = await fetch('https://authrator.com/db-api/api/collections', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'New Collection',
            userId,
            color: selectedColor
          }),
        });
        
        const data = await response.json();
        if (data.success) {
          const newFolder = {
            id: data.collection._id,
            name: 'New Collection',
            apis: [],
            subfolders: [],
            color: selectedColor
          };
          setCollections([...collections, newFolder]);
          setActiveFolderId(newFolder.id);
          setActiveApiId(null);
          
          // Open the rename modal immediately after creating the collection
          openRenameModal(newFolder.id, 'collection', newFolder.name);
        }
      } catch (error) {
        console.error('Error creating collection:', error);
        // Fallback to create local collection
        const localFolderId = getNextLocalId('local-folder');
        const newFolder = {
          id: localFolderId,
          name: 'New Collection',
          apis: [],
          subfolders: [],
          isOffline: true,
          color: selectedColor
        };
        
        const updatedCollections = [...collections, newFolder];
        setCollections(updatedCollections);
        saveLocalCollections(updatedCollections);
        openRenameModal(localFolderId, 'collection', newFolder.name);
      }
    };
    

    // Create API in subfolder
    const createNewApiInSubfolder = async (collectionId, subfolderId) => {
      const userId = localStorage.getItem('userId');
      const isUserLoggedIn = !!localStorage.getItem('user');
      
      // For anonymous users or offline mode, save to localStorage
      if (isElectronOffline() || !isUserLoggedIn) {
        const newApiId = getNextLocalId('local-api');
        
        // Create new API object
        const newApi = {
          id: newApiId,
          name: 'New Request',
          method: 'GET',
          url: "",
          headers: getEnabledDefaultHeaders({}),
          queryParams: [],
          body: {
            type: "none",
            content: "",
            formData: [],
            urlencoded: [],
          },
          scripts: {
            preRequest: "",
            tests: "",
          },
          auth: {
            type: "none",
            jwt: { key: "", value: "", pairs: [] },
            avqJwt: { value: "" },
          },
          responseData: null,
          activeResponseTab: "response-body",
          isOffline: true 
        };
        
        const updatedCollections = collections.map(collection => {
          if (collection.id === collectionId) {
            return {
              ...collection,
              subfolders: (collection.subfolders || []).map(subfolder => {
                if (subfolder.id === subfolderId) {
                  return {
                    ...subfolder,
                    apis: [...subfolder.apis, newApi]
                  };
                }
                return subfolder;
              })
            };
          }
          return collection;
        });
        
        setCollections(updatedCollections);
                  setActiveApiId(newApiId);
          setActiveFolderId(collectionId);
          setActiveSubfolderId(subfolderId);
          openNewTab(collectionId, newApi, subfolderId);
          saveLocalCollections(updatedCollections);
          
          // Clear the flag since user is actively creating tabs
          localStorage.removeItem('user_closed_all_tabs');
          
          return;
      }
      
      // Online mode for logged in users
      try {
        const response = await fetch('https://authrator.com/db-api/api/apis/in-subfolder', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            collectionId,
            subfolderId,
            name: 'New Request',
            method: 'GET'
          }),
        });
        
        const data = await response.json();
        if (data.success) {
          const newApi = {
            id: data.api._id,
            name: 'New Request',
            method: 'GET',
            url: "",
            headers: getEnabledDefaultHeaders({}),
            queryParams: [],
            body: {
              type: "none",
              content: "",
              formData: [],
              urlencoded: [],
            },
            scripts: {
              preRequest: "",
              tests: "",
            },
            auth: {
              type: "none",
              jwt: { key: "", value: "", pairs: [] },
              avqJwt: { value: "" },
            },
            responseData: null,
            activeResponseTab: "response-body"
          };
          
          const updatedCollections = collections.map(collection => {
            if (collection.id === collectionId) {
              return {
                ...collection,
                subfolders: (collection.subfolders || []).map(subfolder => {
                  if (subfolder.id === subfolderId) {
                    return {
                      ...subfolder,
                      apis: [...subfolder.apis, newApi]
                    };
                  }
                  return subfolder;
                })
              };
            }
            return collection;
          });
          
          setCollections(updatedCollections);
          setActiveApiId(newApi.id);
          setActiveFolderId(collectionId);
          setActiveSubfolderId(subfolderId);
          openNewTab(collectionId, newApi, subfolderId);
          
          // Clear the flag since user is actively creating tabs
          localStorage.removeItem('user_closed_all_tabs');
        }
      } catch (error) {
        console.error('Error creating API in subfolder:', error);
        setError('Failed to create API in subfolder');
      }
    };

    const createNewApi = async (folderId, subfolderId = null) => {
      // For anonymous users or offline mode, save to localStorage
      if (isElectronOffline() || !isLoggedIn) {
        if (folderId === 'temp-99999') {
          const tempCollection = await ensureTempCollectionExists();
          
          const tempApiId = `temp-${Date.now()}`;
          const newApi = {
            id: tempApiId,
            name: 'New Request',
            method: 'GET',
            url: "",
            headers: getEnabledDefaultHeaders({}),
            queryParams: [],
            body: {
              type: "none",
              content: "",
              formData: [],
              urlencoded: [],
            },
            scripts: {
              preRequest: "",
              tests: "",
            },
            auth: {
              type: "none",
              jwt: { key: "", value: "", pairs: [] },
              avqJwt: { value: "" },
            },
            responseData: null,
            activeResponseTab: "response-body",
            isTemporary: true
          };
          
          // Update collections state
          setCollections(prevCollections => {
            const updatedCollections = prevCollections.map(folder => {
              if (folder.id === 'temp-99999') {
                return {
                  ...folder,
                  apis: [...folder.apis, newApi]
                };
              }
              return folder;
            });
            return updatedCollections;
          });
          
                  // Set the new API as active and open it in a tab
        setActiveApiId(tempApiId);
        openNewTab('temp-99999', newApi);
        
        // Clear the flag since user is actively creating tabs
        localStorage.removeItem('user_closed_all_tabs');
        
        return;
        }
        // Generate local ID
        const newApiId = getNextLocalId('local-api');
        
        // Create new API object
        const newApi = {
          id: newApiId,
          name: 'New Request',
          method: 'GET',
          url: "",
          headers: getEnabledDefaultHeaders({}),
          queryParams: [],
          body: {
            type: "none",
            content: "",
            formData: [],
            urlencoded: [],
          },
          scripts: {
            preRequest: "",
            tests: "",
          },
          auth: {
            type: "none",
            jwt: { key: "", value: "", pairs: [] },
            avqJwt: { value: "" },
          },
          responseData: null,
          activeResponseTab: "response-body",
          isOffline: true 
        };
        
        const updatedCollections = collections.map(folder => {
          if (folder.id === folderId) {
            return {
              ...folder,
              apis: [...folder.apis, newApi]
            };
          }
          return folder;
        });
        
        setCollections(updatedCollections);
        setActiveApiId(newApiId);
        openNewTab(folderId, newApi);
        saveLocalCollections(updatedCollections);
        
        // Clear the flag since user is actively creating tabs
        localStorage.removeItem('user_closed_all_tabs');
        
        return;
      }
      
      if (folderId === 'temp-99999') {
        const tempCollection = await ensureTempCollectionExists();
        
        const tempApiId = `temp-${Date.now()}`;
        const newApi = {
          id: tempApiId,
          name: 'New Request',
          method: 'GET',
          url: "",
          headers: getEnabledDefaultHeaders({}),
          queryParams: [],
          body: {
            type: "none",
            content: "",
            formData: [],
            urlencoded: [],
          },
          scripts: {
            preRequest: "",
            tests: "",
          },
          auth: {
            type: "none",
            jwt: { key: "", value: "", pairs: [] },
            avqJwt: { value: "" },
          },
          responseData: null,
          activeResponseTab: "response-body",
          isTemporary: true
        };
        
        // Update collections state
        setCollections(prevCollections => {
          const updatedCollections = prevCollections.map(folder => {
            if (folder.id === 'temp-99999') {
              return {
                ...folder,
                apis: [...folder.apis, newApi]
              };
            }
            return folder;
          });
          return updatedCollections;
        });
        
        // Set the new API as active and open it in a tab
        setActiveApiId(tempApiId);
        openNewTab('temp-99999', newApi);
        
        // Clear the flag since user is actively creating tabs
        localStorage.removeItem('user_closed_all_tabs');
        
        return;
      }
      
      // Regular collection - Create API on server
      try {
        const response = await fetch('https://authrator.com/db-api/api/apis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            collectionId: folderId,
            name: 'New Request',
            method: 'GET'
          }),
        });
             
        const data = await response.json();
        if (data.success) {
          const newApi = {
            id: data.api._id,
            name: data.api.name,
            method: data.api.method,
            url: "",
            headers: getEnabledDefaultHeaders({}),
            queryParams: [],
            body: {
              type: "none",
              content: "",
              formData: [],
              urlencoded: [],
            },
            scripts: {
              preRequest: "",
              tests: "",
            },
            auth: {
              type: "none",
              jwt: { key: "", value: "", pairs: [] },
              avqJwt: { value: "" },
            },
            responseData: null,
            activeResponseTab: "response-body",
          };
          
          const updatedCollections = collections.map((folder) => {
            if (folder.id === folderId) {
              return {
                ...folder,
                apis: [...folder.apis, newApi]
              };
            }
            return folder;
          });
          
          setCollections(updatedCollections);
          setActiveApiId(newApi.id);
          openNewTab(folderId, newApi);
          
          // Clear the flag since user is actively creating tabs
          localStorage.removeItem('user_closed_all_tabs');
        }
      } catch (error) {
        console.error('Error creating API:', error);
      }
    };

    // Add a function to load collections from local storage at app startup
const loadLocalCollections = () => {
  if (isElectron()) {
    // Check if we're offline
    const offline = !navigator.onLine;
    setIsOffline(offline);
    
    // Load local collections if we're in Electron
    const localCollections = getLocalCollections();
    if (localCollections.length > 0) {
      if (offline) {
        // If offline, use only local collections but ensure they have default headers
        const collectionsWithHeaders = localCollections.map(collection => ({
          ...collection,
          // Ensure all APIs have default headers
          apis: (collection.apis || []).map(api => ({
            ...api,
            headers: ensureApiHasDefaultHeaders(api.headers || [], api.settings || {})
          })),
          // Also ensure subfolders have default headers
          subfolders: (collection.subfolders || []).map(subfolder => ({
            ...subfolder,
            apis: (subfolder.apis || []).map(api => ({
              ...api,
              headers: ensureApiHasDefaultHeaders(api.headers || [], api.settings || {})
            }))
          }))
        }));
        setCollections(collectionsWithHeaders);
      } else if (collections.length > 0) {
        // If online and we already have collections, merge with local ones
        // but mark local ones as offline and ensure they have headers
        const markedLocalCollections = localCollections.map(collection => ({
          ...collection,
          isOffline: true,
          // Ensure all APIs have default headers
          apis: (collection.apis || []).map(api => ({
            ...api,
            headers: ensureApiHasDefaultHeaders(api.headers || [], api.settings || {})
          })),
          // Also ensure subfolders have default headers
          subfolders: (collection.subfolders || []).map(subfolder => ({
            ...subfolder,
            apis: (subfolder.apis || []).map(api => ({
              ...api,
              headers: ensureApiHasDefaultHeaders(api.headers || [], api.settings || {})
            }))
          }))
        }));
        
        // Merge without duplicates
        const existingIds = new Set(collections.map(c => c.id));
        const newLocalCollections = markedLocalCollections.filter(c => !existingIds.has(c.id));
        
        setCollections([...collections, ...newLocalCollections]);
      }
    }
  }
};

// Function to handle updating API details in offline mode or for anonymous users
const updateApiOffline = (apiId, updatedFields) => {
  if (isElectronOffline() || !isLoggedIn) {
    const updatedCollections = collections.map(folder => {
      // Update direct APIs in collection
      const updatedDirectApis = folder.apis.map(api => {
        if (api.id === apiId) {
          return { ...api, ...updatedFields };
        }
        return api;
      });
      
      // Update APIs in subfolders
      const updatedSubfolders = (folder.subfolders || []).map(subfolder => ({
        ...subfolder,
        apis: subfolder.apis.map(api => 
          api.id === apiId ? { ...api, ...updatedFields } : api
        )
      }));
      
      return {
        ...folder,
        apis: updatedDirectApis,
        subfolders: updatedSubfolders
      };
    });
    
    setCollections(updatedCollections);
    saveLocalCollections(updatedCollections);
  }
};

// Function to save API response when executing requests
const saveApiResponseOffline = (apiId, responseData) => {
  if (isElectronOffline() || !isLoggedIn) {
    updateApiOffline(apiId, { responseData });
  }
};

// Function to delete API in offline mode or for anonymous users
const deleteApiOffline = (apiId) => {
  if (isElectronOffline() || !isLoggedIn) {
    const updatedCollections = collections.map(folder => ({
      ...folder,
      apis: folder.apis.filter(api => api.id !== apiId),
      subfolders: (folder.subfolders || []).map(subfolder => ({
        ...subfolder,
        apis: subfolder.apis.filter(api => api.id !== apiId)
      }))
    }));
    
    setCollections(updatedCollections);
    saveLocalCollections(updatedCollections);
    
    // If the deleted API was active, set activeApiId to null
    if (activeApiId === apiId) {
      setActiveApiId(null);
      setActiveSubfolderId(null);
    }
  }
};

  // Function to delete folder in offline mode or for anonymous users
const deleteFolderOffline = (folderId) => {
  if (isElectronOffline() || !isLoggedIn) {
    const updatedCollections = collections.filter(folder => folder.id !== folderId);
    
    setCollections(updatedCollections);
    saveLocalCollections(updatedCollections);
  
    if (activeFolderId === folderId) {
      setActiveFolderId(null);
      setActiveApiId(null);
    }
  }
};

// Function to handle importing collections from Postman
const handleImportCollections = async (importedCollections) => {
  try {
    const userId = localStorage.getItem('userId');
    const isUserLoggedIn = !!localStorage.getItem('user');
    
    // Process each imported collection
    const newCollections = [];
    
    for (const collection of importedCollections) {
      if (isElectronOffline() || !isUserLoggedIn) {
        // Offline mode - save to localStorage
        // Ensure collection has proper structure for offline mode
        const offlineCollection = {
          ...collection,
          isOffline: true,
          apis: collection.apis || [],
          subfolders: (collection.subfolders || []).map(subfolder => ({
            ...subfolder,
            apis: subfolder.apis || []
          }))
        };
        
        newCollections.push(offlineCollection);
      } else {
        // Online mode - save to server
        try {
          // Create collection on server
          const collectionResponse = await fetch('https://authrator.com/db-api/api/collections', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: collection.name,
              userId: userId,
              color: collection.color || '#FF6B6B'
            }),
          });
          
          const collectionData = await collectionResponse.json();
          if (!collectionData.success) {
            throw new Error('Failed to create collection on server');
          }
          
          const serverCollection = {
            id: collectionData.collection._id,
            name: collectionData.collection.name,
            color: collectionData.collection.color,
            apis: [],
            subfolders: []
          };
          
          // Create subfolders first
          const subfolderMap = new Map();
          for (const subfolder of collection.subfolders || []) {
            try {
              const subfolderResponse = await fetch('https://authrator.com/db-api/api/subfolders', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  name: subfolder.name,
                  collectionId: serverCollection.id
                }),
              });
              
              const subfolderData = await subfolderResponse.json();
              if (subfolderData.success) {
                const serverSubfolder = {
                  id: subfolderData.subfolder._id,
                  name: subfolderData.subfolder.name,
                  apis: []
                };
                serverCollection.subfolders.push(serverSubfolder);
                subfolderMap.set(subfolder.id, serverSubfolder.id);
              }
            } catch (error) {
              console.error('Error creating subfolder:', error);
            }
          }
          
          // Create APIs
          for (const api of collection.apis || []) {
            try {
              const apiResponse = await fetch('https://authrator.com/db-api/api/apis', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  collectionId: serverCollection.id,
                  name: api.name,
                  method: api.method || 'GET'
                }),
              });
              
              const apiData = await apiResponse.json();
              if (apiData.success) {
                // Update the API with full details
                await fetch(`https://authrator.com/db-api/api/apis/${apiData.api._id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    url: api.url || '',
                    headers: api.headers || [],
                    queryParams: api.queryParams || [],
                    body: api.body || { type: 'none', content: '' },
                    auth: api.auth || { type: 'none' },
                    scripts: api.scripts || { preRequest: '', tests: '' }
                  }),
                });
                
                const serverApi = {
                  id: apiData.api._id,
                  name: api.name,
                  method: api.method || 'GET',
                  url: api.url || '',
                  headers: api.headers || [],
                  queryParams: api.queryParams || [],
                  body: api.body || { type: 'none', content: '' },
                  auth: api.auth || { type: 'none' },
                  scripts: api.scripts || { preRequest: '', tests: '' }
                };
                
                serverCollection.apis.push(serverApi);
              }
            } catch (error) {
              console.error('Error creating API:', error);
            }
          }
          
          // Create APIs in subfolders
          for (const subfolder of collection.subfolders || []) {
            const serverSubfolderId = subfolderMap.get(subfolder.id);
            if (serverSubfolderId) {
              const serverSubfolder = serverCollection.subfolders.find(sf => sf.id === serverSubfolderId);
              
              for (const api of subfolder.apis || []) {
                try {
                  const apiResponse = await fetch('https://authrator.com/db-api/api/apis', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      collectionId: serverCollection.id,
                      subfolderId: serverSubfolderId,
                      name: api.name,
                      method: api.method || 'GET'
                    }),
                  });
                  
                  const apiData = await apiResponse.json();
                  if (apiData.success) {
                    // Update the API with full details
                    await fetch(`https://authrator.com/db-api/api/apis/${apiData.api._id}`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        url: api.url || '',
                        headers: api.headers || [],
                        queryParams: api.queryParams || [],
                        body: api.body || { type: 'none', content: '' },
                        auth: api.auth || { type: 'none' },
                        scripts: api.scripts || { preRequest: '', tests: '' }
                      }),
                    });
                    
                    const serverApi = {
                      id: apiData.api._id,
                      name: api.name,
                      method: api.method || 'GET',
                      url: api.url || '',
                      headers: api.headers || [],
                      queryParams: api.queryParams || [],
                      body: api.body || { type: 'none', content: '' },
                      auth: api.auth || { type: 'none' },
                      scripts: api.scripts || { preRequest: '', tests: '' }
                    };
                    
                    serverSubfolder.apis.push(serverApi);
                  }
                } catch (error) {
                  console.error('Error creating API in subfolder:', error);
                }
              }
            }
          }
          
          // Add to collections state
          newCollections.push(serverCollection);
        } catch (error) {
          console.error('Error importing collection to server:', error);
          // Fallback to offline mode
          const offlineCollection = {
            ...collection,
            isOffline: true,
            apis: collection.apis || [],
            subfolders: (collection.subfolders || []).map(subfolder => ({
              ...subfolder,
              apis: subfolder.apis || []
            }))
          };
          newCollections.push(offlineCollection);
        }
      }
    }
    
    // Update collections state with all new collections
    const updatedCollections = [...collections, ...newCollections];
    setCollections(updatedCollections);
    
    // Save offline collections if needed
    if (isElectronOffline() || !isUserLoggedIn) {
      saveLocalCollections(updatedCollections);
    }
  } catch (error) {
    console.error('Error importing collections:', error);
    throw error;
  }
};

// Function to show toast messages
const showToastMessage = (message, type = 'info') => {
  setToast({ show: true, message, type });
};
    
useEffect(() => {

  window.addEventListener('online', handleConnectionChange);
  window.addEventListener('offline', handleConnectionChange);
  
  loadLocalCollections();
  
  return () => {
    window.removeEventListener('online', handleConnectionChange);
    window.removeEventListener('offline', handleConnectionChange);
  };
}, []);

const handleConnectionChange = () => {
  const isCurrentlyOffline = !navigator.onLine;
  setIsOffline(isCurrentlyOffline);
  
  // If back online and in Electron, clean up offline data
  if (!isCurrentlyOffline && isElectron()) {
    cleanupOfflineData();
  }
};

// Function to clean up offline data when returning to online mode
const cleanupOfflineData = () => {
  // Clear local storage for offline collections
  localStorage.removeItem('offline_collections');
  
  // Remove all offline collections and APIs from state
  const onlineCollections = collections.filter(folder => 
    !folder.isOffline && 
    !folder.id.startsWith('local-folder-')
  );
  
  // Also filter out any APIs that have isOffline flag or local IDs
  const cleanedCollections = onlineCollections.map(folder => ({
    ...folder,
    apis: folder.apis.filter(api => 
      !api.isOffline && 
      !api.id.startsWith('local-api-')
    )
  }));
  
  setCollections(cleanedCollections);
  
  // If active folder or API was offline, reset them
  if (activeFolderId && (
    activeFolderId.startsWith('local-folder-') || 
    collections.find(f => f.id === activeFolderId)?.isOffline
  )) {
    setActiveFolderId(null);
  }
  
  if (activeApiId && (
    activeApiId.startsWith('local-api-') || 
    getApiById(activeApiId)?.isOffline
  )) {
    setActiveApiId(null);
  }
  
  // Close any tabs for offline APIs
  const tabsToKeep = openTabs.filter(tab => 
    !tab.id.startsWith('local-api-') && 
    !getApiById(tab.id)?.isOffline
  );
  
  setOpenTabs(tabsToKeep);
  localStorage.setItem('openTabs', JSON.stringify(tabsToKeep));
};

// Function to clean up old request history records
const cleanupOldRecords = (records) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return records.filter(record => new Date(record.timestamp) >= thirtyDaysAgo);
};

// Function to save request history locally
const saveRequestHistoryOffline = (requestMetrics) => {
  if (isElectronOffline() || !isLoggedIn) {
    // Get existing history from local storage
    const localHistory = localStorage.getItem('requestHistory') 
      ? JSON.parse(localStorage.getItem('requestHistory')) 
      : [];
    
    // Clean up old records and add new request
    const cleanedHistory = cleanupOldRecords(localHistory);
    const updatedHistory = [...cleanedHistory, requestMetrics];
    
    // Save back to local storage
    localStorage.setItem('requestHistory', JSON.stringify(updatedHistory));
    
    // Also update the API's history if needed
    if (activeApiId) {
      const api = getApiById(activeApiId);
      if (api) {
        const cleanedApiHistory = cleanupOldRecords(api.requestHistory || []);
        updateApiOffline(activeApiId, {
          requestHistory: [...cleanedApiHistory, requestMetrics],
          lastRequest: {
            timestamp: requestMetrics.timestamp,
            success: requestMetrics.success,
            method: requestMetrics.method,
            url: requestMetrics.url
          }
        });
      }
    }
  }
};

// Helper function to get API by ID
const getApiById = (apiId) => {
  for (const folder of collections) {
    // Check direct APIs in collection
    const directApi = folder.apis.find(api => api.id === apiId);
    if (directApi) return directApi;
    
    // Check APIs in subfolders
    for (const subfolder of folder.subfolders || []) {
      const subfolderApi = subfolder.apis.find(api => api.id === apiId);
      if (subfolderApi) return subfolderApi;
    }
  }
  return null;
};
    // Update handleDelete function
    const handleDelete = async (id, type = 'collection') => {
      // Check if user is anonymous or in offline mode
      if (!isLoggedIn || isElectronOffline()) {
        if (type === 'api') {
          // Delete API in offline mode
          deleteApiOffline(id);
          
          // Close the tab if it's open
          if (openTabs.some(tab => tab.id === id)) {
            closeTab(id);
          }
        } else if (type === 'subfolder') {
          // Delete Subfolder in offline mode
          const updatedCollections = collections.map(collection => ({
            ...collection,
            subfolders: (collection.subfolders || []).filter(subfolder => subfolder.id !== id)
          }));
          setCollections(updatedCollections);
          saveLocalCollections(updatedCollections);
          
          // Close tabs for APIs that were in this subfolder
          const tabsToClose = openTabs.filter(tab => tab.subfolderId === id);
          tabsToClose.forEach(tab => closeTab(tab.id));
        } else {
          // Delete Collection in offline mode
          deleteFolderOffline(id);
        }
        return;
      }
      
      // For online operations with logged-in users
      try {
        if (type === 'api') {
          // Delete API
          const response = await fetch(`https://authrator.com/db-api/api/apis/${id}`, {
            method: 'DELETE',
          });
          
          if (response.ok) {
            const updatedCollections = collections.map(folder => ({
              ...folder,
              apis: folder.apis.filter(api => api.id !== id),
              subfolders: (folder.subfolders || []).map(subfolder => ({
                ...subfolder,
                apis: subfolder.apis.filter(api => api.id !== id)
              }))
            }));
            setCollections(updatedCollections);
            
            if (openTabs.some(tab => tab.id === id)) {
              closeTab(id);
            }
          }
        } else if (type === 'subfolder') {
          // Delete Subfolder
          const response = await fetch(`https://authrator.com/db-api/api/subfolders/${id}`, {
            method: 'DELETE',
          });
          
          if (response.ok) {
            const updatedCollections = collections.map(collection => ({
              ...collection,
              subfolders: (collection.subfolders || []).filter(subfolder => subfolder.id !== id)
            }));
            setCollections(updatedCollections);
            
            // Close tabs for APIs that were in this subfolder
            const tabsToClose = openTabs.filter(tab => tab.subfolderId === id);
            tabsToClose.forEach(tab => closeTab(tab.id));
          }
        } else {
          // Delete Collection
          const response = await fetch(`https://authrator.com/db-api/api/collections/${id}`, {
            method: 'DELETE',
          });
          
          if (response.ok) {
            const updatedCollections = collections.filter(folder => folder.id !== id);
            setCollections(updatedCollections);
            
            const tabsToClose = openTabs.filter(tab => tab.folderId === id);
            tabsToClose.forEach(tab => closeTab(tab.id));
          }
        }
      } catch (error) {
        console.error('Error deleting:', error);
      }
    };
    
    const debouncedUpdateApi = useCallback(
      createDebouncedUpdate(async (folderId, apiId, updatedData) => {
        try {
          const response = await fetch(`https://authrator.com/db-api/api/apis/${apiId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedData),
          });
  
          if (!response.ok) {
            throw new Error('Failed to update API');
          }
        } catch (error) {
          console.error('Error updating API:', error);
          // You might want to handle the error state here
          setError('Failed to save changes');
        }
      }),
      [] // Empty dependency array since this function doesn't depend on any props or state
    );
  
      const updateApiState = (folderId, apiId, updatedData) => {
    // Get current API to check for body changes
    const currentApi = getActiveApi();
    
    // Process the updated data to handle Content-Type header management
    let processedData = { ...updatedData };
    
    // If body is being updated, manage Content-Type header automatically
    if (updatedData.body && currentApi) {
      const currentHeaders = currentApi.headers || [];
      const updatedBody = updatedData.body;
      
      // Manage Content-Type header based on body type and content
      const managedHeaders = manageContentTypeHeader(currentHeaders, updatedBody);
      
      // Only update headers if they changed
      if (JSON.stringify(managedHeaders) !== JSON.stringify(currentHeaders)) {
        processedData.headers = managedHeaders;
      }
    }
    
    // Update collections state - handle both direct APIs and subfolder APIs
    const updatedCollections = collections.map((folder) => {
      if (folder.id === folderId) {
        // Update direct APIs in collection
        const updatedDirectApis = folder.apis.map((api) =>
          api.id === apiId ? { ...api, ...processedData } : api
        );
        
        // Update APIs in subfolders
        const updatedSubfolders = (folder.subfolders || []).map(subfolder => ({
          ...subfolder,
          apis: subfolder.apis.map(api => 
            api.id === apiId ? { ...api, ...processedData } : api
          )
        }));
        
        return {
          ...folder,
          apis: updatedDirectApis,
          subfolders: updatedSubfolders
        };
      }
      return folder;
    });
    
    setCollections(updatedCollections);

    // For anonymous users or offline mode, save to localStorage
    if (!isLoggedIn || isElectronOffline()) {
      saveLocalCollections(updatedCollections);
      return;
    }

    // Only call the API for logged-in users
    debouncedUpdateApi(folderId, apiId, processedData);
  };
  
    // Cleanup function to cancel any pending debounced calls
    useEffect(() => {
      return () => {
        debouncedUpdateApi.cancel();
      };
    }, [debouncedUpdateApi]);
    
      const getActiveApi = () => {
        const folder = collections.find(f => f.id === activeFolderId);
        if (!folder) return null;
        
        let api = null;
        
        // If we have an active subfolder, look in that subfolder
        if (activeSubfolderId) {
          const subfolder = folder.subfolders?.find(sf => sf.id === activeSubfolderId);
          api = subfolder?.apis.find(api => api.id === activeApiId);
        } else {
          // Otherwise, look in the direct APIs of the collection
          api = folder.apis.find(api => api.id === activeApiId);
        }
        
        // Only ensure default headers on API creation or when switching between APIs
        // Don't auto-add headers if user has manually removed them in current session
        
        return api;
      };
    
      // Function to process environment variables in strings
      const processEnvironmentVariables = (inputString, env = activeEnvironment) => {
        if (!inputString || typeof inputString !== 'string') return inputString;
        
        console.log("Processing environment variables in:", inputString);
        console.log("Active environment:", env);
        
        return inputString.replace(/\{\{(.+?)\}\}/g, (match, variableName) => {
          const trimmedVar = variableName.trim();
          
          // Debug logs
          console.log(`Trying to replace variable: ${trimmedVar}`);
          
          // Check if variable exists in the active environment first
          if (env?.variables && env.variables[trimmedVar]?.currentValue !== undefined) {
            console.log(`Found in environment: ${env.variables[trimmedVar].currentValue}`);
            return env.variables[trimmedVar].currentValue;
          }
          
          // If not in active environment or no active environment, check global variables
          try {
            const storedData = localStorage.getItem('app_environments');
            if (storedData) {
              const parsedData = JSON.parse(storedData);
              console.log("Global variables:", parsedData.globalVariables);
              if (parsedData.globalVariables && parsedData.globalVariables[trimmedVar]?.currentValue !== undefined) {
                console.log(`Found in global variables: ${parsedData.globalVariables[trimmedVar].currentValue}`);
                return parsedData.globalVariables[trimmedVar].currentValue;
              }
            }
          } catch (error) {
            console.error("Error accessing global variables:", error);
          }
          
          // Return the original match if variable not found
          console.log(`Variable not found: ${trimmedVar}`);
          return match;
        });
      };

      // Function to process object values and replace environment variables
      const processObjectWithEnvVars = (obj, env = activeEnvironment) => {
        if (!obj || typeof obj !== 'object' || !env?.variables) return obj;
        
        if (Array.isArray(obj)) {
          return obj.map(item => processObjectWithEnvVars(item, env));
        }
        
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'string') {
            result[key] = processEnvironmentVariables(value, env);
          } else if (typeof value === 'object' && value !== null) {
            result[key] = processObjectWithEnvVars(value, env);
          } else {
            result[key] = value;
          }
        }
        return result;
      };
    
      const handleSend = async () => {
        const api = getActiveApi();
        // Remove userId check that blocks anonymous users
        if (!api) return;
      
        const startTime = performance.now();
      
        updateApiState(activeFolderId, activeApiId, {
          isLoading: true,
          responseData: null
        });
        
        // Add the URL to recent URLs list
        if (api.url && api.url.trim() !== '') {
          addToRecentUrls(api.url);
        }
        
        try {
          // Process URL with environment variables
          const processedUrl = processEnvironmentVariables(api.url);
          
          // Process headers with environment variables
          const processedHeaders = Array.isArray(api.headers) 
            ? api.headers.map(header => ({
                key: header.key,
                value: processEnvironmentVariables(header.value)
              }))
            : [];
          
          // Properly structure the body based on bodyType and process environment variables
          let processedBody = null;
          if (api.body.type === 'raw') {
            const processedContent = processEnvironmentVariables(
              typeof api.body.content === 'string' 
                ? api.body.content 
                : JSON.stringify(api.body.content)
            );
            
            processedBody = {
              type: 'raw',
              content: processedContent
            };
          } else if (api.body.type === 'formData') {
            processedBody = {
              type: 'formData',
              formData: Array.isArray(api.body.formData) 
                ? api.body.formData.map(item => ({
                    key: item.key,
                    value: processEnvironmentVariables(item.value),
                    type: item.type
                  }))
                : []
            };
          } else if (api.body.type === 'urlencoded') {
            processedBody = {
              type: 'urlencoded',
              urlencoded: Array.isArray(api.body.urlencoded)
                ? api.body.urlencoded.map(item => ({
                    key: item.key,
                    value: processEnvironmentVariables(item.value)
                  }))
                : []
            };
          }

          // Process query parameters with environment variables
          const processedQueryParams = Array.isArray(api.queryParams)
            ? api.queryParams.map(param => ({
                key: param.key,
                value: processEnvironmentVariables(param.value)
              }))
            : [];
            
          // Continue with the existing code but use processed values
          const proxyRequest = {
            method: api.method,
            url: processedUrl,
            headers: processedHeaders,
            bodyType: api.body.type,
            body: processedBody,
            settings: {
              followRedirects: api.settings?.followRedirects ?? true,
              timeout: api.settings?.timeout ?? 0,
              sslVerification: api.settings?.sslVerification ?? true,
              responseSizeLimit: api.settings?.responseSizeLimit ?? 50,
              proxy: api.settings?.enableProxy ? {
                url: processEnvironmentVariables(api.settings.proxyUrl),
                auth: api.settings.proxyAuth ? {
                  username: processEnvironmentVariables(api.settings.proxyUsername),
                  password: processEnvironmentVariables(api.settings.proxyPassword)
                } : null
              } : null
            }
          };
      
          // Add authentication headers if needed
          if (api.auth.type === 'config-jwt' && api.auth.jwt?.key && api.auth.jwt?.value) {
            proxyRequest.headers.push({
              key: api.auth.jwt.key,
              value: api.auth.jwt.value
            });
          } else if (api.auth.type === 'avq-jwt' && api.auth.avqJwt?.value) {
            proxyRequest.headers.push({
              key: 'Authorization',
              value: api.auth.avqJwt.value
            });
          }

          // Only add default headers if they exist in the current API headers
          // This respects manual deletion by users during the session
          const currentApiHeaderKeys = api.headers.map(h => h.key.toLowerCase());
          const proxyHeaderKeys = proxyRequest.headers.map(h => h.key.toLowerCase());
          
          // Add default headers only if they're present in the API's current headers
          // (meaning user hasn't manually deleted them)
          const enabledDefaults = getEnabledDefaultHeaders(api.settings);
          enabledDefaults.forEach(defaultHeader => {
            const headerKeyLower = defaultHeader.key.toLowerCase();
            if (currentApiHeaderKeys.includes(headerKeyLower) && !proxyHeaderKeys.includes(headerKeyLower)) {
              proxyRequest.headers.push(defaultHeader);
            }
          });
      
          // Check if we're in Electron offline mode but targeting a local address
          const isLocalRequest = isLocalAddress(api.url);
          const isOfflineMode = isElectronOffline();
          // Decide if we should bypass the cloud proxy:
          // 1. When we are offline inside Electron (no internet reachability) we *always* hit the
          //    destination URL directly – the cloud proxy cannot be reached anyway.
          // 2. When we are online we still allow direct calls for hosts that we recognise as local.
          const shouldUseDirectRequest = isElectronOffline() ||
                                         (isElectron() && isLocalRequest);
          
          // Determine the appropriate endpoint based on online status and URL
          let endpoint = 'https://authrator.com/api/api/proxy';
          let requestOptions = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(proxyRequest)
          };
          
          // If we're offline but targeting a local address, make the request directly instead of through proxy
          if (shouldUseDirectRequest) {
            endpoint = api.url;
            
            // Merge the processed headers with default headers for direct requests
            const directHeaders = Object.fromEntries(proxyRequest.headers.map(h => [h.key, h.value]));
            
            requestOptions = {
              method: api.method,
              headers: directHeaders,
              // Only add body for methods that support it
              ...((['POST', 'PUT', 'PATCH'].includes(api.method)) && {
                body: getRequestBody(api.body)
              })
            };
          }
      
          try {
            // Wrap the fetch in a try-catch to handle network errors
            let response;
            try {
              response = await fetch(endpoint, requestOptions);
            } catch (directFetchError) {
              // If the direct fetch fails with an obscure error, throw a clearer one
              throw new Error(`Network request failed: ${directFetchError.message}`);
            }
      
            const endTime = performance.now();
            
            // Check if status code indicates error (4xx or 5xx)
            const isErrorStatus = response.status >= 400;
            
            // Safely get response text
            let responseText;
            try {
              responseText = await response.text();
            } catch (textError) {
              responseText = `[Could not read response text: ${textError.message}]`;
            }
            
            let responseData;
            
            try {
              responseData = JSON.parse(responseText);
            } catch (parseError) {
              // If not JSON, just use the raw text
              responseData = responseText;
            }
            
            // Handle HTTP error status codes (4xx, 5xx) explicitly
            if (isErrorStatus) {
              let errorMessage = `Server returned error ${response.status}`;
              if (response.status === 405) {
                errorMessage = `Method Not Allowed: The endpoint doesn't support ${api.method} requests`;
              } else if (response.status === 500) {
                errorMessage = `Server Error (500): The server encountered an error processing your request`;
              } else if (response.status === 404) {
                errorMessage = `Not Found (404): The requested resource doesn't exist`;
              } else if (response.status === 401) {
                errorMessage = `Unauthorized (401): Authentication is required or invalid`;
              } else if (response.status === 403) {
                errorMessage = `Forbidden (403): You don't have permission to access this resource`;
              }
              
              // Create an error-like object that we'll catch in the outer catch block
              const errorDetails = {
                responseStatus: response.status,
                responseData: responseData
              };
              
              const httpError = new Error(errorMessage);
              httpError.status = response.status;
              httpError.details = errorDetails;
              httpError.isHttpError = true;
              
              throw httpError;
            }
      
            // Comprehensive request history object
            const requestMetrics = {
              userId: localStorage.getItem('userId') || 'anonymous',
              method: api.method,
              url: api.url,
              timestamp: new Date().toISOString(),
              responseTime: Math.round(endTime - startTime),
              status: response.status,
              responseSize: new TextEncoder().encode(responseText).length,
              success: response.status >= 200 && response.status < 300,
              apiName: api.name || 'Unnamed API',
              folderName: collections.find(f => f.id === activeFolderId)?.name || 'Unnamed Folder',
              requestDetails: {
                headers: api.headers,
                queryParams: api.queryParams,
                body: {
                  type: api.body.type,
                  content: api.body.content,
                  formData: api.body.formData,
                  urlencoded: api.body.urlencoded
                },
                auth: api.auth
              },
              responseDetails: {
                headers: Array.from(response.headers.entries()).map(([key, value]) => ({ key, value })),
                body: responseData,
                cookies: response.headers.get('set-cookie')?.split(',').map(cookie => {
                  const [name, ...parts] = cookie.split(';');
                  const [, value] = name.split('=');
                  return { name, value, raw: cookie };
                }) || []
              },
              settings: api.settings,
              scripts: {
                preRequest: api.scripts?.preRequest,
                tests: api.scripts?.tests,
                testResults: []
              },
              environmentVariables: [],
              isOfflineMode: isOfflineMode,
              isLocalRequest: isLocalRequest
            };
      
            if (!response.ok) {
              requestMetrics.errorContext = {
                type: response.status >= 500 ? 'Server Error' : 'Client Error',
                message: responseData?.message || 'Unknown error occurred',
                details: responseData
              };
            }
      
            if (isElectronOffline() || !isLoggedIn) {
              // Save request history for offline or anonymous users
              saveRequestHistoryOffline(requestMetrics);
            } else {
              // Save request history to server (for logged-in users)
              try {
                await fetch('https://authrator.com/db-api/api/request-history', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(requestMetrics)
                });
              } catch (historyError) {
                console.error('Failed to save request history:', historyError);
              }
            }
            
            updateApiState(activeFolderId, activeApiId, {
              isLoading: false,
              activeResponseTab: 'response-body',
              responseData: {
                
                ...(shouldUseDirectRequest 
                  ? { data: responseData } 
                  : responseData),        
                status: response.status,
                status: response.status,
                responseTime: requestMetrics.responseTime,
                size: requestMetrics.responseSize,
                headers: Object.fromEntries(response.headers)
              },
              requestHistory: [...(api.requestHistory || []), requestMetrics],
              lastRequest: {
                timestamp: requestMetrics.timestamp,
                success: requestMetrics.success,
                method: api.method,
                url: api.url
              }
            });          
      
          } catch (networkError) {
            const endTime = performance.now();
            console.error("Network or HTTP error details:", networkError.message, api.url);
            
            // Special handling for localhost URLs in Electron when getting connection refused
            let errorMessage = networkError.message;
            let errorDetails = {};
            
            // Check if this is an HTTP error with status code
            if (networkError.isHttpError && networkError.status) {
              // This is an HTTP error that we handled above
              errorMessage = networkError.message;
              
              // Create more specific guidance based on the status code
              if (networkError.status === 500) {
                errorDetails = {
                  suggestion: "The server encountered an internal error. Check the server logs for details.",
                  possibleIssues: [
                    "Incorrect request payload format",
                    "Missing required fields in request body",
                    "Server-side implementation error",
                    "Database or dependency failure"
                  ],
                  serverResponse: networkError.details?.responseData
                };
              } else if (networkError.status === 405) {
                errorDetails = {
                  suggestion: `Change the request method to one supported by this endpoint. You sent: ${api.method}`,
                  possibleIssues: [
                    `The endpoint doesn't support ${api.method} requests`,
                    "API documentation may have incorrect method information",
                    "Check endpoint requirements in your API documentation"
                  ],
                  serverResponse: networkError.details?.responseData
                };
              } else if (networkError.status === 401 || networkError.status === 403) {
                errorDetails = {
                  suggestion: "Check your authentication credentials or access permissions",
                  possibleIssues: [
                    "Missing or invalid authentication token",
                    "Token expired or malformed",
                    "Insufficient permissions for this request",
                    "Required headers missing"
                  ],
                  serverResponse: networkError.details?.responseData
                };
              } else {
                // Generic HTTP error
                errorDetails = {
                  suggestion: `The server returned a ${networkError.status} status code`,
                  serverResponse: networkError.details?.responseData
                };
              }
            } 
            // Standard network error handling
            else if (isElectron() && isLocalRequest) {
              if (networkError.message.includes('Failed to fetch') || 
                  networkError.message.includes('refused') ||
                  networkError.message.includes('ECONNREFUSED')) {
                errorMessage = `Connection to local server failed. Please make sure your server at ${api.url} is running properly.`;
                errorDetails = {
                  suggestion: "Check that your server is running and listening on the correct port",
                  possibleIssues: [
                    "Server is not running",
                    "Port is different from what you specified",
                    "Firewall is blocking connections",
                    "Server is not accepting connections from localhost"
                  ]
                };
              } else if (networkError.message.includes('certificate') || 
                         networkError.message.includes('SSL') ||
                         networkError.message.includes('CERT_') ||
                         networkError.message.includes('TLS') ||
                         networkError.message.includes('DEPTH_ZERO_SELF_SIGNED') ||
                         networkError.message.includes('UNABLE_TO_VERIFY_LEAF_SIGNATURE')) {
                errorMessage = `SSL/TLS certificate verification failed for ${api.url}. This usually happens with self-signed or untrusted certificates.`;
                errorDetails = {
                  suggestion: "You can disable SSL certificate verification for this request",
                  possibleIssues: [
                    "Self-signed certificate",
                    "Untrusted certificate authority",
                    "Certificate expired or invalid",
                    "Hostname mismatch in certificate"
                  ],
                  sslError: true,
                  canDisableSSL: api.settings?.sslVerification !== false
                };
              }
            }
            
            const errorMetrics = {
              userId: localStorage.getItem('userId') || 'anonymous',
              method: api.method,
              url: api.url,
              timestamp: new Date().toISOString(),
              responseTime: Math.round(endTime - startTime),
              status: 0,
              responseSize: 0,
              success: false,
              apiName: api.name || 'Unnamed API',
              folderName: collections.find(f => f.id === activeFolderId)?.name || 'Unnamed Folder',
              requestDetails: {
                headers: api.headers,
                body: api.body,
                queryParams: api.queryParams,
                auth: api.auth
              },
              errorContext: {
                type: 'Network Error',
                message: errorMessage,
                details: errorDetails || networkError,
                originalError: networkError.message
              },
              isOfflineMode: isOfflineMode,
              isLocalRequest: isLocalRequest
            };
      
            if (isElectronOffline() || !isLoggedIn) {
              saveRequestHistoryOffline(errorMetrics);
            } else {
              try {
                await fetch('https://authrator.com/db-api/api/request-history', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(errorMetrics)
                });
              } catch (historyError) {
                console.error('Failed to save error history:', historyError);
              }
            }
            
            // Update local state (same for both)
            updateApiState(activeFolderId, activeApiId, {
              isLoading: false,
              activeResponseTab: 'response-body',
              responseData: {
                error: errorMessage,
                errorDetails: errorDetails,
                status: 0,
                responseTime: Math.round(endTime - startTime),
                size: 0
              },
              lastRequest: {
                timestamp: errorMetrics.timestamp,
                success: false,
                method: api.method,
                url: api.url
              }
            });
          }
        } catch (unexpectedError) {
          console.error('Unexpected error in handleSend:', unexpectedError);
          
          // Better error handling to prevent white screen crashes
          try {
            // Create a safe error object that won't cause rendering issues
            const safeError = {
              message: unexpectedError?.message || 'Unknown error occurred',
              stack: unexpectedError?.stack,
              name: unexpectedError?.name
            };
            
            // Update state with safe error object
            updateApiState(activeFolderId, activeApiId, {
              isLoading: false,
              responseData: {
                error: 'An unexpected error occurred in the request',
                errorDetails: {
                  suggestion: 'Please check the console for more details or try again',
                  technicalDetails: safeError.message
                },
                status: 500,
                responseTime: 0,
                size: 0
              }
            });
          } catch (stateUpdateError) {
            // Last resort error handling if even the state update fails
            console.error('Failed to update error state:', stateUpdateError);
            // Try minimal state update
            try {
              updateApiState(activeFolderId, activeApiId, {
                isLoading: false
              });
            } catch (e) {
              // Nothing more we can do
            }
          }
        }
      };
      
      // Helper function to check if a URL is a local address
      const isLocalAddress = (url) => {
        if (!url) return false;
        
        try {
          // Handle URLs without protocol
          let parsedUrl;
          try {
            parsedUrl = new URL(url);
          } catch (e) {
            // If URL parsing fails, try adding http:// prefix
            try {
              parsedUrl = new URL(`http://${url}`);
            } catch (innerError) {
              console.error('Error parsing URL even with http:// prefix:', innerError);
              return false;
            }
          }
          
          const hostname = parsedUrl.hostname;
          
          // Check if it's a local address
          return hostname === 'localhost' ||
                 hostname === '203.161.50.28' || 
                 hostname === '127.0.0.1' ||
                 hostname.startsWith('192.168.') ||
                 hostname.startsWith('10.') ||
                 hostname.endsWith('.local') ||
                 hostname.endsWith('.203.161.50.28') ||
                 /^localhost:\d+$/.test(url) || // Handle "localhost:3000" format
                 /^127\.0\.0\.1:\d+$/.test(url); // Handle "127.0.0.1:3000" format
        } catch (error) {
          console.error('Unexpected error parsing URL:', error);
          return false;
        }
      };
      
      // Helper function to get the request body in the appropriate format
      const getRequestBody = (bodyConfig) => {
        if (!bodyConfig) return undefined;
        
        if (bodyConfig.type === 'raw') {
          // For direct local requests, try to parse JSON if applicable
          try {
            // Try to parse as JSON first to see if it's valid JSON
            const jsonParsed = JSON.parse(bodyConfig.content);
            // If we got here, it's valid JSON, so we can return the string for fetch API
            return bodyConfig.content;
          } catch (e) {
            // Not valid JSON, just return as is
            return bodyConfig.content;
          }
        } else if (bodyConfig.type === 'formData') {
          const formData = new FormData();
          if (Array.isArray(bodyConfig.formData)) {
            bodyConfig.formData.forEach(item => {
              if (item.enabled !== false) {
                formData.append(item.key, item.value);
              }
            });
          }
          return formData;
        } else if (bodyConfig.type === 'urlencoded') {
          const params = new URLSearchParams();
          if (Array.isArray(bodyConfig.urlencoded)) {
            bodyConfig.urlencoded.forEach(item => {
              if (item.enabled !== false) {
                params.append(item.key, item.value);
              }
            });
          }
          return params;
        }
        
        return undefined;
      };

const getStatusText = (status) => {
  const statusMap = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout'
  };
  return statusMap[status] || 'Unknown Status';
};

const getStatusColor = (status) => {
  if (status >= 200 && status < 300) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
  if (status >= 400 && status < 500) return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
  if (status >= 500) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  return 'bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-gray-200';
};

const JsonHighlighter = ({ data }) => {
  const [hoveredBrace, setHoveredBrace] = useState(null);
  const [selectedBrace, setSelectedBrace] = useState(null);
  const [braceMap, setBraceMap] = useState({});

  useEffect(() => {
    const stack = [];
    const map = {};
    const jsonString = JSON.stringify(data, null, 2);
    
    for (let i = 0; i < jsonString.length; i++) {
      if (jsonString[i] === '{' || jsonString[i] === '[') {
        stack.push({ char: jsonString[i], index: i });
      } else if (jsonString[i] === '}' || jsonString[i] === ']') {
        const opening = stack.pop();
        if (opening) {
          map[opening.index] = i;
          map[i] = opening.index;
        }
      }
    }
    setBraceMap(map);
  }, [data]);

  const handleBraceHover = (index) => {
    setHoveredBrace(index);
  };

  const handleBraceClick = (index) => {
    setSelectedBrace(selectedBrace === index ? null : index);
  };

  const isBraceHighlighted = (index) => {
    return hoveredBrace === index || selectedBrace === index || 
           (hoveredBrace !== null && braceMap[hoveredBrace] === index) ||
           (selectedBrace !== null && braceMap[selectedBrace] === index);
  };

  const renderJsonString = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const result = [];
    let currentIndex = 0;
    let inString = false;
    let stringStart = 0;
    let isKey = false;

    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString[i];
      
      if (char === '"' && jsonString[i - 1] !== '\\') {
        if (!inString) {
          // Check if this string is a key by looking ahead for a colon
          let j = i + 1;
          while (j < jsonString.length && jsonString[j] !== '"' && jsonString[j - 1] !== '\\') j++;
          // Look for colon after the closing quote
          j++;
          while (j < jsonString.length && /\s/.test(jsonString[j])) j++;
          isKey = j < jsonString.length && jsonString[j] === ':';
          
          stringStart = i;
          inString = true;
        } else {
          inString = false;
          result.push(
            <span key={`string-${i}`} className={isKey 
              ? "text-purple-600 dark:text-purple-400" // Key color
              : "text-teal-500 dark:text-teal-400"     // Value color
            }>
              {jsonString.slice(stringStart, i + 1)}
            </span>
          );
          currentIndex = i + 1;
        }
        continue;
      }

      if (inString) continue;

      if (char === '{' || char === '}' || char === '[' || char === ']') {
        if (i > currentIndex) {
          result.push(
            <span key={`text-${i}`} className="text-gray-900 dark:text-gray-100">
              {jsonString.slice(currentIndex, i)}
            </span>
          );
        }
        
        const isHighlighted = isBraceHighlighted(i);
        result.push(
          <span
            key={`brace-${i}`}
            className={`cursor-pointer ${
              isHighlighted 
                ? 'bg-purple-100 dark:bg-zinc-900 text-purple-600 dark:text-purple-400' 
                : 'text-gray-900 dark:text-gray-100'
            }`}
            onMouseEnter={() => handleBraceHover(i)}
            onMouseLeave={() => setHoveredBrace(null)}
            onClick={() => handleBraceClick(i)}
          >
            {char}
          </span>
        );
        currentIndex = i + 1;
        continue;
      }

      if (char === ':') {
        if (i > currentIndex) {
          result.push(
            <span key={`text-${i}`} className="text-gray-900 dark:text-gray-100">
              {jsonString.slice(currentIndex, i)}
            </span>
          );
        }
        result.push(
          <span key={`colon-${i}`} className="text-gray-900 dark:text-gray-100">
            {char}
          </span>
        );
        currentIndex = i + 1;
        continue;
      }

      if (char === ',' || char === '\n') {
        if (i > currentIndex) {
          result.push(
            <span key={`text-${i}`} className="text-gray-900 dark:text-gray-100">
              {jsonString.slice(currentIndex, i)}
            </span>
          );
        }
        result.push(
          <span key={`separator-${i}`} className="text-gray-900 dark:text-gray-100">
            {char}
          </span>
        );
        currentIndex = i + 1;
        continue;
      }

      if (char === ' ' || char === '\t') {
        if (i > currentIndex) {
          result.push(
            <span key={`text-${i}`} className="text-gray-900 dark:text-gray-100">
              {jsonString.slice(currentIndex, i)}
            </span>
          );
        }
        result.push(
          <span key={`whitespace-${i}`} className="text-gray-900 dark:text-gray-100">
            {char}
          </span>
        );
        currentIndex = i + 1;
        continue;
      }

      if (char === 't' && jsonString.slice(i, i + 4) === 'true') {
        if (i > currentIndex) {
          result.push(
            <span key={`text-${i}`} className="text-gray-900 dark:text-gray-100">
              {jsonString.slice(currentIndex, i)}
            </span>
          );
        }
        result.push(
          <span key={`boolean-${i}`} className="text-orange-500 dark:text-orange-400">
            {jsonString.slice(i, i + 4)}
          </span>
        );
        currentIndex = i + 4;
        continue;
      }

      if (char === 'f' && jsonString.slice(i, i + 5) === 'false') {
        if (i > currentIndex) {
          result.push(
            <span key={`text-${i}`} className="text-gray-900 dark:text-gray-100">
              {jsonString.slice(currentIndex, i)}
            </span>
          );
        }
        result.push(
          <span key={`boolean-${i}`} className="text-orange-500 dark:text-orange-400">
            {jsonString.slice(i, i + 5)}
          </span>
        );
        currentIndex = i + 5;
        continue;
      }

      if (char === 'n' && jsonString.slice(i, i + 4) === 'null') {
        if (i > currentIndex) {
          result.push(
            <span key={`text-${i}`} className="text-gray-900 dark:text-gray-100">
              {jsonString.slice(currentIndex, i)}
            </span>
          );
        }
        result.push(
          <span key={`null-${i}`} className="text-gray-500 dark:text-zinc-400">
            {jsonString.slice(i, i + 4)}
          </span>
        );
        currentIndex = i + 4;
        continue;
      }

      if (/[0-9]/.test(char)) {
        if (i > currentIndex) {
          result.push(
            <span key={`text-${i}`} className="text-gray-900 dark:text-gray-100">
              {jsonString.slice(currentIndex, i)}
            </span>
          );
        }
        let numberEnd = i + 1;
        while (numberEnd < jsonString.length && /[0-9.]/.test(jsonString[numberEnd])) {
          numberEnd++;
        }
        result.push(
          <span key={`number-${i}`} className="text-indigo-500 dark:text-indigo-400">
            {jsonString.slice(i, numberEnd)}
          </span>
        );
        currentIndex = numberEnd;
        continue;
      }
    }

    if (currentIndex < jsonString.length) {
      result.push(
        <span key="remaining" className="text-gray-900 dark:text-gray-100">
          {jsonString.slice(currentIndex)}
        </span>
      );
    }

    return result;
  };

  return (
    <div className="font-mono text-sm whitespace-pre-wrap">
      {renderJsonString()}
    </div>
  );
};

const PrettyJson = ({ data }) => {
  const [hoveredBrace, setHoveredBrace] = useState(null);
  const [selectedBrace, setSelectedBrace] = useState(null);
  const [braceMap, setBraceMap] = useState({});

  useEffect(() => {
    const stack = [];
    const map = {};
    const jsonString = JSON.stringify(data, null, 2);
    
    for (let i = 0; i < jsonString.length; i++) {
      if (jsonString[i] === '{' || jsonString[i] === '[') {
        stack.push({ char: jsonString[i], index: i });
      } else if (jsonString[i] === '}' || jsonString[i] === ']') {
        const opening = stack.pop();
        if (opening) {
          map[opening.index] = i;
          map[i] = opening.index;
        }
      }
    }
    setBraceMap(map);
  }, [data]);

  const handleBraceHover = (index) => {
    setHoveredBrace(index);
  };

  const handleBraceClick = (index) => {
    setSelectedBrace(selectedBrace === index ? null : index);
  };

  const isBraceHighlighted = (index) => {
    return hoveredBrace === index || selectedBrace === index || 
           (hoveredBrace !== null && braceMap[hoveredBrace] === index) ||
           (selectedBrace !== null && braceMap[selectedBrace] === index);
  };

  const renderJsonString = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const result = [];
    let currentIndex = 0;
    let inString = false;
    let stringStart = 0;
    let isKey = false;

    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString[i];
      
      if (char === '"' && jsonString[i - 1] !== '\\') {
        if (!inString) {
          // Check if this string is a key by looking ahead for a colon
          let j = i + 1;
          while (j < jsonString.length && jsonString[j] !== '"' && jsonString[j - 1] !== '\\') j++;
          // Look for colon after the closing quote
          j++;
          while (j < jsonString.length && /\s/.test(jsonString[j])) j++;
          isKey = j < jsonString.length && jsonString[j] === ':';
          
          stringStart = i;
          inString = true;
        } else {
          inString = false;
          result.push(
            <span key={`string-${i}`} className={isKey 
              ? "text-purple-600 dark:text-purple-400" // Key color
              : "text-teal-500 dark:text-teal-400"     // Value color
            }>
              {jsonString.slice(stringStart, i + 1)}
            </span>
          );
          currentIndex = i + 1;
        }
        continue;
      }

      if (inString) continue;

      if (char === '{' || char === '}' || char === '[' || char === ']') {
        if (i > currentIndex) {
          result.push(
            <span key={`text-${i}`} className="text-gray-900 dark:text-gray-100">
              {jsonString.slice(currentIndex, i)}
            </span>
          );
        }
        
        const isHighlighted = isBraceHighlighted(i);
        result.push(
          <span
            key={`brace-${i}`}
            className={`cursor-pointer ${
              isHighlighted 
                ? 'bg-purple-100 dark:bg-zinc-900 text-purple-600 dark:text-purple-400' 
                : 'text-gray-900 dark:text-gray-100'
            }`}
            onMouseEnter={() => handleBraceHover(i)}
            onMouseLeave={() => setHoveredBrace(null)}
            onClick={() => handleBraceClick(i)}
          >
            {char}
          </span>
        );
        currentIndex = i + 1;
        continue;
      }

      if (char === ':') {
        if (i > currentIndex) {
          result.push(
            <span key={`text-${i}`} className="text-gray-900 dark:text-gray-100">
              {jsonString.slice(currentIndex, i)}
            </span>
          );
        }
        result.push(
          <span key={`colon-${i}`} className="text-gray-900 dark:text-gray-100">
            {char}
          </span>
        );
        currentIndex = i + 1;
        continue;
      }

      if (char === ',' || char === '\n') {
        if (i > currentIndex) {
          result.push(
            <span key={`text-${i}`} className="text-gray-900 dark:text-gray-100">
              {jsonString.slice(currentIndex, i)}
            </span>
          );
        }
        result.push(
          <span key={`separator-${i}`} className="text-gray-900 dark:text-gray-100">
            {char}
          </span>
        );
        currentIndex = i + 1;
        continue;
      }

      if (char === ' ' || char === '\t') {
        if (i > currentIndex) {
          result.push(
            <span key={`text-${i}`} className="text-gray-900 dark:text-gray-100">
              {jsonString.slice(currentIndex, i)}
            </span>
          );
        }
        result.push(
          <span key={`whitespace-${i}`} className="text-gray-900 dark:text-gray-100">
            {char}
          </span>
        );
        currentIndex = i + 1;
        continue;
      }

      if (char === 't' && jsonString.slice(i, i + 4) === 'true') {
        if (i > currentIndex) {
          result.push(
            <span key={`text-${i}`} className="text-gray-900 dark:text-gray-100">
              {jsonString.slice(currentIndex, i)}
            </span>
          );
        }
        result.push(
          <span key={`boolean-${i}`} className="text-orange-500 dark:text-orange-400">
            {jsonString.slice(i, i + 4)}
          </span>
        );
        currentIndex = i + 4;
        continue;
      }

      if (char === 'f' && jsonString.slice(i, i + 5) === 'false') {
        if (i > currentIndex) {
          result.push(
            <span key={`text-${i}`} className="text-gray-900 dark:text-gray-100">
              {jsonString.slice(currentIndex, i)}
            </span>
          );
        }
        result.push(
          <span key={`boolean-${i}`} className="text-orange-500 dark:text-orange-400">
            {jsonString.slice(i, i + 5)}
          </span>
        );
        currentIndex = i + 5;
        continue;
      }

      if (char === 'n' && jsonString.slice(i, i + 4) === 'null') {
        if (i > currentIndex) {
          result.push(
            <span key={`text-${i}`} className="text-gray-900 dark:text-gray-100">
              {jsonString.slice(currentIndex, i)}
            </span>
          );
        }
        result.push(
          <span key={`null-${i}`} className="text-gray-500 dark:text-zinc-400">
            {jsonString.slice(i, i + 4)}
          </span>
        );
        currentIndex = i + 4;
        continue;
      }

      if (/[0-9]/.test(char)) {
        if (i > currentIndex) {
          result.push(
            <span key={`text-${i}`} className="text-gray-900 dark:text-gray-100">
              {jsonString.slice(currentIndex, i)}
            </span>
          );
        }
        let numberEnd = i + 1;
        while (numberEnd < jsonString.length && /[0-9.]/.test(jsonString[numberEnd])) {
          numberEnd++;
        }
        result.push(
          <span key={`number-${i}`} className="text-indigo-500 dark:text-indigo-400">
            {jsonString.slice(i, numberEnd)}
          </span>
        );
        currentIndex = numberEnd;
        continue;
      }
    }

    if (currentIndex < jsonString.length) {
      result.push(
        <span key="remaining" className="text-gray-900 dark:text-gray-100">
          {jsonString.slice(currentIndex)}
        </span>
      );
    }

    return result;
  };

  return (
    <div className="font-mono text-sm whitespace-pre-wrap">
      {renderJsonString()}
    </div>
  );
};

const PlainTextView = ({ data }) => {
  // Convert data to a string if it's not already
  const textContent = typeof data === 'string' 
    ? data 
    : JSON.stringify(data, null, 2);
    
  return (
    <pre className="font-mono text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
      {textContent}
    </pre>
  );
};

const RawView = ({ data }) => {
  const renderValue = (value) => {
    if (typeof value === 'boolean') {
      return <span className="text-orange-500 dark:text-orange-400">{String(value)}</span>;
    }
    if (typeof value === 'number') {
      return <span className="text-indigo-500 dark:text-indigo-400">{value}</span>;
    }
    if (typeof value === 'string') {
      if (value.match(/^\d{4}-\d{2}-\d{2}T/)) {
        return <span className="text-green-500 dark:text-green-400">"{value}"</span>;
      }
      return <span className="text-teal-500 dark:text-teal-400">"{value}"</span>;
    }
    if (value === null) {
      return <span className="text-gray-500 dark:text-gray-400">null</span>;
    }
    return value;
  };

  const renderRawJson = (obj) => {
    if (Array.isArray(obj)) {
      return (
        <>
          [
          {obj.map((item, index) => (
            <React.Fragment key={index}>
              {renderRawJson(item)}
              {index < obj.length - 1 ? ',' : ''}
            </React.Fragment>
          ))}
          ]
        </>
      );
    }
    
    if (typeof obj === 'object' && obj !== null) {
      return (
        <>
          {'{'}
          {Object.entries(obj).map(([key, value], index, arr) => (
            <React.Fragment key={key}>
              <span className="text-purple-600 dark:text-purple-400">"{key}"</span>
              :
              {renderRawJson(value)}
              {index < arr.length - 1 ? ',' : ''}
            </React.Fragment>
          ))}
          {'}'}
        </>
      );
    }
    
    return renderValue(obj);
  };

  return (
    <pre className="font-sans font-semibold text-sm">
      {renderRawJson(data)}
    </pre>
  );
};
const XMLView = ({ data }) => {
  const formatXML = (xml) => {
    let formatted = '';
    let indent = 0;
    
    const getIndent = (level) => '  '.repeat(level);
    
    // If the data is already a string, try to use it directly
    if (typeof xml === 'string') {
      try {
        // If it's a valid XML string, return it as is
        return xml;
      } catch (e) {
        // If not valid XML, continue with the formatting
      }
    }
    
    formatted += '<?xml version="1.0" encoding="UTF-8"?>\n';
    
    // Start the root element
    formatted += `${getIndent(indent)}<response>\n`;
    indent++;
    
    // Add headers if available
    if (xml.headers) {
      formatted += `${getIndent(indent)}<headers>\n`;
      indent++;
      
      Object.entries(xml.headers).forEach(([key, value]) => {
        formatted += `${getIndent(indent)}<${key}>${value}</${key}>\n`;
      });
      
      indent--;
      formatted += `${getIndent(indent)}</headers>\n`;
    }
    
    // Add body content
    formatted += `${getIndent(indent)}<body>\n`;
    indent++;
    
    // Handle different data types in the body
    if (typeof xml === 'object') {
      // Convert object to XML elements
      const processObject = (obj, currentIndent) => {
        let result = '';
        
        // Handle arrays
        if (Array.isArray(obj)) {
          obj.forEach((item, index) => {
            result += `${getIndent(currentIndent)}<item index="${index}">\n`;
            if (typeof item === 'object' && item !== null) {
              result += processObject(item, currentIndent + 1);
            } else {
              result += `${getIndent(currentIndent + 1)}<value>${item}</value>\n`;
            }
            result += `${getIndent(currentIndent)}</item>\n`;
          });
          return result;
        }
        
        // Handle regular objects
        for (const [key, value] of Object.entries(obj)) {
          if (value === null || value === undefined) {
            result += `${getIndent(currentIndent)}<${key}/>\n`;
          } else if (Array.isArray(value)) {
            result += `${getIndent(currentIndent)}<${key}>\n`;
            value.forEach((item, index) => {
              result += `${getIndent(currentIndent + 1)}<item index="${index}">\n`;
              if (typeof item === 'object' && item !== null) {
                result += processObject(item, currentIndent + 2);
              } else {
                result += `${getIndent(currentIndent + 2)}<value>${item}</value>\n`;
              }
              result += `${getIndent(currentIndent + 1)}</item>\n`;
            });
            result += `${getIndent(currentIndent)}</${key}>\n`;
          } else if (typeof value === 'object') {
            result += `${getIndent(currentIndent)}<${key}>\n`;
            result += processObject(value, currentIndent + 1);
            result += `${getIndent(currentIndent)}</${key}>\n`;
          } else {
            result += `${getIndent(currentIndent)}<${key}>${value}</${key}>\n`;
          }
        }
        
        return result;
      };
      
      formatted += processObject(xml, indent);
    } else if (xml !== undefined) {
      // Handle primitive data types
      formatted += `${getIndent(indent)}<content>${xml}</content>\n`;
    }
    
    indent--;
    formatted += `${getIndent(indent)}</body>\n`;
    
    // Add additional metadata if available
    if (xml && xml.status !== undefined) {
      formatted += `${getIndent(indent)}<status>${xml.status}</status>\n`;
    }
    
    if (xml && xml.path) {
      formatted += `${getIndent(indent)}<path>${xml.path}</path>\n`;
    }
    
    if (xml && xml.isBase64Encoded !== undefined) {
      formatted += `${getIndent(indent)}<isBase64Encoded>${xml.isBase64Encoded}</isBase64Encoded>\n`;
    }
    
    indent--;
    formatted += `${getIndent(indent)}</response>`;
    
    return formatted;
  };

  const renderFormattedXML = (xmlString) => {
    return xmlString.split('\n').map((line, index) => {
      const indent = line.match(/^\s*/)[0].length;
      const lineContent = line.trim();
      
      const colorize = (content) => {
        if (content.startsWith('<?xml')) {
          return (
            <span className="text-gray-500 dark:text-gray-400">{content}</span>
          );
        }
        
        const tagMatch = content.match(/^<\/?([^>]+)>/);
        if (tagMatch) {
          const isClosingTag = content.startsWith('</');
          const isSelfClosingTag = content.endsWith('/>');
          const tagName = tagMatch[1];
          const value = content.slice(tagMatch[0].length, isSelfClosingTag ? -2 : -tagName.length - 3);
          
          return (
            <span>
              <span className="text-purple-600 dark:text-purple-400">{isClosingTag ? '</' : '<'}</span>
              <span className="text-purple-600 dark:text-purple-400">{tagName}</span>
              <span className="text-purple-600 dark:text-purple-400">{isSelfClosingTag ? '/>' : '>'}</span>
              {value && <span className="text-gray-700 dark:text-gray-300">{value}</span>}
              {!isSelfClosingTag && value && (
                <>
                  <span className="text-purple-600 dark:text-purple-400">{'</'}</span>
                  <span className="text-purple-600 dark:text-purple-400">{tagName}</span>
                  <span className="text-purple-600 dark:text-purple-400">{'>'}</span>
                </>
              )}
            </span>
          );
        }
        
        return <span className="text-gray-700 dark:text-gray-300">{content}</span>;
      };

      return (
        <div 
          key={index} 
          className="font-sans font-semibold text-sm leading-6 whitespace-pre"
          style={{ paddingLeft: `${indent}ch` }}
        >
          {colorize(lineContent)}
        </div>
      );
    });
  };

  const xmlString = formatXML(data);
  
  return (
    <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg overflow-x-auto">
      {renderFormattedXML(xmlString)}
    </div>
  );
};
const ResponsePanel = ({ api }) => {
  const [height, setHeight] = useState(() => {
    // Initialize height from localStorage or use default value
    const savedHeight = localStorage.getItem('responsePanelHeight');
    return savedHeight ? parseInt(savedHeight, 10) : 300;
  });
  const [isDragging, setIsDragging] = useState(false);
  const [viewFormat, setViewFormat] = useState(() => {
    // Try to get previous format from localStorage or use 'highlighted' as default
    const savedFormat = localStorage.getItem(`viewFormat-${api?.id}`);
    return savedFormat || 'highlighted';
  });
  const [copiedHeader, setCopiedHeader] = useState(null);
  const dragRef = useRef(null);
  const startDragY = useRef(0);
  const startHeight = useRef(0);

  // Save viewFormat when it changes
  useEffect(() => {
    if (api?.id) {
      localStorage.setItem(`viewFormat-${api.id}`, viewFormat);
    }
  }, [viewFormat, api?.id]);

  // Load saved format when API changes
  useEffect(() => {
    if (api?.id) {
      const savedFormat = localStorage.getItem(`viewFormat-${api.id}`);
      if (savedFormat) {
        setViewFormat(savedFormat);
      }
    }
  }, [api?.id]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    startDragY.current = e.clientY;
    startHeight.current = height;
  };


  const renderLoader = () => (
    <div className="flex items-center justify-center h-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-4 mt-20">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '100ms'}} />
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '200ms'}} />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">Loading response...</p>
      </div>
    </div>
  );
  

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const delta = startDragY.current - e.clientY;
      const newHeight = Math.max(200, Math.min(800, startHeight.current + delta));
      setHeight(newHeight);
      // Save height to localStorage whenever it changes
      localStorage.setItem('responsePanelHeight', newHeight.toString());
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleCopyHeader = async (key, value) => {
    await navigator.clipboard.writeText(`${key}: ${value}`);
    setCopiedHeader(key);
    setTimeout(() => setCopiedHeader(null), 2000);
  };

  const handleDownloadResponse = () => {
    const responseStr = JSON.stringify(api.responseData.data, null, 2);
    const blob = new Blob([responseStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'response.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyResponse = () => {
    let textToCopy = '';
    switch (viewFormat) {
      case 'highlighted':
      case 'pretty':
        textToCopy = JSON.stringify(api.responseData.data, null, 2);
        break;
      case 'raw':
        textToCopy = JSON.stringify(api.responseData.data);
        break;
      case 'xml':
        const xml = require('xml-js');
        try {
          // For response data that is an object, convert to XML string
          const responseContent = api.responseData.data || api.responseData;
          if (typeof responseContent === 'object') {
            textToCopy = xml.js2xml(responseContent, { compact: true, spaces: 2 });
          } else if (typeof responseContent === 'string') {
            // If it's already a string, use it directly
            textToCopy = responseContent;
          } else {
            // Fallback
            textToCopy = String(responseContent);
          }
        } catch (error) {
          console.error("Error converting to XML:", error);
          textToCopy = JSON.stringify(api.responseData.data);
        }
        break;
      default:
        textToCopy = JSON.stringify(api.responseData.data, null, 2);
    }
    navigator.clipboard.writeText(textToCopy);
  };
  const renderResponseContent = () => {
    if (api?.isLoading) {
      return renderLoader();
    }
  
    if (!api?.responseData) {
      return null;
    }
  
    // Enhanced error rendering with better formatting
    if (api.responseData.error) {
      return (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg space-y-2">
          <div className="text-red-600 dark:text-red-400 font-medium text-lg">
            {api.responseData.error}
          </div>
          
          {/* Show error details if available */}
          {api.responseData.errorDetails && (
            <div className="mt-3 border-t border-red-100 dark:border-red-800 pt-3">
              <div className="font-medium text-gray-700 dark:text-gray-300 mb-2">Troubleshooting:</div>
              
              {api.responseData.errorDetails.suggestion && (
                <div className="mb-2 text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Suggestion:</span> {api.responseData.errorDetails.suggestion}
                </div>
              )}
              
              {api.responseData.errorDetails.possibleIssues && (
                <div className="mb-2">
                  <div className="font-semibold text-gray-700 dark:text-gray-300">Possible issues:</div>
                  <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300">
                    {api.responseData.errorDetails.possibleIssues.map((issue, idx) => (
                      <li key={idx}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Display server response data if available */}
              {api.responseData.errorDetails.serverResponse && (
                <div className="mt-3">
                  <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Server Response:</div>
                  <pre className="bg-gray-100 dark:bg-zinc-800 p-2 rounded overflow-auto max-h-64 text-sm font-mono">
                    {typeof api.responseData.errorDetails.serverResponse === 'object'
                      ? JSON.stringify(api.responseData.errorDetails.serverResponse, null, 2)
                      : String(api.responseData.errorDetails.serverResponse)}
                  </pre>
                </div>
              )}

              {/* SSL Certificate Error Action */}
              {api.responseData.errorDetails.sslError && api.responseData.errorDetails.canDisableSSL && (
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                        SSL Certificate Verification Error
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-3">
                        The SSL certificate for this server cannot be verified. You can disable SSL verification for this request to proceed.
                      </p>
                      <button
                        onClick={() => {
                          updateApiState(activeFolderId, activeApiId, {
                            settings: { ...api.settings, sslVerification: false }
                          });
                          // Automatically retry the request after disabling SSL
                          setTimeout(() => handleSend(), 500);
                        }}
                        className="inline-flex items-center px-3 py-2 bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-600 text-white text-sm font-medium rounded-md transition-colors duration-200"
                      >
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        Disable SSL Verification & Retry
                      </button>
                      <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2">
                        ⚠️ Only disable SSL verification for trusted development/testing environments
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Show regular details if available */}
          {api.responseData.details && (
            <div className="text-gray-600 dark:text-gray-400 text-sm mt-3 border-t border-red-100 dark:border-red-800 pt-3">
              <div className="font-medium mb-1">Error Details:</div>
              {typeof api.responseData.details === 'object' ? (
                <pre className="bg-gray-100 dark:bg-zinc-800 p-2 rounded overflow-auto max-h-64">
                  {JSON.stringify(api.responseData.details, null, 2)}
                </pre>
              ) : (
                <div className="bg-gray-100 dark:bg-zinc-800 p-2 rounded">
                  {api.responseData.details}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
  
    // Check if we have direct response content (for offline requests)
    // This handles cases where the response doesn't follow the standard structure
    // that includes a 'data' property
    const responseContent = api.responseData.data || api.responseData;
    
    // Don't render if we have no content to display
    if (!responseContent || 
        (typeof responseContent === 'object' && Object.keys(responseContent).length === 0)) {
      return (
        <div className="text-gray-500 dark:text-gray-400 italic">
          No response data available
        </div>
      );
    }
  
    // Handle different response formats
    switch (viewFormat) {
      case 'highlighted':
        return <EnhancedJsonViewer data={responseContent} />;
      case 'pretty':
        return <PrettyJson data={responseContent} />;
      case 'raw':
        // For raw view, just show the plain text without syntax highlighting
        return <PlainTextView data={responseContent} />;
      case 'xml':
        const xml = require('xml-js');
        try {
          // Convert using xml-js library for proper XML conversion
          let xmlContent;
          if (typeof responseContent === 'object') {
            xmlContent = xml.js2xml(responseContent, { compact: true, spaces: 2 });
            return <XMLView data={xmlContent} />;
          } else {
            // If it's already a string, pass it to the XMLView
            return <XMLView data={responseContent} />;
          }
        } catch (error) {
          console.error("Error converting to XML:", error);
          return <div className="text-red-500">Error converting to XML: {error.message}</div>;
        }
      default:
        return <EnhancedJsonViewer data={responseContent} />;
    }
  };
  if (!api) return null;

  return (
    <div 
      style={{ height: `${height}px` }}
      className="border-t border-gray-200 dark:border-zinc-700 flex flex-col transition-all duration-150 mt-4 group relative"
    >
      {/* Pink scroll indicator line that appears on hover - positioned at the very top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
      
      <div 
        className="flex items-center justify-between p-2 bg-white dark:bg-zinc-800 cursor-ns-resize"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center space-x-2">
          <div 
            ref={dragRef}
            className="hover:bg-purple-500/10 rounded-full p-1 transition-colors"
          >
            <ArrowUpDown className="w-3 h-3 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Response</h3>
          {api.responseData && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              api.responseData.status < 400 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
              'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
            }`}>
              {api.responseData.status}
            </span>
          )}
        </div>
        
        {api.responseData && (
          <div className="flex items-center space-x-2 text-xs">
            <div className="flex flex-col text-gray-600 dark:text-gray-300">
              <span>{((api.responseData.size || 0) / 1024).toFixed(1)} KB</span>
              <span>{api.responseData.responseTime}ms</span>
            </div>
            <div className="flex items-center space-x-1">
              <button 
                onClick={handleCopyResponse}
                className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                title="Copy Response"
                onMouseDown={(e) => e.stopPropagation()} // Prevent drag when clicking buttons
              >
                <Copy className="w-3 h-3 text-gray-600 dark:text-gray-300" />
              </button>
              <button 
                onClick={handleDownloadResponse}
                className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                title="Download Response"
                onMouseDown={(e) => e.stopPropagation()} // Prevent drag when clicking buttons
              >
                <Download className="w-3 h-3 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 relative response-header-container">
        
        <div className="flex px-2 space-x-1">
          {['Body', 'Headers', 'Analytics'].map((tab) => {
            const isActive = api.activeResponseTab === `response-${tab.toLowerCase()}`;
            return (
              <button
                key={tab}
                onClick={() => updateApiState(activeFolderId, activeApiId, { 
                  activeResponseTab: `response-${tab.toLowerCase()}` 
                })}
                className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors relative ${
                  isActive
                    ? 'text-purple-600 dark:text-purple-400 bg-white dark:bg-zinc-900'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {tab}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {api.activeResponseTab === 'response-body' && (
        <div className="flex font-sans space-x-1 p-2 bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700">
          {[
            { id: 'highlighted', label: 'Enhanced JSON' },
            { id: 'pretty', label: 'Simple JSON' },
            { id: 'raw', label: 'Raw' },
            { id: 'xml', label: 'XML' }
          ].map((format) => (
            <button
              key={format.id}
              onClick={() => setViewFormat(format.id)}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                viewFormat === format.id
                  ? 'bg-purple-100 text-purple-700 dark:bg-zinc-900 dark:text-blue-100'
                  : 'hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              {format.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-auto response-scrollbar relative font-sans">
        {(api.isLoading || api.responseData) ? (
          <>
            {api.activeResponseTab === 'response-body' && (
              <div className="p-3 bg-white dark:bg-zinc-900 min-h-full font-sans">
                {renderResponseContent()}
              </div>
            )}
            {api.activeResponseTab === 'response-headers' && (
              <div className="p-6 bg-white dark:bg-zinc-900">
                {api.isLoading ? renderLoader() : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-zinc-700">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Header</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Value</th>
                        <th className="w-16"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(api.responseData?.headers || {}).map(([key, value]) => (
                        <tr key={key} className="border-b border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="py-3 px-4 font-sans font-semibold text-sm text-rose-600 dark:text-rose-400">{key}</td>
                          <td className="py-3 px-4 font-sans font-semibold text-sm text-violet-600 dark:text-violet-400">{value}</td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleCopyHeader(key, value)}
                              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                            >
                              {copiedHeader === key ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
            {api.activeResponseTab === 'response-analytics' && (
              <div className="h-full">
                {api.isLoading ? renderLoader() : <ResponseAnalytics api={api} />}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full space-y-4 text-gray-400 dark:text-gray-500">
            <ExternalLink className="w-8 h-8" />
            <p className="text-xs">Send a request to see the response</p>

            <div className="hidden sm:block text-xs -mb-20 text-gray-500 dark:text-gray-400 ml-2 self-center">
        Press Ctrl+Enter or ⌘+Enter to send
      </div>
      <a 
            href="https://docs.authrator.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-purple-500 hover:text-purple-600 text-sm font-medium group"
          >
            Visit Documentation
            <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </a>
          </div>
          
        )}
      </div>
    </div>
  );
};


const methodColors = {
  GET: 'text-emerald-700 dark:text-emerald-300',
  POST: 'text-purple-700 dark:text-blue-300',
  PUT: 'text-amber-700 dark:text-amber-300',
  DELETE: 'text-red-700 dark:text-red-300',
  PATCH: 'text-purple-700 dark:text-blue-300'
};

    
      const renderRequestPanel = () => {
        const api = getActiveApi();
        if (!api) return null;
      
        // Safe check utility function
        const safeGet = (obj, path) => {
          return path.split('.').reduce((acc, part) => acc && acc[part], obj) ?? null;
        };
      
        // Function to automatically generate and update token
        const autoGenerateAndUpdateToken = (api, folderId, apiId) => {
          // Create payload from key-value pairs
          const payload = {};
          const pairs = api.auth.type === 'avq-jwt' ? 
            api.auth.avqJwt?.pairs : 
            api.auth.jwt?.pairs;

          if (pairs) {
            pairs.forEach(pair => {
              if (pair.key) payload[pair.key] = pair.value || '';
            });
          }

          // Get private key and algorithm based on auth type
          const privateKey = api.auth.type === 'avq-jwt' ? 
            api.auth.avqJwt?.privateKey : 
            api.auth.jwt?.privateKey;
          
          const algorithm = api.auth.type === 'avq-jwt' ? 
            api.auth.avqJwt?.algorithm || "RS256" : 
            api.auth.jwt?.algorithm || "HS256";

          // Only generate token if private key exists
          if (!privateKey || privateKey.trim() === '') {
            return;
          }

          // Generate token
          const token = generateJWT(payload, privateKey, algorithm);

          // Update state with generated token
          const updatedAuth = {
            ...api.auth
          };

          if (api.auth.type === 'avq-jwt') {
            updatedAuth.avqJwt = {
              ...api.auth.avqJwt,
              token
            };
          } else {
            updatedAuth.jwt = {
              ...api.auth.jwt,
              value: token
            };
          }

          // Update state and headers (ensuring no empty auth headers)
          const updatedHeaders = updateHeadersWithAuth({...api, auth: updatedAuth});
          // Remove any empty header entries
          const cleanHeaders = updatedHeaders.filter(h => h.key || h.value);
          
          updateApiState(folderId, apiId, {
            auth: updatedAuth,
            headers: cleanHeaders
          });
        };

        const hasParams = () => {
          return Array.isArray(api.queryParams) && 
            api.queryParams.some(param => param?.key || param?.value);
        };
      
        const hasAuth = () => {
          if (!api.auth) return false;
          
          switch (api.auth.type) {
            case 'none':
              return false;
            case 'config-jwt':
              return api.auth.jwt && (
                (api.auth.jwt.pairs && api.auth.jwt.pairs.length > 0 && 
                 api.auth.jwt.pairs.some(pair => pair.key && pair.value)) ||
                (api.auth.jwt.key && api.auth.jwt.value)
              );
            case 'avq-jwt':
              return api.auth.avqJwt && api.auth.avqJwt.token;
            default:
              return api.auth.bearer || 
                safeGet(api.auth, 'basic.username') || 
                safeGet(api.auth, 'basic.password') ||
                api.auth.apiKey;
          }
        };

        const hasHeaders = () => {
          return Array.isArray(api.headers) && 
            api.headers.some(header => header?.key || header?.value);
        };
      
        const hasScripts = () => {
          return Boolean(
            safeGet(api, 'scripts.preRequest')?.trim() || 
            safeGet(api, 'scripts.tests')?.trim()
          );
        };
      
        const hasBody = () => {
          if (!api.body) return false;
          
          switch (api.body.type) {
            case 'raw':
              return Boolean(api.body.content?.trim());
            case 'formData':
              return Array.isArray(api.body.formData) && 
                api.body.formData.some(item => item?.key?.trim() || item?.value?.trim());
            case 'urlencoded':
              return Array.isArray(api.body.urlencoded) && 
                api.body.urlencoded.some(item => item?.key?.trim() || item?.value?.trim());
            default:
              return false;
          }
        };
      
        const hasSettings = () => {
          if (!api.settings) return false;
          
          const defaultSettings = {
            followRedirects: true,
            sslVerification: true,
            timeout: 0,
            responseSizeLimit: 50,
            saveResponses: true,
            enableProxy: false,
            proxyUrl: '',
            proxyAuth: false,
            proxyUsername: '',
            proxyPassword: ''
          };
      
          return Object.entries(defaultSettings).some(([key, defaultValue]) => {
            const currentValue = api.settings[key];
            return currentValue !== undefined && currentValue !== defaultValue;
          });
        };
      
        const clearConsole = () => {
          setConsoleOutput([]);
        };
      
        const runScript = async () => {
          const script = scriptType === 'pre-request' ? 
            safeGet(api, 'scripts.preRequest') || '' : 
            safeGet(api, 'scripts.tests') || '';
          
          clearConsole();
      
          try {
            const sandbox = {
              auth: {
                environment: new Map(),
                request: {
                  method: api.method || 'GET',
                  url: api.url || '',
                  headers: (api.headers || []).reduce((acc, h) => ({ 
                    ...acc, 
                    [h?.key || '']: h?.value || '' 
                  }), {})
                },
                response: null,
                test: (name, fn) => {
                  try {
                    fn();
                    sandbox.auth.log('✓ ' + name, 'success');
                  } catch (error) {
                    sandbox.auth.log('✗ ' + name + ': ' + error.message, 'error');
                  }
                },
                expect: (value) => ({
                  to: {
                    equal: (expected) => {
                      if (value !== expected) throw new Error(`Expected ${expected} but got ${value}`);
                    },
                    be: {
                      true: () => {
                        if (value !== true) throw new Error(`Expected true but got ${value}`);
                      },
                      false: () => {
                        if (value !== false) throw new Error(`Expected false but got ${value}`);
                      }
                    }
                  }
                }),
                log: (message, type = 'info') => {
                  setConsoleOutput(prev => [...prev, { type, message }]);
                }
              }
            };
      
            if (scriptType === 'test') {
              try {
                const response = await fetch(api.url || '');
                const data = await response.json();
                sandbox.auth.response = {
                  json: () => data,
                  status: response.status,
                  headers: Object.fromEntries(response.headers.entries()),
                  to: {
                    have: {
                      status: (expectedStatus) => {
                        if (response.status !== expectedStatus) {
                          throw new Error(`Expected status ${expectedStatus} but got ${response.status}`);
                        }
                      },
                      header: (headerName) => {
                        if (!response.headers.has(headerName)) {
                          throw new Error(`Expected header ${headerName} to exist`);
                        }
                        return true;
                      }
                    }
                  }
                };
              } catch (error) {
                setConsoleOutput(prev => [...prev, { 
                  type: 'error', 
                  message: `Failed to make API call: ${error.message}` 
                }]);
                return;
              }
            }
      
            const fn = new Function('auth', script);
            fn(sandbox.auth);
      
          } catch (error) {
            setConsoleOutput(prev => [...prev, { 
              type: 'error', 
              message: `Script execution error: ${error.message}` 
            }]);
          }
        };
      

        
        // Update the handleAuthTypeChange function
        const handleAuthTypeChange = async (e) => {
          const value = e.target.value;
          let updatedAuth;
          
          if (value === 'none') {
            updatedAuth = {
              type: value
            };
          } else if (value === 'config-jwt') {
            updatedAuth = {
              type: value,
              jwt: {
                algorithm: "HS256",
                pairs: [{ key: '', value: '' }],
                privateKey: '',
                value: '' // Initialize with empty value
              }
            };
          } else if (value === 'avq-jwt') {
            updatedAuth = {
              type: value,
              avqJwt: {
                algorithm: "RS256",
                privateKey: '',
                pairs: [
                  { key: "sub", value: "" },
                  { key: "aud", value: "" },
                  { key: "avq_roles", value: "" },
                  { key: "iss", value: "" },
                  { key: "avaloq_bu_id", value: "" },
                  { key: "avq_bu", value: "" },
                  { key: "exp", value: "3600" },
                 
                ],
                token: '' // Initialize with empty token
              }
            };
          } else if (value.startsWith('template_')) {
            const templateId = value.replace('template_', '');
            const selectedTemplate = dbTemplates.find(t => t._id === templateId);
            
            if (selectedTemplate) {
              updatedAuth = {
                type: 'config-jwt',
                jwt: {
                  algorithm: "HS256",
                  pairs: selectedTemplate.pairs || [],
                  privateKey: '',
                  value: '' // Initialize with empty value
                }
              };
            }
          }
          
          // Update auth and clear any existing auth headers
          updateApiState(activeFolderId, activeApiId, {
            auth: updatedAuth,
            headers: api.headers.filter(h => 
              !['Authorization', 'X-API-Key'].includes(h.key)
            )
          });

          // Generate token if needed
          if (updatedAuth && (updatedAuth.type === 'config-jwt' || updatedAuth.type === 'avq-jwt')) {
            autoGenerateAndUpdateToken({...api, auth: updatedAuth}, activeFolderId, activeApiId);
          }
        };
       

        const buildUrlWithParams = (baseUrl, params) => {
          // Don't return early if there are empty params - process them anyway
          const urlObj = new URL(baseUrl.startsWith('http') ? baseUrl : `http://${baseUrl}`);
          
          params.forEach(param => {
            // Add the parameter even if value is empty (but key must exist)
            if (param.key) {
              urlObj.searchParams.set(param.key, param.value || '');
            }
          });
          
          return urlObj.toString().replace(/^http:\/\//, '');
        };
        
        // Function to parse URL parameters
        const parseUrlParams = (url) => {
          try {
            const urlObj = new URL(url.startsWith('http') ? url : `http://${url}`);
            const params = [];
            
            urlObj.searchParams.forEach((value, key) => {
              params.push({ key, value });
            });
            
            return {
              baseUrl: urlObj.origin + urlObj.pathname,
              params: params.length ? params : [{ key: '', value: '' }]
            };
          } catch (error) {
            // If URL is invalid, return the original URL and empty params
            return { baseUrl: url, params: [{ key: '', value: '' }] };
          }
        };
        
        // Handler for URL input changes
        const handleUrlChange = (e) => {
          const newUrl = e.target.value;
          
          // Parse the URL to extract parameters
          const { baseUrl, params } = parseUrlParams(newUrl);
          
          // Update both the URL and the query parameters in state
          updateApiState(activeFolderId, activeApiId, { 
            url: newUrl,
            queryParams: params 
          });
        };
        
        // Handler for parameter changes
        const handleParamChange = (index, field, value) => {
          const newParams = [...api.queryParams];
          newParams[index][field] = value;
          
          // Update both params and URL immediately on every keystroke
          const newUrl = buildUrlWithParams(api.url.split('?')[0], newParams);
          
          updateApiState(activeFolderId, activeApiId, {
            queryParams: newParams,
            url: newUrl
          });
        };

        const customJwtConfigs = [
          {
            "id": "jwt1",
            "name": "Development Environment",
            "pairs": [
              { "key": "sub", "value": "1234567890" },
              { "key": "name", "value": "Dev User" },
              { "key": "role", "value": "developer" }
            ]
          },
          {
            "id": "jwt2",
            "name": "Production Environment",
            "pairs": [
              { "key": "sub", "value": "9876543210" },
              { "key": "name", "value": "Prod User" },
              { "key": "role", "value": "admin" }
            ]
          }
        ];
        const generateJWT = (payload, privateKey = null, algorithm = "HS256") => {
          try {
            
            const forge = require('node-forge');
            
   
            if (!privateKey || privateKey.trim() === '') {
              console.error("Private key is required for JWT generation");
              return "";
            }

         
            if (!payload.iat) {
              payload.iat = Math.floor(Date.now() / 1000);
            }
            
            // Convert exp from string to seconds since epoch if it's a string
            if (payload.exp && typeof payload.exp === 'string') {
              // If exp is a duration in seconds from now
              if (!isNaN(payload.exp)) {
                const expiresInSeconds = parseInt(payload.exp, 10);
                payload.exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
              }
            }
            
            // Ensure avq_roles is always an array
            if (payload.avq_roles !== undefined) {
              if (typeof payload.avq_roles === 'string') {
                // If it's a comma-separated string, split it into an array
                if (payload.avq_roles.includes(',')) {
                  payload.avq_roles = payload.avq_roles.split(',').map(role => role.trim());
                } else if (payload.avq_roles.trim() !== '') {
                  // Single value
                  payload.avq_roles = [payload.avq_roles.trim()];
                } else {
                  // Empty string
                  payload.avq_roles = [];
                }
              } else if (!Array.isArray(payload.avq_roles)) {
                // If it's neither a string nor an array, convert to array
                payload.avq_roles = [payload.avq_roles.toString()];
              }
            }

            // Create JWT header with selected algorithm
            const header = {
              alg: algorithm,
              typ: "JWT"
            };

            // Base64url encoding function
            const base64url = (str) => {
              // For strings, use standard encoding
              if (typeof str === 'string') {
                return btoa(str)
                  .replace(/=/g, '')
                  .replace(/\+/g, '-')
                  .replace(/\//g, '_');
              }
              
              // For binary data (like signature bytes)
              const bytes = new Uint8Array(str.length);
              for (let i = 0; i < str.length; i++) {
                bytes[i] = str.charCodeAt(i);
              }
              
              return btoa(String.fromCharCode.apply(null, bytes))
                .replace(/=/g, '')
                .replace(/\+/g, '-')
                .replace(/\//g, '_');
            };

            // Convert header and payload to base64url strings
            const encodedHeader = base64url(JSON.stringify(header));
            const encodedPayload = base64url(JSON.stringify(payload));
            
            // Combine header and payload with a dot
            const data = `${encodedHeader}.${encodedPayload}`;
            
            let signature;
            
            // Create proper cryptographic signatures based on the algorithm
            if (algorithm.startsWith('RS')) {
              // For RSA signatures
              try {
                if (!privateKey || (!privateKey.includes('-----BEGIN RSA PRIVATE KEY-----') && !privateKey.includes('-----BEGIN PRIVATE KEY-----'))) {
                  throw new Error('Valid RSA private key in PEM format is required');
                }
                
                // Parse the RSA private key
                const rsaPrivateKey = forge.pki.privateKeyFromPem(privateKey);
                
                // Determine hash algorithm based on JWT algorithm
                let hashAlgorithm;
                switch (algorithm) {
                  case 'RS256':
                    hashAlgorithm = 'sha256';
                    break;
                  case 'RS384':
                    hashAlgorithm = 'sha384';
                    break;
                  case 'RS512':
                  default:
                    hashAlgorithm = 'sha512';
                    break;
                }
                
                // Create message digest
                const md = forge.md[hashAlgorithm].create();
                md.update(data);
                
                // Sign the data
                const signatureBytes = rsaPrivateKey.sign(md);
                
                // Convert signature to base64url
                signature = base64url(signatureBytes);
              } catch (error) {
                console.error('RSA signing error:', error);
                throw new Error(`Invalid RSA private key or signing error: ${error.message}`);
              }
            } else {
              // For HMAC signatures (HS256, HS384, HS512)
              try {
                let hmacAlgorithm;
                switch (algorithm) {
                  case 'HS256':
                    hmacAlgorithm = 'sha256';
                    break;
                  case 'HS384':
                    hmacAlgorithm = 'sha384';
                    break;
                  case 'HS512':
                  default:
                    hmacAlgorithm = 'sha512';
                    break;
                }
                
                // Create HMAC
                const hmac = forge.hmac.create();
                hmac.start(hmacAlgorithm, privateKey);
                hmac.update(data);
                
                // Get binary digest and convert to base64url
                const hmacBytes = hmac.digest().getBytes();
                signature = base64url(hmacBytes);
              } catch (error) {
                console.error('HMAC signing error:', error);
                throw new Error('Invalid key or signing error');
              }
            }
            
            // Return the complete JWT token
            const token = `${data}.${signature}`;
            
            // Store information about this token for verification purposes
            if (algorithm.startsWith('RS')) {
              localStorage.setItem('last_jwt_info', JSON.stringify({
                algorithm,
                timestamp: Date.now()
              }));
            }
            
            // Debug log for troubleshooting
            console.log('JWT generated:', {
              header: JSON.parse(atob(encodedHeader.replace(/-/g, '+').replace(/_/g, '/'))),
              payload: JSON.parse(atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/'))),
              signatureLength: signature.length,
              algorithm
            });
            
            return token;
          } catch (error) {
            console.error("Error generating JWT:", error);
            
            // Fallback to a simple JWT without cryptographic signature if forge fails
            try {
              // Simple base64url encoding without TextEncoder
              const simpleBase64url = (str) => {
                return btoa(str)
                  .replace(/=/g, '')
                  .replace(/\+/g, '-')
                  .replace(/\//g, '_');
              };
              
              // Create simple header and payload
              const header = { alg: algorithm, typ: "JWT" };
              const encodedHeader = simpleBase64url(JSON.stringify(header));
              const encodedPayload = simpleBase64url(JSON.stringify(payload));
              
              // Create dummy signature (not cryptographically secure, but will match JWT format)
              const dummySignature = simpleBase64url(JSON.stringify({
                error: "Fallback signature - NOT SECURE",
                timestamp: Date.now()
              }));
              
              console.warn("Using fallback JWT generation method - NOT SECURE");
              return `${encodedHeader}.${encodedPayload}.${dummySignature}`;
            } catch (fallbackError) {
              console.error("Even fallback JWT generation failed:", fallbackError);
              return "";
            }
          }
        };
        


        // Use the global function for consistency
        const ensureDefaultHeaders = (headers) => ensureApiHasDefaultHeaders(headers, api.settings);

        // Create a function to update headers with auth info
        const updateHeadersWithAuth = (api) => {
          // Create a copy of current headers, excluding any existing auth headers and empty headers
          const headers = api.headers.filter(h => 
            !['Authorization', 'X-API-Key'].includes(h.key) && (h.key || h.value)
          );
          
          // Add the appropriate header based on auth type
          if (api.auth) {
            switch(api.auth.type) {
              case 'config-jwt':
                if (api.auth.jwt?.value) {
                  headers.push({ key: 'Authorization', value: `Bearer ${api.auth.jwt.value}` });
                }
                break;
                
              case 'avq-jwt':
                if (api.auth.avqJwt?.token) {
                  // Changed from X-AVQ-AUTH to Authorization for consistency
                  headers.push({ key: 'Authorization', value: `Bearer ${api.auth.avqJwt.token}` });
                }
                break;
            }
          }
          
          // Ensure all default headers are present
          return ensureDefaultHeaders(headers);
        };
       
   return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100">
    <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
      <select
        value={api.method}
        onChange={(e) => updateApiState(activeFolderId, activeApiId, { method: e.target.value })}
        className={`px-3 py-2 rounded-md font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 bg-white dark:bg-zinc-900 border border-gray-300  dark:border-zinc-700`}
      >
        <option className="text-emerald-700 dark:text-emerald-300" value="GET">GET</option>
        <option className="text-purple-700 dark:text-blue-300" value="POST">POST</option>
        <option className="text-amber-700 dark:text-amber-300" value="PUT">PUT</option>
        <option className="text-red-700 dark:text-red-300" value="DELETE">DELETE</option>
        <option className="text-purple-700 dark:text-blue-300" value="PATCH">PATCH</option>
      </select>

      
      <div className="flex-1 relative">
        <input
          type="text"
          value={api.url}
          onChange={(e) => {
            handleUrlChange(e);
            // Show suggestions only when user starts typing
            if (e.target.value && e.target.value.trim() !== '') {
              setShowUrlSuggestions(true);
            } else {
              setShowUrlSuggestions(false);
            }
          }}
          placeholder="https://authrator.app/ping"
          onKeyDown={(e) => {
            // Check if Enter is pressed (with or without Ctrl/Cmd)
            if (e.key === 'Enter') {
              handleSend();
            }
          }}
          onFocus={(e) => {
            if (e.target.value === '') {
              // If field is empty, clear the placeholder by setting a temporary empty placeholder
              e.target.placeholder = '';
            }
            // Don't show suggestions immediately on focus - only when typing
          }}
          onBlur={(e) => {
            if (e.target.value === '') {
              // Restore the placeholder when the field is empty and loses focus
              e.target.placeholder = 'https://authrator.app/ping';
            }
            // Hide suggestions when losing focus
            setTimeout(() => {
              setShowUrlSuggestions(false);
            }, 200);
          }}
          className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
        />
        
        {/* Recent URLs suggestions */}
        {showUrlSuggestions && recentUrls && recentUrls.length > 0 && (
          <div className="absolute w-full mt-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Recent URLs</span>
            </div>
            <ul>
              {recentUrls
                .filter(url => url && typeof url === 'string' && (api.url ? url.toLowerCase().includes(api.url.toLowerCase()) : true))
                .map((url, index) => (
                  <li 
                    key={index}
                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer text-sm truncate"
                    onClick={() => {
                      // Update URL **and** query-params in a single state update
                      const { params } = parseUrlParams(url);
                      updateApiState(activeFolderId, activeApiId, { url, queryParams: params });
                      setShowUrlSuggestions(false);
                    }}
                  >
                    {url}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>

      {api.isFromHistory && (() => {
        // Check if this API still exists in any collection
        const apiExists = collections.some(collection => 
          // Skip temporary and history collections
          collection.id !== 'temp-99999' && 
          collection.name !== 'History Requests 9999999' &&
          // Check if any API in this collection has the same URL and method
          collection.apis.some(existingApi => 
            existingApi.url === api.url && 
            existingApi.method === api.method &&
            !existingApi.isFromHistory
          )
        );
        
        // Only show the Save button if the API doesn't exist in any collection
        return !apiExists ? (
          <div className="relative">
            <CustomDropdown 
              trigger={
                <button className="px-4 py-2 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center space-x-2">
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </button>
              }
            >
              <div className="py-1">
                <div className="px-4 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Save to Collection
                </div>
                {collections
                  .filter(c => c.id !== 'temp-99999' && c.name !== 'History Requests 9999999')
                  .map(collection => (
                    <button
                      key={collection.id}
                      onClick={() => {
                        // Create a copy of the current API without the isFromHistory flag
                        const apiCopy = {
                          ...api,
                          id: `api-${Date.now()}`,
                          isFromHistory: false
                        };
                        
                        // Add the API to the selected collection
                        const updatedCollections = collections.map(folder => {
                          if (folder.id === collection.id) {
                            return {
                              ...folder,
                              apis: [...folder.apis, apiCopy]
                            };
                          }
                          return folder;
                        });
                        
                        setCollections(updatedCollections);
                        
                        // If we're online and not in a temporary collection, save to server
                        if (!isElectronOffline() && !collection.id.startsWith('temp-') && !collection.id.startsWith('local-')) {
                          // Create the API on the server
                          fetch('https://authrator.com/db-api/api/apis', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              collectionId: collection.id,
                              name: apiCopy.name,
                              method: apiCopy.method,
                              url: apiCopy.url
                            }),
                          })
                          .then(response => response.json())
                          .then(data => {
                            if (data.success) {
                              // Update the API with the server ID
                              const serverApi = {
                                ...apiCopy,
                                id: data.api._id
                              };
                              
                              // Update collections with the server API
                              setCollections(prevCollections => {
                                return prevCollections.map(folder => {
                                  if (folder.id === collection.id) {
                                    return {
                                      ...folder,
                                      apis: folder.apis.map(a => 
                                        a.id === apiCopy.id ? serverApi : a
                                      )
                                    };
                                  }
                                  return folder;
                                });
                              });
                              
                              // Update the API details on the server
                              fetch(`https://authrator.com/db-api/api/apis/${serverApi.id}`, {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  headers: apiCopy.headers,
                                  queryParams: apiCopy.queryParams,
                                  body: apiCopy.body,
                                  auth: apiCopy.auth,
                                  settings: apiCopy.settings
                                }),
                              }).catch(error => {
                                console.error('Error updating API details:', error);
                              });
                            }
                          })
                          .catch(error => {
                            console.error('Error saving API to server:', error);
                          });
                        }
                        
                        // Show a toast notification instead of an alert
                        setToast({
                          show: true,
                          message: `Request saved to ${collection.name}`,
                          type: 'success'
                        });
                        
                        // Hide the toast after 3 seconds
                        setTimeout(() => {
                          setToast(prev => ({ ...prev, show: false }));
                        }, 3000);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center space-x-2"
                    >
                      <FolderClosed className="w-4 h-4" />
                      <span className="truncate">{collection.name}</span>
                    </button>
                  ))}
              </div>
            </CustomDropdown>
          </div>
        ) : null;
      })()}

      <button 
        onClick={handleSend}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700 text-white rounded-md text-sm font-medium transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 flex items-center space-x-2"
        title="Send request (Ctrl+Enter or ⌘+Enter)"
      >
        <Send className="w-4 h-4" />
        <span>Send</span>
      </button>
      

    </div>

    <div className="border-b border-gray-200 dark:border-zinc-700">
      <div className="flex">
        {[
          { name: 'Params', icon: Database, hasContent: hasParams() },
          { name: 'Authorization', icon: Lock, hasContent: hasAuth() },
          { name: 'Headers', icon: Code, hasContent: hasHeaders() },
          { name: 'Body', icon: CodeSquare, hasContent: hasBody() },
          { name: 'Scripts', icon: Terminal, hasContent: hasScripts() },
          { name: 'Settings', icon: Settings, hasContent: hasSettings() }
        ].map(({ name, icon: Icon, hasContent }) => (
          <button
            key={name}
            onClick={() => setActiveTab(name.toLowerCase())}
            className={`relative flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors duration-150 ease-in-out
              ${activeTab === name.toLowerCase()
                ? 'border-b-2 border-purple-500 text-purple-500 dark:text-purple-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
          >
            <Icon className="w-4 h-4" />
            <span>{name}</span>
            {hasContent && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-purple-500 rounded-full" />
            )}
          </button>
        ))}
      </div>
    </div>

    <div className="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-zinc-800">
        {activeTab === 'params' && (
          <div className="space-y-3">
            {api.queryParams.map((param, index) => (
              <div key={index} className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Key"
                  value={param.key}
                  onChange={(e) => handleParamChange(index, 'key', e.target.value)}
                  className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={param.value}
                  onChange={(e) => handleParamChange(index, 'value', e.target.value)}
                  className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
                />
                <button
                  onClick={() => {
                    const newParams = api.queryParams.filter((_, i) => i !== index);
                    const newParams2 = newParams.length ? newParams : [{ key: '', value: '' }];
                    const newUrl = buildUrlWithParams(api.url.split('?')[0], newParams2);
                    updateApiState(activeFolderId, activeApiId, {
                      queryParams: newParams2,
                      url: newUrl
                    });
                  }}
                  className="p-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors duration-150"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                const newParams = [...api.queryParams, { key: '', value: '' }];
                updateApiState(activeFolderId, activeApiId, {
                  queryParams: newParams
                });
              }}
              className="flex items-center space-x-2 text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300 font-medium text-sm transition-colors duration-150"
            >
              <Plus className="w-4 h-4" />
              <span>Add Parameter</span>
          </button>
        </div>
      )}
    {activeTab === 'authorization' && (
  <div className="space-y-3">
    <select
      value={api.auth.type}
      onChange={handleAuthTypeChange}
      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
    >
      <option value="none">No Auth</option>
      <option value="config-jwt">Config JWT</option>
      <option value="avq-jwt">Avq JWT</option>
      {dbTemplates.length > 0 && (
        <optgroup label="Saved Templates">
          {dbTemplates.map(template => (
            <option key={template._id} value={`template_${template._id}`}>
              Template: {template.name}
            </option>
          ))}
        </optgroup>
      )}
    </select>

    {/* Config JWT UI */}
    {api.auth.type === 'config-jwt' && (
      <div className="space-y-3">
        <div className="w-full space-y-2">
          {/* Algorithm Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Signing Algorithm</label>
            <select
              value={api.auth.jwt?.algorithm || "HS256"}
              onChange={(e) => {
                const updatedAuth = {
                  ...api.auth,
                  jwt: { ...api.auth.jwt, algorithm: e.target.value }
                };
                updateApiState(activeFolderId, activeApiId, {
                  auth: updatedAuth
                });
              }}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
            >
              <option value="HS256">HS256</option>
              <option value="HS384">HS384</option>
              <option value="HS512">HS512</option>
              <option value="RS256">RS256</option>
              <option value="RS384">RS384</option>
              <option value="RS512">RS512</option>
            </select>
          </div>

          {/* Private Key Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Private Key (Required for RS* algorithms)</label>
            <textarea
              placeholder="Paste your private key (PEM format)"
              value={api.auth.jwt?.privateKey || ''}
              onChange={(e) => {
                const updatedAuth = {
                  ...api.auth,
                  jwt: { ...api.auth.jwt, privateKey: e.target.value }
                };
                updateApiState(activeFolderId, activeApiId, {
                  auth: updatedAuth
                });
              }}
              className="w-full h-32 px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
            />
            <input
              type="file"
              accept=".pem"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const privateKey = event.target.result;
                    const updatedAuth = {
                      ...api.auth,
                      jwt: { ...api.auth.jwt, privateKey }
                    };
                    updateApiState(activeFolderId, activeApiId, {
                      auth: updatedAuth
                    });
                  };
                  reader.readAsText(file);
                }
              }}
              className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-purple-50 file:text-purple-700
                dark:file:bg-purple-900 dark:file:text-purple-200
                hover:file:bg-purple-100 dark:hover:file:bg-purple-800"
            />
          </div>

          {/* JWT Payload Fields */}
          {api.auth.jwt?.pairs && api.auth.jwt.pairs.map((pair, index) => (
            <div key={index} className="flex space-x-2">
              <input
                type="text"
                placeholder="Key"
                value={pair.key || ''}
                onChange={(e) => {
                  const newPairs = [...api.auth.jwt.pairs];
                  newPairs[index] = { ...pair, key: e.target.value };
                  const updatedAuth = {
                    ...api.auth, 
                    jwt: { ...api.auth.jwt, pairs: newPairs }
                  };
                  updateApiState(activeFolderId, activeApiId, {
                    auth: updatedAuth
                  });
                }}
                className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Value"
                value={pair.value || ''}
                onChange={(e) => {
                  const newPairs = [...api.auth.jwt.pairs];
                  newPairs[index] = { ...pair, value: e.target.value };
                  const updatedAuth = {
                    ...api.auth, 
                    jwt: { ...api.auth.jwt, pairs: newPairs }
                  };
                  updateApiState(activeFolderId, activeApiId, {
                    auth: updatedAuth
                  });
                }}
                className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
              />
              {/* Add delete button for added fields */}
              {index > 0 && (
                <button
                  onClick={() => {
                    const newPairs = [...api.auth.jwt.pairs];
                    newPairs.splice(index, 1);
                    const updatedAuth = {
                      ...api.auth,
                      jwt: { ...api.auth.jwt, pairs: newPairs }
                    };
                    updateApiState(activeFolderId, activeApiId, {
                      auth: updatedAuth
                    });
                  }}
                  className="px-2 py-2 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
          
          {/* Add field button */}
          <button
            onClick={() => {
              const newPairs = [...(api.auth.jwt?.pairs || []), { key: '', value: '' }];
              const updatedAuth = {
                ...api.auth,
                jwt: { ...api.auth.jwt, pairs: newPairs }
              };
              updateApiState(activeFolderId, activeApiId, {
                auth: updatedAuth
              });
            }}
            className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded-md text-sm"
          >
            Add Field
          </button>

          {/* Generate Now button */}
          <button
            onClick={() => {
              if ((api.auth.jwt?.algorithm?.startsWith('RS') && api.auth.jwt?.privateKey) || 
                  (!api.auth.jwt?.algorithm?.startsWith('RS'))) {
                autoGenerateAndUpdateToken(api, activeFolderId, activeApiId);
              }
            }}
            disabled={api.auth.jwt?.algorithm?.startsWith('RS') && !api.auth.jwt?.privateKey}
            className={`px-3 py-1 ml-3 ${
              (api.auth.jwt?.algorithm?.startsWith('RS') && !api.auth.jwt?.privateKey)
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600'
            } text-white rounded-md text-sm mt-4`}
          >
            Generate Now
          </button>

          {/* Generated Token Display */}
          {api.auth.jwt?.value && (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <label className="block text-sm font-medium">Generated Token</label>
      <button
        onClick={(event) => {
          // Copy token to clipboard
          navigator.clipboard.writeText(api.auth.jwt.value);
          
          // Temporarily change button state
          const originalButton = event.currentTarget;
          originalButton.textContent = 'Copied!';
          originalButton.classList.remove('bg-purple-500', 'hover:bg-purple-600');
          originalButton.classList.add('bg-green-500');
          
          // Revert back after 2 seconds
          setTimeout(() => {
            originalButton.textContent = 'Copy Token';
            originalButton.classList.add('bg-purple-500', 'hover:bg-purple-600');
            originalButton.classList.remove('bg-green-500');
          }, 2000);
        }}
        className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded-md text-sm"
      >
        Copy Token
      </button>
    </div>
    <div className="w-full px-3 py-2 bg-gray-100 dark:bg-zinc-800 rounded-md text-sm break-all">
      {api.auth.jwt.value}
    </div>
  </div>
)}
        </div>
      </div>
    )}

    {/* AVQ JWT UI */}
    {api.auth.type === 'avq-jwt' && (
      <div className="space-y-3">
        {/* Algorithm Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Signing Algorithm</label>
          <select
            value={api.auth.avqJwt?.algorithm || "RS256"}
            onChange={(e) => {
              const updatedAuth = {
                ...api.auth,
                avqJwt: { ...api.auth.avqJwt, algorithm: e.target.value }
              };
              updateApiState(activeFolderId, activeApiId, {
                auth: updatedAuth
              });
            }}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
          >
            <option value="RS256">RS256</option>
            <option value="RS384">RS384</option>
            <option value="RS512">RS512</option>
          </select>
        </div>

        {/* Private Key Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Private Key (Required)</label>
          <textarea
            placeholder="Paste your private key (PEM format)"
            value={api.auth.avqJwt?.privateKey || ''}
            onChange={(e) => {
              const updatedAuth = {
                ...api.auth,
                avqJwt: { ...api.auth.avqJwt, privateKey: e.target.value }
              };
              updateApiState(activeFolderId, activeApiId, {
                auth: updatedAuth
              });
            }}
            className="w-full h-32 px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
          />
          <input
            type="file"
            accept=".pem"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  const privateKey = event.target.result;
                  const updatedAuth = {
                    ...api.auth,
                    avqJwt: { ...api.auth.avqJwt, privateKey }
                  };
                  updateApiState(activeFolderId, activeApiId, {
                    auth: updatedAuth
                  });
                };
                reader.readAsText(file);
              }
            }}
            className="block w-full text-sm text-gray-500 dark:text-gray-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-purple-50 file:text-purple-700
              dark:file:bg-purple-900 dark:file:text-purple-200
              hover:file:bg-purple-100 dark:hover:file:bg-purple-800"
          />
        </div>

        {/* Predefined key-value pairs for AVQ JWT */}
        <div className="w-full space-y-2">
          {api.auth.avqJwt?.pairs && api.auth.avqJwt.pairs.map((pair, index) => (
            <div key={index} className="flex space-x-2">
              <input
                type="text"
                placeholder="Key"
                value={pair.key || ''}
                onChange={(e) => {
                  const newPairs = [...api.auth.avqJwt.pairs];
                  newPairs[index] = { ...pair, key: e.target.value };
                  const updatedAuth = {
                    ...api.auth,
                    avqJwt: { ...api.auth.avqJwt, pairs: newPairs }
                  };
                  updateApiState(activeFolderId, activeApiId, {
                    auth: updatedAuth
                  });
                }}
                className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Value"
                value={pair.value || ''}
                onChange={(e) => {
                  const newPairs = [...api.auth.avqJwt.pairs];
                  newPairs[index] = { ...pair, value: e.target.value };
                  const updatedAuth = {
                    ...api.auth,
                    avqJwt: { ...api.auth.avqJwt, pairs: newPairs }
                  };
                  updateApiState(activeFolderId, activeApiId, {
                    auth: updatedAuth
                  });
                }}
                className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
              />
              {/* Add delete button for non-default fields */}
              {index >= 7 && (
                <button
                  onClick={() => {
                    const newPairs = [...api.auth.avqJwt.pairs];
                    newPairs.splice(index, 1);
                    const updatedAuth = {
                      ...api.auth,
                      avqJwt: { ...api.auth.avqJwt, pairs: newPairs }
                    };
                    updateApiState(activeFolderId, activeApiId, {
                      auth: updatedAuth
                    });
                  }}
                  className="px-2 py-2 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}

          
          {/* Add field button */}
          <button
            onClick={() => {
              const newPairs = [...(api.auth.avqJwt?.pairs || []), { key: '', value: '' }];
              const updatedAuth = {
                ...api.auth,
                avqJwt: { ...api.auth.avqJwt, pairs: newPairs }
              };
              updateApiState(activeFolderId, activeApiId, {
                auth: updatedAuth
              });
            }}
            className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded-md text-sm"
          >
            Add Field
          </button>

          {/* Generate Now button */}
          <button
            onClick={() => {
              if (api.auth.avqJwt?.privateKey) {
                autoGenerateAndUpdateToken(api, activeFolderId, activeApiId);
              }
            }}
            disabled={!api.auth.avqJwt?.privateKey}
            className={`px-3 py-1 ml-3 ${
              api.auth.avqJwt?.privateKey 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-gray-400 cursor-not-allowed'
            } text-white rounded-md text-sm mt-4`}
          >
            Generate Now
          </button>

          {/* Generated Token Display */}
          {api.auth.avqJwt?.token && (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <label className="block text-sm font-medium">Generated Token</label>
      <button
        onClick={(event) => {
          // Copy token to clipboard
          navigator.clipboard.writeText(api.auth.avqJwt.token);
          
          // Temporarily change button state
          const originalButton = event.currentTarget;
          originalButton.textContent = 'Copied!';
          originalButton.classList.remove('bg-purple-500', 'hover:bg-purple-600');
          originalButton.classList.add('bg-green-500');
          
          // Revert back after 2 seconds
          setTimeout(() => {
            originalButton.textContent = 'Copy Token';
            originalButton.classList.add('bg-purple-500', 'hover:bg-purple-600');
            originalButton.classList.remove('bg-green-500');
          }, 2000);
        }}
        className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded-md text-sm"
      >
        Copy Token
      </button>
    </div>
    <div className="w-full px-3 py-2 bg-gray-100 dark:bg-zinc-800 rounded-md text-sm break-all">
      {api.auth.avqJwt.token}
    </div>
  </div>
)}
        </div>
      </div>
    )}
  </div>
)}

{activeTab === 'headers' && (
  <div className="space-y-3">
    {api.headers.map((header, index) => {
      const isAutoManaged = isAutoManagedHeader(header.key, api.body || { type: 'none', content: '' });
      const isContentType = header.key.toLowerCase() === 'content-type';
      const isDefaultHeader = ['User-Agent', 'Cache-Control', 'Connection'].includes(header.key);
      
      return (
        <div key={index} className={`flex space-x-2 ${isAutoManaged ? 'bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg border border-purple-200 dark:border-purple-800' : ''}`}>
          {isAutoManaged && (
            <div className="flex items-center mr-2" title={isContentType ? "Auto-managed Content-Type Header" : "Default Header"}>
              <div className={`w-2 h-2 rounded-full ${isContentType ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
            </div>
          )}
          <input
            type="text"
            placeholder="Key"
            value={header.key}
            onChange={(e) => {
              const newHeaders = [...api.headers];
              newHeaders[index].key = e.target.value;
              updateApiState(activeFolderId, activeApiId, { headers: newHeaders });
            }}
            className={`flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent ${
              isAutoManaged 
                ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700' 
                : 'bg-white dark:bg-zinc-900 border-gray-300 dark:border-gray-600'
            }`}
            readOnly={isAutoManaged}
          />
          <input
            type="text"
            placeholder="Value"
            value={header.value}
            onChange={(e) => {
              const newHeaders = [...api.headers];
              newHeaders[index].value = e.target.value;
              updateApiState(activeFolderId, activeApiId, { headers: newHeaders });
            }}
            className={`flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent ${
              isAutoManaged 
                ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700' 
                : 'bg-white dark:bg-zinc-900 border-gray-300 dark:border-gray-600'
            }`}
            readOnly={isContentType && api.body?.type !== 'none' && api.body?.content?.trim()}
          />
          {!isAutoManaged && (
          <button
            onClick={() => {
              const newHeaders = api.headers.filter((_, i) => i !== index);
              updateApiState(activeFolderId, activeApiId, { headers: newHeaders });
            }}
              className="p-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors duration-150"
              title="Remove header"
          >
            <X className="w-5 h-5" />
          </button>
          )}
          {isAutoManaged && (
            <div className="p-2 text-gray-300 dark:text-gray-600" title={isContentType ? "Auto-managed header - will be removed when body is cleared" : "Predefined headers cannot be deleted"}>
              <X className="w-5 h-5 opacity-30" />
            </div>
          )}
        </div>
      );
    })}
    <button
      onClick={() => updateApiState(activeFolderId, activeApiId, {
        headers: [...api.headers, { key: '', value: '' }]
      })}
      className="flex items-center space-x-2 text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300 font-medium text-sm transition-colors duration-150"
    >
      <Plus className="w-4 h-4" />
      <span>Add Header</span>
    </button>
  </div>
)}{activeTab === 'settings' && (
  <div className="p-5 space-y-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800 min-h-full">
    {/* Request Settings */}
    <div className="group">
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-1 h-5 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Request Settings</h3>
      </div>
      
      <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 space-y-3 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between py-1.5">
          <div className="pl-2">
            <div className="flex items-center space-x-2.5">
              <input
                type="checkbox"
                id="followRedirects"
                checked={api.settings?.followRedirects ?? true}
                onChange={(e) => updateApiState(activeFolderId, activeApiId, {
                  settings: { ...api.settings, followRedirects: e.target.checked }
                })}
                className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 accent-purple-600"
              />
              <label htmlFor="followRedirects" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Follow Redirects
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-700">
          <div className="pl-2">
            <div className="flex items-center space-x-2.5">
              <input
                type="checkbox"
                id="sslVerification"
                checked={api.settings?.sslVerification ?? true}
                onChange={(e) => updateApiState(activeFolderId, activeApiId, {
                  settings: { ...api.settings, sslVerification: e.target.checked }
                })}
                className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 accent-purple-600"
              />
              <label htmlFor="sslVerification" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                SSL Certificate Verification
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between py-1.5 border-t border-gray-100 dark:border-gray-700">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 pl-2">Request Timeout</label>
          <div className="flex items-center space-x-3">
            <input
              type="number"
              value={api.settings?.timeout ?? 0}
              onChange={(e) => updateApiState(activeFolderId, activeApiId, {
                settings: { ...api.settings, timeout: parseInt(e.target.value) }
              })}
              className="w-24 px-3 py-2 bg-gray-50 dark:bg-zinc-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-purple-400"
              min="0"
            />
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded-md">ms</span>
          </div>
        </div>
      </div>
    </div>

    {/* Default Headers Settings */}
    <div className="group">
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-1 h-5 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Default Headers</h3>
      </div>
      
      <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 space-y-3 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between py-1.5">
          <div className="pl-2">
            <div className="flex items-center space-x-2.5">
              <input
                type="checkbox"
                id="enableUserAgent"
                checked={api.settings?.enableUserAgent !== false}
                onChange={(e) => {
                  const newSettings = { ...api.settings, enableUserAgent: e.target.checked };
                  updateApiState(activeFolderId, activeApiId, { settings: newSettings });
                  // Also save to global localStorage for future API creation
                  const globalSettings = loadDefaultHeaderSettings();
                  saveDefaultHeaderSettings({ ...globalSettings, enableUserAgent: e.target.checked });
                }}
                className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 accent-purple-600"
              />
              <label htmlFor="enableUserAgent" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                User-Agent Header
              </label>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 pl-6 mt-1">Adds "User-Agent: Authrator-Client" to requests</p>
          </div>
        </div>

        <div className="flex items-center justify-between py-1.5 border-t border-gray-100 dark:border-gray-700">
          <div className="pl-2">
            <div className="flex items-center space-x-2.5">
              <input
                type="checkbox"
                id="enableCacheControl"
                checked={api.settings?.enableCacheControl !== false}
                onChange={(e) => {
                  const newSettings = { ...api.settings, enableCacheControl: e.target.checked };
                  updateApiState(activeFolderId, activeApiId, { settings: newSettings });
                  // Also save to global localStorage for future API creation
                  const globalSettings = loadDefaultHeaderSettings();
                  saveDefaultHeaderSettings({ ...globalSettings, enableCacheControl: e.target.checked });
                }}
                className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 accent-purple-600"
              />
              <label htmlFor="enableCacheControl" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Cache-Control Header
              </label>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 pl-6 mt-1">Adds "Cache-Control: no-cache" to prevent caching</p>
          </div>
        </div>

        <div className="flex items-center justify-between py-1.5 border-t border-gray-100 dark:border-gray-700">
          <div className="pl-2">
            <div className="flex items-center space-x-2.5">
              <input
                type="checkbox"
                id="enableConnection"
                checked={api.settings?.enableConnection !== false}
                onChange={(e) => {
                  const newSettings = { ...api.settings, enableConnection: e.target.checked };
                  updateApiState(activeFolderId, activeApiId, { settings: newSettings });
                  // Also save to global localStorage for future API creation
                  const globalSettings = loadDefaultHeaderSettings();
                  saveDefaultHeaderSettings({ ...globalSettings, enableConnection: e.target.checked });
                }}
                className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 accent-purple-600"
              />
              <label htmlFor="enableConnection" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Connection Keep-Alive Header
              </label>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 pl-6 mt-1">Adds "Connection: keep-alive" for faster requests</p>
          </div>
        </div>
      </div>
    </div>

    {/* Response Settings */}
    <div className="group">
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-1 h-5 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Response Settings</h3>
      </div>
      
              <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 space-y-3 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between py-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 pl-2">Response Size Limit</label>
          <div className="flex items-center space-x-3">
            <input
              type="number"
              value={api.settings?.responseSizeLimit ?? 50}
              onChange={(e) => updateApiState(activeFolderId, activeApiId, {
                settings: { ...api.settings, responseSizeLimit: parseInt(e.target.value) }
              })}
              className="w-24 px-3 py-2 bg-gray-50 dark:bg-zinc-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-purple-400"
              min="1"
            />
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded-md">MB</span>
          </div>
        </div>

        <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-700">
          <div className="pl-2">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="saveResponses"
                checked={api.settings?.saveResponses ?? true}
                onChange={(e) => updateApiState(activeFolderId, activeApiId, {
                  settings: { ...api.settings, saveResponses: e.target.checked }
                })}
                className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 accent-purple-600"
              />
              <label htmlFor="saveResponses" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Save Response History
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Proxy Settings */}
    <div className="group">
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-1 h-5 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Proxy Settings</h3>
      </div>
      
              <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 space-y-3 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between py-2">
          <div className="pl-2">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="enableProxy"
                checked={api.settings?.enableProxy ?? false}
                onChange={(e) => updateApiState(activeFolderId, activeApiId, {
                  settings: { ...api.settings, enableProxy: e.target.checked }
                })}
                className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 accent-purple-600"
              />
              <label htmlFor="enableProxy" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Enable Proxy
              </label>
            </div>
          </div>
        </div>

        {api.settings?.enableProxy && (
          <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700 bg-gradient-to-r from-purple-50/50 to-transparent dark:from-purple-900/10 dark:to-transparent rounded-lg p-4 -m-1">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">Proxy URL</label>
              <input
                type="text"
                value={api.settings?.proxyUrl ?? ''}
                onChange={(e) => updateApiState(activeFolderId, activeApiId, {
                  settings: { ...api.settings, proxyUrl: e.target.value }
                })}
                placeholder="http://proxy-server:port"
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-purple-400 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="pl-2">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="proxyAuth"
                    checked={api.settings?.proxyAuth ?? false}
                    onChange={(e) => updateApiState(activeFolderId, activeApiId, {
                      settings: { ...api.settings, proxyAuth: e.target.checked }
                    })}
                    className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 accent-purple-600"
                  />
                  <label htmlFor="proxyAuth" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Proxy Authentication
                  </label>
                </div>
              </div>
            </div>

            {api.settings?.proxyAuth && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50/30 to-transparent dark:from-purple-900/20 dark:to-transparent rounded-lg p-4 -m-1">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">Username</label>
                  <input
                    type="text"
                    value={api.settings?.proxyUsername ?? ''}
                    onChange={(e) => updateApiState(activeFolderId, activeApiId, {
                      settings: { ...api.settings, proxyUsername: e.target.value }
                    })}
                    placeholder="Username"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-purple-400 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">Password</label>
                  <input
                    type="password"
                    value={api.settings?.proxyPassword ?? ''}
                    onChange={(e) => updateApiState(activeFolderId, activeApiId, {
                      settings: { ...api.settings, proxyPassword: e.target.value }
                    })}
                    placeholder="Password"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-purple-400 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
)}

{activeTab === 'scripts' && (
  <div className="flex flex-col space-y-2 p-6 font-sans">
 
    <div className="flex space-x-3 bg-gray-100 dark:bg-zinc-800 p-1.5 rounded-lg w-fit">
      <button
        onClick={() => setScriptType('pre-request')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
          scriptType === 'pre-request'
            ? 'bg-white dark:bg-zinc-700 text-purple-600 dark:text-purple-400 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
        }`}
      >
        Pre-request Script
      </button>
      <button
        onClick={() => setScriptType('test')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
          scriptType === 'test'
            ? 'bg-white dark:bg-zinc-700 text-purple-600 dark:text-purple-400 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
        }`}
      >
        Tests
      </button>
    </div>

    <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 ml-3">
            {scriptType === 'pre-request' ? 'Pre-request Script' : 'Test Script'}
          </span>
        </div>
      </div>
      <textarea
        value={scriptType === 'pre-request' ? api.scripts.preRequest : api.scripts.tests}
        onChange={(e) => {
          const newScripts = { ...api.scripts };
          if (scriptType === 'pre-request') {
            newScripts.preRequest = e.target.value;
          } else {
            newScripts.tests = e.target.value;
          }
          updateApiState(activeFolderId, activeApiId, { scripts: newScripts });
        }}
        className="w-full h-64 p-4 font-mono text-sm bg-white dark:bg-zinc-900 text-gray-800 dark:text-gray-200 focus:outline-none"
        placeholder={scriptType === 'pre-request' 
          ? "// Pre-request script example:\nauth.environment.set('timestamp', Date.now());"
          : "// Test script example:\nauth.test('Status test', () => {\n  auth.response.to.have.status(200);\n});"
        }
        spellCheck="false"
      />
    </div>

    <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700">
      <div className="flex justify-between items-center px-4 py-2 bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Console</span>
        </div>
        <button
          onClick={clearConsole}
          className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-150"
        >
          Clear Console
        </button>
      </div>
      <div className="h-40 overflow-auto p-4 font-mono text-sm bg-white dark:bg-zinc-900">
        {consoleOutput.map((log, index) => (
          <div
            key={index}
            className={`mb-1.5 flex items-start space-x-2 ${
              log.type === 'error'
                ? 'text-red-500 dark:text-red-400'
                : log.type === 'success'
                ? 'text-green-500 dark:text-green-400'
                : 'text-purple-500 dark:text-purple-400'
            }`}
          >
            <span className="select-none">›</span>
            <span className="flex-1">{log.message}</span>
          </div>
        ))}
      </div>
    </div>

    <button
      onClick={runScript}
      className="flex items-center justify-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white rounded-lg transition-colors duration-150 font-medium text-sm w-full sm:w-auto"
    >
      <Play className="w-4 h-4" />
      <span>Run Script</span>
    </button>
  </div>
)}
{activeTab === 'body' && (
  <div className="space-y-4">
    <select
      value={api.body.type}
      onChange={(e) => updateApiState(activeFolderId, activeApiId, {
        body: { ...api.body, type: e.target.value }
      })}
      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
    >
      <option value="none">None</option>
      <option value="raw">Raw</option>
      <option value="formData">Form Data</option>
      <option value="urlencoded">x-www-form-urlencoded</option>
    </select>

    {api.body.type === 'raw' && (
      <div className="space-y-3">
        {/* Format Selection Dropdown */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Format:</label>
          <select
            value={api.body.rawFormat || 'json'}
            onChange={(e) => updateApiState(activeFolderId, activeApiId, {
              body: { ...api.body, rawFormat: e.target.value }
            })}
            className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
          >
            <option value="json">JSON</option>
            <option value="text">Text</option>
            <option value="xml">XML</option>
          </select>
        </div>

        {/* Enhanced Raw Body Editor */}
        <div className="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
          {(api.body.rawFormat || 'json') === 'json' ? (
            <div className="relative">
              {/* JSON Editor with highlighting */}
              <div className="bg-white dark:bg-zinc-900">
                <textarea
                  value={api.body.content}
                  onChange={(e) => {
                    updateApiState(activeFolderId, activeApiId, {
                      body: { ...api.body, content: e.target.value }
                    });
                  }}
                  placeholder={`{
  "key": "value",
  "number": 123,
  "boolean": true,
  "array": [1, 2, 3],
  "nested": {
    "property": "value"
  }
}`}
                  className="w-full h-64 px-4 py-3 bg-transparent text-sm font-mono focus:outline-none resize-none"
                  style={{
                    lineHeight: '1.5',
                    tabSize: 2,
                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
                  }}
                />
              </div>
              
              {/* JSON Preview (if valid JSON) */}
              {api.body.content && (() => {
                try {
                  const parsedJson = JSON.parse(api.body.content);
                  return (
                    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-zinc-800 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">JSON Preview</span>
                        <button
                          onClick={() => {
                            try {
                              const formatted = JSON.stringify(parsedJson, null, 2);
                              updateApiState(activeFolderId, activeApiId, {
                                body: { ...api.body, content: formatted }
                              });
                            } catch (e) {
                              // Handle formatting error
                            }
                          }}
                          className="px-2 py-1 text-xs bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-700 dark:text-purple-300 rounded"
                        >
                          Format JSON
                        </button>
                      </div>
                      <div className="max-h-32 overflow-auto">
                        <EnhancedJsonViewer data={parsedJson} />
                      </div>
                    </div>
                  );
                } catch (e) {
                  if (api.body.content.trim()) {
                    return (
                      <div className="border-t border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="text-xs text-red-600 dark:text-red-400">Invalid JSON: {e.message}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }
              })()}
            </div>
          ) : (
            /* Text/XML Editor */
      <textarea
        value={api.body.content}
        onChange={(e) => updateApiState(activeFolderId, activeApiId, {
          body: { ...api.body, content: e.target.value }
        })}
              placeholder={
                (api.body.rawFormat || 'json') === 'xml' 
                  ? '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <element>value</element>\n</root>'
                  : 'Enter raw text content here...'
              }
              className="w-full h-64 px-4 py-3 bg-white dark:bg-zinc-900 text-sm font-mono focus:outline-none resize-none"
              style={{
                lineHeight: '1.5',
                tabSize: 2,
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
              }}
            />
          )}
        </div>
        
        {/* Body Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
          <span>
            {api.body.content ? `${api.body.content.length} characters` : 'No content'}
          </span>
          {api.body.content && (
            <span>
              {api.body.content.split('\n').length} lines
            </span>
          )}
        </div>
      </div>
    )}

    {api.body.type === 'formData' && (
      <div className="space-y-3">
        {api.body.formData.map((item, index) => (
          <div key={index} className="flex space-x-2">
            <input
              type="text"
              placeholder="Key"
              value={item.key}
              onChange={(e) => {
                const newFormData = [...api.body.formData];
                newFormData[index].key = e.target.value;
                updateApiState(activeFolderId, activeApiId, {
                  body: { ...api.body, formData: newFormData }
                });
              }}
              className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Value"
              value={item.value}
              onChange={(e) => {
                const newFormData = [...api.body.formData];
                newFormData[index].value = e.target.value;
                updateApiState(activeFolderId, activeApiId, {
                  body: { ...api.body, formData: newFormData }
                });
              }}
              className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
            />
            <button
              onClick={() => {
                const newFormData = api.body.formData.filter((_, i) => i !== index);
                updateApiState(activeFolderId, activeApiId, {
                  body: { ...api.body, formData: newFormData }
                });
              }}
              className="p-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors duration-150"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ))}
        <button
          onClick={() => updateApiState(activeFolderId, activeApiId, {
            body: {
              ...api.body,
              formData: [...api.body.formData, { key: '', value: '' }]
            }
          })}
          className="flex items-center space-x-2 text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300 font-medium text-sm transition-colors duration-150"
        >
          <Plus className="w-4 h-4" />
          <span>Add Form Field</span>
        </button>
      </div>
    )}

    {api.body.type === 'urlencoded' && (
      <div className="space-y-3">
        {api.body.urlencoded.map((item, index) => (
          <div key={index} className="flex space-x-2">
            <input
              type="text"
              placeholder="Key"
              value={item.key}
              onChange={(e) => {
                const newUrlencoded = [...api.body.urlencoded];
                newUrlencoded[index].key = e.target.value;
                updateApiState(activeFolderId, activeApiId, {
                  body: { ...api.body, urlencoded: newUrlencoded }
                });
              }}
              className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Value"
              value={item.value}
              onChange={(e) => {
                const newUrlencoded = [...api.body.urlencoded];
                newUrlencoded[index].value = e.target.value;
                updateApiState(activeFolderId, activeApiId, {
                  body: { ...api.body, urlencoded: newUrlencoded }
                });
              }}
              className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
            />
            <button
              onClick={() => {
                const newUrlencoded = api.body.urlencoded.filter((_, i) => i !== index);
                updateApiState(activeFolderId, activeApiId, {
                  body: { ...api.body, urlencoded: newUrlencoded }
                });
              }}
              className="p-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors duration-150"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ))}
        <button
          onClick={() => updateApiState(activeFolderId, activeApiId, {
            body: {
              ...api.body,
              urlencoded: [...api.body.urlencoded, { key: '', value: '' }]
            }
          })}
          className="flex items-center space-x-2 text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300 font-medium text-sm transition-colors duration-150"
        >
          <Plus className="w-4 h-4" />
          <span>Add URL Encoded Field</span>
        </button>
      </div>
    )}
  </div>
)}
        </div>
        <ResponsePanel api={api} />
    </div>
  );
};

useEffect(() => {
  // Listen for auth success events from electron
  const handleAuthSuccess = () => {
    console.log('Auth success event received in Dashboard');
    // Ensure we're showing dashboard content
    setActiveSection('collections');
    
    // Clear any pending auth state
    const authTimestamp = localStorage.getItem('auth_success_timestamp');
    if (authTimestamp) {
      // Only clear if it's older than 5 minutes to avoid clearing during initial load
      const now = Date.now();
      const timestamp = parseInt(authTimestamp, 10);
      if (now - timestamp > 5 * 60 * 1000) {
        localStorage.removeItem('auth_success_timestamp');
      }
    }
    
    // Check if we need to ensure default tab after auth
    const ensureDefaultTabFlag = localStorage.getItem('ensure_default_tab');
    if (ensureDefaultTabFlag === 'true') {
      localStorage.removeItem('ensure_default_tab');
      setTimeout(() => forceCreateDefaultTab(), 200);
    }
  };
  
  window.addEventListener('auth_success_event', handleAuthSuccess);
  
  // Initial check for auth success timestamp or ensure default tab flag
  const authTimestamp = localStorage.getItem('auth_success_timestamp');
  const ensureDefaultTabFlag = localStorage.getItem('ensure_default_tab');
  
  if (authTimestamp) {
    handleAuthSuccess();
  } else if (ensureDefaultTabFlag === 'true') {
    localStorage.removeItem('ensure_default_tab');
    setTimeout(() => forceCreateDefaultTab(), 200);
  }
  
  return () => {
    window.removeEventListener('auth_success_event', handleAuthSuccess);
  };
}, []);

// The keyboard shortcut functionality is now directly on the URL input field

return (
  <div className={`h-screen flex flex-col dashboard-compact ${isDarkMode ? 'dark' : ''}`}>

      <header className="h-12 flex-shrink-0 bg-gray-100 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center">
            {isMobile && (
              <button
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                className="mr-4"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}
            <div className="flex flex-col">
              <h1 className="bg-gradient-to-r from-purple-800 via-purple-600 to-purple-500 inline-block text-transparent bg-clip-text text-2xl font-extrabold">
                Authrator
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Environment Selector Dropdown */}
            <div className="relative">
              <button 
                className="flex items-center space-x-2 py-1 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-zinc-700 hover:bg-gray-100 dark:hover:bg-gray-650 text-sm"
                onClick={() => setShowEnvironmentDropdown(!showEnvironmentDropdown)}
                title="Environment selector"
              >
                <Database className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-gray-800 dark:text-gray-200 max-w-[100px] truncate">
                  {activeEnvironment ? activeEnvironment.name : 'No Environment'}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
              
              {showEnvironmentDropdown && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md shadow-lg z-50">
                  <div className="p-2 border-b border-gray-200 dark:border-zinc-700">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Environments</span>
                      <button 
                        onClick={() => {
                          setShowEnvironmentDropdown(false);
                          setActiveSection('environments');
                        }}
                        className="text-xs text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto py-1">
                    <button
                      className={`flex items-center w-full px-4 py-2 text-sm ${
                        !activeEnvironment ? 'bg-purple-50 dark:bg-zinc-900/20 text-purple-600 dark:text-purple-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750'
                      }`}
                      onClick={() => {
                        setActiveEnvironment(null);
                        setShowEnvironmentDropdown(false);
                      }}
                    >
                      <span className="flex-1 text-left">No Environment</span>
                      {!activeEnvironment && <Check className="w-4 h-4" />}
                    </button>
                    
                    {environments.map(env => (
                      <button
                        key={env.id}
                        className={`flex items-center w-full px-4 py-2 text-sm ${
                          activeEnvironment?.id === env.id ? 'bg-purple-50 dark:bg-zinc-900/20 text-purple-600 dark:text-purple-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750'
                        }`}
                        onClick={() => {
                          handleEnvironmentChange(env);
                          setShowEnvironmentDropdown(false);
                        }}
                      >
                        <span className="flex-1 text-left">{env.name}</span>
                        {activeEnvironment?.id === env.id && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                  <div className="p-2 border-t border-gray-200 dark:border-zinc-700">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      <Globe className="w-3 h-3 inline mr-1" />
                      Global variables are always available
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={createNewFolder}
                className="p-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 text-white rounded-md flex items-center text-sm relative group"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                <span className="hidden sm:inline">New Collection</span>
                <div className="absolute invisible opacity-0 bottom-[-40px] left-1/2 -translate-x-1/2 -translate-y-2 scale-90 origin-top whitespace-nowrap bg-gray-800 dark:bg-purple-800 text-white text-xs py-2 px-3 rounded z-50 transition-all duration-300 ease-in-out group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 before:content-[''] before:absolute before:bottom-full before:left-1/2 before:-translate-x-1/2 before:border-[6px] before:border-transparent before:border-b-gray-800 dark:before:border-b-purple-800">
  Create New Collection
</div>
              </button>
              
            </div>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-purple-400" />}
            </button>
            {isElectronOffline() && (
              <div className="ml-2 inline-flex items-center p-1.5 rounded-md">
                <WifiOff className="w-4 h-4 text-yellow-600 dark:text-yellow-400" title="Offline Mode" />
              </div>
            )}
            {!isElectronOffline() && isLoggedIn && (
              <button
                onClick={handleSignOut}
                className="p-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 text-white rounded-md flex items-center text-sm"
              >
                Sign Out
              </button>
            )}
            {!isElectronOffline() && !isLoggedIn && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleLoginClick}
                  className="p-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition duration-200 text-sm"
                >
                  Login
                </button>
                <button
                  onClick={handleSignupClick}
                  className="p-1.5 px-3 py-1.5 border border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/20 transition duration-200 text-sm"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <ApiTabs 
        collections={collections}
        activeFolderId={activeFolderId}
        activeSubfolderId={activeSubfolderId}
        activeApiId={activeApiId}
        createNewApi={createNewApi}
        createNewApiInSubfolder={createNewApiInSubfolder}
        openNewTab={openNewTab}
        closeTab={closeTab}
        openTabs={openTabs}
        setActiveSection={setActiveSection}
        setIsPerformanceTesting={setIsPerformanceTesting}
        openRenameModal={openRenameModal}
        moveApiToCollection={moveApiToCollection}
        moveApiToSubfolder={moveApiToSubfolder}
        setCollections={setCollections}
        setActiveApiId={setActiveApiId}
        setActiveSubfolderId={setActiveSubfolderId}
        setOpenTabs={setOpenTabs}
      />
  
  
      <div className="flex-1 flex overflow-hidden">
     
        {isMobile ? (
         
          <div className={`
            fixed inset-y-0 left-0 z-50 w-64
            ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            transition-transform duration-300 ease-in-out
            bg-gray-50 dark:bg-zinc-900
            flex
          `}>
            
           
            <div className="w-14 flex-shrink-0 bg-gray-100 dark:bg-zinc-800 border-r border-gray-200 dark:border-zinc-700">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    if (item.id === 'collections' || item.id === 'environments' || item.id === 'history' || item.id === 'settings') {
                     
                    } else {
                      setIsMobileSidebarOpen(false);
                    }
                  }}
                  className={`
                    w-full p-3 flex items-center justify-center relative group
                    ${activeSection === item.id ? 'bg-purple-50 dark:bg-zinc-900 dark:text-white' : ''}
                    hover:bg-gray-200 dark:hover:bg-zinc-700 dark:text-white
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  <div class="absolute invisible opacity-0 top-1/2 left-[calc(100%+15px)] -translate-y-1/2 -translate-x-2 scale-90 origin-left whitespace-nowrap bg-gray-800 dark:bg-purple-600  text-white text-sm py-2 px-3 rounded z-10 transition-all duration-300 ease-in-out group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100 before:content-[''] before:absolute before:top-1/2 before:right-full before:-translate-y-1/2 before:border-[6px] before:border-transparent before:border-r-gray-800">
  {item.label}
</div>
                </button>
              ))}
            </div>

            
            <div className="flex-1 overflow-y-auto dark:text-white">
              {renderSidebarContent()}
            </div>
          </div>
        ) : (
        <ResizableBox
          width={isLeftSidebarCollapsed ? MIN_LEFT_SIDEBAR_WIDTH : leftSidebarWidth}
          height={Infinity}
          minConstraints={[MIN_LEFT_SIDEBAR_WIDTH, Infinity]}
          maxConstraints={[MAX_LEFT_SIDEBAR_WIDTH, Infinity]}
          onResize={handleLeftResize}
          axis="x"
          handle={
            <div className="w-1 cursor-col-resize hover:bg-purple-500 active:bg-purple-600 ">
                 <div className="w-1 h-full bg-gray-200 dark:bg-zinc-700 hover:bg-purple-400 active:bg-purple-400 hover:dark:bg-purple-500 hover:dark:active:bg-purple-600" />
            </div>
          }
          className={`
            ${isMobile ? (isMobileSidebarOpen ? 'fixed inset-y-0 left-0 z-50' : 'hidden') : 'relative'}
            flex
            bg-gray-50 dark:bg-zinc-900
            transform transition-transform duration-300
            ${isLeftSidebarCollapsed ? 'translate-x-0' : ''}
          `}
        >
        
          <div className="w-14 flex-shrink-0 bg-gray-100 dark:bg-zinc-800 border-r border-gray-200 dark:border-zinc-700">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`
                  w-full p-3 flex items-center justify-center relative group
                  ${activeSection === item.id ? 'bg-purple-200 dark:bg-zinc-900 dark:text-white' : ''}
                  hover:bg-gray-200 dark:hover:bg-zinc-700 dark:text-white
                `}
              >
                <item.icon className="w-5 h-5" />
                <div class="absolute invisible opacity-0 top-1/2 left-[calc(100%+15px)] -translate-y-1/2 -translate-x-2 scale-90 origin-left whitespace-nowrap bg-gray-800 dark:bg-purple-600  text-white text-sm py-2 px-3 rounded z-10 transition-all duration-300 ease-in-out group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100 before:content-[''] before:absolute before:top-1/2 before:right-full before:-translate-y-1/2 before:border-[6px] before:border-transparent before:border-r-gray-800 dark:before:border-r-purple-600">
  {item.label}
</div>
              </button>
            ))}
          </div>

         
          <div className="flex-1 overflow-y-auto dark:text-white">
            {renderSidebarContent()}
          </div>
        </ResizableBox>
      )}

        {/* Main Panel */}
      {/* Main Panel */}
<main className="flex-1 bg-white dark:bg-zinc-800 overflow-auto">
  {activeSection === 'authTemplates' ? (
    <AuthTemplateManager 
      onClose={() => setActiveSection(null)}
      dbTemplates={dbTemplates}
    />
  ) : activeSection === 'environments' ? (
    <EnvironmentManagementPanel 
      environments={environments}
      activeEnvironment={activeEnvironment}
      onEnvChange={handleEnvironmentChange}
      onAddEnv={handleAddEnvironment}
      onDeleteEnv={handleDeleteEnvironment}
      onUpdateEnv={handleUpdateEnvironment}
      onClose={() => setActiveSection(null)}
    />
  ) : activeSection === 'history' ? (
  <RequestHistoryPanel 
    collections={collections}
    openRequestInTab={openRequestInTab}
  />
  ) : isPerformanceTesting ? (
    <div style={{ display: 'block', width: '100%' }}>
      <PerformanceTestingPanel
        collections={collections}
        activeEnvironment={activeEnvironment}
        onClose={() => {
          setIsPerformanceTesting(false);
          setIsPerformanceTabActive(false);
        }}
        initialApi={performanceTestingState.initialApi}
        initialCollection={performanceTestingState.initialCollection}
        isActive={isPerformanceTabActive}
        onTestStatusChange={handlePerformanceTestStatusChange}
        onResultsUpdate={(results) => setPerformanceTestingState(prev => ({ ...prev, results }))}
        savedResults={performanceTestingState.results}
      />
    </div>
  ) : activeFolderId && activeApiId ? (
    renderRequestPanel()
  ) : (
    <div className="flex flex-col items-center justify-center h-full">
      <span className="text-8xl mb-5">🚀</span>
      <Send className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
      <p className="text-gray-500 dark:text-gray-400">Select a request or create a new one</p>
    </div>
  )}
</main>
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      {/* Modals */}
      <RenameModal 
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        itemName={itemName}
        itemType={itemType}
        onRename={handleRenameSubmit}
        selectedColor={selectedColor}
        onColorSelect={setSelectedColor}
      />
        
       

        {!isMobile && (
          <ResizableBox
            width={isRightSidebarCollapsed ? 55 : rightSidebarWidth}
            height={Infinity}
            minConstraints={[55, Infinity]}
            maxConstraints={[500, Infinity]}
            onResize={handleRightResize}
            axis="x"
            handle={
              <div className="w-1 cursor-col-resize hover:bg-purple-500 active:bg-purple-600  absolute left-0 top-0 bottom-0">
                <div className="w-1 h-full bg-gray-200 dark:bg-zinc-700 hover:bg-purple-400 active:bg-purple-400 hover:dark:bg-purple-500 hover:dark:active:bg-purple-600" />
              </div>
            }
            resizeHandles={['w']}
            className={`
              relative flex
              bg-gray-50 dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-700
              transform transition-transform duration-300
              ${isRightSidebarCollapsed ? 'w-[55px]' : ''}
            `}
          >
            <div className="flex flex-row h-full w-full">
              <div className="w-14 flex-shrink-0 bg-gray-100 dark:bg-zinc-800 border-r border-gray-200 dark:border-zinc-700 relative">
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    {rightNavigationItems.filter(item => item.id !== 'info').map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveRightSection(item.id);
                          
                          // Only expand if it's currently collapsed
                          if (isRightSidebarCollapsed) {
                            setIsRightSidebarCollapsed(false);
                            setRightSidebarWidth(280);
                          }
                        }}
                        className={`
                          w-full p-3 flex items-center justify-center relative group
                          ${activeRightSection === item.id ? 'bg-purple-200 dark:bg-zinc-900 dark:text-white' : ''}
                          hover:bg-gray-200 dark:hover:bg-zinc-700 dark:text-white
                        `}
                        title={item.label}
                      >
                        <item.icon className="w-5 h-5" />
                        <div class="absolute invisible opacity-0 top-1/2 right-[calc(100%+15px)] -translate-y-1/2 translate-x-2 scale-90 origin-right whitespace-nowrap bg-gray-800 dark:bg-purple-600  text-white text-sm py-2 px-3 rounded z-10 transition-all duration-300 ease-in-out group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100 before:content-[''] before:absolute before:top-1/2 before:left-full before:-translate-y-1/2 before:border-[6px] before:border-transparent before:border-l-gray-800 dark:before:border-l-purple-600">
  {item.label}
</div>
                      </button>
                    ))}
                  </div>
                  
                  {/* Info button at bottom with separator */}
                  <div className="mt-auto">
                    <div className="w-full h-px bg-gray-200 dark:bg-zinc-700 my-2"></div>
                    {rightNavigationItems.filter(item => item.id === 'info').map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveRightSection(item.id);
                          
                          // Only expand if it's currently collapsed
                          if (isRightSidebarCollapsed) {
                            setIsRightSidebarCollapsed(false);
                            setRightSidebarWidth(280);
                          }
                        }}
                        className={`
                          w-full p-3 flex items-center justify-center relative group
                          ${activeRightSection === item.id ? 'bg-purple-200 dark:bg-zinc-900 dark:text-white' : ''}
                          hover:bg-gray-200 dark:hover:bg-zinc-700 dark:text-white
                        `}
                        title={item.label}
                      >
                        <item.icon className="w-5 h-5" />
                        <div class="absolute invisible opacity-0 top-1/2 right-[calc(100%+15px)] -translate-y-1/2 translate-x-2 scale-90 origin-right whitespace-nowrap bg-gray-800 dark:bg-purple-600  dark text-white text-sm py-2 px-3 rounded z-10 transition-all duration-300 ease-in-out group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100 before:content-[''] before:absolute before:top-1/2 before:left-full before:-translate-y-1/2 before:border-[6px] before:border-transparent before:border-l-gray-800 dark:before:border-l-purple-600 ">
  {item.label}
</div>
                      </button>
                    ))}
                    
                    <div className="w-full h-px bg-gray-200 dark:bg-zinc-700 my-2"></div>
                    
                    <button 
                      onClick={toggleRightSidebar}
                      className="w-full p-3 flex items-center justify-center relative group hover:bg-gray-200 dark:hover:bg-zinc-700 dark:text-white"
                    >
                      {isRightSidebarCollapsed ? 
                        <ChevronRight className="w-5 h-5" /> : 
                        <ChevronLeft className="w-5 h-5" />
                      }
                      <div class="absolute invisible opacity-0 top-1/2 right-[calc(100%+15px)] -translate-y-1/2 translate-x-2 scale-90 origin-right whitespace-nowrap bg-gray-800 dark:bg-purple-600 text-white text-sm py-2 px-3 rounded z-10 transition-all duration-300 ease-in-out group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100 before:content-[''] before:absolute before:top-1/2 before:left-full before:-translate-y-1/2 before:border-[6px] before:border-transparent before:border-l-gray-800 dark:before:border-l-purple-600">
                      {isRightSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
</div>

                    </button>
                  </div>
                </div>
              </div>

              {!isRightSidebarCollapsed && (
                <div className="flex-1 overflow-hidden">
                  {activeRightSection === 'code' && (
                    <div className="h-full p-4">
                      {/* <h2 className="text-lg font-semibold mb-4 dark:text-white">Code</h2> */}
                      
                    </div>
                  )}
                  {activeRightSection === 'details' && (
                    <div className="h-full p-4">
                      {/* <h2 className="text-lg font-semibold mb-4 dark:text-white">Request Details</h2> */}
                      {/* Add request details content here */}
                    </div>
                  )}
                  {activeRightSection === 'comments' && (
                    <div className="h-full p-4">
                      {/* <h2 className="text-lg font-semibold mb-4 dark:text-white">Comments</h2> */}
                      {/* Add comments content here */}
                    </div>
                  )}
                  {activeRightSection === 'importExport' && (
                    <div className="h-full overflow-y-auto">
                      <PostmanImportExport
                        collections={collections.filter(c => c.id !== 'temp-99999')}
                        onImportCollections={handleImportCollections}
                        onShowMessage={showToastMessage}
                        isDarkMode={isDarkMode}
                        isElectron={isElectron()}
                        isOffline={isElectronOffline()}
                      />
                    </div>
                  )}
                  {activeRightSection === 'jwt' && (
                    <div className="h-full p-4">
                      <JwtDecoder />
                    </div>
                  )}
                  {activeRightSection === 'keyGenerator' && (
                    <div className="h-full p-4">
                      <KeyGenerator />
                    </div>
                  )}
                  {activeRightSection === 'desktopDownload' && (
                    <DesktopDownload />
                  )}
                  {activeRightSection === 'info' && (
                    <InfoSection />
                  )}
                </div>
              )}
            </div>
          </ResizableBox>
        )}
      </div>

   
      {isMobile && isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Render the JWT Decoder component */}
      {/* <JwtDecoder isOpen={isJwtDecoderOpen} onClose={() => setIsJwtDecoderOpen(false)} /> */}
      
      {/* Info Modal */}
      <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} />
      
      {/* Floating Info Button */}
      <button
        onClick={() => setIsInfoModalOpen(true)}
        className="fixed left-3 bottom-10 z-40 w-8 h-8 rounded-full bg-purple-600  shadow-lg flex items-center justify-center text-white hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 hover:shadow-xl"
        aria-label="About Authrator"
      >
        <Info className="w-5 h-5" />
      </button>

      <footer className="h-7 flex-shrink-0 bg-gray-100 dark:bg-zinc-800 border-t border-gray-200 dark:border-zinc-700 relative">
      <div className="flex items-center justify-end h-full px-4 text-xs">
      <p className="bg-gradient-to-r from-purple-800 via-purple-600 to-purple-500 inline-block text-transparent bg-clip-text mr-2 font-extrabold">
                Authrator
              </p>
        {/* <p className="text-purple-400 dark:text-blue-300" style={{ fontFamily: 'Motter Tektura' }}> */}
        <p className="text-purple-400 dark:text-blue-300f font-bold">
         powered by Provayu
        </p>
      </div>
    </footer>

    {/* Show notification when performance test is running in background */}
    {/* <PerformanceTestingNotification 
      isVisible={isPerformanceTestRunning && !isPerformanceTabActive} 
      onClick={handleShowPerformancePanel}
    /> */}

    {/* Import Modal */}
    {isImportModalOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl max-w-md w-full mx-4 animate-modal-slide-in">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
            <div className="flex items-center space-x-3">
              <Upload className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                Import Collection
              </h2>
            </div>
            <button
              onClick={() => setIsImportModalOpen(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-md"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <div className="p-6">
            <PostmanImportExport
              collections={collections.filter(c => c.id !== 'temp-99999')}
              onImportCollections={(importedCollections) => {
                handleImportCollections(importedCollections);
                setIsImportModalOpen(false);
              }}
              onShowMessage={showToastMessage}
              isDarkMode={isDarkMode}
              isElectron={isElectron()}
              isOffline={isElectronOffline()}
            />
          </div>
        </div>
      </div>
    )}
    </div>
    
  );
};

export default App;