# Igor AI Studio

App web hermana del panel de Igor para:

- chat con OpenAI, Gemini, Claude, Azure OpenAI, Groq, Mistral, Cohere y OpenRouter
- generacion de imagenes con OpenAI GPT Image
- biblioteca persistente de chats e imagenes
- despliegue en Vercel y persistencia opcional con Supabase

## Variables

Copiar `.env.example` a `.env.local` y completar:

```bash
OPENAI_API_KEY=
GEMINI_API_KEY=
ANTHROPIC_API_KEY=
GROQ_API_KEY=
MISTRAL_API_KEY=
COHERE_API_KEY=
OPENROUTER_API_KEY=
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_DEPLOYMENT=
AZURE_OPENAI_API_VERSION=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Supabase

Ejecutar `supabase/schema.sql` en el SQL Editor del proyecto.

## Desarrollo

```bash
npm install
npm run dev
```

## Deploy

Proyecto listo para importar en GitHub, Dyad y Vercel como app Next.js.
