import { NotificationProvider, SendResult } from "./index";

/**
 * SMS/WhatsApp Provider (Sandbox Mode)
 *
 * IMPORTANT COMPLIANCE NOTICE FOR INDIA:
 * - SMS: Sender IDs and templates MUST be registered on DLT portals (e.g. TRAI) before going live.
 * - WhatsApp: Message templates must be pre-approved by Meta for business APIs.
 * Verify current regulations before production.
 */
export class SmsProvider implements NotificationProvider {
  channel = "sms" as const;

  async send(to: string, payload: unknown): Promise<SendResult> {
    if (!this.validateConfig()) {
      return { success: false, error: "SMS provider token missing" };
    }

    const maskedTo = to.length > 4 ? `***${to.slice(-4)}` : "***";
    console.log(`[SMS Sandbox] To: ${maskedTo} | Msg: ${payload.message}`);

    return {
      success: true,
      providerMessageId: `sms-sandbox-${Date.now()}`,
    };
  }

  validateConfig(): boolean {
    // Requires an env variable to signify SMS is explicitly enabled
    return process.env.ENABLE_SMS_SANDBOX === "true";
  }
}

export class WhatsAppProvider extends SmsProvider {
  channel = "whatsapp" as const;

  async send(to: string, payload: unknown): Promise<SendResult> {
    if (!this.validateConfig()) {
      return { success: false, error: "WhatsApp provider token missing" };
    }

    const maskedTo = to.length > 4 ? `***${to.slice(-4)}` : "***";
    console.log(`[WhatsApp Sandbox] To: ${maskedTo} | Msg: ${payload.message}`);

    return {
      success: true,
      providerMessageId: `wa-sandbox-${Date.now()}`,
    };
  }
}
