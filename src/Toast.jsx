import React, { useEffect } from 'react';
import { Check, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = type === 'success' 
    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center space-x-2 px-4 py-3 rounded-lg shadow-lg ${bgColor}`}>
      {type === 'success' ? (
        <Check className="w-5 h-5" />
      ) : (
        <X className="w-5 h-5" />
      )}
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

export default Toast; 