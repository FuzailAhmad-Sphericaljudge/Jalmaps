import { NotificationProvider, SendResult } from "./index";

export class EmailProvider implements NotificationProvider {
  channel = "email" as const;

  async send(to: string, payload: unknown): Promise<SendResult> {
    if (!this.validateConfig()) {
      return { success: false, error: "Email provider configured improperly" };
    }

    const parts = to.split("@");
    const localPart = parts[0] || "";
    const domain = parts[1] || "";
    const maskedLocal = localPart.length > 2 ? `${localPart.slice(0, 2)}***` : "***";
    const maskedTo = `${maskedLocal}@${domain}`;

    const data = payload as { subject?: string };
    console.log(`[Email Sandbox] To: ${maskedTo} | Subject: ${data.subject}`);

    return {
      success: true,
      providerMessageId: `email-sandbox-${Date.now()}`,
    };
  }

  validateConfig(): boolean {
    return process.env.ENABLE_EMAIL_SANDBOX === "true";
  }
}
