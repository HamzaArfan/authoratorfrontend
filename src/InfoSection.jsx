import React, { useEffect } from 'react';
import { ExternalLink, MessageSquare, HelpCircle, MailOpen } from 'lucide-react';

const InfoSection = () => {
  // Initialize Crisp chat when component mounts
  useEffect(() => {
    // Add Crisp Chat script
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = "c2429e36-a021-4af0-84ed-ac1fb7d8ac4f";
    
    const script = document.createElement('script');
    script.src = "https://client.crisp.chat/l.js";
    script.async = true;
    document.head.appendChild(script);

    return () => {
      // Clean up script on unmount if needed
      if (window.$crisp) {
        try {
          window.$crisp.push(["do", "session:reset"]);
        } catch (e) {
          console.error("Error cleaning up Crisp chat", e);
        }
      }
    };
  }, []);

  const openCrispChat = () => {
    if (window.$crisp) {
      window.$crisp.push(["do", "chat:open"]);
    }
  };

  return (
    <div className="h-full p-4 flex flex-col">
      <h2 className="text-lg font-semibold mb-6 dark:text-white">Support & Information</h2>
      
      <div className="space-y-6 flex-1">
        {/* Documentation Section */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-full">
              <HelpCircle className="w-5 h-5 text-purple-500" />
            </div>
            <h3 className="text-base font-medium dark:text-white">Documentation</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            Check our comprehensive documentation for help and guides
          </p>
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

        {/* Feedback Section */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-full">
              <MailOpen className="w-5 h-5 text-purple-500" />
            </div>
            <h3 className="text-base font-medium dark:text-white">Feedback & Feature Requests</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            We'd love to hear your thoughts and suggestions
          </p>
          <a 
            href="mailto:support@authrator.com" 
            className="flex items-center gap-2 text-purple-500 hover:text-purple-600 text-sm font-medium"
          >
            Email us at support@authrator.com
          </a>
        </div>

        {/* Chat Support Section */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-full">
              <MessageSquare className="w-5 h-5 text-purple-500" />
            </div>
            <h3 className="text-base font-medium dark:text-white">Live Chat Support</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            Need immediate assistance? Chat with our support team
          </p>
          <button 
            onClick={openCrispChat}
            className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded text-sm font-medium transition-colors"
          >
            Chat with us
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="mt-auto pt-4 text-center text-xs text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} Authrator. All rights reserved.
      </div>
    </div>
  );
};

export default InfoSection; 