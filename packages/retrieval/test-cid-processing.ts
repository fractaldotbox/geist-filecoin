/**
 * Simple test to verify CID processing functionality
 * This can be run in a test environment to verify the implementation
 */

import { processCid, getFilePaths } from '../app/services/cid-processor';
import { CID } from 'multiformats/cid';

// Example CIDs for testing (replace with actual CIDs)
const TEST_FILE_CID = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'; // Example file CID
const TEST_DIR_CID = 'QmS4ustL54uo8FzR9455qaxZwuMiUhyvMcX9Ba8nUH4uVv'; // Example directory CID

async function testFileCID() {
  try {
    console.log('Testing file CID...');
    const cid = CID.parse(TEST_FILE_CID);
    const result = await processCid(cid);
    
    if (result.type === 'file' || result.type === 'raw') {
      console.log(`✅ File CID processed successfully`);
      console.log(`   Type: ${result.type}`);
      console.log(`   Size: ${result.size} bytes`);
      console.log(`   Content length: ${result.content.length}`);
    } else {
      console.log(`❌ Expected file/raw, got ${result.type}`);
    }
  } catch (error) {
    console.log(`❌ Error processing file CID: ${error}`);
  }
}

async function testDirectoryCID() {
  try {
    console.log('Testing directory CID...');
    const cid = CID.parse(TEST_DIR_CID);
    const result = await processCid(cid);
    
    if (result.type === 'directory') {
      console.log(`✅ Directory CID processed successfully`);
      console.log(`   Total files: ${result.files.length}`);
      console.log(`   Total size: ${result.totalSize} bytes`);
      
      // List first few files
      result.files.slice(0, 5).forEach(file => {
        console.log(`   - ${file.name} (${file.type}, ${file.size} bytes)`);
      });
      
      // Test file path listing
      const paths = await getFilePaths(cid);
      console.log(`   File paths (${paths.length} total):`);
      paths.slice(0, 3).forEach(path => {
        console.log(`     ${path}`);
      });
      
    } else {
      console.log(`❌ Expected directory, got ${result.type}`);
    }
  } catch (error) {
    console.log(`❌ Error processing directory CID: ${error}`);
  }
}

async function runTests() {
  console.log('🧪 Testing CID Processing Functionality\n');
  
  await testFileCID();
  console.log('');
  await testDirectoryCID();
  
  console.log('\n✨ Tests completed');
}

// Export for use in other test files
export { runTests, testFileCID, testDirectoryCID };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}
