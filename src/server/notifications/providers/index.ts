import { Database } from "@/lib/database.types";

export type NotificationChannel = Database["public"]["Enums"]["notification_channel"];

export interface SendResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}

export interface NotificationProvider {
  channel: NotificationChannel;
  send(to: string, payload: any): Promise<SendResult>;
  validateConfig(): boolean;
}
