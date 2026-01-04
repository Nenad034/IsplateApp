# IsplateApp - Sistem za upravljanje isplatama

Moderna aplikacija za upravljanje isplatama dobavljačima i hotelima sa naprednim mogućnostima analize i izvoza podataka.

## 🚀 Funkcionalnosti

### 💰 Upravljanje isplatama
- Kreiraj, uredi i briši isplate
- Prati status isplata (U čekanju, Završena, Neuspešna)
- Podrška za više valuta (USD, EUR, RSD)
- Automatsko logovanje svih akcija

### 🏢 Dobavljači
- Kompletan katalog dobavljača
- Čuvanje kontaktnih informacija i bankovnih računa
- Brza pretraga i filtriranje

### 🏨 Hoteli
- Upravljanje hotelima
- Prati broj soba i menadžere
- Povezivanje sa isplatama

### 👥 Korisnici
- Sistem uloga (Admin: 1, Editor: 2, Viewer: 3)
- Praćenje prijava korisnika

### 📊 Analitika
- Pregled statusa baze podataka
- Finansijski puls sa ključnim metrikama
- Brza analitika (prosečne uplate, valute)
- Statistike po dobavljačima, hotelima i metodama plaćanja

### 📥 Import/Izvoz
- Izvoz u JSON, Excel i PDF
- Učitavanje podataka iz JSON fajla
- Čuvanje podataka u lokalnoj memoriji pregledača

### 🎨 Teme
- Četiri GitHub-inspirisane teme:
  - **github-dark** - Tamna tema
  - **github-dark-dimmed** - Prigušena tamna tema
  - **github-dark-blue** - Plava tamna tema
  - **github-light** - Svetla tema

### 📱 Responsivni dizajn
- Mobilni pogled sa navigacijom kroz drawer
- Desktop pogled sa tri panela
- Prilagođeni hambager meni

## 🛠️ Tehnologije

- **Next.js 16.1.1** sa Turpackom
- **React 19** sa Client Components
- **TypeScript** za sigurnost tipova
- **Tailwind CSS** sa custom CSS varijablama
- **Lucide React** za ikone
- **jsPDF** za generisanje PDF-a
- **XLSX (SheetJS)** za Excel
- **LocalStorage** za perzistenciju podataka

## 📦 Instalacija

```bash
npm install
```

## ▶️ Pokretanje

```bash
npm run dev
```

Otvori [http://localhost:3000](http://localhost:3000) u pregledniku.

## 🧰 Lokalna baza i nalozi (dev)

- Inicijalizacija/seed lokalne SQLite baze: `npm run setup-db`
- Podrazumevani admin (posle setup-a): `admin@isplate.rs` / `admin123`
- Kreiranje korisnika: `npm run create-user` (koristi `EMAIL/PASSWORD/NAME/ROLE` env var)
- Reset lozinke: `npm run reset-password` (koristi `EMAIL/PASSWORD` env var)

## ☁️ Deploy (VPS/Cloud) 

Preporuka za ovaj projekat (zbog SQLite) je VPS/container (Docker), ne serverless.

1) Na serveru kloniraj repo i napravi `.env` (možeš krenuti od `.env.example`)
2) Pokreni:
  - `docker compose up -d --build`
3) Inicijalizuj bazu (prvi put):
  - `docker compose exec web npm run setup-db`

Napomena: SQLite fajl se čuva u folderu `./prisma` kroz volume mount, pa ostaje sačuvan kroz restarte.

## 📱 Struktura aplikacije

### Levi sidebar
- **Pregled baze** - Trenutne statistike
- **Brze akcije** - Prečice za česte akcije
- **Moduli** - Navigacija kroz sve sekcije
- **Poslednje aktivnosti** - Log aktivnosti

### Centralni deo
- Aktivna sekcija sa sadržajem
- Unos i upravljanje podacima
- Tabelarne prikaze sa akcijama

### Desni sidebar (desktop)
- **Finansijski puls** - Ključne metrike
- **Brza analitika** - Statističke informacije

## 🔐 Sigurnost

- Sistem kontrole pristupa po ulogama
- Logovanje svih akcija korisnika
- Čuvanje podataka u lokalnoj memoriji pregledača

## 📝 Napomene

- Svi podaci se čuvaju u `localStorage` pregledača
- Promenite temu kroz izbor u gornjem desnom uglu
- Korisnik može biti samo Admin, Editor ili Viewer
- Izvoz je dostupan za Admin i Editor

## 📄 Licenca

MIT

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
