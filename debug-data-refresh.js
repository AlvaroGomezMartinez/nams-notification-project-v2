/**
 * Debug functions to help troubleshoot data refresh issues
 */

/**
 * Debug function to check what's in the Log sheet
 */
function debugLogSheet() {
  console.log('=== Debug Log Sheet ===');
  
  try {
    const ss = getSpreadsheet();
    const logSheet = ss.getSheetByName("Log");
    
    if (!logSheet) {
      console.log('❌ No Log sheet found');
      return { error: 'No Log sheet found' };
    }
    
    const data = logSheet.getDataRange().getValues();
    console.log(`📊 Log sheet has ${data.length} rows`);
    
    if (data.length <= 1) {
      console.log('⚠️ Log sheet is empty (only headers or no data)');
      return { 
        rowCount: data.length,
        headers: data[0] || [],
        entries: []
      };
    }
    
    // Get today's date for filtering
    const today = new Date().toLocaleDateString();
    console.log(`🗓️ Looking for entries from: ${today}`);
    
    const todaysEntries = [];
    const allEntries = [];
    
    // Process all entries (skip header row)
    for (let r = 1; r < data.length; r++) {
      const row = data[r];
      const entryDate = row[0] ? new Date(row[0]).toLocaleDateString() : '';
      const studentName = row[1] || '';
      
      const entry = {
        rowIndex: r + 1,
        date: entryDate,
        studentName: studentName,
        studentId: row[2] || '',
        gender: row[3] || '',
        teacher: row[4] || '',
        outTime: row[5] || '',
        backTime: row[6] || '',
        holdNotice: row[7] || ''
      };
      
      allEntries.push(entry);
      
      if (entryDate === today) {
        todaysEntries.push(entry);
      }
    }
    
    console.log(`📊 Found ${todaysEntries.length} entries for today out of ${allEntries.length} total`);
    
    // Show last 5 entries for debugging
    const recentEntries = allEntries.slice(-5);
    console.log('📋 Last 5 entries:');
    recentEntries.forEach((entry, index) => {
      console.log(`  ${index + 1}. ${entry.date} - ${entry.studentName} - ${entry.outTime ? 'OUT' : ''}${entry.backTime ? 'BACK' : ''}${entry.holdNotice ? 'HOLD' : ''}`);
    });
    
    return {
      success: true,
      rowCount: data.length,
      headers: data[0] || [],
      totalEntries: allEntries.length,
      todaysEntries: todaysEntries.length,
      recentEntries: recentEntries,
      todaysData: todaysEntries
    };
    
  } catch (error) {
    console.error('❌ Error debugging log sheet:', error);
    return { 
      error: error.message,
      stack: error.stack 
    };
  }
}

/**
 * Debug function to check cache status
 */
function debugCacheStatus() {
  console.log('=== Debug Cache Status ===');
  
  try {
    const results = {
      scriptProperties: null,
      rosterService: null,
      logProcessing: null
    };
    
    // Check ScriptPropertiesManager
    try {
      const cacheManager = new ScriptPropertiesManager();
      const metrics = cacheManager.getMetrics();
      results.scriptProperties = {
        available: true,
        metrics: metrics
      };
      console.log('✓ ScriptPropertiesManager working');
    } catch (error) {
      results.scriptProperties = {
        available: false,
        error: error.message
      };
      console.log('❌ ScriptPropertiesManager error:', error.message);
    }
    
    // Check CachedRosterService
    try {
      const rosterService = new CachedRosterService();
      const cacheInfo = rosterService.getCacheInfo();
      results.rosterService = {
        available: true,
        cacheInfo: cacheInfo,
        rosterValid: rosterService.isRosterCacheValid(),
        statusValid: rosterService.isStatusCacheValid()
      };
      console.log('✓ CachedRosterService working');
      console.log(`  Roster cache valid: ${rosterService.isRosterCacheValid()}`);
      console.log(`  Status cache valid: ${rosterService.isStatusCacheValid()}`);
    } catch (error) {
      results.rosterService = {
        available: false,
        error: error.message
      };
      console.log('❌ CachedRosterService error:', error.message);
    }
    
    // Check LogProcessingService
    try {
      const logService = new LogProcessingService();
      const todaysEntries = logService.getTodaysLogEntries();
      const allStatuses = logService.getAllStudentStatuses();
      const cacheInfo = logService.getCacheInfo();
      
      results.logProcessing = {
        available: true,
        todaysEntries: todaysEntries.length,
        studentsWithStatus: Object.keys(allStatuses).length,
        cacheInfo: cacheInfo
      };
      console.log('✓ LogProcessingService working');
      console.log(`  Today's entries: ${todaysEntries.length}`);
      console.log(`  Students with status: ${Object.keys(allStatuses).length}`);
    } catch (error) {
      results.logProcessing = {
        available: false,
        error: error.message
      };
      console.log('❌ LogProcessingService error:', error.message);
    }
    
    return {
      success: true,
      results: results,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error debugging cache status:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Force clear all caches and reload fresh data
 */
function forceClearCachesAndReload() {
  console.log('=== Force Clear Caches and Reload ===');
  
  try {
    // Clear ScriptProperties cache
    const cacheManager = new ScriptPropertiesManager();
    cacheManager.clearAll();
    console.log('✓ Cleared ScriptProperties cache');
    
    // Clear CachedRosterService caches
    const rosterService = new CachedRosterService();
    rosterService.invalidateAllCaches();
    console.log('✓ Cleared CachedRosterService caches');
    
    // Clear LogProcessingService caches
    const logService = new LogProcessingService();
    logService.invalidateLogCaches();
    console.log('✓ Cleared LogProcessingService caches');
    
    // Now try to load fresh data
    console.log('🔄 Loading fresh data...');
    const freshData = api_getCachedStudentData();
    
    return {
      success: true,
      message: 'All caches cleared and fresh data loaded',
      freshData: freshData,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error clearing caches:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test the complete data flow from Log sheet to frontend
 */
function testCompleteDataFlow() {
  console.log('=== Test Complete Data Flow ===');
  
  const results = {
    steps: [],
    success: false
  };
  
  try {
    // Step 1: Check Log sheet
    console.log('Step 1: Checking Log sheet...');
    const logDebug = debugLogSheet();
    results.steps.push({
      step: 1,
      name: 'Check Log Sheet',
      success: !logDebug.error,
      data: logDebug
    });
    
    if (logDebug.error) {
      throw new Error(`Log sheet check failed: ${logDebug.error}`);
    }
    
    // Step 2: Test LogProcessingService
    console.log('Step 2: Testing LogProcessingService...');
    const logService = new LogProcessingService();
    const todaysEntries = logService.getTodaysLogEntries();
    const allStatuses = logService.getAllStudentStatuses();
    
    results.steps.push({
      step: 2,
      name: 'LogProcessingService',
      success: true,
      data: {
        todaysEntries: todaysEntries.length,
        studentsWithStatus: Object.keys(allStatuses).length,
        sampleStatuses: Object.keys(allStatuses).slice(0, 3)
      }
    });
    
    // Step 3: Test _getCurrentRestroomStatus
    console.log('Step 3: Testing _getCurrentRestroomStatus...');
    const currentStatus = _getCurrentRestroomStatus();
    
    results.steps.push({
      step: 3,
      name: '_getCurrentRestroomStatus',
      success: true,
      data: {
        studentsWithStatus: Object.keys(currentStatus).length,
        sampleStatuses: Object.keys(currentStatus).slice(0, 3)
      }
    });
    
    // Step 4: Test api_getCachedStudentData
    console.log('Step 4: Testing api_getCachedStudentData...');
    const cachedData = api_getCachedStudentData();
    
    results.steps.push({
      step: 4,
      name: 'api_getCachedStudentData',
      success: cachedData.success,
      data: {
        success: cachedData.success,
        studentCount: cachedData.data ? cachedData.data.students.length : 0,
        queueCount: cachedData.data ? (cachedData.data.queue.girls.length + cachedData.data.queue.boys.length) : 0,
        metadata: cachedData.metadata
      }
    });
    
    results.success = results.steps.every(step => step.success);
    
    console.log(`✓ Complete data flow test ${results.success ? 'PASSED' : 'FAILED'}`);
    
    return results;
    
  } catch (error) {
    console.error('❌ Data flow test failed:', error);
    results.steps.push({
      step: 'ERROR',
      name: 'Test Failed',
      success: false,
      error: error.message
    });
    
    return results;
  }
}

/**
 * Simple API endpoint to run debug functions from frontend
 */
function api_debugDataRefresh() {
  console.log('=== API Debug Data Refresh ===');
  
  return {
    logSheet: debugLogSheet(),
    cacheStatus: debugCacheStatus(),
    dataFlow: testCompleteDataFlow(),
    timestamp: new Date().toISOString()
  };
}

/**
 * API endpoint to force refresh all data
 */
function api_forceRefreshAllData() {
  console.log('=== API Force Refresh All Data ===');
  
  const clearResult = forceClearCachesAndReload();
  
  return {
    clearResult: clearResult,
    debugInfo: api_debugDataRefresh(),
    timestamp: new Date().toISOString()
  };
}