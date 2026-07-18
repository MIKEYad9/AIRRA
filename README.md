# AIRRA AI SANCTUARY

![AIRRA AI Sanctuary](./src/assets/images/airra_sanctuary_banner_1784401816579.jpg)

## 🌿 Overview

**AIRRA** is a premium, full-stack, enterprise-grade AI-powered mental wellness platform and therapeutic sanctuary. Operating on a secure, zero-knowledge-inspired data architecture, AIRRA bridges the gap between clinical mindfulness techniques, biofeedback simulations, and private conversational artificial intelligence. It provides individuals with an eye-safe, sovereign digital harbor designed to cultivate inner peace, reduce autonomic tension, and support sustainable emotional health.

---

## 📖 Brief Description

AIRRA is a comprehensive, AI-driven mental wellness application designed around absolute data sovereignty, high-fidelity therapeutic tools, and deep visual minimalism. Combining adaptive AI conversational companions, real-time biofeedback and respiratory coherence simulators, zero-knowledge styled journal ledgers, and interactive diagnostic analytics, AIRRA provides users with a sanctuary to process anxiety, restore sleep, and track cognitive state shifts. The platform operates under a production-hardened security layer with standard-compliant CORS, CSRF defenses, strict Content Security Policies, and robust database privacy boundaries to ensure user data remains secure and private.

---

## 🔍 Detailed Description

AIRRA addresses the modern crisis of cognitive overload and burnout by offering an immersive digital sanctuary. Moving beyond generic mindfulness applications, AIRRA integrates a clinically grounded, feedback-driven model that empowers users with full control over their mental wellness journeys.

### 1. The Core Philosophy: Aesthetic Serenity & Sovereign Privacy
AIRRA is built upon the principles of **visual de-escalation** and **absolute user agency**:
- **Sage Atmospheric UI**: The visual design utilizes deep, organic greens, soft off-whites, and low-contrast palettes designed to reduce optical stress and visual cortisol triggers.
- **Data Sovereignty**: User data is fully private. Reflective journals, chat history, and biofeedback logs are secured using high-standard sanitization and authentication protocols, supporting local zero-knowledge fallbacks, sandbox sessions, and wipeable data layers to protect the user's digital footprint.

### 2. High-Fidelity Therapeutic Modules
AIRRA's features are compartmentalized into distinct, rich modules that address both acute and long-term wellness:
- **Adaptive AI Companion (Consultation Protocol)**: A dynamic, empathetic dialogue engine powered by Gemini AI. It specializes in cognitive reframing, trauma-informed de-escalation, and mindfulness support. Conversations are context-aware, sandboxed, and designed to provide supportive pacing during moments of acute stress.
- **Respiratory Coherence Engine & Sound Synthesizer**: An interactive breathing guide that uses responsive pacing animations and custom frequency generators to stabilize heart-rate variability (HRV) and balance the autonomic nervous system.
- **Sovereign Reflection Journals**: A secure markdown-compatible writing ledger allowing users to document their mental journeys. Users receive on-demand AI emotional insights, tone-tracking metrics, and safe, self-wipe capabilities.
- **Dynamic Diagnostics & Brainwave Simulators**: Incorporates immersive visualizers that map mock cognitive and neurological waves, allowing users to interact with state logs, stress indexes, and progress graphs powered by D3 and Recharts.
- **Anonymous Peer Community Feed**: A strictly sanitized peer-to-peer reflection board utilizing generated non-traceable anonymous identity handles (e.g. `Anonymous Identity b8e1`) to let users share supportive insights with the community without compromising their privacy.

---

## 🛠️ Key Features & Modules

### 💬 Adaptive AI Companion (`/consultation`)
- Powered by the advanced Google GenAI SDK (`@google/genai`) and server-side endpoints.
- Real-time cognitive reframing, grounding exercises, and active empathetic listening.
- Safe-harbor filtering to gracefully handle acute crisis escalations.

### 🫁 Coherence Breathing & Wellness (`/experience`)
- Guided inhalation, retention, and exhalation cycles tailored for deep calming.
- Real-time Autonomic Tension Index feedback.
- Fluid visual ripple and wave animations with responsive CSS transitions.

### 📝 Sovereign Reflection Ledger (`/journals`)
- Rich Markdown-supported journal entries rendered through client-side modules.
- Direct secure database storage with full fallback support for offline browser databases (`localStorage`).
- Immediate complete wipe commands to clear entries from both local and cloud storage.

### 📊 Diagnostics & Health Analytics (`/diagnostic`, `/analytics`)
- High-fidelity interactive dashboards containing D3 and Recharts components.
- Tracks emotional trends, sleep-cycle indicators, daily streak trackers, and stress scales over time.
- Immersive mock brainwave simulator visualizes cognitive flow states in real-time.

### 👥 Peer Support Sanctuary (`/community`)
- Interactive, non-persistent, and fully moderated peer-to-peer reflection sharing.
- Automatically assigns random, un-trackable anonymous hashes as author IDs.
- Secure, state-changing validations to prevent feed manipulation.

---

## 🔒 Enterprise-Grade Security & Production Hardening

To ensure complete privacy and robust reliability in live environments, AIRRA’s custom server layer (`server.ts`) is fortified with industry-leading defensive configurations:

*   **HTTPS Enforcement**: Automatically redirects all HTTP traffic to HTTPS when running under `production` environments.
*   **Strict Transport Security (HSTS)**: Serves `Strict-Transport-Security` headers with `max-age=31536000; includeSubDomains; preload` for bulletproof transport security.
*   **Hardened Content Security Policy (CSP)**: Blocks all inline injections, restricting script, style, and API origins strictly to trusted domains (`self`, Supabase, Google Generative Language API).
*   **Anti-CSRF Referer Checking**: Rejects state-changing HTTP methods (`POST`, `PUT`, `DELETE`) from mismatching origins.
*   **Secure CORS Enforcement**: Same-origin and wildcard-safe verification of incoming request origins.
*   **MIME Protection**: Strict enforcement of `X-Content-Type-Options: nosniff`.
*   **Clickjacking Prevention**: Hardened `X-Frame-Options: SAMEORIGIN` settings.
*   **Sandbox Token Protections**: Strictly blocks developer bypasses, test routes, and mock-tokens in production environments.

---

## 📐 Technical Stack & Architecture

AIRRA is constructed using a robust, decoupled, and fast-building Full-Stack Architecture:

*   **Frontend**: React 19, TypeScript 5.8, Tailwind CSS (V4 compilation with modern PostCSS/Vite plugins), `motion` (React animation engine), Lucide Icons, Recharts (for clean SVG data visualizations).
*   **Backend**: Node.js Express server (`server.ts`) with modern ES Modules setup, running via `tsx` in development.
*   **AI Integration**: Node.js server-side proxy integration utilizing the high-performance `@google/genai` TypeScript SDK to securely call the Gemini models without exposing private API keys to the browser client.
*   **Database**: Supabase client connection for user profiles, journals, and community post storage, backed by full local client-side offline failovers.
*   **Build System**: High-efficiency Vite bundling paired with `esbuild` to compile and pack the backend TypeScript server into a high-performance, single-bundle CommonJS file (`dist/server.cjs`) to support clean Cloud Run and container runtimes.

---

## 🚀 Getting Started & Local Development

### 1. Environment Configuration
Create a `.env` file in the root directory by copying from `.env.example`:

```bash
# Clone the example environment config
cp .env.example .env
```

Ensure the following variables are specified:
- `GEMINI_API_KEY`: Your server-side private Google Gemini API Key.
- `VITE_SUPABASE_URL`: Your Supabase Project API Endpoint.
- `VITE_SUPABASE_ANON_KEY`: Your Supabase Anonymous Client Public Key.

### 2. Development Setup
To start the developer workspace with live compilation and server hot-reloads:

```bash
# Install dependencies
npm install

# Run the TypeScript server in development mode
npm run dev
```

The application will launch and be accessible at `http://localhost:3000`.

### 3. Production Compilation & Packaging
To build both the React client assets and bundle the Express server into its highly optimized single-module production runtime:

```bash
# Compile and build the workspace
npm run build

# Start the compiled production bundle
npm run start
```
