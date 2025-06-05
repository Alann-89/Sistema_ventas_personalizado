import { supabase } from '../funciones/conexion.js';

//Busqueda de productos
export async function obtenerProductos(filtro = '', desde = 0, limite = 32) {
  let query = supabase.from('productos').select('*', { count: 'exact' });

  if (filtro.trim()) {
    query = query.ilike('nombre', `%${filtro}%`);
  }

  query = query.order('id').range(desde, desde + limite -1);

  const { data, error, count } = await query;
  if (error) throw error;
  return {data, total: count};
}

//Carga de categorias
export async function cargarCategorias(selectCategoria) {
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Error al cargar categorías:', error.message);
    return;
  }

  data.forEach(categoria => {
    const option = document.createElement('option');
    option.value = categoria.id;
    option.textContent = categoria.nombre;
    selectCategoria.appendChild(option);
  });
}


//Agrega un producto
export async function agregarProducto(producto) {
  const { error } = await supabase.from('productos').insert([producto]);
  if (error) throw new Error('Error al agregar producto: ' + error.message);
}

//Actualiza un producto
export async function actualizarProducto(id, datos) {
  const { error } = await supabase.from('productos').update(datos).eq('id', id);
  if (error) throw new Error('Error al actualizar producto: ' + error.message);
}

//Elimina un producto
export async function eliminarProducto(id) {
  const { error } = await supabase.from('productos').delete().eq('id', id);
  if (error) throw new Error('No se pudo eliminar el producto: ' + error.message);
}
