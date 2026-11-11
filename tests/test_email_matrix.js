const validator = require('../src/utils/validator');

const htmlPattern = /^\s*[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\s*$/;

const testInputs = [
  '123@gmail',
  '123@gmail.com',
  'abc',
  'abc@',
  'abc@gmail.com',
  ' abc@gmail.com ',
  'ABC@GMAIL.COM',
  'Abc.Def@Domain.Vn',
  'invalid..dot@domain.com',
];

console.log('=== DETAILED EMAIL VALIDATION MATRIX ===');
console.log(
  '| Input | Raw isValidEmail | Normalized (trim + lower) | Normalized isValidEmail | HTML5 Pattern Match (raw) | Can Login/Register? |'
);
console.log(
  '|---|---|---|---|---|---|'
);

testInputs.forEach((input) => {
  const rawValid = validator.isValidEmail(input);
  const normalized = typeof input === 'string' ? input.trim().toLowerCase() : input;
  const normalizedValid = validator.isValidEmail(normalized);
  const htmlMatch = typeof input === 'string' ? htmlPattern.test(input) : false;
  const canProceed = normalizedValid;

  console.log(
    `| \`${input}\` | ${rawValid ? 'PASS (Valid)' : 'REJECT (Invalid)'} | \`${normalized}\` | ${normalizedValid ? 'PASS (Valid)' : 'REJECT (Invalid)'} | ${htmlMatch ? 'MATCH' : 'BLOCKED'} | **${canProceed ? 'CHO PHÉP' : 'CHẶN ĐỨNG'}** |`
  );
});

