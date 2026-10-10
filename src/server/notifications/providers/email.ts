import { NotificationProvider, SendResult } from "./index";

export class EmailProvider implements NotificationProvider {
  channel = "email" as const;

  async send(to: string, payload: unknown): Promise<SendResult> {
    if (!this.validateConfig()) {
      return { success: false, error: "Email provider configured improperly" };
    }

    const [localPart, domain] = to.split("@");
    const maskedLocal = localPart.length > 2 ? `${localPart.slice(0, 2)}***` : "***";
    const maskedTo = `${maskedLocal}@${domain}`;

    console.log(`[Email Sandbox] To: ${maskedTo} | Subject: ${payload.subject}`);

    return {
      success: true,
      providerMessageId: `email-sandbox-${Date.now()}`,
    };
  }

  validateConfig(): boolean {
    return process.env.ENABLE_EMAIL_SANDBOX === "true";
  }
}
