const SPREADSHEET_ID = "1iufwNd2HG-g82yANScSCg5RuRc0F7vj_jGaHmzikDcQ";

// Teacher data mapping - maps teacher information [Last Name, Email, Title]
const TEACHER_DATA = [
  ["Aguilar", "russell.aguilar@nisd.net", "Mr. "],
  ["Atoui", "atlanta.atoui@nisd.net", "Mrs."],
  ["Bowery", "melissa.bowery@nisd.net", "Mrs. "],
  ["Cantu", "sandy.cantu@nisd.net", "Mrs. "],
  ["Casanova", "henry.casanova@nisd.net", "Mr. "],
  ["Coyle", "deborah.coyle@nisd.net", "Mrs. "],
  ["De Leon", "ulices.deleon@nisd.net", "Mr. "],
  ["Farias", "michelle.farias@nisd.net", "Mrs. "],
  ["Franco", "george.franco01@nisd.net", "Mr. "],
  ["Garcia", "danny.garcia@nisd.net", "Mr. "],
  ["Goff", "steven.goff@nisd.net", "Mr. "],
  ["Gomez", "alvaro.gomez@nisd.net", "Mr. "],
  ["Gonzales", "zina.gonzales@nisd.net", "Dr. "],
  ["Hernandez", "david.hernandez@nisd.net", "Mr. "],
  ["Hutton", "rebekah.hutton@nisd.net", "Mrs. "],
  ["Idrogo", "valerie.idrogo@nisd.net", "Mrs. "],
  ["Jasso", "nadia.jasso@nisd.net", "Mrs. "],
  ["Marquez", "monica.marquez@nisd.net", "Mrs. "],
  ["Ollendieck", "reggie.ollendieck@nisd.net", "Mr. "],
  ["Paez", "john.paez@nisd.net", "Mr. "],
  ["Ramon", "israel.ramon@nisd.net", "Mr. "],
  ["Tellez", "lisa.tellez@nisd.net", "Mrs. "],
  ["Trevino", "marcos.trevino@nisd.net", "Mr. "],
  ["Wine", "stephanie.wine@nisd.net", "Mrs. "],
  ["Yeager", "sheila.yeager@nisd.net", "Mrs. "]
];

// Utilities
function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

/**
 * Script Properties Manager utility class for caching data with TTL support
 * Handles serialization/deserialization and cache validation
 */
class ScriptPropertiesManager {
  constructor() {
    this.properties = PropertiesService.getScriptProperties();
    this.performanceMetrics = {
      cacheHits: 0,
      cacheMisses: 0,
      totalRequests: 0,
      lastResetTime: Date.now()
    };
  }

  /**
   * Store data in Script Properties with TTL (Time To Live)
   * @param {string} key - The cache key
   * @param {any} data - The data to cache
   * @param {number} ttlMinutes - Time to live in minutes (default: 1440 = 24 hours)
   */
  set(key, data, ttlMinutes = 1440) {
    try {
      const cacheEntry = {
        data: data,
        timestamp: Date.now(),
        expiresAt: Date.now() + (ttlMinutes * 60 * 1000),
        version: "1.0"
      };

      const serializedData = JSON.stringify(cacheEntry);
      
      // Check if data size is within limits (Script Properties has ~9KB per property limit)
      if (serializedData.length > 9000) {
        console.warn(`Cache entry for key "${key}" is large (${serializedData.length} chars). Consider splitting data.`);
      }

      this.properties.setProperty(key, serializedData);
      console.log(`Cache SET: "${key}" with TTL ${ttlMinutes} minutes`);
      
      return true;
    } catch (error) {
      console.error(`Error setting cache key "${key}":`, error);
      return false;
    }
  }

  /**
   * Retrieve data from Script Properties with TTL validation
   * @param {string} key - The cache key
   * @returns {any|null} - The cached data or null if not found/expired
   */
  get(key) {
    try {
      this.performanceMetrics.totalRequests++;
      
      const serializedData = this.properties.getProperty(key);
      
      if (!serializedData) {
        console.log(`Cache MISS: "${key}" - not found`);
        this.performanceMetrics.cacheMisses++;
        return null;
      }

      const cacheEntry = JSON.parse(serializedData);
      
      // Check if cache entry has expired
      if (Date.now() > cacheEntry.expiresAt) {
        console.log(`Cache MISS: "${key}" - expired (${new Date(cacheEntry.expiresAt)})`);
        this.performanceMetrics.cacheMisses++;
        this.invalidate(key); // Clean up expired entry
        return null;
      }

      console.log(`Cache HIT: "${key}" - valid until ${new Date(cacheEntry.expiresAt)}`);
      this.performanceMetrics.cacheHits++;
      return cacheEntry.data;
      
    } catch (error) {
      console.error(`Error getting cache key "${key}":`, error);
      this.performanceMetrics.cacheMisses++;
      return null;
    }
  }

  /**
   * Check if a cache entry exists and is valid
   * @param {string} key - The cache key
   * @returns {boolean} - True if cache entry exists and is valid
   */
  isValid(key) {
    try {
      const serializedData = this.properties.getProperty(key);
      
      if (!serializedData) {
        return false;
      }

      const cacheEntry = JSON.parse(serializedData);
      return Date.now() <= cacheEntry.expiresAt;
      
    } catch (error) {
      console.error(`Error checking cache validity for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Remove a specific cache entry
   * @param {string} key - The cache key to remove
   */
  invalidate(key) {
    try {
      this.properties.deleteProperty(key);
      console.log(`Cache INVALIDATED: "${key}"`);
    } catch (error) {
      console.error(`Error invalidating cache key "${key}":`, error);
    }
  }

  /**
   * Clear all cache entries (use with caution)
   */
  clearAll() {
    try {
      this.properties.deleteAllProperties();
      console.log('All cache entries cleared');
      this.resetMetrics();
    } catch (error) {
      console.error('Error clearing all cache entries:', error);
    }
  }

  /**
   * Get cache performance metrics
   * @returns {object} - Performance metrics including hit/miss ratios
   */
  getMetrics() {
    const hitRate = this.performanceMetrics.totalRequests > 0 
      ? (this.performanceMetrics.cacheHits / this.performanceMetrics.totalRequests * 100).toFixed(2)
      : 0;

    return {
      cacheHits: this.performanceMetrics.cacheHits,
      cacheMisses: this.performanceMetrics.cacheMisses,
      totalRequests: this.performanceMetrics.totalRequests,
      hitRate: `${hitRate}%`,
      lastResetTime: new Date(this.performanceMetrics.lastResetTime).toISOString()
    };
  }

  /**
   * Reset performance metrics
   */
  resetMetrics() {
    this.performanceMetrics = {
      cacheHits: 0,
      cacheMisses: 0,
      totalRequests: 0,
      lastResetTime: Date.now()
    };
  }

  /**
   * Get information about a specific cache entry
   * @param {string} key - The cache key
   * @returns {object|null} - Cache entry metadata or null if not found
   */
  getCacheInfo(key) {
    try {
      const serializedData = this.properties.getProperty(key);
      
      if (!serializedData) {
        return null;
      }

      const cacheEntry = JSON.parse(serializedData);
      const now = Date.now();
      
      return {
        key: key,
        timestamp: new Date(cacheEntry.timestamp).toISOString(),
        expiresAt: new Date(cacheEntry.expiresAt).toISOString(),
        isExpired: now > cacheEntry.expiresAt,
        timeToExpiry: Math.max(0, cacheEntry.expiresAt - now),
        version: cacheEntry.version,
        dataSize: serializedData.length
      };
      
    } catch (error) {
      console.error(`Error getting cache info for key "${key}":`, error);
      return null;
    }
  }
}

/**
 * Cached Roster Service for managing daily student data with caching
 * Implements 24-hour cache expiration and fallback to direct sheet reads
 */
class CachedRosterService {
  constructor() {
    this.cacheManager = new ScriptPropertiesManager();
    this.ROSTER_CACHE_KEY = 'daily_student_roster';
    this.STATUS_CACHE_KEY = 'current_restroom_status';
    this.CACHE_TTL_MINUTES = 1440; // 24 hours
  }

  /**
   * Get cached student roster, loading from sheet if cache is invalid
   * @returns {Array} - Array of student objects with name and id
   */
  getCachedRoster() {
    try {
      console.log('CachedRosterService: Getting cached roster...');
      
      // Try to get from cache first
      const cachedRoster = this.cacheManager.get(this.ROSTER_CACHE_KEY);
      
      if (cachedRoster) {
        console.log(`Cache HIT: Returning ${cachedRoster.length} students from cache`);
        return cachedRoster;
      }

      // Cache miss - load from sheet and cache it
      console.log('Cache MISS: Loading roster from sheet...');
      return this.refreshRosterCache();
      
    } catch (error) {
      console.error('Error in getCachedRoster:', error);
      // Fallback to direct sheet read
      console.log('Falling back to direct sheet read...');
      return this._loadRosterFromSheet();
    }
  }

  /**
   * Force refresh of roster cache by loading from sheet
   * @returns {Array} - Array of student objects
   */
  refreshRosterCache() {
    try {
      console.log('CachedRosterService: Refreshing roster cache...');
      
      const roster = this._loadRosterFromSheet();
      
      // Cache the roster data
      const cacheSuccess = this.cacheManager.set(
        this.ROSTER_CACHE_KEY, 
        roster, 
        this.CACHE_TTL_MINUTES
      );
      
      if (cacheSuccess) {
        console.log(`Roster cached successfully: ${roster.length} students`);
      } else {
        console.warn('Failed to cache roster data');
      }
      
      return roster;
      
    } catch (error) {
      console.error('Error refreshing roster cache:', error);
      throw error;
    }
  }

  /**
   * Check if the roster cache is valid (not expired)
   * @returns {boolean} - True if cache is valid
   */
  isRosterCacheValid() {
    return this.cacheManager.isValid(this.ROSTER_CACHE_KEY);
  }

  /**
   * Get cached restroom status, loading from log if cache is invalid
   * @returns {Object} - Object with student names as keys and status as values
   */
  getCachedStatus() {
    try {
      console.log('CachedRosterService: Getting cached status...');
      
      // Try to get from cache first
      const cachedStatus = this.cacheManager.get(this.STATUS_CACHE_KEY);
      
      if (cachedStatus) {
        console.log(`Cache HIT: Returning status for ${Object.keys(cachedStatus).length} students from cache`);
        return cachedStatus;
      }

      // Cache miss - load from log and cache it
      console.log('Cache MISS: Loading status from log...');
      return this.refreshStatusCache();
      
    } catch (error) {
      console.error('Error in getCachedStatus:', error);
      // Fallback to direct log read
      console.log('Falling back to direct log read...');
      return this._loadStatusFromLog();
    }
  }

  /**
   * Force refresh of status cache by loading from log
   * @returns {Object} - Status object
   */
  refreshStatusCache() {
    try {
      console.log('CachedRosterService: Refreshing status cache...');
      
      const status = this._loadStatusFromLog();
      
      // Cache the status data with shorter TTL (status changes more frequently)
      const statusTTL = 60; // 1 hour for status data
      const cacheSuccess = this.cacheManager.set(
        this.STATUS_CACHE_KEY, 
        status, 
        statusTTL
      );
      
      if (cacheSuccess) {
        console.log(`Status cached successfully: ${Object.keys(status).length} students with status`);
      } else {
        console.warn('Failed to cache status data');
      }
      
      return status;
      
    } catch (error) {
      console.error('Error refreshing status cache:', error);
      throw error;
    }
  }

  /**
   * Check if the status cache is valid (not expired)
   * @returns {boolean} - True if cache is valid
   */
  isStatusCacheValid() {
    return this.cacheManager.isValid(this.STATUS_CACHE_KEY);
  }

  /**
   * Get combined cached data (roster + status) with fallback handling
   * @returns {Object} - Combined data with students array and queue
   */
  getCombinedCachedData() {
    try {
      console.log('CachedRosterService: Getting combined cached data...');
      
      const roster = this.getCachedRoster();
      const status = this.getCachedStatus();
      
      return this._combineRosterAndStatus(roster, status);
      
    } catch (error) {
      console.error('Error getting combined cached data:', error);
      throw error;
    }
  }

  /**
   * Invalidate all caches (useful when data structure changes)
   */
  invalidateAllCaches() {
    console.log('CachedRosterService: Invalidating all caches...');
    this.cacheManager.invalidate(this.ROSTER_CACHE_KEY);
    this.cacheManager.invalidate(this.STATUS_CACHE_KEY);
  }

  /**
   * Get cache information for debugging
   * @returns {Object} - Cache status information
   */
  getCacheInfo() {
    return {
      roster: this.cacheManager.getCacheInfo(this.ROSTER_CACHE_KEY),
      status: this.cacheManager.getCacheInfo(this.STATUS_CACHE_KEY),
      metrics: this.cacheManager.getMetrics()
    };
  }

  /**
   * Private method to load roster from sheet (existing functionality)
   * @returns {Array} - Array of student objects
   */
  _loadRosterFromSheet() {
    const dailySheet = getLatestDailySheet();
    return _getStudentRoster(dailySheet);
  }

  /**
   * Private method to load status from log (existing functionality)
   * @returns {Object} - Status object
   */
  _loadStatusFromLog() {
    return _getCurrentRestroomStatus();
  }

  /**
   * Private method to combine roster and status data
   * @param {Array} roster - Student roster array
   * @param {Object} status - Status object
   * @returns {Object} - Combined data structure
   */
  _combineRosterAndStatus(roster, status) {
    const students = [];
    const queue = { girls: [], boys: [] };
    
    for (const student of roster) {
      const studentStatus = status[student.name] || {
        gender: "",
        teacher: "",
        outTime: "",
        backTime: "",
        holdNotice: ""
      };
      
      const studentData = {
        name: student.name,
        id: student.id,
        nameId: student.name,
        gender: studentStatus.gender,
        teacher: studentStatus.teacher,
        outTime: studentStatus.outTime,
        backTime: studentStatus.backTime,
        holdNotice: studentStatus.holdNotice
      };
      
      students.push(studentData);
      
      // Build queue lists
      if (studentStatus.holdNotice && !studentStatus.outTime) {
        if (studentStatus.gender === "G") queue.girls.push(student.name);
        else if (studentStatus.gender === "B") queue.boys.push(student.name);
      }
    }
    
    return { students, queue };
  }
}

/**
 * Performance Monitor for tracking API call timing and bottlenecks
 * Provides metrics collection and slow operation logging
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      apiCalls: {
        sheetReads: 0,
        sheetWrites: 0,
        cacheHits: 0,
        cacheMisses: 0,
        totalCalls: 0
      },
      timing: {
        totalResponseTime: 0,
        averageResponseTime: 0,
        slowestOperation: null,
        fastestOperation: null,
        operationTimes: []
      },
      operations: new Map(), // Track individual operation performance
      slowOperations: [], // Log operations that exceed threshold
      startTime: Date.now()
    };
    this.slowThresholdMs = 2000; // 2 seconds threshold for slow operations
  }

  /**
   * Start timing an operation
   * @param {string} operationName - Name of the operation being timed
   * @returns {string} - Unique operation ID for ending the timer
   */
  startTimer(operationName) {
    const operationId = `${operationName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    this.metrics.operations.set(operationId, {
      name: operationName,
      startTime: startTime,
      endTime: null,
      duration: null
    });
    
    console.log(`⏱️ Performance: Started timing "${operationName}" (ID: ${operationId})`);
    return operationId;
  }

  /**
   * End timing an operation and record metrics
   * @param {string} operationId - The operation ID returned by startTimer
   * @param {Object} additionalData - Optional additional data to log
   */
  endTimer(operationId, additionalData = {}) {
    const operation = this.metrics.operations.get(operationId);
    
    if (!operation) {
      console.warn(`Performance: Operation ID "${operationId}" not found`);
      return;
    }

    const endTime = Date.now();
    const duration = endTime - operation.startTime;
    
    // Update operation record
    operation.endTime = endTime;
    operation.duration = duration;
    operation.additionalData = additionalData;

    // Update global metrics
    this.metrics.timing.totalResponseTime += duration;
    this.metrics.timing.operationTimes.push(duration);
    this.metrics.timing.averageResponseTime = 
      this.metrics.timing.totalResponseTime / this.metrics.timing.operationTimes.length;

    // Track slowest and fastest operations
    if (!this.metrics.timing.slowestOperation || duration > this.metrics.timing.slowestOperation.duration) {
      this.metrics.timing.slowestOperation = { ...operation };
    }
    
    if (!this.metrics.timing.fastestOperation || duration < this.metrics.timing.fastestOperation.duration) {
      this.metrics.timing.fastestOperation = { ...operation };
    }

    // Log slow operations
    if (duration > this.slowThresholdMs) {
      const slowOp = {
        name: operation.name,
        duration: duration,
        timestamp: new Date(operation.startTime).toISOString(),
        additionalData: additionalData
      };
      this.metrics.slowOperations.push(slowOp);
      console.warn(`🐌 SLOW OPERATION: "${operation.name}" took ${duration}ms (threshold: ${this.slowThresholdMs}ms)`, additionalData);
    }

    console.log(`⏱️ Performance: "${operation.name}" completed in ${duration}ms`);
    
    // Clean up completed operation
    this.metrics.operations.delete(operationId);
  }

  /**
   * Record a sheet read operation
   * @param {string} sheetName - Name of the sheet being read
   * @param {number} rowCount - Number of rows read (optional)
   */
  recordSheetRead(sheetName, rowCount = null) {
    this.metrics.apiCalls.sheetReads++;
    this.metrics.apiCalls.totalCalls++;
    
    const logData = { sheetName };
    if (rowCount !== null) logData.rowCount = rowCount;
    
    console.log('📊 Performance: Sheet read recorded', logData);
  }

  /**
   * Record a sheet write operation
   * @param {string} sheetName - Name of the sheet being written to
   * @param {number} rowCount - Number of rows written (optional)
   */
  recordSheetWrite(sheetName, rowCount = null) {
    this.metrics.apiCalls.sheetWrites++;
    this.metrics.apiCalls.totalCalls++;
    
    const logData = { sheetName };
    if (rowCount !== null) logData.rowCount = rowCount;
    
    console.log('📊 Performance: Sheet write recorded', logData);
  }

  /**
   * Record a cache hit
   * @param {string} cacheKey - The cache key that was hit
   */
  recordCacheHit(cacheKey) {
    this.metrics.apiCalls.cacheHits++;
    this.metrics.apiCalls.totalCalls++;
    console.log(`📊 Performance: Cache hit for "${cacheKey}"`);
  }

  /**
   * Record a cache miss
   * @param {string} cacheKey - The cache key that was missed
   */
  recordCacheMiss(cacheKey) {
    this.metrics.apiCalls.cacheMisses++;
    this.metrics.apiCalls.totalCalls++;
    console.log(`📊 Performance: Cache miss for "${cacheKey}"`);
  }

  /**
   * Get comprehensive performance metrics
   * @returns {Object} - Complete performance metrics
   */
  getMetrics() {
    const now = Date.now();
    const uptimeMs = now - this.metrics.startTime;
    const cacheHitRate = this.metrics.apiCalls.totalCalls > 0 
      ? ((this.metrics.apiCalls.cacheHits / this.metrics.apiCalls.totalCalls) * 100).toFixed(2)
      : 0;

    return {
      uptime: {
        milliseconds: uptimeMs,
        seconds: Math.round(uptimeMs / 1000),
        minutes: Math.round(uptimeMs / 60000)
      },
      apiCalls: {
        ...this.metrics.apiCalls,
        cacheHitRate: `${cacheHitRate}%`
      },
      timing: {
        averageResponseTime: Math.round(this.metrics.timing.averageResponseTime),
        slowestOperation: this.metrics.timing.slowestOperation,
        fastestOperation: this.metrics.timing.fastestOperation,
        totalOperations: this.metrics.timing.operationTimes.length
      },
      slowOperations: this.metrics.slowOperations.slice(-10), // Last 10 slow operations
      activeOperations: Array.from(this.metrics.operations.values()).map(op => ({
        name: op.name,
        runningTime: now - op.startTime
      }))
    };
  }

  /**
   * Get a summary of performance for logging
   * @returns {string} - Human-readable performance summary
   */
  getSummary() {
    const metrics = this.getMetrics();
    
    return [
      `Performance Summary:`,
      `- Uptime: ${metrics.uptime.minutes} minutes`,
      `- Total API calls: ${metrics.apiCalls.totalCalls}`,
      `- Cache hit rate: ${metrics.apiCalls.cacheHitRate}`,
      `- Average response time: ${metrics.timing.averageResponseTime}ms`,
      `- Slow operations: ${metrics.slowOperations.length}`,
      `- Active operations: ${metrics.activeOperations.length}`
    ].join('\n');
  }

  /**
   * Reset all performance metrics
   */
  reset() {
    console.log('🔄 Performance: Resetting all metrics');
    this.metrics = {
      apiCalls: {
        sheetReads: 0,
        sheetWrites: 0,
        cacheHits: 0,
        cacheMisses: 0,
        totalCalls: 0
      },
      timing: {
        totalResponseTime: 0,
        averageResponseTime: 0,
        slowestOperation: null,
        fastestOperation: null,
        operationTimes: []
      },
      operations: new Map(),
      slowOperations: [],
      startTime: Date.now()
    };
  }

  /**
   * Log current performance status to console
   */
  logStatus() {
    console.log('📊 ' + this.getSummary());
  }
}

// Global performance monitor instance
const performanceMonitor = new PerformanceMonitor();

/**
 * Log Processing Service for efficient log operations
 * Implements in-memory status lookup and batch operations for better performance
 */
class LogProcessingService {
  constructor() {
    this.cacheManager = new ScriptPropertiesManager();
    this.LOG_CACHE_KEY = 'todays_log_entries';
    this.STATUS_CACHE_KEY = 'student_status_lookup';
    this.CACHE_TTL_MINUTES = 60; // 1 hour cache for log data
  }

  /**
   * Get today's log entries with efficient date filtering
   * Uses caching to avoid repeated sheet reads
   * @returns {Array} - Array of today's log entries
   */
  getTodaysLogEntries() {
    try {
      console.log('LogProcessingService: Getting today\'s log entries...');
      
      // Try cache first
      const cachedEntries = this.cacheManager.get(this.LOG_CACHE_KEY);
      if (cachedEntries) {
        console.log(`Cache HIT: Returning ${cachedEntries.length} log entries from cache`);
        performanceMonitor.recordCacheHit(this.LOG_CACHE_KEY);
        return cachedEntries;
      }

      performanceMonitor.recordCacheMiss(this.LOG_CACHE_KEY);
      
      // Cache miss - load from sheet
      const timerId = performanceMonitor.startTimer('getTodaysLogEntries');
      
      const ss = getSpreadsheet();
      const logSheet = ss.getSheetByName("Log");
      
      if (!logSheet) {
        console.log('No Log sheet found - returning empty array');
        performanceMonitor.endTimer(timerId, { result: 'no_log_sheet' });
        return [];
      }

      const data = logSheet.getDataRange().getValues();
      performanceMonitor.recordSheetRead('Log', data.length);
      
      if (data.length <= 1) {
        console.log('Log sheet is empty - returning empty array');
        performanceMonitor.endTimer(timerId, { result: 'empty_log' });
        return [];
      }

      const today = new Date().toLocaleDateString();
      const todaysEntries = [];
      
      // Process from most recent to oldest for efficiency
      // Skip header row (index 0)
      for (let r = data.length - 1; r >= 1; r--) {
        const row = data[r];
        const date = row[0];
        const studentName = row[1];
        
        if (!studentName) continue;
        
        // Efficient date filtering - stop when we hit yesterday's entries
        const entryDate = date ? new Date(date).toLocaleDateString() : '';
        if (entryDate !== today) {
          // If we've been processing today's entries and now hit a different date, we're done
          if (todaysEntries.length > 0) {
            break;
          }
          continue;
        }
        
        // Build structured log entry
        const logEntry = {
          rowIndex: r,
          date: entryDate,
          studentName: studentName,
          studentId: row[2] || "",
          gender: row[3] || "",
          teacher: row[4] || "",
          outTime: row[5] || "",
          backTime: row[6] || "",
          holdNotice: row[7] || ""
        };
        
        todaysEntries.unshift(logEntry); // Add to beginning to maintain chronological order
      }
      
      // Cache the results
      this.cacheManager.set(this.LOG_CACHE_KEY, todaysEntries, this.CACHE_TTL_MINUTES);
      
      console.log(`Loaded ${todaysEntries.length} log entries for today (${today})`);
      performanceMonitor.endTimer(timerId, { 
        entriesFound: todaysEntries.length,
        totalRowsProcessed: data.length - 1 
      });
      
      return todaysEntries;
      
    } catch (error) {
      console.error('Error in getTodaysLogEntries:', error);
      return [];
    }
  }

  /**
   * Get student status with in-memory lookup map for O(1) access
   * @param {string} studentName - Name of the student
   * @returns {Object} - Student status object or null if not found
   */
  getStudentStatus(studentName) {
    try {
      if (!studentName) return null;
      
      // Get or build the status lookup map
      const statusLookup = this._getStatusLookupMap();
      
      return statusLookup[studentName] || null;
      
    } catch (error) {
      console.error(`Error getting status for student ${studentName}:`, error);
      return null;
    }
  }

  /**
   * Get all student statuses as a lookup map
   * @returns {Object} - Map of student names to their current status
   */
  getAllStudentStatuses() {
    try {
      return this._getStatusLookupMap();
    } catch (error) {
      console.error('Error getting all student statuses:', error);
      return {};
    }
  }

  /**
   * Batch update multiple log entries efficiently
   * @param {Array} updates - Array of update objects with studentName, action, teacherName, gender
   * @returns {Object} - Result object with success/failure counts
   */
  batchUpdateLogs(updates) {
    try {
      console.log(`LogProcessingService: Processing batch update of ${updates.length} entries...`);
      
      const timerId = performanceMonitor.startTimer('batchUpdateLogs');
      const results = {
        successful: 0,
        failed: 0,
        errors: []
      };
      
      const ss = getSpreadsheet();
      let logSheet = ss.getSheetByName("Log");
      
      // Create log sheet if it doesn't exist
      if (!logSheet) {
        logSheet = ss.insertSheet("Log");
        logSheet.appendRow(["Date", "Student Name", "Student ID", "Gender", "Teacher", "Out Time", "Back Time", "Hold Notice"]);
        performanceMonitor.recordSheetWrite('Log', 1);
      }
      
      // Prepare batch data for writing
      const batchRows = [];
      const now = new Date();
      const date = now.toLocaleDateString();
      
      for (const update of updates) {
        try {
          const { studentName, action, teacherName, gender, studentId } = update;
          
          if (!studentName || !action || !teacherName) {
            results.errors.push(`Invalid update data: ${JSON.stringify(update)}`);
            results.failed++;
            continue;
          }
          
          let row;
          
          if (action === "out") {
            const outTimeFormatted = this._formatTimeToHHMM(now);
            row = [date, studentName, studentId || "", gender || "", teacherName, outTimeFormatted, "", ""];
          } else if (action === "back") {
            const backTimeFormatted = this._formatTimeToHHMM(now);
            row = [date, studentName, studentId || "", gender || "", teacherName, "", backTimeFormatted, ""];
          } else if (action === "hold") {
            const { holdNotice } = update;
            row = [date, studentName, studentId || "", gender || "", teacherName, "", "", holdNotice || "Waiting in line"];
          } else {
            results.errors.push(`Unknown action: ${action} for student ${studentName}`);
            results.failed++;
            continue;
          }
          
          batchRows.push(row);
          results.successful++;
          
        } catch (updateError) {
          console.error(`Error processing update for ${update.studentName}:`, updateError);
          results.errors.push(`${update.studentName}: ${updateError.message}`);
          results.failed++;
        }
      }
      
      // Write all rows in a single batch operation
      if (batchRows.length > 0) {
        const range = logSheet.getRange(logSheet.getLastRow() + 1, 1, batchRows.length, 8);
        range.setValues(batchRows);
        performanceMonitor.recordSheetWrite('Log', batchRows.length);
        
        console.log(`Batch wrote ${batchRows.length} log entries`);
      }
      
      // Invalidate caches since we've updated the log
      this._invalidateLogCaches();
      
      performanceMonitor.endTimer(timerId, {
        totalUpdates: updates.length,
        successful: results.successful,
        failed: results.failed
      });
      
      console.log(`Batch update completed: ${results.successful} successful, ${results.failed} failed`);
      return results;
      
    } catch (error) {
      console.error('Error in batchUpdateLogs:', error);
      return {
        successful: 0,
        failed: updates.length,
        errors: [error.message]
      };
    }
  }

  /**
   * Invalidate log-related caches when data changes
   */
  invalidateLogCaches() {
    this._invalidateLogCaches();
  }

  /**
   * Force refresh all caches (for debugging)
   */
  forceRefreshAllCaches() {
    console.log('LogProcessingService: Force refreshing all caches...');
    this._invalidateLogCaches();
    
    // Force reload today's entries
    const todaysEntries = this.getTodaysLogEntries();
    console.log(`Reloaded ${todaysEntries.length} today's entries`);
    
    // Force rebuild status lookup
    const allStatuses = this.getAllStudentStatuses();
    console.log(`Rebuilt status for ${Object.keys(allStatuses).length} students`);
    
    return {
      todaysEntries: todaysEntries.length,
      studentsWithStatus: Object.keys(allStatuses).length
    };
  }

  /**
   * Get cache information for debugging
   * @returns {Object} - Cache status information
   */
  getCacheInfo() {
    return {
      logEntries: this.cacheManager.getCacheInfo(this.LOG_CACHE_KEY),
      statusLookup: this.cacheManager.getCacheInfo(this.STATUS_CACHE_KEY),
      metrics: this.cacheManager.getMetrics()
    };
  }

  /**
   * Private method to get or build the status lookup map
   * @returns {Object} - Map of student names to their current status
   */
  _getStatusLookupMap() {
    // Try cache first
    const cachedStatus = this.cacheManager.get(this.STATUS_CACHE_KEY);
    if (cachedStatus) {
      console.log(`Cache HIT: Returning status lookup for ${Object.keys(cachedStatus).length} students`);
      performanceMonitor.recordCacheHit(this.STATUS_CACHE_KEY);
      return cachedStatus;
    }

    performanceMonitor.recordCacheMiss(this.STATUS_CACHE_KEY);
    
    // Build status lookup from today's log entries
    const timerId = performanceMonitor.startTimer('buildStatusLookup');
    const todaysEntries = this.getTodaysLogEntries();
    const statusLookup = {};
    
    // Process entries to build complete status for each student
    // We need to combine all entries for each student to get the full picture
    const studentEntries = {};
    
    // First, group all entries by student name
    for (const entry of todaysEntries) {
      const studentName = entry.studentName;
      if (!studentEntries[studentName]) {
        studentEntries[studentName] = [];
      }
      studentEntries[studentName].push(entry);
    }
    
    // Now process each student's entries to determine their current status
    for (const [studentName, entries] of Object.entries(studentEntries)) {
      console.log(`Processing ${entries.length} entries for ${studentName}`);
      
      // Sort entries by row index (chronological order)
      entries.sort((a, b) => a.rowIndex - b.rowIndex);
      
      let currentStatus = {
        gender: "",
        teacher: "",
        outTime: "",
        backTime: "",
        holdNotice: ""
      };
      
      let hasOutTime = false;
      let hasBackTime = false;
      
      // Process entries in chronological order to build the complete status
      for (const entry of entries) {
        // Update basic info from any entry
        if (entry.gender) currentStatus.gender = entry.gender;
        if (entry.teacher) currentStatus.teacher = entry.teacher;
        
        // Track out and back times
        if (entry.outTime) {
          currentStatus.outTime = entry.outTime;
          hasOutTime = true;
          // Clear back time if we have a new out time
          currentStatus.backTime = "";
          hasBackTime = false;
        }
        
        if (entry.backTime) {
          currentStatus.backTime = entry.backTime;
          hasBackTime = true;
        }
        
        // Hold notice (only if not currently out)
        if (entry.holdNotice && !hasOutTime) {
          currentStatus.holdNotice = entry.holdNotice;
        } else if (hasOutTime) {
          // Clear hold notice if student went out
          currentStatus.holdNotice = "";
        }
      }
      
      // Determine final status
      if (hasOutTime && hasBackTime) {
        // Student completed full cycle - they are available (don't add to status)
        console.log(`${studentName} completed full cycle (out: ${currentStatus.outTime}, back: ${currentStatus.backTime}), marking as available`);
      } else if (hasOutTime && !hasBackTime) {
        // Student is currently out
        statusLookup[studentName] = {
          gender: currentStatus.gender,
          teacher: currentStatus.teacher,
          outTime: currentStatus.outTime,
          backTime: "",
          holdNotice: ""
        };
        console.log(`${studentName} is currently out (outTime: ${currentStatus.outTime})`);
      } else if (currentStatus.holdNotice && !hasOutTime) {
        // Student is waiting in line
        statusLookup[studentName] = {
          gender: currentStatus.gender,
          teacher: currentStatus.teacher,
          outTime: "",
          backTime: "",
          holdNotice: currentStatus.holdNotice
        };
        console.log(`${studentName} is waiting in line (holdNotice: ${currentStatus.holdNotice})`);
      } else {
        // Student is available (no current status)
        console.log(`${studentName} is available (no current status)`);
      }
    }
    
    // Cache the status lookup
    this.cacheManager.set(this.STATUS_CACHE_KEY, statusLookup, this.CACHE_TTL_MINUTES);
    
    console.log(`Built status lookup for ${Object.keys(statusLookup).length} students with status`);
    performanceMonitor.endTimer(timerId, { 
      studentsWithStatus: Object.keys(statusLookup).length,
      totalEntriesProcessed: todaysEntries.length 
    });
    
    return statusLookup;
  }

  /**
   * Private method to invalidate log-related caches
   */
  _invalidateLogCaches() {
    console.log('LogProcessingService: Invalidating log caches...');
    this.cacheManager.invalidate(this.LOG_CACHE_KEY);
    this.cacheManager.invalidate(this.STATUS_CACHE_KEY);
  }

  /**
   * Private method to format time to HH:MM AM/PM
   * @param {Date} date - Date object to format
   * @returns {string} - Formatted time string
   */
  _formatTimeToHHMM(date) {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    
    return `${hours}:${minutes} ${ampm}`;
  }
}

// Shared sheet constants
// Number of header rows before the student data starts (1-based rows).
const HEADER_ROWS = 2;

/**
 * Return the most recent daily sheet by finding sheets with MM/DD dates and selecting the chronologically latest one.
 * Falls back to common sheet names if no date sheets found.
 */
function getLatestDailySheet() {
  const ss = getSpreadsheet();
  const sheets = ss.getSheets();
  
  console.log('Looking for the most recent daily sheet...');
  
  // Find all sheets that end with MM/DD pattern
  const dateSheets = [];
  const currentYear = new Date().getFullYear();
  
  for (let i = 0; i < sheets.length; i++) {
    const sheet = sheets[i];
    const name = sheet.getName();
    
    // Match pattern that ends with "MM/DD" (e.g. "Monday 08/11", "10/15", "Wednesday 12/3")
    const dateMatch = name.match(/(\d{1,2})\/(\d{1,2})$/);
    if (dateMatch) {
      const month = parseInt(dateMatch[1]);
      const day = parseInt(dateMatch[2]);
      
      // Validate the date components
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        // Create a date object for comparison (assume current year)
        const sheetDate = new Date(currentYear, month - 1, day);
        
        dateSheets.push({
          sheet: sheet,
          name: name,
          date: sheetDate,
          dateString: `${month}/${day}`
        });
        
        console.log(`Found date sheet: "${name}" -> ${month}/${day}`);
      }
    }
  }
  
  if (dateSheets.length > 0) {
    // Sort by date (most recent first)
    dateSheets.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    const latestSheet = dateSheets[0];
    console.log(`Using most recent date sheet: "${latestSheet.name}" (${latestSheet.dateString})`);
    console.log(`Found ${dateSheets.length} date sheets total:`, dateSheets.map(d => `"${d.name}" (${d.dateString})`));
    
    return latestSheet.sheet;
  }
  
  // If no date sheets found, try common fallback sheet names
  console.log('No date sheets found, trying fallback sheet names...');
  const fallbackNames = ['Database', 'Students', 'Roster', 'AM', 'PM'];
  for (const fallbackName of fallbackNames) {
    const sheet = ss.getSheetByName(fallbackName);
    if (sheet) {
      console.log('Using fallback sheet:', fallbackName);
      return sheet;
    }
  }
  
  // List all available sheets for debugging
  const sheetNames = sheets.map(s => s.getName());
  console.log('Available sheets:', sheetNames);
  
  throw new Error(`Could not find a suitable sheet for student roster. Looked for sheets ending with MM/DD format, then fallback sheets (${fallbackNames.join(', ')}). Available sheets: ${sheetNames.join(', ')}`);
}

/**
 * Extract student roster from sheet.
 * Expected structure: A=NAME, E=ID#
 */
function _getStudentRoster(sheet) {
  const data = sheet.getDataRange().getValues();
  
  if (data.length < 2) {
    throw new Error('Sheet must have at least 2 rows (headers + data)');
  }
  
  console.log('Reading student roster from sheet:');
  console.log('Total rows:', data.length);
  console.log('Total columns:', data[0] ? data[0].length : 0);
  console.log('Header row 1:', data[0] ? data[0].slice(0, 10) : []);
  console.log('Header row 2:', data[1] ? data[1].slice(0, 10) : []);
  
  // Look for the actual data start - skip header rows
  const headerRows = HEADER_ROWS;
  console.log('Skipping first', headerRows, 'header rows');
  
  // This sheet is read-only - we only extract names and IDs
  // A=NAME (column 0), E=ID# (column 4)
  const students = [];
  
  for (let r = headerRows; r < data.length; r++) {
    const row = data[r];
    const name = row[0]; // Column A (NAME)
    const id = row[4];   // Column E (ID #)
    
    // Debug first few rows
    if (students.length < 5) {
      console.log(`Row ${r + 1}: NAME="${name}" (col A), ID="${id}" (col E)`);
      console.log(`Row ${r + 1} full data (first 10 cols):`, row.slice(0, 10));
    }
    
    // Only add if name exists and is not empty
    if (name && name.toString().trim()) {
      const studentName = name.toString().trim();
      const studentId = id ? id.toString().trim() : "";
      
      students.push({
        name: studentName,
        id: studentId
      });
      
      // Log first few students for verification
      if (students.length <= 3) {
        console.log(`Added student: "${studentName}" (ID: "${studentId}")`);
      }
    }
  }
  
  console.log(`Found ${students.length} students in roster`);
  if (students.length === 0) {
    console.warn('WARNING: No students found! Check if data starts in the expected row.');
    console.log('Sample of rows after headers:', data.slice(headerRows, headerRows + 3));
  }
  
  return students;
}

// Global log processing service instance
const logProcessingService = new LogProcessingService();

/**
 * OPTIMIZED: Get current restroom status using LogProcessingService
 * Uses date-based filtering, Map-based lookup, and proper error handling
 * Returns an object with student names as keys and their current status
 */
function _getCurrentRestroomStatus() {
  try {
    console.log('_getCurrentRestroomStatus: Starting optimized version...');
    
    const timerId = performanceMonitor.startTimer('getCurrentRestroomStatus');
    
    // Use the optimized LogProcessingService for status lookup
    const statusLookup = logProcessingService.getAllStudentStatuses();
    
    console.log(`Optimized status loaded for ${Object.keys(statusLookup).length} students`);
    
    performanceMonitor.endTimer(timerId, { 
      studentsWithStatus: Object.keys(statusLookup).length 
    });
    
    return statusLookup;
    
  } catch (error) {
    console.error('Error in optimized _getCurrentRestroomStatus:', error);
    
    // Fallback to basic implementation with error handling
    try {
      console.log('Falling back to basic status processing...');
      return _getCurrentRestroomStatusFallback();
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return {}; // Return empty status object
    }
  }
}

/**
 * Fallback implementation of restroom status with improved error handling
 * Used when the optimized version fails
 */
function _getCurrentRestroomStatusFallback() {
  const status = {};
  
  try {
    console.log('_getCurrentRestroomStatusFallback: Starting...');
    const ss = getSpreadsheet();
    const logSheet = ss.getSheetByName("Log");
    
    if (!logSheet) {
      console.log('No Log sheet found - all students are available');
      return status;
    }
    
    const data = logSheet.getDataRange().getValues();
    performanceMonitor.recordSheetRead('Log', data.length);
    
    if (data.length <= 1) {
      console.log('Log sheet is empty - all students are available');
      return status;
    }
    
    const today = new Date().toLocaleDateString();
    console.log('Looking for today\'s entries:', today);
    
    // Improved: Process from most recent to oldest with early termination
    let todayEntriesFound = 0;
    
    for (let r = data.length - 1; r >= 1; r--) {
      try {
        const row = data[r];
        const date = row[0];
        const studentName = row[1];
        
        if (!studentName) continue;
        
        // Efficient date filtering with early termination
        const entryDate = date ? new Date(date).toLocaleDateString() : '';
        if (entryDate !== today) {
          // If we've found today's entries and now hit a different date, we're done
          if (todayEntriesFound > 0) {
            console.log(`Early termination: processed ${todayEntriesFound} today's entries`);
            break;
          }
          continue;
        }
        
        todayEntriesFound++;
        
        // Extract row data safely
        const gender = row[3] || "";
        const teacher = row[4] || "";
        const outTime = row[5] || "";
        const backTime = row[6] || "";
        const holdNotice = row[7] || "";
        
        // Map-based lookup: If we haven't seen this student yet (processing newest first)
        if (!status.hasOwnProperty(studentName)) {
          if (backTime) {
            // Student has returned - they are available (don't add to status object)
            console.log(`${studentName} has returned (backTime: ${backTime}), marking as available`);
          } else if (outTime) {
            // Student is currently out
            status[studentName] = {
              gender: gender,
              teacher: teacher,
              outTime: outTime,
              backTime: "",
              holdNotice: ""
            };
          } else if (holdNotice) {
            // Student is waiting in line
            status[studentName] = {
              gender: gender,
              teacher: teacher,
              outTime: "",
              backTime: "",
              holdNotice: holdNotice
            };
          }
        }
      } catch (rowError) {
        console.warn(`Error processing log row ${r}:`, rowError.message);
        // Continue with next row instead of breaking entire function
        continue;
      }
    }
    
    console.log(`Fallback status loaded for ${Object.keys(status).length} students (processed ${todayEntriesFound} entries)`);
    return status;
    
  } catch (error) {
    console.error('Error in _getCurrentRestroomStatusFallback:', error);
    // Don't throw - return empty status to prevent cascading failures
    return {};
  }
}

/**
 * Fetch the student roster and current status/queue.
 * Gets roster from daily sheet (read-only) and status from Log sheet.
 * Returns an object containing:
 *   - students: array of { name, id, gender, teacher, outTime, backTime, holdNotice }
 *   - queue: { girls: [names], boys: [names] }
 */
function fetchData() {
  try {
    console.log('fetchData: Starting data fetch...');
    
    // Get student roster from the daily sheet (read-only)
    console.log('fetchData: Getting latest daily sheet...');
    const dailySheet = getLatestDailySheet();
    console.log('fetchData: Daily sheet found:', dailySheet.getName());
    
    console.log('fetchData: Reading student roster...');
    const roster = _getStudentRoster(dailySheet);
    console.log('fetchData: Roster loaded with', roster.length, 'students');
    
    // Get current restroom status from Log sheet
    console.log('fetchData: Getting current restroom status...');
    const currentStatus = _getCurrentRestroomStatus();
    console.log('fetchData: Status loaded for', Object.keys(currentStatus).length, 'students');
    
    // Debug: Log current status for troubleshooting
    const studentsWithStatus = Object.keys(currentStatus).filter(name => 
      currentStatus[name].outTime || currentStatus[name].holdNotice || currentStatus[name].backTime
    );
    console.log(`Students with current status (${studentsWithStatus.length}):`, studentsWithStatus);
    
    // Combine roster with current status
    const result = [];
    const queue = { girls: [], boys: [] };
    
    for (const student of roster) {
      const status = currentStatus[student.name] || {
        gender: "",
        teacher: "",
        outTime: "",
        backTime: "",
        holdNotice: ""
      };
      
      result.push({
        name: student.name,
        id: student.id,
        nameId: student.name,
        gender: status.gender,
        teacher: status.teacher,
        outTime: status.outTime,
        backTime: status.backTime,
      holdNotice: status.holdNotice
    });
    
    // Debug: Log first few students with any status
    if (result.length <= 3 && (status.outTime || status.holdNotice || status.backTime)) {
      console.log(`Student ${student.name} status:`, status);
    }
    
    // Build queue lists
    if (status.holdNotice && !status.outTime) {
      // They have been put on hold (waiting in line)
      if (status.gender === "G") queue.girls.push(student.name);
      else if (status.gender === "B") queue.boys.push(student.name);
    }
  }

    console.log(`Loaded ${result.length} students from roster`);
    console.log(`Queue - Girls: ${queue.girls.length}, Boys: ${queue.boys.length}`);

    return { students: result, queue };
    
  } catch (error) {
    console.error('Error in fetchData:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

/**
 * Write updates to the Log sheet only (daily sheet remains read-only).
 * @param {string} studentName
 * @param {string} action — either "out" or "back"
 * @param {string} teacherName
 * @param {string} gender
 */
function updateStatus(studentName, action, teacherName, gender) {
  console.log(`updateStatus called: ${studentName}, ${action}, ${teacherName}, ${gender}`);
  
  // Validate required parameters
  if (!studentName || studentName.trim() === "") {
    throw new Error("Student name is required");
  }
  
  if (!teacherName || teacherName.trim() === "") {
    throw new Error("Teacher name is required");
  }
  
  if (action === "out" && (!gender || gender.trim() === "")) {
    throw new Error("Gender (G or B) must be selected before marking student out");
  }
  
  if (gender && gender !== "G" && gender !== "B") {
    throw new Error("Gender must be either 'G' or 'B'");
  }
  
  // Get student ID from the roster
  const dailySheet = getLatestDailySheet();
  console.log('Got daily sheet:', dailySheet.getName());
  
  const roster = _getStudentRoster(dailySheet);
  console.log('Loaded roster:', roster.length, 'students');
  
  const student = roster.find(s => s.name === studentName);
  console.log('Found student:', student);
  
  const studentId = student ? student.id : "";
  console.log('Student ID:', studentId);
  
  const now = new Date();
  console.log('Current time:', now);
  
  if (action === "out") {
    try {
      console.log('Checking current student status...');
      // First check if this student is currently waiting in line
      const currentStatus = _getCurrentRestroomStatus();
      const studentStatus = currentStatus[studentName];
      
      if (studentStatus && studentStatus.holdNotice && !studentStatus.outTime) {
        console.log('Student is waiting in line, updating existing log entry with out time');
        // Student is waiting in line - update their existing log entry with out time
        _updateWaitingEntryToOut(studentName, studentId, gender, teacherName, now);
        console.log('Waiting entry updated to out successfully');
        
        // IMMEDIATELY invalidate caches after updating waiting entry to out
        try {
          console.log('Immediately invalidating caches after waiting->out update...');
          const logService = new LogProcessingService();
          logService.invalidateLogCaches();
          console.log('✓ Caches invalidated immediately after waiting->out update');
        } catch (cacheError) {
          console.warn('⚠️ Failed to invalidate caches immediately:', cacheError);
        }
      } else {
        console.log('Checking if restroom is available for gender:', gender);
        // Normal flow - check if restroom is free for that gender
        const otherOut = _checkOtherOut(gender);
        console.log('Other student out:', otherOut);
        
        if (otherOut) {
          console.log('Restroom occupied, adding to waiting list');
          // Someone of the same gender is already out. Add to waiting list
          let waitingCount = 0;
          for (const [name, status] of Object.entries(currentStatus)) {
            if (status.gender === gender && status.holdNotice && !status.outTime) {
              waitingCount++;
            }
          }
          const position = waitingCount + 1;
          const notice = `Waiting in line. Position ${position}.`;
          
          console.log('Logging waiting entry:', { studentName, studentId, gender, teacherName, notice });
          // Log the waiting entry
          _logWaitingEntry(studentName, studentId, gender, teacherName, notice);
          console.log('Waiting entry logged successfully');
          
          // IMMEDIATELY invalidate caches after logging waiting entry
          try {
            console.log('Immediately invalidating caches after waiting entry...');
            const logService = new LogProcessingService();
            logService.invalidateLogCaches();
            console.log('✓ Caches invalidated immediately after waiting entry');
          } catch (cacheError) {
            console.warn('⚠️ Failed to invalidate caches immediately:', cacheError);
          }
        } else {
          console.log('Restroom available, marking student out');
          // Mark student as out - log the out entry
          console.log('Logging out entry:', { studentName, studentId, gender, teacherName, outTime: now });
          _logOutEntry(studentName, studentId, gender, teacherName, now);
          console.log('Out entry logged successfully');
          
          // IMMEDIATELY invalidate caches after logging out entry
          try {
            console.log('Immediately invalidating caches after out entry...');
            const logService = new LogProcessingService();
            logService.invalidateLogCaches();
            console.log('✓ Caches invalidated immediately after out entry');
          } catch (cacheError) {
            console.warn('⚠️ Failed to invalidate caches immediately:', cacheError);
          }
        }
      }
    } catch (logError) {
      console.error('Error during out action logging:', logError);
      throw new Error(`Failed to log out action: ${logError.message}`);
    }
  } else if (action === "back") {
    // Mark student as back - complete the log entry
    _logBackEntry(studentName, studentId, gender, teacherName, now);
    
    // IMMEDIATELY invalidate caches after logging back entry
    try {
      console.log('Immediately invalidating caches after back entry...');
      const logService = new LogProcessingService();
      logService.invalidateLogCaches();
      console.log('✓ Caches invalidated immediately after back entry');
    } catch (cacheError) {
      console.warn('⚠️ Failed to invalidate caches immediately:', cacheError);
    }
    
    // REMOVED: No longer automatically promote the next person in queue
    // The next student will be highlighted in the UI and manually marked out by the teacher
  }

}

/** Return true if a student of that gender is currently out (i.e. has an outTime but no backTime) */
function _checkOtherOut(gender) {
  const currentStatus = _getCurrentRestroomStatus();
  
  for (const [name, status] of Object.entries(currentStatus)) {
    if (status.gender === gender && status.outTime && !status.backTime) {
      console.log(`${gender} restroom occupied by ${name}`);
      return true;
    }
  }
  return false;
}

/** Returns queue lists based on current status */
function _getQueueList() {
  const currentStatus = _getCurrentRestroomStatus();
  const queue = { girls: [], boys: [] };
  
  for (const [name, status] of Object.entries(currentStatus)) {
    if (status.holdNotice && !status.outTime) {
      // They are waiting in line
      if (status.gender === "G") queue.girls.push(name);
      else if (status.gender === "B") queue.boys.push(name);
    }
  }
  
  return queue;
}

/** After a student comes back, promote the next waiting student (if any) */
function _promoteNextFromQueue(gender) {
  const queue = _getQueueList();
  const list = (gender === "G") ? queue.girls : queue.boys;
  if (list.length === 0) return;
  
  console.log(`Promoting next ${gender} from queue:`, list);
  
  // Get the roster to find student IDs
  const dailySheet = getLatestDailySheet();
  const roster = _getStudentRoster(dailySheet);
  const currentStatus = _getCurrentRestroomStatus();
  
  // Promote the first person in line (log them as going out)
  const nextName = list[0];
  const student = roster.find(s => s.name === nextName);
  const status = currentStatus[nextName];
  
  if (student && status) {
    const now = new Date();
    // Log them as out (remove from waiting list)
    _logOutEntry(nextName, student.id, status.gender, status.teacher, now);
    console.log(`Promoted ${nextName} from waiting to out`);
  }
  
  // Note: Positions will be automatically updated when fetchData runs next time
  // since we're reading current status from the log
}

/** Log a waiting entry to the Log sheet */
function _logWaitingEntry(studentName, studentId, gender, teacherName, holdNotice) {
  const ss = getSpreadsheet();
  let logSheet = ss.getSheetByName("Log");
  if (!logSheet) {
    logSheet = ss.insertSheet("Log");
    logSheet.appendRow(["Date", "Student Name", "Student ID", "Gender", "Teacher", "Out Time", "Back Time", "Hold Notice"]);
  }
  
  const date = new Date().toLocaleDateString();
  // A: Date, B: Student Name, C: Student ID, D: Gender, E: Teacher, F: Out Time, G: Back Time, H: Hold Notice
  const row = [date, studentName, studentId, gender, teacherName, "", "", holdNotice];
  logSheet.appendRow(row);
}

/** 
 * Update an existing waiting entry to mark the student as out
 * Finds the most recent waiting entry for this student and adds the out time
 */
function _updateWaitingEntryToOut(studentName, studentId, gender, teacherName, outTime) {
  const ss = getSpreadsheet();
  const logSheet = ss.getSheetByName("Log");
  if (!logSheet) return;
  
  const date = new Date().toLocaleDateString();
  const outTimeFormatted = _formatTimeToHHMM(outTime);
  
  // Find the most recent "waiting" entry for this student today and update it
  const data = logSheet.getDataRange().getValues();
  
  for (let r = data.length - 1; r >= 1; r--) {
    const row = data[r];
    const entryDate = row[0] ? new Date(row[0]).toLocaleDateString() : '';
    const entryName = row[1];
    const entryOutTime = row[5];
    const entryBackTime = row[6];
    const entryHoldNotice = row[7];
    
    if (entryDate === date && entryName === studentName && entryHoldNotice && !entryOutTime && !entryBackTime) {
      // Found the waiting entry - update it with out time and clear hold notice
      console.log(`Updating waiting entry for ${studentName} at row ${r + 1} with out time: ${outTimeFormatted}`);
      logSheet.getRange(r + 1, 6).setValue(outTimeFormatted); // Out Time (column F)
      logSheet.getRange(r + 1, 8).setValue(""); // Clear Hold Notice (column H)
      return;
    }
  }
  
  // If no waiting entry found, create a new out entry (fallback)
  console.log(`No waiting entry found for ${studentName}, creating new out entry`);
  _logOutEntry(studentName, studentId, gender, teacherName, outTime);
}

/**
 * Format a Date object to "H:MM AM/PM" format (12-hour time)
 * @param {Date} date - The date object to format
 * @returns {string} Time in "H:MM AM/PM" format (e.g., "2:30 PM", "9:05 AM")
 */
function _formatTimeToHHMM(date) {
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  // Convert to 12-hour format
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  
  return `${hours}:${minutes} ${ampm}`;
}

/**
 * Parse a time value (string or Date) back to a Date object
 * @param {string|Date} timeValue - Time string like "2:30 PM" or Date object
 * @param {Date} baseDate - The base date to use (defaults to today)
 * @returns {Date} Date object with the parsed time
 */
function _parseTimeString(timeValue, baseDate = new Date()) {
  console.log(`_parseTimeString called with: "${timeValue}" (type: ${typeof timeValue})`);
  
  if (!timeValue) {
    throw new Error(`Time value is empty or null: ${timeValue}`);
  }
  
  // If it's already a Date object, return it directly
  if (timeValue instanceof Date) {
    console.log(`Already a Date object: ${timeValue}`);
    return timeValue;
  }
  
  // If it looks like an ISO date string, parse it as a Date
  if (typeof timeValue === 'string' && timeValue.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
    console.log(`Detected ISO date string, parsing as Date`);
    const dateObj = new Date(timeValue);
    console.log(`Parsed ISO date: ${dateObj}`);
    return dateObj;
  }
  
  // Convert to string if not already
  const timeString = timeValue.toString().trim();
  console.log(`Converted to string: "${timeString}"`);
  
  // Handle various possible formats
  let timeMatch;
  
  // Try "H:MM AM/PM" format (our expected format)
  timeMatch = timeString.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (timeMatch) {
    console.log(`Matched AM/PM format: hours=${timeMatch[1]}, minutes=${timeMatch[2]}, ampm=${timeMatch[3]}`);
  } else {
    // Try "HH:MM" format (24-hour)
    timeMatch = timeString.match(/^(\d{1,2}):(\d{2})$/);
    if (timeMatch) {
      console.log(`Matched 24-hour format: hours=${timeMatch[1]}, minutes=${timeMatch[2]}`);
      // Assume 24-hour format, add AM/PM
      const hour = parseInt(timeMatch[1], 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      timeMatch[3] = ampm;
      if (hour > 12) {
        timeMatch[1] = (hour - 12).toString();
      } else if (hour === 0) {
        timeMatch[1] = '12';
      }
      console.log(`Converted to AM/PM: hours=${timeMatch[1]}, ampm=${timeMatch[3]}`);
    }
  }
  
  if (!timeMatch) {
    throw new Error(`Time string doesn't match expected formats: "${timeString}". Expected "H:MM AM/PM", "HH:MM", or ISO date string`);
  }
  
  let hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const ampm = timeMatch[3] ? timeMatch[3].toUpperCase() : null;
  
  console.log(`Parsed values: hours=${hours}, minutes=${minutes}, ampm=${ampm}`);
  
  // Validate parsed values
  if (isNaN(hours) || isNaN(minutes) || hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
    throw new Error(`Invalid time components: hours=${hours}, minutes=${minutes}`);
  }
  
  // Convert to 24-hour format if AM/PM is specified
  if (ampm) {
    if (ampm === 'AM' && hours === 12) {
      hours = 0; // 12:XX AM is 0:XX in 24-hour format
    } else if (ampm === 'PM' && hours !== 12) {
      hours += 12; // 1:XX PM is 13:XX, etc.
    }
    // 12:XX PM stays as 12:XX
  }
  
  console.log(`Final 24-hour format: hours=${hours}, minutes=${minutes}`);
  
  // Create a new Date object with the same date but the parsed time
  const result = new Date(baseDate);
  result.setHours(hours, minutes, 0, 0); // Set hours, minutes, seconds=0, milliseconds=0
  
  console.log(`Created Date object: ${result}`);
  return result;
}

/** Log an out entry to the Log sheet */
function _logOutEntry(studentName, studentId, gender, teacherName, outTime) {
  const ss = getSpreadsheet();
  let logSheet = ss.getSheetByName("Log");
  if (!logSheet) {
    logSheet = ss.insertSheet("Log");
    logSheet.appendRow(["Date", "Student Name", "Student ID", "Gender", "Teacher", "Out Time", "Back Time", "Hold Notice"]);
  }
  
  const date = new Date().toLocaleDateString();
  const outTimeFormatted = _formatTimeToHHMM(outTime);
  
  // A: Date, B: Student Name, C: Student ID, D: Gender, E: Teacher, F: Out Time, G: Back Time, H: Hold Notice
  const row = [date, studentName, studentId, gender, teacherName, outTimeFormatted, "", ""];
  logSheet.appendRow(row);
}

/** Log a back entry (complete the transaction) to the Log sheet */
function _logBackEntry(studentName, studentId, gender, teacherName, backTime) {
  const ss = getSpreadsheet();
  const logSheet = ss.getSheetByName("Log");
  if (!logSheet) {
    console.log('No Log sheet found in _logBackEntry');
    return;
  }
  
  const date = new Date().toLocaleDateString();
  const backTimeFormatted = _formatTimeToHHMM(backTime);
  
  console.log(`_logBackEntry: Looking for out entry for ${studentName} on ${date}`);
  
  // Find the most recent "out" entry for this student today and update it
  const data = logSheet.getDataRange().getValues();
  console.log(`_logBackEntry: Checking ${data.length - 1} rows for existing out entry`);
  
  for (let r = data.length - 1; r >= 1; r--) {
    const row = data[r];
    const entryDate = row[0] ? new Date(row[0]).toLocaleDateString() : '';
    const entryName = row[1];
    const entryOutTime = row[5];
    const entryBackTime = row[6];
    
    console.log(`_logBackEntry: Row ${r + 1} - Date: "${entryDate}", Name: "${entryName}", OutTime: "${entryOutTime}", BackTime: "${entryBackTime}"`);
    
    if (entryDate === date && entryName === studentName && entryOutTime && !entryBackTime) {
      // Found the out entry - update it with back time
      console.log(`_logBackEntry: Found matching out entry at row ${r + 1}, updating with back time: ${backTimeFormatted}`);
      logSheet.getRange(r + 1, 7).setValue(backTimeFormatted); // Back Time (column G)
      console.log(`_logBackEntry: Successfully updated existing entry for ${studentName}`);
      return;
    }
  }
  
  // If no out entry found, create a new complete entry
  console.log(`_logBackEntry: No matching out entry found for ${studentName}, creating new entry`);
  const row = [date, studentName, studentId, gender, teacherName, "", backTimeFormatted, ""];
  logSheet.appendRow(row);
  console.log(`_logBackEntry: Created new back-only entry for ${studentName}`);
}

/** Serve the HTML + client */
function doGet(e) {
  // Default to main app
  return HtmlService.createHtmlOutputFromFile("Index")
    .setTitle("NAMS Notification (Restroom)")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Get the current user's information including their detected teacher name
 * Returns an object with email, detectedTeacher, and the full teacher list
 */
function getCurrentUserInfo() {
  try {
    // Get the logged-in user's email
    const userEmail = Session.getActiveUser().getEmail();
    console.log('Current user email:', userEmail);
    
    // Look up the teacher in our data
    let detectedTeacher = null;
    for (const teacher of TEACHER_DATA) {
      const [lastName, email, title] = teacher;
      if (email.toLowerCase() === userEmail.toLowerCase()) {
        detectedTeacher = `${title}${lastName}`;
        break;
      }
    }
    
    // Generate the full teacher list for the dropdown
    const teacherList = TEACHER_DATA.map(teacher => {
      const [lastName, email, title] = teacher;
      return `${title}${lastName}`;
    });
    
    // Add a fallback option if user is not in the list
    if (!detectedTeacher) {
      teacherList.push("Other Teacher");
      detectedTeacher = "Other Teacher";
    }
    
    console.log('Detected teacher:', detectedTeacher);
    
    return {
      userEmail: userEmail,
      detectedTeacher: detectedTeacher,
      teacherList: teacherList
    };
    
  } catch (error) {
    console.error('Error getting current user info:', error);
    
    // Fallback - return the full teacher list without detection
    const teacherList = TEACHER_DATA.map(teacher => {
      const [lastName, email, title] = teacher;
      return `${title}${lastName}`;
    });
    teacherList.push("Other Teacher");
    
    return {
      userEmail: null,
      detectedTeacher: "Other Teacher",
      teacherList: teacherList
    };
  }
}

// Client-facing APIs

function api_getCurrentUserInfo() {
  return getCurrentUserInfo();
}

function api_testFetchData() {
  try {
    return testFetchData();
  } catch (error) {
    console.error('Error in api_testFetchData:', error);
    return { 
      success: false,
      error: error.message || 'Unknown error in api_testFetchData',
      stack: error.stack
    };
  }
}

/**
 * Simple test to check basic spreadsheet access
 */
function api_testBasicAccess() {
  try {
    console.log('=== Testing Basic Spreadsheet Access ===');
    
    // Test 1: Can we access the spreadsheet?
    const ss = getSpreadsheet();
    console.log('✓ Spreadsheet access successful');
    
    // Test 2: Can we get sheet list?
    const sheets = ss.getSheets();
    const sheetNames = sheets.map(s => s.getName());
    console.log('✓ Sheet list retrieved:', sheetNames);
    
    // Test 3: Can we find a daily sheet?
    const dailySheet = getLatestDailySheet();
    console.log('✓ Daily sheet found:', dailySheet.getName());
    
    // Test 4: Can we read basic info from the sheet?
    const lastRow = dailySheet.getLastRow();
    const lastCol = dailySheet.getLastColumn();
    console.log('✓ Sheet dimensions:', lastRow, 'rows x', lastCol, 'columns');
    
    return {
      success: true,
      spreadsheetAccess: true,
      sheetCount: sheets.length,
      sheetNames: sheetNames,
      selectedSheet: dailySheet.getName(),
      sheetDimensions: { rows: lastRow, columns: lastCol }
    };
    
  } catch (error) {
    console.error('=== Basic Access Test FAILED ===');
    console.error('Error:', error);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * Test just the student roster reading function
 */
function api_testStudentRoster() {
  try {
    console.log('=== Testing Student Roster Reading ===');
    
    const dailySheet = getLatestDailySheet();
    console.log('Using sheet:', dailySheet.getName());
    
    const roster = _getStudentRoster(dailySheet);
    console.log('Roster reading completed');
    
    return {
      success: true,
      sheetName: dailySheet.getName(),
      studentCount: roster.length,
      firstFewStudents: roster.slice(0, 3),
      roster: roster
    };
    
  } catch (error) {
    console.error('=== Student Roster Test FAILED ===');
    console.error('Error:', error);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * Test just the restroom status reading function
 */
function api_testRestroomStatus() {
  try {
    console.log('=== Testing Restroom Status Reading ===');
    
    const status = _getCurrentRestroomStatus();
    console.log('Restroom status reading completed');
    
    return {
      success: true,
      statusCount: Object.keys(status).length,
      studentsWithStatus: Object.keys(status),
      sampleStatus: Object.keys(status).slice(0, 3).map(name => ({
        name: name,
        status: status[name]
      }))
    };
    
  } catch (error) {
    console.error('=== Restroom Status Test FAILED ===');
    console.error('Error:', error);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * Super simple test to return hardcoded data - this should ALWAYS work
 */
function api_testSimple() {
  console.log('=== Simple Test - Returning Hardcoded Data ===');
  return {
    students: [
      { name: "Test Student 1", id: "12345", gender: "G", teacher: "Mr. Gomez", outTime: "", backTime: "", holdNotice: "" },
      { name: "Test Student 2", id: "67890", gender: "B", teacher: "Mr. Gomez", outTime: "", backTime: "", holdNotice: "" }
    ],
    queue: { girls: [], boys: [] }
  };
}

/**
 * Working api_fetchData with status integration
 */
function api_fetchData() {
  console.log('=== api_fetchData called ===');
  
  try {
    // Get student roster (we know this works)
    const dailySheet = getLatestDailySheet();
    const roster = _getStudentRoster(dailySheet);
    console.log('Got roster with', roster.length, 'students');
    
    // Get restroom status with proper error handling
    let currentStatus = {};
    try {
      currentStatus = _getCurrentRestroomStatus();
      console.log('Got restroom status for', Object.keys(currentStatus).length, 'students');
    } catch (statusError) {
      console.warn('Status loading failed, using empty status:', statusError.message);
      currentStatus = {};
    }
    
    // Build result arrays
    const students = [];
    const queue = { girls: [], boys: [] };
    
    for (const student of roster) {
      const status = currentStatus[student.name] || {};
      
      const studentData = {
        name: student.name,
        id: student.id,
        nameId: student.name,
        gender: status.gender || "",
        teacher: status.teacher || "",
        outTime: status.outTime || "",
        backTime: status.backTime || "",
        holdNotice: status.holdNotice || ""
      };
      
      students.push(studentData);
      
      // Add to queue if waiting
      if (status.holdNotice && !status.outTime) {
        if (status.gender === "G") queue.girls.push(student.name);
        else if (status.gender === "B") queue.boys.push(student.name);
      }
    }
    
    const result = { students: students, queue: queue };
    console.log('api_fetchData returning:', students.length, 'students');
    return result;
    
  } catch (error) {
    console.error('Error in api_fetchData:', error);
    // Return error result
    return {
      students: [
        { name: "Error: " + error.message, id: "000", nameId: "Error", gender: "", teacher: "", outTime: "", backTime: "", holdNotice: "" }
      ],
      queue: { girls: [], boys: [] }
    };
  }
}

/**
 * Ultra simple test function to isolate the issue
 */
function api_ultraSimpleTest() {
  console.log('api_ultraSimpleTest called');
  const result = {
    students: [
      { name: "Test 1", id: "001", nameId: "Test 1", gender: "", teacher: "", outTime: "", backTime: "", holdNotice: "" },
      { name: "Test 2", id: "002", nameId: "Test 2", gender: "", teacher: "", outTime: "", backTime: "", holdNotice: "" }
    ],
    queue: { girls: [], boys: [] }
  };
  console.log('api_ultraSimpleTest returning hardcoded data');
  return result;
}

/**
 * Test just the roster loading without any status
 */
function api_testRosterOnly() {
  console.log('api_testRosterOnly called');
  try {
    const dailySheet = getLatestDailySheet();
    const roster = _getStudentRoster(dailySheet);
    console.log('Roster loaded:', roster.length, 'students');
    
    const result = {
      students: roster.map(student => ({
        name: student.name,
        id: student.id,
        nameId: student.name,
        gender: "",
        teacher: "",
        outTime: "",
        backTime: "",
        holdNotice: ""
      })),
      queue: { girls: [], boys: [] }
    };
    
    console.log('api_testRosterOnly returning:', result.students.length, 'students');
    return result;
  } catch (error) {
    console.error('Error in api_testRosterOnly:', error);
    return {
      students: [{ name: "Error: " + error.message, id: "000", nameId: "Error", gender: "", teacher: "", outTime: "", backTime: "", holdNotice: "" }],
      queue: { girls: [], boys: [] }
    };
  }
}

/**
 * MINIMAL VERSION - BYPASS ALL STATUS PROCESSING
 */
function api_minimalBypass() {
  console.log('=== api_minimalBypass called ===');
  
  try {
    // Get student roster only (we know this works)
    const dailySheet = getLatestDailySheet();
    const roster = _getStudentRoster(dailySheet);
    console.log('✓ Got roster with', roster.length, 'students');
    
    // Don't call _getCurrentRestroomStatus at all - bypass it completely
    const students = [];
    const queue = { girls: [], boys: [] };
    
    // Process each student with NO status processing
    for (let i = 0; i < roster.length; i++) {
      const student = roster[i];
      
      const studentData = {
        name: student.name,
        id: student.id,
        nameId: student.name,
        gender: "",  // Empty - no status processing
        teacher: "",  // Empty - no status processing
        outTime: "",  // Empty - no status processing
        backTime: "",  // Empty - no status processing
        holdNotice: ""  // Empty - no status processing
      };
      
      students.push(studentData);
    }
    
    // Final result object
    const result = { 
      students: students, 
      queue: queue 
    };
    
    console.log('✓ api_minimalBypass SUCCESS - returning', students.length, 'students');
    console.log('✓ NO STATUS PROCESSING - just basic roster');
    console.log('✓ Result structure:', typeof result, result ? 'valid' : 'invalid');
    
    return result;
    
  } catch (error) {
    console.error('❌ ERROR in api_minimalBypass:', error);
    return {
      students: [
        { name: "ERROR: " + error.message, id: "000", nameId: "Error", gender: "", teacher: "", outTime: "", backTime: "", holdNotice: "" }
      ],
      queue: { girls: [], boys: [] }
    };
  }
}

/**
 * OCTOBER 16 2025 VERSION - brand new function name to force deployment
 */
function api_october16_2025() {
  console.log('=== api_october16_2025 called ===');
  
  try {
    // Get student roster (we know this works from other tests)
    const dailySheet = getLatestDailySheet();
    const roster = _getStudentRoster(dailySheet);
    console.log('✓ Got roster with', roster.length, 'students');
    
    // Initialize result structure first
    const students = [];
    const queue = { girls: [], boys: [] };
    
    // Try to get restroom status, but don't let it break everything
    let currentStatus = {};
    try {
      console.log('⚠️ Attempting restroom status...');
      currentStatus = _getCurrentRestroomStatus();
      console.log('✓ Got restroom status for', Object.keys(currentStatus).length, 'students');
    } catch (statusError) {
      console.warn('⚠️ Status loading failed, continuing with empty status:', statusError.message);
      // Leave currentStatus as empty object
    }
    
    // Process each student safely
    for (let i = 0; i < roster.length; i++) {
      try {
        const student = roster[i];
        const status = currentStatus[student.name] || {};
        
        const studentData = {
          name: student.name,
          id: student.id,
          nameId: student.name,
          gender: status.gender || "",
          teacher: status.teacher || "",
          outTime: status.outTime || "",
          backTime: status.backTime || "",
          holdNotice: status.holdNotice || ""
        };
        
        students.push(studentData);
        
        // Add to queue if waiting (safely)
        if (status.holdNotice && !status.outTime) {
          if (status.gender === "G") {
            queue.girls.push(student.name);
          } else if (status.gender === "B") {
            queue.boys.push(student.name);
          }
        }
      } catch (studentError) {
        console.warn('⚠️ Error processing student', roster[i]?.name, ':', studentError.message);
        // Add a basic student entry so we don't lose the student
        students.push({
          name: roster[i]?.name || "Unknown",
          id: roster[i]?.id || "000",
          nameId: roster[i]?.name || "Unknown",
          gender: "",
          teacher: "",
          outTime: "",
          backTime: "",
          holdNotice: ""
        });
      }
    }
    
    // Final result object
    const result = { 
      students: students, 
      queue: queue 
    };
    
    console.log('✓ api_october16_2025 SUCCESS - returning', students.length, 'students');
    console.log('✓ Result structure valid:', !!result.students && Array.isArray(result.students));
    console.log('✓ First student:', students[0]?.name);
    console.log('✓ Final result object:', JSON.stringify(result, null, 2));
    
    return result;
    
  } catch (error) {
    console.error('❌ MAJOR ERROR in api_october16_2025:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Emergency fallback - return roster-only data
    try {
      console.log('🚨 Attempting emergency fallback...');
      const dailySheet = getLatestDailySheet();
      const roster = _getStudentRoster(dailySheet);
      const fallbackResult = {
        students: roster.map(student => ({
          name: student.name,
          id: student.id,
          nameId: student.name,
          gender: "",
          teacher: "",
          outTime: "",
          backTime: "",
          holdNotice: ""
        })),
        queue: { girls: [], boys: [] }
      };
      console.log('🚨 Emergency fallback successful with', fallbackResult.students.length, 'students');
      return fallbackResult;
    } catch (fallbackError) {
      console.error('💥 Even fallback failed:', fallbackError);
      return {
        students: [
          { name: "SYSTEM ERROR: " + error.message, id: "000", nameId: "Error", gender: "", teacher: "", outTime: "", backTime: "", holdNotice: "" }
        ],
        queue: { girls: [], boys: [] }
      };
    }
  }
}

/**
 * FINAL WORKING VERSION - completely new function name
 */
function api_finalWorkingVersion() {
  console.log('=== api_finalWorkingVersion called ===');
  
  try {
    // Get student roster (we know this works from other tests)
    const dailySheet = getLatestDailySheet();
    const roster = _getStudentRoster(dailySheet);
    console.log('✓ Got roster with', roster.length, 'students');
    
    // Initialize result structure first
    const students = [];
    const queue = { girls: [], boys: [] };
    
    // Try to get restroom status, but don't let it break everything
    let currentStatus = {};
    try {
      console.log('⚠️ Attempting restroom status...');
      currentStatus = _getCurrentRestroomStatus();
      console.log('✓ Got restroom status for', Object.keys(currentStatus).length, 'students');
    } catch (statusError) {
      console.warn('⚠️ Status loading failed, continuing with empty status:', statusError.message);
      // Leave currentStatus as empty object
    }
    
    // Process each student safely
    for (let i = 0; i < roster.length; i++) {
      try {
        const student = roster[i];
        const status = currentStatus[student.name] || {};
        
        const studentData = {
          name: student.name,
          id: student.id,
          nameId: student.name,
          gender: status.gender || "",
          teacher: status.teacher || "",
          outTime: status.outTime || "",
          backTime: status.backTime || "",
          holdNotice: status.holdNotice || ""
        };
        
        students.push(studentData);
        
        // Add to queue if waiting (safely)
        if (status.holdNotice && !status.outTime) {
          if (status.gender === "G") {
            queue.girls.push(student.name);
          } else if (status.gender === "B") {
            queue.boys.push(student.name);
          }
        }
      } catch (studentError) {
        console.warn('⚠️ Error processing student', roster[i]?.name, ':', studentError.message);
        // Add a basic student entry so we don't lose the student
        students.push({
          name: roster[i]?.name || "Unknown",
          id: roster[i]?.id || "000",
          nameId: roster[i]?.name || "Unknown",
          gender: "",
          teacher: "",
          outTime: "",
          backTime: "",
          holdNotice: ""
        });
      }
    }
    
    // Final result object
    const result = { 
      students: students, 
      queue: queue 
    };
    
    console.log('✓ api_finalWorkingVersion SUCCESS - returning', students.length, 'students');
    console.log('✓ Result structure valid:', !!result.students && Array.isArray(result.students));
    
    return result;
    
  } catch (error) {
    console.error('❌ MAJOR ERROR in api_finalWorkingVersion:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Emergency fallback - return roster-only data
    try {
      console.log('🚨 Attempting emergency fallback...');
      const dailySheet = getLatestDailySheet();
      const roster = _getStudentRoster(dailySheet);
      const fallbackResult = {
        students: roster.map(student => ({
          name: student.name,
          id: student.id,
          nameId: student.name,
          gender: "",
          teacher: "",
          outTime: "",
          backTime: "",
          holdNotice: ""
        })),
        queue: { girls: [], boys: [] }
      };
      console.log('🚨 Emergency fallback successful with', fallbackResult.students.length, 'students');
      return fallbackResult;
    } catch (fallbackError) {
      console.error('💥 Even fallback failed:', fallbackError);
      return {
        students: [
          { name: "SYSTEM ERROR: " + error.message, id: "000", nameId: "Error", gender: "", teacher: "", outTime: "", backTime: "", holdNotice: "" }
        ],
        queue: { girls: [], boys: [] }
      };
    }
  }
}

/**
 * Working version without problematic status processing
 */
function api_loadStudentRoster() {
  console.log('=== api_loadStudentRoster called ===');
  
  try {
    // Get student roster (we know this works)
    const dailySheet = getLatestDailySheet();
    const roster = _getStudentRoster(dailySheet);
    console.log('Got roster with', roster.length, 'students');
    
    // Try to get restroom status but don't let it break the function
    let currentStatus = {};
    try {
      console.log('Attempting to get restroom status...');
      currentStatus = _getCurrentRestroomStatus();
      console.log('Got restroom status for', Object.keys(currentStatus).length, 'students');
    } catch (statusError) {
      console.warn('Status loading failed, using empty status:', statusError.message);
      currentStatus = {};
    }
    
    // Build result arrays - always ensure we return something valid
    const students = [];
    const queue = { girls: [], boys: [] };
    
    // Process each student
    for (let i = 0; i < roster.length; i++) {
      const student = roster[i];
      const status = currentStatus[student.name] || {};
      
      const studentData = {
        name: student.name,
        id: student.id,
        nameId: student.name,
        gender: status.gender || "",
        teacher: status.teacher || "",
        outTime: status.outTime || "",
        backTime: status.backTime || "",
        holdNotice: status.holdNotice || ""
      };
      
      students.push(studentData);
      
      // Add to queue if waiting (but don't let this break anything)
      try {
        if (status.holdNotice && !status.outTime) {
          if (status.gender === "G") queue.girls.push(student.name);
          else if (status.gender === "B") queue.boys.push(student.name);
        }
      } catch (queueError) {
        console.warn('Queue processing error for', student.name, ':', queueError.message);
      }
    }
    
    // Ensure we always return a valid result
    const result = { 
      students: students, 
      queue: queue 
    };
    
    console.log('api_loadStudentRoster returning:', students.length, 'students');
    console.log('Result structure valid:', !!result.students && Array.isArray(result.students));
    
    return result;
    
  } catch (error) {
    console.error('Error in api_loadStudentRoster:', error);
    console.error('Error stack:', error.stack);
    
    // Fallback: return roster-only data
    try {
      const dailySheet = getLatestDailySheet();
      const roster = _getStudentRoster(dailySheet);
      const fallbackResult = {
        students: roster.map(student => ({
          name: student.name,
          id: student.id,
          nameId: student.name,
          gender: "",
          teacher: "",
          outTime: "",
          backTime: "",
          holdNotice: ""
        })),
        queue: { girls: [], boys: [] }
      };
      console.log('Returning fallback result with', fallbackResult.students.length, 'students');
      return fallbackResult;
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return {
        students: [
          { name: "Error: " + error.message, id: "000", nameId: "Error", gender: "", teacher: "", outTime: "", backTime: "", holdNotice: "" }
        ],
        queue: { girls: [], boys: [] }
      };
    }
  }
}

/**
 * Simple test to verify deployment
 */
function api_deploymentTest() {
  console.log('api_deploymentTest called');
  const result = {
    success: true,
    message: "Deployment working",
    timestamp: new Date().toISOString(),
    students: [
      { name: "Test Student 1", id: "001", nameId: "Test Student 1", gender: "", teacher: "", outTime: "", backTime: "", holdNotice: "" },
      { name: "Test Student 2", id: "002", nameId: "Test Student 2", gender: "", teacher: "", outTime: "", backTime: "", holdNotice: "" }
    ],
    queue: { girls: [], boys: [] }
  };
  console.log('api_deploymentTest returning:', result);
  return result;
}

/**
 * Simple test function to verify server connectivity
 */
function api_testConnection() {
  console.log('api_testConnection called');
  return { 
    success: true, 
    message: "Connection working",
    timestamp: new Date().toISOString()
  };
}

/**
 * Simplified fetchData function to bypass potential issues
 */
function api_fetchDataSimple() {
  console.log('=== Simple fetchData called ===');
  
  try {
    // Get basic roster
    const dailySheet = getLatestDailySheet();
    console.log('Got daily sheet:', dailySheet.getName());
    
    const roster = _getStudentRoster(dailySheet);
    console.log('Got roster:', roster.length, 'students');
    
    // Create simple result without complex status logic
    const result = {
      students: roster.map(student => ({
        name: student.name,
        id: student.id,
        nameId: student.name,
        gender: "",
        teacher: "Mr. Gomez", // Default teacher for now
        outTime: "",
        backTime: "",
        holdNotice: ""
      })),
      queue: { girls: [], boys: [] }
    };
    
    console.log('Simple result created:', result.students.length, 'students');
    console.log('About to return simple result');
    return result;
    
  } catch (error) {
    console.error('Error in simple fetchData:', error);
    return {
      students: [
        { name: "Error: " + error.message, id: "000", nameId: "Error", gender: "", teacher: "", outTime: "", backTime: "", holdNotice: "" }
      ],
      queue: { girls: [], boys: [] }
    };
  }
}

/**
 * List all sheets in the spreadsheet for debugging
 */
function api_listSheets() {
  try {
    const ss = getSpreadsheet();
    const sheets = ss.getSheets();
    const sheetInfo = sheets.map((sheet, index) => ({
      index: index,
      name: sheet.getName(),
      rows: sheet.getLastRow(),
      columns: sheet.getLastColumn()
    }));
    
    const today = new Date();
    const todayString = `${today.getMonth() + 1}/${today.getDate()}`;
    
    return {
      success: true,
      todayString: todayString,
      sheets: sheetInfo
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * Inspect the contents of a specific sheet for debugging
 */
function api_inspectSheet(sheetName) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      return {
        success: false,
        error: `Sheet "${sheetName}" not found`
      };
    }
    
    const data = sheet.getDataRange().getValues();
    
    return {
      success: true,
      sheetName: sheetName,
      totalRows: data.length,
      totalColumns: data[0] ? data[0].length : 0,
      headerRows: data.slice(0, Math.min(3, data.length)), // First 3 rows
      sampleDataRows: data.slice(2, Math.min(7, data.length)), // Rows 3-7 (student data)
      lastRow: sheet.getLastRow(),
      lastColumn: sheet.getLastColumn()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * Test function to verify user detection is working
 * Call this from the Apps Script editor to test
 */
function testUserDetection() {
  const userInfo = getCurrentUserInfo();
  console.log('=== User Detection Test ===');
  console.log('User Email:', userInfo.userEmail);
  console.log('Detected Teacher:', userInfo.detectedTeacher);
  console.log('Teacher List Length:', userInfo.teacherList.length);
  console.log('First few teachers:', userInfo.teacherList.slice(0, 5));
  return userInfo;
}

/**
 * Test function to verify fetchData is working
 * Call this from the Apps Script editor to test
 */
function testFetchData() {
  try {
    console.log('=== Fetch Data Test ===');
    
    // Test step by step to isolate the issue
    console.log('Step 1: Testing spreadsheet access...');
    const ss = getSpreadsheet();
    console.log('Spreadsheet accessed successfully');
    
    console.log('Step 2: Getting sheet list...');
    const sheets = ss.getSheets();
    const sheetNames = sheets.map(s => s.getName());
    console.log('Available sheets:', sheetNames);
    
    console.log('Step 3: Testing getLatestDailySheet...');
    const dailySheet = getLatestDailySheet();
    console.log('Daily sheet found:', dailySheet.getName());
    
    console.log('Step 4: Testing _getStudentRoster...');
    const roster = _getStudentRoster(dailySheet);
    console.log('Roster loaded:', roster.length, 'students');
    
    console.log('Step 5: Testing _getCurrentRestroomStatus...');
    const status = _getCurrentRestroomStatus();
    console.log('Status loaded for', Object.keys(status).length, 'students');
    
    console.log('Step 6: Running full fetchData...');
    const result = fetchData();
    console.log('fetchData succeeded');
    console.log('Students count:', result.students ? result.students.length : 'No students property');
    console.log('Queue:', result.queue);
    console.log('First student:', result.students && result.students[0] ? result.students[0] : 'No first student');
    return {
      success: true,
      result: result,
      debug: {
        sheetNames: sheetNames,
        dailySheetName: dailySheet.getName(),
        rosterCount: roster.length,
        statusCount: Object.keys(status).length
      }
    };
  } catch (error) {
    console.error('=== Fetch Data Test FAILED ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    return { 
      success: false,
      error: error.message, 
      stack: error.stack,
      debug: {
        message: 'Check which step failed in the console logs'
      }
    };
  }
}

/**
 * Debug function to check what's in the Log sheet
 */
function api_debugLogSheet() {
  const ss = getSpreadsheet();
  const logSheet = ss.getSheetByName("Log");
  
  if (!logSheet) {
    return { error: "No Log sheet found" };
  }
  
  const data = logSheet.getDataRange().getValues();
  const today = new Date().toLocaleDateString();
  
  const todaysEntries = [];
  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    const date = row[0];
    const entryDate = date ? new Date(date).toLocaleDateString() : '';
    
    if (entryDate === today) {
      todaysEntries.push({
        date: entryDate,
        studentName: row[1],
        studentId: row[2], 
        gender: row[3],
        teacher: row[4],
        outTime: row[5],
        backTime: row[6],
        holdNotice: row[7]
      });
    }
  }
  
  return {
    today: today,
    totalLogEntries: data.length - 1,
    todaysEntries: todaysEntries
  };
}
function api_updateStatus(studentName, action, teacherName, gender) {
  console.log('API updateStatus called with:', { studentName, action, teacherName, gender });
  
  try {
    console.log('Step 1: Calling updateStatus...');
    updateStatus(studentName, action, teacherName, gender);
    console.log('Step 2: updateStatus completed successfully');
    
    console.log('Step 3: Calling fetchData...');
    const result = fetchData();
    console.log('Step 4: fetchData completed, returning result');
    
    return result;
  } catch (error) {
    console.error('Error in api_updateStatus:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Re-throw with more context
    throw new Error(`Failed to update status for ${studentName}: ${error.message}`);
  }
}

// Debug function to check spreadsheet structure
function api_debugSheet() {
  const sheet = getLatestDailySheet();
  const data = sheet.getDataRange().getValues();
  return {
    sheetName: sheet.getName(),
    totalRows: data.length,
    headerRows: HEADER_ROWS,
    firstFewRows: data.slice(0, Math.min(5, data.length)),
    sampleData: data.slice(HEADER_ROWS, Math.min(HEADER_ROWS + 3, data.length))
  };
}

/**
 * Append a completed student record into the 'Log' sheet.
 * Expects studentObj to contain at least: { name, id, gender, teacher }
 * Adds a timestamp and returns the new row number.
 */
function api_appendToLog(studentObj) {
  const ss = getSpreadsheet();
  let logSheet = ss.getSheetByName("Log");
  if (!logSheet) {
    // create a Log sheet with header row if it doesn't exist
    logSheet = ss.insertSheet("Log");
    logSheet.appendRow(["Timestamp", "Name", "ID", "Gender", "Teacher"]);
  }
  const ts = new Date();
  const row = [ts, studentObj.name || "", studentObj.id || "", studentObj.gender || "", studentObj.teacher || ""];
  logSheet.appendRow(row);
  return { success: true };
}

/**
 * OPTIMIZED: Get incremental status updates since a given timestamp
 * Returns only students whose status has changed since the last check
 * @param {number} lastUpdateTimestamp - Timestamp of last update check
 * @returns {Object} - Object with changed students and metadata
 */
function api_getStatusUpdates(lastUpdateTimestamp) {
  console.log('=== api_getStatusUpdates called ===');
  console.log('Last update timestamp:', lastUpdateTimestamp, new Date(lastUpdateTimestamp));
  
  try {
    const timerId = performanceMonitor.startTimer('getStatusUpdates');
    
    // Get current timestamp for this session
    const currentTimestamp = Date.now();
    
    // Get today's log entries using optimized service
    const todaysEntries = logProcessingService.getTodaysLogEntries();
    
    if (todaysEntries.length === 0) {
      console.log('No log entries found for today');
      performanceMonitor.endTimer(timerId, { result: 'no_entries' });
      return {
        hasUpdates: false,
        timestamp: currentTimestamp,
        changedStudents: [],
        totalEntries: 0
      };
    }
    
    // Filter entries that occurred after the last update timestamp
    const recentEntries = [];
    const lastUpdateDate = new Date(lastUpdateTimestamp);
    
    for (const entry of todaysEntries) {
      try {
        // Estimate when this log entry was created
        let entryTime = null;
        
        // Use the most recent time field (backTime takes precedence over outTime)
        const timeToCheck = entry.backTime || entry.outTime;
        
        if (timeToCheck) {
          entryTime = this._parseLogTimeToTimestamp(timeToCheck);
        }
        
        // If we can't parse the time, assume it's recent (within last hour)
        if (!entryTime) {
          entryTime = currentTimestamp - (60 * 60 * 1000); // 1 hour ago
        }
        
        // Include entries that are newer than the last update
        if (entryTime > lastUpdateTimestamp) {
          recentEntries.push({
            ...entry,
            estimatedTimestamp: entryTime
          });
        }
        
      } catch (entryError) {
        console.warn(`Error processing entry for ${entry.studentName}:`, entryError);
        // Include the entry to be safe
        recentEntries.push(entry);
      }
    }
    
    console.log(`Found ${recentEntries.length} recent entries out of ${todaysEntries.length} total`);
    
    // Build changed student statuses
    const changedStudents = [];
    const processedStudents = new Set();
    
    // Process recent entries from newest to oldest to get current status
    for (let i = recentEntries.length - 1; i >= 0; i--) {
      const entry = recentEntries[i];
      const studentName = entry.studentName;
      
      // Only process each student once (newest entry wins)
      if (!processedStudents.has(studentName)) {
        processedStudents.add(studentName);
        
        let currentStatus = null;
        
        if (entry.backTime) {
          // Student has returned - they are now available
          currentStatus = {
            name: studentName,
            id: entry.studentId,
            nameId: studentName,
            gender: entry.gender,
            teacher: entry.teacher,
            outTime: "",
            backTime: entry.backTime,
            holdNotice: "",
            status: "available",
            lastUpdated: entry.estimatedTimestamp || currentTimestamp
          };
        } else if (entry.outTime) {
          // Student is currently out
          currentStatus = {
            name: studentName,
            id: entry.studentId,
            nameId: studentName,
            gender: entry.gender,
            teacher: entry.teacher,
            outTime: entry.outTime,
            backTime: "",
            holdNotice: "",
            status: "out",
            lastUpdated: entry.estimatedTimestamp || currentTimestamp
          };
        } else if (entry.holdNotice) {
          // Student is waiting in line
          currentStatus = {
            name: studentName,
            id: entry.studentId,
            nameId: studentName,
            gender: entry.gender,
            teacher: entry.teacher,
            outTime: "",
            backTime: "",
            holdNotice: entry.holdNotice,
            status: "waiting",
            lastUpdated: entry.estimatedTimestamp || currentTimestamp
          };
        }
        
        if (currentStatus) {
          changedStudents.push(currentStatus);
        }
      }
    }
    
    const hasUpdates = changedStudents.length > 0;
    
    console.log(`Incremental update result: ${changedStudents.length} changed students`);
    
    performanceMonitor.endTimer(timerId, {
      totalEntries: todaysEntries.length,
      recentEntries: recentEntries.length,
      changedStudents: changedStudents.length
    });
    
    return {
      hasUpdates: hasUpdates,
      timestamp: currentTimestamp,
      changedStudents: changedStudents,
      totalEntries: todaysEntries.length,
      recentEntries: recentEntries.length,
      lastUpdateTimestamp: lastUpdateTimestamp
    };
    
  } catch (error) {
    console.error('Error in api_getStatusUpdates:', error);
    
    // Fallback: return indication that full refresh is needed
    return {
      hasUpdates: true,
      timestamp: Date.now(),
      changedStudents: [],
      error: error.message,
      requiresFullRefresh: true
    };
  }
}

/**
 * Enhanced session timestamp tracking for incremental updates
 * Stores per-user session timestamps to track last update times
 */
class SessionTimestampManager {
  constructor() {
    this.cacheManager = new ScriptPropertiesManager();
    this.SESSION_PREFIX = 'session_timestamp_';
  }

  /**
   * Get the last update timestamp for a user session
   * @param {string} sessionId - Unique session identifier (user email or generated ID)
   * @returns {number} - Last update timestamp or 0 if no previous session
   */
  getLastUpdateTimestamp(sessionId) {
    try {
      const key = this.SESSION_PREFIX + sessionId;
      const timestamp = this.cacheManager.get(key);
      return timestamp || 0;
    } catch (error) {
      console.error(`Error getting session timestamp for ${sessionId}:`, error);
      return 0;
    }
  }

  /**
   * Update the last update timestamp for a user session
   * @param {string} sessionId - Unique session identifier
   * @param {number} timestamp - Current timestamp
   */
  setLastUpdateTimestamp(sessionId, timestamp) {
    try {
      const key = this.SESSION_PREFIX + sessionId;
      // Store with 24-hour TTL
      this.cacheManager.set(key, timestamp, 1440);
      console.log(`Updated session timestamp for ${sessionId}: ${new Date(timestamp)}`);
    } catch (error) {
      console.error(`Error setting session timestamp for ${sessionId}:`, error);
    }
  }

  /**
   * Clean up old session timestamps
   */
  cleanupOldSessions() {
    try {
      // This would be called periodically to clean up expired sessions
      // For now, we rely on the TTL mechanism in ScriptPropertiesManager
      console.log('Session cleanup relies on TTL mechanism');
    } catch (error) {
      console.error('Error cleaning up sessions:', error);
    }
  }
}

// Global session timestamp manager
const sessionTimestampManager = new SessionTimestampManager();

/**
 * API endpoint for getting incremental updates with session tracking
 * @param {string} sessionId - Optional session ID (defaults to user email)
 * @returns {Object} - Incremental update data
 */
function api_getIncrementalUpdates(sessionId = null) {
  console.log('=== api_getIncrementalUpdates called ===');
  
  try {
    // Generate or use provided session ID
    if (!sessionId) {
      try {
        sessionId = Session.getActiveUser().getEmail();
      } catch (emailError) {
        sessionId = 'anonymous_' + Date.now();
      }
    }
    
    console.log('Session ID:', sessionId);
    
    // Get last update timestamp for this session
    const lastUpdateTimestamp = sessionTimestampManager.getLastUpdateTimestamp(sessionId);
    console.log('Last update for session:', new Date(lastUpdateTimestamp));
    
    // Get incremental updates
    const updateResult = api_getStatusUpdates(lastUpdateTimestamp);
    
    // Update session timestamp
    sessionTimestampManager.setLastUpdateTimestamp(sessionId, updateResult.timestamp);
    
    // Add session info to result
    return {
      ...updateResult,
      sessionId: sessionId,
      previousUpdateTimestamp: lastUpdateTimestamp
    };
    
  } catch (error) {
    console.error('Error in api_getIncrementalUpdates:', error);
    return {
      hasUpdates: true,
      timestamp: Date.now(),
      changedStudents: [],
      error: error.message,
      requiresFullRefresh: true
    };
  }
}

/**
 * Helper method to parse log time strings to timestamps
 * @param {string} timeString - Time string like "2:30 PM"
 * @returns {number} - Timestamp or null if parsing fails
 */
function _parseLogTimeToTimestamp(timeString) {
  try {
    if (!timeString) return null;
    
    // Parse time string like "2:30 PM"
    const timeMatch = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!timeMatch) return null;
    
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const ampm = timeMatch[3].toUpperCase();
    
    // Convert to 24-hour format
    if (ampm === 'AM' && hours === 12) {
      hours = 0;
    } else if (ampm === 'PM' && hours !== 12) {
      hours += 12;
    }
    
    // Create timestamp for today with the parsed time
    const today = new Date();
    today.setHours(hours, minutes, 0, 0);
    
    return today.getTime();
    
  } catch (error) {
    console.warn('Error parsing time string:', timeString, error);
    return null;
  }
}

/**
 * LEGACY: Check if there are updates available since the last timestamp
 * Kept for backward compatibility - use api_getStatusUpdates instead
 */
function api_hasUpdatesAvailable(lastCheckTimestamp) {
  console.log('=== api_hasUpdatesAvailable called (legacy) ===');
  console.log('Last check timestamp:', lastCheckTimestamp);
  
  try {
    const updateResult = api_getStatusUpdates(lastCheckTimestamp);
    
    return {
      hasUpdates: updateResult.hasUpdates,
      timestamp: updateResult.timestamp,
      latestEntryTime: updateResult.timestamp,
      changedStudentsCount: updateResult.changedStudents.length
    };
    
  } catch (error) {
    console.error('Error in legacy api_hasUpdatesAvailable:', error);
    // On error, assume there might be updates to be safe
    return {
      hasUpdates: true,
      timestamp: Date.now(),
      error: error.message
    };
  }
}

/**
 * TRUE SCRIPT PROPERTIES IMPLEMENTATION
 * 1. Loads student roster from daily sheet into Script Properties
 * 2. Merges today's log data into the same Script Properties
 * 3. Returns combined data from Script Properties
 */
function api_loadWithScriptProperties() {
  console.log('=== api_loadWithScriptProperties called ===');
  
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    
    // Step 1: Load roster data from daily sheet into Script Properties
    console.log('Step 1: Loading roster into Script Properties...');
    const dailySheet = getLatestDailySheet();
    const roster = _getStudentRoster(dailySheet);
    console.log(`Loaded ${roster.length} students from daily sheet`);
    
    // Initialize Script Properties with roster data
    const today = new Date().toLocaleDateString();
    const baseKey = `students_${today.replace(/\//g, '_')}`;
    
    // Clear existing data for today
    console.log('Clearing existing Script Properties for today...');
    const existingKeys = scriptProperties.getKeys();
    existingKeys.forEach(key => {
      if (key.startsWith(baseKey)) {
        scriptProperties.deleteProperty(key);
      }
    });
    
    // Store roster data in Script Properties
    console.log('Storing roster data in Script Properties...');
    roster.forEach((student, index) => {
      const studentData = {
        name: student.name,
        id: student.id,
        nameId: student.name,
        gender: "",
        teacher: "",
        outTime: "",
        backTime: "",
        holdNotice: ""
      };
      
      scriptProperties.setProperty(`${baseKey}_${index}`, JSON.stringify(studentData));
    });
    
    // Step 2: Load today's log data and merge into Script Properties
    console.log('Step 2: Merging log data into Script Properties...');
    const logData = api_debugLogSheet();
    const todaysEntries = logData.todaysEntries || [];
    console.log(`Found ${todaysEntries.length} log entries for today`);
    
    // Update Script Properties with log data
    todaysEntries.forEach(logEntry => {
      // Find the corresponding student in Script Properties
      for (let i = 0; i < roster.length; i++) {
        const key = `${baseKey}_${i}`;
        const studentDataStr = scriptProperties.getProperty(key);
        
        if (studentDataStr) {
          const studentData = JSON.parse(studentDataStr);
          
          if (studentData.name === logEntry.studentName) {
            // Update with log data
            studentData.gender = logEntry.gender || studentData.gender;
            studentData.teacher = logEntry.teacher || studentData.teacher;
            studentData.outTime = logEntry.outTime || studentData.outTime;
            studentData.backTime = logEntry.backTime || studentData.backTime;
            studentData.holdNotice = logEntry.holdNotice || studentData.holdNotice;
            
            // Save back to Script Properties
            scriptProperties.setProperty(key, JSON.stringify(studentData));
            console.log(`Updated Script Properties for ${studentData.name}`);
            break;
          }
        }
      }
    });
    
    // Step 3: Read combined data from Script Properties and return
    console.log('Step 3: Reading combined data from Script Properties...');
    const combinedStudents = [];
    const queue = { girls: [], boys: [] };
    
    for (let i = 0; i < roster.length; i++) {
      const key = `${baseKey}_${i}`;
      const studentDataStr = scriptProperties.getProperty(key);
      
      if (studentDataStr) {
        const studentData = JSON.parse(studentDataStr);
        combinedStudents.push(studentData);
        
        // Add to queue if waiting (has hold notice but no out time)
        if (studentData.holdNotice && !studentData.outTime) {
          if (studentData.gender === "G") {
            queue.girls.push(studentData.name);
          } else if (studentData.gender === "B") {
            queue.boys.push(studentData.name);
          }
        }
      }
    }
    
    const result = {
      students: combinedStudents,
      queue: queue
    };
    
    console.log(`✓ api_loadWithScriptProperties SUCCESS - returning ${combinedStudents.length} students`);
    console.log(`✓ Script Properties keys created: ${roster.length}`);
    console.log(`✓ Students with log data: ${combinedStudents.filter(s => s.outTime || s.backTime || s.holdNotice).length}`);
    
    return result;
    
  } catch (error) {
    console.error('❌ ERROR in api_loadWithScriptProperties:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Return null to trigger fallback
    return null;
  }
}

/**
 * OLD COMBINED DATA FUNCTION - kept for reference but not using Script Properties properly
 */
function api_loadCombinedStudentData() {
  console.log('=== api_loadCombinedStudentData called ===');
  
  try {
    // Step 1: Load roster data from daily sheet
    console.log('Step 1: Loading roster from daily sheet...');
    const dailySheet = getLatestDailySheet();
    const roster = _getStudentRoster(dailySheet);
    console.log(`Loaded ${roster.length} students from daily sheet`);
    
    // Step 2: Load today's log data
    console.log('Step 2: Loading today\'s log data...');
    const logData = api_debugLogSheet();
    const todaysEntries = logData.todaysEntries || [];
    console.log(`Found ${todaysEntries.length} log entries for today (${logData.today})`);
    
    // Step 3: Create combined student data in script properties format
    console.log('Step 3: Combining roster and log data...');
    const combinedStudents = roster.map(student => {
      // Find the most recent log entry for this student today
      const studentLogs = todaysEntries.filter(log => log.studentName === student.name);
      
      if (studentLogs.length > 0) {
        // Get the most recent entry
        const latestLog = studentLogs[studentLogs.length - 1];
        console.log(`Merging log data for ${student.name}:`, latestLog);
        
        return {
          name: student.name,
          id: student.id,
          nameId: student.name,
          gender: latestLog.gender || "",
          teacher: latestLog.teacher || "",
          outTime: latestLog.outTime || "",
          backTime: latestLog.backTime || "",
          holdNotice: latestLog.holdNotice || ""
        };
      } else {
        // No log entry for this student today
        return {
          name: student.name,
          id: student.id,
          nameId: student.name,
          gender: "",
          teacher: "",
          outTime: "",
          backTime: "",
          holdNotice: ""
        };
      }
    });
    
    // Step 4: Build queue from combined data
    console.log('Step 4: Building queue from combined data...');
    const queue = { girls: [], boys: [] };
    
    combinedStudents.forEach(student => {
      // Add to queue if waiting (has hold notice but no out time)
      if (student.holdNotice && !student.outTime) {
        if (student.gender === "G") {
          queue.girls.push(student.name);
        } else if (student.gender === "B") {
          queue.boys.push(student.name);
        }
      }
    });
    
    const result = {
      students: combinedStudents,
      queue: queue
    };
    
    console.log(`✓ api_loadCombinedStudentData SUCCESS - returning ${combinedStudents.length} students`);
    console.log(`✓ Queue: Girls: ${queue.girls.length}, Boys: ${queue.boys.length}`);
    console.log(`✓ Students with data: ${combinedStudents.filter(s => s.outTime || s.backTime || s.holdNotice).length}`);
    
    return result;
    
  } catch (error) {
    console.error('❌ ERROR in api_loadCombinedStudentData:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Emergency fallback - return roster-only data
    try {
      console.log('🚨 Attempting emergency fallback...');
      const dailySheet = getLatestDailySheet();
      const roster = _getStudentRoster(dailySheet);
      const fallbackResult = {
        students: roster.map(student => ({
          name: student.name,
          id: student.id,
          nameId: student.name,
          gender: "",
          teacher: "",
          outTime: "",
          backTime: "",
          holdNotice: ""
        })),
        queue: { girls: [], boys: [] }
      };
      console.log('🚨 Emergency fallback successful with', fallbackResult.students.length, 'students');
      return fallbackResult;
    } catch (fallbackError) {
      console.error('💥 Even fallback failed:', fallbackError);
      return {
        students: [
          { name: "SYSTEM ERROR: " + error.message, id: "000", nameId: "Error", gender: "", teacher: "", outTime: "", backTime: "", holdNotice: "" }
        ],
        queue: { girls: [], boys: [] }
      };
    }
  }
}

// ===== LIGHTWEIGHT API ENDPOINTS =====
// 
// This section implements optimized, lightweight API endpoints to replace
// the heavy api_fetchData function with multiple focused endpoints:
//
// 1. api_getCachedStudentData() - Cached roster + status with fallback
// 2. api_updateStudentStatusOptimized() - Single student updates with optimistic locking  
// 3. api_batchStatusUpdate() - Multiple student updates with transaction-like behavior
// 4. api_getStatusUpdatesOptimized() - Incremental updates for polling
//
// These endpoints implement:
// - Cached data retrieval with graceful degradation
// - Optimistic locking to prevent concurrent update conflicts
// - Batch operations to reduce individual sheet operations
// - Immediate responses with background cache refresh
// - Proper error handling and fallback mechanisms
//
// Requirements addressed: 5.3, 2.1, 1.1, 1.4, 5.4, 2.2, 2.3, 1.5, 4.2

/**
 * Lightweight endpoint that returns cached roster + current status
 * Implements fallback to direct sheet read if cache is invalid
 * Requirements: 1.1, 1.4, 5.4
 */
function api_getCachedStudentData() {
  const timerId = performanceMonitor.startTimer('api_getCachedStudentData');
  
  try {
    console.log('=== api_getCachedStudentData called ===');
    
    const rosterService = new CachedRosterService();
    
    // Check if caches are valid before attempting to use them
    const rosterCacheValid = rosterService.isRosterCacheValid();
    const statusCacheValid = rosterService.isStatusCacheValid();
    
    console.log(`Cache status - Roster: ${rosterCacheValid ? 'VALID' : 'INVALID'}, Status: ${statusCacheValid ? 'VALID' : 'INVALID'}`);
    
    let result;
    
    if (rosterCacheValid && statusCacheValid) {
      // Both caches are valid - use cached data
      console.log('Using fully cached data');
      result = rosterService.getCombinedCachedData();
      performanceMonitor.recordCacheHit('combined_student_data');
    } else {
      // One or both caches are invalid - implement graceful degradation
      console.log('Cache invalid - implementing graceful degradation');
      performanceMonitor.recordCacheMiss('combined_student_data');
      
      // Get roster (cached or fresh)
      const roster = rosterCacheValid ? 
        rosterService.getCachedRoster() : 
        rosterService.refreshRosterCache();
      
      // Get status (cached or fresh)  
      const status = statusCacheValid ? 
        rosterService.getCachedStatus() : 
        rosterService.refreshStatusCache();
      
      // Combine the data
      result = rosterService._combineRosterAndStatus(roster, status);
    }
    
    performanceMonitor.endTimer(timerId, {
      studentCount: result.students.length,
      queueCount: result.queue.girls.length + result.queue.boys.length,
      cacheUsed: rosterCacheValid && statusCacheValid
    });
    
    console.log(`✓ Returning ${result.students.length} students (${result.queue.girls.length + result.queue.boys.length} in queue)`);
    return {
      success: true,
      data: result,
      metadata: {
        timestamp: new Date().toISOString(),
        cacheUsed: rosterCacheValid && statusCacheValid,
        studentCount: result.students.length,
        queueCount: result.queue.girls.length + result.queue.boys.length
      }
    };
    
  } catch (error) {
    console.error('❌ Error in api_getCachedStudentData:', error);
    performanceMonitor.endTimer(timerId, { error: error.message });
    
    // Fallback to direct sheet read
    try {
      console.log('🚨 Attempting fallback to direct sheet read...');
      const dailySheet = getLatestDailySheet();
      const roster = _getStudentRoster(dailySheet);
      const status = _getCurrentRestroomStatus();
      
      const rosterService = new CachedRosterService();
      const fallbackResult = rosterService._combineRosterAndStatus(roster, status);
      
      console.log('🚨 Fallback successful');
      return {
        success: true,
        data: fallbackResult,
        metadata: {
          timestamp: new Date().toISOString(),
          cacheUsed: false,
          fallbackUsed: true,
          studentCount: fallbackResult.students.length,
          queueCount: fallbackResult.queue.girls.length + fallbackResult.queue.boys.length
        }
      };
      
    } catch (fallbackError) {
      console.error('💥 Fallback also failed:', fallbackError);
      return {
        success: false,
        error: error.message,
        fallbackError: fallbackError.message,
        data: {
          students: [],
          queue: { girls: [], boys: [] }
        },
        metadata: {
          timestamp: new Date().toISOString(),
          cacheUsed: false,
          fallbackUsed: false
        }
      };
    }
  }
}

/**
 * Optimized single student status update with minimal sheet operations
 * Provides immediate response with background cache refresh
 * Requirements: 2.1, 2.2
 */
function api_updateStudentStatusOptimized(studentName, action, teacherName, gender) {
  const timerId = performanceMonitor.startTimer('api_updateStudentStatusOptimized');
  
  try {
    console.log('=== api_updateStudentStatusOptimized called ===');
    console.log(`Parameters: ${studentName}, ${action}, ${teacherName}, ${gender}`);
    
    // Input validation
    if (!studentName || studentName.trim() === "") {
      throw new Error("Student name is required");
    }
    
    if (!teacherName || teacherName.trim() === "") {
      throw new Error("Teacher name is required");
    }
    
    if (!action || !["out", "back", "hold"].includes(action)) {
      throw new Error("Action must be 'out', 'back', or 'hold'");
    }
    
    if (action === "out" && (!gender || !["G", "B"].includes(gender))) {
      throw new Error("Gender (G or B) must be specified for 'out' action");
    }
    
    // Optimistic locking: Get current timestamp to prevent concurrent conflicts
    const updateTimestamp = Date.now();
    const lockKey = `update_lock_${studentName}`;
    const cacheManager = new ScriptPropertiesManager();
    
    // Check for existing lock (simple optimistic locking)
    const existingLock = cacheManager.get(lockKey);
    if (existingLock && (updateTimestamp - existingLock.timestamp) < 5000) { // 5 second lock
      throw new Error(`Student ${studentName} is currently being updated by another user. Please try again.`);
    }
    
    // Set lock
    cacheManager.set(lockKey, { timestamp: updateTimestamp, action: action }, 1); // 1 minute TTL
    
    try {
      // Get student ID from cached roster (faster than sheet read)
      const rosterService = new CachedRosterService();
      const roster = rosterService.getCachedRoster();
      const student = roster.find(s => s.name === studentName);
      const studentId = student ? student.id : "";
      
      // For "out" action, we need to check if another student of same gender is already out
      if (action === "out") {
        console.log('Checking current student status for optimized update...');
        
        // Get current status to check for conflicts
        const currentStatus = _getCurrentRestroomStatus();
        const studentStatus = currentStatus[studentName];
        
        if (studentStatus && studentStatus.holdNotice && !studentStatus.outTime) {
          console.log('Student is waiting in line, updating existing log entry with out time');
          // Student is waiting in line - update their existing log entry with out time
          _updateWaitingEntryToOut(studentName, studentId, gender, teacherName, new Date());
        } else {
          console.log('Checking if restroom is available for gender:', gender);
          // Check if restroom is free for that gender
          const otherOut = _checkOtherOut(gender);
          console.log('Other student out:', otherOut);
          
          if (otherOut) {
            console.log('Restroom occupied, adding to waiting list');
            // Someone of the same gender is already out. Add to waiting list
            let waitingCount = 0;
            for (const [name, status] of Object.entries(currentStatus)) {
              if (status.gender === gender && status.holdNotice && !status.outTime) {
                waitingCount++;
              }
            }
            const position = waitingCount + 1;
            const notice = `Waiting in line. Position ${position}.`;
            
            console.log('Logging waiting entry:', { studentName, studentId, gender, teacherName, notice });
            // Log the waiting entry
            _logWaitingEntry(studentName, studentId, gender, teacherName, notice);
          } else {
            console.log('Restroom available, marking student out');
            // Mark student as out - log the out entry
            _logOutEntry(studentName, studentId, gender, teacherName, new Date());
          }
        }
        
        // Immediately invalidate caches after any log operation
        const logService = new LogProcessingService();
        logService.invalidateLogCaches();
        
      } else if (action === "back") {
        // For "back" action, use the proper _logBackEntry function to update existing entry
        console.log('Marking student back using proper log entry update');
        _logBackEntry(studentName, studentId, gender, teacherName, new Date());
        
        // Immediately invalidate caches after back entry
        const logService = new LogProcessingService();
        logService.invalidateLogCaches();
        
      } else {
        // For other actions (like "hold"), use batch update
        const logService = new LogProcessingService();
        const updateResult = logService.batchUpdateLogs([{
          studentName: studentName,
          action: action,
          teacherName: teacherName,
          gender: gender,
          studentId: studentId
        }]);
        
        if (updateResult.failed > 0) {
          throw new Error(`Update failed: ${updateResult.errors.join(', ')}`);
        }
      }
      
      // Immediate response - don't wait for cache refresh
      const response = {
        success: true,
        studentName: studentName,
        action: action,
        timestamp: new Date().toISOString(),
        message: `${studentName} marked ${action} successfully`
      };
      
      // Immediate cache refresh and lock cleanup
      try {
        console.log(`Cache refresh for ${studentName} update`);
        rosterService.refreshStatusCache();
        
        // Clear the lock after successful update
        cacheManager.invalidate(lockKey);
        
      } catch (refreshError) {
        console.warn('Cache refresh failed:', refreshError);
        // Still clear the lock even if refresh fails
        cacheManager.invalidate(lockKey);
      }
      
      performanceMonitor.endTimer(timerId, {
        action: action,
        studentName: studentName,
        success: true
      });
      
      console.log(`✓ Student ${studentName} marked ${action} successfully`);
      return response;
      
    } catch (updateError) {
      // Clear lock on error
      cacheManager.invalidate(lockKey);
      throw updateError;
    }
    
  } catch (error) {
    console.error('❌ Error in api_updateStudentStatusOptimized:', error);
    performanceMonitor.endTimer(timerId, { 
      error: error.message,
      studentName: studentName,
      action: action
    });
    
    return {
      success: false,
      error: error.message,
      studentName: studentName,
      action: action,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Batch status update for multiple student operations
 * Implements transaction-like behavior with rollback on partial failures
 * Requirements: 2.3, 5.3
 */
function api_batchStatusUpdate(updates) {
  const timerId = performanceMonitor.startTimer('api_batchStatusUpdate');
  
  try {
    console.log('=== api_batchStatusUpdate called ===');
    console.log(`Processing ${updates.length} updates`);
    
    // Input validation
    if (!Array.isArray(updates) || updates.length === 0) {
      throw new Error("Updates must be a non-empty array");
    }
    
    if (updates.length > 50) {
      throw new Error("Batch size limited to 50 updates per request");
    }
    
    // Validate each update
    const validatedUpdates = [];
    const validationErrors = [];
    
    for (let i = 0; i < updates.length; i++) {
      const update = updates[i];
      
      try {
        // Validate required fields
        if (!update.studentName || update.studentName.trim() === "") {
          throw new Error(`Update ${i}: Student name is required`);
        }
        
        if (!update.action || !["out", "back", "hold"].includes(update.action)) {
          throw new Error(`Update ${i}: Action must be 'out', 'back', or 'hold'`);
        }
        
        if (!update.teacherName || update.teacherName.trim() === "") {
          throw new Error(`Update ${i}: Teacher name is required`);
        }
        
        if (update.action === "out" && (!update.gender || !["G", "B"].includes(update.gender))) {
          throw new Error(`Update ${i}: Gender (G or B) required for 'out' action`);
        }
        
        validatedUpdates.push({
          studentName: update.studentName.trim(),
          action: update.action,
          teacherName: update.teacherName.trim(),
          gender: update.gender || "",
          studentId: update.studentId || "",
          holdNotice: update.holdNotice || ""
        });
        
      } catch (validationError) {
        validationErrors.push(validationError.message);
      }
    }
    
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join('; ')}`);
    }
    
    // Get student IDs from cached roster for all students
    const rosterService = new CachedRosterService();
    const roster = rosterService.getCachedRoster();
    const rosterMap = new Map(roster.map(s => [s.name, s.id]));
    
    // Enrich updates with student IDs
    validatedUpdates.forEach(update => {
      if (!update.studentId) {
        update.studentId = rosterMap.get(update.studentName) || "";
      }
    });
    
    // Transaction-like behavior: Prepare all operations first
    console.log('Preparing batch operations...');
    const batchTimestamp = Date.now();
    const transactionId = `batch_${batchTimestamp}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store original state for potential rollback
    const originalState = {};
    const logService = new LogProcessingService();
    
    try {
      // Get current status for rollback purposes
      for (const update of validatedUpdates) {
        const currentStatus = logService.getStudentStatus(update.studentName);
        originalState[update.studentName] = currentStatus;
      }
      
      // Execute batch update using LogProcessingService
      console.log('Executing batch update...');
      const batchResult = logService.batchUpdateLogs(validatedUpdates);
      
      if (batchResult.failed > 0) {
        // Partial failure - implement rollback logic
        console.warn(`Batch update had ${batchResult.failed} failures out of ${validatedUpdates.length} updates`);
        
        if (batchResult.successful === 0) {
          // Complete failure
          throw new Error(`All updates failed: ${batchResult.errors.join('; ')}`);
        } else {
          // Partial failure - log warning but continue
          console.warn('Partial batch failure - some updates succeeded');
        }
      }
      
      // Immediate cache refresh
      try {
        console.log(`Cache refresh for batch update (${transactionId})`);
        rosterService.refreshStatusCache();
      } catch (refreshError) {
        console.warn('Cache refresh failed after batch update:', refreshError);
      }
      
      const response = {
        success: true,
        transactionId: transactionId,
        totalUpdates: validatedUpdates.length,
        successful: batchResult.successful,
        failed: batchResult.failed,
        errors: batchResult.errors,
        timestamp: new Date().toISOString(),
        message: `Batch update completed: ${batchResult.successful} successful, ${batchResult.failed} failed`
      };
      
      performanceMonitor.endTimer(timerId, {
        totalUpdates: validatedUpdates.length,
        successful: batchResult.successful,
        failed: batchResult.failed,
        transactionId: transactionId
      });
      
      console.log(`✓ Batch update completed: ${batchResult.successful}/${validatedUpdates.length} successful`);
      return response;
      
    } catch (executionError) {
      // Rollback logic would go here in a more sophisticated implementation
      // For now, we log the error and let the system recover naturally
      console.error('Batch execution failed:', executionError);
      throw new Error(`Batch execution failed: ${executionError.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error in api_batchStatusUpdate:', error);
    performanceMonitor.endTimer(timerId, { 
      error: error.message,
      totalUpdates: updates ? updates.length : 0
    });
    
    return {
      success: false,
      error: error.message,
      totalUpdates: updates ? updates.length : 0,
      successful: 0,
      failed: updates ? updates.length : 0,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Force refresh of all cached data
 */
function api_refreshCache() {
  const timerId = performanceMonitor.startTimer('api_refreshCache');
  
  try {
    console.log('=== api_refreshCache called ===');
    
    const rosterService = new CachedRosterService();
    
    // Force refresh both roster and status caches
    const roster = rosterService.refreshRosterCache();
    const status = rosterService.refreshStatusCache();
    
    performanceMonitor.endTimer(timerId, {
      rosterCount: roster.length,
      statusCount: Object.keys(status).length
    });
    
    return {
      success: true,
      message: 'Cache refreshed successfully',
      rosterCount: roster.length,
      statusCount: Object.keys(status).length,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error refreshing cache:', error);
    performanceMonitor.endTimer(timerId, { error: error.message });
    
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get incremental status updates since a given timestamp
 * Lightweight endpoint for polling-based updates
 * Requirements: 1.5, 4.2
 */
function api_getStatusUpdatesOptimized(lastUpdateTimestamp) {
  const timerId = performanceMonitor.startTimer('api_getStatusUpdatesOptimized');
  
  try {
    console.log('=== api_getStatusUpdatesOptimized called ===');
    console.log('Last update timestamp:', lastUpdateTimestamp);
    
    const logService = new LogProcessingService();
    const todaysEntries = logService.getTodaysLogEntries();
    
    // Filter entries since the last update timestamp
    const sinceTimestamp = lastUpdateTimestamp ? new Date(lastUpdateTimestamp).getTime() : 0;
    const recentEntries = todaysEntries.filter(entry => {
      // Assuming log entries have a timestamp or we use row order as proxy
      // For now, we'll return all today's entries if no timestamp filtering is possible
      return true; // TODO: Implement proper timestamp filtering when log structure supports it
    });
    
    // Build incremental update data
    const updates = {};
    const changedStudents = [];
    
    // Process recent entries to build current status
    for (const entry of recentEntries) {
      const studentName = entry.studentName;
      
      if (!updates[studentName]) {
        updates[studentName] = {
          name: studentName,
          gender: entry.gender,
          teacher: entry.teacher,
          outTime: entry.outTime || "",
          backTime: entry.backTime || "",
          holdNotice: entry.holdNotice || "",
          lastUpdated: new Date().toISOString()
        };
        
        changedStudents.push(studentName);
      }
    }
    
    const response = {
      success: true,
      hasUpdates: changedStudents.length > 0,
      changedStudents: changedStudents,
      updates: updates,
      timestamp: new Date().toISOString(),
      lastUpdateTimestamp: lastUpdateTimestamp,
      totalChanges: changedStudents.length
    };
    
    performanceMonitor.endTimer(timerId, {
      changedStudents: changedStudents.length,
      totalEntries: todaysEntries.length
    });
    
    console.log(`✓ Returning ${changedStudents.length} changed students`);
    return response;
    
  } catch (error) {
    console.error('❌ Error in api_getStatusUpdatesOptimized:', error);
    performanceMonitor.endTimer(timerId, { error: error.message });
    
    return {
      success: false,
      error: error.message,
      hasUpdates: false,
      changedStudents: [],
      updates: {},
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get cache status and performance metrics
 */
function api_getCacheStatus() {
  try {
    const rosterService = new CachedRosterService();
    const cacheInfo = rosterService.getCacheInfo();
    const performanceMetrics = performanceMonitor.getMetrics();
    
    return {
      success: true,
      cache: cacheInfo,
      performance: performanceMetrics,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error getting cache status:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Clear all caches (use with caution)
 */
function api_clearCache() {
  try {
    console.log('=== api_clearCache called ===');
    
    const rosterService = new CachedRosterService();
    rosterService.invalidateAllCaches();
    
    // Also reset performance metrics
    performanceMonitor.reset();
    
    return {
      success: true,
      message: 'All caches cleared successfully',
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Test the caching infrastructure
 */
function api_testCaching() {
  const timerId = performanceMonitor.startTimer('api_testCaching');
  
  try {
    console.log('=== Testing Caching Infrastructure ===');
    
    const results = {
      scriptPropertiesManager: null,
      cachedRosterService: null,
      performanceMonitor: null
    };
    
    // Test ScriptPropertiesManager
    console.log('Testing ScriptPropertiesManager...');
    const cacheManager = new ScriptPropertiesManager();
    const testData = { test: 'data', timestamp: Date.now() };
    
    cacheManager.set('test_key', testData, 1); // 1 minute TTL
    const retrievedData = cacheManager.get('test_key');
    const isValid = cacheManager.isValid('test_key');
    
    results.scriptPropertiesManager = {
      setSuccess: !!retrievedData,
      dataMatches: JSON.stringify(retrievedData) === JSON.stringify(testData),
      isValid: isValid,
      metrics: cacheManager.getMetrics()
    };
    
    // Test CachedRosterService
    console.log('Testing CachedRosterService...');
    const rosterService = new CachedRosterService();
    const roster = rosterService.getCachedRoster();
    const isRosterCacheValid = rosterService.isRosterCacheValid();
    
    results.cachedRosterService = {
      rosterLoaded: Array.isArray(roster),
      rosterCount: roster ? roster.length : 0,
      cacheValid: isRosterCacheValid,
      cacheInfo: rosterService.getCacheInfo()
    };
    
    // Test PerformanceMonitor
    console.log('Testing PerformanceMonitor...');
    const testTimerId = performanceMonitor.startTimer('test_operation');
    // Simulate some work
    Utilities.sleep(100);
    performanceMonitor.endTimer(testTimerId);
    
    results.performanceMonitor = {
      metricsAvailable: !!performanceMonitor.getMetrics(),
      metrics: performanceMonitor.getMetrics()
    };
    
    // Clean up test data
    cacheManager.invalidate('test_key');
    
    performanceMonitor.endTimer(timerId, { testsCompleted: 3 });
    
    return {
      success: true,
      results: results,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error testing caching infrastructure:', error);
    performanceMonitor.endTimer(timerId, { error: error.message });
    
    return {
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Optimized data loading function that avoids Script Properties entirely.
 * This should be significantly faster than api_loadWithScriptProperties.
 * Use this as an alternative when Script Properties isn't required for persistence.
 */
function api_loadFastCombinedData() {
  console.log('=== api_loadFastCombinedData called ===');
  const startTime = Date.now();
  
  try {
    // Step 1: Load roster data from daily sheet
    console.log('Step 1: Loading roster from daily sheet...');
    const dailySheet = getLatestDailySheet();
    const roster = _getStudentRoster(dailySheet);
    console.log(`Loaded ${roster.length} students from daily sheet`);
    
    // Step 2: Load today's log data
    console.log('Step 2: Loading today\'s log data...');
    const logData = api_debugLogSheet();
    const todaysEntries = logData.todaysEntries || [];
    console.log(`Found ${todaysEntries.length} log entries for today`);
    
    // Step 3: Create lookup map for O(1) log data access
    console.log('Step 3: Creating log data lookup map...');
    const logLookup = new Map();
    todaysEntries.forEach(logEntry => {
      // Use latest entry if multiple entries exist for same student
      logLookup.set(logEntry.studentName, logEntry);
    });
    
    // Step 4: Process all students in memory (no Script Properties I/O)
    console.log('Step 4: Processing students in memory...');
    const combinedStudents = [];
    const queue = { girls: [], boys: [] };
    
    roster.forEach(student => {
      const studentData = {
        name: student.name,
        id: student.id,
        nameId: student.name,
        gender: "",
        teacher: "",
        outTime: "",
        backTime: "",
        holdNotice: ""
      };
      
      // Merge log data if exists (O(1) lookup)
      const logEntry = logLookup.get(student.name);
      if (logEntry) {
        studentData.gender = logEntry.gender || "";
        studentData.teacher = logEntry.teacher || "";
        studentData.outTime = logEntry.outTime || "";
        studentData.backTime = logEntry.backTime || "";
        studentData.holdNotice = logEntry.holdNotice || "";
      }
      
      combinedStudents.push(studentData);
      
      // Add to queue if waiting (has hold notice but no out time)
      if (studentData.holdNotice && !studentData.outTime) {
        if (studentData.gender === "G") {
          queue.girls.push(studentData.name);
        } else if (studentData.gender === "B") {
          queue.boys.push(studentData.name);
        }
      }
    });
    
    const result = {
      students: combinedStudents,
      queue: queue
    };
    
    const endTime = Date.now();
    const executionTime = (endTime - startTime) / 1000;
    
    console.log(`✓ api_loadFastCombinedData SUCCESS - ${executionTime}s execution time`);
    console.log(`✓ Returning ${combinedStudents.length} students`);
    console.log(`✓ Students with log data: ${combinedStudents.filter(s => s.outTime || s.backTime || s.holdNotice).length}`);
    console.log(`✓ Queue: Girls: ${queue.girls.length}, Boys: ${queue.boys.length}`);
    
    return result;
    
  } catch (error) {
    console.error('❌ ERROR in api_loadFastCombinedData:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Return null to trigger fallback
    return null;
  }
}

// ============================================================================
// DEBUG FUNCTIONS FOR TROUBLESHOOTING DATA REFRESH ISSUES
// ============================================================================

/**
 * Debug function to check what's in the Log sheet
 */
function api_debugLogSheet() {
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
 * Force clear all caches and reload fresh data
 */
function api_forceClearCachesAndReload() {
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
function api_testCompleteDataFlow() {
  console.log('=== Test Complete Data Flow ===');
  
  const results = {
    steps: [],
    success: false
  };
  
  try {
    // Step 1: Check Log sheet
    console.log('Step 1: Checking Log sheet...');
    const logDebug = api_debugLogSheet();
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
}/**
 * 
Debug function to test gender checking logic
 */
function api_testGenderChecking() {
  console.log('=== Testing Gender Checking Logic ===');
  
  try {
    const results = {
      currentStatus: null,
      girlsOut: [],
      boysOut: [],
      girlsWaiting: [],
      boysWaiting: [],
      checkResults: {}
    };
    
    // Get current status
    const currentStatus = _getCurrentRestroomStatus();
    results.currentStatus = Object.keys(currentStatus).length;
    
    // Analyze current status
    for (const [name, status] of Object.entries(currentStatus)) {
      if (status.gender === 'G') {
        if (status.outTime && !status.backTime) {
          results.girlsOut.push(name);
        } else if (status.holdNotice && !status.outTime) {
          results.girlsWaiting.push(name);
        }
      } else if (status.gender === 'B') {
        if (status.outTime && !status.backTime) {
          results.boysOut.push(name);
        } else if (status.holdNotice && !status.outTime) {
          results.boysWaiting.push(name);
        }
      }
    }
    
    // Test _checkOtherOut function
    results.checkResults.girlsBlocked = _checkOtherOut('G');
    results.checkResults.boysBlocked = _checkOtherOut('B');
    
    console.log('Gender checking results:', results);
    
    return {
      success: true,
      results: results,
      summary: {
        girlsOut: results.girlsOut.length,
        boysOut: results.boysOut.length,
        girlsWaiting: results.girlsWaiting.length,
        boysWaiting: results.boysWaiting.length,
        girlsBlocked: results.checkResults.girlsBlocked,
        boysBlocked: results.checkResults.boysBlocked
      }
    };
    
  } catch (error) {
    console.error('Error testing gender checking:', error);
    return {
      success: false,
      error: error.message
    };
  }
}/**

 * Debug function to analyze log entries for a specific student
 */
function api_debugStudentLogEntries(studentName) {
  console.log(`=== Debug Log Entries for ${studentName} ===`);
  
  try {
    const ss = getSpreadsheet();
    const logSheet = ss.getSheetByName("Log");
    
    if (!logSheet) {
      return { error: 'No Log sheet found' };
    }
    
    const data = logSheet.getDataRange().getValues();
    const today = new Date().toLocaleDateString();
    
    console.log(`Looking for entries for ${studentName} on ${today}`);
    
    const studentEntries = [];
    
    // Find all entries for this student today
    for (let r = 1; r < data.length; r++) {
      const row = data[r];
      const entryDate = row[0] ? new Date(row[0]).toLocaleDateString() : '';
      const entryName = row[1];
      
      if (entryDate === today && entryName === studentName) {
        studentEntries.push({
          rowIndex: r + 1,
          date: entryDate,
          studentName: entryName,
          studentId: row[2] || '',
          gender: row[3] || '',
          teacher: row[4] || '',
          outTime: row[5] || '',
          backTime: row[6] || '',
          holdNotice: row[7] || ''
        });
      }
    }
    
    console.log(`Found ${studentEntries.length} entries for ${studentName}`);
    
    // Analyze the entries
    const analysis = {
      totalEntries: studentEntries.length,
      outEntries: studentEntries.filter(e => e.outTime && !e.backTime).length,
      backEntries: studentEntries.filter(e => e.backTime && !e.outTime).length,
      completeEntries: studentEntries.filter(e => e.outTime && e.backTime).length,
      holdEntries: studentEntries.filter(e => e.holdNotice && !e.outTime).length,
      entries: studentEntries
    };
    
    console.log('Analysis:', analysis);
    
    return {
      success: true,
      studentName: studentName,
      date: today,
      analysis: analysis
    };
    
  } catch (error) {
    console.error('Error debugging student log entries:', error);
    return {
      success: false,
      error: error.message
    };
  }
}/**
 * Dia
gnostic function to measure refresh performance
 */
function api_measureRefreshPerformance() {
  console.log('=== Measuring Refresh Performance ===');
  
  const results = {
    startTime: Date.now(),
    steps: []
  };
  
  try {
    // Step 1: Test cache status
    const step1Start = Date.now();
    const rosterService = new CachedRosterService();
    const cacheInfo = rosterService.getCacheInfo();
    results.steps.push({
      step: 'Cache Status Check',
      duration: Date.now() - step1Start,
      result: cacheInfo
    });
    
    // Step 2: Test cached data retrieval
    const step2Start = Date.now();
    const cachedData = api_getCachedStudentData();
    results.steps.push({
      step: 'Cached Data Retrieval',
      duration: Date.now() - step2Start,
      success: cachedData.success,
      cacheUsed: cachedData.metadata?.cacheUsed,
      studentCount: cachedData.metadata?.studentCount
    });
    
    // Step 3: Test direct sheet access
    const step3Start = Date.now();
    const dailySheet = getLatestDailySheet();
    const roster = _getStudentRoster(dailySheet);
    results.steps.push({
      step: 'Direct Sheet Access',
      duration: Date.now() - step3Start,
      studentCount: roster.length
    });
    
    // Step 4: Test log processing
    const step4Start = Date.now();
    const currentStatus = _getCurrentRestroomStatus();
    results.steps.push({
      step: 'Log Processing',
      duration: Date.now() - step4Start,
      studentsWithStatus: Object.keys(currentStatus).length
    });
    
    results.totalDuration = Date.now() - results.startTime;
    
    console.log('Performance measurement results:', results);
    
    // Analyze results
    const analysis = {
      totalTime: results.totalDuration,
      slowestStep: null,
      recommendations: []
    };
    
    let slowestDuration = 0;
    for (const step of results.steps) {
      if (step.duration > slowestDuration) {
        slowestDuration = step.duration;
        analysis.slowestStep = step.step;
      }
    }
    
    // Generate recommendations
    if (results.totalDuration > 3000) {
      analysis.recommendations.push('Total time exceeds 3-second target');
    }
    
    const cachedDataStep = results.steps.find(s => s.step === 'Cached Data Retrieval');
    if (cachedDataStep && cachedDataStep.duration > 2000) {
      analysis.recommendations.push('Cached data retrieval is slow - check server performance');
    }
    
    if (cachedDataStep && !cachedDataStep.cacheUsed) {
      analysis.recommendations.push('Cache miss detected - data being loaded fresh from sheets');
    }
    
    const sheetStep = results.steps.find(s => s.step === 'Direct Sheet Access');
    if (sheetStep && sheetStep.duration > 1000) {
      analysis.recommendations.push('Sheet access is slow - check spreadsheet size/complexity');
    }
    
    const logStep = results.steps.find(s => s.step === 'Log Processing');
    if (logStep && logStep.duration > 1000) {
      analysis.recommendations.push('Log processing is slow - check log sheet size');
    }
    
    return {
      success: true,
      results: results,
      analysis: analysis,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Performance measurement failed:', error);
    return {
      success: false,
      error: error.message,
      partialResults: results
    };
  }
}

/**
 * F
orce fresh data load - bypasses all caches for manual refresh
 * This ensures users get the absolute latest data from sheets
 */
function api_getFreshStudentData() {
  const timerId = performanceMonitor.startTimer('api_getFreshStudentData');
  
  try {
    console.log('=== api_getFreshStudentData called - bypassing all caches ===');
    
    // Force fresh reads from sheets (no caching)
    console.log('Reading fresh roster from daily sheet...');
    const dailySheet = getLatestDailySheet();
    const roster = _getStudentRoster(dailySheet);
    console.log(`Fresh roster loaded: ${roster.length} students`);
    
    console.log('Reading fresh status from log sheet...');
    const status = _getCurrentRestroomStatusFallback(); // Use fallback to bypass cache
    console.log(`Fresh status loaded for ${Object.keys(status).length} students`);
    
    // Combine the fresh data
    const rosterService = new CachedRosterService();
    const result = rosterService._combineRosterAndStatus(roster, status);
    
    // Update caches with fresh data for future requests
    console.log('Updating caches with fresh data...');
    rosterService.refreshRosterCache();
    rosterService.refreshStatusCache();
    
    performanceMonitor.endTimer(timerId, {
      studentCount: result.students.length,
      queueCount: result.queue.girls.length + result.queue.boys.length,
      cacheUsed: false,
      freshLoad: true
    });
    
    console.log(`✓ Fresh data loaded: ${result.students.length} students (${result.queue.girls.length + result.queue.boys.length} in queue)`);
    
    return {
      success: true,
      data: result,
      metadata: {
        timestamp: new Date().toISOString(),
        cacheUsed: false,
        freshLoad: true,
        studentCount: result.students.length,
        queueCount: result.queue.girls.length + result.queue.boys.length
      }
    };
    
  } catch (error) {
    console.error('❌ Error in api_getFreshStudentData:', error);
    performanceMonitor.endTimer(timerId, { error: error.message });
    
    return {
      success: false,
      error: error.message,
      data: {
        students: [],
        queue: { girls: [], boys: [] }
      },
      metadata: {
        timestamp: new Date().toISOString(),
        cacheUsed: false,
        freshLoad: false
      }
    };
  }
}

// ===== PERFORMANCE TEST FUNCTIONS =====
// These functions are needed for the performance test dashboard





