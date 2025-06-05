import { obtenerDatosPedido, actualizarEstado } from "./crudClientes";
import {errorObtencionPedido, toastExito, showAlert} from "../funciones/alertas"

const estadosPedido = {
    pendiente: `<img src="../../recursos/iconos/icono_estado_pendiente.svg" class="icono-estado" alt="Pendiente"> Pendiente`,
    proceso: `<img src="../../recursos/iconos/icono_estado_proceso.svg" class="icono-estado" alt="En proceso"> En proceso`,
    completado: `<img src="../../recursos/iconos/icono_estado_completado.svg" class="icono-estado" alt="Completado"> Completado`,
    cancelado: `<img src="../../recursos/iconos/icono_eliminar.svg" class="icono-estado" alt="Cancelado"> Cancelado`,
};

let pedidoId = null;
let datosPedido = null;

document.addEventListener('DOMContentLoaded', async function () {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    pedidoId = id;

    try {
        datosPedido = await obtenerDatosPedido(pedidoId);
        if (datosPedido) {
            cargarDatosPedido(datosPedido);
        } else {
            errorObtencionPedido('No se pudo cargar el pedido');
        }
    } catch (error) {

        errorObtencionPedido(error);
    }

    
    document.getElementById('btn-imprimir').addEventListener('click', () => window.print());

    document.querySelector('.boton-atras').addEventListener('click', function () {
        window.history.back();
    });

    // Referencias
    const modalEstado = document.getElementById('estadoModal');
    const selectEstado = document.getElementById('selectEstado');
    const formEstado = document.getElementById('estadoForm');
    
    // Abrir modal al hacer clic en editar
    document.getElementById('btn-editar').addEventListener('click', () => {
        if (datosPedido?.estado) {
            selectEstado.value = datosPedido.estado; // Preseleccionar estado actual
        }
        modalEstado.style.display = 'block';
    });

   // Guardar cambio de estado
    formEstado.addEventListener('submit', async function (e) {
    e.preventDefault();
    const nuevoEstado = selectEstado.value;

    if (nuevoEstado && estadosPedido[nuevoEstado]) {
        try {
            // Actualiza el estado en la base de datos
            
            await actualizarEstado(nuevoEstado, pedidoId);

            // Actualiza el estado localmente
            datosPedido.estado = nuevoEstado;

            // Actualiza la interfaz
            cargarDatosPedido(datosPedido);

            // Cierra el modal
            closeEditModal();

            toastExito('Estado guardado','Estado actualizado correctamente.');

        } catch (err) {
            console.error('Error inesperado:', err);
            showAlert({
                type: 'error',
                title: 'Ocurrió un error inesperado.',
                message: err,
                buttons: [
                    { 
                        text: 'Entendido', 
                        type: 'primary', 
                        action: () => {} 
                    }
                ]
            });
        }
    }
});
});

function cargarDatosPedido(datosPedido) {

    const { id, cliente, fecha, estado, observaciones, items } = datosPedido;
    const direccion = cliente.direccion || {};

    // Estado del pedido
    document.getElementById('pedido').textContent = 'Pedido #' + id;
    const estadoDiv = document.getElementById('estado-pedido');

        // Limpia clases previas
        estadoDiv.className = '';

        // Aplica contenido
        estadoDiv.innerHTML = estadosPedido[estado] || estado;

        // Aplica clase de color según el estado
        if (estado) {
            estadoDiv.classList.add('estado-compra',`estado-${estado}`);
        }


    // Fecha
    document.getElementById('fecha').textContent = 'El ' + formatearFechaCompleta(fecha);

    // Datos del cliente
    document.getElementById('cliente-id').textContent = cliente.id;
    document.getElementById('cliente-nombre').textContent = cliente.nombre || 'Sin nombre';
    document.getElementById('cliente-email').textContent = cliente.correo || 'Sin email';
    document.getElementById('cliente-direccion').textContent = `${direccion.calle} ${direccion.num}`;
    document.getElementById('cliente-ciudad').textContent = direccion.ciudad_delegacion;
    document.getElementById('cliente-cp').textContent = direccion.codigo_postal;
    document.getElementById('cliente-estado').textContent = direccion.estado;


    aplicarPrefijoTelefono(cliente.telefono);

    // Información del pedido
    document.getElementById('pedido-id').textContent = id;
    document.getElementById('pedido-estado').innerHTML = estadosPedido[estado] || estado;
    document.getElementById('pedido-fecha').textContent = formatearFechaCompleta(fecha);
    document.getElementById('pedido-actualizacion').textContent = formatearFechaCompleta(new Date()); // o cambia esto si tienes un campo real
    document.getElementById('pedido-items').textContent = `${items.length} productos`;
    document.getElementById('pedido-observaciones').textContent = observaciones || 'Sin observaciones';
    
    
    //Cargar productos
    const listaProductos = document.getElementById('lista-productos');
    listaProductos.innerHTML = '';

    datosPedido.items.forEach(item => {
        const productoElement = document.createElement('div');
        productoElement.className = 'producto-item';
        
        productoElement.innerHTML = `
            <div class="producto-imagen" >
                <img class="imagen-lista" src="${item.producto.imagen}" alt="${item.producto.nombre}" />
            </div>
            <div class="producto-info">
                <div class="producto-nombre">${item.producto.nombre}</div>
                <div class="producto-descripcion">${item.producto.descripcion}</div>
            </div>
            <div class="producto-precio-cantidad">
                <div class="producto-cantidad">Cantidad: ${item.cantidad} ${item.producto.categoria.nombre}</div>
                <div class="producto-precio">${formatearMoneda(item.precio_unitario)} c/u</div>
                <div class="producto-precio" style="font-weight: 600; color: var(--color-button-primary);">
                    Total: ${formatearMoneda(item.subtotal)}
                </div>
            </div>
        `;

        listaProductos.appendChild(productoElement);
    });

    // Cargar resumen con subtotales individuales
    const resumenContenido = document.getElementById('resumen-contenido');
    let htmlResumen = '';

    // Agregar cada producto con su subtotal
    datosPedido.items.forEach(item => {
        htmlResumen += `
            <div class="resumen-linea">
                <span class="resumen-concepto">${item.cantidad} x ${item.productos?.nombre || 'Producto'}</span>
                <span class="resumen-valor">${formatearMoneda(item.subtotal)}</span>
            </div>
        `;
    });

    // Calcular totales
    const totalItems = datosPedido.items.reduce((sum, item) => sum + item.cantidad, 0);
    const subtotal = datosPedido.items.reduce((sum, item) => sum + item.subtotal, 0);

    // Agregar total general
    htmlResumen += `
        <div class="resumen-linea resumen-total">
            <span>Total (${totalItems} items)</span>
            <span>${formatearMoneda(subtotal)}</span>
        </div>
    `;

    resumenContenido.innerHTML = htmlResumen;
}

    

//--- FUNCIONES EXTRAS ---

// Cerrar modal
window.closeEditModal = () => {
    document.getElementById('estadoModal').style.display = 'none';
};

// Cerrar modal al hacer clic fuera
window.onclick = function (event) {
    const modal = document.getElementById('estadoModal');
    if (event.target === modal) closeEditModal();
};

function formatearMoneda(valor) {
  const numero = parseFloat(valor);
  if (isNaN(numero)) return '$0.00';
  return `$${numero.toFixed(2)}`;
}

function aplicarPrefijoTelefono(telefonoCompleto) {
  if (!telefonoCompleto) {
    document.getElementById('telefono').textContent = 'Sin teléfono';
    return;
  }

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

  const soloNumeros = telefonoSinPrefijo.replace(/\D/g, '');

  if (soloNumeros.length < 10) {
    document.getElementById('telefono').textContent = 'Número inválido';
    return;
  }

  const formateado = soloNumeros.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');

  // Asignar a los campos
  document.getElementById('cliente-telefono').textContent = (prefijoDetectado ? prefijoDetectado + ' ' : '') + formateado;
}

function formatearFechaCompleta(fechaISO) {
  const fecha = new Date(fechaISO);
  return fecha.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}