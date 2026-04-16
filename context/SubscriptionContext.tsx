import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/utils/supabase';

export type PlanType = 'free' | 'monthly' | 'yearly';

export interface SubscriptionState {
  plan: PlanType;
  status: 'active' | 'cancelled' | 'expired' | 'none';
  expiresAt: string | null;
  startedAt: string | null;
  dailyUsageCount: number;
  loading: boolean;
}

interface SubscriptionContextType {
  subscription: SubscriptionState;
  isPremium: boolean;
  canUseAI: boolean;
  dailyLimit: number;
  remainingUses: number;
  consumeAIUse: () => Promise<boolean>;
  refreshSubscription: () => Promise<void>;
  activatePlan: (plan: PlanType) => Promise<void>;
  cancelPlan: () => Promise<void>;
}

const FREE_DAILY_LIMIT = 10;

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const getDailyUsage = async (): Promise<number> => {
  const today = new Date().toISOString().split('T')[0];
  const storedDate = await AsyncStorage.getItem('eduai_usage_date');
  const storedCount = await AsyncStorage.getItem('eduai_usage_count');

  if (storedDate !== today) {
    await AsyncStorage.setItem('eduai_usage_date', today);
    await AsyncStorage.setItem('eduai_usage_count', '0');
    return 0;
  }
  return parseInt(storedCount || '0', 10);
};

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [subscription, setSubscription] = useState<SubscriptionState>({
    plan: 'free',
    status: 'none',
    expiresAt: null,
    startedAt: null,
    dailyUsageCount: 0,
    loading: true,
  });

  const refreshSubscription = useCallback(async () => {
    try {
      const usageCount = await getDailyUsage();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setSubscription(prev => ({
          ...prev,
          plan: 'free',
          status: 'none',
          expiresAt: null,
          startedAt: null,
          dailyUsageCount: usageCount,
          loading: false,
        }));
        return;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        setSubscription({
          plan: 'free',
          status: 'none',
          expiresAt: null,
          startedAt: null,
          dailyUsageCount: usageCount,
          loading: false,
        });
        return;
      }

      // Auto-expire check
      let status = data.status as SubscriptionState['status'];
      if (data.expires_at && new Date(data.expires_at) < new Date() && status === 'active') {
        status = 'expired';
        await supabase
          .from('subscriptions')
          .update({ status: 'expired' })
          .eq('user_id', user.id);
      }

      const effectivePlan: PlanType =
        status === 'active' && data.plan !== 'free' ? data.plan : 'free';

      setSubscription({
        plan: effectivePlan,
        status,
        expiresAt: data.expires_at,
        startedAt: data.started_at,
        dailyUsageCount: usageCount,
        loading: false,
      });
    } catch (e) {
      console.error('[SUBSCRIPTION_REFRESH_ERROR]', e);
      setSubscription(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    refreshSubscription();
  }, [refreshSubscription]);

  const isPremium =
    (subscription.plan === 'monthly' || subscription.plan === 'yearly') &&
    subscription.status === 'active';

  const dailyLimit = FREE_DAILY_LIMIT;
  const remainingUses = isPremium
    ? 9999
    : Math.max(0, FREE_DAILY_LIMIT - subscription.dailyUsageCount);
  const canUseAI = isPremium || subscription.dailyUsageCount < FREE_DAILY_LIMIT;

  const consumeAIUse = async (): Promise<boolean> => {
    if (isPremium) return true;
    const current = await getDailyUsage();
    if (current >= FREE_DAILY_LIMIT) return false;
    const newCount = current + 1;
    await AsyncStorage.setItem('eduai_usage_count', String(newCount));
    setSubscription(prev => ({ ...prev, dailyUsageCount: newCount }));
    return true;
  };

  const activatePlan = async (plan: PlanType) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('NOT_AUTHENTICATED');

    const daysToAdd = plan === 'yearly' ? 365 : 30;
    const expiresAt = new Date(
      Date.now() + daysToAdd * 24 * 60 * 60 * 1000
    ).toISOString();

    const { error } = await supabase.from('subscriptions').upsert(
      {
        user_id: user.id,
        plan,
        status: 'active',
        started_at: new Date().toISOString(),
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    if (error) throw error;
    await refreshSubscription();
  };

  const cancelPlan = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('NOT_AUTHENTICATED');

    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    if (error) throw error;
    await refreshSubscription();
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isPremium,
        canUseAI,
        dailyLimit,
        remainingUses,
        consumeAIUse,
        refreshSubscription,
        activatePlan,
        cancelPlan,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used inside SubscriptionProvider');
  return ctx;
};
