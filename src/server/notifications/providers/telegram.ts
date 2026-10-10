import { NotificationProvider, SendResult } from "./index";

export class TelegramProvider implements NotificationProvider {
  channel = "telegram" as const;

  async send(to: string, payload: any): Promise<SendResult> {
    if (!this.validateConfig()) {
      return { success: false, error: "Telegram bot token missing" };
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: to,
          text: payload.message,
          parse_mode: "HTML",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        return { success: false, error: data.description || "Telegram API error" };
      }

      return {
        success: true,
        providerMessageId: data.result.message_id.toString(),
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  validateConfig(): boolean {
    return !!process.env.TELEGRAM_BOT_TOKEN;
  }
}
