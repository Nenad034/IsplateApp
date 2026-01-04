import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

function getArg(name) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

const email = process.env.EMAIL || getArg('email');
const password = process.env.PASSWORD || getArg('password');
const name = process.env.NAME || getArg('name') || 'Korisnik';
const roleRaw = process.env.ROLE || getArg('role') || '3';
const role = Number(roleRaw);

if (!email || !password) {
  console.error('Nedostaje EMAIL ili PASSWORD.');
  console.error('Primer (PowerShell):');
  console.error(
    '  $env:EMAIL="nenad.tomic@olympic.rs"; $env:PASSWORD="..."; $env:NAME="Nenad"; $env:ROLE="2"; npm run create-user'
  );
  console.error('Primer (arg):');
  console.error('  npm run create-user -- --email=nenad.tomic@olympic.rs --password=... --name="Nenad" --role=2');
  process.exit(1);
}

if (!Number.isInteger(role) || role < 1 || role > 3) {
  console.error('ROLE mora biti 1 (Admin), 2 (Editor) ili 3 (Viewer).');
  process.exit(1);
}

const dbPath = './prisma/dev.db';
let db;
try {
  db = new Database(dbPath);
} catch {
  console.error(`Ne mogu da otvorim bazu na ${dbPath}. Da li postoji fajl?`);
  console.error('Ako ne postoji, prvo inicijalizujte bazu: npm run setup-db');
  process.exit(1);
}

try {
  const existing = db.prepare('SELECT id, email FROM users WHERE email = ?').get(email);
  if (existing) {
    console.error('Korisnik sa ovim email-om već postoji.');
    console.error('Ako želite da promenite lozinku, koristite: npm run reset-password');
    process.exit(1);
  }

  const id = String(Date.now());
  const hashed = bcrypt.hashSync(password, 10);

  const stmt = db.prepare(
    "INSERT INTO users (id, name, email, password, role, last_login, created_at) VALUES (?, ?, ?, ?, ?, (CAST(strftime('%s','now') AS INTEGER) * 1000), (CAST(strftime('%s','now') AS INTEGER) * 1000))"
  );
  stmt.run(id, name, email, hashed, role);

  console.log('Korisnik je kreiran uspešno:');
  console.log(`- email: ${email}`);
  console.log(`- role: ${role}`);
} catch (error) {
  console.error('Greška pri kreiranju korisnika:', error);
  process.exit(1);
} finally {
  try {
    db.close();
  } catch {
    // ignore
  }
}
