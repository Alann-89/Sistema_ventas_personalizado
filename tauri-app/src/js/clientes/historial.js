import { supabase } from '../funciones/conexion.js';
import { errorHistorial } from './alertaClientes.js';

// Variables de estado
let clienteId = null;
let desde = 0;
const LIMITE = 24;
let cargando = false;
let finDeCompras = false;
let filtroActual = '';
let filtroMesActual = '';
let timeoutBusqueda = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Obtener ID del cliente desde la URL
    const params = new URLSearchParams(window.location.search);
    clienteId = params.get('id');
    console.log(clienteId);
    
    if (!clienteId) {
        console.error('No se proporcionó ID de cliente');
        return;
    }

    // Configurar eventos
    configurarEventos();
    
    // Cargar datos iniciales
    await cargarCompras(true);
});

function configurarEventos() {
    const inputBusqueda = document.getElementById('buscador');
    const selectMes = document.getElementById('filtro-mes');
    const botonLimpiar = document.getElementById('limpiar-filtros');
    const tbody = document.getElementById('compras-tbody');

    // Evento de búsqueda con debounce
    inputBusqueda.addEventListener('input', (e) => {
        clearTimeout(timeoutBusqueda);
        timeoutBusqueda = setTimeout(() => {
            filtroActual = e.target.value.trim().toLowerCase();
            console.log('Buscando:', filtroActual);
            cargarCompras(true);
        }, 300);
    });

    // Evento de cambio de mes
    selectMes.addEventListener('change', (e) => {
        filtroMesActual = e.target.value;
        console.log('Filtrando por mes:', filtroMesActual);
        cargarCompras(true);
    });

    // Evento para limpiar filtros
    botonLimpiar.addEventListener('click', () => {
        inputBusqueda.value = '';
        selectMes.value = '';
        filtroActual = '';
        filtroMesActual = '';
        cargarCompras(true);
    });

    // Scroll infinito en el tbody
    tbody.addEventListener('scroll', () => {
        const { scrollTop, clientHeight, scrollHeight } = tbody;
        if (scrollTop + clientHeight >= scrollHeight - 100 && !cargando && !finDeCompras) {
            cargarCompras();
        }
    });
}

async function cargarCompras(reset = false) {
    if (reset) {
        desde = 0;
        finDeCompras = false;
        document.getElementById('compras-tbody').innerHTML = '';
    }

    if (cargando || finDeCompras) return;
    cargando = true;

    try {
        // Construir consulta a Supabase
        let query = supabase
            .from('pedidos')
            .select(`
                id,
                fecha,
                estado,
                items_pedido (
                    cantidad,
                    precio_unitario,
                    subtotal,
                    productos (
                        nombre
                    )
                )
            `, { count: 'exact' })
            .eq('cliente_id', clienteId)
            //.eq('estado', 'completado')
            .order('fecha', { ascending: false })
            .range(desde, desde + LIMITE - 1);

        // Aplicar filtro de fecha si existe
        if (filtroMesActual) {
            const [año, mes] = filtroMesActual.split('-');
            const desdeFecha = `${año}-${mes}-01`;
            const hastaFecha = new Date(año, mes, 0).toISOString().split('T')[0]; // Último día del mes
            query = query.gte('fecha', desdeFecha).lte('fecha', hastaFecha);
        }

        const { data: pedidos, error, count } = await query;

        if (error) throw error;

        // Filtrar resultados por texto de búsqueda
        const resultadosFiltrados = pedidos.filter(pedido => {
            const productos = pedido.items_pedido
                .map(i => i.productos?.nombre || '')
                .join(', ')
                .toLowerCase();
                
            return !filtroActual || 
            pedido.id.toString().includes(filtroActual) || 
            productos.includes(filtroActual);
        });

        // Manejar estados vacíos
        if (reset) {
            const sinHistorial = pedidos.length === 0 && !filtroActual && !filtroMesActual;
            const sinCoincidencias = resultadosFiltrados.length === 0 && (filtroActual || filtroMesActual);

            document.getElementById('emptyState').style.display = sinHistorial ? 'block' : 'none';
            document.getElementById('sin-resultados').style.display = sinCoincidencias ? 'block' : 'none';

            if (sinHistorial || sinCoincidencias) {
                cargando = false;
                return;
            }
        }

        // Renderizar resultados
        renderizarCompras(resultadosFiltrados);

        // Actualizar paginación
        desde += resultadosFiltrados.length;
        finDeCompras = pedidos.length < LIMITE;

    } catch (error) {
        console.error('Error al cargar compras:', error);
        errorHistorial(error);
        mostrarError();
    } finally {
        cargando = false;
      
    }
}

function renderizarCompras(pedidos) {
    const tbody = document.getElementById('compras-tbody');
    
    pedidos.forEach(pedido => {
        const fechaObj = new Date(pedido.fecha);
        const fechaFormateada = fechaObj.toLocaleDateString('es-MX', {
            day: 'numeric', 
            month: 'long', 
            year: 'numeric'
        });

        const productos = pedido.items_pedido
            .map(i => i.productos?.nombre || '')
            .join(', ');
            
        const total = pedido.items_pedido
            .reduce((sum, item) => sum + item.subtotal, 0);
            
        const cantidadTotal = pedido.items_pedido
            .reduce((sum, item) => sum + item.cantidad, 0);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="compra-fecha">${fechaFormateada}</div>
                <div class="compra-orden">Orden #${pedido.id}</div>
                <div class="compra-productos">${productos}</div>
            </td>
            <td class="compra-cantidad">${cantidadTotal} productos</td>
            <td class="compra-total">$${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
        `;
        console.log(pedido.id);
        tr.addEventListener('click', () => irADetalles(pedido.id));
        tbody.appendChild(tr);
    });
}

function mostrarError() {
    const tbody = document.getElementById('compras-tbody');
    tbody.innerHTML = `
        <tr>
            <td colspan="3">
                <div class="sin-resultados">
                    <div class="sin-resultados-icon">
                        <img src="../../recursos/iconos/icono_sin_internet.svg" alt="Error" style="width: 60px;">
                    </div>
                    <div>Error al cargar el historial</div>
                </div>
            </td>
        </tr>
    `;
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('sin-resultados').style.display = 'none';
    document.querySelector('.tabla-container').style.display = 'block';
}

function irADetalles(id) {
    console.log(`Ver detalles del cliente ID: ${id}`);
    window.location.href = `./detalles-compra.html?id=${id}`;
}