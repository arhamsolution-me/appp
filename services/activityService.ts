import { supabase } from '../utils/supabase';

export type ActivityType = 'math' | 'quiz' | 'essay' | 'grammar' | 'summarizer' | 'ocr' | 'pdf_convert';

export interface UserActivity {
  id?: string;
  user_id: string;
  type: ActivityType;
  details: string;
  score?: number;
  created_at: string;
}

export interface StudySession {
  id?: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  activity_type?: ActivityType;
}

class ActivityService {
  /**
   * Logs a specific academic activity.
   */
  async logActivity(type: ActivityType, details: string, score?: number) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const activity: UserActivity = {
        user_id: user.id,
        type,
        details,
        score,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('user_activities')
        .insert(activity)
        .select()
        .single();

      if (error) {
        console.warn('Supabase logActivity error:', error.message);
        return null;
      }
      return data;
    } catch (err) {
      console.error('Activity logging error:', err);
      return null;
    }
  }

  /**
   * Starts a study session timer.
   */
  async startSession(type?: ActivityType) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const session: StudySession = {
        user_id: user.id,
        start_time: new Date().toISOString(),
        activity_type: type,
      };

      const { data, error } = await supabase
        .from('study_sessions')
        .insert(session)
        .select()
        .single();

      if (error) return null;
      return data;
    } catch (err) {
      return null;
    }
  }

  /**
   * Ends a study session and calculates duration.
   */
  async endSession(sessionId: string | undefined) {
    if (!sessionId) return null;

    try {
      const { data: session, error: fetchError } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (fetchError || !session) return null;

      const endTime = new Date();
      const startTime = new Date(session.start_time);
      const durationMinutes = Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / 60000));

      const { data, error } = await supabase
        .from('study_sessions')
        .update({
          end_time: endTime.toISOString(),
          duration_minutes: durationMinutes,
        })
        .eq('id', sessionId)
        .select()
        .single();
      
      return data;
    } catch (err) {
      return null;
    }
  }

  /**
   * Fetches accurate dashboard data for the current user.
   * Returns empty arrays if no data exists.
   */
  async fetchDashboardData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { activities: [], sessions: [] };

      const [activitiesRes, sessionsRes] = await Promise.all([
        supabase
          .from('user_activities')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('study_sessions')
          .select('*')
          .eq('user_id', user.id)
          .not('duration_minutes', 'is', null)
          .order('start_time', { ascending: false })
      ]);

      return {
        activities: activitiesRes.data || [],
        sessions: sessionsRes.data || []
      };
    } catch (err) {
      console.error('Fetch dashboard data error:', err);
      return { activities: [], sessions: [] };
    }
  }
}

export const activityService = new ActivityService();
