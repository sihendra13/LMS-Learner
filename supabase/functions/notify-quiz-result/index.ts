import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SENDER_EMAIL = "noreply@myaxara.com";
const SENDER_NAME = "Axara LMS";

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
  nik: string,
  jabatan: string,
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

  const statusColor  = isPassed ? "#16a34a" : isTidakLulus ? "#dc2626" : "#ea580c";
  const statusBg     = isPassed ? "#f0fdf4"  : isTidakLulus ? "#fef2f2"  : "#fff7ed";
  const statusBorder = isPassed ? "#86efac"  : isTidakLulus ? "#fecaca"  : "#fed7aa";
  const statusLabel  = isPassed
    ? "LULUS ✅"
    : isTidakLulus
    ? "TIDAK LULUS ❌  —  Batas remedial tercapai"
    : `REMEDIAL ke-${retakeCount} dari ${maxRetakes} ⚠️`;
  const statusNote = isPassed
    ? "Karyawan telah memenuhi standar kompetensi yang ditetapkan."
    : isTidakLulus
    ? "Karyawan telah menggunakan seluruh kesempatan remedial. Diperlukan evaluasi dan tindak lanjut lebih lanjut."
    : `Karyawan perlu mengulang kuis. Sisa kesempatan remedial: ${maxRetakes - retakeCount}x.`;

  const percobaan = retakeCount === 0
    ? "1 (pertama)"
    : `${retakeCount + 1} (remedial ke-${retakeCount})`;

  const now = new Date().toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const row = (label: string, value: string, bold = false) => `
    <tr>
      <td style="padding: 6px 0; font-size: 13px; color: #64748b; width: 150px; vertical-align: top;">${label}</td>
      <td style="padding: 6px 0; font-size: 13px; color: ${bold ? "#0f172a" : "#374151"}; font-weight: ${bold ? "700" : "400"}; vertical-align: top;">: ${value}</td>
    </tr>`;

  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb;">

      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1e3a5f 0%, #002D72 100%); color: white; padding: 28px 32px; border-radius: 12px 12px 0 0;">
        <div style="font-size: 11px; opacity: 0.6; margin-bottom: 6px; letter-spacing: 1.2px; text-transform: uppercase;">Laporan Hasil Training · Axara LMS</div>
        <h2 style="margin: 0; font-size: 20px; font-weight: 700; line-height: 1.3;">📋 Hasil Kuis SOP Karyawan</h2>
        <div style="font-size: 12px; opacity: 0.55; margin-top: 8px;">${now} WIB</div>
      </div>

      <!-- Body -->
      <div style="padding: 28px 32px; background: white; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">

        <p style="margin: 0 0 20px; font-size: 14px; color: #374151; line-height: 1.6;">
          Berikut adalah laporan hasil kuis pelatihan SOP. Email ini dapat diteruskan kepada atasan atau pihak terkait.
        </p>

        <!-- Data Peserta -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 22px; margin-bottom: 16px;">
          <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Data Peserta</div>
          <table style="width: 100%; border-collapse: collapse;">
            ${row("Nama", learnerName, true)}
            ${row("NIK", nik || "-")}
            ${row("Email", employeeEmail || "-")}
            ${row("Jabatan", jabatan || "-")}
            ${row("Departemen", dept || "-")}
          </table>
        </div>

        <!-- Data Training -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 22px; margin-bottom: 16px;">
          <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Data Training</div>
          <table style="width: 100%; border-collapse: collapse;">
            ${row("Modul SOP", videoTitle, true)}
            ${row("Percobaan ke-", percobaan)}
            <tr>
              <td style="padding: 6px 0; font-size: 13px; color: #64748b; width: 150px;">Skor Akhir</td>
              <td style="padding: 6px 0; font-size: 22px; font-weight: 800; color: ${statusColor};">: ${postScore}%</td>
            </tr>
          </table>
        </div>

        <!-- Status -->
        <div style="background: ${statusBg}; border: 1.5px solid ${statusBorder}; border-radius: 10px; padding: 18px 22px; margin-bottom: 24px;">
          <div style="font-size: 15px; font-weight: 800; color: ${statusColor}; margin-bottom: 6px;">${statusLabel}</div>
          <div style="font-size: 13px; color: #374151; line-height: 1.5;">${statusNote}</div>
        </div>

        <!-- Footer -->
        <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.6; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          Email ini dikirim otomatis oleh sistem <strong>Axara LMS</strong> saat karyawan menyelesaikan kuis pelatihan.
          Dapat diteruskan kepada atasan, GM, atau Direksi sebagai dokumen laporan resmi.
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
      nik,
      jabatan,
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
      : [{ email: "kontesku1374@gmail.com", name: "Admin" }];

    const isPassed = status === "Lulus";
    const isTidakLulus = !isPassed && retakeCount >= maxRetakes;
    const subjectStatus = isPassed ? "✅ LULUS" : isTidakLulus ? "❌ TIDAK LULUS" : `⚠️ Remedial ke-${retakeCount}`;
    const subject = `[LMS] ${learnerName} — ${subjectStatus} · ${videoTitle}`;

    const html = buildEmailHtml(
      learnerName, nik || "", jabatan || "", dept, videoTitle,
      postScore, status, retakeCount, maxRetakes, learnerEmail || ""
    );

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
