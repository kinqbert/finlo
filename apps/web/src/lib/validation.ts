import { z } from 'zod'

const requiredText = (label: string) => z.string().trim().min(1, `${label} is required.`).max(100, `${label} must be 100 characters or fewer.`)
const money = (label: string, allowZero = false) => z.number({ error: `${label} must be a number.` }).finite().refine((value) => allowZero ? value >= 0 : value > 0, `${label} must be ${allowZero ? 'zero or greater' : 'greater than zero'}.`)

export const authSchema = z.object({
  mode: z.enum(['login', 'register']),
  name: z.string(),
  surname: z.string(),
  email: z.email('Enter a valid email address.').max(320),
  password: z.string().min(1, 'Password is required.'),
}).superRefine((values, context) => {
  if (values.mode !== 'register') return
  if (!values.name.trim()) context.addIssue({ code: 'custom', path: ['name'], message: 'First name is required.' })
  if (!values.surname.trim()) context.addIssue({ code: 'custom', path: ['surname'], message: 'Last name is required.' })
  if (values.password.length < 8) context.addIssue({ code: 'custom', path: ['password'], message: 'Use at least 8 characters.' })
  if (values.password.length > 72) context.addIssue({ code: 'custom', path: ['password'], message: 'Use no more than 72 characters.' })
})

export const accountSchema = z.object({
  name: requiredText('Account name'),
  type: z.enum(['cash', 'bank', 'card', 'savings', 'other']),
  currency: z.string().trim().length(3, 'Use a three-letter currency code.').regex(/^[A-Za-z]+$/, 'Currency can only contain letters.'),
  balance: z.number({ error: 'Balance must be a number.' }).finite(),
})

export const transactionSchema = z.object({
  amount: money('Amount'),
  account: z.string().min(1, 'Choose an account.'),
  category: requiredText('Category'),
  description: z.string().trim().max(500, 'Note must be 500 characters or fewer.'),
})

export const budgetSchema = z.object({
  category: requiredText('Category'),
  amount: money('Monthly limit'),
})

export const emergencyFundSchema = z.object({
  current: money('Saved amount', true),
  target: money('Target'),
})

export const subscriptionSchema = z.object({
  name: requiredText('Name'),
  amount: money('Monthly amount'),
  billing_day: z.number({ error: 'Billing day must be a number.' }).int().min(1, 'Billing day must be between 1 and 31.').max(31, 'Billing day must be between 1 and 31.'),
})

export const categorySchema = z.object({
  name: requiredText('Category name'),
  type: z.enum(['income', 'expense']),
})

export const categoryNameSchema = categorySchema.pick({ name: true })

export type AuthFormValues = z.infer<typeof authSchema>
export type AccountFormValues = z.infer<typeof accountSchema>
export type TransactionFormValues = z.infer<typeof transactionSchema>
export type BudgetFormValues = z.infer<typeof budgetSchema>
export type EmergencyFundFormValues = z.infer<typeof emergencyFundSchema>
export type SubscriptionFormValues = z.infer<typeof subscriptionSchema>
export type CategoryFormValues = z.infer<typeof categorySchema>
export type CategoryNameFormValues = z.infer<typeof categoryNameSchema>
