import { gescomPool } from '../db/gescom';

async function main() {
  try {
    console.log('Querying GesCom DB...');

    const [rows] = await gescomPool.query<any[]>(
      `SELECT sa.ACod, sa.ADes, sa.AValor, sa.AVenta, sa.AExis FROM Stock_Articulo sa LIMIT 20`
    );

    console.log('--- Sample Stock_Articulo rows ---');
    console.table(rows);

    const [diffRows] = await gescomPool.query<any[]>(
      `SELECT COUNT(*) as total, 
              SUM(CASE WHEN sa.AValor = sa.AVenta THEN 1 ELSE 0 END) as equals,
              SUM(CASE WHEN sa.AValor != sa.AVenta THEN 1 ELSE 0 END) as different,
              SUM(CASE WHEN sa.AValor IS NULL OR sa.AValor = 0 THEN 1 ELSE 0 END) as zeroOrNullValor
       FROM Stock_Articulo sa`
    );

    console.log('--- Comparison Statistics ---');
    console.log(diffRows[0]);

    const [diffSamples] = await gescomPool.query<any[]>(
      `SELECT sa.ACod, sa.ADes, sa.AValor, sa.AVenta FROM Stock_Articulo sa WHERE sa.AValor != sa.AVenta LIMIT 15`
    );

    console.log('--- Sample rows where AValor != AVenta ---');
    console.table(diffSamples);

    process.exit(0);
  } catch (err) {
    console.error('Error connecting to Gescom DB:', err);
    process.exit(1);
  }
}

main();
