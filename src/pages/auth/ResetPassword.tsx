import * as React from 'react'
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import logoDomus from '../../images/logoDomus.png'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'

const ResetPassword = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isValidToken, setIsValidToken] = useState(false)
  const { resetPassword, isResettingPassword, resetPasswordError, setUser } = useAuthStore()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const handleLink = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const params = new URLSearchParams(location.hash.substring(1))
        const type = params.get('type')
        const errorParam = params.get('error')
        const errorDescription = params.get('error_description')

        if (errorParam) {
          // Manejar errores de Supabase en el enlace
           switch (errorParam) {
            case 'access_denied':
              if (errorDescription?.includes('expired')) {
                setError('El enlace de restablecimiento ha expirado. Por favor, solicita uno nuevo desde la página de inicio de sesión.')
              } else {
                setError('El enlace de restablecimiento no es válido. Por favor, solicita uno nuevo desde la página de inicio de sesión.')
              }
              break
            default:
              setError(errorDescription || 'Error al procesar el enlace de restablecimiento')
          }
          setIsValidToken(false) // Indicar que el token no es válido
          return
        }

        if (type === 'recovery') {
          const accessToken = params.get('access_token')
          const refreshToken = params.get('refresh_token')

          if (!accessToken || !refreshToken) {
            setError('El enlace de recuperación no contiene los tokens necesarios.')
            setIsValidToken(false)
            return
          }

          // Establecer la sesión con los tokens
          const { data: { user }, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (sessionError) {
            console.error('Error al establecer la sesión:', sessionError)
            setError('Error al verificar el enlace de recuperación.')
            setIsValidToken(false)
            return
          }

          if (user) {
            setUser(user)
            setIsValidToken(true)
            setError(null)
          } else {
             setError('Usuario no encontrado después de establecer la sesión.')
             setIsValidToken(false)
          }

        } else {
          // Si el tipo de enlace no es 'recovery'
          setError('Tipo de enlace no válido para restablecer contraseña.')
          setIsValidToken(false)
        }
      } catch (err) {
        console.error('Error general al procesar el enlace:', err)
        setError('Ocurrió un error inesperado al procesar el enlace.')
        setIsValidToken(false)
      } finally {
        setIsLoading(false)
      }
    }

    handleLink()
  }, [location, setUser])

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    
    // Verificar si el token sigue siendo válido antes de intentar resetear
    if (!isValidToken) {
         setError('El enlace ya no es válido. Por favor, solicita uno nuevo.')
         return
    }

    try {
      // Usar la función de resetPassword de Zustand
      const { error: resetError } = await resetPassword(password)

      if (resetError) {
         // Si hay un error en el reset de password, verificar si es por token expirado
         if (resetError.message.includes('Invalid Refresh Token: Already Used')) {
             setError('El enlace ha expirado o ya fue utilizado. Por favor, solicita uno nuevo.')
             setIsValidToken(false) // Invalidar el token localmente
         } else {
            setError(resetError.message)
         }
         return
      }

      setSuccess(true)
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        navigate('/login', {
          state: { message: 'Contraseña actualizada exitosamente. Por favor, inicia sesión.' }
        })
      }, 3000)
    } catch (err) {
       console.error('Error al actualizar la contraseña:', err)
       setError('Error al actualizar la contraseña.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando enlace de recuperación...</p>
        </div>
      </div>
    )
  }

  // Si hay un error o el token no es válido, mostrar el mensaje de error
   if (error || !isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-full max-w-md p-8">
          <div className="text-center space-y-6">
            <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm mb-8">
              <img 
                src={logoDomus} 
                alt="Logo Domus" 
                className="h-32 w-auto object-contain drop-shadow-lg mx-auto"
              />
            </div>
            <div className="text-red-600 text-lg font-medium">
              {error || 'Enlace de recuperación no válido o expirado.'}
            </div>
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full text-blue-600 hover:text-blue-700"
                onClick={() => navigate('/login')}
              >
                Volver al inicio de sesión
              </Button>
               {/* Opcional: Botón para solicitar nuevo enlace si el error es por expiración */}
               {error?.includes('expirado') && (
                 <Button
                   variant="link"
                   className="text-blue-600 hover:text-blue-700"
                   onClick={() => navigate('/login', { state: { showForgotPassword: true } })}
                 >
                   Solicitar nuevo enlace
                 </Button>
               )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Si el token es válido, mostrar el formulario para cambiar la contraseña
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-6xl flex rounded-xl overflow-hidden shadow-2xl">
        {/* Panel izquierdo con gradiente */}
        <div className="w-1/2 bg-gradient-to-br from-blue-600 to-purple-600 p-12 flex flex-col justify-center text-white">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm mb-8">
              <img 
                src={logoDomus} 
                alt="Logo Domus" 
                className="h-40 w-auto object-contain drop-shadow-lg"
              />
            </div>
            <h1 className="text-4xl font-bold mb-4 text-center">Restablecer Contraseña</h1>
            <p className="text-xl text-white/90 text-center">
              Ingresa tu nueva contraseña para continuar
            </p>
          </div>
        </div>

        {/* Panel derecho con el formulario */}
        <div className="w-1/2 bg-white p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Nueva Contraseña
            </h2>

            {success ? (
              <div className="text-center space-y-4">
                <div className="text-green-600 text-lg font-medium">
                  ¡Contraseña actualizada exitosamente!
                </div>
                <p className="text-gray-600">
                  Serás redirigido al inicio de sesión en unos segundos...
                </p>
              </div>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="password">Nueva Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full"
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full"
                    minLength={6}
                  />
                </div>

                {error && (
                  <div className="text-red-500 text-sm text-center">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isResettingPassword || !isValidToken}
                >
                  {isResettingPassword ? 'Actualizando...' : 'Actualizar Contraseña'}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    className="text-blue-600 hover:text-blue-700"
                    onClick={() => navigate('/login')}
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

export default ResetPassword 