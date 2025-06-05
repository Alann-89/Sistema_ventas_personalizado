import { obtenerClientes } from './crudClientes.js';
import { mostrarErrorClientes } from './alertaClientes.js';

export function irAEditarCliente(id) {
    console.log(`Ver detalles del cliente ID: ${id}`);
    window.location.href = `./informacion.html?id=${id}`;
}

export async function gestionarClientes() {
    let desde = 0;
    const limite = 24;
    let cargando = false;
    let filtroActual = '';
    let finDeLista = false;

    const inputBusqueda = document.getElementById('input-busqueda');
    const contenedor = document.getElementById('contenedor-tarjetas');

    async function renderizarClientes(filtro = '', reset = false) {
        if (reset) {
            desde = 0;
            finDeLista = false;
            contenedor.innerHTML = '';
        }

        if (cargando || finDeLista) return;
        cargando = true;
        
        document.getElementById('loaderOverlay').style.display = 'flex'; // Mostrar loader

        try {
            const {data: clientes, total} = await obtenerClientes(filtro, desde, limite);

            document.getElementById('loaderOverlay').style.display = 'none'; // Ocultar loader
            cargando = false;

            if (clientes.length === 0 && desde === 0) {
                contenedor.innerHTML = `
                <div id="sin-resultados" class="sin-resultados"">
                    <div class="sin-resultados-icon">
                        <img style="width: 70px;" src="../../recursos/iconos/icono_sin_busqueda.svg" alt="">
                    </div>
                    <div>No se encontraron Clientes</div>
                    <div style="font-size: 14px; margin-top: 8px; opacity: 0.7;">Prueba con otros términos de búsqueda o verifica que existan clientes</div>
                </div>`;
                return;
            }

            if (clientes.length < limite || desde + limite >= total) {
                finDeLista = true;
            }

            clientes.forEach(cliente => {
                const tarjeta = document.createElement('div');
                tarjeta.className = 'tarjetas';
                tarjeta.innerHTML = `
                    <img class="imagen" src="../../recursos/iconos/icono_cliente.svg" />
                    <img class="imagen-hover" src="../../recursos/iconos/icono_cliente_seleccionado.svg" />
                    <b class="titulo-nombre">${cliente.nombre}</b>
                    `;
                tarjeta.onclick = () => irAEditarCliente(cliente.id);
                contenedor.appendChild(tarjeta);

            });

            desde += limite;
        } catch (error) {
            console.error('Error al obtener clientes:', error.message);
            document.getElementById('loaderOverlay').style.display = 'none';
            mostrarErrorClientes();
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
        renderizarClientes(filtroActual); // Cargar más
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
            renderizarClientes(filtroActual, true); // true → resetear
        }, 300);
    });

    inputBusqueda.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            filtroActual = inputBusqueda.value;
            renderizarClientes(filtroActual, true);
        }
    });

    // Cargar clientes al iniciar la página
    await renderizarClientes();

    return {
        refrescar: () => renderizarClientes(inputBusqueda.value, true)
    };
}
