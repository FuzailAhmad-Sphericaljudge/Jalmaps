import { NotificationProvider, SendResult } from "./index";
import webpush from "web-push";

export class WebPushProvider implements NotificationProvider {
  channel = "push" as const;

  constructor() {
    if (this.validateConfig()) {
      webpush.setVapidDetails(
        "mailto:admin@jalmaps.example.com",
        process.env.VAPID_PUBLIC_KEY!,
        process.env.VAPID_PRIVATE_KEY!,
      );
    }
  }

  async send(to: string, payload: unknown): Promise<SendResult> {
    try {
      const subscription = JSON.parse(to);
      const res = await webpush.sendNotification(subscription, JSON.stringify(payload));
      return {
        success: true,
        providerMessageId: res.headers["apns-id"] || "web-push-sent",
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  validateConfig(): boolean {
    return !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
  }
}
