const validator = require('../src/utils/validator');

console.log('===============================================================');
console.log('   VAMOS STORE - DEDICATED VALIDATOR UNIT TEST SUITE');
console.log('===============================================================');

let passCount = 0;
let failCount = 0;

function assertTest(condition, testId, description) {
  if (condition) {
    passCount++;
    console.log(`  ✔ [PASS] ${testId}: ${description}`);
  } else {
    failCount++;
    console.error(`  ✖ [FAIL] ${testId}: ${description}`);
  }
}

// 1. Email: 123@gmail (missing TLD)
assertTest(!validator.isValidEmail('123@gmail'), 'VAL-UNIT-01', 'Reject malformed email "123@gmail" (missing domain extension)');

// 2. Email: 123@gmail.com (valid numeric user with valid domain)
assertTest(validator.isValidEmail('123@gmail.com'), 'VAL-UNIT-02', 'Accept valid email with numeric username "123@gmail.com"');

// 3. Email: abc (no @, no domain)
assertTest(!validator.isValidEmail('abc'), 'VAL-UNIT-03', 'Reject non-email string "abc"');

// 4. Email: abc@ (trailing @ with no domain)
assertTest(!validator.isValidEmail('abc@'), 'VAL-UNIT-04', 'Reject trailing @ "abc@"');

// 5. Email: abc@gmail.com (standard valid email)
assertTest(validator.isValidEmail('abc@gmail.com'), 'VAL-UNIT-05', 'Accept standard valid email "abc@gmail.com"');

// 6. Email with leading/trailing spaces: ' abc@gmail.com '
assertTest(validator.isValidEmail(' abc@gmail.com '), 'VAL-UNIT-06', 'Accept valid email with spaces after internal trimming " abc@gmail.com "');

// 7. Email uppercase: 'ABC@GMAIL.COM'
assertTest(validator.isValidEmail('ABC@GMAIL.COM'), 'VAL-UNIT-07', 'Accept uppercase email "ABC@GMAIL.COM"');

// 8. Email mixed-case: 'Abc.Def@Vamos.Vn'
assertTest(validator.isValidEmail('Abc.Def@Vamos.Vn'), 'VAL-UNIT-08', 'Accept mixed-case email "Abc.Def@Vamos.Vn"');

// 9. Phone: 0901234567 (valid 10-digit VN mobile)
assertTest(validator.isValidPhone('0901234567'), 'VAL-UNIT-09', 'Accept valid VN mobile "0901234567"');

// 10. Phone: 123456 (too short)
assertTest(!validator.isValidPhone('123456'), 'VAL-UNIT-10', 'Reject short phone number "123456"');

// 11. Password: length 5 (too short)
assertTest(!validator.isValidPassword('12345'), 'VAL-UNIT-11', 'Reject password under 6 chars "12345"');

// 12. Password: length 6 (valid)
assertTest(validator.isValidPassword('123456'), 'VAL-UNIT-12', 'Accept 6-char password "123456"');

// 13. Full name: 1 char (too short)
assertTest(!validator.isValidFullName('A'), 'VAL-UNIT-13', 'Reject 1-character name "A"');

// 14. Full name: valid
assertTest(validator.isValidFullName('Trần Trung Dũng'), 'VAL-UNIT-14', 'Accept valid full name "Trần Trung Dũng"');

console.log('===============================================================');
console.log(`   VALIDATOR TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
console.log('===============================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

