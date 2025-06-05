import { actualizarProducto, eliminarProducto } from './crudProductos.js';
import { subirYReemplazarImagen } from './imagen.js';
import { supabase } from '../funciones/conexion.js';
import { mostrarErrorValidacion, mostrarActualizarProducto, mostrarConfirmacionEdicion, mostrarConfirmacionEliminar } from './alertaProductos.js';
import { toastInfo, showToast } from '../funciones/alertas.js';

// Función para validar el formulario de edición
function validarFormularioEdicion() {
    const errores = [];
    
    const nombre = document.getElementById('nombre').value.trim();
    const precio = document.getElementById('precio').value;
    const existencia = document.getElementById('existencia').value;
    const codigo = document.getElementById('codigo').value;
    
    // Validaciones específicas
    if (!nombre) {
        errores.push('El nombre del producto es obligatorio');
    }
    
    if (!precio || isNaN(parseFloat(precio)) || parseFloat(precio) <= 0) {
        errores.push('Ingresa un precio válido mayor a 0');
    }
    
    if (!existencia || isNaN(parseInt(existencia)) || parseInt(existencia) < 0) {
        errores.push('Ingresa una cantidad válida (0 o mayor)');
    }

    if (!codigo) {
        errores.push('El codigo del producto es obligatorio');
    }
    
    return errores;
}

// Función para detectar cambios en el formulario
function detectarCambios(producto,imageHandler) {
    const datosActuales = {
        nombre: escapeHtml(document.getElementById('nombre').value.trim()),
        precio_base: parseFloat(parseFloat(document.getElementById('precio').value).toFixed(2)) || 0,
        cantidad: parseInt(document.getElementById('existencia').value) || 0,
        categoria: parseInt(document.getElementById('categoria').value),
        descripcion: escapeHtml(document.getElementById('descripcion').value.trim()),
        codigo: document.getElementById('codigo').value.trim()
    };
    
    // Comparar con los datos originales del producto
    const hayCambiosTexto = (
        datosActuales.nombre !== producto.nombre ||
        datosActuales.precio_base !== producto.precio_base ||
        datosActuales.cantidad !== producto.cantidad ||
        datosActuales.categoria !== producto.categoria ||
        datosActuales.descripcion !== (producto.descripcion || '') ||
        datosActuales.codigo !== (producto.codigo || '')
    );
    
    const hayCambiosImagen = imageHandler.obtenerArchivo() !== null;
    
    return hayCambiosTexto || hayCambiosImagen;
}

function escapeHtml(unsafe) {
    return unsafe.replace(/[&<"'>]/g, (match) =>
        ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
        }[match])
    );
}

export function configurarEventosEdicion(producto, imageHandler, id) {
    const form = document.getElementById('formulario-edicion');
    form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validar formulario
    const errores = validarFormularioEdicion();
    if (errores.length > 0) {
        mostrarErrorValidacion(errores);
        return;
    }
    
    // Verificar si hay cambios
    if (!detectarCambios(producto, imageHandler)) {
        toastInfo('Sin cambios', 'No se detectaron cambios en el producto');
        return;
    }

    // Preparar datos para actualización
    const nuevaImagen = imageHandler.obtenerArchivo();
    let imagenUrl = producto.imagen;

    const cambiosProducto = {
      nombre : escapeHtml(document.getElementById('nombre').value.trim()),
      precio_base: parseFloat(parseFloat(document.getElementById('precio').value).toFixed(2)),
      cantidad : parseInt(document.getElementById('existencia').value),
      categoria : parseInt(document.getElementById('categoria').value),
      descripcion : escapeHtml(document.getElementById('descripcion').value.trim()),
      codigo : document.getElementById('codigo').value.trim(),
      imagen: imagenUrl
    };

    try {
        // Toast informativo de inicio del proceso
        toastInfo('Procesando', 'Actualizando producto...');

         if (nuevaImagen && imageHandler.esValido()) {
            try {
                toastInfo('Subiendo imagen', 'Procesando nueva imagen...');
                imagenUrl = await subirYReemplazarImagen(nuevaImagen, producto.imagen);
                cambiosProducto.imagen = imagenUrl;
            } catch (error) {
                mostrarErrorValidacion([
                    'Error al subir la imagen: ' + error.message,
                    'Verifica que la imagen sea válida e inténtalo nuevamente'
                ]);
                return;
            }
        }
        // Actualizar producto en la base de datos
        await actualizarProducto(id, cambiosProducto);

        mostrarActualizarProducto(producto, cambiosProducto);

    } catch (error) {
        console.error('Error al actualizar producto:', error);
        
        // Determinar tipo de error y mostrar mensaje apropiado
        if (error.message.includes('conexión') || error.message.includes('network')) {
            mostrarErrorServidor();
        } else if (error.message.includes('permisos') || error.message.includes('autorización')) {
            mostrarErrorValidacion([
                'No tienes permisos para actualizar este producto',
                'Contacta al administrador si el problema persiste'
            ]);
        } else {
            mostrarErrorValidacion([
                `Error al actualizar el producto: ${error.message}`,
                'Verifica que todos los datos sean correctos e intenta nuevamente'
            ]);
        }
    }
    });

    // Manejar el botón de cancelar/volver con confirmación
    const botonesCancelar = document.querySelectorAll('.boton-atras, [data-action="cancel"]');
    botonesCancelar.forEach(boton => {
        boton.addEventListener('click', function(e) {
            // Verificar si hay cambios pendientes
            if (detectarCambios(producto, imageHandler)) {
                e.preventDefault();
                mostrarConfirmacionEdicion(() => {
                    // Simular clic en el botón de submit
                    document.querySelector('button[type="submit"]').click();
                });
                
            } else {
                // No hay cambios, salir normalmente
                window.history.back();
            }
        });
    });

    document.getElementById('btn-eliminar').addEventListener('click', () => {
        mostrarConfirmacionEliminar(async () => {
            try {
                
                if (producto.imagen) {
                    const nombreImagen = producto.imagen.split('/').pop();
                    await supabase.storage.from('imagenes').remove([nombreImagen]);
                    showToast({
                        type: 'success',
                        title: 'Producto e imagen eliminados',
                        message: 'Se eliminó correctamente del inventario y del almacenamiento.'
                    });
                } else {
                    showToast({
                        type: 'success',
                        title: 'Producto eliminado',
                        message: 'El producto se eliminó correctamente.'
                    });
                }

                await eliminarProducto(id);
                window.history.back();
            } catch (error) {
                showToast({
                    type: 'error',
                    title: 'Error al eliminar',
                    message: error.message
                });
            }
        });
    });
}
