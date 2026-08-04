const fs = require('fs');
const readline = require('readline');
const path = require('path');

const fileStream = fs.createReadStream(path.join(__dirname, '../archivos_info/resultado.txt'), 'utf8');

const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

const matchingTables = new Set();
const columnMatches = [];

rl.on('line', (line) => {
  const parts = line.split('\t');
  if (parts.length >= 2) {
    const tableName = parts[0].toLowerCase();
    const columnName = parts[1].toLowerCase();
    if (tableName.includes('rub') || tableName.includes('sub') || columnName.includes('rub') || columnName.includes('sub')) {
      matchingTables.add(parts[0]);
      columnMatches.push(line);
    }
  }
});

rl.on('close', () => {
  console.log('--- Matching Tables ---');
  console.log([...matchingTables]);
  console.log('\n--- First 30 Column Matches ---');
  console.log(columnMatches.slice(0, 30).join('\n'));
});
