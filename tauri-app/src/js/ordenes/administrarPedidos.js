import { supabase } from '../funciones/conexion.js';
import { mostrarErrorProcesar } from './alertaOrdenes.js'
import { showAlert, toastError, toastExito } from '../funciones/alertas';

// Función para cargar pedidos pendientes
async function cargarPedidosPendientes() {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        id,
        cliente_id,
        fecha,
        estado,
        observaciones,
        clientes(nombre),
        items_pedido(
          producto_id,
          cantidad,
          productos(nombre, cantidad)
        )
      `)
      .eq('estado', 'pendiente')
      .order('fecha', { ascending: true });

    if (error) throw error;

    const tablaPedidos = document.getElementById('tablaPedidos');
    tablaPedidos.innerHTML = '';

    data.forEach(pedido => {
      const cliente = pedido.clientes ? pedido.clientes.nombre : 'Cliente no especificado';
      const fecha = new Date(pedido.fecha).toLocaleDateString();
      const diasPasados = Math.floor((new Date() - new Date(pedido.fecha)) / (1000 * 60 * 60 * 24));
      
      // Calcular estado del pedido
      let faltantes = 0;
      let totalItems = 0;
      pedido.items_pedido.forEach(item => {
        totalItems += item.cantidad;
        if (item.productos && item.cantidad > item.productos.cantidad) {
          faltantes++;
        }
      });

      const estado = faltantes > 0 ? 'Faltantes' : 'Completo';
      const estadoClass = faltantes > 0 ? 'estado-faltante' : 'estado-completo';

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          <div class="cliente-nombre">${cliente}</div>
          <div class="fecha-pedido">Pedido #${pedido.id.toString().padStart(3, '0')}</div>
        </td>
        <td>
          <div>${fecha}</div>
          <div class="fecha-pedido">Hace ${diasPasados} días</div>
        </td>
        <td>
          <div class="cantidad-badge cantidad-necesaria">${totalItems} items</div>
        </td>
        <td>
          <span class="estado-badge ${estadoClass}">${estado}</span>
        </td>
        <td>
          ${faltantes > 0 ? 
            `<button class="btn btn-ver" data-pedido-id="${pedido.id}">Ver Detalles</button>` : 
            `<button class="btn btn-completar" data-pedido-id="${pedido.id}">Completar Pedido</button>`}
        </td>
      `;
      tablaPedidos.appendChild(row);

      
    });

    // Asignar event listeners después de renderizar
    document.querySelectorAll('.btn-ver').forEach(btn => {
        btn.addEventListener('click', function() {
            const pedidoId = parseInt(this.getAttribute('data-pedido-id'));
            verDetallesPedido(pedidoId);
        });
    });

    document.querySelectorAll('.btn-completar').forEach(btn => {
        btn.addEventListener('click', function() {
            const pedidoId = parseInt(this.getAttribute('data-pedido-id'));
            completarPedido(pedidoId);
        });
    });

    // Actualizar contador de pedidos
    document.getElementById('totalPedidos').textContent = data.length;
    document.getElementById('contadorPedidos').textContent = data.length;

  } catch (error) {
    mostrarErrorProcesar(error);
  }
}

// Función para completar un pedido
async function completarPedido(pedidoId) {
  try {
        showAlert({
            type: 'warning',
            title: 'Marcar como completado',
            message: '¿Estás seguro de que deseas marcar este pedido como completado?',
            buttons: [
            { 
                text: 'Aceptar', 
                type: 'primary', 
                action: async () => {
                try {
                    // Actualizar el estado del pedido en Supabase
                    const { error } = await supabase
                    .from('pedidos')
                    .update({ estado: 'completado' })
                    .eq('id', pedidoId);

                    if (error) throw error;

                    // Obtener los items del pedido
                    const { data: items, error: itemsError } = await supabase
                    .from('items_pedido')
                    .select('producto_id, cantidad')
                    .eq('pedido_id', pedidoId);

                    if (itemsError) throw itemsError;

                  // Actualizar inventario para cada producto
                  for (const item of items) {
                    // 1. Obtener cantidad actual del producto
                    const { data: producto, error: productoError } = await supabase
                      .from('productos')
                      .select('cantidad')
                      .eq('id', item.producto_id)
                      .single(); // usamos .single() para obtener directamente el objeto

                    if (productoError) throw productoError;

                    const nuevaCantidad = producto.cantidad - item.cantidad;

                    // 2. Actualizar cantidad del producto
                    const { error: updateError } = await supabase
                      .from('productos')
                      .update({ cantidad: nuevaCantidad })
                      .eq('id', item.producto_id);

                    if (updateError) throw updateError;
                  }

                    // Recargar tablas
                    cargarPedidosPendientes();
                    cargarEstadoInventario();

                    toastExito('Pedido completado con éxito');
                } catch (error) {
                    console.error('Error al completar pedido:', error);
                    toastError('Error al completar el pedido');
                }
                }
            },
            { 
                text: 'Cancelar', 
                type: 'secondary', 
                action: () => {} 
            }
            ]
        });
    } catch (error) {
    console.error('Error al mostrar alerta:', error);
    }
}


// Función para cargar estado del inventario
async function cargarEstadoInventario() {
  try {
    // Obtener productos y sus inventarios
    const { data: productosData, error: productosError } = await supabase
      .from('productos')
      .select('id, nombre, cantidad');
    
    if (productosError) throw productosError;

    // Obtener cantidades necesarias de pedidos pendientes
    // Paso 1: Obtener los IDs de los pedidos pendientes
    const { data: pedidosPendientes, error: errorPedidos } = await supabase
    .from('pedidos')
    .select('id')
    .eq('estado', 'pendiente');

    if (errorPedidos) throw errorPedidos;

    const pedidoIds = pedidosPendientes.map(p => p.id);

    // Paso 2: Obtener items_pedido usando los IDs
    const { data: pedidosData, error: pedidosError } = await supabase
    .from('items_pedido')
    .select('producto_id, cantidad')
    .in('pedido_id', pedidoIds);

    if (pedidosError) throw pedidosError;

    // Calcular necesidades por producto
    const necesidades = {};
    pedidosData.forEach(item => {
      if (!necesidades[item.producto_id]) {
        necesidades[item.producto_id] = 0;
      }
      necesidades[item.producto_id] += item.cantidad;
    });

    // Mostrar en la tabla
    const tablaInventario = document.getElementById('tablaInventario');
    tablaInventario.innerHTML = '';

    let productosCompletos = 0;
    let productosFaltantes = 0;

    productosData.forEach(producto => {
      const necesario = necesidades[producto.id] || 0;
      const disponible = producto.cantidad || 0;
      const faltante = Math.max(0, necesario - disponible);
      
      const estado = faltante > 0 ? 'Faltante' : 'Completo';
      const estadoClass = faltante > 0 ? 'estado-faltante' : 'estado-completo';

      if (estado === 'Completo' && necesario > 0) productosCompletos++;
      if (estado === 'Faltante') productosFaltantes++;

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          <div class="producto-nombre">${producto.nombre}</div>
        </td>
        <td>
          <span class="cantidad-badge cantidad-necesaria">${necesario}</span>
        </td>
        <td>
          <span class="cantidad-badge cantidad-disponible">${disponible}</span>
        </td>
        <td>
          <span class="cantidad-badge ${faltante > 0 ? 'cantidad-faltante' : 'cantidad-disponible'}">${faltante}</span>
        </td>
        <td>
          <span class="estado-badge ${estadoClass}">${estado}</span>
        </td>
      `;
      tablaInventario.appendChild(row);
    });

    // Actualizar estadísticas
    document.getElementById('productosCompletos').textContent = productosCompletos;
    document.getElementById('productosFaltantes').textContent = productosFaltantes;
    document.getElementById('contadorInventario').textContent = productosData.length;

  } catch (error) {
    console.error('Error al cargar inventario:', error);
  }
}

// Función simplificada para ver detalles del pedido (usando alert)
function verDetallesPedido(id) {
  console.log(`Ver detalles del producto ID: ${id}`);
  window.location.href = `../clientes/detalles-compra.html?id=${id}`;
}

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', function() {
  cargarPedidosPendientes();
  cargarEstadoInventario();
});