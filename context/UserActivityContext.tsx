import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { activityService, UserActivity, StudySession, ActivityType } from '../services/activityService';

interface AnalyticsData {
  activities: UserActivity[];
  sessions: StudySession[];
  stats: {
    totalTasks: number;
    totalStudyTime: number; // in minutes
    streak: number;
    avgAccuracy: number;
    completionRate: number;
  };
}

interface UserActivityContextType {
  data: AnalyticsData;
  loading: boolean;
  logActivity: (type: ActivityType, details: string, score?: number) => Promise<void>;
  startSession: (type?: ActivityType) => Promise<string | undefined>;
  endSession: (sessionId: string | undefined) => Promise<void>;
  refreshStats: () => Promise<void>;
}

const UserActivityContext = createContext<UserActivityContextType | undefined>(undefined);

export function UserActivityProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AnalyticsData>({
    activities: [],
    sessions: [],
    stats: {
      totalTasks: 0,
      totalStudyTime: 0,
      streak: 0,
      avgAccuracy: 0,
      completionRate: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  const calculateStats = (activities: UserActivity[], sessions: StudySession[]) => {
    const totalTasks = activities.length;
    const totalStudyTime = sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
    
    // Streaks - Actual date comparison
    let streak = 0;
    if (activities.length > 0) {
      const dates = [...new Set(activities.map(a => a.created_at.split('T')[0]))].sort().reverse();
      let checkDate = new Date();
      
      for (let i = 0; i < dates.length; i++) {
        const d = dates[i];
        const expected = checkDate.toISOString().split('T')[0];
        if (d === expected) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    const scoresWithValues = activities.filter(a => a.score !== undefined);
    const avgAccuracy = scoresWithValues.length > 0 
      ? scoresWithValues.reduce((a, b) => a + (b.score || 0), 0) / scoresWithValues.length 
      : 0;

    return {
      totalTasks,
      totalStudyTime,
      streak,
      avgAccuracy,
      completionRate: totalTasks > 0 ? 100 : 0, 
    };
  };

  const refreshStats = async () => {
    setLoading(true);
    const result = await activityService.fetchDashboardData();
    if (result) {
      setData({
        activities: result.activities,
        sessions: result.sessions,
        stats: calculateStats(result.activities, result.sessions),
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshStats();
  }, []);

  const logActivity = async (type: ActivityType, details: string, score?: number) => {
    const result = await activityService.logActivity(type, details, score);
    if (result) {
      await refreshStats();
    }
  };

  const startSession = async (type?: ActivityType) => {
    const session = await activityService.startSession(type);
    return session?.id;
  };

  const endSession = async (sessionId: string | undefined) => {
    if (!sessionId) return;
    await activityService.endSession(sessionId);
    await refreshStats();
  };

  return (
    <UserActivityContext.Provider 
      value={{ 
        data, 
        loading, 
        logActivity, 
        startSession, 
        endSession, 
        refreshStats 
      }}
    >
      {children}
    </UserActivityContext.Provider>
  );
}

export const useUserActivity = () => {
  const context = useContext(UserActivityContext);
  if (context === undefined) {
    throw new Error('useUserActivity must be used within a UserActivityProvider');
  }
  return context;
};
