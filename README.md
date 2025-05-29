# Domus - Sistema de Gestión de Inventario

## Estado Global con Zustand

### Autenticación (`authStore.ts`)

El sistema utiliza Zustand para manejar el estado de autenticación y la sesión del usuario, integrado con Supabase.

```typescript
// Ejemplo de uso en componentes
const { user, setUser } = useAuthStore();
```

#### Implementación Real:

```typescript
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isResettingPassword: false,
      resetPasswordError: null,

      setUser: (user: SupabaseUser | null) => {
        if (user) {
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
```

#### Uso en el Sistema:

1. **Páginas que utilizan el Store**:
   - `Login.tsx`: Manejo de inicio de sesión
   - `ResetPassword.tsx`: Recuperación de contraseña
   - `Dashboard.tsx`: Verificación de autenticación
   - `InventarioPage.tsx`: Acceso a datos del usuario
   - `RealizarVenta.tsx`: Validación de usuario
   - `RealizarCompra.tsx`: Verificación de permisos

2. **Integración con Supabase**:
   - Sincronización automática con Supabase Auth
   - Manejo de tokens de sesión
   - Actualización de datos del usuario

3. **Persistencia de Datos**:
   - Almacenamiento en `sessionStorage`
   - Limpieza automática al cerrar sesión
   - Manejo seguro de datos sensibles

4. **Funcionalidades Implementadas**:
   - Inicio y cierre de sesión
   - Recuperación de contraseña
   - Mantenimiento de sesión
   - Manejo de errores de autenticación

### Ejemplo de Uso en Componentes

```typescript
// En componentes que requieren autenticación
const MiComponente = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  return (
    <div>
      {user ? (
        <div>
          <h1>Bienvenido, {user.user_metadata?.nombre}</h1>
          {/* Contenido protegido */}
        </div>
      ) : (
        <div>Cargando...</div>
      )}
    </div>
  );
};
```

## Tecnologías con IA Principales

-Cursor para el desarrollo
-V0 para interfaz
-Chatgpt, perplexity y claude preguntas tecnicas


```
