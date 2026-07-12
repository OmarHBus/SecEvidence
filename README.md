# SecEvidence Desktop

Local-first workspace for organizing cybersecurity evidence and preparing evidence packs. The current iteration runs as a local Vite application and does not upload files, require an account, or use cloud services.

## Development

```bash
npm install
npm run dev
```

Validation:

```bash
npm run typecheck
npm run lint
npm run build
```

## Current scope

- React, TypeScript, Vite, and Tailwind CSS.
- Projects, overview, evidence, controls, risks, report builder, export, and settings screens.
- Realistic mock data.
- Typed boundaries for a future local SQLite and file-storage implementation.
- No auth, billing, analytics, telemetry, Supabase, or other cloud dependency.

Tauri requires Rust and the Windows build prerequisites. Once those are installed, the web UI and storage boundaries can be wrapped in Tauri v2.

SecEvidence helps organize evidence and prepare reports. It does not guarantee compliance and does not replace professional auditing or legal advice.
