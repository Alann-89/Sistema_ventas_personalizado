import { supabase } from '../funciones/conexion.js';

//Busqueda de clientes
export async function obtenerProveedores(filtro = '', desde = 0, limite = 24) {
  let query = supabase.from('proveedores').select('*', { count: 'exact' });
  
  if (filtro.trim()) {
    query = query.ilike('nombre', `%${filtro}%`);
  }

  query = query.order('id').range(desde, desde + limite -1);

  const { data, error, count } = await query;
  if (error) throw error;
  return {data, total: count };
}

//Agrega un cliente
export async function agregarProveedores(cliente) {
  const { error } = await supabase.from('proveedores').insert([cliente]);
  if (error) throw new Error('Error al agregar el cliente: ' + error.message);
}

//Actualiza un cliente
export async function actualizarProveedores(id, datos) {
  const { error } = await supabase.from('proveedores').update(datos).eq('id', id);
  if (error) throw new Error('Error al actualizar el cliente: ' + error.message);
}

//Elimina un cliente
export async function eliminarProveedores(id,direccionId) {
  const { error } = await supabase.from('proveedores').delete().eq('id', id);
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
  return data.id;
}

