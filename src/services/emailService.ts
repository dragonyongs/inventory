// src/services/emailService.ts

interface SendInvitationEmailParams {
  to_email: string;
  to_name?: string;
  from_name: string;
  from_email: string;
  workspace_name: string;
  invitation_link: string;
  role: string;
}

export const sendInvitationEmail = async (
  params: SendInvitationEmailParams
): Promise<{ success: boolean; error?: string }> => {
  try {
    const apiUrl = "/api/send-invitation";

    console.log("📧 이메일 전송 시도:", { to: params.to_email, apiUrl });
    console.log("📦 전송 데이터:", params);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    console.log("📡 응답 상태:", response.status, response.statusText);

    // ✅ 응답이 JSON인지 먼저 확인
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("❌ JSON이 아닌 응답:", text.substring(0, 200));
      throw new Error(
        `서버 오류: ${response.status} - API가 응답하지 않습니다.`
      );
    }

    const data = await response.json();
    console.log("📨 응답 데이터:", data);

    if (!response.ok) {
      throw new Error(data.error || `이메일 전송 실패 (${response.status})`);
    }

    console.log("✅ 이메일 전송 성공:", data);
    return { success: true };
  } catch (error: any) {
    console.error("❌ 이메일 전송 실패:", error);
    return {
      success: false,
      error: error.message || "이메일 전송에 실패했습니다.",
    };
  }
};
