const assert = require('node:assert');

function utc(isoString) {
  return new Date(isoString);
}

function createSuiteRunner(bannerTitle) {
  console.log(`\n=============================================================`);
  console.log(`  ${bannerTitle}`);
  console.log(`=============================================================\n`);

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  PASS ${name}`);
      passed++;
    } catch (err) {
      console.error(`  FAIL ${name}`);
      console.error(`       -> ${err.message}`);
      failed++;
    }
  }

  async function asyncTest(name, fn) {
    try {
      await fn();
      console.log(`  PASS ${name}`);
      passed++;
    } catch (err) {
      console.error(`  FAIL ${name}`);
      console.error(`       -> ${err.message}`);
      failed++;
    }
  }

  function assertSummary() {
    console.log(`\n-------------------------------------------------------------`);
    console.log(`  Summary: ${passed} passed, ${failed} failed`);
    console.log(`-------------------------------------------------------------\n`);
    assert.strictEqual(failed, 0, `${failed} test(s) failed in ${bannerTitle}`);
    return { passed, failed };
  }

  return { test, asyncTest, assertSummary };
}

module.exports = {
  utc,
  createSuiteRunner
};
