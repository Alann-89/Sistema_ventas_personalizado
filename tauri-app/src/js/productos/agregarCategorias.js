import { agregarProducto } from './crudProductos.js';
import { toastError, toastInfo } from '../funciones/alertas.js';
import { mostrarAlertaProductoGuardado, mostrarErrorValidacion, mostrarErrorServidor, mostrarCambiosSinGuardar } from './alertaProductos.js';

document.addEventListener('DOMContentLoaded', function() {
    const formulario = document.getElementById('formulario-agregar');
    
    // Función para validar el formulario
    function validarFormulario() {
        const errores = [];
        
        const nombre = document.getElementById('nombre').value.trim();
        
        // Validaciones específicas
        if (!nombre) {
            errores.push('El nombre del producto es obligatorio');
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
    
    // Manejar el envío del formulario con sistema de alertas integrado
    formulario.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validar formulario
        const errores = validarFormulario();
        if (errores.length > 0) {
            mostrarErrorValidacion(errores);
            return;
        }
        
        try { 
            // Toast informativo de inicio del proceso
            toastInfo('Procesando', 'Guardando categoria...');
            
            // Crear objeto de producto
            const categoria = {
                nombre: escapeHtml(document.getElementById('nombre').value.trim()),
            };
            
            // Guardar el producto en la base de datos
            await agregarProducto(categoria);
            
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
    let formularioModificado = false;
    formulario.addEventListener('input', () => formularioModificado = true);
    formulario.addEventListener('change', () => formularioModificado = true);

    const botonesCancelar  = document.querySelectorAll('.boton-eliminar, .boton-atras');
    botonesCancelar.forEach(boton => {
        boton.addEventListener('click', function(e) {
            

            if (formularioModificado || (typeof imageHandler !== 'undefined' && imageHandler.obtenerArchivo())) {
                e.preventDefault();
                mostrarCambiosSinGuardar();
            } else { 
                window.history.back()
            }
        });
    });
});