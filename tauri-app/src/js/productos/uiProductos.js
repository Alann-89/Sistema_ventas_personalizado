import { obtenerProductos } from './crudProductos';
import { mostrarErrorProductos } from './alertaProductos';

function irAEditarProducto(id) {
  console.log(`Ver detalles del producto ID: ${id}`);
  window.location.href = `./editar-eliminar.html?id=${id}`;
}

export async function gestionarProductos() {
  
  let desde = 0;
  const limite = 32;
  let cargando = false;
  let filtroActual = '';
  let finDeLista = false;

  const inputBusqueda = document.getElementById('input-busqueda');
  const contenedor = document.getElementById('contenedor-tarjetas');

  async function renderizarProductos(filtro = '', reset = false) {
  
    if (reset) {
      desde = 0;
      finDeLista = false;
      contenedor.innerHTML = '';
    }

    if (cargando || finDeLista) return;

    cargando = true;

    document.getElementById('loaderOverlay').style.display = 'flex'; // Mostrar loader

    try {
      const {data: productos, total} = await obtenerProductos(filtro, desde, limite);

      document.getElementById('loaderOverlay').style.display = 'none'; // Ocultar loader
      cargando = false;

      if (productos.length === 0 && desde === 0) {
        contenedor.innerHTML = `
            <div id="sin-resultados" class="sin-resultados"">
                <div class="sin-resultados-icon">
                 <img style="width: 70px;" src="../../recursos/iconos/icono_sin_busqueda.svg" alt="">
                </div>
                <div>No se encontraron Productos</div>
                <div style="font-size: 14px; margin-top: 8px; opacity: 0.7;">Prueba con otros términos de búsqueda o verifica que existan productos</div>
            </div>`;
        return;
      }

      if (productos.length < limite || desde + limite >= total) {
        finDeLista = true;
      }

      productos.forEach(producto => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'tarjetas';
        tarjeta.innerHTML = `
          <img class="imagen-producto" src="${producto.imagen}" alt="${producto.nombre}" />
          <b class="producto">${producto.nombre}</b>
          <div class="div-datos">
            <div class="texto-cantidad">Cantidad:</div>
            <div class="cantidad">${producto.cantidad}</div>
          </div>`;
        tarjeta.onclick = () => irAEditarProducto(producto.id);
        contenedor.appendChild(tarjeta);

      });

      desde += limite;

    } catch (error) {
      console.error('Error al obtener productos:', error.message);
      document.getElementById('loaderOverlay').style.display = 'none';
      mostrarErrorProductos();
      contenedor.innerHTML = `
      <div id="sin-resultados" class="sin-resultados"">
          <div class="sin-resultados-icon">
            <img style="width: 60px;" src="../../recursos/iconos/icono_sin_internet.svg" alt="">
          </div>
          <div>Sin conexión a internte</div>
      </div>`;
      cargando = false;
    }
  }

  const botonSubir = document.getElementById('botonSubir');

  // Detectar scroll cerca del fondo para cargar más clientes
  contenedor.addEventListener('scroll', () => {
  const scrollBottom = contenedor.scrollTop + contenedor.clientHeight;
  const scrollHeight = contenedor.scrollHeight;

  // Mostrar/ocultar botón subir
  botonSubir.style.display = contenedor.scrollTop > 300 ? 'block' : 'none';

  // Si el usuario está a menos de 100px del fondo, cargar más
  if (scrollBottom >= scrollHeight - 100) {
    renderizarProductos(filtroActual); // Cargar más
  }
  });

  // Acción del botón
  botonSubir.addEventListener('click', () => {
    contenedor.scrollTo({ top: 0, behavior: 'smooth' });
  });

  let timeout = null;
    inputBusqueda.addEventListener('input', () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        filtroActual = inputBusqueda.value;
        console.log("Filtro actual:", filtroActual);
        renderizarProductos(filtroActual, true); // true → resetear
    }, 300);
  });

  inputBusqueda.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      filtroActual = inputBusqueda.value;
      renderizarProductos(filtroActual, true);
    }
  });

  // Cargar clientes al iniciar la página
  await renderizarProductos();

  return {
    refrescar: () => renderizarProductos(inputBusqueda.value, true)
  };
}
