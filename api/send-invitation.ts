// api/send-invitation.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const allowCors =
  (fn: any) => async (req: VercelRequest, res: VercelResponse) => {
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,OPTIONS,PATCH,DELETE,POST,PUT"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
    );

    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }

    return await fn(req, res);
  };

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      to_email,
      to_name,
      from_name,
      workspace_name,
      invitation_link,
      role,
    } = req.body;

    if (!to_email || !from_name || !workspace_name || !invitation_link) {
      return res.status(400).json({ error: "필수 필드가 누락되었습니다." });
    }

    const roleLabels = {
      owner: "소유자",
      admin: "관리자",
      member: "멤버",
      viewer: "뷰어",
    };
    const roleLabel = roleLabels[role] || role;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
              line-height: 1.6;
              color: #1f2937;
              background-color: #f9fafb;
              padding: 40px 20px;
            }
            .container {
              max-width: 560px;
              margin: 0 auto;
              background: #ffffff;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              overflow: hidden;
            }
            .header {
              padding: 32px 32px 24px;
              border-bottom: 1px solid #e5e7eb;
            }
            .logo {
              font-size: 20px;
              font-weight: 600;
              color: #111827;
              margin-bottom: 8px;
            }
            .subtitle { font-size: 14px; color: #6b7280; }
            .content { padding: 32px; }
            .greeting {
              font-size: 15px;
              color: #374151;
              margin-bottom: 24px;
            }
            .workspace-card {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              padding: 20px;
              margin: 24px 0;
            }
            .workspace-name {
              font-size: 18px;
              font-weight: 600;
              color: #111827;
              margin-bottom: 8px;
            }
            .workspace-role { font-size: 13px; color: #6b7280; }
            .button {
              display: inline-block;
              background: #111827;
              color: #ffffff;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 500;
              margin: 24px 0;
            }
            .info-box {
              background: #f9fafb;
              border-left: 2px solid #d1d5db;
              padding: 16px;
              margin: 24px 0;
              border-radius: 4px;
            }
            .info-title {
              font-size: 13px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 8px;
            }
            .info-list {
              font-size: 13px;
              color: #6b7280;
              line-height: 1.8;
              margin: 0;
              padding-left: 18px;
            }
            .footer {
              padding: 24px 32px;
              background: #f9fafb;
              border-top: 1px solid #e5e7eb;
              font-size: 12px;
              color: #9ca3af;
              text-align: center;
            }
            .link {
              color: #111827;
              text-decoration: none;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">📦 재고관리</div>
              <div class="subtitle">워크스페이스 초대</div>
            </div>
            
            <div class="content">
              <div class="greeting">
                안녕하세요 <strong>${to_name || to_email}</strong>님,<br><br>
                <strong>${from_name}</strong>님이 워크스페이스에 초대했습니다.
              </div>

              <div class="workspace-card">
                <div class="workspace-name">${workspace_name}</div>
                <div class="workspace-role">${roleLabel} 권한으로 초대되었습니다</div>
              </div>

              <a href="${invitation_link}" 
                style="display: inline-block; 
                        background-color: #111827; 
                        color: #ffffff !important; 
                        text-decoration: none; 
                        padding: 12px 24px; 
                        border-radius: 6px; 
                        font-size: 14px; 
                        font-weight: 500;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;">
                초대 수락하기
              </a>

              <div class="info-box">
                <div class="info-title">안내사항</div>
                <ul class="info-list">
                  <li>이 초대는 7일 후 만료됩니다</li>
                  <li>Google 계정으로 로그인이 필요합니다</li>
                </ul>
              </div>
            </div>

            <div class="footer">
              버튼이 작동하지 않나요?<br>
              <a href="${invitation_link}" class="link">${invitation_link}</a>
            </div>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"재고관리" <${process.env.GMAIL_USER}>`,
      to: to_email,
      subject: `${workspace_name} 워크스페이스 초대`,
      html: htmlContent,
    });

    res.json({ success: true, message: "이메일이 전송되었습니다." });
  } catch (error: any) {
    console.error("❌ 이메일 전송 실패:", error);
    res.status(500).json({
      success: false,
      error: error.message || "이메일 전송에 실패했습니다.",
    });
  }
}

export default allowCors(handler);
