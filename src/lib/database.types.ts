export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: 'citizen' | 'officer' | 'admin';
          city: string | null;
          ward: string | null;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role?: 'citizen' | 'officer' | 'admin';
          city?: string | null;
          ward?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: 'citizen' | 'officer' | 'admin';
          city?: string | null;
          ward?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      departments: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          transparency_score: number;
          avg_resolution_days: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          transparency_score?: number;
          avg_resolution_days?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          transparency_score?: number;
          avg_resolution_days?: number;
          created_at?: string;
        };
      };
      issues: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: string;
          latitude: number;
          longitude: number;
          location_address: string | null;
          ward: string | null;
          city: string | null;
          photo_url: string | null;
          ai_detected_category: string | null;
          ai_severity: 'low' | 'medium' | 'high' | null;
          ai_suggested_department: string | null;
          ai_suggestions: Json | null;
          priority_score: number;
          status: 'submitted' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed';
          submitted_by: string;
          assigned_to_department: string | null;
          assigned_to_officer: string | null;
          resolution_notes: string | null;
          resolution_photo_url: string | null;
          submitted_at: string;
          acknowledged_at: string | null;
          resolved_at: string | null;
          closed_at: string | null;
          escalated: boolean;
          escalated_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          category: string;
          latitude: number;
          longitude: number;
          location_address?: string | null;
          ward?: string | null;
          city?: string | null;
          photo_url?: string | null;
          ai_detected_category?: string | null;
          ai_severity?: 'low' | 'medium' | 'high' | null;
          ai_suggested_department?: string | null;
          ai_suggestions?: Json | null;
          priority_score?: number;
          status?: 'submitted' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed';
          submitted_by: string;
          assigned_to_department?: string | null;
          assigned_to_officer?: string | null;
          resolution_notes?: string | null;
          resolution_photo_url?: string | null;
          submitted_at?: string;
          acknowledged_at?: string | null;
          resolved_at?: string | null;
          closed_at?: string | null;
          escalated?: boolean;
          escalated_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          category?: string;
          latitude?: number;
          longitude?: number;
          location_address?: string | null;
          ward?: string | null;
          city?: string | null;
          photo_url?: string | null;
          ai_detected_category?: string | null;
          ai_severity?: 'low' | 'medium' | 'high' | null;
          ai_suggested_department?: string | null;
          ai_suggestions?: Json | null;
          priority_score?: number;
          status?: 'submitted' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed';
          submitted_by?: string;
          assigned_to_department?: string | null;
          assigned_to_officer?: string | null;
          resolution_notes?: string | null;
          resolution_photo_url?: string | null;
          submitted_at?: string;
          acknowledged_at?: string | null;
          resolved_at?: string | null;
          closed_at?: string | null;
          escalated?: boolean;
          escalated_at?: string | null;
        };
      };
      issue_votes: {
        Row: {
          id: string;
          issue_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          issue_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          issue_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      issue_feedback: {
        Row: {
          id: string;
          issue_id: string;
          user_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          issue_id: string;
          user_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          issue_id?: string;
          user_id?: string;
          rating?: number;
          comment?: string | null;
          created_at?: string;
        };
      };
      issue_timeline: {
        Row: {
          id: string;
          issue_id: string;
          status: string;
          notes: string | null;
          updated_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          issue_id: string;
          status: string;
          notes?: string | null;
          updated_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          issue_id?: string;
          status?: string;
          notes?: string | null;
          updated_by?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
