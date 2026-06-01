export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type ReplySource = "faq" | "ai" | "fallback" | "handoff" | "paused";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
}

export interface Business {
  id: string;
  user_id: string;
  business_name: string;
  category: string | null;
  owner_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  opening_hours: string | null;
  website: string | null;
  instagram: string | null;
  services: string | null;
  short_description: string | null;
  default_fallback_message: string | null;
  ai_enabled: boolean;
  rule_based_first: boolean;
  ai_temperature: number;
  ai_max_tokens: number;
  ai_timeout_seconds: number;
  ai_fallback_message: string | null;
  bot_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FAQ {
  id: string;
  user_id: string;
  business_id: string;
  question: string;
  answer: string;
  keywords: string[] | null;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppSettings {
  id: string;
  user_id: string;
  business_id: string;
  phone_number_id: string;
  access_token: string;
  verify_token: string;
  app_secret: string | null;
  is_connected: boolean;
  webhook_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export type WhatsAppConnectionMode = "qr_login" | "meta_api";
export type WhatsAppConnectionStatus =
  | "not_connected"
  | "qr_ready"
  | "connecting"
  | "connected"
  | "disconnected"
  | "failed";

export interface WhatsAppConnection {
  id: string;
  user_id: string;
  business_id: string;
  workspace_id: string;
  mode: WhatsAppConnectionMode;
  status: WhatsAppConnectionStatus;
  is_active: boolean;
  connected_phone: string | null;
  engine_status: Json | null;
  last_error: string | null;
  last_connected_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  user_id: string;
  business_id: string;
  customer_name: string | null;
  customer_phone: string;
  message: string;
  interest: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageLog {
  id: string;
  user_id: string;
  business_id: string;
  customer_phone: string;
  customer_name: string | null;
  incoming_message: string;
  bot_reply: string | null;
  reply_source: ReplySource;
  model_used: string | null;
  ai_provider: string | null;
  matched_faq_id: string | null;
  created_at: string;
}

export interface AILog {
  id: string;
  user_id: string | null;
  business_id: string | null;
  provider: string;
  model: string;
  status: string;
  error: string | null;
  latency_ms: number | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  business_id: string;
  plan_name: string;
  status: string;
  amount_inr: number;
  renewal_date: string | null;
  current_period_start?: string | null;
  monthly_message_count?: number | null;
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface WhatsAppConnectionPayload {
  businessId: string;
  status: WhatsAppConnectionStatus;
  mode: WhatsAppConnectionMode;
  connectedPhone?: string | null;
  qrCode?: string | null;
  engineStatus?: Json | null;
  lastError?: string | null;
  isActive?: boolean;
}

export interface InboundCallbackHealth {
  appUrl: string;
  callbackUrl: string;
  isPublic: boolean;
  reason: string | null;
}
