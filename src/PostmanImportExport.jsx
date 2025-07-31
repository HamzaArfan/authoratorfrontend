import React, { useState } from 'react';
import { Download, Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';

const PostmanImportExport = ({ 
  collections, 
  onImportCollections, 
  onShowMessage,
  isDarkMode,
  isElectron,
  isOffline 
}) => {
  const [importStatus, setImportStatus] = useState(null);
  const [exportStatus, setExportStatus] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Postman Collection Format v2.1 Schema
  const POSTMAN_SCHEMA = "https://schema.getpostman.com/json/collection/v2.1.0/collection.json";

  // Generate unique UUID for Postman collections
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Convert Authrator auth to Postman auth format
  const convertAuthratorAuthToPostman = (authratorAuth) => {
    if (!authratorAuth || authratorAuth.type === 'none') {
      return { type: 'noauth' };
    }

    switch (authratorAuth.type) {
      case 'basic':
        return {
          type: 'basic',
          basic: [
            { key: 'username', value: authratorAuth.basic?.username || '', type: 'string' },
            { key: 'password', value: authratorAuth.basic?.password || '', type: 'string' }
          ]
        };
      
      case 'bearer':
        return {
          type: 'bearer',
          bearer: [
            { key: 'token', value: authratorAuth.bearer || '', type: 'string' }
          ]
        };
      
      case 'apiKey':
        return {
          type: 'apikey',
          apikey: [
            { key: 'key', value: authratorAuth.apiKey?.key || 'X-API-Key', type: 'string' },
            { key: 'value', value: authratorAuth.apiKey?.value || '', type: 'string' },
            { key: 'in', value: authratorAuth.apiKey?.in || 'header', type: 'string' }
          ]
        };
      
      default:
        return { type: 'noauth' };
    }
  };

  // Convert Postman auth to Authrator auth format
  const convertPostmanAuthToAuthrator = (postmanAuth) => {
    if (!postmanAuth || postmanAuth.type === 'noauth') {
      return { type: 'none' };
    }

    switch (postmanAuth.type) {
      case 'basic':
        const basicAuth = postmanAuth.basic || [];
        const username = basicAuth.find(item => item.key === 'username')?.value || '';
        const password = basicAuth.find(item => item.key === 'password')?.value || '';
        return {
          type: 'basic',
          basic: { username, password }
        };
      
      case 'bearer':
        const bearerAuth = postmanAuth.bearer || [];
        const token = bearerAuth.find(item => item.key === 'token')?.value || '';
        return {
          type: 'bearer',
          bearer: token
        };
      
      case 'apikey':
        const apiKeyAuth = postmanAuth.apikey || [];
        const key = apiKeyAuth.find(item => item.key === 'key')?.value || 'X-API-Key';
        const value = apiKeyAuth.find(item => item.key === 'value')?.value || '';
        const inLocation = apiKeyAuth.find(item => item.key === 'in')?.value || 'header';
        return {
          type: 'apiKey',
          apiKey: { key, value, in: inLocation }
        };
      
      default:
        return { type: 'none' };
    }
  };

  // Convert Authrator body to Postman body format
  const convertAuthratorBodyToPostman = (authratorBody) => {
    if (!authratorBody || authratorBody.type === 'none') {
      return {};
    }

    switch (authratorBody.type) {
      case 'raw':
        return {
          mode: 'raw',
          raw: authratorBody.content || '',
          options: {
            raw: {
              language: 'json'
            }
          }
        };
      
      case 'formData':
        return {
          mode: 'formdata',
          formdata: (authratorBody.formData || []).map(item => ({
            key: item.key || '',
            value: item.value || '',
            type: 'text',
            enabled: item.enabled !== false
          }))
        };
      
      case 'urlencoded':
        return {
          mode: 'urlencoded',
          urlencoded: (authratorBody.urlencoded || []).map(item => ({
            key: item.key || '',
            value: item.value || '',
            enabled: item.enabled !== false
          }))
        };
      
      default:
        return {};
    }
  };

  // Convert Postman body to Authrator body format
  const convertPostmanBodyToAuthrator = (postmanBody) => {
    if (!postmanBody || !postmanBody.mode) {
      return { type: 'none', content: '' };
    }

    switch (postmanBody.mode) {
      case 'raw':
        return {
          type: 'raw',
          content: postmanBody.raw || ''
        };
      
      case 'formdata':
        return {
          type: 'formData',
          formData: (postmanBody.formdata || []).map(item => ({
            key: item.key || '',
            value: item.value || '',
            enabled: item.enabled !== false
          }))
        };
      
      case 'urlencoded':
        return {
          type: 'urlencoded',
          urlencoded: (postmanBody.urlencoded || []).map(item => ({
            key: item.key || '',
            value: item.value || '',
            enabled: item.enabled !== false
          }))
        };
      
      default:
        return { type: 'none', content: '' };
    }
  };

  // Convert Authrator URL to Postman URL format
  const convertAuthratorUrlToPostman = (url, queryParams) => {
    if (!url) return '';
    
    try {
      // Parse the URL to separate base URL from embedded query parameters
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      
      // Extract query parameters from the URL
      const urlQueryParams = [];
      urlObj.searchParams.forEach((value, key) => {
        urlQueryParams.push({
          key: key,
          value: value,
          enabled: true
        });
      });
      
      // Merge URL query parameters with the queryParams array
      // Give priority to queryParams array over URL embedded parameters
      const allQueryParams = [...urlQueryParams];
      
      if (queryParams && Array.isArray(queryParams)) {
        queryParams.forEach(param => {
          if (param.key) {
            // Check if this key already exists from URL
            const existingIndex = allQueryParams.findIndex(p => p.key === param.key);
            if (existingIndex >= 0) {
              // Replace URL parameter with the one from queryParams array
              allQueryParams[existingIndex] = {
                key: param.key || '',
                value: param.value || '',
                enabled: param.enabled !== false
              };
            } else {
              // Add new parameter
              allQueryParams.push({
                key: param.key || '',
                value: param.value || '',
                enabled: param.enabled !== false
              });
            }
          }
        });
      }
      
      // Filter only enabled parameters for the raw URL
      const enabledParams = allQueryParams.filter(param => param.enabled !== false && param.key);
      
      // Build clean base URL without query parameters
      const baseUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
      
      // Build raw URL with only enabled query parameters
      const rawUrl = enabledParams.length > 0 
        ? `${baseUrl}?${enabledParams.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value || '')}`).join('&')}`
        : baseUrl;
      
      const postmanUrl = {
        raw: rawUrl,
        protocol: urlObj.protocol.slice(0, -1), // Remove trailing ':'
        host: urlObj.hostname.split('.'),
        port: urlObj.port || undefined,
        path: urlObj.pathname.split('/').filter(segment => segment !== ''),
        query: allQueryParams.map(param => ({
          key: param.key || '',
          value: param.value || '',
          enabled: param.enabled !== false
        }))
      };
      return postmanUrl;
    } catch (error) {
      // If URL parsing fails, return simple format with filtered parameters
      const filteredParams = (queryParams || [])
        .filter(param => param.key) // Only include parameters with keys
        .map(param => ({
          key: param.key || '',
          value: param.value || '',
          enabled: param.enabled !== false
        }));
      
      return {
        raw: url,
        query: filteredParams
      };
    }
  };

  // Convert Postman URL to Authrator format
  const convertPostmanUrlToAuthrator = (postmanUrl) => {
    if (typeof postmanUrl === 'string') {
      // Parse string URL to separate base URL from query parameters
      try {
        const urlObj = new URL(postmanUrl.startsWith('http') ? postmanUrl : `https://${postmanUrl}`);
        const queryParams = [];
        
        urlObj.searchParams.forEach((value, key) => {
          queryParams.push({
            key: key,
            value: value,
            enabled: true
          });
        });
        
        // Return clean base URL without query parameters
        const baseUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
        return { 
          url: baseUrl,
          queryParams: queryParams.length > 0 ? queryParams : [{ key: '', value: '', enabled: true }]
        };
      } catch (error) {
        return { url: postmanUrl, queryParams: [{ key: '', value: '', enabled: true }] };
      }
    }
    
    if (!postmanUrl || typeof postmanUrl !== 'object') {
      return { url: '', queryParams: [{ key: '', value: '', enabled: true }] };
    }

    // Extract query parameters from Postman format
    const queryParams = (postmanUrl.query || []).map(param => ({
      key: param.key || '',
      value: param.value || '',
      enabled: param.enabled !== false
    }));

    // Parse the raw URL to get clean base URL without query parameters
    let cleanUrl = postmanUrl.raw || '';
    try {
      if (cleanUrl) {
        const urlObj = new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`);
        // Return clean base URL without query parameters
        cleanUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
      }
    } catch (error) {
      // If parsing fails, try to remove query parameters manually
      cleanUrl = cleanUrl.split('?')[0];
    }

    return {
      url: cleanUrl,
      queryParams: queryParams.length > 0 ? queryParams : [{ key: '', value: '', enabled: true }]
    };
  };

  // Convert Authrator API to Postman request
  const convertAuthratorApiToPostmanRequest = (api) => {
    const postmanRequest = {
      name: api.name || 'New Request',
      request: {
        method: api.method || 'GET',
        header: (api.headers || []).map(header => ({
          key: header.key || '',
          value: header.value || '',
          type: 'text',
          enabled: header.enabled !== false
        })),
        url: convertAuthratorUrlToPostman(api.url, api.queryParams),
        auth: convertAuthratorAuthToPostman(api.auth)
      },
      response: []
    };

    // Add body if present
    if (api.body && api.body.type !== 'none') {
      postmanRequest.request.body = convertAuthratorBodyToPostman(api.body);
    }

    // Add scripts if present
    const events = [];
    if (api.scripts?.preRequest) {
      events.push({
        listen: 'prerequest',
        script: {
          type: 'text/javascript',
          exec: api.scripts.preRequest.split('\n')
        }
      });
    }
    if (api.scripts?.tests) {
      events.push({
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: api.scripts.tests.split('\n')
        }
      });
    }
    if (events.length > 0) {
      postmanRequest.event = events;
    }

    return postmanRequest;
  };

  // Convert Postman request to Authrator API
  const convertPostmanRequestToAuthratorApi = (postmanItem) => {
    const request = postmanItem.request || {};
    const urlData = convertPostmanUrlToAuthrator(request.url);
    
    const api = {
      id: `imported-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: postmanItem.name || 'Imported Request',
      method: request.method || 'GET',
      url: urlData.url,
      queryParams: urlData.queryParams,
      headers: (request.header || []).map(header => ({
        key: header.key || '',
        value: header.value || '',
        enabled: header.enabled !== false
      })),
      body: convertPostmanBodyToAuthrator(request.body),
      auth: convertPostmanAuthToAuthrator(request.auth),
      scripts: {
        preRequest: '',
        tests: ''
      }
    };

    // Extract scripts from events
    if (postmanItem.event) {
      postmanItem.event.forEach(event => {
        if (event.listen === 'prerequest' && event.script) {
          api.scripts.preRequest = Array.isArray(event.script.exec) 
            ? event.script.exec.join('\n') 
            : event.script.exec || '';
        }
        if (event.listen === 'test' && event.script) {
          api.scripts.tests = Array.isArray(event.script.exec) 
            ? event.script.exec.join('\n') 
            : event.script.exec || '';
        }
      });
    }

    return api;
  };

  // Convert Authrator collection to Postman collection
  const convertAuthratorCollectionToPostman = (collection) => {
    const postmanCollection = {
      info: {
        _postman_id: generateUUID(),
        name: collection.name || 'Imported Collection',
        description: `Exported from Authrator on ${new Date().toISOString()}`,
        schema: POSTMAN_SCHEMA
      },
      item: []
    };

    // Add direct APIs
    if (collection.apis && collection.apis.length > 0) {
      collection.apis.forEach(api => {
        postmanCollection.item.push(convertAuthratorApiToPostmanRequest(api));
      });
    }

    // Add subfolders as Postman folders
    if (collection.subfolders && collection.subfolders.length > 0) {
      collection.subfolders.forEach(subfolder => {
        const postmanFolder = {
          name: subfolder.name || 'Imported Folder',
          item: []
        };

        if (subfolder.apis && subfolder.apis.length > 0) {
          subfolder.apis.forEach(api => {
            postmanFolder.item.push(convertAuthratorApiToPostmanRequest(api));
          });
        }

        postmanCollection.item.push(postmanFolder);
      });
    }

    return postmanCollection;
  };

  // Convert Postman collection to Authrator collection
  const convertPostmanCollectionToAuthrator = (postmanCollection) => {
    const collection = {
      id: `imported-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: postmanCollection.info?.name || 'Imported Collection',
      color: '#FF6B6B',
      apis: [],
      subfolders: [],
      isOffline: isOffline
    };

    const processPostmanItems = (items, targetApis, targetSubfolders) => {
      items.forEach(item => {
        if (item.request) {
          // This is a request item
          targetApis.push(convertPostmanRequestToAuthratorApi(item));
        } else if (item.item) {
          // This is a folder
          const subfolder = {
            id: `imported-subfolder-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name: item.name || 'Imported Folder',
            apis: []
          };
          
          processPostmanItems(item.item, subfolder.apis, []);
          targetSubfolders.push(subfolder);
        }
      });
    };

    if (postmanCollection.item) {
      processPostmanItems(postmanCollection.item, collection.apis, collection.subfolders);
    }

    return collection;
  };

  // Export single collection to Postman format
  const exportCollectionToPostman = async (collection) => {
    try {
      setIsExporting(true);
      setExportStatus(null);

      const postmanCollection = convertAuthratorCollectionToPostman(collection);
      const jsonString = JSON.stringify(postmanCollection, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${collection.name || 'collection'}.postman_collection.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportStatus({ type: 'success', message: `Successfully exported "${collection.name}" to Postman format` });
      onShowMessage?.(`Successfully exported "${collection.name}" to Postman format`, 'success');
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus({ type: 'error', message: `Failed to export collection: ${error.message}` });
      onShowMessage?.(`Failed to export collection: ${error.message}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Export all collections to Postman format
  const exportAllCollectionsToPostman = async () => {
    try {
      setIsExporting(true);
      setExportStatus(null);

      const exportData = {
        exported_at: new Date().toISOString(),
        collections: collections.map(convertAuthratorCollectionToPostman)
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `authrator_collections_postman_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportStatus({ type: 'success', message: `Successfully exported ${collections.length} collections to Postman format` });
      onShowMessage?.(`Successfully exported ${collections.length} collections to Postman format`, 'success');
    } catch (error) {
      console.error('Export all error:', error);
      setExportStatus({ type: 'error', message: `Failed to export collections: ${error.message}` });
      onShowMessage?.(`Failed to export collections: ${error.message}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Import from Postman format
  const importFromPostman = async (file) => {
    try {
      setIsImporting(true);
      setImportStatus(null);

      const text = await file.text();
      let data;
      
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        throw new Error('Invalid JSON file');
      }

      const importedCollections = [];

      // Check if it's a single Postman collection or multiple collections
      if (data.info && data.info.schema && data.info.schema.includes('collection')) {
        // Single Postman collection
        const collection = convertPostmanCollectionToAuthrator(data);
        importedCollections.push(collection);
      } else if (data.collections && Array.isArray(data.collections)) {
        // Multiple collections exported from Authrator
        data.collections.forEach(postmanCollection => {
          if (postmanCollection.info && postmanCollection.info.schema) {
            const collection = convertPostmanCollectionToAuthrator(postmanCollection);
            importedCollections.push(collection);
          }
        });
      } else {
        throw new Error('Unrecognized file format. Please ensure it\'s a valid Postman collection.');
      }

      if (importedCollections.length === 0) {
        throw new Error('No valid collections found in the file');
      }

      // Call the import callback
      await onImportCollections(importedCollections);

      setImportStatus({ 
        type: 'success', 
        message: `Successfully imported ${importedCollections.length} collection(s) from Postman format` 
      });
      onShowMessage?.(`Successfully imported ${importedCollections.length} collection(s) from Postman format`, 'success');
    } catch (error) {
      console.error('Import error:', error);
      setImportStatus({ type: 'error', message: `Failed to import: ${error.message}` });
      onShowMessage?.(`Failed to import: ${error.message}`, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  // Handle file drop
  const handleFileDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const jsonFile = files.find(file => file.name.endsWith('.json'));
    
    if (jsonFile) {
      importFromPostman(jsonFile);
    } else {
      onShowMessage?.('Please drop a JSON file', 'error');
    }
  };

  // Handle file input
  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.json')) {
      importFromPostman(file);
    } else {
      onShowMessage?.('Please select a JSON file', 'error');
    }
    e.target.value = ''; // Reset input
  };

  return (
    <div className={`p-6 ${isDarkMode ? 'bg-zinc-900 text-white' : 'bg-white text-gray-900'} rounded-lg shadow-lg`}>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-purple-600 dark:text-purple-400">
        <FileText className="w-6 h-6" />
        Postman Import & Export
      </h2>

      {/* Import Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-purple-500 dark:text-purple-400">
          <Upload className="w-5 h-5" />
          Import from Postman
        </h3>
        
        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDarkMode 
              ? 'border-zinc-700 hover:border-purple-500 bg-zinc-800' 
              : 'border-purple-200 hover:border-purple-400 bg-purple-50'
          }`}
          onDrop={handleFileDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={(e) => e.preventDefault()}
        >
          <Upload className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-500'}`} />
          <p className="text-lg font-medium mb-2">Drop your Postman collection here</p>
          <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-purple-600/70'} mb-4`}>
            Supports Postman Collection v2.0 and v2.1 formats
          </p>
          
          <label className={`inline-block px-4 py-2 rounded-md cursor-pointer transition-colors ${
            isDarkMode 
              ? 'bg-purple-600 hover:bg-purple-700 text-white' 
              : 'bg-purple-500 hover:bg-purple-600 text-white'
          }`}>
            <input
              type="file"
              accept=".json"
              onChange={handleFileInput}
              className="hidden"
              disabled={isImporting}
            />
            {isImporting ? 'Importing...' : 'Choose File'}
          </label>
        </div>

        {importStatus && (
          <div className={`mt-4 p-4 rounded-md flex items-center gap-2 ${
            importStatus.type === 'success' 
              ? 'bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800/30' 
              : 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/30'
          }`}>
            {importStatus.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {importStatus.message}
          </div>
        )}
      </div>

      {/* Export Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-purple-500 dark:text-purple-400">
          <Download className="w-5 h-5" />
          Export to Postman
        </h3>

        {collections.length === 0 ? (
          <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-purple-600/70'}`}>
            No collections available to export
          </p>
        ) : (
          <div>
            <button
              onClick={exportAllCollectionsToPostman}
              disabled={isExporting}
              className={`w-full mb-6 px-4 py-3 rounded-md transition-colors flex items-center justify-center gap-2 ${
                isDarkMode 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white disabled:bg-zinc-700' 
                  : 'bg-purple-500 hover:bg-purple-600 text-white disabled:bg-purple-300'
              }`}
            >
              <Download className="w-4 h-4" />
              Export All Collections
            </button>

            <div className="space-y-2">
              <h4 className="font-medium text-purple-500 dark:text-purple-400">Export Individual Collections:</h4>
              {collections.map((collection) => (
                <div key={collection.id} className={`flex justify-between items-center py-2 px-3 rounded-md ${
                  isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-purple-50'
                }`}>
                  <span className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: collection.color || '#FF6B6B' }}
                    />
                    {collection.name}
                    <span className={`text-xs px-2 py-1 rounded ${
                      isDarkMode ? 'bg-zinc-700 text-zinc-300' : 'bg-purple-100 text-purple-600'
                    }`}>
                      {(collection.apis?.length || 0) + (collection.subfolders?.reduce((acc, sf) => acc + (sf.apis?.length || 0), 0) || 0)} requests
                    </span>
                  </span>
                  <button
                    onClick={() => exportCollectionToPostman(collection)}
                    disabled={isExporting}
                    className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1 text-sm ${
                      isDarkMode 
                        ? 'bg-purple-600 hover:bg-purple-700 text-white disabled:bg-zinc-700' 
                        : 'bg-purple-500 hover:bg-purple-600 text-white disabled:bg-purple-300'
                    }`}
                  >
                    <Download className="w-3 h-3" />
                    Export
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {exportStatus && (
          <div className={`mt-4 p-4 rounded-md flex items-center gap-2 ${
            exportStatus.type === 'success' 
              ? 'bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800/30' 
              : 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/30'
          }`}>
            {exportStatus.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {exportStatus.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostmanImportExport; 