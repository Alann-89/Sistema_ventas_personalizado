import { supabase } from '../funciones/conexion.js';
import { configurarEventosInformacion } from './manejadorInformacion.js';
import { errorObtencionProveedor } from './alertaProveedores.js';

let proveedorId = null;
let direccionId = null;
let datosOriginalesProveedor = {};

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

    proveedorId = id;

    const { data: proveedor, error } = await supabase
    .from('proveedores')
    .select(`
        id, nombre, telefono, correo, direccion,
        direccion (
        id, calle, num, ciudad_delegacion, codigo_postal, estado
        )
    `)
    .eq('id', id)
    .single();

    if (error) {
        errorObtencionProveedor(error);
        return;
    }

    // Proveedor
    document.getElementById('nombre').value = proveedor.nombre;
    document.getElementById('correo').value = proveedor.correo;
    aplicarPrefijoTelefono(proveedor.telefono)

    // Dirección
    const direccionCompleta = `${proveedor.direccion.calle} #${proveedor.direccion.num}, ${proveedor.direccion.ciudad_delegacion}`;
    document.getElementById('direccion_completa').value = direccionCompleta;
    document.getElementById('codigo_postal').value = proveedor.direccion.codigo_postal;
    document.getElementById('estado').value = proveedor.direccion.estado;

    direccionId = proveedor.direccion.id;

    // Guardar valores originales para comparar después
    datosOriginalesProveedor = {
        nombre: proveedor.nombre.trim(),
        telefono: (document.getElementById('prefijo').value + document.getElementById('telefono').value.trim()).replace(/\s+/g, ''),
        correo: proveedor.correo.trim(),
        direccion: {
            calle: proveedor.direccion.calle,
            num: proveedor.direccion.num,
            ciudad_delegacion: proveedor.direccion.ciudad_delegacion.trim(),
            codigo_postal: proveedor.direccion.codigo_postal,
            estado: proveedor.direccion.estado.trim()
        }
    };

    configurarEventosInformacion(proveedorId, direccionId, datosOriginalesProveedor); 
});
