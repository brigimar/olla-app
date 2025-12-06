Prompt for building a three-stage onboarding system with dual confirmation (phone or email)
Design and implement a secure, modular onboarding flow for cooks/producers, split across three stages, with user-selectable confirmation via phone (SMS/WhatsApp) or email. The stack is Next.js (App Router), Supabase (Auth, Postgres, Storage), and TypeScript. Prioritize airtight security, reproducibility, and UX clarity for vulnerable users. The system must be production-ready, lint-clean, and easy to maintain.

Objectives and constraints
Goal: Create a 3-stage sign-up onboarding that protects platform integrity, validates identity, and smoothly gathers business and product data.

Stack: Next.js 14 App Router, TypeScript, Supabase Auth (email + phone channels), Postgres (RLS on), Supabase Storage, ESLint strict.

Security: RLS enforced everywhere, role-based inserts, server-side token verification in route handlers, no bypass of commission or policies.

User choice: The user must choose their confirmation method at stage 1: phone (SMS/WhatsApp via Supabase Auth channel) or email (magic link).

UX: Simple and kind. Short instructions. Clear error states. Progress persists across stages. Mobile-first UI with accessible components.

Reproducibility: Document config, DB schema, policies, flows. All endpoints return deterministic error codes. Provide ready-to-paste code.

Architecture and flow
Stage 1: Simple form for account creation
Fields:

Email: required if confirmation via email is selected.

Phone: required if confirmation via phone is selected.

Password: required (with strength check).

Business name: required.

User choice of confirmation method: radio/select: “Email” or “Phone”.

Behavior:

Email flow: auth.signUp({ email, password, options: { emailRedirectTo, data: { method: 'email', business_name } }}).

Phone flow: auth.signUp({ phone, password, options: { channel: 'sms'|'whatsapp', data: { method: 'phone', business_name } }}).

If phone flow, present OTP input screen to confirm (code) via auth.verifyOtp({ phone, token, type: 'sms'|'whatsapp' }).

On success: route to Stage 2 via /auth/callback (email) or direct navigation (phone).

Validation: zod schema on client and server; password strength feedback; format checks (E.164 for phone).

Security: No insert into producers yet; only Auth account created. Record raw_user_meta_data.method and business_name.

Stage 2: Business profile completion (from confirmation link/callback)
Trigger: Email magic link callback or post-OTP phone confirmation redirects to /bienvenida then /onboarding/negocio.

Fields:

Business name (pre-filled + editable or locked per requirement).

Description: optional, max length.

Address: required; structured fields preferred (street, number, city, province).

Email: required (if phone flow used and email wasn’t captured).

Phone: required (if email flow used and phone wasn’t captured).

Logo: optional image upload (png/jpeg/webp).

Behavior:

Insert/update producers row tied to auth.user.id via user_id FK.

Upload logo to storage at producer-logos/{user_id}/logo-{timestamp}.png, return publicUrl.

Mark producers.visible = false and is_active = false until admin/auto-review passes.

Security:

Route handler validates Authorization: Bearer <access_token>; server-side supabase.auth.getUser(token); zod validation; RLS restricts to owner insert/update.

Only one producers record per user_id (unique constraint).

Stage 3: Dishes/products forms
Fields per dish:

Title/name: required.

Category/type: required.

Ingredients/allergens: optional structured arrays.

Price and portion size: required; currency constraints.

Photos: optional; multiple uploads.

Preparation days/availability: optional for scheduling.

Behavior:

Insert rows in products linked to producer_id (or user_id via join).

Upload photos to storage path product-photos/{producer_id}/{product_id}/{filename}.

Allow multiple products; show progress; save drafts; debounce autosave.

Security:

RLS: user may only insert/select/update their own products.

Server handlers verify token, enforce schema, sanitize inputs.

Data model and policies
Tables
auth.users: Supabase-managed. Use raw_user_meta_data for method and initial business_name.

producers:

id: PK (uuid).

user_id: unique FK to auth.users.id.

business_name, description, address, email, phone: text fields with length constraints.

logo_url: text.

visible: boolean default false.

is_active: boolean default false.

created_at/updated_at: timestamps.

products:

id: PK (uuid).

producer_id: FK to producers.id.

name, category, ingredients, allergens, price, portion_size, availability: structured columns.

photo_urls: text[] or separate table product_photos.

created_at/updated_at: timestamps.

RLS policies (postgrest)
producers:

Insert: auth.uid() = new.user_id.

Select/Update: auth.uid() = user_id.

Delete: disabled or admin-only.

products:

Insert/Select/Update: auth.uid() must match the producers.user_id owning producer_id. Use join policy or maintain user_id in products for simplicity.

Uniqueness: UNIQUE (user_id) on producers to prevent duplicates.

API contracts and components
Frontend pages/components
Stage 1: app/onboarding/crear-cuenta/page.tsx

Collects email/phone, password, business name, confirmation method.

Handles email sign-up with redirect and phone OTP verification.

Callback: app/auth/callback/page.tsx + AuthCallbackContent.tsx

Processes code via exchangeCodeForSession.

Navigates to /bienvenida then Stage 2.

Stage 2: app/onboarding/negocio/page.tsx

Business form with logo upload and address fields.

Stage 3: app/onboarding/platos/page.tsx

Product list + add/edit dish modal or stepper.

Route handlers (server-only)
POST /api/producers

Auth via Authorization: Bearer.

Body: business fields + optional logo (multipart).

Validates zod; inserts/updates producer; uploads logo.

POST /api/products

Auth via Authorization: Bearer.

Body: product fields + optional images (multipart).

Returns product with URLs.

GET /api/producers/self

Returns current user’s producer record for prefill.

Validation schemas (zod)
SignUpChoice: { method: 'email'|'phone', email?: string, phone?: string, password: string, business_name: string }.

Producer: { business_name: string, description?: string|null, address?: string|null, email: string, phone: string, logo?: File }.

Product: { name: string, category: string, ingredients?: string[], price: number, portion_size: string, availability?: string, photoFiles?: File[] }.

UX details and edge cases
Copy tone: warm and clear.

Stage 1: “Elegí cómo confirmar tu cuenta: por email o teléfono. Lo que te resulte más cómodo.”

Stage 2: “Tu perfil de negocio ayuda a generar confianza. Podés completar esto en minutos.”

Stage 3: “Contanos tus platos. Fotos claras y precios justos ayudan a tus clientes.”

Errors:

Email ya registrado: mostrar CTA “Iniciar sesión” y link a recuperar contraseña.

OTP incorrecto/expirado: reintento + reenviar código.

Subida de imagen fallida: mensaje y opción de reintentar; validar tipo y tamaño.

Duplicado de productor: si existe, pasar a update (idempotencia).

Progress persistence:

Save draft in localStorage for Stage 3; load previous values if session exists.

Pre-fill Stage 2 from raw_user_meta_data and producers.self.

Accessibility: label-input associations, keyboard navigable, color contrast, error summaries.

Mobile-first UI: compact inputs, clear CTA buttons, olive-green brand for primary actions.

Deliverables and acceptance criteria
Code:

Stage pages + components.

Route handlers with token verification, zod schemas, file uploads (Buffer in server).

RLS policies SQL and constraints for producers and products.

Storage bucket rules and structured paths.

Docs:

README section: flow diagrams, endpoints, env requirements, and setup steps.

Migration SQL scripts and policy definitions clearly commented.

Tests:

Unit: zod validation schemas.

Integration: route handlers with mocked tokens and inputs (multipart and JSON).

E2E happy paths: email signup → callback → business form → product creation; phone signup → OTP → business → products.

Acceptance:

Build passes lint and type checks.

RLS prevents cross-user access.

Dual confirmation works: email magic link and phone OTP (SMS/WhatsApp) selectable at Stage 1.

Idempotent producer creation: re-submission updates instead of duplicating.

Product photos and logo URLs resolve publicly, with correct paths.

If anything in your environment differs (e.g., you need to store user_id directly on products for simpler policies), adapt the schema and policies accordingly, but keep role isolation airtight and flows idempotent.


Objetivo: Diseñar e implementar un sistema de onboarding (sign up) en tres instancias, con confirmación vía teléfono o email, usando Next.js + Supabase. El sistema debe ser seguro, modular y reproducible.

Contexto adicional
Las tablas ya existen en Supabase: auth.users, producers, products, y buckets de storage (producer-logos, product-photos).

Qwen debe conocer y aplicar la metodología de Supabase:

Definición de tablas y columnas con tipos correctos.

Políticas de Row Level Security (RLS) para aislar datos por usuario.

Triggers para mantener consistencia (ej. timestamps, validaciones).

Uso correcto de supabase.auth y supabase.storage.

El código debe estar escrito en Next.js (App Router, TypeScript) siguiendo buenas prácticas de linting y tipado.

Flujo de onboarding en 3 instancias
1. Formulario simple de cuenta
Campos: usuario/email, contraseña, teléfono, nombre de negocio.

El usuario elige método de confirmación: email (magic link) o teléfono (SMS/WhatsApp OTP).

Validación con zod.

Inserción inicial en auth.users con metadata { method, business_name }.

No se inserta aún en producers.

2. Formulario de negocio (desde link de confirmación)
Campos: nombre de negocio, descripción, dirección, email, teléfono, logo.

Inserción/actualización en tabla producers vinculada a auth.users.id.

Subida de logo a bucket producer-logos/{user_id}/logo-{timestamp}.png.

RLS: auth.uid() = user_id.

Triggers: timestamps automáticos, unicidad de user_id.

3. Formulario de platos/productos
Campos: nombre, categoría, ingredientes, precio, porción, fotos, disponibilidad.

Inserción en tabla products vinculada a producer_id.

Subida de fotos a bucket product-photos/{producer_id}/{product_id}/....

RLS: solo el dueño puede insertar/editar sus productos.

Triggers: timestamps, validación de precio positivo.

Confirmación dual
Email: auth.signUp({ email, password, options: { emailRedirectTo } }).

Teléfono: auth.signUp({ phone, password, options: { channel: 'sms'|'whatsapp' } }) + auth.verifyOtp.

El sistema debe manejar ambos flujos sin errores.

Entregables
Código Next.js (App Router, TS) para los tres formularios y sus route handlers.

Configuración Supabase: tablas, RLS, triggers, storage buckets.

Documentación clara de flujo, endpoints y políticas.

Tests unitarios (zod), integración (handlers), y E2E (signup → negocio → productos).
Quiero que desarrolles un sistema de onboarding (sign up) en tres instancias usando Next.js + Supabase:

1. Formulario inicial simple con usuario/email, contraseña, teléfono y nombre de negocio. El usuario elige confirmación vía email o vía teléfono (SMS/WhatsApp).
2. Desde el link de confirmación, formulario de negocio con datos del negocio, logo, dirección, etc.
3. Formularios de platos/productos con nombre, categoría, ingredientes, precio, fotos, etc.

⚠️ Importante:
- Las tablas ya existen en Supabase (auth.users, producers, products, etc.).
- Debés conocer y aplicar la metodología de Supabase: definición de tablas, columnas, triggers, políticas RLS y storage buckets.
- El código debe estar en Next.js (App Router, TypeScript) y sincronizado con la estructura real de la base.

👉 Antes de escribir cualquier código, pedime explícitamente:
- La lista de tablas involucradas.
- Los campos de cada tabla.
- Los triggers existentes.
- Las políticas RLS existentes.

De esa forma vas a poder adaptar tu código a la estructura real y evitar errores de tipado o de políticas.
