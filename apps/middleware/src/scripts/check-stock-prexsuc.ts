import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import readline from 'readline';

// Cargar .env soportando ejecucion directa desde dist/ o directorio raiz
const envCandidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env'),
  process.execPath ? path.resolve(path.dirname(process.execPath), '.env') : '',
  process.execPath ? path.resolve(path.dirname(process.execPath), '../.env') : '',
];

for (const candidate of envCandidates) {
  if (candidate && fs.existsSync(candidate)) {
    dotenv.config({ path: candidate, override: true });
    break;
  }
}

import { gescomPool } from '../db/gescom';
import { config } from '../config';

function toMarkdownTable(headers: string[], keys: string[], rows: any[]): string {
  if (!rows || rows.length === 0) return '_Sin registros encontrados o tabla vacía._\n\n';

  let md = '| ' + headers.join(' | ') + ' |\n';
  md += '| ' + headers.map(() => '---').join(' | ') + ' |\n';

  for (const row of rows) {
    const cells = keys.map((k) => {
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

async function checkStockPrexsuc() {
  const dbName = config.gescomDb.database;
  console.log('====================================================');
  console.log('CONSULTA DE TABLA: stock_prexsuc');
  console.log('====================================================');
  console.log(`Host: ${config.gescomDb.host}:${config.gescomDb.port}`);
  console.log(`Base de datos: ${dbName}`);
  console.log(`Usuario: ${config.gescomDb.user}\n`);

  let report = `# Reporte de Inspección: stock_prexsuc\n\n`;
  report += `Fecha: ${new Date().toLocaleString()}\n`;
  report += `- Host: \`${config.gescomDb.host}:${config.gescomDb.port}\`\n`;
  report += `- Base de Datos: \`${dbName}\`\n\n---\n\n`;

  try {
    // 1. Buscar coincidencia exacta (o insensible a mayúsculas/minúsculas)
    console.log('[1/3] Buscando la tabla "stock_prexsuc"...');
    const [exactMatch]: any = await gescomPool.query(
      `SELECT TABLE_NAME, ENGINE, TABLE_ROWS
       FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = ?
         AND LOWER(TABLE_NAME) = 'stock_prexsuc'`,
      [dbName]
    );

    let targetTableName: string | null = null;

    if (exactMatch && exactMatch.length > 0) {
      targetTableName = exactMatch[0].TABLE_NAME;
      console.log(`-> Tabla encontrada: "${targetTableName}" (${exactMatch[0].TABLE_ROWS || 0} filas estimadas)`);
      report += `## Tabla encontrada: \`${targetTableName}\`\n\n`;
      report += `- Motor: \`${exactMatch[0].ENGINE}\`\n`;
      report += `- Filas estimadas: \`${exactMatch[0].TABLE_ROWS}\`\n\n`;
    } else {
      console.log('-> No se encontro coincidencia exacta para "stock_prexsuc".');
      console.log('-> Buscando tablas similares en el catalogo...');

      const [similarTables]: any = await gescomPool.query(
        `SELECT TABLE_NAME, TABLE_ROWS
         FROM INFORMATION_SCHEMA.TABLES
         WHERE TABLE_SCHEMA = ?
           AND (
             LOWER(TABLE_NAME) LIKE '%prexsuc%'
             OR LOWER(TABLE_NAME) LIKE '%pre%suc%'
             OR LOWER(TABLE_NAME) LIKE '%stock%suc%'
             OR LOWER(TABLE_NAME) LIKE '%stock%pre%'
           )
         ORDER BY TABLE_NAME`,
        [dbName]
      );

      report += `## Resultado de busqueda: "stock_prexsuc" NO EXISTE con ese nombre exacto.\n\n`;

      if (similarTables && similarTables.length > 0) {
        console.log('\nTablas con nombres similares encontradas:');
        console.table(similarTables);

        report += `### Tablas con nombres similares encontradas:\n\n`;
        report += toMarkdownTable(['Tabla', 'Filas Estimadas'], ['TABLE_NAME', 'TABLE_ROWS'], similarTables);
      } else {
        console.log('-> No se encontraron tablas similares.');
        report += `_No se encontraron tablas con patron similar en la base de datos._\n\n`;
      }
    }

    // 2. Si la tabla fue encontrada, listar sus columnas
    if (targetTableName) {
      console.log(`\n[2/3] Obteniendo columnas de "${targetTableName}"...`);
      const [columns]: any = await gescomPool.query(
        `SELECT 
           ORDINAL_POSITION AS Pos,
           COLUMN_NAME AS Columna,
           COLUMN_TYPE AS Tipo,
           IS_NULLABLE AS Nulo,
           COLUMN_KEY AS Clave,
           IFNULL(COLUMN_DEFAULT, 'NULL') AS Defecto,
           COLUMN_COMMENT AS Comentario
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = ?
           AND TABLE_NAME = ?
         ORDER BY ORDINAL_POSITION`,
        [dbName, targetTableName]
      );

      console.log('\nColumnas de la tabla:');
      console.table(columns);

      report += `### Columnas de \`${targetTableName}\`\n\n`;
      report += toMarkdownTable(
        ['Pos', 'Columna', 'Tipo', 'Nulo', 'Clave', 'Defecto', 'Comentario'],
        ['Pos', 'Columna', 'Tipo', 'Nulo', 'Clave', 'Defecto', 'Comentario'],
        columns
      );

      // 3. Muestra de primeros 5 registros
      console.log(`\n[3/3] Consultando primeros 5 registros de muestra...`);
      try {
        const [sampleRows]: any = await gescomPool.query(
          `SELECT * FROM \`${targetTableName}\` LIMIT 5`
        );

        if (sampleRows && sampleRows.length > 0) {
          console.log('\nMuestra de datos:');
          console.table(sampleRows);

          report += `### Muestra de datos (primeros 5 registros)\n\n`;
          const keys = Object.keys(sampleRows[0]);
          report += toMarkdownTable(keys, keys, sampleRows);
        } else {
          console.log('-> La tabla se encuentra vacia (0 filas).');
          report += `_La tabla no contiene registros actualmente._\n\n`;
        }
      } catch (err: any) {
        console.error(`Error al obtener registros de muestra: ${err.message}`);
        report += `_Error al leer muestra de datos: ${err.message}_\n\n`;
      }
    }

    // Guardar reporte
    const outputPath = path.resolve(process.cwd(), 'stock_prexsuc_columnas.md');
    fs.writeFileSync(outputPath, report, 'utf-8');
    console.log(`\nReporte generado en: ${outputPath}`);

  } catch (error: any) {
    console.error('\nError durante la ejecucion:', error.message || error);
  } finally {
    try {
      await gescomPool.end();
    } catch (_) {}

    console.log('\n====================================================');
    console.log('Presiona ENTER para cerrar...');
    console.log('====================================================');

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

checkStockPrexsuc();
