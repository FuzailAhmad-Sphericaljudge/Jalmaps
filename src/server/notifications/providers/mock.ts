import { NotificationProvider, SendResult, NotificationChannel } from "./index";
import { randomUUID } from "crypto";

/**
 * Mock provider used in development and tests.
 * Never sends real messages.
 */
export class MockProvider implements NotificationProvider {
  constructor(public channel: NotificationChannel) {}

  async send(to: string, payload: unknown): Promise<SendResult> {
    // Mask destination for safe logging
    const maskedTo = to.length > 4 ? `***${to.slice(-4)}` : "***";
    console.log(`[MockProvider:${this.channel}] Sending to ${maskedTo}`, payload);

    return {
      success: true,
      providerMessageId: `mock-${randomUUID()}`,
    };
  }

  validateConfig(): boolean {
    return true; // Mock is always valid
  }
}
