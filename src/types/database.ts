// =====================================================
// TYPESCRIPT TYPES - FIVE VEGETABLES
// Generated from Supabase schema
// =====================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// =====================================================
// Database Tables
// =====================================================

export interface Database {
  public: {
    Tables: {
      stores: {
        Row: {
          id: string
          name: string
          slug: string
          address: string | null
          phone: string | null
          email: string | null
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          address?: string | null
          phone?: string | null
          email?: string | null
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          address?: string | null
          phone?: string | null
          email?: string | null
          owner_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          store_id: string | null
          full_name: string | null
          role: 'gerente' | 'vendedor' | 'cliente'
          phone: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          store_id?: string | null
          full_name?: string | null
          role?: 'gerente' | 'vendedor' | 'cliente'
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string | null
          full_name?: string | null
          role?: 'gerente' | 'vendedor' | 'cliente'
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      vendedor_clientes: {
        Row: {
          id: string
          store_id: string
          vendedor_id: string
          cliente_id: string
          created_at: string
        }
        Insert: {
          id?: string
          store_id: string
          vendedor_id: string
          cliente_id: string
          created_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          vendedor_id?: string
          cliente_id?: string
          created_at?: string
        }
      }
      price_lists: {
        Row: {
          id: string
          store_id: string
          odoo_pricelist_id: number
          name: string
          type: 'vip' | 'mayorista' | 'normal'
          discount_percentage: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          odoo_pricelist_id: number
          name: string
          type?: 'vip' | 'mayorista' | 'normal'
          discount_percentage?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          odoo_pricelist_id?: number
          name?: string
          type?: 'vip' | 'mayorista' | 'normal'
          discount_percentage?: number
          created_at?: string
          updated_at?: string
        }
      }
      clients_mirror: {
        Row: {
          id: string
          store_id: string
          user_id: string | null
          odoo_partner_id: number
          name: string
          email: string | null
          phone: string | null
          pricelist_id: string | null
          odoo_pricelist_id: number | null
          street: string | null
          city: string | null
          state: string | null
          zip: string | null
          created_at: string
          updated_at: string
          last_sync: string
        }
        Insert: {
          id?: string
          store_id: string
          user_id?: string | null
          odoo_partner_id: number
          name: string
          email?: string | null
          phone?: string | null
          pricelist_id?: string | null
          odoo_pricelist_id?: number | null
          street?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
          created_at?: string
          updated_at?: string
          last_sync?: string
        }
        Update: {
          id?: string
          store_id?: string
          user_id?: string | null
          odoo_partner_id?: number
          name?: string
          email?: string | null
          phone?: string | null
          pricelist_id?: string | null
          odoo_pricelist_id?: number | null
          street?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
          created_at?: string
          updated_at?: string
          last_sync?: string
        }
      }
      products_cache: {
        Row: {
          id: string
          store_id: string
          odoo_product_id: number
          name: string
          description: string | null
          image_url: string | null
          list_price: number
          stock_level: number
          category: string | null
          uom: string
          active: boolean
          created_at: string
          updated_at: string
          last_sync: string
        }
        Insert: {
          id?: string
          store_id: string
          odoo_product_id: number
          name: string
          description?: string | null
          image_url?: string | null
          list_price: number
          stock_level?: number
          category?: string | null
          uom?: string
          active?: boolean
          created_at?: string
          updated_at?: string
          last_sync?: string
        }
        Update: {
          id?: string
          store_id?: string
          odoo_product_id?: number
          name?: string
          description?: string | null
          image_url?: string | null
          list_price?: number
          stock_level?: number
          category?: string | null
          uom?: string
          active?: boolean
          created_at?: string
          updated_at?: string
          last_sync?: string
        }
      }
      orders_shadow: {
        Row: {
          id: string
          store_id: string
          odoo_order_id: number | null
          cliente_id: string
          vendedor_id: string | null
          order_number: string
          status: 'draft' | 'confirmed' | 'processing' | 'delivered' | 'cancelled'
          invoice_status: 'no' | 'to_invoice' | 'invoiced'
          invoice_pdf_url: string | null
          subtotal: number
          tax: number
          total: number
          request_invoice: boolean
          notes: string | null
          created_at: string
          updated_at: string
          synced_at: string | null
          delivered_at: string | null
        }
        Insert: {
          id?: string
          store_id: string
          odoo_order_id?: number | null
          cliente_id: string
          vendedor_id?: string | null
          order_number: string
          status?: 'draft' | 'confirmed' | 'processing' | 'delivered' | 'cancelled'
          invoice_status?: 'no' | 'to_invoice' | 'invoiced'
          invoice_pdf_url?: string | null
          subtotal?: number
          tax?: number
          total?: number
          request_invoice?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
          synced_at?: string | null
          delivered_at?: string | null
        }
        Update: {
          id?: string
          store_id?: string
          odoo_order_id?: number | null
          cliente_id?: string
          vendedor_id?: string | null
          order_number?: string
          status?: 'draft' | 'confirmed' | 'processing' | 'delivered' | 'cancelled'
          invoice_status?: 'no' | 'to_invoice' | 'invoiced'
          invoice_pdf_url?: string | null
          subtotal?: number
          tax?: number
          total?: number
          request_invoice?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
          synced_at?: string | null
          delivered_at?: string | null
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          odoo_product_id: number
          product_name: string
          quantity: number
          unit_price: number
          discount_percentage: number
          subtotal: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          odoo_product_id: number
          product_name: string
          quantity: number
          unit_price: number
          discount_percentage?: number
          subtotal: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          odoo_product_id?: number
          product_name?: string
          quantity?: number
          unit_price?: number
          discount_percentage?: number
          subtotal?: number
          created_at?: string
        }
      }
    }
  }
}

// =====================================================
// Helper Types
// =====================================================

export type Store = Database['public']['Tables']['stores']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type VendedorClientes = Database['public']['Tables']['vendedor_clientes']['Row']
export type PriceList = Database['public']['Tables']['price_lists']['Row']
export type ClientMirror = Database['public']['Tables']['clients_mirror']['Row']
export type ProductCache = Database['public']['Tables']['products_cache']['Row']
export type OrderShadow = Database['public']['Tables']['orders_shadow']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']

export type UserRole = 'gerente' | 'vendedor' | 'cliente'
export type OrderStatus = 'draft' | 'confirmed' | 'processing' | 'delivered' | 'cancelled'
export type InvoiceStatus = 'no' | 'to_invoice' | 'invoiced'
export type PriceListType = 'vip' | 'mayorista' | 'normal'

// =====================================================
// Form Types
// =====================================================

export interface CreateOrderInput {
  cliente_id: string
  items: Array<{
    product_id: string
    quantity: number
  }>
  notes?: string
  request_invoice: boolean
}

export interface UpdatePricelistInput {
  client_id: string
  new_pricelist_id: string
}

// =====================================================
// API Response Types
// =====================================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}
