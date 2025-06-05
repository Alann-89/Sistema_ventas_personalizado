import { supabase } from '../funciones/conexion.js';
import { configurarEventosInformacion } from './manejadorInformacion.js';
import { errorObtencionCliente } from './alertaClientes.js';

let clienteId = null;
let direccionId = null;
let datosOriginalesCliente = {};

document.addEventListener('DOMContentLoaded', async () => {

    function aplicarPrefijoTelefono(telefonoCompleto) {
        if (!telefonoCompleto) return;

        // Asegurarse de que es una cadena
        telefonoCompleto = telefonoCompleto.toString();

        const posiblesPrefijos = ['+52', '+1', '+54', '+57'];
        let prefijoDetectado = '';
        let telefonoSinPrefijo = telefonoCompleto;

        for (const pref of posiblesPrefijos) {
            if (telefonoCompleto.startsWith(pref)) {
                prefijoDetectado = pref;
                telefonoSinPrefijo = telefonoCompleto.slice(pref.length); // Quita el prefijo
                break;
            }
        }

        // Formatear el número: 555 444 3333
        const formateado = telefonoSinPrefijo.replace(/\D/g, '') // quitar no dígitos
        .replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3'); // formatear

        // Asignar a los campos
        document.getElementById('prefijo').value = prefijoDetectado;
        document.getElementById('telefono').value = formateado;

    }

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    clienteId = id;

    const { data: cliente, error } = await supabase
    .from('clientes')
    .select(`
        id, nombre, telefono, correo, direccion,
        direccion (
        id, calle, num, ciudad_delegacion, codigo_postal, estado
        )
    `)
    .eq('id', id)
    .single();

    if (error) {
        errorObtencionCliente(error);
        return;
    }

    // Cliente
    document.getElementById('nombre').value = cliente.nombre;
    document.getElementById('correo').value = cliente.correo;
    aplicarPrefijoTelefono(cliente.telefono)

    // Dirección
    const direccionCompleta = `${cliente.direccion.calle} #${cliente.direccion.num}, ${cliente.direccion.ciudad_delegacion}`;
    document.getElementById('direccion_completa').value = direccionCompleta;
    document.getElementById('codigo_postal').value = cliente.direccion.codigo_postal;
    document.getElementById('estado').value = cliente.direccion.estado;

    direccionId = cliente.direccion.id;

    // Guardar valores originales para comparar después
    datosOriginalesCliente = {
        nombre: cliente.nombre.trim(),
        telefono: (document.getElementById('prefijo').value + document.getElementById('telefono').value.trim()).replace(/\s+/g, ''),
        correo: cliente.correo.trim(),
        direccion: {
            calle: cliente.direccion.calle,
            num: cliente.direccion.num,
            ciudad_delegacion: cliente.direccion.ciudad_delegacion.trim(),
            codigo_postal: cliente.direccion.codigo_postal,
            estado: cliente.direccion.estado.trim()
        }
    };

    configurarEventosInformacion(clienteId, direccionId, datosOriginalesCliente);
    
});
