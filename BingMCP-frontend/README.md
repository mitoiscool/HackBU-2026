# BingMCP Frontend

Next.js frontend for Baxter, a Binghamton campus assistant with:

- Chat UI that can call MCP tools through the AI SDK
- Live dashboard for bus, gym, laundry, and dining status/menu
- Baxter Mode overlays that spawn persistent Baxter mascots in different screen positions
- User preferences and settings saved in local storage (Baxter Mode, Expanded Tool Calls, laundry room, preferred dining hall, dietary preference)

## Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS 4
- Vercel AI SDK (`ai`, `@ai-sdk/react`, `@ai-sdk/mcp`)
- Google Generative AI provider (`@ai-sdk/google`)

## Routes

UI:

- `/` - Chat experience
- `/dashboard` - Live campus metrics dashboard
- `/testmode` - Visual component playground

API:

- `POST /api/chat` - Streams model responses and MCP tool calls
- `GET /api/dashboard` - Aggregated tool snapshot (gym, bus, laundry, dining status)
- `GET /api/dashboard/menu?hall=<hall>` - Dining menu for one hall

## Settings and Preferences

Chat settings currently include:

- `Baxter Mode` (on/off)
- `Expanded Tool Calls` (on/off)
- `Laundry Room` (dropdown)
- `Preferred Dining Hall` (dropdown)
- `Dietary Preferences` (multi-select: `vegetarian`, `halal`, `gluten_free`)
- `Name` (hero greeting personalization)

Preference storage keys:

- `baxter`
- `expandedToolCalls`
- `building`
- `preferredDiningHall`
- `dietaryPreferences`
- `name`

The chat client sends preferences with each message in `POST /api/chat` request body.
The API injects them into Baxter's system context. When dietary preferences are set,
Baxter is instructed to prioritize/filter dining menu suggestions for those diets.

## Environment Variables

Create `.env.local` in `BingMCP-frontend/`:

```bash
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
GEMINI_MODEL=gemini-3-flash-preview
MCP_SERVER_URL=http://localhost:8000/mcp
```

Notes:

- `GEMINI_MODEL` is optional; defaults to `gemini-3-flash-preview`
- `MCP_SERVER_URL` is optional; defaults to `http://localhost:8000/mcp`
- The frontend is transport-aware:
  - It tries the configured endpoint first
  - It can fall back between `/mcp` (HTTP transport) and `/sse` (SSE transport)
    if one mode is unavailable

## Run Locally

```bash
cd BingMCP-frontend
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Baxter Mode

- Toggle Baxter Mode from the chat settings menu
- When enabled, Baxter can spawn on initial load and after tool-backed responses
- Each new Baxter appears in a different part of the screen when possible
- Existing Baxters stay visible until you click that specific Baxter off

## Scripts

- `npm run dev` - Start local dev server
- `npm run build` - Production build
- `npm run start` - Run production server
- `npm run lint` - ESLint
- `npm run typecheck` - TypeScript check
- `npm run format` - Prettier format for `ts/tsx`

## MCP Integration Notes

- MCP client setup lives in `lib/server/mcp-client.ts`
- Chat and dashboard endpoints create short-lived MCP client connections per request
- Tool results are normalized server-side before being returned to UI components
- The Python backend must be started in HTTP mode for primary compatibility:
  `python ../BingMCP/server.py --transport http`

If you run this frontend against the Python server in `../BingMCP`, make sure `MCP_SERVER_URL` matches the transport/endpoint that server exposes in your local setup.
