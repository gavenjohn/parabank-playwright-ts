import { z } from 'zod';

export const accountSchema = z.object({
  id: z.number(),
  customerId: z.number(),
  type: z.enum(['CHECKING', 'SAVINGS']),
  balance: z.number(),
});

export type Account = z.infer<typeof accountSchema>;

export const transactionSchema = z.object({
  id: z.number(),
  accountId: z.number(),
  type: z.enum(['Credit', 'Debit']),
  date: z.number(), // epoch millis
  amount: z.number(),
  description: z.string(),
});

export const transactionsSchema = z.array(transactionSchema);

export const loanResponseSchema = z.object({
  responseDate: z.number(),
  loanProviderName: z.string(),
  approved: z.boolean(),
  accountId: z.number().nullable(),
  message: z.string().optional(), // absent on approval, present on denial
});