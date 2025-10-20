/**
 * Comprehensive Performance Tests for NAMS Restroom Sign-Out Webapp
 * Tests caching layer, optimized functions, and end-to-end performance validation
 * 
 * Requirements: 1.3, 2.1, 2.2
 */

// ============================================================================
// LOAD TESTING SCRIPTS - Simulate Multiple Concurrent Users
// ============================================================================

/**
 * Load Test Configuration
 */
const LOAD_TEST_CONFIG = {
  CONCURRENT_USERS: 10,
  TEST_DURATION_MS: 60000, // 1 minute
  OPERATIONS_PER_USER: 20,
  ACCEPTABLE_RESPONSE_TIME_MS: 3000,
  ACCEPTABLE_UPDATE_TIME_MS: 1000,
  CACHE_HIT_RATE_THRESHOLD: 80 // 80% minimum cache hit rate
};

/**
 * Simulate multiple concurrent users accessing the system
 * Tests system performance under load
 */
function runConcurrentUserLoadTest() {
  console.log('=== Starting Concurrent User Load Test ===');
  console.log(`Simulating ${LOAD_TEST_CONFIG.CONCURRENT_USERS} concurrent users`);
  
  const testResults = {
    startTime: Date.now(),
    users: [],
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    averageResponseTime: 0,
    maxResponseTime: 0,
    minResponseTime: Infinity,
    cacheHitRate: 0,
    errors: []
  };

  // Create promises for each simulated user
  const userPromises = [];
  
  for (let userId = 1; userId <= LOAD_TEST_CONFIG.CONCURRENT_USERS; userId++) {
    const userPromise = simulateUserSession(userId, testResults);
    userPromises.push(userPromise);
  }

  // Wait for all users to complete
  return Promise.all(userPromises).then(() => {
    testResults.endTime = Date.now();
    testResults.totalDuration = testResults.endTime - testResults.startTime;
    
    // Calculate final metrics
    if (testResults.totalOperations > 0) {
      testResults.averageResponseTime = testResults.users.reduce((sum, user) => 
        sum + user.averageResponseTime, 0) / testResults.users.length;
      
      testResults.successRate = (testResults.successfulOperations / testResults.totalOperations) * 100;
    }

    console.log('=== Load Test Results ===');
    console.log(`Total Duration: ${testResults.totalDuration}ms`);
    console.log(`Total Operations: ${testResults.totalOperations}`);
    console.log(`Success Rate: ${testResults.successRate.toFixed(2)}%`);
    console.log(`Average Response Time: ${testResults.averageResponseTime.toFixed(2)}ms`);
    console.log(`Max Response Time: ${testResults.maxResponseTime}ms`);
    console.log(`Min Response Time: ${testResults.minResponseTime}ms`);
    console.log(`Cache Hit Rate: ${testResults.cacheHitRate.toFixed(2)}%`);
    
    // Validate performance targets
    const performanceIssues = validatePerformanceTargets(testResults);
    
    return {
      ...testResults,
      performanceIssues,
      passed: performanceIssues.length === 0
    };
  });
}

/**
 * Simulate a single user session with realistic operations
 */
function simulateUserSession(userId, testResults) {
  return new Promise((resolve) => {
    const userResults = {
      userId: userId,
      operations: [],
      totalResponseTime: 0,
      averageResponseTime: 0,
      errors: []
    };

    let operationsCompleted = 0;
    const maxOperations = LOAD_TEST_CONFIG.OPERATIONS_PER_USER;

    function performNextOperation() {
      if (operationsCompleted >= maxOperations) {
        // User session complete
        userResults.averageResponseTime = userResults.totalResponseTime / operationsCompleted;
        testResults.users.push(userResults);
        resolve(userResults);
        return;
      }

      const operationType = getRandomOperation();
      const startTime = Date.now();

      performOperation(operationType, userId)
        .then((result) => {
          const responseTime = Date.now() - startTime;
          
          userResults.operations.push({
            type: operationType,
            responseTime: responseTime,
            success: true,
            timestamp: startTime
          });
          
          userResults.totalResponseTime += responseTime;
          testResults.totalOperations++;
          testResults.successfulOperations++;
          
          // Update global response time metrics
          testResults.maxResponseTime = Math.max(testResults.maxResponseTime, responseTime);
          testResults.minResponseTime = Math.min(testResults.minResponseTime, responseTime);
          
          operationsCompleted++;
          
          // Random delay between operations (100-500ms)
          setTimeout(performNextOperation, Math.random() * 400 + 100);
        })
        .catch((error) => {
          const responseTime = Date.now() - startTime;
          
          userResults.operations.push({
            type: operationType,
            responseTime: responseTime,
            success: false,
            error: error.message,
            timestamp: startTime
          });
          
          userResults.errors.push(error.message);
          testResults.totalOperations++;
          testResults.failedOperations++;
          testResults.errors.push(`User ${userId}: ${error.message}`);
          
          operationsCompleted++;
          
          // Continue with next operation even after error
          setTimeout(performNextOperation, Math.random() * 400 + 100);
        });
    }

    // Start the user session
    performNextOperation();
  });
}

/**
 * Get a random operation type for load testing
 */
function getRandomOperation() {
  const operations = [
    'fetchData',
    'getCachedData', 
    'updateStudentStatus',
    'getStatusUpdates',
    'batchUpdate'
  ];
  
  return operations[Math.floor(Math.random() * operations.length)];
}

/**
 * Perform a specific operation for load testing
 */
function performOperation(operationType, userId) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Operation ${operationType} timed out after 10 seconds`));
    }, 10000);

    const handleSuccess = (result) => {
      clearTimeout(timeout);
      resolve(result);
    };

    const handleFailure = (error) => {
      clearTimeout(timeout);
      reject(error);
    };

    switch (operationType) {
      case 'fetchData':
        google.script.run
          .withSuccessHandler(handleSuccess)
          .withFailureHandler(handleFailure)
          .api_getCachedStudentData();
        break;

      case 'getCachedData':
        google.script.run
          .withSuccessHandler(handleSuccess)
          .withFailureHandler(handleFailure)
          .api_getCachedStudentData();
        break;

      case 'updateStudentStatus':
        // Simulate updating a random student
        const studentName = `TestStudent${Math.floor(Math.random() * 25) + 1}`;
        const action = Math.random() > 0.5 ? 'out' : 'back';
        const teacher = 'Mr. Test';
        const gender = Math.random() > 0.5 ? 'G' : 'B';
        
        google.script.run
          .withSuccessHandler(handleSuccess)
          .withFailureHandler(handleFailure)
          .api_updateStudentStatusOptimized(studentName, action, teacher, gender);
        break;

      case 'getStatusUpdates':
        const lastUpdate = Date.now() - (Math.random() * 60000); // Random time in last minute
        google.script.run
          .withSuccessHandler(handleSuccess)
          .withFailureHandler(handleFailure)
          .api_getStatusUpdatesOptimized(lastUpdate);
        break;

      case 'batchUpdate':
        // Simulate batch update of 2-3 students
        const batchSize = Math.floor(Math.random() * 2) + 2;
        const updates = [];
        
        for (let i = 0; i < batchSize; i++) {
          updates.push({
            studentName: `TestStudent${Math.floor(Math.random() * 25) + 1}`,
            action: Math.random() > 0.5 ? 'out' : 'back',
            teacherName: 'Mr. Test',
            gender: Math.random() > 0.5 ? 'G' : 'B'
          });
        }
        
        google.script.run
          .withSuccessHandler(handleSuccess)
          .withFailureHandler(handleFailure)
          .api_batchStatusUpdate(updates);
        break;

      default:
        reject(new Error(`Unknown operation type: ${operationType}`));
    }
  });
}

/**
 * Validate performance against targets
 */
function validatePerformanceTargets(testResults) {
  const issues = [];

  // Check average response time
  if (testResults.averageResponseTime > LOAD_TEST_CONFIG.ACCEPTABLE_RESPONSE_TIME_MS) {
    issues.push(`Average response time ${testResults.averageResponseTime.toFixed(2)}ms exceeds target ${LOAD_TEST_CONFIG.ACCEPTABLE_RESPONSE_TIME_MS}ms`);
  }

  // Check max response time
  if (testResults.maxResponseTime > LOAD_TEST_CONFIG.ACCEPTABLE_RESPONSE_TIME_MS * 2) {
    issues.push(`Max response time ${testResults.maxResponseTime}ms exceeds acceptable limit ${LOAD_TEST_CONFIG.ACCEPTABLE_RESPONSE_TIME_MS * 2}ms`);
  }

  // Check success rate
  if (testResults.successRate < 95) {
    issues.push(`Success rate ${testResults.successRate.toFixed(2)}% is below 95% threshold`);
  }

  // Check cache hit rate (if available)
  if (testResults.cacheHitRate < LOAD_TEST_CONFIG.CACHE_HIT_RATE_THRESHOLD) {
    issues.push(`Cache hit rate ${testResults.cacheHitRate.toFixed(2)}% is below ${LOAD_TEST_CONFIG.CACHE_HIT_RATE_THRESHOLD}% threshold`);
  }

  return issues;
}

// ============================================================================
// UNIT TESTS FOR CACHING LAYER AND OPTIMIZED FUNCTIONS
// ============================================================================

/**
 * Test Suite for Caching Infrastructure
 */
function runCachingLayerTests() {
  console.log('=== Running Caching Layer Unit Tests ===');
  
  const testResults = {
    passed: 0,
    failed: 0,
    errors: [],
    details: []
  };

  // Test ScriptPropertiesManager
  testScriptPropertiesManager(testResults);
  
  // Test CachedRosterService
  testCachedRosterService(testResults);
  
  // Test LogProcessingService
  testLogProcessingService(testResults);
  
  // Test Performance Monitor
  testPerformanceMonitor(testResults);

  console.log('=== Caching Layer Test Results ===');
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('Errors:');
    testResults.errors.forEach(error => console.log(`  - ${error}`));
  }

  return testResults;
}

/**
 * Test ScriptPropertiesManager functionality
 */
function testScriptPropertiesManager(testResults) {
  try {
    console.log('Testing ScriptPropertiesManager...');
    
    const cacheManager = new ScriptPropertiesManager();
    const testKey = 'test_cache_key';
    const testData = { 
      message: 'test data', 
      timestamp: Date.now(),
      array: [1, 2, 3],
      nested: { value: 'nested test' }
    };

    // Test 1: Set and Get
    const setResult = cacheManager.set(testKey, testData, 1); // 1 minute TTL
    if (!setResult) {
      throw new Error('Failed to set cache data');
    }
    
    const retrievedData = cacheManager.get(testKey);
    if (!retrievedData || JSON.stringify(retrievedData) !== JSON.stringify(testData)) {
      throw new Error('Retrieved data does not match original data');
    }
    
    testResults.passed++;
    testResults.details.push('ScriptPropertiesManager set/get: PASSED');

    // Test 2: TTL validation
    const isValid = cacheManager.isValid(testKey);
    if (!isValid) {
      throw new Error('Cache entry should be valid');
    }
    
    testResults.passed++;
    testResults.details.push('ScriptPropertiesManager TTL validation: PASSED');

    // Test 3: Cache info
    const cacheInfo = cacheManager.getCacheInfo(testKey);
    if (!cacheInfo || !cacheInfo.key || !cacheInfo.timestamp) {
      throw new Error('Cache info is incomplete');
    }
    
    testResults.passed++;
    testResults.details.push('ScriptPropertiesManager cache info: PASSED');

    // Test 4: Metrics
    const metrics = cacheManager.getMetrics();
    if (!metrics || typeof metrics.hitRate !== 'string') {
      throw new Error('Metrics are incomplete');
    }
    
    testResults.passed++;
    testResults.details.push('ScriptPropertiesManager metrics: PASSED');

    // Test 5: Invalidation
    cacheManager.invalidate(testKey);
    const afterInvalidation = cacheManager.get(testKey);
    if (afterInvalidation !== null) {
      throw new Error('Cache entry should be null after invalidation');
    }
    
    testResults.passed++;
    testResults.details.push('ScriptPropertiesManager invalidation: PASSED');

  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`ScriptPropertiesManager test failed: ${error.message}`);
    testResults.details.push(`ScriptPropertiesManager: FAILED - ${error.message}`);
  }
}

/**
 * Test CachedRosterService functionality
 */
function testCachedRosterService(testResults) {
  try {
    console.log('Testing CachedRosterService...');
    
    const rosterService = new CachedRosterService();

    // Test 1: Cache info retrieval
    const cacheInfo = rosterService.getCacheInfo();
    if (!cacheInfo || typeof cacheInfo !== 'object') {
      throw new Error('Cache info should be an object');
    }
    
    testResults.passed++;
    testResults.details.push('CachedRosterService cache info: PASSED');

    // Test 2: Cache validity check
    const isRosterValid = rosterService.isRosterCacheValid();
    // This can be true or false, just checking it doesn't throw
    
    testResults.passed++;
    testResults.details.push('CachedRosterService validity check: PASSED');

    // Test 3: Cache invalidation
    rosterService.invalidateAllCaches();
    // Should not throw an error
    
    testResults.passed++;
    testResults.details.push('CachedRosterService invalidation: PASSED');

  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`CachedRosterService test failed: ${error.message}`);
    testResults.details.push(`CachedRosterService: FAILED - ${error.message}`);
  }
}

/**
 * Test LogProcessingService functionality
 */
function testLogProcessingService(testResults) {
  try {
    console.log('Testing LogProcessingService...');
    
    // Test 1: Service instantiation
    const logService = new LogProcessingService();
    if (!logService) {
      throw new Error('Failed to create LogProcessingService instance');
    }
    
    testResults.passed++;
    testResults.details.push('LogProcessingService instantiation: PASSED');

    // Test 2: Get today's log entries (should not throw)
    const todaysEntries = logService.getTodaysLogEntries();
    if (!Array.isArray(todaysEntries)) {
      throw new Error('getTodaysLogEntries should return an array');
    }
    
    testResults.passed++;
    testResults.details.push('LogProcessingService getTodaysLogEntries: PASSED');

    // Test 3: Get all student statuses
    const allStatuses = logService.getAllStudentStatuses();
    if (typeof allStatuses !== 'object') {
      throw new Error('getAllStudentStatuses should return an object');
    }
    
    testResults.passed++;
    testResults.details.push('LogProcessingService getAllStudentStatuses: PASSED');

    // Test 4: Cache info
    const logCacheInfo = logService.getCacheInfo();
    if (!logCacheInfo || typeof logCacheInfo !== 'object') {
      throw new Error('getCacheInfo should return an object');
    }
    
    testResults.passed++;
    testResults.details.push('LogProcessingService cache info: PASSED');

  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`LogProcessingService test failed: ${error.message}`);
    testResults.details.push(`LogProcessingService: FAILED - ${error.message}`);
  }
}

/**
 * Test PerformanceMonitor functionality
 */
function testPerformanceMonitor(testResults) {
  try {
    console.log('Testing PerformanceMonitor...');
    
    // Test 1: Timer functionality
    const timerId = performanceMonitor.startTimer('test_operation');
    if (!timerId) {
      throw new Error('startTimer should return a timer ID');
    }
    
    // Simulate some work
    Utilities.sleep(50);
    
    performanceMonitor.endTimer(timerId, { testData: 'success' });
    
    testResults.passed++;
    testResults.details.push('PerformanceMonitor timer: PASSED');

    // Test 2: Metrics retrieval
    const metrics = performanceMonitor.getMetrics();
    if (!metrics || !metrics.timing || !metrics.apiCalls) {
      throw new Error('getMetrics should return complete metrics object');
    }
    
    testResults.passed++;
    testResults.details.push('PerformanceMonitor metrics: PASSED');

    // Test 3: Summary generation
    const summary = performanceMonitor.getSummary();
    if (typeof summary !== 'string' || summary.length === 0) {
      throw new Error('getSummary should return a non-empty string');
    }
    
    testResults.passed++;
    testResults.details.push('PerformanceMonitor summary: PASSED');

    // Test 4: Record operations
    performanceMonitor.recordSheetRead('TestSheet', 10);
    performanceMonitor.recordCacheHit('test_key');
    performanceMonitor.recordCacheMiss('another_key');
    
    const updatedMetrics = performanceMonitor.getMetrics();
    if (updatedMetrics.apiCalls.sheetReads === 0) {
      throw new Error('Sheet read should be recorded in metrics');
    }
    
    testResults.passed++;
    testResults.details.push('PerformanceMonitor recording: PASSED');

  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`PerformanceMonitor test failed: ${error.message}`);
    testResults.details.push(`PerformanceMonitor: FAILED - ${error.message}`);
  }
}

// ============================================================================
// INTEGRATION TESTS FOR END-TO-END PERFORMANCE VALIDATION
// ============================================================================

/**
 * End-to-End Performance Integration Tests
 */
function runEndToEndPerformanceTests() {
  console.log('=== Running End-to-End Performance Tests ===');
  
  const testResults = {
    tests: [],
    overallPassed: true,
    startTime: Date.now()
  };

  return Promise.resolve()
    .then(() => testInitialLoadPerformance(testResults))
    .then(() => testStatusUpdatePerformance(testResults))
    .then(() => testCacheEffectiveness(testResults))
    .then(() => testIncrementalUpdates(testResults))
    .then(() => testBatchOperations(testResults))
    .then(() => {
      testResults.endTime = Date.now();
      testResults.totalDuration = testResults.endTime - testResults.startTime;
      
      console.log('=== End-to-End Performance Test Results ===');
      console.log(`Total Duration: ${testResults.totalDuration}ms`);
      console.log(`Tests Passed: ${testResults.tests.filter(t => t.passed).length}/${testResults.tests.length}`);
      
      testResults.tests.forEach(test => {
        const status = test.passed ? 'PASSED' : 'FAILED';
        console.log(`${test.name}: ${status} (${test.duration}ms)`);
        if (!test.passed) {
          console.log(`  Error: ${test.error}`);
        }
      });

      return testResults;
    });
}

/**
 * Test initial data load performance (Requirement 1.1: 3 second target)
 */
function testInitialLoadPerformance(testResults) {
  return new Promise((resolve) => {
    console.log('Testing initial load performance...');
    
    const startTime = Date.now();
    
    google.script.run
      .withSuccessHandler((data) => {
        const duration = Date.now() - startTime;
        const passed = duration <= 3000; // 3 second target
        
        testResults.tests.push({
          name: 'Initial Load Performance',
          duration: duration,
          passed: passed,
          target: '3000ms',
          actual: `${duration}ms`,
          error: passed ? null : `Load time ${duration}ms exceeds 3000ms target`
        });
        
        if (!passed) testResults.overallPassed = false;
        resolve();
      })
      .withFailureHandler((error) => {
        const duration = Date.now() - startTime;
        
        testResults.tests.push({
          name: 'Initial Load Performance',
          duration: duration,
          passed: false,
          target: '3000ms',
          actual: 'FAILED',
          error: error.message
        });
        
        testResults.overallPassed = false;
        resolve();
      })
      .api_getCachedStudentData();
  });
}

/**
 * Test status update performance (Requirement 2.1: 1 second target)
 */
function testStatusUpdatePerformance(testResults) {
  return new Promise((resolve) => {
    console.log('Testing status update performance...');
    
    const startTime = Date.now();
    
    google.script.run
      .withSuccessHandler((result) => {
        const duration = Date.now() - startTime;
        const passed = duration <= 1000; // 1 second target
        
        testResults.tests.push({
          name: 'Status Update Performance',
          duration: duration,
          passed: passed,
          target: '1000ms',
          actual: `${duration}ms`,
          error: passed ? null : `Update time ${duration}ms exceeds 1000ms target`
        });
        
        if (!passed) testResults.overallPassed = false;
        resolve();
      })
      .withFailureHandler((error) => {
        const duration = Date.now() - startTime;
        
        testResults.tests.push({
          name: 'Status Update Performance',
          duration: duration,
          passed: false,
          target: '1000ms',
          actual: 'FAILED',
          error: error.message
        });
        
        testResults.overallPassed = false;
        resolve();
      })
      .api_updateStudentStatusOptimized('TestStudent', 'out', 'Mr. Test', 'G');
  });
}

/**
 * Test cache effectiveness
 */
function testCacheEffectiveness(testResults) {
  return new Promise((resolve) => {
    console.log('Testing cache effectiveness...');
    
    const startTime = Date.now();
    
    // First call to populate cache
    google.script.run
      .withSuccessHandler(() => {
        // Second call should be faster due to cache
        const secondCallStart = Date.now();
        
        google.script.run
          .withSuccessHandler(() => {
            const secondCallDuration = Date.now() - secondCallStart;
            const totalDuration = Date.now() - startTime;
            
            // Second call should be significantly faster (less than 500ms)
            const passed = secondCallDuration <= 500;
            
            testResults.tests.push({
              name: 'Cache Effectiveness',
              duration: totalDuration,
              passed: passed,
              target: 'Second call < 500ms',
              actual: `Second call: ${secondCallDuration}ms`,
              error: passed ? null : `Cached call ${secondCallDuration}ms exceeds 500ms target`
            });
            
            if (!passed) testResults.overallPassed = false;
            resolve();
          })
          .withFailureHandler((error) => {
            testResults.tests.push({
              name: 'Cache Effectiveness',
              duration: Date.now() - startTime,
              passed: false,
              target: 'Second call < 500ms',
              actual: 'FAILED',
              error: error.message
            });
            
            testResults.overallPassed = false;
            resolve();
          })
          .api_getCachedStudentData();
      })
      .withFailureHandler((error) => {
        testResults.tests.push({
          name: 'Cache Effectiveness',
          duration: Date.now() - startTime,
          passed: false,
          target: 'Second call < 500ms',
          actual: 'FAILED',
          error: `First call failed: ${error.message}`
        });
        
        testResults.overallPassed = false;
        resolve();
      })
      .api_getCachedStudentData();
  });
}

/**
 * Test incremental updates performance
 */
function testIncrementalUpdates(testResults) {
  return new Promise((resolve) => {
    console.log('Testing incremental updates performance...');
    
    const startTime = Date.now();
    const lastUpdateTime = Date.now() - 60000; // 1 minute ago
    
    google.script.run
      .withSuccessHandler((updateInfo) => {
        const duration = Date.now() - startTime;
        const passed = duration <= 2000 && updateInfo && typeof updateInfo.hasUpdates === 'boolean';
        
        testResults.tests.push({
          name: 'Incremental Updates Performance',
          duration: duration,
          passed: passed,
          target: '< 2000ms with valid response',
          actual: `${duration}ms, hasUpdates: ${updateInfo ? updateInfo.hasUpdates : 'undefined'}`,
          error: passed ? null : `Incremental update check failed or too slow`
        });
        
        if (!passed) testResults.overallPassed = false;
        resolve();
      })
      .withFailureHandler((error) => {
        const duration = Date.now() - startTime;
        
        testResults.tests.push({
          name: 'Incremental Updates Performance',
          duration: duration,
          passed: false,
          target: '< 2000ms with valid response',
          actual: 'FAILED',
          error: error.message
        });
        
        testResults.overallPassed = false;
        resolve();
      })
      .api_getStatusUpdatesOptimized(lastUpdateTime);
  });
}

/**
 * Test batch operations performance
 */
function testBatchOperations(testResults) {
  return new Promise((resolve) => {
    console.log('Testing batch operations performance...');
    
    const startTime = Date.now();
    const batchUpdates = [
      { studentName: 'TestStudent1', action: 'out', teacherName: 'Mr. Test', gender: 'G' },
      { studentName: 'TestStudent2', action: 'out', teacherName: 'Mr. Test', gender: 'B' },
      { studentName: 'TestStudent3', action: 'back', teacherName: 'Mr. Test', gender: 'G' }
    ];
    
    google.script.run
      .withSuccessHandler((result) => {
        const duration = Date.now() - startTime;
        const passed = duration <= 2000 && result && result.successful >= 0;
        
        testResults.tests.push({
          name: 'Batch Operations Performance',
          duration: duration,
          passed: passed,
          target: '< 2000ms for 3 operations',
          actual: `${duration}ms, successful: ${result ? result.successful : 'undefined'}`,
          error: passed ? null : `Batch operation failed or too slow`
        });
        
        if (!passed) testResults.overallPassed = false;
        resolve();
      })
      .withFailureHandler((error) => {
        const duration = Date.now() - startTime;
        
        testResults.tests.push({
          name: 'Batch Operations Performance',
          duration: duration,
          passed: false,
          target: '< 2000ms for 3 operations',
          actual: 'FAILED',
          error: error.message
        });
        
        testResults.overallPassed = false;
        resolve();
      })
      .api_batchStatusUpdate(batchUpdates);
  });
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

/**
 * Run all performance tests
 */
function runAllPerformanceTests() {
  console.log('=== Starting Comprehensive Performance Test Suite ===');
  
  const overallResults = {
    startTime: Date.now(),
    unitTests: null,
    loadTests: null,
    integrationTests: null,
    overallPassed: false
  };

  // Run unit tests first
  console.log('\n1. Running Unit Tests...');
  overallResults.unitTests = runCachingLayerTests();

  // Run integration tests
  console.log('\n2. Running Integration Tests...');
  return runEndToEndPerformanceTests()
    .then((integrationResults) => {
      overallResults.integrationTests = integrationResults;
      
      // Run load tests last (most intensive)
      console.log('\n3. Running Load Tests...');
      return runConcurrentUserLoadTest();
    })
    .then((loadResults) => {
      overallResults.loadTests = loadResults;
      overallResults.endTime = Date.now();
      overallResults.totalDuration = overallResults.endTime - overallResults.startTime;
      
      // Determine overall pass/fail
      const unitTestsPassed = overallResults.unitTests.failed === 0;
      const integrationTestsPassed = overallResults.integrationTests.overallPassed;
      const loadTestsPassed = overallResults.loadTests.passed;
      
      overallResults.overallPassed = unitTestsPassed && integrationTestsPassed && loadTestsPassed;
      
      // Generate final report
      console.log('\n=== COMPREHENSIVE PERFORMANCE TEST REPORT ===');
      console.log(`Total Test Duration: ${overallResults.totalDuration}ms`);
      console.log(`Overall Result: ${overallResults.overallPassed ? 'PASSED' : 'FAILED'}`);
      console.log('');
      console.log('Test Category Results:');
      console.log(`  Unit Tests: ${unitTestsPassed ? 'PASSED' : 'FAILED'} (${overallResults.unitTests.passed}/${overallResults.unitTests.passed + overallResults.unitTests.failed})`);
      console.log(`  Integration Tests: ${integrationTestsPassed ? 'PASSED' : 'FAILED'} (${overallResults.integrationTests.tests.filter(t => t.passed).length}/${overallResults.integrationTests.tests.length})`);
      console.log(`  Load Tests: ${loadTestsPassed ? 'PASSED' : 'FAILED'} (${overallResults.loadTests.successRate?.toFixed(2)}% success rate)`);
      
      if (!overallResults.overallPassed) {
        console.log('\nPerformance Issues Detected:');
        if (!unitTestsPassed) {
          console.log('  - Unit test failures in caching layer');
        }
        if (!integrationTestsPassed) {
          console.log('  - Integration test failures in end-to-end performance');
        }
        if (!loadTestsPassed && overallResults.loadTests.performanceIssues) {
          overallResults.loadTests.performanceIssues.forEach(issue => {
            console.log(`  - ${issue}`);
          });
        }
      }
      
      return overallResults;
    })
    .catch((error) => {
      console.error('Error running performance tests:', error);
      overallResults.error = error.message;
      overallResults.overallPassed = false;
      return overallResults;
    });
}

// Export functions for use in Apps Script environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runAllPerformanceTests,
    runConcurrentUserLoadTest,
    runCachingLayerTests,
    runEndToEndPerformanceTests,
    LOAD_TEST_CONFIG
  };
}