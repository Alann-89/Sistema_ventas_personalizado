import { supabase } from '../funciones/conexion.js';
import { renderFormularioEdicion } from './uiEditar.js';
import { configurarEventosEdicion } from './manejadoresEdicion.js';
import { inicializarManejadorImagen } from './imagen.js';
import { toastInfo, toastError } from '../funciones/alertas.js';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  const { data: producto, error } = await supabase
    .from('productos')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !producto) {
    document.getElementById('contenedor-formulario').innerHTML = toastError('Error al cargar el producto.', error.message);;
    return;
  }

  const { data: categorias, error: errorCategorias } = await supabase
    .from('categorias')
    .select('id, nombre')
    .order('nombre', { ascending: true });

  if (errorCategorias || !categorias) {
    document.getElementById('contenedor-formulario').innerHTML = toastError('Error al cargar categorías.', errorCategorias?.message);
    return;
  }

  const contenedor = document.getElementById('contenedor-formulario');
  contenedor.innerHTML = renderFormularioEdicion(producto, categorias);

  // Inicializar el manejador de imágenes con alertas
  const imageHandler = inicializarManejadorImagen({
    inputId: 'imagen',
    previewId: 'preview-img',
    uploadAreaId: 'upload-area',
    maxSize: 5, // 5MB
    onSuccess: (file) => {
        console.log('Imagen cargada exitosamente:', file.name);
        // Toast de confirmación de imagen cargada
        toastInfo('Imagen cargada', `Se cargó correctamente: ${file.name}`);
    },
    onError: (error) => {
        console.error('Error al cargar imagen:', error.message);
        // Toast de error para imagen
        toastError('Error de imagen', error.message);
    }
  });

  configurarEventosEdicion(producto, imageHandler, id);
});
