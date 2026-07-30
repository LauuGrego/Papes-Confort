import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function runBackup() {
  console.log('Starting database backup from primary (Supabase) to backup (Railway)...');
  
  const primaryUrl = process.env.DATABASE_URL;
  const backupUrl = process.env.BACKUP_DATABASE_URL;
  
  if (!primaryUrl) {
    console.error('Error: DATABASE_URL (Primary DB) is not defined.');
    process.exit(1);
  }
  
  if (!backupUrl) {
    console.error('Error: BACKUP_DATABASE_URL (Backup DB) is not defined.');
    process.exit(1);
  }
  
  try {
    console.log('  Cleaning backup database public schema...');
    const cleanCmd = `psql "${backupUrl}" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"`;
    await execPromise(cleanCmd);
    
    console.log('  Exporting from primary and restoring to backup database...');
    // pg_dump the primary database and pipe it directly to psql for the backup database
    const restoreCmd = `pg_dump "${primaryUrl}" | psql "${backupUrl}"`;
    const { stdout, stderr } = await execPromise(restoreCmd);
    
    if (stdout) console.log(`  stdout: ${stdout}`);
    // pg_dump/psql can print warnings/notices to stderr which are not actual errors
    if (stderr) console.warn(`  stderr details:\n${stderr}`);
    
    console.log('Database backup completed successfully!');
  } catch (error: any) {
    console.error('Critical error during database backup:', error.message || error);
    process.exit(1);
  }
}

runBackup();
