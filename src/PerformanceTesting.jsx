import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Play, StopCircle, X, Settings, FolderOpen, ChevronDown, Download, FileText, AlertCircle, Folder
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  ChartLegend
);

// LocalStorage keys for persistence
const STORAGE_KEYS = {
  PERFORMANCE_TEST_STATE: 'authrator_performance_test_state',
  RUNNING_TEST_STATE: 'authrator_running_test_state'
};

// LocalStorage helper functions
const saveTestStateToLocalStorage = (state) => {
  try {
    localStorage.setItem(STORAGE_KEYS.PERFORMANCE_TEST_STATE, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save test state to localStorage:', error);
  }
};

const getTestStateFromLocalStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PERFORMANCE_TEST_STATE);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Failed to load test state from localStorage:', error);
    return null;
  }
};

const saveRunningTestToLocalStorage = (runningState) => {
  try {
    localStorage.setItem(STORAGE_KEYS.RUNNING_TEST_STATE, JSON.stringify({
      ...runningState,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Failed to save running test state to localStorage:', error);
  }
};

const getRunningTestFromLocalStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.RUNNING_TEST_STATE);
    if (!saved) return null;
    
    const parsed = JSON.parse(saved);
    // Check if the saved state is not too old (within 24 hours)
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    if (Date.now() - parsed.timestamp > maxAge) {
      localStorage.removeItem(STORAGE_KEYS.RUNNING_TEST_STATE);
      return null;
    }
    
    return parsed;
  } catch (error) {
    console.error('Failed to load running test state from localStorage:', error);
    return null;
  }
};

const clearRunningTestFromLocalStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.RUNNING_TEST_STATE);
  } catch (error) {
    console.error('Failed to clear running test state from localStorage:', error);
  }
};

const PerformanceTestingPanel = ({ 
  collections,
  activeEnvironment,
  onClose,
  initialApi = null,
  initialCollection = null,
  isActive = true,
  onTestStatusChange = () => {},
  savedResults = null,
  onResultsUpdate = () => {}
}) => {
  // Get localStorage data first
  const savedTestState = getTestStateFromLocalStorage();
  const runningTestState = getRunningTestFromLocalStorage();
  const globalState = getGlobalTestState();
  
  // Initialize state with localStorage data if available and no specific initial values provided
  const getInitialState = () => {
    // Prioritize props over localStorage
    if (initialCollection || initialApi) {
      return {
        selectedCollection: initialCollection,
        selectedApis: initialApi ? [initialApi] : [],
        testConfig: {
          iterations: 100,
          concurrentUsers: 10,
          rampUpPeriod: 5,
          delay: 0,
        },
        isRunning: runningTestState ? runningTestState.isRunning : false
      };
    }
    
    // Try to restore from localStorage
    if (savedTestState) {
      return {
        selectedCollection: savedTestState.selectedCollection || null,
        selectedApis: savedTestState.selectedApis || [],
        testConfig: savedTestState.testConfig || {
          iterations: 100,
          concurrentUsers: 10,
          rampUpPeriod: 5,
          delay: 0,
        },
        isRunning: runningTestState ? runningTestState.isRunning : false
      };
    }
    
    // Default state
    return {
      selectedCollection: null,
      selectedApis: [],
      testConfig: {
        iterations: 100,
        concurrentUsers: 10,
        rampUpPeriod: 5,
        delay: 0,
      },
      isRunning: runningTestState ? runningTestState.isRunning : false
    };
  };

  const initialState = getInitialState();
  
  const [isRunning, setIsRunning] = useState(initialState.isRunning);
  const [selectedCollection, setSelectedCollection] = useState(initialState.selectedCollection);
  const [selectedApis, setSelectedApis] = useState(initialState.selectedApis);
  const [showCollectionSelect, setShowCollectionSelect] = useState(false);
  const [showApiSelect, setShowApiSelect] = useState(false);
  const [hasInvalidUrls, setHasInvalidUrls] = useState(false);
  const [testConfig, setTestConfig] = useState(initialState.testConfig);
  
  // Chart management refs to handle visibility issues
  const responseTimeChartRef = useRef(null);
  const throughputChartRef = useRef(null);
  const [chartKey, setChartKey] = useState(0);
  
  // Initialize results with saved data, localStorage, global state, or empty structure - prevent flickering
  
  const initialResults = (savedResults && savedResults.summary && savedResults.summary.totalRequests > 0) 
    ? savedResults 
    : (runningTestState && runningTestState.results && runningTestState.results.summary && runningTestState.results.summary.totalRequests > 0)
      ? runningTestState.results
      : (globalState && globalState.results && globalState.results.summary && globalState.results.summary.totalRequests > 0)
        ? globalState.results
        : {
          responseTimeData: [],
          errorRates: [],
          throughputData: [],
          summary: {
            avgResponseTime: 0,
            minResponseTime: 0,
            maxResponseTime: 0,
            errorRate: 0,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
          }
        };
  
  // Reference to store the latest results to prevent fluctuation
  const resultsRef = useRef(initialResults);
  
  // State for UI representation, initialized from ref
  const [results, setResults] = useState(initialResults);

  // Update results ref when savedResults change, but only if not currently running
  useEffect(() => {
    if (savedResults && !isRunning && savedResults.summary && savedResults.summary.totalRequests > 0) {
      resultsRef.current = savedResults;
      setResults(savedResults);
    }
  }, [savedResults, isRunning]);

  // Notify parent component about results changes with debouncing
  const updateResultsDebounced = useCallback(() => {
    // Only update if there's actual meaningful data
    if (resultsRef.current.responseTimeData.length > 0 || resultsRef.current.summary.totalRequests > 0) {
      onResultsUpdate(resultsRef.current);
      
      // Update global state for cross-component access
      setGlobalTestState({
        isRunning: isRunning || testStateRef.current.isRunning,
        results: resultsRef.current,
        testConfig,
        selectedApis,
        selectedCollection
      });
    }
  }, [onResultsUpdate, isRunning, testConfig, selectedApis, selectedCollection]);

  useEffect(() => {
    const timeoutId = setTimeout(updateResultsDebounced, 100);
    return () => clearTimeout(timeoutId);
  }, [results, updateResultsDebounced]);

  // When active status changes, ensure we update the parent component
  useEffect(() => {
    // When becoming active again, sync our state with parent
    if (isActive && !isRunning) {
      onTestStatusChange(testStateRef.current.isRunning);
    }
  }, [isActive, isRunning, onTestStatusChange]);

  // Handle component visibility changes
  useEffect(() => {
    // When the component becomes inactive but a test is running
    if (!isActive && testStateRef.current.isRunning) {
      // Make sure the parent knows we're still running
      onTestStatusChange(true);
    }
  }, [isActive, onTestStatusChange]);

  // Use an effect to sync results when component becomes visible again
  useEffect(() => {
    if (isActive && resultsRef.current && resultsRef.current.summary.totalRequests > 0) {
      setResults(resultsRef.current);
      
      // Force chart re-render when becoming active
      // This fixes the issue where charts show null when switching back to tab
      setTimeout(() => {
        setChartKey(prev => prev + 1);
        
        // Also try to update chart instances directly
        if (responseTimeChartRef.current) {
          try {
            responseTimeChartRef.current.update('none');
          } catch (error) {
            console.warn('Failed to update response time chart:', error);
          }
        }
        
        if (throughputChartRef.current) {
          try {
            throughputChartRef.current.update('none');
          } catch (error) {
            console.warn('Failed to update throughput chart:', error);
          }
        }
             }, 100);
    }
  }, [isActive]);

  // Force chart refresh when results change and component is active
  useEffect(() => {
    if (isActive && results.responseTimeData.length > 0) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        if (responseTimeChartRef.current) {
          try {
            responseTimeChartRef.current.update('none');
          } catch (error) {
            // Chart context lost, force remount
            setChartKey(prev => prev + 1);
          }
        }
        
        if (throughputChartRef.current && results.throughputData.length > 0) {
          try {
            throughputChartRef.current.update('none');
          } catch (error) {
            // Chart context lost, force remount  
            setChartKey(prev => prev + 1);
          }
        }
      }, 200);
    }
  }, [isActive, results.responseTimeData.length, results.throughputData.length]);

  // Reference to store test state when running in background
  const testStateRef = useRef({
    isRunning: false,
    startTime: null,
    completedRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalResponseTime: 0,
    minResponseTime: Infinity,
    maxResponseTime: 0,
    abortController: null
  });

  // Notify parent about test status changes
  useEffect(() => {
    onTestStatusChange(isRunning || testStateRef.current.isRunning);
  }, [isRunning, onTestStatusChange]);

  // When component unmounts or becomes inactive, preserve state and cleanup charts
  useEffect(() => {
    return () => {
      // If test is running, make sure parent still knows about it
      if (testStateRef.current.isRunning) {
        onTestStatusChange(true);
      }
      
      // Cleanup chart instances to prevent memory leaks
      if (responseTimeChartRef.current) {
        try {
          responseTimeChartRef.current.destroy();
        } catch (error) {
          console.warn('Error destroying response time chart:', error);
        }
      }
      
      if (throughputChartRef.current) {
        try {
          throughputChartRef.current.destroy();
        } catch (error) {
          console.warn('Error destroying throughput chart:', error);
        }
      }
    };
  }, [onTestStatusChange]);

  useEffect(() => {
    // Check for invalid URLs in initial APIs
    if (initialApi) {
      setHasInvalidUrls(!initialApi.url || initialApi.url.trim() === '');
    } else if (initialCollection && initialCollection.apis) {
      setHasInvalidUrls(initialCollection.apis.some(a => !a.url || a.url.trim() === ''));
    }
  }, [initialApi, initialCollection]);

  // Initialize from localStorage/global state if there's a running test
  useEffect(() => {
    const runningState = getRunningTestFromLocalStorage();
    const globalState = getGlobalTestState();
    
    // Prioritize localStorage running test state over global state
    const testState = runningState || globalState;
    
    if (testState && testState.isRunning && !initialCollection && !initialApi) {
      try {
        // Restore test state
        if (testState.selectedCollection) {
          setSelectedCollection(testState.selectedCollection);
        }
        if (testState.selectedApis && testState.selectedApis.length > 0) {
          setSelectedApis(testState.selectedApis);
          setHasInvalidUrls(testState.selectedApis.some(a => !a.url || a.url.trim() === ''));
        }
        if (testState.testConfig) {
          setTestConfig(testState.testConfig);
        }
        
        // Update test running state
        setIsRunning(testState.isRunning);
        testStateRef.current.isRunning = testState.isRunning;
        
        // If test was running but component was unmounted, we need to recreate the abort controller
        if (testState.isRunning) {
          testStateRef.current.abortController = new AbortController();
          
          // Restore test progress from localStorage if available
          if (runningState && runningState.startTime) {
            testStateRef.current.startTime = runningState.startTime;
            // Note: We can't restore the exact test progress, but the test will continue from current state
          }
          
          console.log('Performance test state restored from localStorage');
        }
      } catch (error) {
        console.error('Error restoring performance test state:', error);
        // If there's an error, clear the invalid state
        clearRunningTestFromLocalStorage();
      }
    }
  }, []); // Run only on mount

  // Helper function to build collection hierarchy for dropdown
  const buildCollectionHierarchy = useCallback((collections) => {
    const hierarchy = [];
    
    const processCollection = (collection, depth = 0, parentPath = '') => {
      // Skip system collections
      if (collection.id === 'temp-99999' || 
          collection.name === 'Unsaved Requests' || 
          collection.name === 'History Requests 9999999') {
        return;
      }
      
      const collectionPath = parentPath ? `${parentPath} > ${collection.name}` : collection.name;
      const collectionItem = { 
        ...collection, 
        depth, 
        fullPath: collectionPath,
        isFolder: depth > 0,
        hasOwnApis: collection.apis && collection.apis.length > 0
      };
      
      hierarchy.push(collectionItem);
      
      // If collection has subfolders, process them recursively
      if (collection.subfolders && Array.isArray(collection.subfolders)) {
        collection.subfolders.forEach(subfolder => {
          processCollection(subfolder, depth + 1, collectionPath);
        });
      }
    };
    
    collections.forEach(collection => processCollection(collection));
    return hierarchy;
  }, []);

  // Get APIs from a specific collection (not including subfolders unless specified)
  const getApisFromCollection = useCallback((collection, includeSubfolders = false) => {
    let apis = [];
    
    // Get APIs from current collection
    if (collection.apis && Array.isArray(collection.apis)) {
      apis = [...collection.apis];
    }
    
    // If includeSubfolders is true, get APIs from all subfolders recursively
    if (includeSubfolders && collection.subfolders && Array.isArray(collection.subfolders)) {
      const processSubfolders = (coll) => {
        if (coll.apis && Array.isArray(coll.apis)) {
          apis.push(...coll.apis);
        }
        if (coll.subfolders && Array.isArray(coll.subfolders)) {
          coll.subfolders.forEach(subfolder => processSubfolders(subfolder));
        }
      };
      
      collection.subfolders.forEach(subfolder => processSubfolders(subfolder));
    }
    
    return apis;
  }, []);

  const makeRequest = useCallback(async (api) => {
    if (!api.url || api.url.trim() === '') {
      throw new Error('API URL is missing or empty');
    }
    
    const headers = new Headers();
    
    if (api.headers) {
      Object.entries(api.headers).forEach(([key, value]) => {
        const processedValue = value.replace(/\{\{(.+?)\}\}/g, (_, variable) => {
          return activeEnvironment?.variables?.[variable.trim()] || '';
        });
        headers.append(key, processedValue);
      });
    }

    let url = api.url;
    if (activeEnvironment?.variables) {
      url = url.replace(/\{\{(.+?)\}\}/g, (_, variable) => {
        return activeEnvironment.variables[variable.trim()] || '';
      });
    }

    let body = null;
    if (api.body && ['POST', 'PUT', 'PATCH'].includes(api.method)) {
      try {
        body = JSON.parse(api.body.replace(/\{\{(.+?)\}\}/g, (_, variable) => {
          return activeEnvironment?.variables?.[variable.trim()] || '';
        }));
      } catch (e) {
        body = api.body;
      }
    }

    if (!testStateRef.current.abortController) {
      testStateRef.current.abortController = new AbortController();
    }

    const response = await fetch(url, {
      method: api.method,
      headers,
      body: body ? JSON.stringify(body) : null,
      signal: testStateRef.current.abortController.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  }, [activeEnvironment]);

  // Background update function to keep results synced
  const updateResultsInBackground = useCallback((newData) => {
    // Always update the ref first
    resultsRef.current = newData;
    
    // Always notify parent about updates for real-time monitoring
    onResultsUpdate(newData);
    
    // Only update UI state if component is active to prevent unnecessary renders
    if (isActive) {
      setResults(newData);
      
      // Force chart updates when data changes and component is active
      setTimeout(() => {
        if (responseTimeChartRef.current && newData.responseTimeData.length > 0) {
          try {
            responseTimeChartRef.current.update('none');
          } catch (error) {
            // If update fails, force re-mount
            setChartKey(prev => prev + 1);
          }
        }
        
        if (throughputChartRef.current && newData.throughputData.length > 0) {
          try {
            throughputChartRef.current.update('none');
          } catch (error) {
            // If update fails, force re-mount
            setChartKey(prev => prev + 1);
          }
        }
      }, 50);
    }
  }, [isActive, onResultsUpdate]);

  // Background monitoring for test progress
  useEffect(() => {
    let intervalId;
    
    if (testStateRef.current.isRunning && !isActive) {
      // When running in background, periodically sync results
      intervalId = setInterval(() => {
        if (testStateRef.current.isRunning && resultsRef.current) {
          // Create a summary with current test state
          const currentSummary = {
            ...resultsRef.current.summary,
            avgResponseTime: testStateRef.current.totalResponseTime / (testStateRef.current.successfulRequests || 1),
            minResponseTime: testStateRef.current.successfulRequests > 0 ? testStateRef.current.minResponseTime : 0,
            maxResponseTime: testStateRef.current.maxResponseTime,
            errorRate: (testStateRef.current.failedRequests / (testStateRef.current.completedRequests || 1)) * 100,
            totalRequests: testStateRef.current.completedRequests,
            successfulRequests: testStateRef.current.successfulRequests,
            failedRequests: testStateRef.current.failedRequests
          };
          
          const updatedResults = {
            ...resultsRef.current,
            summary: currentSummary
          };
          
                     // Update results reference and notify parent
           resultsRef.current = updatedResults;
           onResultsUpdate(updatedResults);
           
           // Also update localStorage with current running state
           saveRunningTestToLocalStorage({
             isRunning: true,
             testConfig,
             selectedApis,
             selectedCollection,
             results: updatedResults,
             startTime: testStateRef.current.startTime
           });
         }
       }, 1000); // Update every second when in background
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isActive, onResultsUpdate]);

  const runTest = useCallback(async () => {
    if (selectedApis.length === 0) {
      alert('Please select at least one API to test');
      return;
    }

    // Reset abort controller
    if (testStateRef.current.abortController) {
      testStateRef.current.abortController.abort();
    }
    testStateRef.current.abortController = new AbortController();

    setIsRunning(true);
    
    // Initialize fresh results for new test
    const freshResults = {
      responseTimeData: [],
      errorRates: [],
      throughputData: [],
      summary: {
        avgResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        errorRate: 0,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
      }
    };

    // Update both ref and state immediately
    resultsRef.current = freshResults;
    setResults(freshResults);
    
    // Initialize global state for new test
    setGlobalTestState({
      isRunning: true,
      results: freshResults,
      testConfig,
      selectedApis,
      selectedCollection
    });

    // Setup test state
    const startTime = Date.now();
    testStateRef.current = {
      isRunning: true,
      startTime,
      completedRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      abortController: testStateRef.current.abortController
    };
    
    // Save running test state to localStorage
    saveRunningTestToLocalStorage({
      isRunning: true,
      testConfig,
      selectedApis,
      selectedCollection,
      results: freshResults,
      startTime
    });
    
    const iterationsPerApi = Math.ceil(testConfig.iterations / selectedApis.length);
    const batchSize = Math.ceil(iterationsPerApi / testConfig.concurrentUsers);
    const delayBetweenBatches = (testConfig.rampUpPeriod * 1000) / batchSize;

    try {
    for (const api of selectedApis) {
        if (!testStateRef.current.isRunning) break; // Check if test was stopped
        
      for (let batch = 0; batch < batchSize; batch++) {
          if (!testStateRef.current.isRunning) break; // Check if test was stopped
          
        const batchPromises = [];
        
        for (let user = 0; user < testConfig.concurrentUsers; user++) {
            if (testStateRef.current.completedRequests >= testConfig.iterations) break;
          
          batchPromises.push(
            (async () => {
              const requestStart = Date.now();
              try {
                await makeRequest(api);
                  testStateRef.current.successfulRequests++;
                const responseTime = Date.now() - requestStart;
                  testStateRef.current.totalResponseTime += responseTime;
                  testStateRef.current.minResponseTime = Math.min(testStateRef.current.minResponseTime, responseTime);
                  testStateRef.current.maxResponseTime = Math.max(testStateRef.current.maxResponseTime, responseTime);
                
                  testStateRef.current.completedRequests++;
                
                  // Create updated results object
                  const updatedResults = {
                    ...resultsRef.current,
                    responseTimeData: [...resultsRef.current.responseTimeData, {
                    time: (Date.now() - startTime) / 1000,
                    responseTime,
                    api: api.name
                  }],
                    throughputData: [...resultsRef.current.throughputData, {
                    time: (Date.now() - startTime) / 1000,
                      requests: testStateRef.current.completedRequests,
                      api: api.name
                    }]
                  };
                  
                  // Update results in background-friendly way
                  updateResultsInBackground(updatedResults);
              } catch (error) {
                  if (error.name === 'AbortError') {
                    // Test was aborted, do nothing
                    return;
                  }
                  testStateRef.current.failedRequests++;
                  testStateRef.current.completedRequests++;
              }
            })()
          );
        }
        
        await Promise.all(batchPromises);
          if (delayBetweenBatches > 0 && testStateRef.current.isRunning) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
      }
    }
    } catch (error) {
      console.error("Test error:", error);
    } finally {
      // Only update final results if the test wasn't explicitly stopped
      if (testStateRef.current.isRunning) {
        const { completedRequests, successfulRequests, failedRequests, totalResponseTime, minResponseTime, maxResponseTime } = testStateRef.current;

    const summary = {
          avgResponseTime: totalResponseTime / successfulRequests || 0,
          minResponseTime: successfulRequests > 0 ? minResponseTime : 0,
      maxResponseTime,
          errorRate: (failedRequests / (completedRequests || 1)) * 100,
      totalRequests: completedRequests,
      successfulRequests,
      failedRequests
    };

        // Update final results
        const finalResults = { ...resultsRef.current, summary };
        updateResultsInBackground(finalResults);
      }
      
      testStateRef.current.isRunning = false;
    setIsRunning(false);
    
    // Clear running test state from localStorage since test completed
    clearRunningTestFromLocalStorage();
    
    // Update global state to reflect test completion
    setGlobalTestState({
      isRunning: false,
      results: resultsRef.current,
      testConfig,
      selectedApis,
      selectedCollection
    });
    }
  }, [testConfig, makeRequest, selectedApis, updateResultsInBackground]);

  // Function to stop an ongoing test
  const stopTest = useCallback(() => {
    if (testStateRef.current.abortController) {
      testStateRef.current.abortController.abort();
    }
    
    // If we have partial results, finalize them
    if (testStateRef.current.completedRequests > 0) {
      const { completedRequests, successfulRequests, failedRequests, totalResponseTime, minResponseTime, maxResponseTime } = testStateRef.current;
      
      const summary = {
        avgResponseTime: totalResponseTime / (successfulRequests || 1),
        minResponseTime: successfulRequests > 0 ? minResponseTime : 0,
        maxResponseTime,
        errorRate: (failedRequests / (completedRequests || 1)) * 100,
        totalRequests: completedRequests,
        successfulRequests,
        failedRequests
      };
      
      // Update final results
      const finalResults = { ...resultsRef.current, summary };
      updateResultsInBackground(finalResults);
    }
    
    testStateRef.current.isRunning = false;
    setIsRunning(false);
    onTestStatusChange(false);
    
    // Clear running test state from localStorage since test was stopped
    clearRunningTestFromLocalStorage();
    
    // Update global state to reflect test stopped
    setGlobalTestState({
      isRunning: false,
      results: resultsRef.current,
      testConfig,
      selectedApis,
      selectedCollection
    });
  }, [updateResultsInBackground, onTestStatusChange, testConfig, selectedApis, selectedCollection]);

  const handleSelectCollection = (collection) => {
    setSelectedCollection(collection);
    // For subfolders, get only their own APIs. For main collections, get all APIs including subfolders
    const apis = collection.isFolder 
      ? getApisFromCollection(collection, false) // Only subfolder's own APIs
      : getApisFromCollection(collection, true);  // All APIs including from subfolders
    setSelectedApis(apis);
    setHasInvalidUrls(apis.some(a => !a.url || a.url.trim() === ''));
    setShowCollectionSelect(false);
    
    // Save to localStorage
    saveTestStateToLocalStorage({
      selectedCollection: collection,
      selectedApis: apis,
      testConfig,
      hasInvalidUrls: apis.some(a => !a.url || a.url.trim() === '')
    });
  };

  const handleSelectApi = (api) => {
    let updatedApis;
    if (selectedApis.find(a => a.id === api.id)) {
      updatedApis = selectedApis.filter(a => a.id !== api.id);
    } else {
      updatedApis = [...selectedApis, api];
    }
    
    setSelectedApis(updatedApis);
    setHasInvalidUrls(updatedApis.some(a => !a.url || a.url.trim() === ''));
    
    // Save to localStorage
    saveTestStateToLocalStorage({
      selectedCollection,
      selectedApis: updatedApis,
      testConfig,
      hasInvalidUrls: updatedApis.some(a => !a.url || a.url.trim() === '')
    });
  };

  const generateReport = () => {
    const apiSummaries = selectedApis.map(api => {
      const apiData = results.responseTimeData.filter(d => d.api === api.name);
      const avgTime = apiData.reduce((acc, curr) => acc + curr.responseTime, 0) / apiData.length || 0;
      const successRate = ((apiData.length / (testConfig.iterations / selectedApis.length)) * 100);
      
      return {
        name: api.name,
        method: api.method,
        url: api.url,
        averageResponseTime: avgTime,
        successRate: successRate,
        totalRequests: apiData.length
      };
    });

    const report = {
      timestamp: new Date().toISOString(),
      testConfiguration: {
        ...testConfig,
        totalApis: selectedApis.length,
      },
      overallSummary: results.summary,
      apiDetails: apiSummaries,
      rawData: {
        responseTimeData: results.responseTimeData,
        throughputData: results.throughputData
      }
    };

    return report;
  };

  const downloadReport = () => {
    const report = generateReport();
    const reportBlob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(reportBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `performance-test-report-${new Date().toISOString().split('.')[0].replace(/:/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generatePDFReport = () => {
    const report = generateReport();
    const doc = new jsPDF();
    
   
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 100);
    doc.text('Performance Test Report', 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 32);
    
 
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 100);
    doc.text('Test Configuration', 14, 44);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Iterations: ${report.testConfiguration.iterations}`, 14, 52);
    doc.text(`Concurrent Users: ${report.testConfiguration.concurrentUsers}`, 14, 58);
    doc.text(`Ramp Up Period: ${report.testConfiguration.rampUpPeriod}s`, 14, 64);
    doc.text(`Delay: ${report.testConfiguration.delay}ms`, 14, 70);
    doc.text(`Total APIs Tested: ${report.testConfiguration.totalApis}`, 14, 76);
    
   
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 100);
    doc.text('Overall Summary', 14, 88);
    
    const summaryData = [
      ['Metric', 'Value'],
      ['Average Response Time', `${report.overallSummary.avgResponseTime.toFixed(2)}ms`],
      ['Min Response Time', `${report.overallSummary.minResponseTime.toFixed(2)}ms`],
      ['Max Response Time', `${report.overallSummary.maxResponseTime.toFixed(2)}ms`],
      ['Error Rate', `${report.overallSummary.errorRate.toFixed(2)}%`],
      ['Total Requests', report.overallSummary.totalRequests],
      ['Successful Requests', report.overallSummary.successfulRequests],
      ['Failed Requests', report.overallSummary.failedRequests]
    ];
    
    autoTable(doc, {
      startY: 94,
      head: [summaryData[0]],
      body: summaryData.slice(1),
      theme: 'striped',
      headStyles: {
        fillColor: [0, 51, 102],
        textColor: [255, 255, 255]
      }
    });
    
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 100);
    let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 94;
    doc.text('API Details', 14, finalY + 15);
    
    const apiDetailsHeaders = ['API Name', 'Method', 'URL', 'Avg Response Time (ms)', 'Success Rate (%)', 'Total Requests'];
    const apiDetailsData = report.apiDetails.map(api => [
      api.name,
      api.method,
      api.url.length > 30 ? api.url.substring(0, 27) + '...' : api.url,
      api.averageResponseTime.toFixed(2),
      api.successRate.toFixed(2),
      api.totalRequests
    ]);
    
    autoTable(doc, {
      startY: finalY + 20,
      head: [apiDetailsHeaders],
      body: apiDetailsData,
      theme: 'striped',
      headStyles: {
        fillColor: [0, 51, 102],
        textColor: [255, 255, 255]
      },
      columnStyles: {
        2: { cellWidth: 50 }
      }
    });
    
    
    doc.save(`performance-test-report-${new Date().toISOString().split('.')[0].replace(/:/g, '-')}.pdf`);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 dark:text-gray-300">
      <div className="flex items-center justify-between px-4 py-3 border-b border-purple-200 dark:border-zinc-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Performance Testing</h2>
        <div className="flex items-center gap-2">
          {results.responseTimeData.length > 0 && (
            <>
              <button
                onClick={downloadReport}
                className="flex items-center px-3 py-1.5 text-sm rounded-md text-white bg-green-500 hover:bg-green-600"
              >
                <Download size={16} className="mr-1.5" />
                JSON Report
              </button>
              <button
                onClick={generatePDFReport}
                className="flex items-center px-3 py-1.5 text-sm rounded-md text-white bg-purple-500 hover:bg-purple-600"
              >
                <FileText size={16} className="mr-1.5" />
                PDF Report
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>


      <div className="p-4 border-b border-purple-200 dark:border-zinc-700">
        <div className="space-y-4">
        
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Collection
            </label>
            <button
              onClick={() => setShowCollectionSelect(!showCollectionSelect)}
              className="w-full px-3 py-2 text-left border border-purple-300 dark:border-zinc-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 flex items-center justify-between"
            >
              <span>{selectedCollection?.name || 'Select Collection'}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {showCollectionSelect && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-zinc-700 border border-purple-200 dark:border-zinc-600 rounded-md shadow-lg max-h-60 overflow-auto">
                {buildCollectionHierarchy(collections).map(collection => (
                  <button
                    key={`${collection.id}-${collection.depth}`}
                    onClick={() => handleSelectCollection(collection)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-zinc-600 flex items-center justify-between group"
                    style={{ paddingLeft: `${16 + collection.depth * 20}px` }}
                  >
                    <div className="flex items-center">
                      {collection.isFolder ? (
                        <Folder className="w-4 h-4 mr-2 text-purple-500" />
                      ) : (
                        <FolderOpen className="w-4 h-4 mr-2" />
                      )}
                      <span className="font-medium">{collection.name}</span>
                      {collection.isFolder && (
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          (subfolder)
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100">
                      {collection.hasOwnApis ? `${(collection.apis || []).length} APIs` : 'No APIs'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

         
          {selectedCollection && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Selected APIs {selectedCollection.isFolder && `(from ${selectedCollection.name})`}
              </label>
              {selectedApis.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-auto border border-purple-200 dark:border-zinc-600 rounded-md p-2">
                  {selectedApis.map(api => (
                    <label key={api.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedApis.some(a => a.id === api.id)}
                        onChange={() => handleSelectApi(api)}
                        className="rounded border-purple-300 dark:border-zinc-600"
                      />
                      <span className={`px-2 py-0.5 rounded-md text-xs font-semibold tracking-wide ${
                        {
                          GET: 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300',
                          POST: 'bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300',
                          PUT: 'bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300',
                          DELETE: 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300',
                          PATCH: 'bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300',
                        }[api.method]
                      }`}>
                        {api.method}
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{api.name}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400 border border-purple-200 dark:border-zinc-600 rounded-md">
                  <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No APIs found in {selectedCollection.name}</p>
                  {!selectedCollection.isFolder && (
                    <p className="text-xs mt-1">Try selecting a subfolder that contains APIs</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

    
      <div className="p-4 border-b border-purple-200 dark:border-zinc-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Iterations per API
            </label>
            <input
              type="number"
              value={testConfig.iterations}
              onChange={(e) => {
                const newConfig = { ...testConfig, iterations: parseInt(e.target.value) };
                setTestConfig(newConfig);
                saveTestStateToLocalStorage({
                  selectedCollection,
                  selectedApis,
                  testConfig: newConfig,
                  hasInvalidUrls
                });
              }}
              className="w-full px-3 py-2 border border-purple-300 dark:border-zinc-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Concurrent Users
            </label>
            <input
              type="number"
              value={testConfig.concurrentUsers}
              onChange={(e) => {
                const newConfig = { ...testConfig, concurrentUsers: parseInt(e.target.value) };
                setTestConfig(newConfig);
                saveTestStateToLocalStorage({
                  selectedCollection,
                  selectedApis,
                  testConfig: newConfig,
                  hasInvalidUrls
                });
              }}
              className="w-full px-3 py-2 border border-purple-300 dark:border-zinc-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ramp-up Period (s)
            </label>
            <input
              type="number"
              value={testConfig.rampUpPeriod}
              onChange={(e) => {
                const newConfig = { ...testConfig, rampUpPeriod: parseInt(e.target.value) };
                setTestConfig(newConfig);
                saveTestStateToLocalStorage({
                  selectedCollection,
                  selectedApis,
                  testConfig: newConfig,
                  hasInvalidUrls
                });
              }}
              className="w-full px-3 py-2 border border-purple-300 dark:border-zinc-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Delay (ms)
            </label>
            <input
              type="number"
              value={testConfig.delay}
              onChange={(e) => {
                const newConfig = { ...testConfig, delay: parseInt(e.target.value) };
                setTestConfig(newConfig);
                saveTestStateToLocalStorage({
                  selectedCollection,
                  selectedApis,
                  testConfig: newConfig,
                  hasInvalidUrls
                });
              }}
              className="w-full px-3 py-2 border border-purple-300 dark:border-zinc-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800"
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          {hasInvalidUrls && (
            <div className="mr-4 text-yellow-500 text-sm flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Some selected APIs have missing URLs
            </div>
          )}
          <button
            onClick={isRunning ? stopTest : runTest}
            disabled={selectedApis.length === 0 || hasInvalidUrls}
            className={`flex items-center px-4 py-2 rounded-md text-white ${
              selectedApis.length === 0 || hasInvalidUrls
                ? 'bg-gray-400 cursor-not-allowed'
                : isRunning 
                  ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-purple-500 hover:bg-purple-600'
            }`}
          >
            {isRunning ? (
              <>
                <StopCircle className="w-4 h-4 mr-2" />
                Stop Test
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Test
              </>
            )}
          </button>
        </div>
      </div>
      <div className="flex-1 p-4 overflow-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Response Time</h3>
            <div className="mt-2">
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {results.summary.avgResponseTime.toFixed(2)} ms
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Min: {results.summary.minResponseTime} ms | Max: {results.summary.maxResponseTime} ms
              </p>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Error Rate</h3>
            <div className="mt-2">
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {results.summary.errorRate.toFixed(2)}%
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Failed: {results.summary.failedRequests} / Total: {results.summary.totalRequests}
              </p>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Throughput</h3>
            <div className="mt-2">
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {results.summary.totalRequests} requests
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Successful: {results.summary.successfulRequests}
              </p>
            </div>
          </div>
        </div>

      
        <div className="space-y-6">
       
          <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Response Time Over Time</h3>
            <div className="w-full h-[400px] min-h-[400px] flex items-center justify-center relative">
              {results.responseTimeData.length > 0 ? (
                <Line
                  key={`response-time-chart-${chartKey}`}
                  ref={responseTimeChartRef}
                  data={{
                    labels: results.responseTimeData.map(d => d.time.toFixed(1) + 's'),
                    datasets: [
                      {
                        label: 'Response Time',
                        data: results.responseTimeData.map(d => d.responseTime),
                        fill: false,
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 2,
                        pointRadius: 3,
                        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                        tension: 0.1
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                      duration: isActive ? 200 : 0
                    },
                    interaction: {
                      intersect: false,
                      mode: 'index'
                    },
                    scales: {
                      y: {
                        title: {
                          display: true,
                          text: 'Response Time (ms)',
                          font: { size: 12 }
                        },
                        ticks: { beginAtZero: true }
                      },
                      x: {
                        title: {
                          display: true,
                          text: 'Time (s)',
                          font: { size: 12 }
                        },
                        ticks: {
                          maxRotation: 0,
                          autoSkip: true,
                          maxTicksLimit: 10
                        }
                      }
                    },
                    plugins: {
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const dataPoint = results.responseTimeData[context.dataIndex];
                            return [
                              `Response Time: ${dataPoint.responseTime.toFixed(2)} ms`,
                              `API: ${dataPoint.api}`
                            ];
                          }
                        }
                      },
                      legend: {
                        position: 'top',
                        labels: {
                          usePointStyle: true,
                          boxWidth: 6
                        }
                      }
                    }
                  }}
                />
              ) : (
                <div className="text-gray-400 dark:text-gray-500">
                  {isRunning || testStateRef.current.isRunning ? 'Waiting for test data...' : 'No data available'}
                </div>
              )}
            </div>
          </div>

      
          <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Throughput Over Time</h3>
            <div className="w-full h-[400px] min-h-[400px] flex items-center justify-center relative">
              {results.throughputData.length > 0 ? (
                <Line
                  key={`throughput-chart-${chartKey}`}
                  ref={throughputChartRef}
                  data={{
                    labels: results.throughputData.map(d => d.time.toFixed(1) + 's'),
                    datasets: [
                      {
                        label: 'Total Requests',
                        data: results.throughputData.map(d => d.requests),
                        fill: false,
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 2,
                        pointRadius: 3,
                        pointBackgroundColor: 'rgba(16, 185, 129, 1)',
                        tension: 0.1
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                      duration: isActive ? 200 : 0
                    },
                    interaction: {
                      intersect: false,
                      mode: 'index'
                    },
                    scales: {
                      y: {
                        title: {
                          display: true,
                          text: 'Total Requests',
                          font: { size: 12 }
                        },
                        ticks: {
                          beginAtZero: true,
                          stepSize: 1
                        }
                      },
                      x: {
                        title: {
                          display: true,
                          text: 'Time (s)',
                          font: { size: 12 }
                        },
                        ticks: {
                          maxRotation: 0,
                          autoSkip: true,
                          maxTicksLimit: 10
                        }
                      }
                    },
                    plugins: {
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const dataPoint = results.throughputData[context.dataIndex];
                            return [
                              `Requests: ${dataPoint.requests}`,
                              `API: ${dataPoint.api}`
                            ];
                          }
                        }
                      },
                      legend: {
                        position: 'top',
                        labels: {
                          usePointStyle: true,
                          boxWidth: 6
                        }
                      }
                    }
                  }}
                />
              ) : (
                <div className="text-gray-400 dark:text-gray-500">
                  {isRunning || testStateRef.current.isRunning ? 'Waiting for test data...' : 'No data available'}
                </div>
              )}
            </div>
          </div>

          
          {selectedApis.length > 1 && (
            <div className="bg-white dark:bg-zinc-700 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">API Performance Summary</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">API</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Avg Response Time</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Success Rate</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Total Requests</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    {selectedApis.map(api => {
                      const apiData = results.responseTimeData.filter(d => d.api === api.name);
                      const avgTime = apiData.reduce((acc, curr) => acc + curr.responseTime, 0) / apiData.length || 0;
                      
                      return (
                        <tr key={api.id}>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{api.name}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{avgTime.toFixed(2)} ms</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                            {((apiData.length / (testConfig.iterations / selectedApis.length)) * 100).toFixed(2)}%
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{apiData.length}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const PerformanceTestingNotification = ({ isVisible, onClick, currentResults = null, testProgress = null }) => {
  // Disabled - no longer showing background notifications
  return null;
};

export const PerformanceTestingStatusBar = ({ isVisible, onClick, currentResults = null, testProgress = null }) => {
  // Disabled - no longer showing background notifications
  return null;
};

// Utility functions for managing performance test state globally
let globalTestState = null;

export const getGlobalTestState = () => globalTestState;

export const setGlobalTestState = (state) => {
  globalTestState = state;
};

export const isPerformanceTestRunning = () => {
  return globalTestState && globalTestState.isRunning;
};

export const getPerformanceTestResults = () => {
  return globalTestState ? globalTestState.results : null;
};

// Enhanced PerformanceTestingPanel with better global state management
const PerformanceTestingPanelWithState = (props) => {
  // Initialize component with global state if available
  const initialProps = {
    ...props,
    savedResults: props.savedResults || getPerformanceTestResults()
  };

  return <PerformanceTestingPanel {...initialProps} />;
};

export default PerformanceTestingPanelWithState;