import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = "mailto:admin@axara.id";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function cryptoKeyFromRaw(rawB64url: string): Promise<CryptoKey> {
  const raw = base64UrlToBytes(rawB64url);
  return crypto.subtle.importKey("raw", raw, { name: "ECDSA", namedCurve: "P-256" }, true, ["sign"]);
}

async function importVapidPrivateKey(b64url: string): Promise<CryptoKey> {
  const rawPrivate = base64UrlToBytes(b64url);
  const rawPublic = base64UrlToBytes(VAPID_PUBLIC_KEY);

  const jwk = {
    kty: "EC",
    crv: "P-256",
    x: bytesToBase64Url(rawPublic.slice(1, 33)),
    y: bytesToBase64Url(rawPublic.slice(33, 65)),
    d: bytesToBase64Url(rawPrivate),
  };

  return crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, true, ["sign"]);
}

function base64UrlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(b64 + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function createVapidAuthHeader(audience: string): Promise<{ authorization: string; cryptoKey: string }> {
  const now = Math.floor(Date.now() / 1000);
  const header = { typ: "JWT", alg: "ES256" };
  const payload = { aud: audience, exp: now + 12 * 3600, sub: VAPID_SUBJECT };

  const encodedHeader = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const privateKey = await importVapidPrivateKey(VAPID_PRIVATE_KEY);
  const signature = new Uint8Array(
    await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      privateKey,
      new TextEncoder().encode(unsignedToken)
    )
  );

  const token = `${unsignedToken}.${bytesToBase64Url(signature)}`;

  return {
    authorization: `vapid t=${token}, k=${VAPID_PUBLIC_KEY}`,
    cryptoKey: `p256ecdsa=${VAPID_PUBLIC_KEY}`,
  };
}

async function generateEncryptionKeys() {
  const localKeys = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { localKeys, salt };
}

async function encryptPayload(
  subscription: { endpoint: string; keys_p256dh: string; keys_auth: string },
  payload: string
): Promise<{ body: Uint8Array; headers: Record<string, string> }> {
  const clientPublicKey = base64UrlToBytes(subscription.keys_p256dh);
  const clientAuth = base64UrlToBytes(subscription.keys_auth);

  const { localKeys, salt } = await generateEncryptionKeys();
  const localPublicKeyRaw = new Uint8Array(await crypto.subtle.exportKey("raw", localKeys.publicKey!));

  const clientCryptoKey = await crypto.subtle.importKey(
    "raw", clientPublicKey, { name: "ECDH", namedCurve: "P-256" }, false, []
  );

  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: clientCryptoKey },
      localKeys.privateKey!,
      256
    )
  );

  const encoder = new TextEncoder();

  async function hkdfDerive(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
    const key = await crypto.subtle.importKey("raw", ikm, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const prk = new Uint8Array(await crypto.subtle.sign("HMAC", key, salt));
    const prkKey = await crypto.subtle.importKey("raw", prk, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const infoWithCounter = new Uint8Array([...info, 1]);
    const okm = new Uint8Array(await crypto.subtle.sign("HMAC", prkKey, infoWithCounter));
    return okm.slice(0, length);
  }

  const authInfo = encoder.encode("Content-Encoding: auth\0");
  const prkCombine = await hkdfDerive(clientAuth, sharedSecret, authInfo, 32);

  const context = new Uint8Array([
    ...encoder.encode("P-256\0"),
    0, 65, ...clientPublicKey,
    0, 65, ...localPublicKeyRaw,
  ]);

  const nonceInfo = new Uint8Array([...encoder.encode("Content-Encoding: nonce\0"), ...context]);
  const cekInfo = new Uint8Array([...encoder.encode("Content-Encoding: aesgcm\0"), ...context]);

  const nonce = await hkdfDerive(salt, prkCombine, nonceInfo, 12);
  const cek = await hkdfDerive(salt, prkCombine, cekInfo, 16);

  const paddedPayload = new Uint8Array([0, 0, ...encoder.encode(payload)]);

  const encKey = await crypto.subtle.importKey("raw", cek, { name: "AES-GCM" }, false, ["encrypt"]);
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, encKey, paddedPayload)
  );

  return {
    body: encrypted,
    headers: {
      "Encryption": `salt=${bytesToBase64Url(salt)}`,
      "Crypto-Key": `dh=${bytesToBase64Url(localPublicKeyRaw)}`,
      "Content-Encoding": "aesgcm",
    },
  };
}

async function sendPushToSubscription(
  subscription: { endpoint: string; keys_p256dh: string; keys_auth: string },
  payload: object
): Promise<{ success: boolean; status: number; endpoint: string }> {
  const payloadStr = JSON.stringify(payload);
  const { body, headers: encHeaders } = await encryptPayload(subscription, payloadStr);

  const url = new URL(subscription.endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const vapidHeaders = await createVapidAuthHeader(audience);

  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      ...encHeaders,
      "Authorization": vapidHeaders.authorization,
      "Crypto-Key": `${encHeaders["Crypto-Key"]};${vapidHeaders.cryptoKey}`,
      "Content-Type": "application/octet-stream",
      "TTL": "86400",
    },
    body,
  });

  return { success: response.status >= 200 && response.status < 300, status: response.status, endpoint: subscription.endpoint };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST", "Access-Control-Allow-Headers": "Content-Type, Authorization" } });
  }

  try {
    const { title, body, page, target_emails, queue_id } = await req.json();

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let query = supabase.from("push_subscriptions").select("endpoint, keys_p256dh, keys_auth");
    if (target_emails && target_emails.length > 0) {
      query = query.in("user_email", target_emails);
    }
    const { data: subscriptions, error } = await query;

    if (error) throw error;
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No subscriptions found" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const payload = { 
      title: title || "Axara LMS", 
      body: body || "", 
      page: page || "sop",
      unreadCount: 1 // Trigger app icon badge
    };

    const results = await Promise.allSettled(
      subscriptions.map((sub) => sendPushToSubscription(sub, payload))
    );

    const staleEndpoints: string[] = [];
    let sent = 0;

    for (const result of results) {
      if (result.status === "fulfilled") {
        if (result.value.success) sent++;
        if (result.value.status === 410 || result.value.status === 404) {
          staleEndpoints.push(result.value.endpoint);
        }
      }
    }

    if (staleEndpoints.length > 0) {
      await supabase.from("push_subscriptions").delete().in("endpoint", staleEndpoints);
    }

    if (queue_id) {
      await supabase.from("push_queue").update({ sent: true }).eq("id", queue_id);
    }

    return new Response(
      JSON.stringify({ sent, total: subscriptions.length, staleRemoved: staleEndpoints.length }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
