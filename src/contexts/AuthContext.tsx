import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Create user profile if new user
        if (event === 'SIGNED_UP' as AuthChangeEvent && session?.user) {
          setTimeout(() => {
            createUserProfile(session.user);
          }, 0);
        }
        
        // Ensure existing users have a balance
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          setTimeout(() => {
            ensureUserBalance(session.user);
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Ensure existing users have a balance
      if (session?.user) {
        setTimeout(() => {
          ensureUserBalance(session.user);
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const createUserProfile = async (user: User) => {
    try {
      console.log('Creating user profile for:', user.id);
      const { error } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email!,
          username: user.user_metadata?.username || user.email?.split('@')[0],
          balance: 1000 // Starting balance: €1000
        });
      
      if (error && error.code !== '23505') { // Ignore duplicate key error
        console.error('Error creating user profile:', error);
      } else {
        console.log('User profile created successfully with balance: 1000');
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
    }
  };

  const ensureUserBalance = async (user: User) => {
    try {
      console.log('Ensuring user balance for:', user.id);
      
      // Check if user exists and has a balance
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', user.id)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching user:', fetchError);
        return;
      }
      
      // If user doesn't exist or has no balance, create/update them
      if (!existingUser || existingUser.balance === null || existingUser.balance === 0) {
        const { error: upsertError } = await supabase
          .from('users')
          .upsert({
            id: user.id,
            email: user.email!,
            username: user.user_metadata?.username || user.email?.split('@')[0],
            balance: 1000 // Starting balance: €1000
          }, {
            onConflict: 'id'
          });
        
        if (upsertError) {
          console.error('Error ensuring user balance:', upsertError);
        } else {
          console.log('User balance ensured: 1000');
        }
      }
    } catch (error) {
      console.error('Error ensuring user balance:', error);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    // Sign up without email confirmation by using a different approach
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username
        }
      }
    });
    
    if (signUpError) {
      return { error: signUpError };
    }
    
    // If the user was created successfully, try to sign them in immediately
    if (data.user) {
      // For users who don't need email confirmation, we can sign them in right away
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (signInError) {
        // If sign in fails, it might be because email confirmation is still required
        // In that case, we'll return a specific error message
        return { 
          error: { 
            message: "Account created! Please check your email to confirm your account before signing in." 
          } 
        };
      }
    }
    
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};