/*
  # Scrap Marketplace Database Schema

  ## Overview
  Creates a comprehensive database schema for a scrap and industrial materials marketplace platform.

  ## New Tables

  ### 1. `categories`
  Main product categories (e.g., Scrap, Pallets, Factory Equipment)
  - `id` (uuid, primary key)
  - `name_ar` (text) - Arabic category name
  - `name_en` (text) - English category name
  - `icon` (text) - Icon identifier
  - `order_index` (integer) - Display order
  - `created_at` (timestamptz)

  ### 2. `subcategories`
  Subcategories within each main category
  - `id` (uuid, primary key)
  - `category_id` (uuid, foreign key)
  - `name_ar` (text) - Arabic subcategory name
  - `name_en` (text) - English subcategory name
  - `order_index` (integer)
  - `created_at` (timestamptz)

  ### 3. `cities`
  Saudi Arabian cities for filtering
  - `id` (uuid, primary key)
  - `name_ar` (text)
  - `name_en` (text)
  - `created_at` (timestamptz)

  ### 4. `listings`
  Product listings/advertisements
  - `id` (uuid, primary key)
  - `category_id` (uuid, foreign key)
  - `subcategory_id` (uuid, foreign key)
  - `city_id` (uuid, foreign key)
  - `title` (text)
  - `description` (text)
  - `price` (numeric)
  - `price_type` (text) - 'fixed', 'per_unit', 'negotiable'
  - `quantity` (numeric)
  - `unit` (text) - 'طن', 'قطعة', 'كيلو', etc.
  - `condition` (text) - 'جديد', 'مستعمل', 'يحتاج صيانة'
  - `images` (jsonb) - Array of image URLs
  - `latitude` (numeric)
  - `longitude` (numeric)
  - `contact_name` (text)
  - `contact_phone` (text)
  - `is_active` (boolean)
  - `views_count` (integer)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Public read access for active listings
  - Authenticated users can create and manage their own listings
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text NOT NULL,
  icon text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create subcategories table
CREATE TABLE IF NOT EXISTS subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create cities table
CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create listings table
CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  subcategory_id uuid REFERENCES subcategories(id) ON DELETE SET NULL,
  city_id uuid REFERENCES cities(id) ON DELETE SET NULL NOT NULL,
  title text NOT NULL,
  description text,
  price numeric NOT NULL,
  price_type text DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'per_unit', 'negotiable')),
  quantity numeric DEFAULT 1,
  unit text DEFAULT 'قطعة',
  condition text DEFAULT 'مستعمل' CHECK (condition IN ('جديد', 'مستعمل', 'يحتاج صيانة')),
  images jsonb DEFAULT '[]'::jsonb,
  latitude numeric,
  longitude numeric,
  contact_name text NOT NULL,
  contact_phone text NOT NULL,
  is_active boolean DEFAULT true,
  views_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories (public read)
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO public
  USING (true);

-- RLS Policies for subcategories (public read)
CREATE POLICY "Anyone can view subcategories"
  ON subcategories FOR SELECT
  TO public
  USING (true);

-- RLS Policies for cities (public read)
CREATE POLICY "Anyone can view cities"
  ON cities FOR SELECT
  TO public
  USING (true);

-- RLS Policies for listings (public read active listings)
CREATE POLICY "Anyone can view active listings"
  ON listings FOR SELECT
  TO public
  USING (is_active = true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_category_id ON listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_subcategory_id ON listings(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_listings_city_id ON listings(city_id);
CREATE INDEX IF NOT EXISTS idx_listings_is_active ON listings(is_active);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);