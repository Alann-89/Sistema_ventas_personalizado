import { subirImagen, inicializarManejadorImagen } from './imagen.js';
import { agregarProducto, cargarCategorias } from './crudProductos.js';
import { toastError, toastInfo } from '../funciones/alertas.js';
import { mostrarAlertaProductoGuardado, mostrarErrorValidacion, mostrarErrorServidor, mostrarCambiosSinGuardar } from './alertaProductos.js';

document.addEventListener('DOMContentLoaded', function() {
    const formulario = document.getElementById('formulario-agregar');

    // Guarda los valores originales al cargar
    const estadoInicial = new FormData(formulario);

    function formularioTieneCambios() {
        const estadoActual = new FormData(formulario);
        for (let [key, valorInicial] of estadoInicial.entries()) {
            let valorActual = estadoActual.get(key);
            if (valorInicial !== valorActual) {
                return true;
            }
        }
        return false;
    }
    
    // Inicializar el manejador de imágenes
    const imageHandler = inicializarManejadorImagen({
        inputId: 'imagen',
        previewId: 'preview-img',
        uploadAreaId: 'upload-area',
        maxSize: 5, // 5MB
        onSuccess: (file, dataUrl) => {
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
    
    // Función para validar el formulario
    function validarFormulario() {
        const errores = [];
        
        const nombre = document.getElementById('nombre').value.trim();
        const precio = document.getElementById('precio').value;
        const existencia = document.getElementById('existencia').value;
        const codigo = document.getElementById('codigo').value;
        const archivoImagen = imageHandler.obtenerArchivo();
        
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
        
        if (!archivoImagen) {
            errores.push('Selecciona una imagen para el producto');
        }
        
        return errores;
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

    //Carga de categorias
    const selectCategoria = document.getElementById('categoria');
    cargarCategorias(selectCategoria);
    
    // Manejar el envío del formulario con sistema de alertas integrado
    formulario.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validar formulario
        const errores = validarFormulario();
        if (errores.length > 0) {
            mostrarErrorValidacion(errores);
            return;
        }
        
        // Obtener datos del formulario
        const archivoImagen = imageHandler.obtenerArchivo();
        
        try { 
            // Toast informativo de inicio del proceso
            toastInfo('Procesando', 'Subiendo imagen y guardando producto...');
            
            // Subir imagen a Supabase
            const urlPublica = await subirImagen(archivoImagen);
            
            // Crear objeto de producto
            const producto = {
                nombre: escapeHtml(document.getElementById('nombre').value.trim()),
                precio_base: parseFloat(parseFloat(document.getElementById('precio').value).toFixed(2)),
                cantidad: parseInt(document.getElementById('existencia').value),
                imagen: urlPublica,
                categoria: parseInt(document.getElementById('categoria').value),
                descripcion: escapeHtml(document.getElementById('descripcion').value.trim()),
                codigo: document.getElementById('codigo').value.trim()
            };
            
            // Guardar el producto en la base de datos
            await agregarProducto(producto);
            
            // Mostrar alerta de éxito con opciones
            mostrarAlertaProductoGuardado();
            
        } catch (error) {
            console.error('Error al guardar producto:', error);
            
            // Verificar tipo de error para mostrar mensaje apropiado
            if (error.message.includes('conexión') || error.message.includes('network')) {
                mostrarErrorServidor();
            } else {
                // Error específico del proceso
                mostrarErrorValidacion([
                    `Error al procesar el producto: ${error.message}`,
                    'Verifica que todos los datos sean correctos e intenta nuevamente'
                ]);
            }
        }
    });
    
    //Manejar el botón de cancelar/volver
    const botonesCancelar  = document.querySelectorAll('.boton-eliminar, .boton-atras');
    botonesCancelar.forEach(boton => {
        boton.addEventListener('click', function(e) {
            const hayArchivoNuevo = typeof imageHandler !== 'undefined' && imageHandler.obtenerArchivo();

        if (formularioTieneCambios() || hayArchivoNuevo) {
            e.preventDefault();
            mostrarCambiosSinGuardar();
        } else {
            window.history.back();
        }
        });
    });
});
