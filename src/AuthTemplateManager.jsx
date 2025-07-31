import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Download, FileText } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://authrator.com/db-api/api';

const AuthTemplateManager = ({ 
  activeFolderId, 
  activeApiId, 
  updateApiState 
}) => {
  const [templates, setTemplates] = useState([]);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    pairs: [{ key: '', value: '' }]
  });
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const userId = localStorage.getItem('userId'); 

  useEffect(() => {
    if (userId) {
      fetchTemplates();
    }
  }, [userId]);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/templates/${userId}`);
      if (response.data.success) {
        setTemplates(response.data.templates);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Failed to fetch templates');
      console.error('Error fetching templates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addKeyValuePair = () => {
    setNewTemplate(prev => ({
      ...prev,
      pairs: [...prev.pairs, { key: '', value: '' }]
    }));
  };

  const updatePair = (index, field, value) => {
    setNewTemplate(prev => ({
      ...prev,
      pairs: prev.pairs.map((pair, i) => 
        i === index ? { ...pair, [field]: value } : pair
      )
    }));
  };

  const removePair = (index) => {
    setNewTemplate(prev => ({
      ...prev,
      pairs: prev.pairs.filter((_, i) => i !== index)
    }));
  };

  const saveTemplate = async () => {
    if (!newTemplate.name || !userId) return;
    
    try {
      setIsLoading(true);
      if (isEditMode && selectedTemplate) {
        const response = await axios.put(`${API_BASE_URL}/templates/${selectedTemplate._id}`, {
          name: newTemplate.name,
          pairs: newTemplate.pairs
        });
        if (!response.data.success) {
          throw new Error(response.data.message);
        }
      } else {
        const response = await axios.post(`${API_BASE_URL}/templates`, {
          userId,
          name: newTemplate.name,
          pairs: newTemplate.pairs
        });
        if (!response.data.success) {
          throw new Error(response.data.message);
        }
      }
      
      await fetchTemplates();
      setNewTemplate({ name: '', pairs: [{ key: '', value: '' }] });
      setSelectedTemplate(null);
      setIsEditMode(false);
      setError(null);
    } catch (err) {
      setError('Failed to save template');
      console.error('Error saving template:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplate = (template) => {
    setSelectedTemplate(template);
    setNewTemplate(template);
    setIsEditMode(true);
    
    if (activeFolderId && activeApiId) {
      const authData = {
        type: 'config-jwt',
        jwt: {
          pairs: template.pairs
        }
      };
      updateApiState(activeFolderId, activeApiId, { auth: authData });
    }
  };

  const deleteTemplate = async (templateId) => {
    try {
      setIsLoading(true);
      const response = await axios.delete(`${API_BASE_URL}/templates/${templateId}`);
      if (response.data.success) {
        await fetchTemplates();
        
        if (selectedTemplate?._id === templateId) {
          setSelectedTemplate(null);
          setNewTemplate({ name: '', pairs: [{ key: '', value: '' }] });
          setIsEditMode(false);
        }
        setError(null);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      setError('Failed to delete template');
      console.error('Error deleting template:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewTemplate = () => {
    setSelectedTemplate(null);
    setNewTemplate({ name: '', pairs: [{ key: '', value: '' }] });
    setIsEditMode(false);
  };

  if (!userId) {
    return <div className="text-center p-4">Please log in to manage templates</div>;
  }


  return (
    <div className="flex flex-col space-y-6 max-w-3xl mx-auto p-6">
    {error && (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        {error}
      </div>
    )}

    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Auth Templates</h2>
          <button
            onClick={startNewTemplate}
            className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors duration-200"
            disabled={isLoading}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </button>
        </div>
        
        <div className="space-y-3">
          {templates.map(template => (
            <div
              key={template._id}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-700 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-600 transition-colors duration-200"
            >
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-purple-500" />
                <span className="text-gray-700 dark:text-gray-200 font-medium">{template.name}</span>
                <span className="text-gray-400 text-sm">({template.pairs.length} pairs)</span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => loadTemplate(template)}
                  className="p-2 text-purple-500 hover:bg-purple-100 dark:hover:bg-purple-500/20 rounded-lg transition-colors duration-200"
                  title="Load Template"
                  disabled={isLoading}
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteTemplate(template._id)}
                  className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors duration-200"
                  title="Delete Template"
                  disabled={isLoading}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
        {isEditMode ? 'Edit Template' : 'New Template'}
      </h3>
      
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Template Name"
          value={newTemplate.name}
          onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
          disabled={isLoading}
        />
        
        {newTemplate.pairs.map((pair, index) => (
          <div key={index} className="flex items-center space-x-3">
            <input
              type="text"
              placeholder="Key"
              value={pair.key}
              onChange={(e) => updatePair(index, 'key', e.target.value)}
              className="flex-1 px-4 py-2 bg-gray-50 dark:bg-zinc-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
              disabled={isLoading}
            />
            <input
              type="text"
              placeholder="Value"
              value={pair.value}
              onChange={(e) => updatePair(index, 'value', e.target.value)}
              className="flex-1 px-4 py-2 bg-gray-50 dark:bg-zinc-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
              disabled={isLoading}
            />
            <button
              onClick={() => removePair(index)}
              className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors duration-200"
              disabled={isLoading}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        
        <div className="flex items-center space-x-3 pt-4">
          <button
            onClick={addKeyValuePair}
            className="px-4 py-2 bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-zinc-600 rounded-lg transition-colors duration-200 flex items-center"
            disabled={isLoading}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Pair
          </button>
          <button
            onClick={saveTemplate}
            className="px-4 py-2 bg-purple-500 text-white hover:bg-purple-600 rounded-lg transition-colors duration-200 flex items-center"
            disabled={isLoading}
          >
            <Save className="w-4 h-4 mr-2" />
            {isEditMode ? 'Update Template' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  </div>
);
};

export default AuthTemplateManager;