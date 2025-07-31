import React from 'react';
import { X, Plus } from 'lucide-react';

export const AuthTab = ({ data, onChange }) => {
  return (
    <div className="space-y-4">
      <select
        value={data.type}
        onChange={(e) => onChange({ ...data, type: e.target.value })}
        className="w-full bg-[#2C2C2E] px-4 py-2 rounded"
      >
        <option value="noauth">No Auth</option>
        <option value="jwt">JWT</option>
        <option value="avq-jwt">AVQ JWT</option>
      </select>

      {(data.type === 'jwt' || data.type === 'avq-jwt') && (
        <div className="space-y-4">
          <input
            type="text"
            value={data.config?.key || ''}
            onChange={(e) => onChange({ 
              ...data, 
              config: { ...data.config, key: e.target.value }
            })}
            placeholder="JWT Key"
            className="w-full bg-[#2C2C2E] px-4 py-2 rounded"
          />
          <textarea
            value={data.config?.value || ''}
            onChange={(e) => onChange({ 
              ...data, 
              config: { ...data.config, value: e.target.value }
            })}
            placeholder="JWT Value"
            className="w-full bg-[#2C2C2E] px-4 py-2 rounded h-32"
          />
        </div>
      )}
    </div>
  );
};

export const HeadersTab = ({ data, onChange }) => {
  const addHeader = () => {
    onChange([...data, { key: '', value: '' }]);
  };

  const removeHeader = (index) => {
    onChange(data.filter((_, i) => i !== index));
  };

  const updateHeader = (index, field, value) => {
    const newHeaders = [...data];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    onChange(newHeaders);
  };

  return (
    <div className="space-y-4">
      {data.map((header, index) => (
        <div key={index} className="flex space-x-2">
          <input
            type="text"
            value={header.key}
            onChange={(e) => updateHeader(index, 'key', e.target.value)}
            placeholder="Key"
            className="flex-1 bg-[#2C2C2E] px-4 py-2 rounded"
          />
          <input
            type="text"
            value={header.value}
            onChange={(e) => updateHeader(index, 'value', e.target.value)}
            placeholder="Value"
            className="flex-1 bg-[#2C2C2E] px-4 py-2 rounded"
          />
          <button
            onClick={() => removeHeader(index)}
            className="p-2 hover:bg-gray-700 rounded"
          >
            <X size={16} />
          </button>
        </div>
      ))}
      <button
        onClick={addHeader}
        className="flex items-center space-x-2 text-orange-500 hover:text-orange-600"
      >
        <Plus size={16} />
        <span>Add Header</span>
      </button>
    </div>
  );
};

export const ParamsTab = ({ data, onChange }) => {
  const addParam = () => {
    onChange([...data, { key: '', value: '' }]);
  };

  const removeParam = (index) => {
    onChange(data.filter((_, i) => i !== index));
  };

  const updateParam = (index, field, value) => {
    const newParams = [...data];
    newParams[index] = { ...newParams[index], [field]: value };
    onChange(newParams);
  };
  return (
    <div className="space-y-4">
      {data.map((param, index) => (
        <div key={index} className="flex space-x-2">
          <input
            type="text"
            value={param.key}
            onChange={(e) => updateParam(index, 'key', e.target.value)}
            placeholder="Key"
            className="flex-1 bg-[#2C2C2E] px-4 py-2 rounded"
          />
          <input
            type="text"
            value={param.value}
            onChange={(e) => updateParam(index, 'value', e.target.value)}
            placeholder="Value"
            className="flex-1 bg-[#2C2C2E] px-4 py-2 rounded"
          />
          <button
            onClick={() => removeParam(index)}
            className="p-2 hover:bg-gray-700 rounded"
          >
            <X size={16} />
          </button>
        </div>
      ))}
      <button
        onClick={addParam}
        className="flex items-center space-x-2 text-orange-500 hover:text-orange-600"
      >
        <Plus size={16} />
        <span>Add Parameter</span>
      </button>
    </div>
  );
};

export const BodyTab = ({ data, onChange }) => {
  return (
    <div className="space-y-4">
      <select
        value={data.type}
        onChange={(e) => onChange({ ...data, type: e.target.value })}
        className="w-full bg-[#2C2C2E] px-4 py-2 rounded"
      >
        <option value="none">None</option>
        <option value="json">JSON</option>
        <option value="xml">XML</option>
        <option value="form">Form Data</option>
      </select>

      {data.type !== 'none' && (
        <textarea
          value={data.content}
          onChange={(e) => onChange({ ...data, content: e.target.value })}
          placeholder={`Enter ${data.type.toUpperCase()} body`}
          className="w-full bg-[#2C2C2E] px-4 py-2 rounded h-64 font-mono"
        />
      )}
    </div>
  );
};

export const ScriptTab = ({ type, data, onChange }) => {
  return (
    <div className="space-y-4">
      <textarea
        value={data.content}
        onChange={(e) => onChange({ content: e.target.value })}
        placeholder={`Enter ${type === 'pre' ? 'pre-request' : 'post-request'} script`}
        className="w-full bg-[#2C2C2E] px-4 py-2 rounded h-64 font-mono"
      />
      <div className="text-sm text-gray-400">
        <p>Available variables:</p>
        <ul className="list-disc pl-4">
          <li>request - Current request details</li>
          <li>response - Response data (post-request only)</li>
          <li>environment - Environment variables</li>
        </ul>
      </div>
    </div>
  );
};