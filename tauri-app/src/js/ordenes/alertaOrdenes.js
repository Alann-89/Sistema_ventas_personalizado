import { showAlert, showToast, toastInfo } from '../funciones/alertas';

// Funciones específicas para productos
export function mostrarAlertaClienteGuardado() {
    showAlert({
        type: 'success',
        title: 'Cliente Guardado',
        message: 'El cliente se ha guardado exitosamente en los registros.',
        buttons: [
            { 
                text: 'Ver Clientes', 
                type: 'primary', 
                action: () => {
                    // Redirigir a la lista de clientes
                    window.location.href = './clientes.html';
                }
            },
            { 
                text: 'Agregar Otro', 
                type: 'secondary', 
                action: () => {
                    // Limpiar el formulario
                    document.getElementById('formulario-agregar').reset();
                }
            }
        ]
    });
}

export function mostrarConfirmacionEliminar(callback) {
    showAlert({
        type: 'warning',
        title: 'Confirmar Eliminación',
        message: '¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.',
        buttons: [
            { 
                text: 'Eliminar', 
                type: 'danger', 
                action: () => {
                    if (callback) callback();
                    showToast({
                        type: 'success',
                        title: 'Producto eliminado',
                        message: 'El producto se eliminó correctamente del inventario.'
                    });
                }
            },
            { 
                text: 'Cancelar', 
                type: 'secondary', 
                action: () => {} 
            }
        ]
    });
}

export function mostrarConfirmacionEdicion(callback) {
    showAlert({
        type: 'info',
        title: 'Guardar Cambios',
        message: 'Se han detectado cambios en el producto. ¿Deseas guardarlos?',
        buttons: [
            { 
                text: 'Guardar', 
                type: 'primary', 
                action: () => {
                    if (callback) callback();
                    //showToast({
                        //type: 'success',
                        //title: 'Cambios guardados',
                        //message: 'Los cambios del producto se guardaron exitosamente.'
                    //});
                }
            },
            { 
                text: 'Descartar', 
                type: 'danger', 
                action: () => {
                    // Recargar la página o restablecer valores
                    window.history.back();
                }
            },
            { 
                text: 'Cancelar', 
                type: 'secondary', 
                action: () => {} 
            }
        ]
    });
}

export function mostrarErrorValidacion(errores = []) {
    let mensaje = 'Por favor, corrige los siguientes errores:';
    if (errores.length > 0) {
        mensaje += '\n\n• ' + errores.join('\n• ');
    } else {
        mensaje = 'Por favor, completa todos los campos requeridos antes de guardar.';
    }
    
    showAlert({
        type: 'error',
        title: 'Error de Validación',
        message: mensaje,
        buttons: [
            { 
                text: 'Entendido', 
                type: 'primary', 
                action: () => {} 
            }
        ]
    });
}

export function mostrarErrorProcesar(errores = []) {
    let mensaje = 'Error al caragar pedidos:';
    if (errores.length > 0) {
        mensaje += '\n\n• ' + errores.join('\n• ');
    } else {
        mensaje = 'Verifica que todos los datos sean correctos e intenta nuevamente';
    }
    
    showAlert({
        type: 'error',
        title: 'Error de Validación',
        message: mensaje,
        buttons: [
            { 
                text: 'Entendido', 
                type: 'primary', 
                action: () => {} 
            }
        ]
    });
}

export function mostrarErrorServidor() {
    showAlert({
        type: 'error',
        title: 'Error del Servidor',
        message: 'No se pudo conectar con el servidor. Por favor, verifica tu conexión e inténtalo nuevamente.',
        buttons: [
            { 
                text: 'Reintentar', 
                type: 'primary', 
                action: () => {
                    //Lógica para reintentar la operación
                    location.reload();
                }
            },
            { 
                text: 'Cancelar', 
                type: 'secondary', 
                action: () => {} 
            }
        ]
    });
}

export function mostrarErrorClientes() {
    showAlert({
        type: 'error',
        title: 'Error del Servidor',
        message: 'No se pudo cargar los clientes. Por favor, verifica tu conexión e inténtalo nuevamente.',
        buttons: [
            { 
                text: 'Reintentar', 
                type: 'primary', 
                action: () => {
                    //Lógica para reintentar la operación
                    location.reload();
                }
            },
            { 
                text: 'Cancelar', 
                type: 'secondary', 
                action: () => {} 
            }
        ]
    });
}

export function mostrarCambiosSinGuardar() {
    showAlert({
        type: 'warning',
        title: 'Cambios sin guardar',
        message: '¿Estás seguro de que deseas salir? Se perderán todos los cambios realizados.',
        buttons: [
            {
                text: 'Salir sin guardar',
                type: 'danger',
                action: () => window.history.back()
            },
            {
                text: 'Continuar editando',
                type: 'primary',
                action: () => {}
            }
        ]
    });
}

export function mostrarActualizarProducto(producto, cambiosProducto) {
    showAlert({
        type: 'success',
        title: 'Producto Actualizado',
        message: 'Los cambios se guardaron correctamente en el inventario.',
        buttons: [
            { 
                text: 'Volver a Lista', 
                type: 'primary', 
                action: () => {
                    window.history.back();
                }
            },
            { 
                text: 'Seguir Editando', 
                type: 'secondary', 
                action: () => {
                    // Actualizar los datos base del producto con los nuevos valores
                    Object.assign(producto, cambiosProducto);
                    toastInfo('Listo', 'Puedes continuar editando el producto');
                }
            }
        ]
    });
}

export function errorObtencionCliente(errores = []) {
    let mensaje = 'Error al obtener datos del cliente:';
    if (errores.length > 0) {
        mensaje += '\n\n• ' + errores.join('\n• ');
    } else {
        mensaje = 'Vuelva a intentar mas tarde.';
    }
    
    showAlert({
        type: 'error',
        title: 'Error de Obtencion de Datos',
        message: mensaje,
        buttons: [
            { 
                text: 'Entendido', 
                type: 'primary', 
                action: () => {} 
            }
        ]
    });
}

export function errorHistorial(errores = []) {
    let mensaje = 'Error al obtener historial del cliente:';
    if (errores.length > 0) {
        mensaje += '\n\n• ' + errores.join('\n• ');
    } else {
        mensaje = 'Vuelva a intentar mas tarde.';
    }
    
    showAlert({
        type: 'error',
        title: 'Error de Obtencion de Datos',
        message: mensaje,
        buttons: [
            { 
                text: 'Entendido', 
                type: 'primary', 
                action: () => {} 
            }
        ]
    });
}
