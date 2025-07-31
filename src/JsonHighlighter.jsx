import React, { useState, useRef, useEffect } from "react";

const JsonHighlighter = ({ data }) => {
    const [hoveredBrace, setHoveredBrace] = useState(null);
    const [selectedBrace, setSelectedBrace] = useState(null);
    const braceMap = useRef(new Map());

    // Function to preprocess JSON string and create a map of matching braces
    useEffect(() => {
      if (typeof data !== 'string') return;
      
      const braceStack = [];
      const newBraceMap = new Map();
      
      // Parse the JSON string character by character
      for (let i = 0; i < data.length; i++) {
        const char = data[i];
        if (char === '{' || char === '[') {
          braceStack.push({ index: i, type: char });
        } else if (char === '}' || char === ']') {
          if (braceStack.length > 0) {
            const openingBrace = braceStack.pop();
            // Store mapping in both directions
            newBraceMap.set(openingBrace.index, i);
            newBraceMap.set(i, openingBrace.index);
          }
        }
      }
      
      braceMap.current = newBraceMap;
    }, [data]);

    const renderValue = (value) => {
      if (typeof value === 'boolean') {
        return <span className="text-orange-500 dark:text-orange-400">{value.toString()}</span>;
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
      return value;
    };
  
    const handleBraceHover = (index) => {
      if (braceMap.current.has(index)) {
        setHoveredBrace(index);
      } else {
        setHoveredBrace(null);
      }
    };
    
    const handleBraceClick = (index) => {
      if (braceMap.current.has(index)) {
        setSelectedBrace(selectedBrace === index ? null : index);
      } else {
        setSelectedBrace(null);
      }
    };
    
    const isBraceHighlighted = (index) => {
      return (
        index === hoveredBrace || 
        index === selectedBrace || 
        (hoveredBrace !== null && braceMap.current.get(hoveredBrace) === index) ||
        (selectedBrace !== null && braceMap.current.get(selectedBrace) === index)
      );
    };

    const renderJsonString = () => {
      if (typeof data !== 'string') return null;
      
      const lines = data.split('\n');
      return lines.map((line, lineIdx) => {
        // Process each line character by character
        const characters = [];
        let inString = false;
        let inKey = false;
        let i = 0;
        
        while (i < line.length) {
          const char = line[i];
          const globalIndex = data.indexOf(line.substring(0, i+1)) + i;
          
          // Handle strings
          if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
            inString = !inString;
            if (!inString && line.substring(i+1).trim().startsWith(':')) {
              inKey = true;
            } else if (!inString) {
              inKey = false;
            }
            characters.push(
              <span key={i} className={inKey ? "text-purple-600 dark:text-purple-400" : "text-teal-500 dark:text-teal-400"}>
                {char}
              </span>
            );
          }
          // Handle braces with highlighting
          else if (!inString && (char === '{' || char === '}' || char === '[' || char === ']')) {
            const isHighlighted = isBraceHighlighted(globalIndex);
            characters.push(
              <span 
                key={i} 
                className={`cursor-pointer transition-colors ${isHighlighted ? 'text-yellow-500 dark:text-yellow-300 font-bold' : 'text-gray-600 dark:text-zinc-400'}`}
                onMouseEnter={() => handleBraceHover(globalIndex)}
                onMouseLeave={() => setHoveredBrace(null)}
                onClick={() => handleBraceClick(globalIndex)}
              >
                {char}
              </span>
            );
          }
          // Handle numbers
          else if (!inString && /[0-9]/.test(char)) {
            let number = char;
            let j = i + 1;
            while (j < line.length && /[0-9.]/.test(line[j])) {
              number += line[j];
              j++;
            }
            characters.push(
              <span key={i} className="text-indigo-500 dark:text-indigo-400">
                {number}
              </span>
            );
            i += number.length - 1;
          }
          // Handle boolean values
          else if (!inString && (line.substring(i, i+4) === 'true' || line.substring(i, i+5) === 'false')) {
            const bool = line.substring(i, i+4) === 'true' ? 'true' : 'false';
            characters.push(
              <span key={i} className="text-orange-500 dark:text-orange-400">
                {bool}
              </span>
            );
            i += bool.length - 1;
          }
          // Handle null values
          else if (!inString && line.substring(i, i+4) === 'null') {
            characters.push(
              <span key={i} className="text-gray-500 dark:text-zinc-400">
                null
              </span>
            );
            i += 3;
          }
          // Other characters (commas, colons, whitespace)
          else {
            characters.push(
              <span key={i} className="text-gray-800 dark:text-zinc-200">
                {char}
              </span>
            );
          }
          i++;
        }
        
        return (
          <div key={lineIdx} className="whitespace-pre">
            {characters}
          </div>
        );
      });
    };
  
    const renderJson = (obj, level = 0) => {
      const indent = '  '.repeat(level);
      
      if (Array.isArray(obj)) {
        return (
          <>
            {'[\n'}
            {obj.map((item, index) => (
              <React.Fragment key={index}>
                {indent}  {renderJson(item, level + 1)}
                {index < obj.length - 1 ? ',' : ''}{'\n'}
              </React.Fragment>
            ))}
            {indent}{']'}
          </>
        );
      }
      
      if (typeof obj === 'object' && obj !== null) {
        return (
          <>
            {'{\n'}
            {Object.entries(obj).map(([key, value], index, arr) => (
              <React.Fragment key={key}>
                {indent}  <span className="text-purple-600 dark:text-purple-400">"{key}"</span>: {renderJson(value, level + 1)}
                {index < arr.length - 1 ? ',' : ''}{'\n'}
              </React.Fragment>
            ))}
            {indent}{'}'}
          </>
        );
      }
      
      return renderValue(obj);
    };
  
    return (
      <pre className="font-mono text-sm leading-relaxed font-[JetBrains Mono],monospace overflow-auto">
        {typeof data === 'string' ? renderJsonString() : renderJson(data)}
      </pre>
    );
  };

export default JsonHighlighter;