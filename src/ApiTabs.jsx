import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, X, MoreVertical, Trash2, Pencil, Copy, FolderPlus, Folder } from 'lucide-react';
import ApiTabRenameModal from './ApiTabRenameModal';

const ApiTabs = ({ collections, activeFolderId, activeSubfolderId, activeApiId, createNewApi, createNewApiInSubfolder, openNewTab, closeTab, openTabs, setActiveSection, setIsPerformanceTesting, openRenameModal, moveApiToCollection, moveApiToSubfolder, setCollections, setActiveApiId, setActiveSubfolderId, setOpenTabs }) => {
 
  const [hiddenTabs, setHiddenTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(activeApiId);
  const [isApiTabRenameModalOpen, setIsApiTabRenameModalOpen] = useState(false);
  const [isAddToCollectionModalOpen, setIsAddToCollectionModalOpen] = useState(false);
  const [apiToAddToCollection, setApiToAddToCollection] = useState(null);
  const [itemToRename, setItemToRename] = useState(null);
  const [itemName, setItemName] = useState('');
  const [isOverflowing, setIsOverflowing] = useState(false);
  const tabsContainerRef = useRef(null);
  const [newTabId, setNewTabId] = useState(null);
 
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    tabId: null,
    tabName: '',
    tab: null
  });

  // Set up animation for new tabs
  useEffect(() => {
    if (newTabId) {
      // Clear the animation after it's done
      const timer = setTimeout(() => {
        setNewTabId(null);
      }, 1000); // match animation duration
      
      return () => clearTimeout(timer);
    }
  }, [newTabId]);

  useEffect(() => {
    if (activeApiId) {
      setActiveTab(activeApiId);
      
      if (hiddenTabs.includes(activeApiId)) {
        setHiddenTabs(hiddenTabs.filter(id => id !== activeApiId));
      }
    }
  }, [activeApiId]);

  // Check if tabs are overflowing
  useEffect(() => {
    const checkOverflow = () => {
      if (tabsContainerRef.current) {
        const container = tabsContainerRef.current;
        setIsOverflowing(container.scrollWidth > container.clientWidth);
      }
    };
    
    checkOverflow();
    
    // Recalculate when tabs change
    const resizeObserver = new ResizeObserver(checkOverflow);
    if (tabsContainerRef.current) {
      resizeObserver.observe(tabsContainerRef.current);
    }
    
    window.addEventListener('resize', checkOverflow);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', checkOverflow);
    };
  }, [openTabs]);

  // Track new tabs added
  useEffect(() => {
    if (openTabs.length > 0) {
      const lastTab = openTabs[openTabs.length - 1];
      if (lastTab && lastTab.id !== newTabId && lastTab.id === activeApiId) {
        setNewTabId(lastTab.id);
      }
    }
  }, [openTabs, activeApiId]);

  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        setContextMenu({...contextMenu, visible: false});
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu]);

  const methodColors = {
    GET: '#49cc90',
    POST: '#61affe',
    PUT: '#fca130',
    DELETE: '#f93e3e',
    PATCH: '#b45dd9'
  };

  const handleCloseTab = (tabId, e) => {
    if (e) e.stopPropagation();
    closeTab(tabId);
  };

  const handleTabSelect = (api) => {
    setActiveTab(api.id);
    setActiveSection('collections');
    
    // Don't fully reset performance testing if it's running in the background
    if (window.isPerformanceTestRunning) {
      setIsPerformanceTesting(false);
    } else {
    setIsPerformanceTesting(false);
    }
    
    if (hiddenTabs.includes(api.id)) {
      setHiddenTabs(hiddenTabs.filter(id => id !== api.id));
    }
    
    // Get the API object from collections to pass to openNewTab
    const apiData = findApiInCollections(api.id);
    if (apiData) {
      openNewTab(apiData.collection.id, apiData.api, apiData.subfolder?.id || null);
    } else {
      // Fallback for tab data
      openNewTab(api.folderId, api, api.subfolderId || null);
    }
  };

  // Helper function to find API in collections
  const findApiInCollections = (apiId) => {
    for (const collection of collections) {
      // Check direct APIs in collection
      const directApi = collection.apis.find(api => api.id === apiId);
      if (directApi) {
        return { collection, subfolder: null, api: directApi };
      }
      
      // Check APIs in subfolders
      for (const subfolder of collection.subfolders || []) {
        const subfolderApi = subfolder.apis.find(api => api.id === apiId);
        if (subfolderApi) {
          return { collection, subfolder, api: subfolderApi };
        }
      }
    }
    return null;
  };

  const handleCreateNewApi = () => {
    const tempFolderId = 'temp-99999';
    createNewApi(tempFolderId);
  };

  const openApiTabRenameModal = (id, name) => {
    setItemToRename(id);
    setItemName(name);
    setIsApiTabRenameModalOpen(true);
  };

  const handleRenameSubmit = (newName) => {
    openRenameModal(itemToRename, 'api', newName);
    setIsApiTabRenameModalOpen(false);
    setItemToRename(null);
    setItemName('');
  };

  const handleContextMenu = (e, tab) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      tabId: tab.id,
      tabName: tab.name,
      tab: tab
    });
  };

  const handleRenameFromContextMenu = () => {
    if (contextMenu.tabId) {
      openApiTabRenameModal(contextMenu.tabId, contextMenu.tabName);
      setContextMenu({...contextMenu, visible: false});
    }
  };

  const isUnsavedApi = (api) => {
    // Check if API is in temp collection or has a temp ID
    return (api.folderId === 'temp-99999' || 
            api.isTemporary === true || 
            (typeof api.id === 'string' && api.id.startsWith('temp-')));
  };

  // Get the complete API object from collections by ID
  const getFullApiById = (apiId) => {
    for (const folder of collections) {
      const api = folder.apis.find(a => a.id === apiId);
      if (api) {
        return { api, folderId: folder.id };
      }
    }
    return null;
  };

  const handleDuplicateApi = (apiTab) => {
    // Find the complete API in the collections
    const result = getFullApiById(apiTab.id);
    if (!result) {
      console.error("Could not find API to duplicate");
      return;
    }
    
    const { api, folderId } = result;
    
    // Generate new ID for the duplicate
    const newId = `api-${Date.now()}`;
    
    // Create a deep copy of the API with new ID and name
    const duplicateApi = JSON.parse(JSON.stringify(api));
    duplicateApi.id = newId;
    duplicateApi.name = `${api.name} (Copy)`;
    
    // Add the duplicate to the same folder in collections
    const updatedCollections = collections.map(folder => {
      if (folder.id === folderId) {
        return {
          ...folder,
          apis: [...folder.apis, duplicateApi]
        };
      }
      return folder;
    });
    
    // Update collections state
    setCollections(updatedCollections);
    
    // Add to open tabs
    const newTab = {
      id: newId,
      name: duplicateApi.name,
      method: duplicateApi.method,
      folderId: folderId
    };
    
    const updatedTabs = [...openTabs, newTab];
    setOpenTabs(updatedTabs);
    
    // Save tabs to localStorage
    localStorage.setItem('openTabs', JSON.stringify(updatedTabs));
    
    // Set the new API as active
    setActiveApiId(newId);
    setActiveTab(newId);
    setNewTabId(newId);
    
    // If we're in local storage mode, save to localStorage
    const isOffline = typeof window !== 'undefined' && 
      window.navigator && 
      !window.navigator.onLine;
    
    if (isOffline || !localStorage.getItem('userId')) {
      localStorage.setItem('collections', JSON.stringify(updatedCollections));
    } else if (folderId !== 'temp-99999' && !folderId.startsWith('local-')) {
      // If online and in a regular collection, save to server
      try {
        fetch('https://authrator.com/db-api/api/apis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            collectionId: folderId,
            name: duplicateApi.name,
            method: duplicateApi.method,
            url: duplicateApi.url,
            headers: duplicateApi.headers,
            queryParams: duplicateApi.queryParams,
            body: duplicateApi.body
          }),
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Update local state with server ID
            const serverApi = {
              ...duplicateApi,
              id: data.api._id
            };
            
            // Update collections
            const updatedCollectionsWithServer = collections.map(folder => {
              if (folder.id === folderId) {
                return {
                  ...folder,
                  apis: folder.apis.map(a => 
                    a.id === newId ? serverApi : a
                  )
                };
              }
              return folder;
            });
            
            setCollections(updatedCollectionsWithServer);
            
            // Update open tabs
            const updatedTabsWithServer = openTabs.map(tab => 
              tab.id === newId ? { ...tab, id: serverApi.id } : tab
            );
            
            setOpenTabs(updatedTabsWithServer);
            localStorage.setItem('openTabs', JSON.stringify(updatedTabsWithServer));
            
            // Update active API ID
            if (activeApiId === newId) {
              setActiveApiId(serverApi.id);
              setActiveTab(serverApi.id);
            }
          }
        })
        .catch(error => {
          console.error('Error saving duplicate API to server:', error);
        });
      } catch (error) {
        console.error('Error duplicating API:', error);
      }
    }
  };

  const handleDuplicateFromContextMenu = () => {
    if (contextMenu.tab) {
      handleDuplicateApi(contextMenu.tab);
      setContextMenu({...contextMenu, visible: false});
    }
  };

  const handleCloseFromContextMenu = () => {
    if (contextMenu.tabId) {
      closeTab(contextMenu.tabId);
      setContextMenu({...contextMenu, visible: false});
    }
  };

  const handleAddToCollection = (api) => {
    setApiToAddToCollection(api);
    setIsAddToCollectionModalOpen(true);
  };

  const handleAddToCollectionFromContextMenu = () => {
    if (contextMenu.tab) {
      handleAddToCollection(contextMenu.tab);
      setContextMenu({...contextMenu, visible: false});
    }
  };

  const handleAddToCollectionSubmit = (collectionId) => {
    if (apiToAddToCollection && collectionId) {
      // Use the moveApiToCollection function to add the API to the selected collection
      const sourceFolderId = apiToAddToCollection.folderId || activeFolderId;
      moveApiToCollection(apiToAddToCollection.id, sourceFolderId, collectionId);
      setIsAddToCollectionModalOpen(false);
      setApiToAddToCollection(null);
    }
  };

  return (
    <div className="border-b border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-900 relative">
      <div 
        ref={tabsContainerRef}
        className={`api-tabs-scrollbar flex items-center overflow-x-auto ${isOverflowing ? 'pr-14' : ''}`}
        style={{ 
          height: '40px',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {openTabs.map((tab) => (
          <div 
            key={tab.id} 
            onClick={() => handleTabSelect(tab)}
            onContextMenu={(e) => handleContextMenu(e, tab)}
            className={`flex items-center h-full px-3 cursor-pointer group flex-shrink-0 w-[200px]
              ${activeTab === tab.id ? 'bg-white dark:bg-zinc-800 border-t-2' : 'bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-gray-800'}
              ${tab.id === newTabId ? 'animate-tabFadeIn' : ''}`}
            style={{ 
              borderTopColor: activeTab === tab.id ? methodColors[tab.method] : 'transparent'
            }}
          >
            <span 
              className="mr-2 px-1.5 py-0.5 rounded text-xs font-mono flex-shrink-0"
              style={{ backgroundColor: `${methodColors[tab.method]}20`, color: methodColors[tab.method] }}
            >
              {tab.method}
            </span>
            <span className="truncate text-sm text-gray-700 dark:text-gray-300 flex-grow">
              {tab.name}
            </span>
            <button
              onClick={(e) => handleCloseTab(tab.id, e)}
              className="ml-1 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 flex-shrink-0"
            >
              <X className="w-3 h-3 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        ))}
        
        {/* Create button that flows with tabs (only shown if not overflowing) */}
        {!isOverflowing && (
          <button
            onClick={handleCreateNewApi}
            className="flex items-center justify-center h-10 w-14 hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0 group"
          >
            <PlusCircle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        )}
      </div>
      
      {/* Fixed create button that only appears when tabs overflow */}
      {isOverflowing && (
        <button
          onClick={handleCreateNewApi}
          className="flex items-center justify-center h-10 w-14 hover:bg-gray-100 dark:hover:bg-gray-800 absolute right-0 top-0 bg-gray-100 dark:bg-zinc-900 z-10 group"
        >
          <PlusCircle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 bottom-[-30px] left-1/2 transform -translate-x-1/2 whitespace-nowrap z-50">
            Create New Request
          </div>
        </button>
      )}

      {contextMenu.visible && (
        <div 
          className="fixed bg-white dark:bg-zinc-800 rounded-md shadow-lg border border-gray-200 dark:border-zinc-700 py-1 z-[9999]"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleRenameFromContextMenu}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
          >
            <Pencil className="w-4 h-4 dark:text-white" />
            <span className="dark:text-white">Rename</span>
          </button>
          
          <button
            onClick={handleDuplicateFromContextMenu}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
          >
            <Copy className="w-4 h-4 dark:text-white" />
            <span className="dark:text-white">Duplicate</span>
          </button>
          
          {isUnsavedApi(contextMenu.tab) && (
            <button
              onClick={handleAddToCollectionFromContextMenu}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
            >
              <FolderPlus className="w-4 h-4 dark:text-white" />
              <span className="dark:text-white">Add to Collection</span>
            </button>
          )}
          
          <button
            onClick={handleCloseFromContextMenu}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
          >
            <X className="w-4 h-4 dark:text-white" />
            <span className="dark:text-white">Close</span>
          </button>
        </div>
      )}

      <ApiTabRenameModal
        isOpen={isApiTabRenameModalOpen}
        onClose={() => setIsApiTabRenameModalOpen(false)}
        itemName={itemName}
        onRename={handleRenameSubmit}
      />
      
      {/* Modal for adding API to collection */}
      {isAddToCollectionModalOpen && apiToAddToCollection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-lg w-96 border border-gray-200 dark:border-zinc-700">
            <div className="flex items-center mb-6">
              <FolderPlus className="w-5 h-5 mr-2 text-purple-500 dark:text-purple-400" />
              <h3 className="text-lg font-semibold dark:text-white">Add to Collection</h3>
            </div>
            
            <div className="max-h-64 overflow-y-auto pr-1">
              {collections
                .filter(c => c.id !== 'temp-99999' && c.id !== apiToAddToCollection.folderId)
                .map(collection => (
                  <button
                    key={collection.id}
                    onClick={() => handleAddToCollectionSubmit(collection.id)}
                    className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-md mb-2 flex items-center transition-colors duration-150 border border-transparent hover:border-gray-200 dark:hover:border-zinc-600"
                  >
                    <Folder className="w-4 h-4 mr-3 text-gray-500 dark:text-gray-400" />
                    <span className="dark:text-white font-medium">{collection.name}</span>
                  </button>
                ))}
              
              {collections.filter(c => c.id !== 'temp-99999' && c.id !== apiToAddToCollection.folderId).length === 0 && (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  No collections available
                </div>
              )}
            </div>
            
            <div className="flex justify-end mt-6 border-t border-gray-200 dark:border-zinc-700 pt-4">
              <button 
                onClick={() => {
                  setIsAddToCollectionModalOpen(false);
                  setApiToAddToCollection(null);
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors duration-150"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiTabs;