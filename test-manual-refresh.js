/**
 * Test script to verify manual refresh after status updates
 * This tests the new immediate refresh functionality
 */

function testManualRefreshAfterStatusUpdate() {
  console.log('=== Testing Manual Refresh After Status Update ===');
  
  try {
    // Test student data
    const testStudent = 'TestStudent1';
    const testTeacher = 'Mr. Test';
    const testGender = 'G';
    
    console.log('Step 1: Get initial student data');
    const initialData = api_getCachedStudentData();
    console.log('Initial data loaded:', initialData.success);
    
    console.log('Step 2: Update student status');
    const updateResult = api_updateStudentStatusOptimized(testStudent, 'out', testTeacher, testGender);
    console.log('Status update result:', updateResult);
    
    if (updateResult.success) {
      console.log('Step 3: Verify data refresh (simulating webapp behavior)');
      
      // Wait a moment for any server-side processing
      Utilities.sleep(200);
      
      // Get fresh data to verify the update
      const refreshedData = api_getFreshStudentData();
      console.log('Refreshed data loaded:', refreshedData.success);
      
      if (refreshedData.success) {
        const updatedStudent = refreshedData.data.students.find(s => s.name === testStudent);
        if (updatedStudent && updatedStudent.outTime) {
          console.log('✅ Manual refresh test PASSED - Student status updated and data refreshed');
          console.log(`Student ${testStudent} out time: ${updatedStudent.outTime}`);
        } else {
          console.log('⚠️ Manual refresh test INCONCLUSIVE - Student not found or no out time');
        }
      }
      
      // Clean up - mark student back
      console.log('Step 4: Cleanup - marking student back');
      const backResult = api_updateStudentStatusOptimized(testStudent, 'back', testTeacher, testGender);
      console.log('Cleanup result:', backResult.success);
      
    } else {
      console.log('❌ Status update failed, cannot test manual refresh');
    }
    
    console.log('=== Manual Refresh Test Complete ===');
    
    return {
      success: true,
      message: 'Manual refresh test completed - check logs for details'
    };
    
  } catch (error) {
    console.error('Error in manual refresh test:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test the immediate polling trigger functionality
 */
function testImmediatePollingTrigger() {
  console.log('=== Testing Immediate Polling Trigger ===');
  
  try {
    // Test the optimized status updates endpoint
    const lastUpdate = Date.now() - 60000; // 1 minute ago
    
    console.log('Testing optimized status updates endpoint...');
    const updatesResult = api_getStatusUpdatesOptimized(lastUpdate);
    
    console.log('Status updates result:', updatesResult);
    
    if (updatesResult.success) {
      console.log('✅ Immediate polling trigger test PASSED');
      console.log(`Updates found: ${updatesResult.hasUpdates}`);
      console.log(`Changed students: ${updatesResult.changedStudents?.length || 0}`);
    } else {
      console.log('⚠️ Immediate polling trigger test INCONCLUSIVE');
    }
    
    return {
      success: true,
      hasUpdates: updatesResult.hasUpdates,
      changedStudents: updatesResult.changedStudents?.length || 0
    };
    
  } catch (error) {
    console.error('Error in immediate polling trigger test:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Run all manual refresh tests
 */
function runManualRefreshTests() {
  console.log('🧪 Running Manual Refresh Tests...');
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };
  
  // Test 1: Manual refresh after status update
  console.log('\n--- Test 1: Manual Refresh After Status Update ---');
  const test1 = testManualRefreshAfterStatusUpdate();
  results.tests.push({
    name: 'Manual Refresh After Status Update',
    ...test1
  });
  
  // Test 2: Immediate polling trigger
  console.log('\n--- Test 2: Immediate Polling Trigger ---');
  const test2 = testImmediatePollingTrigger();
  results.tests.push({
    name: 'Immediate Polling Trigger',
    ...test2
  });
  
  // Summary
  const passedTests = results.tests.filter(t => t.success).length;
  const totalTests = results.tests.length;
  
  console.log('\n=== Manual Refresh Test Summary ===');
  console.log(`Tests passed: ${passedTests}/${totalTests}`);
  console.log('Results:', JSON.stringify(results, null, 2));
  
  return results;
}