/**
 * Simple Performance Test Runner
 * Provides easy-to-use functions for running specific test suites
 */

/**
 * Run just the unit tests for caching layer
 */
function testCachingLayer() {
  console.log('=== Running Caching Layer Tests Only ===');
  return runCachingLayerTests();
}

/**
 * Run just the load tests
 */
function testConcurrentLoad() {
  console.log('=== Running Concurrent Load Tests Only ===');
  return runConcurrentUserLoadTest();
}

/**
 * Run just the integration tests
 */
function testEndToEndPerformance() {
  console.log('=== Running End-to-End Performance Tests Only ===');
  return runEndToEndPerformanceTests();
}

/**
 * Run a quick performance check (subset of tests)
 */
function quickPerformanceCheck() {
  console.log('=== Running Quick Performance Check ===');
  
  const results = {
    startTime: Date.now(),
    tests: []
  };

  // Test 1: Basic caching functionality
  console.log('1. Testing basic caching...');
  try {
    const cacheManager = new ScriptPropertiesManager();
    const testData = { test: 'quick check', timestamp: Date.now() };
    
    const setSuccess = cacheManager.set('quick_test', testData, 1);
    const retrievedData = cacheManager.get('quick_test');
    const isValid = cacheManager.isValid('quick_test');
    
    results.tests.push({
      name: 'Basic Caching',
      passed: setSuccess && retrievedData && isValid,
      details: `Set: ${setSuccess}, Retrieved: ${!!retrievedData}, Valid: ${isValid}`
    });
    
    cacheManager.invalidate('quick_test');
  } catch (error) {
    results.tests.push({
      name: 'Basic Caching',
      passed: false,
      error: error.message
    });
  }

  // Test 2: Performance monitoring
  console.log('2. Testing performance monitoring...');
  try {
    const timerId = performanceMonitor.startTimer('quick_test_operation');
    Utilities.sleep(10); // Small delay
    performanceMonitor.endTimer(timerId);
    
    const metrics = performanceMonitor.getMetrics();
    
    results.tests.push({
      name: 'Performance Monitoring',
      passed: !!metrics && !!metrics.timing,
      details: `Metrics available: ${!!metrics}`
    });
  } catch (error) {
    results.tests.push({
      name: 'Performance Monitoring',
      passed: false,
      error: error.message
    });
  }

  // Test 3: API endpoint availability
  console.log('3. Testing API endpoints...');
  const requiredEndpoints = [
    'api_getCachedStudentData',
    'api_updateStudentStatusOptimized',
    'api_getStatusUpdatesOptimized',
    'api_batchStatusUpdate'
  ];
  
  let endpointsAvailable = 0;
  requiredEndpoints.forEach(endpoint => {
    try {
      const func = eval(endpoint);
      if (typeof func === 'function') {
        endpointsAvailable++;
      }
    } catch (error) {
      // Endpoint not available
    }
  });
  
  results.tests.push({
    name: 'API Endpoints',
    passed: endpointsAvailable === requiredEndpoints.length,
    details: `${endpointsAvailable}/${requiredEndpoints.length} endpoints available`
  });

  results.endTime = Date.now();
  results.duration = results.endTime - results.startTime;
  results.overallPassed = results.tests.every(test => test.passed);

  console.log('=== Quick Performance Check Results ===');
  console.log(`Duration: ${results.duration}ms`);
  console.log(`Overall: ${results.overallPassed ? 'PASSED' : 'FAILED'}`);
  
  results.tests.forEach(test => {
    const status = test.passed ? 'PASSED' : 'FAILED';
    console.log(`${test.name}: ${status}`);
    if (test.details) console.log(`  ${test.details}`);
    if (test.error) console.log(`  Error: ${test.error}`);
  });

  return results;
}

/**
 * Test a single API endpoint performance
 */
function testSingleEndpoint(endpointName, ...args) {
  console.log(`=== Testing Single Endpoint: ${endpointName} ===`);
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    try {
      const endpoint = eval(endpointName);
      if (typeof endpoint !== 'function') {
        resolve({
          endpointName: endpointName,
          success: false,
          error: 'Endpoint is not a function',
          duration: 0
        });
        return;
      }

      google.script.run
        .withSuccessHandler((result) => {
          const duration = Date.now() - startTime;
          console.log(`${endpointName} completed in ${duration}ms`);
          
          resolve({
            endpointName: endpointName,
            success: true,
            duration: duration,
            result: result
          });
        })
        .withFailureHandler((error) => {
          const duration = Date.now() - startTime;
          console.log(`${endpointName} failed after ${duration}ms: ${error.message}`);
          
          resolve({
            endpointName: endpointName,
            success: false,
            duration: duration,
            error: error.message
          });
        })[endpointName](...args);
        
    } catch (error) {
      resolve({
        endpointName: endpointName,
        success: false,
        error: error.message,
        duration: 0
      });
    }
  });
}

/**
 * Run performance tests with custom configuration
 */
function customPerformanceTest(config = {}) {
  const defaultConfig = {
    includeCachingTests: true,
    includeLoadTests: false,
    includeIntegrationTests: true,
    concurrentUsers: 5,
    testDuration: 30000 // 30 seconds
  };
  
  const testConfig = { ...defaultConfig, ...config };
  
  console.log('=== Running Custom Performance Test ===');
  console.log('Configuration:', testConfig);
  
  const results = {
    startTime: Date.now(),
    config: testConfig,
    testResults: {}
  };

  let testPromise = Promise.resolve();

  if (testConfig.includeCachingTests) {
    testPromise = testPromise.then(() => {
      console.log('Running caching tests...');
      results.testResults.caching = runCachingLayerTests();
    });
  }

  if (testConfig.includeIntegrationTests) {
    testPromise = testPromise.then(() => {
      console.log('Running integration tests...');
      return runEndToEndPerformanceTests().then(integrationResults => {
        results.testResults.integration = integrationResults;
      });
    });
  }

  if (testConfig.includeLoadTests) {
    // Temporarily modify load test config
    const originalConfig = { ...LOAD_TEST_CONFIG };
    LOAD_TEST_CONFIG.CONCURRENT_USERS = testConfig.concurrentUsers;
    LOAD_TEST_CONFIG.TEST_DURATION_MS = testConfig.testDuration;
    
    testPromise = testPromise.then(() => {
      console.log('Running load tests...');
      return runConcurrentUserLoadTest().then(loadResults => {
        results.testResults.load = loadResults;
        
        // Restore original config
        Object.assign(LOAD_TEST_CONFIG, originalConfig);
      });
    });
  }

  return testPromise.then(() => {
    results.endTime = Date.now();
    results.totalDuration = results.endTime - results.startTime;
    
    console.log('=== Custom Performance Test Complete ===');
    console.log(`Total Duration: ${results.totalDuration}ms`);
    
    return results;
  });
}

/**
 * Generate a performance report
 */
function generatePerformanceReport() {
  console.log('=== Generating Performance Report ===');
  
  const report = {
    timestamp: new Date().toISOString(),
    system: {
      cacheManager: null,
      performanceMonitor: null,
      rosterService: null
    },
    recommendations: []
  };

  // Check caching system
  try {
    const cacheManager = new ScriptPropertiesManager();
    const metrics = cacheManager.getMetrics();
    report.system.cacheManager = {
      available: true,
      metrics: metrics
    };
    
    const hitRate = parseFloat(metrics.hitRate);
    if (hitRate < 80) {
      report.recommendations.push(`Cache hit rate is ${metrics.hitRate}, consider increasing cache TTL or optimizing cache keys`);
    }
  } catch (error) {
    report.system.cacheManager = {
      available: false,
      error: error.message
    };
    report.recommendations.push('Caching system is not functioning properly');
  }

  // Check performance monitoring
  try {
    const perfMetrics = performanceMonitor.getMetrics();
    report.system.performanceMonitor = {
      available: true,
      metrics: perfMetrics
    };
    
    if (perfMetrics.timing.averageResponseTime > 2000) {
      report.recommendations.push(`Average response time is ${perfMetrics.timing.averageResponseTime}ms, consider optimizing slow operations`);
    }
  } catch (error) {
    report.system.performanceMonitor = {
      available: false,
      error: error.message
    };
    report.recommendations.push('Performance monitoring is not functioning properly');
  }

  // Check roster service
  try {
    const rosterService = new CachedRosterService();
    const cacheInfo = rosterService.getCacheInfo();
    report.system.rosterService = {
      available: true,
      cacheInfo: cacheInfo
    };
  } catch (error) {
    report.system.rosterService = {
      available: false,
      error: error.message
    };
    report.recommendations.push('Roster service is not functioning properly');
  }

  console.log('Performance Report Generated:');
  console.log(JSON.stringify(report, null, 2));
  
  return report;
}

// Export for Apps Script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testCachingLayer,
    testConcurrentLoad,
    testEndToEndPerformance,
    quickPerformanceCheck,
    testSingleEndpoint,
    customPerformanceTest,
    generatePerformanceReport
  };
}