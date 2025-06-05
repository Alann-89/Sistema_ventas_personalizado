import { supabase } from '../funciones/conexion.js';
import { mostrarErrorValidacion,mostrarConfirmacionEliminar, mostrarErrorServidor } from './alertaProveedores.js';
import { showAlert, showToast, toastInfo } from '../funciones/alertas';
import { eliminarProveedores } from '../proveedores/crudProveedores.js';

export function configurarEventosInformacion(proveedorId, direccionId, datosOriginales) {
    const form = document.getElementById('formulario-cliente');
    
    //Valida que solo se escriba un numero de telefono
    const inputTelefono = document.getElementById("telefono");
    inputTelefono.addEventListener("input", (e) => {
        let valor = e.target.value.replace(/\D/g, ""); // Solo números

        // Formatea el número como: 555 123 4567 (sin prefijo, este va por separado)
        const formateado = valor.replace(/^(\d{0,3})(\d{0,3})(\d{0,4}).*/, (_, p1, p2, p3) => {
            return [p1, p2, p3].filter(Boolean).join(" ");
        });

        e.target.value = formateado;
    });

    // Validar código postal (solo números)
    document.getElementById('codigo_postal').addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/\D/g, '');
    });

    // Función para validar el formulario
    function validarFormulario() {
        const errores = [];
        
        const nombre = document.getElementById('nombre').value.trim();
        const telefono = document.getElementById('telefono').value;
        const correo = document.getElementById("correo").value;
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const calle = document.getElementById('direccion_completa').value;
        const codigoPostal = document.getElementById('codigo_postal').value;
        const estado = document.getElementById('estado').value;

        
        // Validaciones específicas
        if (!nombre) {
            errores.push('El nombre del cliente es obligatorio');
        }
        
        if (!telefono) {
            errores.push('El telefono del cliente es obligatorio');
        }

        if (!regex.test(correo)) {
            errores.push("Ingresa un correo electrónico válido.");
        }

        if (!calle) {
            errores.push('La calle del cliente es obligatorio');
        }
        
        if (!codigoPostal) {
            errores.push('El codigo postal del cliente es obligatorio');
        }

        if (!estado || "") {
            errores.push('El estado del cliente es obligatorio');
        }
        
        return errores;
    }

    // Botón editar
    document.getElementById('btn-editar').addEventListener('click', () => toggleEdicion(true));

    // Manejar el envío del formulario con sistema de alertas integrado
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validar formulario
        const errores = validarFormulario();
        if (errores.length > 0) {
            mostrarErrorValidacion(errores);
            return;
        }

        const numero = document.getElementById('telefono').value.replace(/\s+/g, '');
        const prefijo = document.getElementById('prefijo').value;
        const telefonoCompleto = prefijo + numero;

        const direccionSeparada = separarDireccion(document.getElementById('direccion_completa').value);

        const proveedorUpdate = {
            nombre: document.getElementById('nombre').value.trim(),
            telefono: telefonoCompleto,
            correo: document.getElementById('correo').value.trim()
        };

        const direccionUpdate = {
            calle: direccionSeparada.calle.trim(),
            num: direccionSeparada.num.trim(),
            ciudad_delegacion: direccionSeparada.ciudad_delegacion.trim(),
            codigo_postal: document.getElementById('codigo_postal').value.trim(),
            estado: document.getElementById('estado').value.trim()
        };

        // Validar cambios
        if (!detectarCambiosProveedor(datosOriginales)) {
            toastInfo('Sin cambios', 'No se detectaron cambios en el cliente');
            return;
        }

        try {
        toastInfo('Actualizando', 'Guardando datos del cliente...');

        const [{ error: errorprovedor }, { error: errorDireccion }] = await Promise.all([
            supabase.from('clientes').update(proveedorUpdate).eq('id', proveedorId),
            supabase.from('direcciones').update(direccionUpdate).eq('id', direccionId),
        ]);

        if (errorprovedor || errorDireccion) {
            throw new Error((errorprovedor || errorDireccion).message);
        }

        showToast({
            type: 'success',
            title: 'Actualización exitosa',
            message: 'Los datos del proveedor han sido actualizados correctamente'
        });

        toggleEdicion(false);

        } catch (error) {
            console.error('Error al guardar proveedor:', error);

            // Determinar tipo de error y mostrar mensaje apropiado
            if (error.message.includes('conexión') || error.message.includes('network')) {
                mostrarErrorServidor();
            } else if (error.message.includes('permisos') || error.message.includes('autorización')) {
                mostrarErrorValidacion([
                    'No tienes permisos para actualizar este proveedor',
                    'Contacta al administrador si el problema persiste'
                ]);
            } else {
                mostrarErrorValidacion([
                'Ocurrió un error al actualizar los datos del proveedor.',
                error.message
                ]);
            }
        }
    });

    //Eliminar cliente
    document.getElementById('btn-eliminar').addEventListener('click', () => {
        mostrarConfirmacionEliminar(async () => {
            try {
                await eliminarProveedores(proveedorId, direccionId);

                showToast({
                    type: 'success',
                    title: 'Proveedor eliminado',
                    message: 'El proveedor se eliminó correctamente.'
                });

            window.history.back();
            } catch (error) {
            showToast({
                type: 'error',
                title: 'Error al eliminar proveedor',
                message: error.message
            });
            }
        });
    });

    // Botón atras con confirmación
    const botonesatras = document.querySelectorAll('.boton-atras, [data-action="cancel"]');
    botonesatras.forEach(boton => {
        boton.addEventListener('click', function (e) {
            if (detectarCambiosProveedor(datosOriginales)) {
                e.preventDefault();
                mostrarConfirmacionEdicion(() => {
                    // Simular clic en el botón de submit
                    document.querySelector('button[type="submit"]').click();
                });
            } else {
                window.history.back();
            }
        });
    });

    const botonesCancelar = document.querySelectorAll('.boton-cancelar, [data-action="cancel"]');
    botonesCancelar.forEach(boton => {
        boton.addEventListener('click', function (e) {
            if (detectarCambiosProveedor(datosOriginales)) {
                e.preventDefault();
                mostrarConfirmacionEdicion(() => {
                    // Simular clic en el botón de submit
                    document.querySelector('button[type="submit"]').click();
                });
            } else {
                toggleEdicion(false);
            }
        });
    });

    function separarDireccion(direccionCompleta) {
        const regex = /^(.+?)\s*#?(\d+[a-zA-Z]*),?\s*(.+)$/;
        const match = direccionCompleta.match(regex);

        if (match) {
        return {
            calle: match[1].trim(),
            num: match[2].trim(),
            ciudad_delegacion: match[3].trim()
        };
        } else {
        const partes = direccionCompleta.split(',');
            if (partes.length >= 2) {
                const numeroMatch = partes[0].match(/(.+?)\s*#?(\d+[a-zA-Z]*)$/);
                if (numeroMatch) {
                return {
                    calle: numeroMatch[1].trim(),
                    num: numeroMatch[2].trim(),
                    ciudad_delegacion: partes.slice(1).join(',').trim()
                    };
                } else {
                return {
                    calle: partes[0].trim(),
                    num: '',
                    ciudad_delegacion: partes.slice(1).join(',').trim()
                    };
                }
            } else {
                return {
                calle: direccionCompleta,
                num: '',
                ciudad_delegacion: ''
                };
            }
        }
    }

   function detectarCambiosProveedor(datosOriginales) {
        const direccionSeparada = separarDireccion(document.getElementById('direccion_completa').value);

        const datosActuales = {
            nombre: document.getElementById('nombre').value.trim(),
            telefono: document.getElementById('prefijo').value + document.getElementById('telefono').value.replace(/\s+/g, ''),
            correo: document.getElementById('correo').value.trim(),
            direccion: {
            calle: direccionSeparada.calle.trim(),
            num: Number(direccionSeparada.num.trim()),
            ciudad_delegacion: direccionSeparada.ciudad_delegacion.trim(),
            codigo_postal: Number(document.getElementById('codigo_postal').value.trim()),
            estado: document.getElementById('estado').value.trim()
            }
        };

        return (
            datosActuales.nombre !== datosOriginales.nombre ||
            datosActuales.telefono !== datosOriginales.telefono ||
            datosActuales.correo !== datosOriginales.correo ||
            datosActuales.direccion.calle !== datosOriginales.direccion.calle ||
            datosActuales.direccion.num !== datosOriginales.direccion.num ||
            datosActuales.direccion.ciudad_delegacion !== datosOriginales.direccion.ciudad_delegacion ||
            datosActuales.direccion.codigo_postal !== datosOriginales.direccion.codigo_postal ||
            datosActuales.direccion.estado !== datosOriginales.direccion.estado
        );
    }


    function toggleEdicion(habilitar) {
        // Campos editables
        const campos = ['nombre', 'prefijo', 'telefono', 'correo', 'direccion_completa', 'codigo_postal', 'estado'];
        campos.forEach(id => {
            document.getElementById(id).disabled = !habilitar;
        });

        // Mostrar/ocultar botones según modo
        document.getElementById('btn-editar').style.display = habilitar ? 'none' : 'flex';
        document.getElementById('btn-eliminar').style.display = habilitar ? 'none' : 'flex';
        document.getElementById('btn-guardar').style.display = habilitar ? 'flex' : 'none';
        document.getElementById('btn-cancelar').style.display = habilitar ? 'flex' : 'none';
        document.getElementById('modo-edicion').style.opacity = habilitar ? '1' : '0';
        const elementos = document.querySelectorAll('.informacin-del-producto-wrapper');
        elementos.forEach(elem => {
            elem.style.borderColor = habilitar ? '#83b759' : 'transparent';
        });
    }

    function mostrarConfirmacionEdicion(callback) {
        showAlert({
            type: 'info',
            title: 'Guardar Cambios',
            message: 'Se han detectado cambios en el proveedor. ¿Deseas guardarlos?',
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
}
