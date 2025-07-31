import React from "react";

const Checkbox = ({ checked, onChange, label }) => (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium">{label}</label>
      <div 
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out cursor-pointer ${
          checked ? 'bg-blue-500' : 'bg-gray-300 dark:bg-zinc-600'
        }`}
      >
        <div
          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </div>
    </div>
  );

export default Checkbox;