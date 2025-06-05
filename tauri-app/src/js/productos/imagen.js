import { supabase } from '../funciones/conexion.js';

export async function subirImagen(archivo) {
  const nombreArchivo = `${Date.now()}_${archivo.name}`;
  const { error } = await supabase.storage.from('imagenes').upload(nombreArchivo, archivo);
  if (error) throw error;

  const { data } = supabase.storage.from('imagenes').getPublicUrl(nombreArchivo);
  return data.publicUrl;
}

export async function subirYReemplazarImagen(nuevaImagen, urlAnterior = null) {
  const nombreArchivo = `${Date.now()}_${nuevaImagen.name}`;
  const { error: uploadError } = await supabase.storage
    .from('imagenes')
    .upload(nombreArchivo, nuevaImagen, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw new Error('Error al subir imagen: ' + uploadError.message);

  const { data } = supabase.storage.from('imagenes').getPublicUrl(nombreArchivo);
  const nuevaUrl = data.publicUrl;

  if (urlAnterior) {
    const nombreAnterior = urlAnterior.split('/').pop();
    await supabase.storage.from('imagenes').remove([nombreAnterior]);
  }

  return nuevaUrl;
}

/**
 * Función reutilizable para manejar la carga y previsualización de imágenes
 * @param {Object} config - Configuración del handler
 * @param {string} config.inputId - ID del input de archivo
 * @param {string} config.previewId - ID del elemento img para previsualización
 * @param {string} config.uploadAreaId - ID del área clickeable para seleccionar imagen
 * @param {number} [config.maxSize=5] - Tamaño máximo en MB (por defecto 5MB)
 * @param {function} [config.onSuccess] - Callback ejecutado cuando la imagen se carga exitosamente
 * @param {function} [config.onError] - Callback ejecutado cuando hay un error
 */
export function inicializarManejadorImagen(config) {
    const {
        inputId,
        previewId,
        uploadAreaId,
        maxSize = 5,
        onSuccess,
        onError
    } = config;

    const imagenInput = document.getElementById(inputId);
    const previewImg = document.getElementById(previewId);
    const uploadArea = document.getElementById(uploadAreaId);

    // Validar que los elementos existan
    if (!imagenInput || !previewImg || !uploadArea) {
        console.error('Error: No se encontraron todos los elementos necesarios para el manejo de imágenes');
        return;
    }

    // Agregar atributo accept al input para solo permitir imágenes
    imagenInput.setAttribute('accept', 'image/*');

    // Manejar la selección de imagen al hacer clic en el área
    uploadArea.addEventListener('click', function() {
        imagenInput.click();
    });

    // Mostrar vista previa cuando se selecciona una imagen
    imagenInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            mostrarVistaPrevia(this.files[0]);
        }
    });

    // Función para mostrar vista previa de la imagen
    function mostrarVistaPrevia(file) {
        // Validar que sea una imagen
        if (!file.type.startsWith('image/')) {
            const errorMsg = 'Por favor selecciona solo archivos de imagen (JPG, PNG, GIF, etc.)';
            alert(errorMsg);
            limpiarInput();
            if (onError) onError(new Error(errorMsg));
            return;
        }

        // Validar tamaño de archivo
        const maxSizeBytes = maxSize * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            const errorMsg = `La imagen es demasiado grande. Por favor selecciona una imagen menor a ${maxSize}MB`;
            alert(errorMsg);
            limpiarInput();
            if (onError) onError(new Error(errorMsg));
            return;
        }

        const reader = new FileReader();

        reader.onload = function(e) {
            previewImg.src = e.target.result;
            previewImg.style.opacity = '1';
            if (onSuccess) onSuccess(file, e.target.result);
        }

        reader.onerror = function() {
            const errorMsg = 'Error al leer el archivo de imagen';
            alert(errorMsg);
            limpiarInput();
            if (onError) onError(new Error(errorMsg));
        }

        reader.readAsDataURL(file);
    }

    // Función auxiliar para limpiar el input y ocultar preview
    function limpiarInput() {
        imagenInput.value = '';
        previewImg.style.opacity = '0';
        previewImg.src = '';
    }

    // Retornar funciones útiles para usar externamente
    return {
        limpiarInput,
        obtenerArchivo: () => imagenInput.files[0] || null,
        esValido: () => imagenInput.files && imagenInput.files[0] && imagenInput.files[0].type.startsWith('image/')
    };
}
