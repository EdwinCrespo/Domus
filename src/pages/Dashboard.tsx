import React, { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { userService, UserData } from '../services/userService'
import { imageService } from '../services/imageService'

const Dashboard = () => {
  const { user, setUser } = useAuthStore()
  const navigate = useNavigate()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null)

  useEffect(() => {
    // Verificar la sesión actual
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error al verificar la sesión:', error)
        navigate('/login')
        return
      }

      if (!session) {
        navigate('/login')
        return
      }

      // Solo actualizar el usuario si no existe o si es diferente
      if (session.user && (!user || session.user.id !== user.id)) {
        console.log('Actualizando usuario desde checkSession:', session.user.id);
        setUser(session.user)
      }
    }

    checkSession()

    // Suscribirse a cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        // Solo actualizar si el usuario es diferente
        if (!user || session.user.id !== user.id) {
          console.log('Actualizando usuario desde onAuthStateChange:', session.user.id);
          setUser(session.user)
        }
      } else {
        setUser(null)
        navigate('/login')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [navigate, user, setUser])

  // Cargar datos del usuario
  useEffect(() => {
    const loadUserData = async () => {
      if (user?.id) {
        try {
          const data = await userService.getUserData(user.id)
          setUserData(data)
        } catch (err) {
          console.error('Error al cargar datos del usuario:', err)
        }
      }
    }

    loadUserData()
  }, [user?.id])

  // Cargar imagen del usuario
  useEffect(() => {
    const loadUserImage = async () => {
      if (!user?.id) {
        console.log('No hay ID de usuario para cargar la imagen')
        return
      }

      try {
        const imageUrl = await imageService.getUserImageUrl(user.id)
        setUserImageUrl(imageUrl)
      } catch (err) {
        console.error('Error al cargar la imagen del usuario:', err)
        setUserImageUrl(null)
      }
    }

    loadUserImage()
  }, [user?.id])

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Bienvenido a tu Dashboard
          </h1>
          <p className="text-gray-600">
            Esta es tu página de inicio. Aquí podrás gestionar tus propiedades.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard 