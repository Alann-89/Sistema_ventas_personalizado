import { agregarProveedores, insertarDireccion } from './crudProveedores.js';
import { toastInfo } from '../funciones/alertas.js';
import { mostrarAlertaProveedorGuardado, mostrarErrorValidacion, mostrarErrorServidor, mostrarCambiosSinGuardar, mostrarErrorProcesar } from './alertaProveedores.js';
 
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

     // Función para separar la dirección completa en componentes
    function separarDireccion(direccionCompleta) {
        // Expresión regular para extraer información de la dirección
        // Busca patrones como: "Calle Nombre #123, Ciudad" o "Av. Principal 456, Col. Centro"
        const regex = /^(.+?)\s*#?(\d+[a-zA-Z]*),?\s*(.+)$/;
        const match = direccionCompleta.match(regex);
        
        if (match) {
            return {
                calle: match[1].trim(),
                num: match[2].trim(),
                ciudad_delegacion: match[3].trim()
            };
        } else {
            // Si no coincide con el patrón, intenta separar por comas
            const partes = direccionCompleta.split(',');
            if (partes.length >= 2) {
                // Busca números en la primera parte
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
                // Fallback: toda la dirección como calle
                return {
                    calle: direccionCompleta,
                    num: '',
                    ciudad_delegacion: ''
                };
            }
        }
    }

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

    // Función para obtener teléfono completo con prefijo
    function obtenerTelefonoCompleto() {
        const prefijo = document.getElementById("prefijo").value;
        const numero = document.getElementById("telefono").value.replace(/\s+/g, ''); // Quita espacios
        return `${prefijo}${numero}`;
    }

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
            toastInfo('Procesando', 'Guardando datos del Proveedor...');

            // Separar direccion
            const direccionCompleta = document.getElementById('direccion_completa').value.trim();
            const direccionSeparada = separarDireccion(direccionCompleta);

            const direccion = {
                calle: escapeHtml(direccionSeparada.calle),
                num: escapeHtml(direccionSeparada.num),
                ciudad_delegacion: escapeHtml(direccionSeparada.ciudad_delegacion),
                codigo_postal: escapeHtml( document.getElementById('codigo_postal').value.trim()),
                estado: escapeHtml(document.getElementById('estado').value.trim())
            };

            // Insertar dirección y obtener su ID
            const direccionId = await insertarDireccion(direccion);
            
            // Crear objeto de producto
            const proveedor = {
                nombre: escapeHtml(document.getElementById('nombre').value.trim()),
                direccion: direccionId,
                telefono: escapeHtml(obtenerTelefonoCompleto()),
                correo: escapeHtml(document.getElementById('correo').value.trim())
            };
            
            // Guardar el producto en la base de datos
            await agregarProveedores(proveedor);
            
            // Mostrar alerta de éxito con opciones
            mostrarAlertaProveedorGuardado();
            
        } catch (error) {
            console.error('Error al guardar proveedor:', error);
            
            // Verificar tipo de error para mostrar mensaje apropiado
            if (error.message.includes('conexión') || error.message.includes('network')) {
                mostrarErrorServidor();
            } else {
                // Error específico del proceso
                mostrarErrorProcesar(error.message);
            }
        }
    });
    
    //Manejar el botón de cancelar/volver
    const botonesCancelar  = document.querySelectorAll('.boton-eliminar, .boton-atras');
    botonesCancelar.forEach(boton => {
        boton.addEventListener('click', function(e) {

        if (formularioTieneCambios()) {
            e.preventDefault();
            mostrarCambiosSinGuardar();
        } else {
            window.history.back();
        }
        });
    });
});