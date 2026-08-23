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
  /** @pattern ^[A-Za-z]{3}$ */
  currency: string;
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
  /** @pattern ^[A-Za-z]{3}$ */
  currency: string;
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
  /** @pattern ^[A-Za-z]{3}$ */
  currency: string;
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
  /** @pattern ^[A-Za-z]{3}$ */
  currency: string;
  /**
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
  recent_transactions: Array<Transaction>;
  budgets: Array<Budget>;
  emergency_fund: EmergencyFund | null;
  subscriptions: Array<Subscription>;
  insights: Array<Insight>;
}
