import { gescomPool } from '../db/gescom';

async function main() {
  try {
    const [descStockArt] = await gescomPool.query('DESCRIBE Stock_Articulo');
    console.log('Stock_Articulo columns count:', (descStockArt as any).length);

    try {
      const [descWeblive] = await gescomPool.query('DESCRIBE weblive_artipres');
      console.log('weblive_artipres columns:', (descWeblive as any).map((c: any) => c.Field));
      
      const [rowsWeblive] = await gescomPool.query('SELECT * FROM weblive_artipres LIMIT 5');
      console.log('weblive_artipres rows:', rowsWeblive);
    } catch (e: any) {
      console.log('Error querying weblive_artipres:', e.message);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await gescomPool.end();
  }
}

main();
