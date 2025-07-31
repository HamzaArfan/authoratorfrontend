
import { useState,useRef,useEffect } from "react";

const CustomDropdown = ({ children, trigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
      >
        {trigger}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-1 py-1 w-48 bg-white dark:bg-zinc-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          {children}
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;