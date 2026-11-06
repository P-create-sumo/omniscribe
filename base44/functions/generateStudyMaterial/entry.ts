import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { fetchExpertSources, selectMatches } from '../../shared/expertRetrieval.ts';

const MAX_TOPIC_CHARS = 300;
const MAX_CONTEXT_CHARS = 40000;
const MAX_SPEECH_CHARS = 4600;

const CONTENT_TYPES = {
  quiz_mc: {
    instruction: `Genera un test a risposta multipla (a crocette) di 8 domande sull'argomento.
Ogni domanda ha 4 opzioni plausibili ma una sola corretta (correct_index da 0 a 3) e una spiegazione di 1-2 frasi.`,
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              options: { type: 'array', items: { type: 'string' } },
              correct_index: { type: 'integer' },
              explanation: { type: 'string' },
            },
            required: ['question', 'options', 'correct_index'],
          },
        },
      },
      required: ['title', 'questions'],
    },
  },
  quiz_open: {
    instruction: `Genera 6 domande a risposta aperta sull'argomento.
Per ogni domanda fornisci una risposta modello di 3-5 frasi e 3 punti chiave che una risposta corretta deve contenere.`,
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              model_answer: { type: 'string' },
              key_points: { type: 'array', items: { type: 'string' } },
            },
            required: ['question', 'model_answer'],
          },
        },
      },
      required: ['title', 'questions'],
    },
  },
  flashcards: {
    instruction: `Crea 12 flashcard per autovalutare la preparazione sull'argomento.
Ogni carta ha una domanda o concetto sul fronte (front), la risposta chiara sul retro (back) e un suggerimento breve (hint).`,
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        cards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              front: { type: 'string' },
              back: { type: 'string' },
              hint: { type: 'string' },
            },
            required: ['front', 'back'],
          },
        },
      },
      required: ['title', 'cards'],
    },
  },
  slides: {
    instruction: `Crea una presentazione di 10 slide sull'argomento, come una lezione frontale.
I titoli delle slide seguono un filo logico (apertura, concetti, esempi, sintesi finale).
Ogni slide ha 3-5 punti sintetici (bullets) e note del relatore di 1-2 frasi.`,
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        slides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              bullets: { type: 'array', items: { type: 'string' } },
              speaker_notes: { type: 'string' },
            },
            required: ['title', 'bullets'],
          },
        },
      },
      required: ['title', 'slides'],
    },
  },
  mindmap: {
    instruction: `Crea una mappa mentale dell'argomento: un concetto centrale (root) e 5 rami principali.
Ogni ramo ha 2-4 sotto-concetti. Etichette brevi (massimo 6 parole).`,
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        root: { type: 'string' },
        branches: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              children: { type: 'array', items: { type: 'string' } },
            },
            required: ['label'],
          },
        },
      },
      required: ['title', 'root', 'branches'],
    },
  },
  audio: {
    instruction: `Scrivi un copione di sintesi da leggere ad alta voce, di circa 450 parole (massimo 3000 caratteri).
Deve essere un discorso continuo e scorrevole, senza titoli, elenchi, simboli o istruzioni di regia.`,
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        script: { type: 'string' },
      },
      required: ['title', 'script'],
    },
  },
  podcast: {
    instruction: `Scrivi il copione di un podcast divulgativo di circa 500 parole (massimo 3000 caratteri) sull'argomento.
Un solo narratore che spiega con ritmo naturale, esempi concreti e domande retoriche. Nessun titolo, nessun elenco, nessuna indicazione di regia.`,
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        script: { type: 'string' },
      },
      required: ['title', 'script'],
    },
  },
  infographic: {
    instruction: `Progetta i contenuti di un'infografica sull'argomento: un sottotitolo, 4 numeri o fatti chiave (label + value breve),
3 blocchi di contenuto con titolo e testo di 2-3 frasi, e un messaggio finale da ricordare (takeaway).`,
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        subtitle: { type: 'string' },
        stats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              value: { type: 'string' },
            },
            required: ['label', 'value'],
          },
        },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              text: { type: 'string' },
            },
            required: ['title', 'text'],
          },
        },
        takeaway: { type: 'string' },
      },
      required: ['title', 'stats', 'sections'],
    },
  },
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const expert_id = body.expert_id;
    const type = String(body.type || '');
    const topic = String(body.topic || '').trim().slice(0, MAX_TOPIC_CHARS);

    if (!expert_id || !topic || !CONTENT_TYPES[type]) {
      return Response.json({ error: 'expert_id, topic e type validi sono obbligatori' }, { status: 400 });
    }

    const expert = await base44.asServiceRole.entities.Expert.get(expert_id)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!expert) return Response.json({ error: 'Esperto non trovato' }, { status: 404 });

    // Il materiale si crea solo dalla Knowledge Base del proprietario dell'Esperto.
    if (expert.created_by_id !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const config = CONTENT_TYPES[type];
    const sources = await fetchExpertSources(base44, expert);
    const { matches } = await selectMatches(base44, sources, topic);
    const knowledge = matches
      .map((m) => `--- ${m.source_title} ---\n${m.excerpt}`)
      .join('\n\n')
      .slice(0, MAX_CONTEXT_CHARS);

    const prompt = `Sei "${expert.name}", un esperto di ${expert.discipline}. ${expert.description || ''}

ARGOMENTO / CAPITOLO RICHIESTO: ${topic}

ESTRATTI DALLA KNOWLEDGE BASE DELL'ESPERTO:
${knowledge || '(nessun estratto pertinente trovato: usa la tua competenza sulla disciplina)'}

COMPITO:
${config.instruction}

REGOLE GENERALI:
- Scrivi tutto in italiano.
- Resta fedele agli estratti forniti: non inventare fatti che non vi compaiono.
- Mantieni il focus esatto sull'argomento "${topic}".`;

    const data = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: config.schema,
    });

    let audioUrl = '';
    if (type === 'audio' || type === 'podcast') {
      const script = String(data?.script || '').slice(0, MAX_SPEECH_CHARS).trim();
      if (!script) return Response.json({ error: 'Copione audio non generato' }, { status: 502 });
      const speech = await base44.asServiceRole.integrations.Core.GenerateSpeech({
        text: script,
        language_code: 'it',
      });
      audioUrl = speech?.url || '';
    }

    const material = await base44.asServiceRole.entities.StudyMaterial.create({
      expert_id: expert.id,
      expert_name: expert.name,
      type,
      topic,
      title: String(data?.title || topic).slice(0, 200),
      content: JSON.stringify(data || {}),
      audio_url: audioUrl,
      sources_used: [...new Set(matches.map((m) => m.source_title))].slice(0, 8).join(', '),
      status: type === 'audio' || type === 'podcast' ? (audioUrl ? 'ready' : 'error') : 'ready',
      created_by_id: user.id,
    });

    return Response.json({ material });
  } catch (error) {
    console.error('generateStudyMaterial error', error?.message);
    return Response.json({ error: error?.message || 'Errore nella generazione del materiale' }, { status: 500 });
  }
}