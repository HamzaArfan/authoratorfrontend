import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

// Add CSS for vertical guides
const verticalGuideStyle = {
  position: 'absolute',
  width: '1px',
  top: '0',
  bottom: '0',
  backgroundColor: 'rgba(156, 163, 175, 0.2)', // light gray with opacity
  zIndex: 1
};

const EnhancedJsonViewer = ({ data }) => {
  // Parse the JSON if it's a string
  const jsonData = typeof data === 'string' ? JSON.parse(data) : data;
  const [lineNumbers, setLineNumbers] = useState([]);
  const [totalLines, setTotalLines] = useState(1);
  
  // Calculate total lines for the entire JSON
  useEffect(() => {
    if (!jsonData) return;
    
    // Count lines in the formatted JSON
    const calculateLines = (obj, level = 0) => {
      if (obj === null || typeof obj !== 'object') return 1;
      
      let count = 2; // Opening and closing brackets
      
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          count += calculateLines(item, level + 1);
          // Add a line for the comma after each item except the last one
          if (index < obj.length - 1) count += 1;
        });
      } else {
        const entries = Object.entries(obj);
        entries.forEach(([, value], index) => {
          count += calculateLines(value, level + 1);
          // Add a line for the comma after each item except the last one
          if (index < entries.length - 1) count += 1;
        });
      }
      
      return count;
    };
    
    const lines = calculateLines(jsonData);
    setTotalLines(lines);
    
    // Generate array of line numbers
    const lineNumbersArray = Array.from({ length: lines }, (_, i) => i + 1);
    setLineNumbers(lineNumbersArray);
  }, [jsonData]);
  
  return (
    <div className="enhanced-json-viewer font-mono text-sm leading-relaxed overflow-auto">
      <div className="flex">
        {/* Line numbers column */}
        <div className="json-line-numbers select-none">
          {lineNumbers.map(num => (
            <div key={num} className="json-line-number">{num}</div>
          ))}
        </div>
        
        {/* JSON content */}
        <div className="flex-1 relative">
          <JsonNode 
            data={jsonData} 
            level={0} 
            path="root" 
            isRoot={true}
          />
        </div>
      </div>
    </div>
  );
};

const JsonNode = ({ data, level, path, isRoot = false, isLastItem = true }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const nodeRef = useRef(null);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // For primitive values
  if (data === null || typeof data !== 'object') {
    return (
      <div className="whitespace-pre">
        {renderPrimitiveValue(data)}
        {!isLastItem && <span className="text-gray-500 dark:text-gray-400">,</span>}
      </div>
    );
  }

  // For objects and arrays
  const isArray = Array.isArray(data);
  const isEmpty = isArray ? data.length === 0 : Object.keys(data).length === 0;
  const bracketType = isArray ? ['[', ']'] : ['{', '}'];
  
  // If empty, render on a single line
  if (isEmpty) {
    return (
      <div className="whitespace-pre">
        <span className="text-gray-800 dark:text-zinc-300">
          {bracketType[0]}{bracketType[1]}
          {!isLastItem && <span className="text-gray-500 dark:text-gray-400">,</span>}
        </span>
      </div>
    );
  }

  return (
    <div ref={nodeRef}>
      <div className="flex items-center">
        <div 
          className="json-collapse-control"
          onClick={toggleCollapse}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 mr-0.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 mr-0.5" />
          )}
          <span className="text-gray-800 dark:text-zinc-300">{bracketType[0]}</span>
          {isCollapsed && (
            <>
              <span className="text-gray-400 dark:text-gray-500 italic ml-1">
                {isArray ? `${data.length} items` : `${Object.keys(data).length} properties`}
              </span>
              <span className="text-gray-800 dark:text-zinc-300 ml-1">{bracketType[1]}</span>
              {!isLastItem && <span className="text-gray-500 dark:text-gray-400">,</span>}
            </>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <>
          {isArray ? (
            // Render array items
            data.map((item, index) => {
              const itemPath = `${path}[${index}]`;
              const isLast = index === data.length - 1;
              
              return (
                <div key={itemPath} className="relative">
                  <div className="json-guide-line" style={{left: `${level * 16 + 8}px`}}></div>
                  <div className="pl-4" style={{ marginLeft: `${level * 16}px` }}>
                    <JsonNode
                      data={item}
                      level={level + 1}
                      path={itemPath}
                      isLastItem={isLast}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            // Render object properties
            Object.entries(data).map(([key, value], index, entries) => {
              const isLast = index === entries.length - 1;
              const propPath = `${path}.${key}`;
              
              return (
                <div key={propPath} className="relative">
                  <div className="json-guide-line" style={{left: `${level * 16 + 8}px`}}></div>
                  <div className="pl-4" style={{ marginLeft: `${level * 16}px` }}>
                    <div className="flex">
                      <span className="text-purple-600 dark:text-purple-400 mr-1">"{key}"</span>
                      <span className="text-gray-800 dark:text-zinc-300 mr-1">:</span>
                      {typeof value !== 'object' || value === null ? (
                        <>
                          <span>{renderPrimitiveValue(value)}</span>
                          {!isLast && (
                            <span className="text-gray-500 dark:text-gray-400">,</span>
                          )}
                        </>
                      ) : (
                        <div className="flex-1">
                          <JsonNode
                            data={value}
                            level={level + 1}
                            path={propPath}
                            isLastItem={isLast}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          
          <div>
            <div style={{ marginLeft: `${level * 16}px` }}>
              <span className="text-gray-800 dark:text-zinc-300">{bracketType[1]}</span>
              {!isLastItem && <span className="text-gray-500 dark:text-gray-400">,</span>}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const renderPrimitiveValue = (value) => {
  if (value === null) {
    return <span className="text-gray-500 dark:text-zinc-400">null</span>;
  }
  
  switch (typeof value) {
    case 'string':
      // Check if it's a date string
      if (value.match(/^\d{4}-\d{2}-\d{2}T/)) {
        return <span className="text-green-500 dark:text-green-400">"{value}"</span>;
      }
      return <span className="text-teal-500 dark:text-teal-400">"{value}"</span>;
    
    case 'number':
      return <span className="text-indigo-500 dark:text-indigo-400">{value}</span>;
    
    case 'boolean':
      return <span className="text-orange-500 dark:text-orange-400">{String(value)}</span>;
    
    default:
      return <span>{String(value)}</span>;
  }
};

export default EnhancedJsonViewer; 