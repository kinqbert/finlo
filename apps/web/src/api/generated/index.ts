/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

import type { SupportedCurrencyCode } from "@/constants/currencies";

export type SupportedCurrency = SupportedCurrencyCode;

export interface Health {
  status: string;
}

export interface APIError {
  error: {
    code?: string;
    message: string;
    details?: Record<string, any>;
  };
}

export interface Tokens {
  access_token: string;
  refresh_token?: string;
}

export interface RegisterInput {
  /**
   * @minLength 1
   * @maxLength 100
   */
  name: string;
  /**
   * @minLength 1
   * @maxLength 100
   */
  surname: string;
  /**
   * @format email
   * @maxLength 320
   */
  email: string;
  /**
   * @minLength 8
   * @maxLength 72
   */
  password: string;
}

export interface LoginInput {
  /**
   * @format email
   * @maxLength 320
   */
  email: string;
  password: string;
}

export interface GoogleLoginInput {
  id_token: string;
}

export interface RefreshInput {
  refresh_token: string;
}

export interface User {
  /** @format uuid */
  id: string;
  name: string;
  surname: string;
  /** @format email */
  email: string;
  /** @format uri */
  avatar_url?: string;
  /** @format date-time */
  created_at: string;
  /** @format date-time */
  updated_at: string;
}

export interface Category {
  /** @format uuid */
  id: string;
  name: string;
  type: "income" | "expense";
  sort_order: number;
  /** @format date-time */
  created_at: string;
  /** @format date-time */
  updated_at: string;
}

export interface CreateCategoryInput {
  /**
   * @minLength 1
   * @maxLength 100
   */
  name: string;
  type: "income" | "expense";
}

export interface UpdateCategoryInput {
  /**
   * @minLength 1
   * @maxLength 100
   */
  name: string;
}

export interface ReorderCategoriesInput {
  type: "income" | "expense";
  /** @minItems 1 */
  category_ids: Array<string>;
}

export interface Account {
  /** @format uuid */
  id: string;
  name: string;
  type: "cash" | "bank" | "card" | "savings" | "other";
  /**
   * @minLength 3
   * @maxLength 3
   */
  currency: string;
  /** @format int64 */
  balance_minor: number;
  /** @format date-time */
  created_at: string;
  /** @format date-time */
  updated_at: string;
}

export interface CreateAccountInput {
  /**
   * @minLength 1
   * @maxLength 100
   */
  name: string;
  type: "cash" | "bank" | "card" | "savings" | "other";
  currency: SupportedCurrency;
  /** @format int64 */
  balance_minor: number;
}

export interface UpdateAccountInput {
  /**
   * @minLength 1
   * @maxLength 100
   */
  name?: string;
  type?: "cash" | "bank" | "card" | "savings" | "other";
  /** @format int64 */
  balance_minor?: number;
}

export interface Transaction {
  /** @format uuid */
  id: string;
  /** @format uuid */
  account_id: string;
  type: "income" | "expense";
  /** @format int64 */
  amount_minor: number;
  currency: string;
  category: string;
  /**
   * @min 0
   * @max 9999
   */
  mcc_code?: number;
  /**
   * @min 0
   * @max 9999
   */
  original_mcc_code?: number;
  category_needs_review: boolean;
  pending: boolean;
  description: string;
  /** @format date-time */
  occurred_at: string;
  source: "manual" | "monobank";
  external_id?: string;
  /** @format date-time */
  created_at: string;
  /** @format date-time */
  updated_at: string;
}

export interface CreateTransactionInput {
  /** @format uuid */
  account_id: string;
  type: "income" | "expense";
  /**
   * @format int64
   * @min 1
   */
  amount_minor: number;
  /**
   * @minLength 1
   * @maxLength 100
   */
  category: string;
  /** @maxLength 500 */
  description: string;
  /** @format date-time */
  occurred_at: string;
}

export interface AssignTransactionCategoryInput {
  /** @format uuid */
  category_id: string;
  remember_mcc: boolean;
}

export interface Goal {
  /** @format uuid */
  id: string;
  name: string;
  /**
   * @format int64
   * @min 0
   */
  current_minor: number;
  /**
   * @format int64
   * @min 1
   */
  target_minor?: number;
  /**
   * @minLength 3
   * @maxLength 3
   */
  currency: string;
  source: "manual" | "monobank";
  external_id?: string;
  /** @format date-time */
  created_at: string;
  /** @format date-time */
  updated_at: string;
}

export interface CreateGoalInput {
  /**
   * @minLength 1
   * @maxLength 100
   */
  name: string;
  /**
   * @format int64
   * @min 0
   */
  current_minor: number;
  /**
   * @format int64
   * @min 1
   */
  target_minor?: number;
  currency: SupportedCurrency;
}

export interface UpdateGoalInput {
  /**
   * @minLength 1
   * @maxLength 100
   */
  name?: string;
  /**
   * @format int64
   * @min 0
   */
  current_minor?: number;
  /**
   * @format int64
   * @min 1
   */
  target_minor?: number;
  clear_target?: boolean;
}

export interface MCCCategoryRule {
  /** @format uuid */
  id: string;
  /**
   * @min 0
   * @max 9999
   */
  mcc: number;
  transaction_type: "income" | "expense";
  /** @format uuid */
  category_id: string;
  category: string;
  is_default: boolean;
  /** @format date-time */
  created_at: string;
  /** @format date-time */
  updated_at: string;
}

export interface SaveMCCRuleInput {
  /**
   * @min 0
   * @max 9999
   */
  mcc: number;
  transaction_type: "income" | "expense";
  /** @format uuid */
  category_id: string;
}

export interface MonobankPreviewInput {
  /**
   * @minLength 1
   * @maxLength 500
   */
  token: string;
}

export interface MonobankPreviewAccount {
  id: string;
  name: string;
  type: string;
  currency: string;
  /** @format int64 */
  balance_minor: number;
  /** @format int64 */
  credit_limit_minor: number;
  masked_pan: Array<string>;
  iban: string;
}

export interface MonobankPreviewJar {
  id: string;
  title: string;
  description: string;
  currency: string;
  /** @format int64 */
  balance_minor: number;
  /**
   * @format int64
   * @min 1
   */
  target_minor?: number;
}

export interface MonobankPreview {
  /** @format uuid */
  connection_id: string;
  client_name: string;
  accounts: Array<MonobankPreviewAccount>;
  jars: Array<MonobankPreviewJar>;
}

export interface CompleteMonobankInput {
  /** @format uuid */
  connection_id: string;
  account_ids: Array<string>;
  jar_ids: Array<string>;
}

export interface MonobankConnection {
  /** @format uuid */
  id: string;
  status: "pending" | "active" | "webhook_error" | "disconnected";
  client_name: string;
  webhook_configured: boolean;
  /** @format int64 */
  account_count: number;
  /** @format int64 */
  jar_count: number;
  last_error?: string;
  /** @format date-time */
  connected_at?: string;
}

export interface Budget {
  /** @format uuid */
  id: string;
  category: string;
  /** @format int64 */
  amount_minor: number;
  currency: string;
  /** @pattern ^\d{4}-\d{2}$ */
  month: string;
  /** @format int64 */
  spent_minor?: number;
  /** @format int64 */
  remaining_minor?: number;
  /** @format date-time */
  created_at: string;
  /** @format date-time */
  updated_at: string;
}

export interface SaveBudgetInput {
  /**
   * @minLength 1
   * @maxLength 100
   */
  category: string;
  /**
   * @format int64
   * @min 1
   */
  amount_minor: number;
  currency: SupportedCurrency;
  /** @pattern ^\d{4}-\d{2}$ */
  month: string;
}

export interface EmergencyFund {
  /** @format int64 */
  target_minor: number;
  /** @format int64 */
  current_minor: number;
  currency: string;
  /** @format date-time */
  created_at: string;
  /** @format date-time */
  updated_at: string;
}

export interface SaveEmergencyFundInput {
  /**
   * @format int64
   * @min 1
   */
  target_minor: number;
  /**
   * @format int64
   * @min 0
   */
  current_minor: number;
  currency: SupportedCurrency;
}

export interface Subscription {
  /** @format uuid */
  id: string;
  /** @format uuid */
  account_id?: string;
  name: string;
  /** @format int64 */
  amount_minor: number;
  currency: string;
  /**
   * Preferred billing day; shorter months use their final calendar day.
   * @min 1
   * @max 31
   */
  billing_day: number;
  active: boolean;
  /** @format date-time */
  next_payment_date?: string;
  /** @format date-time */
  created_at: string;
  /** @format date-time */
  updated_at: string;
}

export interface CreateSubscriptionInput {
  /** @format uuid */
  account_id?: string;
  /**
   * @minLength 1
   * @maxLength 100
   */
  name: string;
  /**
   * @format int64
   * @min 1
   */
  amount_minor: number;
  currency: SupportedCurrency;
  /**
   * Preferred billing day; shorter months use their final calendar day.
   * @min 1
   * @max 31
   */
  billing_day: number;
  active: boolean;
  /** @format date */
  next_payment_date?: string;
}

export interface UpdateSubscriptionInput {
  /** @format uuid */
  account_id?: string;
  /**
   * @minLength 1
   * @maxLength 100
   */
  name?: string;
  /**
   * @format int64
   * @min 1
   */
  amount_minor?: number;
  /**
   * Preferred billing day; shorter months use their final calendar day.
   * @min 1
   * @max 31
   */
  billing_day?: number;
  active?: boolean;
  /** @format date */
  next_payment_date?: string;
}

export interface BalanceSummary {
  currency: string;
  /** @format int64 */
  balance_minor: number;
}

export interface Insight {
  type: string;
  title: string;
  message: string;
}

export interface Dashboard {
  balances: Array<BalanceSummary>;
  total_balance: BalanceSummary;
  /** Total balance converted into every currency with an available rate. */
  total_balances: Array<BalanceSummary>;
  /** True when every account currency was included in total_balance. */
  balance_complete: boolean;
  unconverted_currencies: Array<string>;
  /** @format date-time */
  exchange_rates_as_of?: string;
  recent_transactions: Array<Transaction>;
  budgets: Array<Budget>;
  emergency_fund: EmergencyFund | null;
  subscriptions: Array<Subscription>;
  insights: Array<Insight>;
}
