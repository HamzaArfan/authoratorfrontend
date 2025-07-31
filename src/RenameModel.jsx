import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import ReactDOM from 'react-dom';

const colorPalette = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEEAD', // Yellow
  '#D4A5A5', // Pink
  '#9B59B6', // Purple
  '#E67E22', // Orange
];

const RenameModal = ({ isOpen, onClose, itemName, onRename, itemType, selectedColor, onColorSelect }) => {
  const [name, setName] = React.useState(itemName);
  const [color, setColor] = React.useState(selectedColor || colorPalette[0]);
  
  // Only set the initial name and color when modal opens or name changes intentionally
  React.useEffect(() => {
    if (isOpen) {
      setName(itemName);
    }
  }, [isOpen, itemName]);

  // Update only the color when selectedColor changes
  React.useEffect(() => {
    if (selectedColor) {
      setColor(selectedColor);
    }
  }, [selectedColor]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onRename(name, color);
    onClose();
  };

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Use a portal to render the modal at the root level of the DOM
  return ReactDOM.createPortal(
    <div 
      className="fixed inset-0 z-[9999] overflow-y-auto"
      style={{
        position: 'fixed',
        top: 1,
        left: 0,
        right: 0,
        bottom: 2,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '2rem 0',
        pointerEvents: 'all'
      }}
    >
      <div 
        className="fixed inset-0 bg-black bg-opacity-70" 
        style={{ backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700 relative mt-20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium dark:text-gray-200">
            Rename {itemType === 'collection' ? 'Collection' : 'Request'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
              autoFocus
            />
          </div>

          {itemType === 'collection' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Collection Color
              </label>
              <div className="flex flex-wrap gap-2">
                {colorPalette.map((paletteColor) => (
                  <button
                    key={paletteColor}
                    type="button"
                    onClick={() => {
                      setColor(paletteColor);
                      if (onColorSelect) onColorSelect(paletteColor);
                    }}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      color === paletteColor ? 'border-blue-500 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: paletteColor }}
                  />
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default RenameModal;