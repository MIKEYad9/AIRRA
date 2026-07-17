import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/src/lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInAsTestUser: () => void;
  signInWithGoogleMock: (email: string, name: string) => void;
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
      const email = localStorage.getItem('mock_email') || 'test@example.com';
      const name = localStorage.getItem('mock_name') || 'Test User';
      const avatarUrl = localStorage.getItem('mock_avatar') || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
      const mockUser = {
        id: 'test-user-id',
        email: email,
        user_metadata: { 
          full_name: name,
          avatar_url: avatarUrl,
          provider: localStorage.getItem('mock_provider') || 'email'
        },
        aud: 'authenticated',
        role: 'authenticated'
      } as any;
      setUser(mockUser);
      setSession({ user: mockUser } as any);
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
        console.warn("Auth session check handled cleanly:", error);
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
    localStorage.removeItem('mock_email');
    localStorage.removeItem('mock_name');
    localStorage.removeItem('mock_avatar');
    localStorage.removeItem('mock_provider');
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
  };

  const signInAsTestUser = () => {
    localStorage.setItem('test_mode', 'true');
    localStorage.setItem('mock_email', 'test@example.com');
    localStorage.setItem('mock_name', 'Test User');
    localStorage.setItem('mock_avatar', `https://api.dicebear.com/7.x/initials/svg?seed=Test%20User`);
    localStorage.setItem('mock_provider', 'email');
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: { 
        full_name: 'Test User',
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=Test%20User`,
        provider: 'email'
      },
      aud: 'authenticated',
      role: 'authenticated'
    } as any;
    setUser(mockUser);
    setSession({ user: mockUser } as any);
  };

  const signInWithGoogleMock = (email: string, name: string) => {
    localStorage.setItem('test_mode', 'true');
    localStorage.setItem('mock_email', email);
    localStorage.setItem('mock_name', name);
    localStorage.setItem('mock_avatar', `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`);
    localStorage.setItem('mock_provider', 'google');
    const mockUser = {
      id: 'test-google-id-' + Math.random().toString(36).substring(2, 9),
      email: email,
      user_metadata: { 
        full_name: name,
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
        provider: 'google'
      },
      aud: 'authenticated',
      role: 'authenticated'
    } as any;
    setUser(mockUser);
    setSession({ user: mockUser } as any);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, signInAsTestUser, signInWithGoogleMock }}>
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
