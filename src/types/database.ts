// ชนิดข้อมูลฐานข้อมูล (sync กับ supabase/migrations/0001_init.sql)
// ภายหลังจะ generate อัตโนมัติด้วย Supabase CLI ได้ แต่ตอนนี้เขียนมือไว้ใช้ก่อน

export type MemberRole = 'super_admin' | 'developer' | 'admin' | 'member'

export interface Member {
  id: string
  auth_id: string | null
  provider: string | null
  display_name: string | null
  last_name: string | null
  birthday: string | null // ISO date
  phone: string | null
  email: string | null
  photo_url: string | null
  role: MemberRole
  points_balance: number
  created_at: string
  updated_at: string
}

export interface PointTransaction {
  id: string
  member_id: string
  type: 'earn' | 'adjust'
  bill_amount: number | null
  points: number
  balance_after: number
  created_by: string | null
  note: string | null
  created_at: string
}

export interface Promotion {
  id: string
  title_th: string | null
  title_en: string | null
  description_th: string | null
  description_en: string | null
  image_url: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface SpecialPackage {
  id: string
  name_th: string | null
  name_en: string | null
  price: number | null
  description_th: string | null
  description_en: string | null
  image_url: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Coupon {
  id: string
  name_th: string | null
  name_en: string | null
  image_url: string | null
  max_uses_per_user: number
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CouponRedemption {
  id: string
  coupon_id: string
  member_id: string
  period: string // 'YYYY-MM'
  used_at: string
}

export interface MenuImage {
  id: string
  image_url: string
  sort_order: number
  created_at: string
}

export interface Settings {
  id: boolean
  google_map_url: string | null
  facebook_url: string | null
  show_promotions: boolean
  show_coupons: boolean
  show_packages: boolean
  telegram_enabled: boolean
  updated_at: string
}
