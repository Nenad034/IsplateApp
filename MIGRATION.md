# Migracija na PostgreSQL - Uputstvo

## 📋 Pregled

Aplikacija je migrisana sa SQLite na PostgreSQL radi kompatibilnosti sa Vercel serverless platformom.

## 🎯 Koraci za deployment

### 1️⃣ Kreiranje Neon PostgreSQL baze

1. Idite na [Neon.tech](https://neon.tech) i kreirajte besplatan nalog
2. Kreirajte novi projekat
3. Kopirajte **Connection String** (DATABASE_URL)
   - Format: `postgresql://username:password@hostname/database?sslmode=require`

### 2️⃣ Konfiguracija lokalnog okruženja

1. Kreirajte `.env` fajl u root direktorijumu:
```bash
DATABASE_URL=postgresql://username:password@hostname/database
JWT_SECRET=your-super-secret-jwt-key-here
```

2. Inicijalizujte bazu podataka:
```bash
node scripts/setup-db.mjs
```

Ova skripta će:
- Kreirati sve tabele (suppliers, hotels, payments, users, activity_logs)
- Dodati admin korisnika: `admin@isplate.rs` / `admin123`

### 3️⃣ Testiranje lokalno

```bash
npm run dev
```

Pristupite aplikaciji na: http://localhost:3000

### 4️⃣ Vercel Deployment

1. Instalirajte Vercel CLI (ako već nemate):
```bash
npm i -g vercel
```

2. Loginujte se u Vercel:
```bash
vercel login
```

3. Dodajte environment variable u Vercel:
```bash
vercel env add DATABASE_URL
```
Zalepite svoj Neon connection string kada vas upita.

4. Deploy na Vercel:
```bash
vercel --prod
```

### 5️⃣ Kreiranje vašeg admin naloga

Nakon što baza radi na Vercel, možete kreirati svoj admin nalog koristeći Neon SQL Editor:

1. Idite na Neon konzolu → Tables → users
2. Pokrenite SQL:
```sql
-- Hash za password 'milica1403#' (zamenite sa svojim)
INSERT INTO users (id, name, email, password, role)
VALUES (
  'nenad-admin',
  'Nenad Tomic',
  'nenad.tomic@olympic.rs',
  '$2a$10$YOUR_BCRYPT_HASH_HERE',
  1
);
```

**Generisanje bcrypt hash-a:**
```bash
node -e "console.log(require('bcryptjs').hashSync('milica1403#', 10))"
```

## 🔄 Izmene u kodu

### Fajlovi koji su izmenjeni:

1. **package.json**
   - ✅ Dodato: `@neondatabase/serverless`, `dotenv`
   - ❌ Uklonjeno: `better-sqlite3`

2. **src/lib/db.ts**
   - SQLite tipovi → PostgreSQL tipovi
   - `sqliteTable` → `pgTable`
   - `integer` timestamps → `timestamp`
   - `real` → `numeric`
   - `text` IDs → `varchar(255)`

3. **src/lib/drizzle.ts**
   - Zamenjen `better-sqlite3` sa `@neondatabase/serverless`
   - Koristi `DATABASE_URL` env varijablu

4. **scripts/setup-db.mjs**
   - Prepravljeno za PostgreSQL sintaksu
   - Koristi Neon HTTP client
   - Kreira sve tabele i admin korisnika

## ✅ Verifikacija

Proverite da li radi:
1. Pristupite deployed aplikaciji
2. Ulogujte se sa `admin@isplate.rs` / `admin123` (ili sa svojim nalогом)
3. Proverite da li se podaci učitavaju
4. Testirajte dodavanje novog dobavljača/hotela

## 🚨 Troubleshooting

### Problem: "DATABASE_URL environment variable is not set"
**Rešenje:** Dodajte DATABASE_URL u Vercel environment variables ili lokalni .env fajl

### Problem: "Connect ECONNREFUSED"
**Rešenje:** Proverite da li je Neon connection string ispravan i da sadrži `?sslmode=require`

### Problem: "relation does not exist"
**Rešenje:** Pokrenite `node scripts/setup-db.mjs` ponovo da kreirate tabele

### Problem: "Invalid login credentials"
**Rešenje:** Proverite da li je admin korisnik kreiran u bazi koristeći Neon SQL Editor

## 📞 Kontakt

Za pitanja ili pomoć, kontaktirajte tim za podršku.
