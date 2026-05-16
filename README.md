# Igor AI Studio

App web hermana del panel de Igor para:

- chat con OpenAI, Gemini y Claude
- generacion de imagenes con OpenAI GPT Image
- biblioteca persistente de chats e imagenes
- despliegue en Vercel y persistencia opcional con Supabase

## Variables

Copiar `.env.example` a `.env.local` y completar:

```bash
OPENAI_API_KEY=
GEMINI_API_KEY=
ANTHROPIC_API_KEY=
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
