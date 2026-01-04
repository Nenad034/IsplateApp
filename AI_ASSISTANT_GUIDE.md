# AI Asistent za Isplate - Vodič

## Pregled

AI Asistent je inteligentni pomoćnik koji vam pomaže da brzo dobijete informacije o isplatama, dobavljačima i hotelima.

## Osnovne Funkcije

### 1. Plutajuća Ikonica
- **Lokacija**: Uvek vidljiva u donjem desnom uglu ekrana
- **Indikator**: Zelena tačka pokazuje da je AI aktivan
- **Klik**: Otvara chat prozor sa AI asistentom

### 2. Chat Prozor - Drag & Resize
- **Premestanje**: Kliknite i prevucite header da premestite prozor bilo gde na ekranu
- **Proširivanje**: Povucite bilo koji ivicu ili ugao da promenite veličinu
- **Minimalna veličina**: 350px × 400px
- **Maksimalna veličina**: 90% ekrana

### 3. Postavljanje Pitanja

AI asistent može odgovoriti na razna pitanja:

#### Pitanja o Isplatama:
- "Koliko je ukupno isplata?"
- "Koje isplate su na čekanju?"
- "Koliko je isplaćeno?"
- "Isplate danas?"
- "Isplate ovog meseca?"

#### Pitanja o Dobavljačima:
- "Koliko imam dobavljača?"
- "Informacije o [naziv dobavljača]?"

#### Pitanja o Hotelima:
- "Koliko imam hotela?"
- "Informacije o [naziv hotela]?"

#### Pitanja o Valutama:
- "Isplate po valutama?"

## AI Obučavanje (Admin)

### Pristup
Podesavanja → AI Obuka Tab (samo za administratore)

### Dodavanje Novog Znanja

1. Unesite **Pitanje** koje korisnici mogu postaviti
2. Unesite **Odgovor** koji AI treba da vrati
3. Kliknite **Dodaj**

**Primer:**
- Pitanje: "Koji je najvažniji dobavljač?"
- Odgovor: "Najvažniji dobavljač je ABC Company sa 15 isplata"

### Import/Export Trening Podataka

#### Export Formati:
- **JSON** - Za backup i deljenje podataka
- **Excel** - Za lakše uređivanje u Excel-u
- **XML** - Za integraciju sa drugim sistemima
- **PDF** - Za dokumentaciju (u planu)

#### Import:
- Podržani formati: JSON, Excel (XLSX/XLS), XML
- Kliknite "Import podatke" i izaberite fajl
- Sistem će automatski učitati sve podatke

### Upravljanje Podacima

- **Pregled**: Vidite sve obučene podatke sa pitanjima i odgovorima
- **Brisanje**: Kliknite ikonu korpe pored podatka koji želite obrisati
- **Broj podataka**: Prikazan u zaglavlju liste

## Saveti za Najbolje Rezultate

1. **Budite Jasni**: Postavljajte direktna pitanja
2. **Koristite Ključne Reči**: npr. "ukupno", "isplate", "dobavljač", "danas"
3. **Obučite AI**: Dodajte često postavljana pitanja u AI Obuku
4. **Ažurirajte Redovno**: Dodajte nove podatke kako se biznis menja

## Primeri Uspešnih Pitanja

✅ "Koliko je ukupno isplata?"
✅ "Isplate na čekanju ovog meseca?"
✅ "Koliko hotela imam u bazi?"
✅ "Prikaži isplate po valutama"

❌ "Šta mi radiš?" (previše nejasno)
❌ "Sve" (nedovoljno specifično)

## Tehnički Detalji

- **Jezik**: TypeScript/React
- **Skladištenje**: LocalStorage za trening podatke
- **Processing**: Lokalna obrada upita (bez eksternih API-ja)
- **Real-time**: Instant odgovori na osnovu trenutnih podataka

## Buduće Funkcionalnosti

- 🚀 Integracija sa OpenAI GPT
- 📊 Vizuelni grafici u odgovorima
- 🔔 Proaktivna obaveštenja
- 📱 Mobilna optimizacija
- 🌐 Višejezična podrška

---

**Napomena**: AI asistent koristi podatke iz vaše baze i obučene informacije. Tačnost odgovora zavisi od kvaliteta podataka i obučavanja.
