import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import nodemailer from "nodemailer";
import { z } from "zod";

const logoEmail = readFileSync(
  fileURLToPath(new URL("../public/icone-help-link-email.png", import.meta.url)),
);

const contactSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(100, "O nome deve ter ate 100 caracteres."),
  email: z.string().trim().email("Informe um email valido.").max(200, "O email deve ter ate 200 caracteres."),
  message: z.string().trim().min(10, "Escreva uma mensagem com pelo menos 10 caracteres.").max(3000, "A mensagem deve ter ate 3000 caracteres."),
  website: z.string().trim().max(200).optional().default(""),
});

export async function handleContactPayload(payload) {
  const parsed = contactSchema.safeParse(payload);

  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => issue.message);

    return {
      status: 400,
      body: {
        ok: false,
        message: details[0] || "Revise os campos do formulario e tente novamente.",
        details,
      },
    };
  }

  const { name, email, message, website } = parsed.data;

  if (website) {
    return { status: 200, body: { ok: true } };
  }

  const inicio = performance.now();
  try {
    const transporter = createTransporter();
    const contactTo = process.env.CONTACT_TO || process.env.SMTP_USER;

    const envio = await transporter.sendMail({
      from: `"Help Link" <${process.env.SMTP_USER}>`,
      to: contactTo,
      replyTo: email,
      subject: `Nova mensagem de contato - ${name}`,
      text: buildTextMessage({ name, email, message }),
      html: buildHtmlMessage({ name, email, message }),
      attachments: buildEmailAttachments(),
    });

    console.info("Contato aceito pelo servidor SMTP:", {
      duracaoMs: Math.round(performance.now() - inicio),
      envelopeMs: envio.envelopeTime,
      mensagemMs: envio.messageTime,
      tamanhoBytes: envio.messageSize,
    });

    return { status: 200, body: { ok: true } };
  } catch (error) {
    // Nao registrar remetente, destinatario, mensagem ou credenciais nos logs.
    console.error("Erro ao enviar email de contato:", {
      duracaoMs: Math.round(performance.now() - inicio),
      codigo: error.code || error.name,
      comando: error.command,
      respostaSmtp: error.responseCode,
    });

    const tempoEsgotado = error.code === "ETIMEDOUT";

    return {
      status: tempoEsgotado ? 504 : 500,
      body: {
        ok: false,
        message: error instanceof EmailConfigError
          ? error.message
          : tempoEsgotado
            ? "O servidor de email demorou para responder. Nao foi possivel confirmar o envio agora."
            : "Nao foi possivel enviar a mensagem agora. Tente novamente mais tarde.",
      },
    };
  }
}

export function createTransporter() {
  const requiredEnv = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"];
  const missingEnv = requiredEnv.filter((key) => !process.env[key]);

  if (missingEnv.length > 0) {
    throw new EmailConfigError(`Variaveis SMTP ausentes: ${missingEnv.join(", ")}`);
  }

  if (process.env.SMTP_PASS === "<senha-de-app-do-gmail>") {
    throw new EmailConfigError("Configure SMTP_PASS no .env com uma senha de app do Gmail.");
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    // Evita os padroes de 2 minutos para conexao e 10 minutos de inatividade.
    dnsTimeout: 10000,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function buildTextMessage({ name, email, message }) {
  return [
    "Nova mensagem enviada pelo formulario de contato da Help Link.",
    "",
    `Nome: ${name}`,
    `Email: ${email}`,
    "",
    "Mensagem:",
    message,
  ].join("\n");
}

function buildHtmlMessage({ name, email, message }) {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replaceAll("\n", "<br>");

  return `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Nova mensagem de contato</title>
      </head>
      <body style="margin:0; padding:0; background:#268249;">
        <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
          Nova mensagem enviada pelo formulario de contato da Help Link.
        </div>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="min-width:100%; background:linear-gradient(135deg, #268249 0%, #33B868 52%, #E2F5E9 100%);">
          <tr>
            <td align="center" style="padding:48px 16px; font-family:Inter, Arial, Helvetica, sans-serif;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%; max-width:600px; background:#ffffff; border-radius:22px; box-shadow:0 24px 60px rgba(15, 23, 42, 0.22); overflow:hidden;">
                <tr>
                  <td style="padding:34px 40px 12px; text-align:center;">
                    <img src="cid:help-link-logo" width="48" height="48" alt="Help Link" style="display:block; width:48px; height:48px; margin:0 auto 10px; border:0;" />
                    <div style="font-size:18px; line-height:24px; font-weight:800; color:#0f172a; letter-spacing:0;">
                      Help <span style="color:#268249;">Link</span>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td align="center" style="padding:8px 40px 18px;">
                    <img src="cid:contact-illustration" width="260" alt="Ilustracao de contato" style="display:block; width:100%; max-width:260px; height:auto; border:0; border-radius:18px;" />
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 40px 28px; text-align:center;">
                    <p style="margin:0 0 8px; color:#268249; font-size:13px; line-height:18px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em;">
                      Nova mensagem recebida
                    </p>
                    <h1 style="margin:0; color:#0f172a; font-size:28px; line-height:36px; font-weight:800; letter-spacing:0;">
                      Alguem falou com a Help Link
                    </h1>
                    <p style="margin:14px 0 0; color:#64748b; font-size:15px; line-height:24px;">
                      Uma pessoa enviou uma solicitacao pelo formulario de contato do site. Voce pode responder diretamente este e-mail.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 40px 28px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding:16px 18px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:16px;">
                          <p style="margin:0 0 6px; color:#94A3B8; font-size:12px; line-height:16px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em;">
                            Nome
                          </p>
                          <p style="margin:0; color:#0f172a; font-size:16px; line-height:24px; font-weight:700;">
                            ${safeName}
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td height="12" style="height:12px; line-height:12px;">&nbsp;</td>
                      </tr>
                      <tr>
                        <td style="padding:16px 18px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:16px;">
                          <p style="margin:0 0 6px; color:#94A3B8; font-size:12px; line-height:16px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em;">
                            Email
                          </p>
                          <p style="margin:0; color:#268249; font-size:16px; line-height:24px; font-weight:700;">
                            <a href="mailto:${safeEmail}" style="color:#268249; text-decoration:none;">${safeEmail}</a>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 40px 38px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#E2F5E9; border:1px solid #B7E8C8; border-radius:18px;">
                      <tr>
                        <td style="padding:24px 24px 22px;">
                          <p style="margin:0 0 10px; color:#268249; font-size:12px; line-height:16px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em;">
                            Mensagem
                          </p>
                          <p style="margin:0; color:#17261E; font-size:16px; line-height:26px;">
                            ${safeMessage}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:24px 40px 30px; background:#F8FAFC; border-top:1px solid #E2E8F0;">
                    <p style="margin:0 0 10px; color:#475569; font-size:14px; line-height:22px;">
                      Este email foi gerado automaticamente a partir do formulario de contato da Help Link.
                    </p>
                    <p style="margin:0; color:#94A3B8; font-size:12px; line-height:20px;">
                      Para continuar a conversa, responda esta mensagem. O endereco do visitante ja esta configurado como Reply-To.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:22px 0 0; color:#E2F5E9; font-size:12px; line-height:18px; font-family:Inter, Arial, Helvetica, sans-serif;">
                Help Link &copy; ${new Date().getFullYear()} - Conectando pessoas e ONGs.
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function buildEmailAttachments() {
  return [
    {
      filename: "help-link-logo.png",
      content: logoEmail,
      contentType: "image/png",
      cid: "help-link-logo",
    },
    {
      filename: "contact-illustration.svg",
      content: buildContactIllustrationSvg(),
      contentType: "image/svg+xml",
      cid: "contact-illustration",
    },
  ];
}

function buildContactIllustrationSvg() {
  return `
    <svg width="520" height="300" viewBox="0 0 520 300" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="520" height="300" rx="34" fill="#F8FAFC"/>
      <circle cx="92" cy="70" r="34" fill="#E2F5E9"/>
      <circle cx="435" cy="76" r="46" fill="#F4F1EC"/>
      <circle cx="426" cy="218" r="28" fill="#E2F5E9"/>
      <path d="M156 87H364C383.882 87 400 103.118 400 123V185C400 204.882 383.882 221 364 221H222L172 252V221H156C136.118 221 120 204.882 120 185V123C120 103.118 136.118 87 156 87Z" fill="white" stroke="#268249" stroke-width="8" stroke-linejoin="round"/>
      <path d="M166 137H352" stroke="#8FDBAA" stroke-width="10" stroke-linecap="round"/>
      <path d="M166 166H304" stroke="#B7E8C8" stroke-width="10" stroke-linecap="round"/>
      <path d="M166 195H256" stroke="#D7F3E1" stroke-width="10" stroke-linecap="round"/>
      <circle cx="378" cy="86" r="42" fill="#268249"/>
      <path d="M359 86L373 100L398 72" stroke="white" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M86 211C107.5 182 132.5 178.5 154 200" stroke="#33B868" stroke-width="8" stroke-linecap="round"/>
      <path d="M410 162C431 142 453 145 470 166" stroke="#33B868" stroke-width="8" stroke-linecap="round"/>
      <path d="M84 117L103 136L130 101" stroke="#268249" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M431 241L449 259L475 225" stroke="#268249" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

class EmailConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "EmailConfigError";
  }
}
