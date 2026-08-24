import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import readline from 'readline';

// Cargar .env desde el directorio de trabajo actual (process.cwd()) o fallback
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: true });
} else {
  dotenv.config();
}

import { gescomPool } from '../db/gescom';
import { config } from '../config';

function toMarkdownTable(headers: string[], keys: string[], rows: any[]): string {
  if (!rows || rows.length === 0) return '_Sin registros encontrados o tabla vacía._\n\n';

  let md = '| ' + headers.join(' | ') + ' |\n';
  md += '| ' + headers.map(() => '---').join(' | ') + ' |\n';

  for (const row of rows) {
    const cells = keys.map(k => {
      const val = row[k];
      if (val === null || val === undefined) return '`NULL`';
      return String(val)
        .replace(/\r?\n/g, ' ')
        .replace(/\|/g, '\\|');
    });
    md += '| ' + cells.join(' | ') + ' |\n';
  }
  return md + '\n';
}

async function exploreListasNotas() {
  const dbName = config.gescomDb.database;
  console.log(`==================================================`);
  console.log(`🚀 Exploración de Listas y Notas - GesCom`);
  console.log(`==================================================`);
  console.log(`Conectando a BD: "${dbName}" en ${config.gescomDb.host}:${config.gescomDb.port} (Usuario: ${config.gescomDb.user})`);

  let report = `# Exploración de Listas y Notas - GesCom\n`;
  report += `Generado el: ${new Date().toLocaleString()}\n`;
  report += `- **Host:** \`${config.gescomDb.host}:${config.gescomDb.port}\`\n`;
  report += `- **Base de Datos:** \`${dbName}\`\n\n`;
  report += `---\n\n`;

  try {
    // 1. SELECT * FROM Ventas_Listas
    console.log('\n--- 1. Query: Ventas_Listas ---');
    const [listasRows]: any = await gescomPool.query('SELECT * FROM Ventas_Listas');
    console.log(`Filas encontradas: ${listasRows?.length || 0}`);
    console.log(listasRows);

    report += `## 1. Ventas_Listas\n\n`;
    if (listasRows && listasRows.length > 0) {
      const keys = Object.keys(listasRows[0]);
      report += toMarkdownTable(keys, keys, listasRows);
    } else {
      report += `_Sin registros._\n\n`;
    }

    // 2. SELECT * FROM Stock_ArtiNota LIMIT 10
    console.log('\n--- 2. Query: Stock_ArtiNota (LIMIT 10) ---');
    let notasRows: any = [];
    try {
      [notasRows] = await gescomPool.query('SELECT * FROM Stock_ArtiNota LIMIT 10');
      console.log(`Filas encontradas: ${notasRows?.length || 0}`);
      console.log(notasRows);
    } catch (err: any) {
      console.error(`⚠️ Error consultando Stock_ArtiNota:`, err.message);
    }

    report += `## 2. Stock_ArtiNota (LIMIT 10)\n\n`;
    if (notasRows && notasRows.length > 0) {
      const keys = Object.keys(notasRows[0]);
      report += toMarkdownTable(keys, keys, notasRows);
    } else {
      report += `_Sin registros o error al consultar._\n\n`;
    }

    // 3. Relación listas ↔ precios por artículo (LIMIT 20)
    console.log('\n--- 3. Query: Relación Listas ↔ Precios por Artículo (LIMIT 20) ---');
    let relRows: any = [];
    try {
      const query3 = `SELECT vl.LCod, vl.LDes, vl.LPor, vl.LCONTADO, vl2.ACod, vl2.LPRE, vl2.LPVENTA 
                      FROM Ventas_Listas vl 
                      LEFT JOIN ventas_lisperso vl2 ON vl.LCod = vl2.LCod 
                      LIMIT 20`;
      [relRows] = await gescomPool.query(query3);
      console.log(`Filas encontradas: ${relRows?.length || 0}`);
      console.log(relRows);
    } catch (err: any) {
      console.error(`⚠️ Error consultando relación listas/precios:`, err.message);
    }

    report += `## 3. Relación Listas ↔ Precios por Artículo (ventas_lisperso LIMIT 20)\n\n`;
    if (relRows && relRows.length > 0) {
      const keys = Object.keys(relRows[0]);
      report += toMarkdownTable(keys, keys, relRows);
    } else {
      report += `_Sin registros o error al consultar._\n\n`;
    }

    // Escribir el reporte Markdown en el directorio actual
    const outputPath = path.resolve(process.cwd(), 'exploracion_listas_notas.md');
    fs.writeFileSync(outputPath, report, 'utf-8');

    console.log(`\n✨ ¡Exploración completada exitosamente!`);
    console.log(`📝 Se ha generado el archivo de reporte en:\n👉 ${outputPath}\n`);

  } catch (error: any) {
    console.error('\n❌ Error durante la exploración:', error.message || error);
  } finally {
    try {
      await gescomPool.end();
    } catch (_) {}

    console.log('\n==================================================');
    console.log('📌 Presiona ENTER para cerrar esta ventana...');
    console.log('==================================================');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    await new Promise<void>((resolve) => {
      rl.question('', () => {
        rl.close();
        resolve();
      });
    });
  }
}

exploreListasNotas();
