import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Category {
  id: string;
  name_ar: string;
  name_en: string;
  icon: string;
  order_index: number;
  slug: string | null;
  description_ar: string | null;
  created_at: string;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name_ar: string;
  name_en: string;
  order_index: number;
  slug: string | null;
  description_ar: string | null;
  is_active: boolean;
  created_at: string;
}

export interface City {
  id: string;
  name_ar: string;
  name_en: string;
  created_at: string;
}

export interface Listing {
  id: string;
  category_id: string;
  subcategory_id: string | null;
  city_id: string;
  user_id: string | null;
  title: string;
  description: string | null;
  price: number;
  price_type: 'fixed' | 'per_unit' | 'negotiable';
  quantity: number;
  unit: string;
  condition: 'جديد' | 'مستعمل' | 'يحتاج صيانة';
  images: string[];
  latitude: number | null;
  longitude: number | null;
  contact_name: string;
  contact_phone: string;
  whatsapp_number: string | null;
  whatsapp_clicks: number;
  shares_count: number;
  is_active: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
  cities?: City;
  categories?: Category;
  subcategories?: Subcategory;
}
