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

// 15. Cart Qty: 1 (valid boundary)
assertTest(validator.validateCartQuantity(1).valid === true && validator.validateCartQuantity(1).quantity === 1, 'VAL-QTY-01', 'Accept valid minimum quantity 1');

// 16. Cart Qty: 10 (valid boundary)
assertTest(validator.validateCartQuantity(10).valid === true && validator.validateCartQuantity(10).quantity === 10, 'VAL-QTY-02', 'Accept valid maximum retail quantity 10');

// 17. Cart Qty: 0 (invalid)
assertTest(!validator.validateCartQuantity(0).valid, 'VAL-QTY-03', 'Reject zero quantity (0)');

// 18. Cart Qty: 11 (invalid, exceeds retail cap)
assertTest(!validator.validateCartQuantity(11).valid && validator.validateCartQuantity(11).message.includes('1900 2126'), 'VAL-QTY-04', 'Reject quantity 11 with wholesale notice');

// 19. Cart Qty: -1 (invalid negative)
assertTest(!validator.validateCartQuantity(-1).valid, 'VAL-QTY-05', 'Reject negative quantity (-1)');

// 20. Cart Qty: -10 (invalid negative)
assertTest(!validator.validateCartQuantity(-10).valid, 'VAL-QTY-06', 'Reject negative quantity (-10)');

// 21. Cart Qty: 1.5 (invalid decimal)
assertTest(!validator.validateCartQuantity('1.5').valid, 'VAL-QTY-07', 'Reject decimal quantity ("1.5")');

// 22. Cart Qty: 3.5 (invalid decimal)
assertTest(!validator.validateCartQuantity('3.5').valid, 'VAL-QTY-08', 'Reject decimal quantity ("3.5")');

// 23. Cart Qty: '1e1' (invalid scientific notation)
assertTest(!validator.validateCartQuantity('1e1').valid, 'VAL-QTY-09', 'Reject scientific notation ("1e1")');

// 24. Cart Qty: '1e2' (invalid scientific notation)
assertTest(!validator.validateCartQuantity('1e2').valid, 'VAL-QTY-10', 'Reject scientific notation ("1e2")');

// 25. Cart Qty: 'abc' (invalid non-numeric)
assertTest(!validator.validateCartQuantity('abc').valid, 'VAL-QTY-11', 'Reject non-numeric string ("abc")');

// 26. Cart Qty: '' (invalid empty)
assertTest(!validator.validateCartQuantity('').valid, 'VAL-QTY-12', 'Reject empty string quantity ("")');

// 27. Cart Qty: '   ' (invalid whitespace)
assertTest(!validator.validateCartQuantity('   ').valid, 'VAL-QTY-13', 'Reject whitespace string quantity ("   ")');

// 28. Cart Qty: 99 (invalid wholesale)
assertTest(!validator.validateCartQuantity(99).valid && validator.validateCartQuantity(99).message.includes('99 đôi'), 'VAL-QTY-14', 'Reject wholesale quantity (99) with prompt wholesale notice');

// 29. Cart Qty: 999999 (invalid huge)
assertTest(!validator.validateCartQuantity(999999).valid, 'VAL-QTY-15', 'Reject huge wholesale quantity (999999)');

console.log('===============================================================');
console.log(`   VALIDATOR TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
console.log('===============================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

