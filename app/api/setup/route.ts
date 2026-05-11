import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Create tables using raw SQL
    const createTablesSQL = `
      -- Enable UUID extension
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      -- Create pricing_grids table
      CREATE TABLE IF NOT EXISTS pricing_grids (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(50) NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create vehicles table
      CREATE TABLE IF NOT EXISTS vehicles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        key VARCHAR(50) UNIQUE NOT NULL,
        model_name VARCHAR(100) NOT NULL,
        size_category VARCHAR(2) NOT NULL,
        pricing_grid_id UUID REFERENCES pricing_grids(id),
        image_url TEXT,
        display_order INTEGER,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create minute_prices table
      CREATE TABLE IF NOT EXISTS minute_prices (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        pricing_grid_id UUID REFERENCES pricing_grids(id),
        duration_minutes INTEGER NOT NULL,
        price_ttc DECIMAL(10,2) NOT NULL,
        km_included INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(pricing_grid_id, duration_minutes)
      );

      -- Create global_settings table
      CREATE TABLE IF NOT EXISTS global_settings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        key VARCHAR(50) UNIQUE NOT NULL,
        value DECIMAL(10,2) NOT NULL,
        description TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create contact_requests table
      CREATE TABLE IF NOT EXISTS contact_requests (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) NOT NULL,
        vehicle_id UUID REFERENCES vehicles(id),
        estimated_price DECIMAL(10,2),
        duration_minutes INTEGER,
        distance_km INTEGER,
        departure_datetime TIMESTAMP WITH TIME ZONE,
        return_datetime TIMESTAMP WITH TIME ZONE,
        airport_option BOOLEAN DEFAULT false,
        predelivery_option BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status VARCHAR(20) DEFAULT 'pending'
      );

      -- Create index for fast price lookups
      CREATE INDEX IF NOT EXISTS idx_minute_prices_lookup
      ON minute_prices(pricing_grid_id, duration_minutes);
    `

    // Execute table creation
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTablesSQL })

    if (createError) {
      // Tables might already exist, continue with seeding
      console.log('Tables may already exist:', createError.message)
    }

    // Insert pricing grids
    const pricingGrids = [
      { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', name: 'Grid S - Toyota Aygo X', description: 'Pricing for small vehicles' },
      { id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', name: 'Grid M - Toyota Yaris', description: 'Pricing for medium vehicles' },
      { id: 'c3d4e5f6-a7b8-9012-cdef-123456789012', name: 'Grid L - Yaris Cross & Kangoo', description: 'Pricing for large vehicles' },
      { id: 'd4e5f6a7-b8c9-0123-defa-234567890123', name: 'Grid L-Util - Proace', description: 'Pricing for utility vehicles' },
      { id: 'e5f6a7b8-c9d0-1234-efab-345678901234', name: 'Grid XL - Transit & Maxus', description: 'Pricing for extra large vehicles' },
    ]

    const { error: gridError } = await supabase
      .from('pricing_grids')
      .upsert(pricingGrids, { onConflict: 'id' })

    if (gridError) {
      console.log('Error inserting pricing grids:', gridError.message)
    }

    // Insert vehicles
    const vehicles = [
      { key: 'toyota_aygo_x', model_name: 'Toyota Aygo X', size_category: 'S', pricing_grid_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', display_order: 1, image_url: '/vehicles/aygo.png' },
      { key: 'toyota_yaris', model_name: 'Toyota Yaris', size_category: 'M', pricing_grid_id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', display_order: 2, image_url: '/vehicles/yaris.png' },
      { key: 'toyota_yaris_cross', model_name: 'Toyota Yaris Cross', size_category: 'L', pricing_grid_id: 'c3d4e5f6-a7b8-9012-cdef-123456789012', display_order: 3, image_url: '/vehicles/yaris-cross.png' },
      { key: 'toyota_yaris_cross_hiver', model_name: 'Toyota Yaris Cross hiver', size_category: 'L', pricing_grid_id: 'c3d4e5f6-a7b8-9012-cdef-123456789012', display_order: 4, image_url: '/vehicles/yaris-cross-hiver.png' },
      { key: 'renault_kangoo_etech', model_name: 'Renault Kangoo E-Tech 3m3', size_category: 'L', pricing_grid_id: 'c3d4e5f6-a7b8-9012-cdef-123456789012', display_order: 5, image_url: '/vehicles/kangoo.png' },
      { key: 'toyota_proace', model_name: 'Toyota Proace 3m3', size_category: 'L', pricing_grid_id: 'd4e5f6a7-b8c9-0123-defa-234567890123', display_order: 6, image_url: '/vehicles/proace.png' },
      { key: 'ford_transit', model_name: 'Ford Transit 6m3', size_category: 'XL', pricing_grid_id: 'e5f6a7b8-c9d0-1234-efab-345678901234', display_order: 7, image_url: '/vehicles/transit.png' },
      { key: 'maxus_deliver', model_name: 'Maxus Deliver 7m3', size_category: 'XL', pricing_grid_id: 'e5f6a7b8-c9d0-1234-efab-345678901234', display_order: 8, image_url: '/vehicles/maxus.png' },
    ]

    const { error: vehicleError } = await supabase
      .from('vehicles')
      .upsert(vehicles, { onConflict: 'key' })

    if (vehicleError) {
      console.log('Error inserting vehicles:', vehicleError.message)
    }

    // Insert global settings
    const globalSettings = [
      { key: 'unlock_fee', value: 1.49, description: 'Frais de déverrouillage par trajet' },
      { key: 'extra_km_rate', value: 0.30, description: 'Prix par km supplémentaire' },
      { key: 'km_per_day', value: 100, description: 'Kilomètres inclus par jour' },
      { key: 'airport_option', value: 12.99, description: 'Option trajet aéroport' },
      { key: 'predelivery_option', value: 10.00, description: 'Option pré-livraison' },
    ]

    const { error: settingsError } = await supabase
      .from('global_settings')
      .upsert(globalSettings, { onConflict: 'key' })

    if (settingsError) {
      console.log('Error inserting global settings:', settingsError.message)
    }

    // Generate minute prices for all grids (degressive pricing)
    // Base rates per grid (starting price per minute)
    const gridBaseRates: Record<string, number> = {
      'a1b2c3d4-e5f6-7890-abcd-ef1234567890': 0.34, // Grid S
      'b2c3d4e5-f6a7-8901-bcde-f12345678901': 0.36, // Grid M
      'c3d4e5f6-a7b8-9012-cdef-123456789012': 0.38, // Grid L
      'd4e5f6a7-b8c9-0123-defa-234567890123': 0.40, // Grid L-Util
      'e5f6a7b8-c9d0-1234-efab-345678901234': 0.42, // Grid XL
    }

    // Generate sample prices for key duration points
    // In production, this would come from the Excel file
    const keyDurations = [
      1, 5, 10, 15, 30, 45, 60, // First hour by minutes
      90, 120, 150, 180, // 1.5h, 2h, 2.5h, 3h
      240, 300, 360, 420, 480, 540, 600, // 4h to 10h
      720, 840, 960, 1080, 1200, 1320, 1440, // 12h to 24h (1 day)
      2160, 2880, 4320, 5760, 7200, 8640, 10080, // 1.5 days to 7 days
      11520, 12960, 14400, 17280, 20160, 23040, 25920, // 8 days to 18 days
      28800, 31680, 34560, 37440, 40320, 43200, // 20 days to 30 days
    ]

    for (const [gridId, baseRate] of Object.entries(gridBaseRates)) {
      const minutePrices = keyDurations.map(minutes => {
        // Degressive pricing formula
        // Price decreases per minute as duration increases
        let pricePerMinute = baseRate

        if (minutes > 60) pricePerMinute = baseRate * 0.85
        if (minutes > 180) pricePerMinute = baseRate * 0.70
        if (minutes > 480) pricePerMinute = baseRate * 0.55
        if (minutes > 1440) pricePerMinute = baseRate * 0.40
        if (minutes > 4320) pricePerMinute = baseRate * 0.30
        if (minutes > 10080) pricePerMinute = baseRate * 0.22
        if (minutes > 20160) pricePerMinute = baseRate * 0.18

        const price = Math.round(minutes * pricePerMinute * 100) / 100
        const daysStarted = Math.ceil(minutes / 1440)
        const kmIncluded = daysStarted * 100

        return {
          pricing_grid_id: gridId,
          duration_minutes: minutes,
          price_ttc: price,
          km_included: kmIncluded,
        }
      })

      const { error: priceError } = await supabase
        .from('minute_prices')
        .upsert(minutePrices, { onConflict: 'pricing_grid_id,duration_minutes' })

      if (priceError) {
        console.log(`Error inserting prices for grid ${gridId}:`, priceError.message)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully'
    })

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to setup database' },
      { status: 500 }
    )
  }
}
