import { useMemo } from 'react';
import { useUserActivity } from '../context/UserActivityContext';
import { ActivityType } from '../services/activityService';

export const useDashboardData = () => {
  const { data, loading } = useUserActivity();

  /**
   * Generates chart-ready data for study time over the last 7 days.
   * Only returns data if sessions exist.
   */
  const studyTimeLineData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDay = new Date().getDay();
    const orderedDays = [...days.slice(currentDay + 1), ...days.slice(0, currentDay + 1)];
    
    const timeData = new Array(7).fill(0);
    const now = new Date();
    
    if (!data.sessions || data.sessions.length === 0) {
      return { labels: orderedDays, datasets: [{ data: timeData }] };
    }

    data.sessions.forEach(session => {
      if (!session.start_time || !session.duration_minutes) return;
      
      const sessionDate = new Date(session.start_time);
      const diffDays = Math.floor((now.getTime() - sessionDate.getTime()) / (1000 * 3600 * 24));
      
      if (diffDays >= 0 && diffDays < 7) {
        timeData[6 - diffDays] += session.duration_minutes;
      }
    });

    return {
      labels: orderedDays,
      datasets: [{ data: timeData }],
    };
  }, [data.sessions]);

  /**
   * Identifies strong and weak topics based on average scores.
   * Insight threshold: Only visible if sessions >= 3.
   */
  const performanceInsights = useMemo(() => {
    const minSessionsForInsights = 3;
    const hasEnoughData = data.sessions.length >= minSessionsForInsights;

    if (!hasEnoughData) {
      return { 
        strongest: null, 
        weakest: null, 
        all: [], 
        hasEnoughData: false 
      };
    }

    const topicScores: Record<string, { total: number; count: number }> = {};

    data.activities.forEach(activity => {
      if (activity.score !== undefined) {
        if (!topicScores[activity.type]) {
          topicScores[activity.type] = { total: 0, count: 0 };
        }
        topicScores[activity.type].total += activity.score;
        topicScores[activity.type].count += 1;
      }
    });

    const analyzed = Object.entries(topicScores).map(([type, stats]) => ({
      type,
      avg: stats.total / stats.count,
    }));

    const sorted = analyzed.sort((a, b) => b.avg - a.avg);
    
    return {
      strongest: sorted.length > 0 ? sorted[0].type : null,
      weakest: sorted.length > 1 ? sorted[sorted.length - 1].type : null,
      all: analyzed,
      hasEnoughData: true
    };
  }, [data.activities, data.sessions]);

  return {
    stats: data.stats,
    activities: data.activities,
    sessions: data.sessions,
    studyTimeLineData,
    performanceInsights,
    loading,
  };
};
