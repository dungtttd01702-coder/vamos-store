const fs = require('fs');
const path = require('path');
const pug = require('pug');

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.pug')) {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

const viewsDir = path.join(__dirname, '../src/views');
const pugFiles = getAllFiles(viewsDir);

console.log(`[PUG VALIDATION] Checking ${pugFiles.length} Pug templates...`);
let errors = 0;

pugFiles.forEach(file => {
  try {
    pug.compileFile(file, { filename: file });
  } catch (err) {
    console.error(`✖ Error in ${path.relative(process.cwd(), file)}:`, err.message);
    errors++;
  }
});

if (errors > 0) {
  console.error(`[PUG VALIDATION FAILED]: ${errors} file(s) failed compilation.`);
  process.exit(1);
} else {
  console.log(`[PUG VALIDATION PASSED]: All ${pugFiles.length} templates compiled successfully with zero syntax errors.`);
  process.exit(0);
}
