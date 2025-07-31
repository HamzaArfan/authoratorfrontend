import React, { useState, useEffect } from 'react';
import { Download, ExternalLink, Globe } from 'lucide-react';
import axios from 'axios';
// import AuthratorExe from "./downloads/Authrator-Portable-0.1.0.exe";

const DesktopDownload = () => {
  const [platform, setPlatform] = useState('');

  useEffect(() => {
    // Detect user's operating system
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.indexOf('win') !== -1) {
      setPlatform('windows');
    } else if (userAgent.indexOf('mac') !== -1) {
      setPlatform('mac');
    } else if (userAgent.indexOf('linux') !== -1) {
      setPlatform('linux');
    } else {
      setPlatform('other');
    }
  }, []);

  const handleDownload = async () => {
    try {
      // Track the download event, similar to landing page implementation
      await axios.post('https://authrator.com/db-api/api/stats/download', {
        referrer: document.referrer || 'direct'
      });
    } catch (error) {
      console.error('Error tracking download:', error);
    }
  };

  return (
    <div className="h-full p-4 flex flex-col">
      <h2 className="text-lg font-semibold mb-6 dark:text-white">Download Desktop App</h2>
      
      <div className="space-y-6 flex-1">
        {/* Desktop App Section */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-full">
              <Download className="w-5 h-5 text-purple-500" />
            </div>
            <h3 className="text-base font-medium dark:text-white">Authrator Desktop Client</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            Download our desktop app for an enhanced experience with offline capabilities
          </p>
        {/* <a 
            href={AuthratorExe} 
            download="Authrator-Portable-0.1.0.exe" 
            target="_blank" 
            rel="noreferrer"
            onClick={handleDownload}
            className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded text-sm font-medium transition-colors"
          >
            Download for {platform === 'windows' ? 'Windows' : platform === 'mac' ? 'Mac' : platform === 'linux' ? 'Linux' : 'Desktop'}
            <Download className="w-4 h-4" />
          </a>  */}
        </div>

        {/* Benefits Section */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-full">
              <Globe className="w-5 h-5 text-purple-500" />
            </div>
            <h3 className="text-base font-medium dark:text-white">Why Use Desktop App?</h3>
          </div>
          <ul className="text-sm text-gray-600 dark:text-gray-300 mb-3 list-disc pl-5 space-y-1">
            <li>Work offline when network is unavailable</li>
            <li>Enhanced performance and faster loading</li>
            <li>Integrated with your operating system</li>
            <li>Save and organize your API collections locally</li>
          </ul>
        </div>
      </div>
      
      <div className="mt-auto pt-4 text-center text-xs text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} Authrator. All rights reserved.
      </div>
    </div>
  );
};

export default DesktopDownload; 