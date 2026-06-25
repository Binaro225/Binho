import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  full_name?: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const checkAuth = useCallback(async () => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        throw error;
      }

      if (user) {
        // Récupérer les informations supplémentaires de l'utilisateur
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        setAuthState({
          user: profile || {
            id: user.id,
            email: user.email || '',
            full_name: null,
            avatar_url: null,
            created_at: user.created_at || '',
            updated_at: user.updated_at || '',
          },
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur d\'authentification',
      });
    }
  }, []);

  useEffect(() => {
    checkAuth();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        checkAuth();
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [checkAuth]);

  const signUp = async (credentials: SignUpCredentials): Promise<User | null> => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.full_name,
          },
        },
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Aucun utilisateur créé');
      }

      // Créer le profil utilisateur dans la table users
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email || '',
          full_name: credentials.full_name || null,
          avatar_url: null,
        })
        .select()
        .single();

      if (profileError) {
        throw profileError;
      }

      setAuthState({
        user: profile,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return profile;
    } catch (error) {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'inscription',
      });
      return null;
    }
  };

  const signIn = async (credentials: SignInCredentials): Promise<User | null> => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Aucun utilisateur trouvé');
      }

      // Récupérer le profil utilisateur
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      setAuthState({
        user: profile,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return profile;
    } catch (error) {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la connexion',
      });
      return null;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la déconnexion',
      });
    }
  };

  const updateProfile = async (profileData: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>): Promise<User | null> => {
    try {
      if (!authState.user) {
        throw new Error('Utilisateur non connecté');
      }

      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      const { data: profile, error } = await supabase
        .from('users')
        .update({
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', authState.user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setAuthState({
        user: profile,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return profile;
    } catch (error) {
      setAuthState({
        ...authState,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour du profil',
      });
      return null;
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });

      if (error) {
        throw error;
      }

      setAuthState({
        ...authState,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (error) {
      setAuthState({
        ...authState,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la réinitialisation du mot de passe',
      });
      return false;
    }
  };

  return {
    authState,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
    checkAuth,
  };
};

export default useAuth;
