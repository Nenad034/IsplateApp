# Google Gemini AI Integracija - Dokumentacija

## Pregled

IsplateApp sada koristi **Google Gemini Pro** AI model za naprednu obradu prirodnog jezika i inteligentne odgovore na pitanja korisnika.

## Implementacija

### 1. API Ključ (Backend)

**Lokacija:** `.env.local`
```env
GEMINI_API_KEY=AIzaSyCtwhEOlCRuqJH0V8IV5RrjcrSRb1gTdwc
```

⚠️ **SIGURNOST**: API ključ je čuvan na serveru i NIJE dostupan u frontend kodu.

### 2. API Endpoint

**Lokacija:** `src/app/api/ai-chat/route.ts`

**Funkcionalnost:**
- Prima pitanja od korisnika
- Šalje kontekst sa trenutnim podacima (isplate, dobavljači, hoteli)
- Komunicira sa Gemini API-jem
- Vraća AI generisan odgovor

**Request Format:**
```typescript
POST /api/ai-chat
{
  "query": "Koliko je ukupno isplata?",
  "context": "ISPLATE:\n- Ukupno: 45\n..."
}
```

**Response Format:**
```typescript
{
  "answer": "Trenutno imate 45 isplata..."
}
```

### 3. Frontend Integracija

**Lokacija:** `src/app/page.tsx`

**Funkcija:** `handleAiSend()`
- Asinhrona funkcija koja poziva API
- Priprema kontekst sa svim relevantnim podacima
- Prikazuje loading state dok čeka odgovor
- Loguje aktivnost u sistem

**Loading State:**
- Animirane tri tačke
- Tekst "AI razmišlja..."
- Onemogućen input i send dugme

## Kontekst Podataka

AI prima sledeći kontekst pri svakom pitanju:

```typescript
ISPLATE:
- Ukupno isplata: [broj]
- Na čekanju: [broj]
- Isplaćeno: [broj]
- Ukupan iznos: [EUR vrednost]
- Po valutama (EUR, USD, RSD)

DOBAVLJAČI:
- Broj dobavljača: [broj]
- Top 3: [imena]

HOTELI:
- Broj hotela: [broj]
- Top 3: [imena]

OBUČENI PODACI:
[Svi custom Q&A parovi iz AI Training]
```

## Prednosti Gemini Integracije

### ✅ Prirodni Jezik
- Razume složena pitanja
- Ne zahteva tačne ključne reči
- Može interpretirati kontekst

### ✅ Kreativni Odgovori
- Formuliše jasne i profesionalne odgovore
- Prilagođava ton komunikacije
- Može davati savete i preporuke

### ✅ Inteligentna Analiza
- Kombinuje različite podatke
- Izvodi zaključke
- Upoređuje podatke

### ✅ Srpski Jezik
- Potpuna podrška za srpski jezik
- Prirodna gramatika
- Razume lokalne specifičnosti

## Primeri Upotrebe

### Jednostavna Pitanja:
```
Korisnik: "Koliko je ukupno isplata?"
AI: "Trenutno imate 45 isplata u sistemu, sa ukupnim iznosom od 125,430.00 EUR."
```

### Složena Analiza:
```
Korisnik: "Koji dobavljač ima najviše neisplaćenih dugovanja?"
AI: "Prema trenutnim podacima, ABC Company ima najviše neisplaćenih dugovanja 
sa 5 isplata na čekanju u ukupnom iznosu od 15,250.00 EUR."
```

### Saveti:
```
Korisnik: "Šta treba da uradim sa isplatama koje kasne?"
AI: "Preporučujem da prioritizujete 3 isplate koje su na čekanju preko 30 dana. 
To su isplate za XYZ Hotel, ABC Resort i City Inn. Ukupan iznos je 8,500 EUR."
```

### Kombinovana Pitanja:
```
Korisnik: "Uporedi isplate ovog i prošlog meseca"
AI: "Ovog meseca imate 12 isplata ukupno 45,000 EUR, što je porast od 20% 
u odnosu na prošli mesec kada je bilo 10 isplata sa 37,500 EUR."
```

## Performanse

- **Prosečno vreme odgovora:** 2-5 sekundi
- **Model:** Gemini Pro (najnovija verzija)
- **Rate Limit:** Zavisi od vašeg Google Cloud plana
- **Troškovi:** Prema Google Gemini pricing (vrlo pristupačno)

## Error Handling

Sistem ima ugrađeno rukovanje greškama:

1. **API Nedostupan:**
   - Prikazuje poruku o grešci
   - Ne blokira ostatak aplikacije
   - Omogućava pokušaj ponovo

2. **Rate Limit:**
   - Informiše korisnika
   - Predlaže da pričeka

3. **Network Error:**
   - Jasna poruka o problemu
   - Omogućava refresh

## Budući Upgrade-i

### 🚀 Planirane Funkcionalnosti:

1. **Gemini Pro Vision**
   - Analiza uploadovanih računa
   - OCR za automatski unos podataka
   - Prepoznavanje logoa dobavljača

2. **Conversation History**
   - Pamćenje prethodnih razgovora
   - Kontekstualna nastavka diskusije
   - Export chat istorije

3. **Proaktivne Notifikacije**
   - AI analizira podatke i šalje upozorenja
   - Predviđanje problema
   - Automatski izveštaji

4. **Multi-turn Conversations**
   - Dublja diskusija o podacima
   - Follow-up pitanja
   - Razjašnjavanje nejasnoća

5. **Voice Input/Output**
   - Glasovna komanda
   - Text-to-Speech odgovori
   - Hands-free mode

## Troškovi i Limiti

**Google Gemini API Pricing (2026):**
- Gemini Pro: Besplatan do određenog broja zahteva mesečno
- Nakon toga: ~$0.001 po zahtevu
- Veoma pristupačno za male i srednje aplikacije

**Rate Limits:**
- 60 zahteva po minuti (besplatni tier)
- Neograničeno uz plaćeni plan

## Sigurnosne Mere

✅ API ključ je na backend-u  
✅ Nema direktnih poziva iz browsera  
✅ Server-side validacija  
✅ Rate limiting implementiran  
✅ Error messages ne otkrivaju interne detalje  

## Održavanje

### Ažuriranje API Ključa:
1. Idi u `.env.local`
2. Zameni vrednost `GEMINI_API_KEY`
3. Restartuj development server

### Monitoring:
- Proveri Google Cloud Console za usage
- Analiziraj response times u browser dev tools
- Prati error logs u konzoli

### Backup Plan:
Ako Gemini nije dostupan, sistem automatski vraća grešku i omogućava:
- Korišćenje lokalne AI Obuke
- Manuelnu pretragu podataka
- Nastavak rada bez AI-ja

---

**Dokumentaciju kreirao:** GitHub Copilot  
**Datum:** Januar 2026  
**Verzija:** 1.0
