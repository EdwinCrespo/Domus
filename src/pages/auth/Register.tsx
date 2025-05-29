import * as React from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { User } from '@supabase/supabase-js'
import logoDomus from '../../images/logoDomus.png'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'

const API_URL = import.meta.env.VITE_API_URL

const Register = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null)

  const createUserInBackend = async (userData: { 
    id: string;  // Agregamos el id
    nombre: string; 
    apellido: string; 
    email: string 
  }) => {
    try {
      console.log('Enviando datos al backend:', userData)
      const response = await fetch(`${API_URL}/usuarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          id: userData.id,        // Incluimos el id
          nombre: userData.nombre,
          apellido: userData.apellido,
          email: userData.email
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        console.error('Error del backend:', errorData)
        throw new Error(errorData?.message || 'Error al crear usuario en el backend')
      }

      return await response.json()
    } catch (error) {
      console.error('Error completo:', error)
      throw error
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      setIsLoading(false)
      return
    }

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre,
            apellido,
          },
        },
      })

      if (authError) throw authError

      if (data.user) {
        setSupabaseUser(data.user)
        try {
          await createUserInBackend({
            id: data.user.id,
            nombre,
            apellido,
            email,
          })
          
          navigate('/login', { 
            state: { 
              message: 'Registro exitoso. Por favor, verifica tu correo electrónico.' 
            }
          })
        } catch (backendError) {
          console.error('Error en el backend:', backendError)
          
          if (data.user) {
            try {
              const { error: deleteError } = await supabase.auth.admin.deleteUser(data.user.id)
              if (deleteError) {
                console.error('Error al eliminar usuario de Supabase:', deleteError)
              }
            } catch (deleteError) {
              console.error('Error en el rollback:', deleteError)
            }
          }

          setError('Error al crear el perfil de usuario. Por favor, intente nuevamente.')
          return
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar usuario')
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
              <img 
                src={logoDomus} 
                alt="Logo Domus" 
                className="h-40 w-auto object-contain drop-shadow-lg"
              />
            </div>
            <h1 className="text-4xl font-bold mb-4 text-center">Únete a Domus</h1>
            <p className="text-xl text-white/90 text-center">
              Crea tu cuenta y comienza a gestionar tus propiedades
            </p>
          </div>
        </div>

        {/* Panel derecho con el formulario */}
        <div className="w-1/2 bg-white p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Crear Cuenta
            </h2>

            <form onSubmit={handleRegister} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Tu nombre"
                    required
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apellido">Apellido</Label>
                  <Input
                    id="apellido"
                    type="text"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    placeholder="Tu apellido"
                    required
                    className="w-full"
                  />
                </div>
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
              </Button>

              <div className="text-center text-sm text-gray-600">
                ¿Ya tienes una cuenta?{' '}
                <Button
                  variant="link"
                  className="text-blue-600 hover:text-blue-700 p-0"
                  onClick={() => navigate('/login')}
                >
                  Inicia sesión aquí
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register 