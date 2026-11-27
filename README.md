# Skladová evidence

Statická webová aplikace pro zápis, načtení a export počtů **50 skladových položek**.

**Produkční adresa:** https://jakubsikora1-arch.github.io/skladova-evidence/

## Aktuální funkce aplikace

- Tabulka obsahuje 50 položek; sloupce jsou Název, ⌀ (průměr), Číslo ref. a Počet ks.
- Vyhledávání podle názvu položky nebo čísla reference.
- Počet kusů přijímá celá nezáporná čísla; prázdné pole znamená nezadanou hodnotu.
- Tlačítko **Stáhnout poslední počty** načítá poslední uložený stav z databáze.
- Tlačítko **Exportovat do DB** ukládá aktuální stav do databáze.
- Tlačítko **Stáhnout XLSX** vytváří soubor Excelu `TISK_PRO_ZAPIS.xlsx`.
- Přepínač světlého a tmavého vzhledu. Výchozí vzhled je tmavý; volba se ukládá v `localStorage`.
- Rozpracované počty se průběžně ukládají do `sessionStorage` a mohou se obnovit po obnovení stránky ve stejné relaci.
- **Nový formulář** otevře potvrzovací dialog. Lze uložit a vymazat formulář, vymazat jej bez uložení nebo akci zrušit.
- Ikona aplikace je použita jako favicon a ikona při přidání na plochu. V samotné hlavičce aplikace je pouze textový název a podnadpis.

## Architektura

### Frontend
- HTML: `index.html`
- Styly a barevná témata: `styles.css`
- Logika aplikace a seznam položek: `app.js`
- Ikona: `assets/app-icon.png`
- Hosting: GitHub Pages.

Aplikace je statická; při nasazení se nevytváří ani nekompiluje frontendový bundle.

### Backend
- Supabase Edge Function: `supabase/functions/sync-sklad/index.ts`
- Databázová tabulka: `public.skladova_evidence`
- Tabulka obsahuje jeden záznam s ID 1 a pole `items` typu JSONB.
- Nový export přepisuje předchozí uložený stav; databáze tedy uchovává poslední export, nikoliv historii.
- Čísla referencí jsou řetězce, aby se zachovaly úvodní nuly.
- RLS je zapnuté; přístup k tabulce je v migraci odebrán rolím `anon` a `authenticated` a udělen `service_role`.
- SQL migrace: `supabase/migrations/20261102205331_create_skladova_evidence.sql`.

## Nasazení GitHub Pages

Nasazení automaticky spouští GitHub Actions při každém pushi do větve `main`. Lze jej spustit také ručně přes **Actions → Deploy static webapp to GitHub Pages → Run workflow**.

Workflow je uložen v `.github/workflows/pages.yml` a provádí tyto kroky:

1. Načte repozitář.
2. Ověří existenci souborů aplikace a ikony.
3. Ověří základní značky HTML a přítomnost přepínače vzhledu a znaku ⌀.
4. Zkontroluje, že seznam `EXPECTED` v `app.js` obsahuje přesně 50 položek.
5. Připraví publikační adresář `_site` pouze se soubory potřebnými pro web: `index.html`, `styles.css`, `app.js` a `assets/app-icon.png`.
6. Nahraje artefakt a nasadí jej na GitHub Pages.

Zdrojové soubory Supabase, SQL migrace a konfigurace GitHub Actions se do veřejného webového artefaktu nekopírují.

V repozitáři musí být v **Settings → Pages → Build and deployment** nastaven zdroj **GitHub Actions**.

## Důležité upozornění – aktuální stav synchronizace s databází

Zdrojový kód Edge Function vyžaduje při každém požadavku hlavičku `x-access-key` a porovnává ji s tajnou proměnnou `APP_ACCESS_KEY`.

Aktuální klientská funkce `api()` v `app.js` ale odesílá pouze hlavičku `Content-Type`; hlavičku `x-access-key` neposílá a v aktuálním rozhraní není pole pro zadání přístupového klíče. **Frontend a backend proto v této verzi nejsou v autentizaci sladěné a požadavky na načtení či uložení dat mohou skončit odpovědí HTTP 401.**

Toto je známý nesoulad zdrojového kódu, nikoliv problém nasazovacího workflow. Samotné úspěšné nasazení GitHub Pages jej nevyřeší. Před označením synchronizace za funkční je nutné navrhnout a implementovat bezpečné předávání přístupového oprávnění; tajný klíč nesmí být napevno uložený ve veřejném JavaScriptu.

Další provozní omezení:
- XLSX export načítá ExcelJS z CDN `cdn.jsdelivr.net`; bez přístupu k této CDN nemusí export fungovat.
- Edge Function má aktuálně CORS `Access-Control-Allow-Origin: *`. Pro produkční provoz je vhodné povolit pouze konkrétní origin aplikace.
- Service-role klíč nesmí být vložen do frontendových souborů ani zveřejněn v repozitáři.

## Struktura repozitáře

```text
.
├── .github/
│   └── workflows/
│       └── pages.yml
├── assets/
│   └── app-icon.png
├── supabase/
│   ├── functions/
│   │   └── sync-sklad/
│   │       └── index.ts
│   └── migrations/
│       └── 20261102205331_create_skladova_evidence.sql
├── app.js
├── index.html
├── styles.css
└── README.md
```
