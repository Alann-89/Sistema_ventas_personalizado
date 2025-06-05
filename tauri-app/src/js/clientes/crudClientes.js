import { supabase } from '../funciones/conexion.js';

//Busqueda de clientes
export async function obtenerClientes(filtro = '', desde = 0, limite = 24) {
  let query = supabase.from('clientes').select('*', { count: 'exact' });
  
  if (filtro.trim()) {
    query = query.ilike('nombre', `%${filtro}%`);
  }

  query = query.order('id').range(desde, desde + limite -1);

  const { data, error, count } = await query;
  if (error) throw error;
  return {data, total: count };
}

//Agrega un cliente
export async function agregarCliente(cliente) {
  const { error } = await supabase.from('clientes').insert([cliente]);
  if (error) throw new Error('Error al agregar el cliente: ' + error.message);
}

//Actualiza un cliente
export async function actualizarCliente(id, datos) {
  const { error } = await supabase.from('clientes').update(datos).eq('id', id);
  if (error) throw new Error('Error al actualizar el cliente: ' + error.message);
}

//Elimina un cliente
export async function eliminarCliente(id,direccionId) {
  const { error } = await supabase.from('clientes').delete().eq('id', id);
  if (error) throw new Error('No se pudo eliminar el cliente: ' + error.message);
  
  await supabase.from('direcciones').delete().eq('id', direccionId);
}

//Agregar una direccion
export async function insertarDireccion(direccion) {
  const { data, error } = await supabase
      .from('direcciones')
      .insert([direccion])
      .select('id')
      .single();

  if (error) throw new Error(error.message);
  console.log(error);
  return data.id;
}

//Obtenie los datos del pedido
export async function obtenerDatosPedido(pedidoId) {
  pedidoId = parseInt(pedidoId); // Asegurar que es entero

  if (!pedidoId || isNaN(pedidoId)) {
    console.error('ID de pedido inválido:', pedidoId);
    alert('ID de pedido inválido');
    return;
  }

  const { data: pedido, error: errorPedido } = await supabase
    .from('pedidos')
    .select(`
      id,
      cliente_id,
      fecha,
      estado,
      observaciones,
      cliente:clientes (
        id,
        nombre,
        correo,
        telefono,
        direccion:direcciones (
          calle,
          num,
          ciudad_delegacion,
          codigo_postal,
          estado
        )
      )
    `)
    .eq('id', pedidoId)
    .single();

  if (errorPedido || !pedido) {
    console.error('Error al obtener pedido:', errorPedido);
    alert('Error al cargar pedido.');
    return;
  }

  const { data: items, error: errorItems } = await supabase
    .from('items_pedido')
    .select(`
      id,
      producto_id,
      cantidad,
      precio_unitario,
      subtotal,
      producto:productos (
        nombre,
        descripcion,
        cantidad,
        imagen, 
        categoria: categorias(
          nombre
        )
      )
    `)
    .eq('pedido_id', pedidoId);

  if (errorItems || !items) {
    console.error('Error al obtener productos:', errorItems);
    alert('Error al cargar productos del pedido.');
    return;
  }

  return {
    ...pedido,
    cliente: pedido.cliente,
    items: items
  };
}

//actializar estado del pedido
export async function actualizarEstado(nuevoEstado, pedidoId) {
  const { data, error } = await supabase
    .from('pedidos')
    .update({ estado: nuevoEstado })
    .eq('id', pedidoId);

  if (error) throw new Error('Error al actualizar el estado: ' + error.message);
}

export async function actualizarProductosPedido(pedidoId, productos) {
    // Validar entrada
    pedidoId = parseInt(pedidoId);
    if (!pedidoId || isNaN(pedidoId)) {
        throw new Error('ID de pedido inválido');
    }

    if (!Array.isArray(productos)) {
        throw new Error('Lista de productos inválida');
    }

    try {
        // Obtener los items actuales del pedido para comparar
        const { data: itemsActuales, error: errorItems } = await supabase
            .from('items_pedido')
            .select('id, producto_id, cantidad, precio_unitario, subtotal')
            .eq('pedido_id', pedidoId);

        if (errorItems) throw errorItems;

        // Iniciar operaciones
        const operaciones = [];

        // 1. Eliminar items que ya no están en el pedido
        const itemsAEliminar = itemsActuales.filter(itemActual => 
            !productos.some(p => p.id_producto === itemActual.producto_id)
        );

        if (itemsAEliminar.length > 0) {
            operaciones.push(
                supabase.from('items_pedido')
                    .delete()
                    .in('id', itemsAEliminar.map(item => item.id))
            );
        }

        // 2. Actualizar o insertar items
        for (const producto of productos) {
            const itemExistente = itemsActuales.find(item => item.producto_id === producto.id_producto);
            
            if (itemExistente) {
                // Actualizar si la cantidad cambió
                if (parseFloat(itemExistente.cantidad) !== parseFloat(producto.cantidad)) {
                    const nuevoSubtotal = itemExistente.precio_unitario * producto.cantidad;
                    operaciones.push(
                        supabase.from('items_pedido')
                            .update({ 
                                cantidad: producto.cantidad,
                                subtotal: nuevoSubtotal
                            })
                            .eq('id', itemExistente.id)
                    );
                }
            } else {
                // Obtener precio del producto para nuevo item
                const { data: productoData, error: productoError } = await supabase
                    .from('productos')
                    .select('precio')
                    .eq('id', producto.id_producto)
                    .single();

                if (productoError) throw productoError;

                operaciones.push(
                    supabase.from('items_pedido')
                        .insert({
                            pedido_id: pedidoId,
                            producto_id: producto.id_producto,
                            cantidad: producto.cantidad,
                            precio_unitario: productoData.precio,
                            subtotal: productoData.precio * producto.cantidad
                        })
                );
            }
        }

        // Ejecutar todas las operaciones de items
        await Promise.all(operaciones);

        // 3. Calcular y actualizar totales del pedido (sin usar función PostgreSQL)
        const { data: itemsActualizados, error: errorActualizados } = await supabase
            .from('items_pedido')
            .select('subtotal')
            .eq('pedido_id', pedidoId);

        if (errorActualizados) throw errorActualizados;

        const total = itemsActualizados.reduce((sum, item) => sum + item.subtotal, 0);
        const cantidadItems = itemsActualizados.length;

        // Actualizar pedido con los nuevos totales
        const { error: errorPedido } = await supabase
            .from('pedidos')
            .update({ 
                total: total,
                cantidad_items: cantidadItems
            })
            .eq('id', pedidoId);

        if (errorPedido) throw errorPedido;

        return { success: true, total, cantidadItems };
    } catch (error) {
        console.error('Error al actualizar productos del pedido:', error);
        throw new Error('Error al actualizar productos del pedido: ' + error.message);
    }
}

export async function eliminarPedido(pedidoId) {
    pedidoId = parseInt(pedidoId);
    if (!pedidoId || isNaN(pedidoId)) {
        throw new Error('ID de pedido inválido');
    }

    // Eliminar items primero
    const { error: errorItems } = await supabase
        .from('items_pedido')
        .delete()
        .eq('pedido_id', pedidoId);

    if (errorItems) {
        throw new Error('Error al eliminar items del pedido: ' + errorItems.message);
    }

    // Luego eliminar el pedido
    const { error: errorPedido } = await supabase
        .from('pedidos')
        .delete()
        .eq('id', pedidoId);

    if (errorPedido) {
        throw new Error('Error al eliminar pedido: ' + errorPedido.message);
    }

    return true;
}

export async function descontarInventario(items) {
    if (!Array.isArray(items) || items.length === 0) {
        throw new Error('Lista de items inválida');
    }

    const operaciones = items.map(async item => {
        // Verificar stock
        const { data: producto, error: errorProducto } = await supabase
            .from('productos')
            .select('cantidad')
            .eq('id', item.producto.id)
            .single();

        if (errorProducto) throw errorProducto;
        if (parseFloat(producto.cantidad) < parseFloat(item.cantidad)) {
            throw new Error(`Stock insuficiente para ${item.producto.nombre}`);
        }

        // Actualizar stock
        const nuevaCantidad = parseFloat(producto.cantidad) - parseFloat(item.cantidad);
        const { error: errorUpdate } = await supabase
            .from('productos')
            .update({ cantidad: nuevaCantidad })
            .eq('id', item.producto.id);

        if (errorUpdate) throw errorUpdate;

        return { productoId: item.producto.id, nuevaCantidad };
    });

    try {
        return await Promise.all(operaciones);
    } catch (error) {
        console.error('Error en descuento de inventario:', error);
        throw new Error('Error al descontar inventario: ' + error.message);
    }
}