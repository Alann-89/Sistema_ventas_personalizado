import { obtenerDatosPedido, actualizarEstado, actualizarProductosPedido, eliminarPedido, descontarInventario } from "./crudClientes";
import {errorObtencionPedido, toastExito, showAlert} from "../funciones/alertas"

const estadosPedido = {
    pendiente: `<img src="../../recursos/iconos/icono_estado_pendiente.svg" class="icono-estado" alt="Pendiente"> Pendiente`,
    proceso: `<img src="../../recursos/iconos/icono_estado_proceso.svg" class="icono-estado" alt="En proceso"> En proceso`,
    completado: `<img src="../../recursos/iconos/icono_estado_completado.svg" class="icono-estado" alt="Completado"> Completado`,
    cancelado: `<img src="../../recursos/iconos/icono_eliminar.svg" class="icono-estado" alt="Cancelado"> Cancelado`,
};

let pedidoId = null;
let datosPedido = null;
let editandoCantidad = false;

document.addEventListener('DOMContentLoaded', async function () {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    pedidoId = id;

    try {
        datosPedido = await obtenerDatosPedido(pedidoId);
        if (datosPedido) {
            cargarDatosPedido(datosPedido);
            configurarInteracciones();
        } else {
            errorObtencionPedido('No se pudo cargar el pedido');
        }
    } catch (error) {
        errorObtencionPedido(error);
    }

    document.getElementById('btn-imprimir').addEventListener('click', () => window.print());
    document.querySelector('.boton-atras').addEventListener('click', () => window.history.back());
});

function configurarInteracciones() {
    // Referencias
    const modalEstado = document.getElementById('estadoModal');
    const selectEstado = document.getElementById('selectEstado');
    const formEstado = document.getElementById('estadoForm');
    
    // Abrir modal al hacer clic en editar
    document.getElementById('btn-editar').addEventListener('click', () => {
        if (datosPedido.estado === 'completado') {
            showAlert({
                type: 'info',
                title: 'Pedido completado',
                message: 'No se puede modificar el estado de un pedido completado.',
                buttons: [{ text: 'Entendido', type: 'primary' }]
            });
            return;
        }
        
        if (datosPedido?.estado) {
            selectEstado.value = datosPedido.estado;
        }
        modalEstado.style.display = 'block';
    });

    // Guardar cambio de estado
    formEstado.addEventListener('submit', async function (e) {
        e.preventDefault();
        const nuevoEstado = selectEstado.value;

        if (nuevoEstado && estadosPedido[nuevoEstado]) {
            try {
                // Si el nuevo estado es completado, descontar inventario
                if (nuevoEstado === 'completado') {
                    await descontarInventario(datosPedido.items);
                }
                
                await actualizarEstado(nuevoEstado, pedidoId);
                datosPedido.estado = nuevoEstado;
                cargarDatosPedido(datosPedido);
                closeEditModal();
                
                toastExito('Estado guardado', 'Estado actualizado correctamente.');
                
                // Si se completó, ocultar botones de edición
                if (nuevoEstado === 'completado') {
                    document.getElementById('btn-editar').style.display = 'none';
                    document.getElementById('btn-editar-productos').style.display = 'none';
                }
            } catch (err) {
                console.error('Error:', err);
                showAlert({
                    type: 'error',
                    title: 'Error',
                    message: err.message || 'Ocurrió un error al actualizar el estado',
                    buttons: [{ text: 'Entendido', type: 'primary' }]
                });
            }
        }
    });
    
    // Botón para editar productos
    const btnEditarProductos = document.createElement('button');
    btnEditarProductos.id = 'btn-editar-productos';
    btnEditarProductos.className = 'boton-secundario';
    btnEditarProductos.innerHTML = '<i class="fas fa-edit"></i> Editar productos';
    btnEditarProductos.addEventListener('click', toggleEdicionProductos);
    
    const contenedorBotones = document.querySelector('.contenedor-botones');
    contenedorBotones.insertBefore(btnEditarProductos, document.getElementById('btn-editar'));
}

function toggleEdicionProductos() {
    editandoCantidad = !editandoCantidad;
    
    if (editandoCantidad) {
        this.innerHTML = '<i class="fas fa-save"></i> Guardar cambios';
        this.classList.add('boton-aceptar');
        habilitarEdicionProductos();
    } else {
        this.innerHTML = '<i class="fas fa-edit"></i> Editar productos';
        this.classList.remove('boton-aceptar');
        deshabilitarEdicionProductos();
        guardarCambiosProductos();
    }
}

function habilitarEdicionProductos() {
    const productos = document.querySelectorAll('.producto-item');
    
    productos.forEach(producto => {
        const cantidadDiv = producto.querySelector('.producto-cantidad');
        const cantidadActual = cantidadDiv.textContent.replace('Cantidad: ', '').split(' ')[0];
        
        // Crear input para editar cantidad
        const inputCantidad = document.createElement('input');
        inputCantidad.type = 'number';
        inputCantidad.min = '1';
        inputCantidad.value = cantidadActual;
        inputCantidad.className = 'input-cantidad';
        
        // Reemplazar el texto con el input
        const unidad = cantidadDiv.textContent.split(' ')[2]; // Obtener la unidad (kg, pieza, etc.)
        cantidadDiv.innerHTML = '';
        cantidadDiv.appendChild(inputCantidad);
        cantidadDiv.appendChild(document.createTextNode(` ${unidad}`));
        
        // Agregar botón para eliminar producto
        const btnEliminar = document.createElement('button');
        btnEliminar.className = 'btn-eliminar-producto';
        btnEliminar.innerHTML = '<i class="fas fa-trash"></i>';
        btnEliminar.addEventListener('click', () => eliminarProductoDelPedido(producto.dataset.idProducto));
        
        const contenedorPrecio = producto.querySelector('.producto-precio-cantidad');
        contenedorPrecio.appendChild(btnEliminar);
    });
}

function deshabilitarEdicionProductos() {
    const productos = document.querySelectorAll('.producto-item');
    
    productos.forEach(producto => {
        const inputCantidad = producto.querySelector('.input-cantidad');
        if (inputCantidad) {
            const cantidad = inputCantidad.value;
            const unidad = inputCantidad.nextSibling.textContent.trim();
            const cantidadDiv = producto.querySelector('.producto-cantidad');
            
            cantidadDiv.innerHTML = `Cantidad: ${cantidad} ${unidad}`;
            
            // Eliminar botón de eliminar
            const btnEliminar = producto.querySelector('.btn-eliminar-producto');
            if (btnEliminar) btnEliminar.remove();
        }
    });
}

async function guardarCambiosProductos() {
    const productosActualizados = [];
    const productos = document.querySelectorAll('.producto-item');
    
    productos.forEach(producto => {
        const idProducto = producto.dataset.idProducto;
        const cantidad = producto.querySelector('.input-cantidad')?.value || 
                        producto.querySelector('.producto-cantidad').textContent.replace('Cantidad: ', '').split(' ')[0];
        
        productosActualizados.push({
            id_producto: idProducto,
            cantidad: parseFloat(cantidad)
        });
    });
    
    try {
        // Verificar si quedan productos
        if (productosActualizados.length === 0) {
            await eliminarPedidoCompleto();
            return;
        }
        
        // Actualizar en la base de datos
        await actualizarProductosPedido(pedidoId, productosActualizados);
        
        // Recargar datos del pedido
        datosPedido = await obtenerDatosPedido(pedidoId);
        cargarDatosPedido(datosPedido);
        
        toastExito('Productos actualizados', 'Los cambios en los productos se guardaron correctamente.');
    } catch (error) {
        console.error('Error al guardar cambios:', error);
        showAlert({
            type: 'error',
            title: 'Error',
            message: 'No se pudieron guardar los cambios en los productos',
            buttons: [{ text: 'Entendido', type: 'primary' }]
        });
    }
}

async function eliminarProductoDelPedido(idProducto) {
    try {
        await showAlert({
            type: 'warning',
            title: 'Eliminar producto',
            message: '¿Estás seguro de que quieres eliminar este producto del pedido?',
            buttons: [
                { text: 'Cancelar', type: 'secondary' },
                { 
                    text: 'Eliminar', 
                    type: 'danger', 
                    action: async () => {
                        // Filtrar el producto a eliminar
                        const nuevosItems = datosPedido.items.filter(item => item.producto.id !== idProducto);
                        
                        // Si no quedan productos, eliminar el pedido
                        if (nuevosItems.length === 0) {
                            await eliminarPedidoCompleto();
                            return;
                        }
                        
                        // Actualizar en la base de datos
                        await actualizarProductosPedido(
                            pedidoId, 
                            nuevosItems.map(item => ({
                                id_producto: item.producto.id,
                                cantidad: item.cantidad
                            }))
                        );
                        
                        // Recargar datos
                        datosPedido = await obtenerDatosPedido(pedidoId);
                        cargarDatosPedido(datosPedido);
                        
                        toastExito('Producto eliminado', 'El producto fue removido del pedido.');
                    }
                }
            ]
        });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        showAlert({
            type: 'error',
            title: 'Error',
            message: 'No se pudo eliminar el producto',
            buttons: [{ text: 'Entendido', type: 'primary' }]
        });
    }
}

async function eliminarPedidoCompleto() {
    try {
        await showAlert({
            type: 'warning',
            title: 'Eliminar pedido',
            message: 'El pedido no tiene productos. ¿Deseas eliminarlo completamente?',
            buttons: [
                { text: 'Cancelar', type: 'secondary' },
                { 
                    text: 'Eliminar', 
                    type: 'danger', 
                    action: async () => {
                        await eliminarPedido(pedidoId);
                        showAlert({
                            type: 'success',
                            title: 'Pedido eliminado',
                            message: 'El pedido ha sido eliminado correctamente.',
                            buttons: [{
                                text: 'Aceptar',
                                type: 'primary',
                                action: () => window.location.href = './lista-pedidos.html'
                            }]
                        });
                    }
                }
            ]
        });
    } catch (error) {
        console.error('Error al eliminar pedido:', error);
        showAlert({
            type: 'error',
            title: 'Error',
            message: 'No se pudo eliminar el pedido',
            buttons: [{ text: 'Entendido', type: 'primary' }]
        });
    }
}

function cargarDatosPedido(datosPedido) {
    const { id, cliente, fecha, estado, observaciones, items } = datosPedido;
    const direccion = cliente.direccion || {};

    // Estado del pedido
    document.getElementById('pedido').textContent = 'Pedido #' + id;
    const estadoDiv = document.getElementById('estado-pedido');

    // Limpia clases previas y aplica nuevas
    estadoDiv.className = '';
    estadoDiv.innerHTML = estadosPedido[estado] || estado;
    if (estado) estadoDiv.classList.add('estado-compra', `estado-${estado}`);

    // Ocultar/mostrar botones según estado
    if (estado === 'completado') {
        document.getElementById('btn-editar').style.display = 'none';
        document.getElementById('btn-editar-productos').style.display = 'none';
    } else {
        document.getElementById('btn-editar').style.display = 'inline-block';
        document.getElementById('btn-editar-productos').style.display = 'inline-block';
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

    // Cargar productos
    const listaProductos = document.getElementById('lista-productos');
    listaProductos.innerHTML = '';

    datosPedido.items.forEach(item => {
        const productoElement = document.createElement('div');
        productoElement.className = 'producto-item';
        productoElement.dataset.idProducto = item.producto.id;
        
        productoElement.innerHTML = `
            <div class="producto-imagen">
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