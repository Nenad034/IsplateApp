import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

function getArg(name) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

const email = process.env.EMAIL || getArg('email');
const password = process.env.PASSWORD || getArg('password');

if (!email || !password) {
  console.error('Nedostaje EMAIL ili PASSWORD.');
  console.error('Primer (PowerShell):');
  console.error('  $env:EMAIL="nenad.tomic@olympic.rs"; $env:PASSWORD="..."; npm run reset-password');
  console.error('Primer (arg):');
  console.error('  npm run reset-password -- --email=nenad.tomic@olympic.rs --password=...');
  process.exit(1);
}

const dbPath = './prisma/dev.db';
let db;
try {
  db = new Database(dbPath);
} catch {
  console.error(`Ne mogu da otvorim bazu na ${dbPath}. Da li postoji fajl?`);
  process.exit(1);
}

try {
  const user = db.prepare('SELECT id, email, password FROM users WHERE email = ?').get(email);
  if (!user) {
    console.error('Korisnik sa ovim email-om ne postoji.');
    process.exit(1);
  }

  const hashed = bcrypt.hashSync(password, 10);
  const info = db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hashed, email);

  console.log('Lozinka je uspešno promenjena:');
  console.log(`- email: ${email}`);
  console.log(`- promenjeno zapisa: ${info.changes}`);
} catch (error) {
  console.error('Greška pri promeni lozinke:', error);
  process.exit(1);
} finally {
  try {
    db.close();
  } catch {
    // ignore
  }
}
