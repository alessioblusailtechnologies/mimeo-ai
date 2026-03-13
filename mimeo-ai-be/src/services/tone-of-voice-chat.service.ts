import * as tovRepo from '../repositories/tone-of-voice.repository.js';
import { getAiProvider } from './ai/ai-provider.factory.js';
import type { TovChatMessage, TovChatRequest, TovChatResponse } from '../types/tone-of-voice.types.js';

const PLATFORM_CONTEXTS: Record<string, string> = {
  linkedin: `La piattaforma è LinkedIn. Concentrati su: tono professionale vs. personale, uso di storytelling, struttura dei post (hook, corpo, CTA), uso di emoji, lunghezza ideale, frequenza di posting, uso di hashtag, stile dei bullet point.`,
  twitter: `La piattaforma è Twitter/X. Concentrati su: brevità e incisività, uso di thread, tone of voice (sarcastico, informativo, provocatorio), uso di emoji e hashtag, engagement style, frequenza.`,
  blog: `La piattaforma è un Blog. Concentrati su: stile narrativo, livello di formalità, struttura degli articoli, uso di titoli e sottotitoli, lunghezza ideale, tono editoriale, target reader.`,
  generic: `La piattaforma è generica. Concentrati su: stile di comunicazione generale, formalità, personalità del brand, valori da trasmettere, parole chiave ricorrenti.`,
};

function buildSystemPrompt(platformType: string): string {
  const platformContext = PLATFORM_CONTEXTS[platformType] || PLATFORM_CONTEXTS.generic;

  return `Sei un esperto di brand voice e comunicazione digitale. Il tuo compito è guidare l'utente nella creazione di un Tone of Voice unico e personale attraverso una conversazione naturale.

${platformContext}

Il tuo approccio:
1. Fai domande mirate una alla volta per capire la personalità, lo stile e gli obiettivi dell'utente
2. Adatta le domande in base alle risposte precedenti
3. Sii conversazionale, amichevole e incisivo
4. A un certo punto chiedi all'utente di incollare 2-3 post di esempio che rappresentano lo stile che vuole (post suoi o di altri che ammira). Spiega che può incollare il testo direttamente e che è opzionale ma molto utile per catturare lo stile
5. Dopo 4-6 scambi, quando hai abbastanza informazioni, genera il profilo

Domande da coprire (non necessariamente in quest'ordine, adattati al flusso):
- Come vuoi essere percepito dal tuo pubblico?
- Qual è il tuo settore/ambito professionale?
- Preferisci un approccio formale o informale?
- Usi l'umorismo nei tuoi contenuti? Se sì, che tipo?
- Quali emozioni vuoi suscitare nel lettore?
- Ci sono creator o brand il cui stile ammiri?
- Come gestisci le call-to-action?
- Usi emoji? Se sì, quanto frequentemente?
- Preferisci frasi brevi e dirette o periodi più articolati?
- IMPORTANTE: Chiedi di incollare 2-3 post di esempio (propri o di altri) che rappresentano lo stile desiderato. Se l'utente non ne ha o non vuole, va bene, procedi comunque

Rispondi SEMPRE in italiano.

Quando hai raccolto abbastanza informazioni, concludi il messaggio con un blocco JSON:
\`\`\`json
{
  "ready": true,
  "tov_name": "nome descrittivo del tone of voice",
  "description": "breve descrizione (max 200 caratteri) dello stile",
  "style_profile": {
    "formality": "low|medium|high",
    "humor": "none|light|moderate|heavy",
    "emotion": "rational|balanced|emotional",
    "sentence_style": "short|mixed|elaborate",
    "vocabulary": "simple|professional|technical",
    "emoji_usage": "none|minimal|moderate|frequent",
    "cta_style": "none|subtle|direct|bold",
    "storytelling": "none|light|central",
    "personality_traits": ["tratto1", "tratto2", "tratto3"]
  },
  "system_prompt_fragment": "Istruzioni dettagliate e complete per l'AI su come scrivere con questo tone of voice. Deve includere: stile, tono, struttura, esempi di frasi tipo, cosa evitare, parole chiave ricorrenti. Minimo 200 parole, massimo 500.",
  "example_posts": ["testo completo del post 1", "testo completo del post 2"]
}
\`\`\`

Regole importanti:
- NON generare il JSON finché non hai fatto almeno 3 domande e ricevuto risposte
- Il system_prompt_fragment deve essere MOLTO dettagliato e specifico, come un vero brief creativo
- Il campo example_posts deve contenere i post di esempio che l'utente ha condiviso (testo completo, non riassunti). Se l'utente non ha fornito esempi, usa un array vuoto []
- Il JSON deve essere valido e racchiuso tra i marker \`\`\`json \`\`\`
- Non spiegare cosa stai per fare, fai semplicemente la prossima domanda`;
}

const CHAT_MODEL = 'claude-opus-4-6';

function buildConversation(history: TovChatMessage[], message: string): string {
  const parts: string[] = [];
  for (const msg of history) {
    parts.push(`${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`);
  }
  parts.push(`User: ${message}`);
  return parts.join('\n\n');
}

interface TovAction {
  tov_name: string;
  description: string;
  style_profile: Record<string, unknown>;
  system_prompt_fragment: string;
  example_posts: string[];
}

function extractJsonAction(text: string): { action: TovAction | null; cleanMessage: string } {
  const jsonBlockRegex = /```json\s*([\s\S]*?)```/;
  const match = text.match(jsonBlockRegex);

  if (!match) {
    return { action: null, cleanMessage: text.trim() };
  }

  try {
    const parsed = JSON.parse(match[1].trim());
    if (!parsed.ready) {
      return { action: null, cleanMessage: text.trim() };
    }

    const action: TovAction = {
      tov_name: parsed.tov_name,
      description: parsed.description,
      style_profile: parsed.style_profile || {},
      system_prompt_fragment: parsed.system_prompt_fragment,
      example_posts: Array.isArray(parsed.example_posts) ? parsed.example_posts : [],
    };

    const cleanMessage = text.replace(jsonBlockRegex, '').trim();
    return { action, cleanMessage };
  } catch {
    return { action: null, cleanMessage: text.trim() };
  }
}

export async function processMessage(
  workspaceId: string,
  request: TovChatRequest,
  userId: string
): Promise<TovChatResponse> {
  const aiProvider = getAiProvider('claude');
  const systemPrompt = buildSystemPrompt(request.platform_type);
  const userPrompt = buildConversation(request.history, request.message);

  const aiResponse = await aiProvider.generate({
    systemPrompt,
    userPrompt,
    model: CHAT_MODEL,
    maxTokens: 2048,
  });

  const { action, cleanMessage } = extractJsonAction(aiResponse.content);

  if (!action) {
    return { message: cleanMessage, done: false };
  }

  // Create the Tone of Voice
  const tov = await tovRepo.create(
    workspaceId,
    {
      name: action.tov_name,
      platform_type: request.platform_type,
      description: action.description,
      style_profile: action.style_profile,
      system_prompt_fragment: action.system_prompt_fragment,
      example_posts: action.example_posts,
      conversation_history: [...request.history, { role: 'user', content: request.message }],
    },
    userId
  );

  return {
    message: cleanMessage,
    done: true,
    result: {
      toneOfVoice: { id: tov.id, name: tov.name, description: tov.description },
    },
  };
}
