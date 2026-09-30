# عمارتي — Emaraty Mobile

Expo/React Native production foundation for the supplied Emaraty specification.

## Stack
- Expo SDK 57 / React Native 0.86.3 / React 19.2
- Expo Router + TypeScript strict mode
- Supabase Auth + Postgres/RLS/RPC
- SecureStore-backed mobile auth session
- Arabic RTL, mobile-first banking-style UI

## Run
```bash
cp .env.example .env
# set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
npm install
npx expo start
```

## Database contract
The supplied project document describes an existing `emaraty_schema.sql`, but the SQL file itself was not included in the upload. The mobile client therefore does not invent database tables/constraints. It expects the documented contract, including:

- tables: `buildings`, `floors`, `apartments`, `owners`, `tenants`, `dues`, `payments`, `receipts`, `expenses`, `fund_transactions`, `audit_logs`, `profiles`
- views: `v_fund_balance`, `v_due_balances`
- RPCs: `record_payment`, `void_payment`, `record_expense`, `void_expense`, `set_due_status`, `generate_month_dues`, `close_apartment`, `reopen_apartment`

Before production release, run the actual SQL against a real Supabase project and integration-test every RPC signature against this client.

## Security model
- Only the Supabase publishable key is shipped in the app.
- Never put `service_role` in the mobile bundle.
- Financial mutations go through Postgres RPCs, not client-side balance edits.
- RLS remains the source of authorization; UI role checks are not a security boundary.
- The app intentionally does not fake successful payments/expenses while the real SQL contract is unverified.

## Implemented now
- Login / logout, protected navigation, session auto-refresh tied to app foreground state.
- Arabic RTL (works on both RTL and LTR devices) + automatic Dark Mode (`constants/theme.ts`).
- Dashboard: fund balance from `v_fund_balance`, month collections/expenses filtered server-side, overdue; errors are shown, never displayed as zero.
- Apartments: fixed 12-apartment contract with an integrity warning if the DB violates it; per-apartment balance/overdue.
- Apartment details: statement (dues + payments), exempt/cancel due, void payment, close/reopen apartment, all with mandatory reason (+ date where relevant).
- Collections: record payment, generate month dues. Expenses: record expense, recent list, void expense.
- No delete operation exists anywhere in the client. Corrections are void / exempt / cancel only.

## Assumed database contract (verify against the real SQL)
Names below are guesses that the client depends on; a mismatch shows an explicit error instead of wrong numbers.
- Views: `v_due_balances(due_id|id, apartment_number, period, amount|total_amount|due_amount, paid_amount, remaining, status, is_overdue)`, `v_fund_balance(balance|fund_balance)`.
- Tables: `payments(id, apartment_number, amount, paid_at, payment_method, status, notes)`, `expenses(id, description, amount, date|expense_date, supplier, status, apartment_number)`, `expense_categories(id, name)` (not in the original table list, needed by `record_expense`).
- Active status value: `ACTIVE` (see `constants/status.ts`). Payment methods: `CASH`, `BANK_TRANSFER`, `CHECK`. Reopen usage types: `OCCUPIED`, `RENTED`, `VACANT`.
- RPC parameters: see `lib/mutations.ts`. `void_payment(p_payment_id, p_reason)` and `void_expense(p_expense_id, p_reason)` are new in this client.

## Known gaps
- Roles are not applied in the UI yet (RLS remains the real gate). Reports are a catalog only. No offline support.
- Supabase session JSON may exceed SecureStore's 2048-byte guidance; if sessions fail to persist on a device, move to the encrypted-storage pattern in the Supabase Expo docs.
- `npm run web` is not supported (SecureStore has no web implementation).

## Deploy with EAS (Android APK)
```bash
npm i -g eas-cli
eas login
eas init                       # ربط المشروع بحسابك (يكتب projectId في app.json)
eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://YOUR_PROJECT.supabase.co" --environment preview --visibility plaintext
eas env:create --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --value "YOUR_KEY" --environment preview --visibility plaintext
eas build --platform android --profile preview
```
كرّر أمري `env:create` مع `--environment production` قبل `eas build --profile production`.
