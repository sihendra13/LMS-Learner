import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SENDER_EMAIL = "noreply@myaxara.com";
const SENDER_NAME = "Axara LMS";
const ADMIN_URL = "https://axara-lms.pages.dev";

async function sendEmail(to: { email: string; name: string }, subject: string, html: string) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": BREVO_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [to],
      subject,
      htmlContent: html,
    }),
  });
  return res.ok;
}

function buildEmailHtml(
  learnerName: string,
  dept: string,
  videoTitle: string,
  postScore: number,
  status: string,
  retakeCount: number,
  maxRetakes: number,
  employeeEmail: string,
) {
  const isPassed = status === "Lulus";
  const isTidakLulus = !isPassed && retakeCount >= maxRetakes;
  const isRemedial = !isPassed && !isTidakLulus;

  const statusColor = isPassed ? "#16a34a" : isTidakLulus ? "#dc2626" : "#ea580c";
  const statusBg = isPassed ? "#f0fdf4" : isTidakLulus ? "#fef2f2" : "#fff7ed";
  const statusBorder = isPassed ? "#86efac" : isTidakLulus ? "#fecaca" : "#fed7aa";
  const statusLabel = isPassed
    ? "✅ LULUS"
    : isTidakLulus
    ? "❌ TIDAK LULUS (Batas remedial tercapai)"
    : `⚠️ REMEDIAL ke-${retakeCount} dari ${maxRetakes}`;
  const statusDesc = isPassed
    ? "Karyawan berhasil menyelesaikan pelatihan. Silakan terbitkan sertifikatnya."
    : isTidakLulus
    ? "Karyawan telah mencapai batas maksimal remedial. Diperlukan tindak lanjut dari HRD."
    : `Karyawan perlu mengulang kuis. Sisa kesempatan: ${maxRetakes - retakeCount}x.`;

  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1e3a5f 0%, #002D72 100%); color: white; padding: 28px 32px; border-radius: 12px 12px 0 0;">
        <div style="font-size: 12px; opacity: 0.65; margin-bottom: 6px; letter-spacing: 1px; text-transform: uppercase;">Axara LMS · Notifikasi Admin</div>
        <h2 style="margin: 0; font-size: 20px; font-weight: 700;">📋 Hasil Kuis Training Karyawan</h2>
      </div>

      <!-- Body -->
      <div style="padding: 28px 32px; background: white; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="margin: 0 0 20px; font-size: 15px; color: #374151;">
          Karyawan berikut telah menyelesaikan kuis SOP dan membutuhkan tindak lanjut Anda:
        </p>

        <!-- Karyawan Info -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 20px; margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; font-weight: 600; width: 140px;">Nama Karyawan</td>
              <td style="padding: 6px 0; font-size: 14px; color: #0f172a; font-weight: 700;">${learnerName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; font-weight: 600;">Email</td>
              <td style="padding: 6px 0; font-size: 14px; color: #374151;">${employeeEmail || "-"}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; font-weight: 600;">Divisi</td>
              <td style="padding: 6px 0; font-size: 14px; color: #374151;">${dept}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; font-weight: 600;">SOP / Training</td>
              <td style="padding: 6px 0; font-size: 14px; color: #374151; font-weight: 600;">${videoTitle}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; font-weight: 600;">Skor</td>
              <td style="padding: 6px 0; font-size: 22px; font-weight: 800; color: ${statusColor};">${postScore}%</td>
            </tr>
          </table>
        </div>

        <!-- Status Badge -->
        <div style="background: ${statusBg}; border: 1.5px solid ${statusBorder}; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px;">
          <div style="font-size: 15px; font-weight: 700; color: ${statusColor}; margin-bottom: 6px;">${statusLabel}</div>
          <div style="font-size: 13px; color: #374151;">${statusDesc}</div>
        </div>

        <!-- CTA -->
        <div style="text-align: center; margin-top: 8px;">
          <a href="${ADMIN_URL}" style="background: #002D72; color: white; padding: 13px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">
            Buka LMS Admin →
          </a>
        </div>

        <p style="margin: 24px 0 0; font-size: 12px; color: #9ca3af; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          Email ini dikirim otomatis oleh Axara LMS · <a href="${ADMIN_URL}" style="color: #3b82f6;">axara-lms.pages.dev</a>
        </p>
      </div>
    </div>
  `;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const {
      learnerName,
      learnerEmail,
      dept,
      videoTitle,
      postScore,
      status,
      retakeCount = 0,
      maxRetakes = 3,
    } = await req.json();

    if (!learnerName || !videoTitle || postScore === undefined || !status) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Ambil semua admin dari tabel users
    const { data: admins, error } = await supabase
      .from("users")
      .select("email, name")
      .eq("role", "admin");

    if (error) throw error;

    const targets = admins && admins.length > 0
      ? admins
      : [{ email: "kontesku1374@gmail.com", name: "Admin" }]; // fallback hardcoded

    const isPassed = status === "Lulus";
    const isTidakLulus = !isPassed && retakeCount >= maxRetakes;
    const subjectStatus = isPassed ? "✅ LULUS" : isTidakLulus ? "❌ TIDAK LULUS" : `⚠️ Remedial ke-${retakeCount}`;
    const subject = `[LMS] ${learnerName} — ${subjectStatus} · ${videoTitle}`;

    const html = buildEmailHtml(learnerName, dept, videoTitle, postScore, status, retakeCount, maxRetakes, learnerEmail || "");

    let sent = 0;
    for (const admin of targets) {
      if (!admin.email) continue;
      const ok = await sendEmail({ email: admin.email, name: admin.name || "Admin" }, subject, html);
      if (ok) sent++;
    }

    return new Response(JSON.stringify({ sent, total: targets.length }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
