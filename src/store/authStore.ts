import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthState {
  user: SupabaseUser | null
  setUser: (user: SupabaseUser | null) => void
  resetPassword: (password: string) => Promise<{ error: Error | null }>
  isResettingPassword: boolean
  resetPasswordError: string | null
  initializeAuth: () => Promise<void>
  clearAuth: () => void
}

// Función para limpiar el almacenamiento
const clearStorage = () => {
  sessionStorage.removeItem('auth-storage');
  localStorage.removeItem('auth-storage');
};

// Función para limpiar los metadatos del usuario antes de persistir
const cleanUserForStorage = (user: SupabaseUser | null) => {
  if (!user) return null;
  
  // Crear una copia del usuario sin la URL del avatar en los metadatos
  const cleanedUser = {
    ...user,
    user_metadata: {
      ...user.user_metadata,
      avatar_url: null // Limpiar la URL del avatar
    }
  };
  
  return cleanedUser;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isResettingPassword: false,
      resetPasswordError: null,

      setUser: (user: SupabaseUser | null) => {
        if (user) {
          console.log('Actualizando estado del usuario:', {
            id: user.id,
            email: user.email,
            metadata: user.user_metadata
          });
          
          // Asegurarnos de que los metadatos estén presentes
          const updatedUser = {
            ...user,
            user_metadata: {
              ...user.user_metadata,
              nombre: user.user_metadata?.nombre || '',
              apellido: user.user_metadata?.apellido || '',
              avatar_url: user.user_metadata?.avatar_url || null
            }
          };
          
          set({ user: updatedUser });
        } else {
          console.log('Limpiando estado del usuario');
          set({ user: null });
        }
      },

      resetPassword: async (password: string) => {
        set({ isResettingPassword: true, resetPasswordError: null });
        try {
          const { error } = await supabase.auth.updateUser({ password });
          if (error) throw error;
          return { error: null };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          set({ resetPasswordError: errorMessage });
          return { error: error as Error };
        } finally {
          set({ isResettingPassword: false });
        }
      },

      initializeAuth: async () => {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) throw error;

          if (session?.user) {
            console.log('Inicializando sesión para usuario:', session.user.id);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              set({ user });
            }
          }
        } catch (error) {
          console.error('Error al inicializar autenticación:', error);
          set({ user: null });
        }
      },

      clearAuth: () => {
        console.log('Limpiando estado de autenticación');
        set({ user: null, resetPasswordError: null });
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ user: state.user }),
    }
  )
) 