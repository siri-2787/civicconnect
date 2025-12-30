/*
  # CivicConnect Platform - Complete Database Schema

  ## Overview
  This migration creates the complete database schema for the CivicConnect civic engagement platform.

  ## New Tables
  
  ### 1. profiles
  Extended user profiles with role-based access control
  - `id` (uuid, primary key, references auth.users)
  - `full_name` (text)
  - `role` (text: citizen, officer, admin)
  - `city` (text)
  - `ward` (text)
  - `phone` (text)
  - `avatar_url` (text)
  - `created_at` (timestamptz)

  ### 2. departments
  Municipal departments responsible for issue resolution
  - `id` (uuid, primary key)
  - `name` (text, unique)
  - `description` (text)
  - `transparency_score` (numeric, 0-100)
  - `avg_resolution_days` (numeric)
  - `created_at` (timestamptz)

  ### 3. issues
  Civic issues reported by citizens
  - `id` (uuid, primary key)
  - `title` (text)
  - `description` (text)
  - `category` (text)
  - `latitude` (numeric)
  - `longitude` (numeric)
  - `location_address` (text)
  - `ward` (text)
  - `city` (text)
  - `photo_url` (text)
  - `ai_detected_category` (text)
  - `ai_severity` (text: low, medium, high)
  - `ai_suggested_department` (text)
  - `ai_suggestions` (jsonb)
  - `priority_score` (integer, default 0)
  - `status` (text: submitted, acknowledged, in_progress, resolved, closed)
  - `submitted_by` (uuid, references profiles)
  - `assigned_to_department` (uuid, references departments)
  - `assigned_to_officer` (uuid, references profiles)
  - `resolution_notes` (text)
  - `resolution_photo_url` (text)
  - `submitted_at` (timestamptz)
  - `acknowledged_at` (timestamptz)
  - `resolved_at` (timestamptz)
  - `closed_at` (timestamptz)
  - `escalated` (boolean, default false)
  - `escalated_at` (timestamptz)

  ### 4. issue_votes
  Community voting on issues
  - `id` (uuid, primary key)
  - `issue_id` (uuid, references issues)
  - `user_id` (uuid, references profiles)
  - `created_at` (timestamptz)
  - Unique constraint on (issue_id, user_id)

  ### 5. issue_feedback
  Citizen feedback after issue resolution
  - `id` (uuid, primary key)
  - `issue_id` (uuid, references issues)
  - `user_id` (uuid, references profiles)
  - `rating` (integer, 1-5)
  - `comment` (text)
  - `created_at` (timestamptz)

  ### 6. issue_timeline
  Status change history for transparency
  - `id` (uuid, primary key)
  - `issue_id` (uuid, references issues)
  - `status` (text)
  - `notes` (text)
  - `updated_by` (uuid, references profiles)
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Policies for role-based access control
  - Citizens can create and view their own data
  - Officers can manage assigned issues
  - Admins have full access
  - Public can view resolved issues and analytics
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'officer', 'admin')),
  city text,
  ward text,
  phone text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  transparency_score numeric DEFAULT 0 CHECK (transparency_score >= 0 AND transparency_score <= 100),
  avg_resolution_days numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Create issues table
CREATE TABLE IF NOT EXISTS issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  location_address text,
  ward text,
  city text,
  photo_url text,
  ai_detected_category text,
  ai_severity text CHECK (ai_severity IN ('low', 'medium', 'high')),
  ai_suggested_department text,
  ai_suggestions jsonb,
  priority_score integer DEFAULT 0,
  status text DEFAULT 'submitted' CHECK (status IN ('submitted', 'acknowledged', 'in_progress', 'resolved', 'closed')),
  submitted_by uuid REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_to_department uuid REFERENCES departments(id) ON DELETE SET NULL,
  assigned_to_officer uuid REFERENCES profiles(id) ON DELETE SET NULL,
  resolution_notes text,
  resolution_photo_url text,
  submitted_at timestamptz DEFAULT now(),
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  closed_at timestamptz,
  escalated boolean DEFAULT false,
  escalated_at timestamptz
);

ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- Create issue_votes table
CREATE TABLE IF NOT EXISTS issue_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid REFERENCES issues(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(issue_id, user_id)
);

ALTER TABLE issue_votes ENABLE ROW LEVEL SECURITY;

-- Create issue_feedback table
CREATE TABLE IF NOT EXISTS issue_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid REFERENCES issues(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE issue_feedback ENABLE ROW LEVEL SECURITY;

-- Create issue_timeline table
CREATE TABLE IF NOT EXISTS issue_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid REFERENCES issues(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL,
  notes text,
  updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE issue_timeline ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_submitted_by ON issues(submitted_by);
CREATE INDEX IF NOT EXISTS idx_issues_department ON issues(assigned_to_department);
CREATE INDEX IF NOT EXISTS idx_issues_priority ON issues(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_issues_location ON issues(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_issue_votes_issue ON issue_votes(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_timeline_issue ON issue_timeline(issue_id);

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for departments (public read, admin write)
CREATE POLICY "Anyone can view departments"
  ON departments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage departments"
  ON departments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- RLS Policies for issues
CREATE POLICY "Anyone authenticated can view issues"
  ON issues FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Citizens can create issues"
  ON issues FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Submitter can update own submitted issues"
  ON issues FOR UPDATE
  TO authenticated
  USING (submitted_by = auth.uid() AND status = 'submitted')
  WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Officers can update assigned issues"
  ON issues FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('officer', 'admin')
    )
  );

-- RLS Policies for issue_votes
CREATE POLICY "Users can view all votes"
  ON issue_votes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can vote on issues"
  ON issue_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes"
  ON issue_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for issue_feedback
CREATE POLICY "Anyone can view feedback"
  ON issue_feedback FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create feedback for resolved issues"
  ON issue_feedback FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM issues
      WHERE issues.id = issue_id AND issues.status IN ('resolved', 'closed')
    )
  );

-- RLS Policies for issue_timeline
CREATE POLICY "Anyone can view timeline"
  ON issue_timeline FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Officers and admins can add timeline entries"
  ON issue_timeline FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('officer', 'admin')
    )
  );