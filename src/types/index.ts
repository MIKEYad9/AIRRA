export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
  mood_goal: string | null;
  updated_at: string;
  daily_streak?: number | null;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'model';
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface MoodLog {
  id: string;
  user_id: string;
  mood: string;
  intensity: number;
  note: string | null;
  created_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  mood_tag: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: 'free' | 'premium' | 'lifetime';
  status: 'active' | 'expired' | 'cancelled';
  expires_at: string | null;
}

export interface Coach {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  avatar_url: string;
  price: number;
}

export interface Booking {
  id: string;
  user_id: string;
  coach_id: string;
  booking_date: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
}

export interface UserState {
  profile: Profile | null;
  subscription: Subscription | null;
  setProfile: (profile: Profile | null) => void;
  setSubscription: (sub: Subscription | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}
