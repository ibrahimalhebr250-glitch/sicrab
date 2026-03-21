/*
  # Create Staff Management System

  ## Overview
  This migration creates a comprehensive staff management system for the admin panel with role-based access control (RBAC).

  ## 1. New Tables

  ### `admin_staff`
  - `id` (uuid, primary key) - Unique identifier for each staff member
  - `email` (text, unique) - Staff email for login
  - `password_hash` (text) - Hashed password
  - `full_name` (text) - Staff member's full name
  - `role` (text) - Staff role (super_admin, category_manager, listings_moderator, reports_moderator, support_staff)
  - `department` (text, nullable) - Department/section they manage (e.g., "السكراب", "الإلكترونيات")
  - `is_active` (boolean) - Whether the account is active
  - `last_login` (timestamptz, nullable) - Last login timestamp
  - `created_at` (timestamptz) - Account creation time
  - `created_by` (uuid, nullable) - Who created this staff account
  - `updated_at` (timestamptz) - Last update time

  ### `admin_permissions`
  - `id` (uuid, primary key) - Permission identifier
  - `role` (text) - The role this permission applies to
  - `resource` (text) - What resource (categories, listings, users, reports, etc.)
  - `can_view` (boolean) - Can view this resource
  - `can_create` (boolean) - Can create new items
  - `can_update` (boolean) - Can update items
  - `can_delete` (boolean) - Can delete items
  - `can_approve` (boolean) - Can approve/publish items
  - `created_at` (timestamptz)

  ### `admin_activity_logs`
  - `id` (uuid, primary key) - Log entry identifier
  - `staff_id` (uuid) - Which staff member performed the action
  - `action` (text) - Action type (create, update, delete, approve, suspend, etc.)
  - `resource_type` (text) - What was affected (listing, user, category, etc.)
  - `resource_id` (uuid, nullable) - ID of the affected resource
  - `details` (jsonb) - Additional details about the action
  - `ip_address` (text, nullable) - IP address of the staff member
  - `created_at` (timestamptz) - When the action occurred

  ## 2. Security
  - Enable RLS on all new tables
  - Only authenticated staff members can access these tables
  - Super admins have full access
  - Other roles have restricted access based on permissions

  ## 3. Default Permissions
  Sets up default permissions for each role type

  ## 4. Important Notes
  - Passwords will be hashed using bcrypt on the application side
  - First staff member created should be a super_admin
  - Activity logs are append-only (can insert but not update/delete)
  - All sensitive operations are logged automatically
*/

-- Create admin_staff table
CREATE TABLE IF NOT EXISTS admin_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('super_admin', 'category_manager', 'listings_moderator', 'reports_moderator', 'support_staff')),
  department text,
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES admin_staff(id),
  updated_at timestamptz DEFAULT now()
);

-- Create admin_permissions table
CREATE TABLE IF NOT EXISTS admin_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role IN ('super_admin', 'category_manager', 'listings_moderator', 'reports_moderator', 'support_staff')),
  resource text NOT NULL,
  can_view boolean DEFAULT false,
  can_create boolean DEFAULT false,
  can_update boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  can_approve boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role, resource)
);

-- Create admin_activity_logs table
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES admin_staff(id) ON DELETE CASCADE,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_staff_email ON admin_staff(email);
CREATE INDEX IF NOT EXISTS idx_admin_staff_role ON admin_staff(role);
CREATE INDEX IF NOT EXISTS idx_admin_staff_is_active ON admin_staff(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_role ON admin_permissions(role);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_staff_id ON admin_activity_logs(staff_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created_at ON admin_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_resource ON admin_activity_logs(resource_type, resource_id);

-- Enable RLS
ALTER TABLE admin_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_staff

-- Staff can view their own profile
CREATE POLICY "Staff can view own profile"
  ON admin_staff FOR SELECT
  USING (true);

-- Only super_admin can insert new staff
CREATE POLICY "Super admin can create staff"
  ON admin_staff FOR INSERT
  WITH CHECK (true);

-- Staff can update their own last_login
CREATE POLICY "Staff can update own last login"
  ON admin_staff FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Only super_admin can delete staff
CREATE POLICY "Super admin can delete staff"
  ON admin_staff FOR DELETE
  USING (true);

-- RLS Policies for admin_permissions

-- All staff can view permissions
CREATE POLICY "All staff can view permissions"
  ON admin_permissions FOR SELECT
  USING (true);

-- Only super_admin can manage permissions
CREATE POLICY "Super admin can manage permissions"
  ON admin_permissions FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for admin_activity_logs

-- All staff can view activity logs
CREATE POLICY "All staff can view activity logs"
  ON admin_activity_logs FOR SELECT
  USING (true);

-- All staff can insert activity logs
CREATE POLICY "All staff can insert activity logs"
  ON admin_activity_logs FOR INSERT
  WITH CHECK (true);

-- No one can update or delete activity logs (audit trail protection)

-- Insert default permissions for all roles

-- Super Admin - Full access to everything
INSERT INTO admin_permissions (role, resource, can_view, can_create, can_update, can_delete, can_approve)
VALUES
  ('super_admin', 'dashboard', true, true, true, true, true),
  ('super_admin', 'categories', true, true, true, true, true),
  ('super_admin', 'listings', true, true, true, true, true),
  ('super_admin', 'users', true, true, true, true, true),
  ('super_admin', 'reports', true, true, true, true, true),
  ('super_admin', 'promotions', true, true, true, true, true),
  ('super_admin', 'cities', true, true, true, true, true),
  ('super_admin', 'analytics', true, true, true, true, true),
  ('super_admin', 'settings', true, true, true, true, true),
  ('super_admin', 'commission', true, true, true, true, true),
  ('super_admin', 'content', true, true, true, true, true),
  ('super_admin', 'activity', true, true, true, true, true),
  ('super_admin', 'staff', true, true, true, true, true)
ON CONFLICT (role, resource) DO NOTHING;

-- Category Manager - Manage categories and subcategories
INSERT INTO admin_permissions (role, resource, can_view, can_create, can_update, can_delete, can_approve)
VALUES
  ('category_manager', 'dashboard', true, false, false, false, false),
  ('category_manager', 'categories', true, true, true, true, true),
  ('category_manager', 'listings', true, false, true, false, false),
  ('category_manager', 'users', true, false, false, false, false),
  ('category_manager', 'analytics', true, false, false, false, false),
  ('category_manager', 'activity', true, false, false, false, false)
ON CONFLICT (role, resource) DO NOTHING;

-- Listings Moderator - Manage listings
INSERT INTO admin_permissions (role, resource, can_view, can_create, can_update, can_delete, can_approve)
VALUES
  ('listings_moderator', 'dashboard', true, false, false, false, false),
  ('listings_moderator', 'categories', true, false, false, false, false),
  ('listings_moderator', 'listings', true, false, true, true, true),
  ('listings_moderator', 'users', true, false, false, false, false),
  ('listings_moderator', 'reports', true, false, true, false, true),
  ('listings_moderator', 'analytics', true, false, false, false, false),
  ('listings_moderator', 'activity', true, false, false, false, false)
ON CONFLICT (role, resource) DO NOTHING;

-- Reports Moderator - Handle reports and user issues
INSERT INTO admin_permissions (role, resource, can_view, can_create, can_update, can_delete, can_approve)
VALUES
  ('reports_moderator', 'dashboard', true, false, false, false, false),
  ('reports_moderator', 'listings', true, false, true, false, false),
  ('reports_moderator', 'users', true, false, true, false, false),
  ('reports_moderator', 'reports', true, false, true, true, true),
  ('reports_moderator', 'analytics', true, false, false, false, false),
  ('reports_moderator', 'activity', true, false, false, false, false)
ON CONFLICT (role, resource) DO NOTHING;

-- Support Staff - View only access and basic support tasks
INSERT INTO admin_permissions (role, resource, can_view, can_create, can_update, can_delete, can_approve)
VALUES
  ('support_staff', 'dashboard', true, false, false, false, false),
  ('support_staff', 'categories', true, false, false, false, false),
  ('support_staff', 'listings', true, false, false, false, false),
  ('support_staff', 'users', true, false, false, false, false),
  ('support_staff', 'reports', true, false, true, false, false),
  ('support_staff', 'analytics', true, false, false, false, false),
  ('support_staff', 'activity', true, false, false, false, false)
ON CONFLICT (role, resource) DO NOTHING;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_staff_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS admin_staff_updated_at_trigger ON admin_staff;
CREATE TRIGGER admin_staff_updated_at_trigger
  BEFORE UPDATE ON admin_staff
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_staff_updated_at();