import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-access-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

const expectedItems = [
  ["SUZUKI YFA",22,"6048"],
  ["VW MQB A0",22,"6076"],["PSA R8",22,"1801"],["PSA X74",22,"6115"],
  ["TOYOTA 713W",22,"6107"],["TOYOTA 714W",22,"6108"],["TOYOTA COROLA ",22,"6094"],
  ["TOYOTA YARIS",22,"1894"],["TOYOTA YARIS",22,"1895"],["TMUK/TPCE 982A",22,"6055"],
  ["PSA C3",22,"6199"],["PSA C3",22,"6217"],["PSA C3",22,"6332"],
  ["TMMT 147B",22,"6063"],["TOYOTA AURIS",22,"6100"],["TMUK/TPCE 870A",22,"6051"],
  ["TOYOTA AURIS",22,"6099"],["NISSAN X12L",22,"6050"],["NISSAN AM",22,"1624"],
  ["VW GOLF V",22,"6195"],["VW POLO",22,"1457"],["VW GOLF V NEW",22,"6323"],
  ["VW POLO NEW",22,"6326"],["RENAULT Megane IV",22,"6143"],["RENAULT Megane 2016",22,"6147"],
  ["TOYOTA VERSO/AURIS",22,"6269"],["TOYOTA AURIS",22,"6320"],["TOYOTA AYGO",20,"6126"],
  ["TOYOTA AYGO NEW",20,"6330"],["RENAULT X07 EDISON",20,"6135"],["RENAULT X07 EDISON",20,"6132"],
  ["NISSAN B02E",20,"6064"],["NISSAN B02E",20,"6069"],["BRABUS",20,"1797"],
  ["BRABUS",20,"1798"],["TOYOTA B3/B4",18,"6043"],["IF001 - Fiat Punto",20,"0975"],
  ["IF002 - Fiat Punto",20,"1460"],["RF026 - Dacia Logan",20,"1656"],["RF027 - Dacia Logan",20,"1657"],
  ["SUZUKI        YM6",18,"1258"],["RENAULT      X44",20,"0016"],["SUZUKI YY1 short",20,"0036"],
  ["RENAULT X44 RS",20,"0037"],["SUZUKI YAA",20,"6032"],["TOYOTA B0",18,"0017"],
  ["RENAULT X44",20,"6036"],["SUZUKI YY1 L",20,"0015"],["TOYOTA CAMRY",22,"6088"],
  ["TOYOTA RAV4",22,"6101"]
];

function validateItems(value: unknown) {
  if (!Array.isArray(value) || value.length !== expectedItems.length) return false;
  return value.every((item, i) => {
    if (!item || typeof item !== "object") return false;
    const row = item as Record<string, unknown>;
    const expected = expectedItems[i];
    return row.name === expected[0] &&
      row.diameter === expected[1] &&
      row.reference === expected[2] &&
      (row.quantity === null || (Number.isInteger(row.quantity) && (row.quantity as number) >= 0));
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET" && req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const accessKey = Deno.env.get("APP_ACCESS_KEY");
  const suppliedKey = req.headers.get("x-access-key");
  if (!accessKey || !suppliedKey || suppliedKey.length !== accessKey.length) {
    return json({ error: "Neplatný přístupový klíč." }, 401);
  }
  let matches = false;
  try {
    const a = new TextEncoder().encode(accessKey);
    const b = new TextEncoder().encode(suppliedKey);
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
    matches = diff === 0;
  } catch { matches = false; }
  if (!matches) return json({ error: "Neplatný přístupový klíč." }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const secretJson = Deno.env.get("SUPABASE_SECRET_KEYS");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
    (secretJson ? JSON.parse(secretJson).default : undefined);
  if (!supabaseUrl || !serviceKey) return json({ error: "Server není nakonfigurován." }, 500);

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  if (req.method === "GET") {
    const { data, error } = await supabase.from("skladova_evidence")
      .select("items, updated_at").eq("id", 1).maybeSingle();
    if (error) return json({ error: "Chyba při načítání dat." }, 500);
    return json({ items: data?.items ?? null, updated_at: data?.updated_at ?? null });
  }

  let body: unknown;
  try { body = await req.json(); } catch { return json({ error: "Neplatný JSON." }, 400); }
  const items = (body as Record<string, unknown> | null)?.items;
  if (!validateItems(items)) return json({ error: "Data neodpovídají očekávané struktuře 50 položek." }, 400);

  const { data, error } = await supabase.from("skladova_evidence").upsert({
    id: 1, items, updated_at: new Date().toISOString()
  }).select("updated_at").single();
  if (error) return json({ error: "Chyba při ukládání dat." }, 500);
  return json({ success: true, updated_at: data.updated_at });
});
