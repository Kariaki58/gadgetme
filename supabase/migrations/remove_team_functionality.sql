-- Remove Team/Sales Management Functionality
-- This migration removes any team-related columns and tables if they exist

-- Drop team-related tables if they exist
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS sales_reps CASCADE;
DROP TABLE IF EXISTS sales_teams CASCADE;
DROP TABLE IF EXISTS team_permissions CASCADE;
DROP TABLE IF EXISTS sales_rep_permissions CASCADE;

-- Remove role column from users table if it exists and was only used for teams
-- Note: We keep the column if it's being used for other purposes
-- Uncomment the following line if you want to remove the role column:
-- ALTER TABLE users DROP COLUMN IF EXISTS role;

-- Drop any team-related functions
DROP FUNCTION IF EXISTS check_team_permission();
DROP FUNCTION IF EXISTS get_team_members();
DROP FUNCTION IF EXISTS is_sales_rep();

-- Drop any team-related policies
DROP POLICY IF EXISTS "Team members can access store data" ON stores;
DROP POLICY IF EXISTS "Sales reps can view store data" ON stores;
DROP POLICY IF EXISTS "Team members can view products" ON products;
DROP POLICY IF EXISTS "Sales reps can view products" ON products;

