/**
 * Simple test to verify log entry behavior
 * Run this in the Apps Script console to test the current behavior
 */

function testLogEntryBehavior() {
  console.log('=== Testing Log Entry Behavior ===');
  
  try {
    // Test student name (use a real student name from your roster)
    const testStudent = 'TestStudent'; // Replace with actual student name
    const testGender = 'G';
    const testTeacher = 'Mr. Test';
    const testId = '12345';
    
    console.log(`Testing with student: ${testStudent}`);
    
    // Step 1: Check current log state
    console.log('\n--- Step 1: Check current log state ---');
    const debugResult1 = api_debugStudentLogEntries(testStudent);
    console.log('Initial state:', debugResult1);
    
    // Step 2: Test marking student OUT
    console.log('\n--- Step 2: Mark student OUT ---');
    const outResult = api_updateStudentStatusOptimized(testStudent, 'out', testTeacher, testGender);
    console.log('Out result:', outResult);
    
    // Check log state after OUT
    const debugResult2 = api_debugStudentLogEntries(testStudent);
    console.log('After OUT:', debugResult2);
    
    // Step 3: Test marking student BACK
    console.log('\n--- Step 3: Mark student BACK ---');
    const backResult = api_updateStudentStatusOptimized(testStudent, 'back', testTeacher, testGender);
    console.log('Back result:', backResult);
    
    // Check final log state
    const debugResult3 = api_debugStudentLogEntries(testStudent);
    console.log('After BACK:', debugResult3);
    
    // Step 4: Check current status
    console.log('\n--- Step 4: Check current status ---');
    const currentStatus = _getCurrentRestroomStatus();
    const studentStatus = currentStatus[testStudent];
    console.log(`Current status for ${testStudent}:`, studentStatus);
    
    // Summary
    console.log('\n--- SUMMARY ---');
    const finalAnalysis = debugResult3.analysis;
    console.log(`Total entries: ${finalAnalysis.totalEntries}`);
    console.log(`Complete entries (out+back): ${finalAnalysis.completeEntries}`);
    console.log(`Out-only entries: ${finalAnalysis.outEntries}`);
    console.log(`Back-only entries: ${finalAnalysis.backEntries}`);
    
    if (finalAnalysis.completeEntries > 0) {
      console.log('✅ SUCCESS: Student has complete entry (should show ALREADY WENT)');
    } else if (finalAnalysis.outEntries > 0 && finalAnalysis.backEntries > 0) {
      console.log('⚠️ ISSUE: Student has separate out and back entries');
    } else {
      console.log('❓ UNCLEAR: Unexpected entry pattern');
    }
    
    return {
      success: true,
      testStudent: testStudent,
      finalAnalysis: finalAnalysis,
      studentStatus: studentStatus
    };
    
  } catch (error) {
    console.error('Test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Quick test to check a specific student's current status
 */
function quickStatusCheck(studentName) {
  console.log(`=== Quick Status Check for ${studentName} ===`);
  
  try {
    // Check log entries
    const logDebug = api_debugStudentLogEntries(studentName);
    console.log('Log analysis:', logDebug);
    
    // Check current status
    const currentStatus = _getCurrentRestroomStatus();
    const studentStatus = currentStatus[studentName];
    console.log('Current status:', studentStatus);
    
    // Check what the frontend would see
    let frontendStatus = 'AVAILABLE';
    if (studentStatus) {
      if (studentStatus.outTime && !studentStatus.backTime) {
        frontendStatus = 'CURRENTLY OUT';
      } else if (studentStatus.holdNotice) {
        frontendStatus = 'WAITING';
      }
    } else {
      // Check if they completed a cycle today
      if (logDebug.success && logDebug.analysis.completeEntries > 0) {
        frontendStatus = 'ALREADY WENT';
      }
    }
    
    console.log(`Frontend should show: ${frontendStatus}`);
    
    return {
      success: true,
      studentName: studentName,
      logAnalysis: logDebug.analysis,
      currentStatus: studentStatus,
      frontendStatus: frontendStatus
    };
    
  } catch (error) {
    console.error('Quick status check failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test the gender checking logic
 */
function testGenderLogic() {
  console.log('=== Testing Gender Logic ===');
  
  try {
    const genderTest = api_testGenderChecking();
    console.log('Gender test result:', genderTest);
    
    return genderTest;
    
  } catch (error) {
    console.error('Gender logic test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}