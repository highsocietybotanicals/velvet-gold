import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const COLISSIMO_API_URL =
  "https://ws.colissimo.fr/sls-ws/SlsServiceWSRest/2.0/generateLabel";

const SENDER = {
  companyName: "High Society Botanicals",
  line2: "44390 Puceul",
  countryCode: "FR",
  city: "Puceul",
  zipCode: "44390",
};

function parseAddress(raw: string): {
  line2: string;
  zipCode: string;
  city: string;
} {
  // Try to extract zip + city from last line (e.g. "44390 Puceul")
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  let zipCode = "";
  let city = "";
  let addressLines: string[] = [];

  for (let i = lines.length - 1; i >= 0; i--) {
    const match = lines[i].match(/^(\d{5})\s+(.+)$/);
    if (match) {
      zipCode = match[1];
      city = match[2];
      addressLines = lines.slice(0, i);
      break;
    }
  }

  // Fallback: try comma-separated format "123 rue X, 44390 Puceul"
  if (!zipCode) {
    const commaMatch = raw.match(/(\d{5})\s+([^,\n]+)/);
    if (commaMatch) {
      zipCode = commaMatch[1];
      city = commaMatch[2].trim();
      addressLines = [raw.replace(/,?\s*\d{5}\s+[^,\n]+/, "").trim()];
    } else {
      addressLines = lines;
    }
  }

  return {
    line2: addressLines.join(", ") || raw,
    zipCode,
    city,
  };
}

/**
 * Parse multipart response from Colissimo.
 * The response is multipart/mixed with a JSON part and a PDF part.
 */
function parseMultipartResponse(
  body: Uint8Array,
  contentType: string
): { jsonPart: any; pdfBase64: string } {
  const text = new TextDecoder().decode(body);
  
  // If empty body, return error info
  if (!text || text.trim() === "") {
    return { jsonPart: { messages: [{ type: "ERROR", messageContent: "Empty response from Colissimo API" }] }, pdfBase64: "" };
  }

  const boundaryMatch = contentType.match(/boundary="?([^";\s]+)"?/);
  if (!boundaryMatch) {
    // Not multipart — try plain JSON
    try {
      return { jsonPart: JSON.parse(text), pdfBase64: "" };
    } catch {
      console.error("Non-JSON response from Colissimo:", text.substring(0, 500));
      return { jsonPart: { messages: [{ type: "ERROR", messageContent: `Colissimo returned non-JSON: ${text.substring(0, 200)}` }] }, pdfBase64: "" };
    }
  }

  const boundary = boundaryMatch[1];
  const bodyStr = new TextDecoder("latin1").decode(body);
  const parts = bodyStr.split("--" + boundary);

  let jsonPart: any = null;
  let pdfBase64 = "";

  for (const part of parts) {
    if (part.trim() === "" || part.trim() === "--") continue;

    const headerEnd = part.indexOf("\r\n\r\n");
    if (headerEnd === -1) continue;

    const headers = part.substring(0, headerEnd).toLowerCase();
    const content = part.substring(headerEnd + 4);

    if (headers.includes("application/json")) {
      // Remove trailing boundary artifacts
      const cleanJson = content.replace(/\r\n--.*$/s, "").trim();
      jsonPart = JSON.parse(cleanJson);
    } else if (
      headers.includes("application/pdf") ||
      headers.includes("application/octet-stream")
    ) {
      // Find the PDF binary in the raw bytes
      const headerEndBytes = findSequence(
        body,
        new TextEncoder().encode("\r\n\r\n"),
        body.indexOf(0x25) > 0 ? 0 : undefined
      );
      // Re-extract PDF from raw bytes for binary accuracy
      const pdfStartMarker = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF
      const pdfStart = findSequence(body, pdfStartMarker);
      if (pdfStart >= 0) {
        // Find the end boundary after the PDF start
        const endBoundary = new TextEncoder().encode("\r\n--" + boundary);
        let pdfEnd = findSequence(body, endBoundary, pdfStart);
        if (pdfEnd === -1) pdfEnd = body.length;
        const pdfBytes = body.slice(pdfStart, pdfEnd);
        pdfBase64 = btoa(
          String.fromCharCode(...pdfBytes)
        );
      }
    }
  }

  return { jsonPart, pdfBase64 };
}

function findSequence(
  arr: Uint8Array,
  seq: Uint8Array,
  startFrom = 0
): number {
  for (let i = startFrom; i <= arr.length - seq.length; i++) {
    let found = true;
    for (let j = 0; j < seq.length; j++) {
      if (arr[i + j] !== seq[j]) {
        found = false;
        break;
      }
    }
    if (found) return i;
  }
  return -1;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "Missing orderId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If already has tracking, return existing
    if (order.tracking_number) {
      return new Response(
        JSON.stringify({
          success: true,
          trackingNumber: order.tracking_number,
          trackingUrl: order.tracking_url,
          alreadyGenerated: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get recipient info
    let recipientName = order.guest_name || "Client";
    let recipientPhone = order.contact_phone || order.guest_phone || "";
    let recipientEmail = order.guest_email || "";

    if (order.user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name, phone")
        .eq("id", order.user_id)
        .single();
      if (profile) {
        recipientName = profile.full_name || recipientName;
        recipientEmail = profile.email || recipientEmail;
        recipientPhone = profile.phone || recipientPhone;
      }
    }

    const address = parseAddress(order.delivery_address || "");

    // Calculate weight in kg (minimum 0.1)
    const weightKg = Math.max(0.1, (order.total_flower_weight || 0) / 1000);

    const contractNumber = Deno.env.get("COLISSIMO_CONTRACT_NUMBER")!;
    const password = Deno.env.get("COLISSIMO_PASSWORD")!;

    const labelRequest = {
      contractNumber,
      password,
      outputFormat: {
        x: 0,
        y: 0,
        outputPrintingType: "PDF_10x15_300dpi",
      },
      letter: {
        service: {
          productCode: "DOM",
          depositDate: new Date().toISOString().split("T")[0],
          totalAmount: Math.round(order.total_amount * 100), // in cents
        },
        parcel: {
          weight: weightKg,
        },
        sender: {
          address: {
            companyName: SENDER.companyName,
            line2: SENDER.line2,
            countryCode: SENDER.countryCode,
            city: SENDER.city,
            zipCode: SENDER.zipCode,
          },
        },
        addressee: {
          address: {
            lastName: recipientName,
            line2: address.line2,
            countryCode: "FR",
            city: address.city,
            zipCode: address.zipCode,
            phone: recipientPhone.replace(/\s/g, ""),
            email: recipientEmail,
          },
        },
      },
    };

    const jsonPayload = JSON.stringify(labelRequest);
    console.log("Calling Colissimo API for order:", orderId);
    console.log("Label request payload:", jsonPayload);

    // Use native FormData with Blob to let Deno generate correct multipart boundary
    const form = new FormData();
    form.append(
      "generateLabelRequest",
      new Blob([jsonPayload], { type: "application/json" }),
      "generateLabelRequest.json"
    );

    // Do NOT set Content-Type manually — fetch auto-generates it with correct boundary
    const colissimoResponse = await fetch(COLISSIMO_API_URL, {
      method: "POST",
      body: form,
    });

    const responseBody = new Uint8Array(await colissimoResponse.arrayBuffer());
    const responseContentType = colissimoResponse.headers.get("content-type") || "";

    console.log("Colissimo response status:", colissimoResponse.status, "content-type:", responseContentType);

    const { jsonPart, pdfBase64 } = parseMultipartResponse(
      responseBody,
      responseContentType
    );

    console.log("Colissimo JSON response:", JSON.stringify(jsonPart));

    // Check for errors
    if (jsonPart?.messages?.length > 0) {
      const errorMessages = jsonPart.messages.filter(
        (m: any) => m.type === "ERROR"
      );
      if (errorMessages.length > 0) {
        console.error("Colissimo errors:", errorMessages);
        return new Response(
          JSON.stringify({
            error: "Colissimo API error",
            details: errorMessages.map((m: any) => m.messageContent).join(", "),
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const trackingNumber =
      jsonPart?.labelV2Response?.parcelNumber ||
      jsonPart?.labelResponse?.parcelNumber ||
      jsonPart?.parcelNumber ||
      "";

    if (!trackingNumber) {
      console.error("No tracking number in response:", jsonPart);
      return new Response(
        JSON.stringify({ error: "No tracking number returned by Colissimo" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const trackingUrl = `https://www.laposte.fr/outils/suivre-vos-envois?code=${trackingNumber}`;

    // Update order with tracking info and set status to shipped
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        tracking_number: trackingNumber,
        tracking_url: trackingUrl,
        status: "shipped",
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Error updating order:", updateError);
    }

    // Send status update email (fire-and-forget)
    supabase.functions
      .invoke("send-status-update-email", {
        body: { orderId, newStatus: "shipped" },
      })
      .catch((e: any) => console.error("Status email error:", e));

    console.log(`Colissimo label generated for order ${orderId}: ${trackingNumber}`);

    return new Response(
      JSON.stringify({
        success: true,
        trackingNumber,
        trackingUrl,
        pdfBase64,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Generate Colissimo label error:", error);
    return new Response(
      JSON.stringify({ error: "Internal error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
