import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/src/lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInAsTestUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Load test mode from localStorage if it exists
  useEffect(() => {
    const isTestMode = localStorage.getItem('test_mode') === 'true';
    if (isTestMode) {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' },
        aud: 'authenticated',
        role: 'authenticated'
      } as any;
      setUser(mockUser);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Don't overwrite mock user if test mode is active
      if (localStorage.getItem('test_mode') === 'true') return;
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (localStorage.getItem('test_mode') === 'true') return;
        
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error("Auth session check failed:", error);
      } finally {
        // Only set loading false if we aren't already in test mode (which sets it in its own effect)
        if (localStorage.getItem('test_mode') !== 'true') {
          setLoading(false);
        }
      }
    };

    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    localStorage.removeItem('test_mode');
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
  };

  const signInAsTestUser = () => {
    localStorage.setItem('test_mode', 'true');
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' },
      aud: 'authenticated',
      role: 'authenticated'
    } as any;
    setUser(mockUser);
    setSession({ user: mockUser } as any);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, signInAsTestUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
