import { NotificationProvider, NotificationChannel } from "./providers";
import { MockProvider } from "./providers/mock";
import { WebPushProvider } from "./providers/push";
import { TelegramProvider } from "./providers/telegram";
import { SmsProvider, WhatsAppProvider } from "./providers/sms";
import { EmailProvider } from "./providers/email";

export function getNotificationProvider(channel: NotificationChannel): NotificationProvider {
  // If the global kill switch is on, fall back to MockProvider for safety
  if (process.env.NEXT_PUBLIC_NOTIFICATIONS_ENABLED === "false") {
    return new MockProvider(channel);
  }

  // Feature flags dictate if a real adapter is used or we fall back to mock
  switch (channel) {
    case "push":
      return process.env.ENABLE_PUSH === "true" ? new WebPushProvider() : new MockProvider(channel);
    case "telegram":
      return process.env.ENABLE_TELEGRAM === "true"
        ? new TelegramProvider()
        : new MockProvider(channel);
    case "sms":
      return process.env.ENABLE_SMS_SANDBOX === "true"
        ? new SmsProvider()
        : new MockProvider(channel);
    case "whatsapp":
      return process.env.ENABLE_SMS_SANDBOX === "true"
        ? new WhatsAppProvider()
        : new MockProvider(channel);
    case "email":
      return process.env.ENABLE_EMAIL_SANDBOX === "true"
        ? new EmailProvider()
        : new MockProvider(channel);
    default:
      return new MockProvider(channel);
  }
}
