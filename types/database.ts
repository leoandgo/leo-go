export interface Database {
  public: {
    Tables: {
      vehicles: {
        Row: {
          id: string
          key: string
          model_name: string
          size_category: string
          pricing_grid_id: string
          image_url: string | null
          badge_color: string | null
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          key: string
          model_name: string
          size_category: string
          pricing_grid_id: string
          image_url?: string | null
          badge_color?: string | null
          display_order?: number
          is_active?: boolean
        }
        Update: {
          key?: string
          model_name?: string
          size_category?: string
          pricing_grid_id?: string
          image_url?: string | null
          badge_color?: string | null
          display_order?: number
          is_active?: boolean
        }
      }
      pricing_grids: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          description?: string | null
        }
        Update: {
          name?: string
          description?: string | null
        }
      }
      minute_prices: {
        Row: {
          id: string
          pricing_grid_id: string
          duration_minutes: number
          price_ttc: number
          km_included: number
          created_at: string
        }
        Insert: {
          pricing_grid_id: string
          duration_minutes: number
          price_ttc: number
          km_included: number
        }
        Update: {
          pricing_grid_id?: string
          duration_minutes?: number
          price_ttc?: number
          km_included?: number
        }
      }
      global_settings: {
        Row: {
          id: string
          key: string
          value: number
          text_value: string | null
          description: string | null
          updated_at: string
        }
        Insert: {
          key: string
          value: number
          text_value?: string | null
          description?: string | null
        }
        Update: {
          key?: string
          value?: number
          text_value?: string | null
          description?: string | null
        }
      }
      contact_requests: {
        Row: {
          id: string
          email: string
          vehicle_id: string | null
          estimated_price: number | null
          duration_minutes: number | null
          distance_km: number | null
          departure_datetime: string | null
          return_datetime: string | null
          airport_option: boolean
          predelivery_option: boolean
          created_at: string
          status: string
        }
        Insert: {
          email: string
          vehicle_id?: string | null
          estimated_price?: number | null
          duration_minutes?: number | null
          distance_km?: number | null
          departure_datetime?: string | null
          return_datetime?: string | null
          airport_option?: boolean
          predelivery_option?: boolean
          status?: string
        }
        Update: {
          email?: string
          vehicle_id?: string | null
          estimated_price?: number | null
          duration_minutes?: number | null
          distance_km?: number | null
          departure_datetime?: string | null
          return_datetime?: string | null
          airport_option?: boolean
          predelivery_option?: boolean
          status?: string
        }
      }
    }
  }
}

export type Vehicle = Database['public']['Tables']['vehicles']['Row']
export type PricingGrid = Database['public']['Tables']['pricing_grids']['Row']
export type MinutePrice = Database['public']['Tables']['minute_prices']['Row']
export type GlobalSetting = Database['public']['Tables']['global_settings']['Row']
export type ContactRequest = Database['public']['Tables']['contact_requests']['Row']

export interface GlobalSettings {
  unlock_fee: number
  extra_km_rate: number
  km_per_day: number
  airport_option: number
  predelivery_option: number
  badge_color_xs?: string
  badge_color_s?: string
  badge_color_m?: string
  badge_color_l?: string
  badge_color_xl?: string
  monthly_rental_url?: string
}

export interface PriceCalculation {
  basePrice: number
  unlockFee: number
  kmIncluded: number
  extraKm: number
  extraKmCost: number
  airportCost: number
  airportDepartureCost: number
  airportArrivalCost: number
  predeliveryCost: number
  totalPrice: number
  durationMinutes: number
}
