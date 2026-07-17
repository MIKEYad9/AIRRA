import { useEffect } from "react";
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/src/context/AuthContext";
import { useUserStore } from "@/src/services/useUserStore";
import { supabase } from "@/src/lib/supabase";

export default function ProtectedRoute({ 
  children, 
  checkOnboarding = true 
}: { 
  children: ReactNode;
  checkOnboarding?: boolean;
}) {
  const { user, loading: authLoading } = useAuth();
  const { profile, setProfile, subscription, setSubscription, isLoading: profileLoading, setIsLoading } = useUserStore();

  useEffect(() => {
    let mounted = true;
    
    async function loadUserData() {
      if (!user) {
        if (mounted) {
          setProfile(null);
          setSubscription(null);
          setIsLoading(false);
        }
        return;
      }

      // Check for test mode
      const isTestMode = localStorage.getItem('test_mode') === 'true';
      
      if (isTestMode) {
        if (mounted) {
          setProfile({ 
            id: user.id, 
            full_name: 'Test Member', 
            onboarding_completed: true,
            username: 'testuser',
            avatar_url: null,
            mood_goal: 'Stress Management',
            updated_at: new Date().toISOString(),
            daily_streak: 5
          });
          setSubscription({ id: 'test-sub', user_id: user.id, plan_type: 'premium', status: 'active', expires_at: null });
          setIsLoading(false);
        }
        return;
      }

      // Only fetch if we don't have data and aren't already loading
      if (supabase && (!profile || !subscription)) {
        setIsLoading(true);
        try {
          const [profileRes, subRes] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
            supabase.from('subscriptions').select('*').eq('user_id', user.id).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle()
          ]);
          
          if (mounted) {
            if (profileRes.data) {
              setProfile(profileRes.data);
            } else {
              setProfile({ 
                id: user.id, 
                full_name: user.email?.split('@')[0] || 'Member', 
                onboarding_completed: false,
                username: user.email?.split('@')[0] || 'member',
                avatar_url: null,
                mood_goal: null,
                updated_at: new Date().toISOString(),
                daily_streak: 1
              });
            }
            
            if (subRes.data) {
              setSubscription(subRes.data);
            } else {
              setSubscription({ id: 'none', user_id: user.id, plan_type: 'free', status: 'cancelled', expires_at: null });
            }
          }
        } catch (error) {
          console.warn("Error loading user data gracefully handled:", error);
        } finally {
          if (mounted) setIsLoading(false);
        }
      } else {
        if (mounted) setIsLoading(false);
      }
    }

    loadUserData();

    return () => {
      mounted = false;
    };
  }, [user, supabase, setProfile, setSubscription, setIsLoading]);

  if (authLoading || (user && profileLoading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen atmosphere-bg">
        <div className="w-12 h-12 border-4 border-teal-600/20 border-t-teal-600 rounded-full animate-spin" />
        <p className="mt-4 text-slate-500 animate-pulse font-bold uppercase tracking-widest text-[10px]">Harmonizing your sanctuary...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (checkOnboarding && profile && !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
