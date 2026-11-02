# Skladová evidence

Statická webová aplikace pro zápis počtů 49 skladových položek a export do Excelu.

## Architektura
- Frontend: HTML, CSS a JavaScript na GitHub Pages.
- Backend: Supabase Edge Function `sync-sklad`.
- Databáze: `public.skladova_evidence`, jeden aktuální řádek.
- Zápis probíhá výhradně tlačítkem „Exportovat do DB“.
- Čísla referencí se ukládají jako text, aby se zachovaly úvodní nuly.

## Nastavení
1. V Supabase Dashboard otevři projekt `skladova-evidence` → Edge Functions → Secrets.
2. Přidej secret `APP_ACCESS_KEY` s dlouhým náhodným klíčem (doporučeně nejméně 32 náhodných bajtů).
3. Klíč nevkládej do repozitáře. Zadej jej až do pole „Přístupový klíč“ ve webapp.
4. V GitHubu otevři Settings → Pages → Build and deployment a jako Source zvol **GitHub Actions**.
5. Po úspěšném workflow bude adresa: https://jakubsikora1-arch.github.io/skladova-evidence/

## Soubory
- `index.html`, `styles.css`, `app.js` – webové rozhraní.
- `supabase/functions/sync-sklad/index.ts` – zdroj nasazené Edge Function.
- `supabase/migrations/` – SQL migrace.
- `.github/workflows/pages.yml` – automatické nasazení.

## Bezpečnost a omezení
- Service-role klíč není ve frontendu.
- Tabulka má zapnuté RLS a nemá veřejné policy.
- Edge Function používá vlastní ověření hlavičky `x-access-key`; proto má `verify_jwt=false`.
- CORS je nastaven na `*`; lze jej omezit na GitHub Pages origin.
- XLSX export používá ExcelJS z CDN a vyžaduje internetové připojení.
- Databáze uchovává pouze poslední export; nový export přepíše předchozí hodnoty.
