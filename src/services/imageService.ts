import { supabase } from '../lib/supabase';

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif'] as const;
type AllowedExtension = typeof ALLOWED_EXTENSIONS[number];

export const imageService = {
  async uploadUserImage(userId: string, file: File): Promise<string> {
    console.log('=== INICIO DE SUBIDA DE IMAGEN ===');
    console.log('Usuario:', userId);
    console.log('Archivo:', {
      nombre: file.name,
      tipo: file.type,
      tamaño: `${(file.size / 1024).toFixed(2)} KB`
    });

    // Obtener la extensión del archivo y validarla
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    console.log('Extensión detectada:', fileExt);

    if (!fileExt || !ALLOWED_EXTENSIONS.includes(fileExt as AllowedExtension)) {
      console.error('Formato no permitido:', fileExt);
      throw new Error(`Formato de archivo no válido. Formatos permitidos: ${ALLOWED_EXTENSIONS.join(', ')}`);
    }

    // Crear el path usando el ID del usuario con el formato correcto
    const filePath = `user/${userId}.${fileExt}`;
    console.log('Path del archivo:', filePath);

    try {
      // Verificar y eliminar imágenes existentes
      console.log('Buscando imágenes existentes...');
      const existingFiles = await this.listUserImages(userId);
      console.log('Imágenes encontradas:', existingFiles);

      if (existingFiles.length > 0) {
        console.log('Eliminando imágenes anteriores...');
        for (const file of existingFiles) {
          console.log('Eliminando archivo:', file.name);
          const { error: deleteError } = await supabase.storage
            .from('user')
            .remove([file.name]);
          
          if (deleteError) {
            console.error('Error al eliminar archivo:', file.name, deleteError);
          } else {
            console.log('Archivo eliminado exitosamente:', file.name);
          }
        }
      } else {
        console.log('No se encontraron imágenes anteriores para eliminar');
      }

      // Subir la nueva imagen
      console.log('Iniciando subida de nueva imagen...');
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('user')
        .upload(filePath, file, { 
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) {
        console.error('Error en la subida:', uploadError);
        throw new Error(`Error al subir la imagen: ${uploadError.message}`);
      }

      console.log('Imagen subida exitosamente');

      // Obtener URL firmada
      console.log('Obteniendo URL firmada...');
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('user')
        .createSignedUrl(filePath, 3600);

      if (signedUrlError || !signedUrlData?.signedUrl) {
        console.error('Error al obtener URL firmada:', signedUrlError);
        throw new Error('No se pudo obtener la URL de la imagen');
      }

      console.log('URL firmada obtenida exitosamente:', signedUrlData.signedUrl);
      console.log('=== FIN DE SUBIDA DE IMAGEN ===');
      return signedUrlData.signedUrl;
    } catch (error) {
      console.error('Error en el proceso de subida:', error);
      throw error;
    }
  },

  async deleteUserImage(userId: string): Promise<void> {
    console.log('=== INICIO DE ELIMINACIÓN DE IMAGEN ===');
    console.log('Usuario:', userId);
    
    const existingFiles = await this.listUserImages(userId);
    console.log('Archivos encontrados:', existingFiles);

    if (existingFiles.length === 0) {
      console.log('No hay imágenes para eliminar');
      console.log('=== FIN DE ELIMINACIÓN DE IMAGEN ===');
      return;
    }

    for (const file of existingFiles) {
      console.log('Eliminando archivo:', file.name);
      const { error } = await supabase.storage
        .from('user')
        .remove([file.name]);
      
      if (error) {
        console.error('Error al eliminar archivo:', file.name, error);
        throw new Error(`Error al eliminar la imagen: ${error.message}`);
      }
      console.log('Archivo eliminado exitosamente:', file.name);
    }

    console.log('=== FIN DE ELIMINACIÓN DE IMAGEN ===');
  },

  async listUserImages(userId: string): Promise<{ name: string }[]> {
    console.log('Buscando imágenes para usuario:', userId);
    
    // Buscar en el directorio user
    const { data, error } = await supabase.storage
      .from('user')
      .list('user', {
        search: userId,
        limit: 10
      });

    if (error) {
      console.error('Error al listar imágenes:', error.message);
      return [];
    }

    console.log('Imágenes encontradas:', data);
    return data || [];
  },

  async getUserImageUrl(userId: string): Promise<string | null> {
    console.log('=== INICIO DE BÚSQUEDA DE IMAGEN ===');
    console.log('Usuario:', userId);
    
    try {
      // Intentar obtener la URL directamente con la ruta correcta
      const filePath = `user/${userId}.png`;
      console.log('Intentando obtener URL para:', filePath);

      const { data: signedUrlData, error } = await supabase.storage
        .from('user')
        .createSignedUrl(filePath, 3600);

      if (!error && signedUrlData?.signedUrl) {
        console.log('URL obtenida exitosamente para:', filePath);
        return signedUrlData.signedUrl;
      }

      // Si no se encuentra, intentar con otras extensiones
      for (const ext of ALLOWED_EXTENSIONS) {
        if (ext === 'png') continue; // Ya intentamos con png
        const altPath = `user/${userId}.${ext}`;
        console.log('Intentando obtener URL para:', altPath);

        const { data: altSignedUrlData, error: altError } = await supabase.storage
          .from('user')
          .createSignedUrl(altPath, 3600);

        if (!altError && altSignedUrlData?.signedUrl) {
          console.log('URL obtenida exitosamente para:', altPath);
          return altSignedUrlData.signedUrl;
        }
      }

      console.log('No se encontraron imágenes para el usuario');
      return null;
    } catch (error) {
      console.error('Error al obtener URL de la imagen:', error);
      return null;
    } finally {
      console.log('=== FIN DE BÚSQUEDA DE IMAGEN ===');
    }
  }
}; 