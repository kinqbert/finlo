import { z } from 'zod';

export const authSchema = z.object({
  mode: z.enum(['login', 'register']),
  name: z.string(),
  surname: z.string(),
  email: z.email('Enter a valid email address.').max(320),
  password: z.string().min(1, 'Password is required.'),
}).superRefine((values, context) => {
  if (values.mode !== 'register') return;
  if (!values.name.trim()) context.addIssue({ code: 'custom', path: ['name'], message: 'First name is required.' });
  if (!values.surname.trim()) context.addIssue({ code: 'custom', path: ['surname'], message: 'Last name is required.' });
  if (values.password.length < 8) context.addIssue({ code: 'custom', path: ['password'], message: 'Use at least 8 characters.' });
  if (values.password.length > 72) context.addIssue({ code: 'custom', path: ['password'], message: 'Use no more than 72 characters.' });
});

export const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  accountID: z.string().min(1, 'Choose an account.'),
  category: z.string().trim().min(1, 'Choose a category.').max(100),
  amount: z.string().trim().refine((value) => {
    const amount = Number(value.replace(',', '.'));
    return Number.isFinite(amount) && amount > 0;
  }, 'Enter an amount greater than zero.'),
  note: z.string().trim().max(500, 'Note must be 500 characters or fewer.'),
});

export type AuthFormValues = z.infer<typeof authSchema>;
export type TransactionFormValues = z.infer<typeof transactionSchema>;
