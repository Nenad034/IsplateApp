import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Simple local AI fallback when Gemini is unavailable
function processLocalQuery(query: string, context: string): string {
  const q = query.toLowerCase();
  
  // Parse context for numbers
  const isplataMatch = context.match(/Ukupno isplata: (\d+)/);
  const pendingMatch = context.match(/Na čekanju: (\d+)/);
  const completedMatch = context.match(/Isplaćeno: (\d+)/);
  const totalAmountMatch = context.match(/Ukupan iznos: ([^\n]+)/);
  const supplierMatch = context.match(/Broj dobavljača: (\d+)/);
  const hotelMatch = context.match(/Broj hotela: (\d+)/);
  const top3SuppliersMatch = context.match(/DOBAVLJAČI:[\s\S]*?Top 3: ([^\n]+)/);
  const top3HotelsMatch = context.match(/HOTELI:[\s\S]*?Top 3: ([^\n]+)/);
  
  const numIsplata = isplataMatch ? isplataMatch[1] : '0';
  const numPending = pendingMatch ? pendingMatch[1] : '0';
  const numCompleted = completedMatch ? completedMatch[1] : '0';
  const totalAmount = totalAmountMatch ? totalAmountMatch[1] : '0,00 €';
  const numSuppliers = supplierMatch ? supplierMatch[1] : '0';
  const numHotels = hotelMatch ? hotelMatch[1] : '0';
  const top3Suppliers = top3SuppliersMatch ? top3SuppliersMatch[1] : 'nema podataka';
  const top3Hotels = top3HotelsMatch ? top3HotelsMatch[1] : 'nema podataka';

  // Answer based on query
  if (q.includes('isplat') && (q.includes('koliko') || q.includes('ukupno') || q.includes('broj'))) {
    return `📊 Ukupno imate **${numIsplata}** isplata u sistemu.\n\n**Status:**\n• Na čekanju: ${numPending}\n• Isplaćeno: ${numCompleted}\n\n💰 **Ukupan iznos:** ${totalAmount}`;
  }
  
  if (q.includes('dobavljač') || q.includes('dobavljac') || q.includes('supplier')) {
    return `👥 Imate **${numSuppliers}** dobavljača u bazi.\n\n📋 **Top 3:** ${top3Suppliers}`;
  }
  
  if (q.includes('hotel')) {
    return `🏨 Imate **${numHotels}** hotela u bazi.\n\n📋 **Top 3:** ${top3Hotels}`;
  }
  
  if (q.includes('pending') || q.includes('čekanj') || q.includes('cekanj')) {
    return `⏳ Trenutno imate **${numPending}** isplata na čekanju.`;
  }
  
  if (q.includes('iznos') || q.includes('suma') || q.includes('total')) {
    return `💰 Ukupan iznos svih isplata: **${totalAmount}**`;
  }
  
  if (q.includes('zdravo') || q.includes('bok') || q.includes('cao') || q.includes('pozdrav') || q.includes('hej')) {
    return `Zdravo! 👋 Ja sam AI asistent za Isplate.\n\nMogu vam pomoći sa informacijama o:\n• 📊 Isplatama\n• 👥 Dobavljačima\n• 🏨 Hotelima\n\nŠta vas zanima?`;
  }
  
  if (q.includes('pomoc') || q.includes('pomoć') || q.includes('help') || q.includes('šta možeš') || q.includes('sta mozes')) {
    return `Mogu vam pomoći sa sledećim:\n\n📊 **Isplate**\n• "Koliko imamo isplata?"\n• "Koliko je na čekanju?"\n• "Ukupan iznos?"\n\n👥 **Dobavljači**\n• "Koliko imamo dobavljača?"\n\n🏨 **Hoteli**\n• "Koliko imamo hotela?"`;
  }

  return `📈 **Pregled sistema:**\n\n📊 Isplate: **${numIsplata}** (${totalAmount})\n👥 Dobavljači: **${numSuppliers}**\n🏨 Hoteli: **${numHotels}**\n\nPitajte me konkretnije o isplatama, dobavljačima ili hotelima!`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, context } = body;

    console.log('AI Chat Request:', { query: query?.substring(0, 50), hasContext: !!context });

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    // Try Gemini first, fallback to local
    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-1.5-flash',
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          }
        });

        const fullPrompt = `Ti si AI asistent za aplikaciju za upravljanje isplatama, dobavljačima i hotelima.

TRENUTNI PODACI:
${context || 'Nema dostupnih podataka'}

KORISNIK PITA: ${query}

Odgovori KRATKO i PRECIZNO na srpskom jeziku. Koristi podatke iznad za tačan odgovor.`;

        console.log('Sending to Gemini...');
        const result = await model.generateContent(fullPrompt);
        
        if (result.response) {
          const text = result.response.text();
          console.log('Gemini response received');
          return NextResponse.json({ answer: text || 'Nisam dobio odgovor.' });
        }
      } catch (geminiError: any) {
        console.log('Gemini unavailable, using local fallback:', geminiError?.message?.substring(0, 80));
        // Fall through to local processing
      }
    }

    // Local fallback - always works
    console.log('Using local AI fallback');
    const localAnswer = processLocalQuery(query, context || '');
    return NextResponse.json({ answer: localAnswer });
    
  } catch (error: any) {
    console.error('AI Error:', error?.message);
    return NextResponse.json(
      { error: 'Došlo je do greške.' },
      { status: 500 }
    );
  }
}
