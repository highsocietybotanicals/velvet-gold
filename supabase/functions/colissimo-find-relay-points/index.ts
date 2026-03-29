import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const COLISSIMO_RELAY_URL =
  "https://ws.colissimo.fr/pointretrait-ws-cxf/rest/v2/pointretrait/findRDVPointRetraitAcheminement";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { postalCode } = await req.json();

    // Validate postal code (5 digits)
    if (!postalCode || !/^\d{5}$/.test(postalCode)) {
      return new Response(
        JSON.stringify({ error: "Code postal invalide (5 chiffres requis)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contractNumber = Deno.env.get("COLISSIMO_CONTRACT_NUMBER");
    if (!contractNumber) {
      return new Response(
        JSON.stringify({ error: "Configuration Colissimo manquante" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const password = Deno.env.get("COLISSIMO_PASSWORD");
    if (!password) {
      return new Response(
        JSON.stringify({ error: "Mot de passe Colissimo manquant" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = {
      accountNumber: contractNumber,
      password: password,
      codTiersPour498: "",
      countryCode: "FR",
      zipCode: postalCode,
      city: "",
      weight: "500",
      filterRelay: "1",
      requestId: crypto.randomUUID(),
      lang: "FR",
      optionInter: "0",
    };

    console.log("Calling Colissimo relay API for postal code:", postalCode);

    const response = await fetch(COLISSIMO_RELAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error("Colissimo returned non-JSON:", responseText.substring(0, 200));
      return new Response(
        JSON.stringify({ error: "L'API Colissimo a retourné une réponse invalide", points: [] }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!response.ok) {
      console.error("Colissimo relay API error:", response.status, data);
      return new Response(
        JSON.stringify({ error: "Erreur API Colissimo", details: data }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (data.errorCode && data.errorCode !== 0) {
      console.error("Colissimo relay error:", data.errorCode, data.errorMessage);
      return new Response(
        JSON.stringify({ error: data.errorMessage || "Erreur Colissimo", points: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract relay points from response
    const rawPoints = data.listePointRetraitAchworking || [];
    const points = rawPoints.map((p: any) => ({
      id: p.identifiant,
      name: p.nom,
      address: `${p.adresse1 || ""} ${p.adresse2 || ""}`.trim(),
      postalCode: p.codePostal,
      city: p.localite,
      type: p.typeDePoint,
      distance: p.distanceEnMetre,
      openingHours: {
        monday: p.horairesOuvertureLundi || "",
        tuesday: p.horairesOuvertureMardi || "",
        wednesday: p.horairesOuvertureMercredi || "",
        thursday: p.horairesOuvertureJeudi || "",
        friday: p.horairesOuvertureVendredi || "",
        saturday: p.horairesOuvertureSamedi || "",
        sunday: p.horairesOuvertureDimanche || "",
      },
    }));

    console.log(`Found ${points.length} relay points for ${postalCode}`);

    return new Response(
      JSON.stringify({ points }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Colissimo relay error:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
