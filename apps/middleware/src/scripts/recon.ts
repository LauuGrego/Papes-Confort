import { gescomPool } from '../db/gescom';
import { config } from '../config';
import fs from 'fs';
import path from 'path';

// Helper to format rows as Markdown Tables
function toMarkdownTable(headers: string[], keys: string[], rows: any[]): string {
  if (!rows || rows.length === 0) return '_Sin registros encontrados o tabla vacía._\n\n';
  
  let md = '| ' + headers.join(' | ') + ' |\n';
  md += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
  
  for (const row of rows) {
    const cells = keys.map(k => {
      const val = row[k];
      if (val === null || val === undefined) return '`NULL`';
      return String(val)
        .replace(/\r?\n/g, ' ') // Quitar saltos de línea dentro de celdas
        .replace(/\|/g, '\\|'); // Escapar pipes de Markdown
    });
    md += '| ' + cells.join(' | ') + ' |\n';
  }
  return md + '\n';
}

async function runRecon() {
  const dbName = config.gescomDb.database;
  console.log(`🚀 Iniciando Reconocimiento Simplificado en la BD: "${dbName}"`);
  console.log(`Conectándose a: ${config.gescomDb.host}:${config.gescomDb.port} con usuario "${config.gescomDb.user}"`);
  
  let report = `# Reporte Simplificado de Base de Datos - GesCom\n`;
  report += `Generado el: ${new Date().toLocaleString()}\n`;
  report += `- **Host:** \`${config.gescomDb.host}:${config.gescomDb.port}\`\n`;
  report += `- **Base de Datos:** \`${dbName}\`\n\n`;
  report += `---\n\n`;

  try {
    // 1. Obtener todas las tablas
    console.log('1. Recuperando listado de tablas...');
    const [tables]: any = await gescomPool.query(
      `SELECT TABLE_NAME
       FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
       ORDER BY TABLE_NAME`,
      [dbName]
    );

    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      console.log(`🔍 Procesando tabla: ${tableName}...`);
      
      report += `## Tabla: \`${tableName}\`\n\n`;

      // 2. Obtener columnas de esta tabla
      const [columns]: any = await gescomPool.query(
        `SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
         ORDER BY ORDINAL_POSITION`,
        [dbName, tableName]
      );

      report += `### Columnas\n`;
      report += toMarkdownTable(
        ['Columna', 'Tipo de Dato', 'Especificación', 'Acepta Nulo', 'Defecto'],
        ['COLUMN_NAME', 'DATA_TYPE', 'COLUMN_TYPE', 'IS_NULLABLE', 'COLUMN_DEFAULT'],
        columns
      );

      // 3. Obtener 5 datos de muestra de esta tabla
      try {
        const [sampleRows]: any = await gescomPool.query(
          `SELECT * FROM \`${tableName}\` LIMIT 5`
        );
        
        report += `### Muestra de datos (máximo 5 filas)\n`;
        if (sampleRows && sampleRows.length > 0) {
          const keys = Object.keys(sampleRows[0]);
          report += toMarkdownTable(keys, keys, sampleRows);
        } else {
          report += `_La tabla no contiene registros._\n\n`;
        }
      } catch (err: any) {
        report += `⚠️ _No se pudieron obtener datos de muestra: ${err.message}_\n\n`;
      }

      report += `---\n\n`;
    }

    // Escribir archivo de salida en la raíz del proyecto
    const outputPath = path.resolve(__dirname, '../../../../reporte_reconocimiento_gescom.md');
    fs.writeFileSync(outputPath, report, 'utf-8');
    
    console.log(`\n✨ ¡Proceso completado exitosamente!`);
    console.log(`📝 Se ha generado el reporte simplificado en:`);
    console.log(`👉 ${outputPath}\n`);

  } catch (error: any) {
    console.error('❌ Error durante el reconocimiento de base de datos:', error.message || error);
  } finally {
    await gescomPool.end();
  }
}

runRecon();
