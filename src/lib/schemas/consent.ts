import { z } from "zod";

export const consentSchema = z.object({
  data_sharing_consent: z.boolean(),
});

export type ConsentInput = z.infer<typeof consentSchema>;

