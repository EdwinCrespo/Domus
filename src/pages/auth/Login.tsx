import * as React from 'react'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
// import logoDomus from '../../images/logoDomus.png' // Comentado temporalmente
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { useNavigate, useLocation } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRecovering, setIsRecovering] = useState(false)
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [recoverySent, setRecoverySent] = useState(false)
  const setUser = useAuthStore((state) => state.setUser)

  useEffect(() => {
    // Verificar si debemos mostrar el formulario de recuperación
    if (location.state?.showForgotPassword) {
      setIsRecovering(true)
      // Si hay un email en el estado, usarlo
      if (location.state.email) {
        setRecoveryEmail(location.state.email)
      }
      // Limpiar el estado de la ubicación
      window.history.replaceState({}, document.title)
    }
  }, [location])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        // Obtener el token de acceso
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) {
          throw new Error('No se pudo obtener el token de acceso')
        }

        // Hacer la llamada al endpoint de usuarios
        try {
          const response = await fetch(`${API_URL}/usuarios/${data.user.id}`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          })

          if (!response.ok) {
            throw new Error('Error al obtener los datos del usuario')
          }

          const userData = await response.json()
          console.log('Nombre del usuario:', userData.nombre)

          // Actualizar el objeto user con los datos del backend y preservar la avatar_url de Supabase Auth
          const updatedUser = {
            ...data.user,
            user_metadata: {
              ...data.user?.user_metadata,
              nombre: userData.nombre,
              apellido: userData.apellido,
            },
          }

          setUser(updatedUser)
          
          // Asegurarnos de que la redirección se realice después de actualizar el estado
          setTimeout(() => {
            navigate('/dashboard', { replace: true })
          }, 100)
        } catch (err) {
          console.error('Error al obtener datos del usuario:', err)
          // Aún así redirigir al dashboard si falla la obtención de datos adicionales
          navigate('/dashboard', { replace: true })
        }
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'Invalid login credentials') {
        setError('Credenciales de inicio de sesión no válidas')
      } else {
        setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      setRecoverySent(true)
      // Mostrar mensaje de éxito con información sobre el tiempo de expiración
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el correo de recuperación')
      setRecoverySent(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-6xl flex rounded-xl overflow-hidden shadow-2xl">
        {/* Panel izquierdo con gradiente */}
        <div className="w-1/2 bg-gradient-to-br from-blue-600 to-purple-600 p-12 flex flex-col justify-center text-white">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm mb-8">
              <h1 className="text-4xl font-bold text-white">DOMUS</h1>
            </div>
            <h1 className="text-4xl font-bold mb-4 text-center">Bienvenido a Domus</h1>
            <p className="text-xl text-white/90 text-center">
              Tu plataforma integral para la gestión de propiedades
            </p>
          </div>
        </div>

        {/* Panel derecho con el formulario */}
        <div className="w-1/2 bg-white p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              {isRecovering ? 'Recuperar Contraseña' : 'Iniciar Sesión'}
            </h2>

            {!isRecovering ? (
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full"
                  />
                </div>

                {error && (
                  <div className="text-red-500 text-sm text-center">
                    {error}
                  </div>
                )}

                {location.state?.message && (
                  <div className="text-green-600 text-sm text-center bg-green-50 p-4 rounded-md">
                    {location.state.message}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Button>

                <div className="flex flex-col items-center space-y-4">
                  <Button
                    type="button"
                    variant="link"
                    className="text-blue-600 hover:text-blue-700"
                    onClick={() => setIsRecovering(true)}
                  >
                    ¿Olvidaste tu contraseña?
                  </Button>

                  <div className="text-sm text-gray-600">
                    ¿No tienes una cuenta?{' '}
                    <Button
                      variant="link"
                      className="text-blue-600 hover:text-blue-700 p-0"
                      onClick={() => navigate('/register')}
                    >
                      Regístrate aquí
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRecovery} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="recovery-email">Correo Electrónico</Label>
                  <Input
                    id="recovery-email"
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    className="w-full"
                  />
                </div>

                {error && (
                  <div className="text-red-500 text-sm text-center">
                    {error}
                  </div>
                )}

                {recoverySent ? (
                  <div className="text-center space-y-4">
                    <div className="text-green-600 text-lg font-medium">
                      ¡Enlace enviado exitosamente!
                    </div>
                    <p className="text-gray-600">
                      Hemos enviado un enlace de recuperación a tu correo electrónico. 
                      El enlace expirará en 10 minutos por seguridad.
                    </p>
                    <Button
                      variant="outline"
                      className="w-full text-blue-600 hover:text-blue-700"
                      onClick={() => navigate('/login')}
                    >
                      Volver al inicio de sesión
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Enviando...' : 'Enviar instrucciones'}
                  </Button>
                )}

                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    className="text-blue-600 hover:text-blue-700"
                    onClick={() => {
                      setIsRecovering(false)
                      setRecoveryEmail('')
                      setRecoverySent(false)
                      setError(null)
                    }}
                  >
                    Volver al inicio de sesión
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login 