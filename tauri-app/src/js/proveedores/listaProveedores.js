import { supabase } from '../funciones/conexion.js';
import { toastExito, toastAdvertencia, toastError } from '../funciones/alertas.js';
import { mostrarErrorProcesar, mostrarConfirmacionEliminarProducto } from './alertaProveedores.js'

export async function gestionarPreciosProveedores() {
    const params = new URLSearchParams(window.location.search);
    const proveedorId = params.get('id');
    
    if (!proveedorId) {
        console.error('No se proporcionó ID de proveedor');
        return;
    }

    // Elementos del DOM
    const tbody = document.getElementById('productos-tbody');
    const emptyState = document.getElementById('emptyState');
    const sinResultados = document.getElementById('sin-resultados');
    const busquedaInput = document.getElementById('buscador');
    let preciosMap = new Map();

    // Variables de estado
    let desde = 0;
    const limite = 24;
    let cargando = false;
    let finDeLista = false;
    let filtroActual = '';

    async function cargarPrecios(reset = false) {
        if (reset) {
            desde = 0;
            finDeLista = false;
            tbody.innerHTML = '';
            emptyState.style.display = 'none';
            sinResultados.style.display = 'none';
        }

        if (cargando || finDeLista) return;
        cargando = true;

        try {
            let query = supabase
                .from('precios_proveedores')
                .select(`
                    id,
                    precio_unitario,
                    disponible,
                    productos!inner(
                        nombre
                    )
                `, { count: 'exact' })
                .eq('proveedor_id', proveedorId)
                .order('disponible', { ascending: false })
                .order('fecha_actualizacion', { ascending: false })
                .range(desde, desde + limite - 1);

            if (filtroActual.trim() !== '') {
                query = query.ilike('productos.nombre', `%${filtroActual}%`);
            }

            const { data: precios, error, count } = await query;

            if (error) throw error;

            cargando = false;

            // Manejar estados vacíos
            if (reset && precios.length === 0) {
                if (filtroActual.trim() !== '') {
                    sinResultados.style.display = 'flex';
                } else {
                    emptyState.style.display = 'flex';
                }
                return;
            }

            // Renderizar precios
            precios.forEach(item => {
                const tr = document.createElement('tr');
                tr.dataset.id = item.id;
                const nombreProducto = item.productos?.nombre || 'Sin nombre';
                const precio = item.precio_unitario.toFixed(2);
                const disponible = item.disponible;

                tr.innerHTML = `
                    <td>
                        <div class="producto-nombre-lista producto-nombre">${nombreProducto}</div>
                    </td>
                    <td>
                        <span class="producto-precio">$${precio}</span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-edit" onclick="editarPrecio(this)">
                                <img class="icono" alt="" src="../../recursos/iconos/icono_editar.svg">
                                <span>Editar</span>
                            </button>
                            <button class="btn-delete" onclick="eliminarProducto(this)">
                                <img class="icono" alt="" src="../../recursos/iconos/icono_basura.svg">
                                <span>Eliminar</span>
                            </button>
                        </div>
                    </td>
                    <td>
                        <div class="disponibilidad-container">
                            <label class="custom-checkbox">
                                <input type="checkbox" ${disponible ? 'checked' : ''} onchange="cambiarDisponibilidad(this)">
                                <span class="checkmark"></span>
                            </label>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);

                // Configurar eventos después de crear la fila
                configurarEventosFila(tr, item.id);
            });

            // Actualizar paginación
            desde += precios.length;
            if (precios.length < limite || desde >= count) {
                finDeLista = true;
            }

        } catch (error) {
            console.error('Error al cargar precios:', error.message);
            
            // Mostrar estado de error
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="error-message">
                        <div class="sin-resultados">
                            <div class="sin-resultados-icon">
                                <img style="width: 60px;" src="../../recursos/iconos/icono_sin_internet.svg" alt="">
                            </div>
                            <div>Error al cargar los precios</div>
                        </div>
                    </td>
                </tr>
            `;
            cargando = false;
        }
    }

    function irAgregarProductosLista(id) {
        console.log(`Ver detalles del proveedor ID: ${id}`);
        window.location.href = `./agregar-Productos-lista.html?id=${id}`;
    }

    const btnAgregar = document.getElementById("agregarLista");
    btnAgregar.addEventListener('click', () => irAgregarProductosLista(proveedorId)); 

    // Configurar eventos para cada fila
    function configurarEventosFila(row, precioId) {
        const btnEdit = row.querySelector('.btn-edit');
        const btnDelete = row.querySelector('.btn-delete');
        const checkbox = row.querySelector('input[type="checkbox"]');
        
        btnEdit.addEventListener('click', () => editarPrecio(row, precioId));
        btnDelete.addEventListener('click', () => eliminarProducto(row, precioId));
        checkbox.addEventListener('change', () => cambiarDisponibilidad(row, precioId));
    }

    // Función para editar precio
    async function editarPrecio(row, precioId) {
        const precioCell = row.querySelector('td:nth-child(2)');
        const precioSpan = precioCell.querySelector('.producto-precio');
        const opcionesContainer = row.querySelector('.action-buttons');
        
        // Marcar fila como en edición
        row.classList.add('editando');
        
        // Obtener precio actual sin el símbolo $
        const precioActual = precioSpan.textContent.replace('$', '');
        
        // Crear input para edición
        const input = document.createElement('input');
        input.type = 'number';
        input.step = '0.01';
        input.min = '0';
        input.value = precioActual;
        input.className = 'precio-input';
        
        // Reemplazar span con input
        precioCell.innerHTML = '';
        precioCell.appendChild(input);
        input.focus();
        
        // Cambiar botones
        opcionesContainer.innerHTML = `
            <button class="btn-save">
                <img class="icono" alt="" src="../../recursos/iconos/icono_guardar.svg">
                <span>Guardar</span>
            </button>
            <button class="btn-cancel">
                <span class="close" >&times;</span>
                <span>Cancelar</span>
            </button>
        `;
        
        // Configurar eventos de los nuevos botones
        opcionesContainer.querySelector('.btn-save').addEventListener('click', () => guardarPrecio(row, precioId));
        opcionesContainer.querySelector('.btn-cancel').addEventListener('click', () => cancelarEdicion(row, precioActual));
    }
    
    // Función para guardar precio en Supabase
    async function guardarPrecio(row, precioId) {
        const precioCell = row.querySelector('td:nth-child(2)');
        const input = precioCell.querySelector('.precio-input');
        
        // Validar precio
        const nuevoPrecio = parseFloat(input.value);
        if (isNaN(nuevoPrecio)) {
            toastAdvertencia('Datos invalidos', 'Por favor ingresa un precio válido');
            return;
        }
        
        try {
            // Actualizar en Supabase
            const { error } = await supabase
                .from('precios_proveedores')
                .update({ 
                    precio_unitario: nuevoPrecio,
                    fecha_actualizacion: new Date().toISOString()
                })
                .eq('id', precioId);
            
            if (error) throw error;
            
            // Actualizar UI
            row.classList.remove('editando');
            precioCell.innerHTML = `<span class="producto-precio">$${nuevoPrecio.toFixed(2)}</span>`;
            
            // Restaurar botones originales
            const opcionesContainer = row.querySelector('.action-buttons');
            opcionesContainer.innerHTML = `
                <button class="btn-edit">
                    <img class="icono" alt="" src="../../recursos/iconos/icono_editar.svg">
                    <span>Editar</span>
                </button>
                <button class="btn-delete">
                    <img class="icono" alt="" src="../../recursos/iconos/icono_basura.svg">
                    <span>Eliminar</span>
                </button>
            `;
            
            // Reconfigurar eventos
            configurarEventosFila(row, precioId);
            toastExito('Datos actualizados', 'Se actualizo correctamenente el precio.');
            
        } catch (error) {
            console.error('Error al guardar precio:', error.message);
            mostrarErrorProcesar(error.message);
        }
    }
    
    // Función para cancelar edición
    function cancelarEdicion(row, precioOriginal) {
        const precioCell = row.querySelector('td:nth-child(2)');
        const opcionesContainer = row.querySelector('.action-buttons');
        
        // Quitar estado de edición
        row.classList.remove('editando');
        
        // Restaurar precio original
        precioCell.innerHTML = `<span class="producto-precio">$${precioOriginal}</span>`;
        
        // Restaurar botones originales
        opcionesContainer.innerHTML = `
            <button class="btn-edit">
                <img class="icono" alt="" src="../../recursos/iconos/icono_editar.svg">
                <span>Editar</span>
            </button>
            <button class="btn-delete">
                <img class="icono" alt="" src="../../recursos/iconos/icono_basura.svg">
                <span>Eliminar</span>
            </button>
        `;
        
        // Reconfigurar eventos
        const precioId = row.dataset.id;
        configurarEventosFila(row, precioId);
    }
    
    // Función para eliminar producto
    async function eliminarProducto(row, precioId) {
        const nombreProducto = row.querySelector('.producto-nombre').textContent;

        mostrarConfirmacionEliminarProducto(nombreProducto, async () => {
            try {
                const { error } = await supabase
                .from('precios_proveedores')
                .delete()
                .eq('id', precioId);
                
                if (error) throw error;
                
                // Eliminar de la UI
                row.remove();
                preciosMap.delete(precioId);

                showToast({
                    type: 'success',
                    title: 'Producto eliminado',
                    message: 'El producto se eliminó de la lista.'
                });

            } catch (error) {
                showToast({
                    type: 'error',
                    title: 'Error al eliminar producto',
                    message: error.message
                });
            }
        });
    }
    
    // Función para cambiar disponibilidad
    async function cambiarDisponibilidad(row, precioId) {
        const checkbox = row.querySelector('input[type="checkbox"]');
        const disponible = checkbox.checked;
        
        try {
            const { error } = await supabase
                .from('precios_proveedores')
                .update({ 
                    disponible: disponible,
                    fecha_actualizacion: new Date().toISOString()
                })
                .eq('id', precioId);
            
            if (error) throw error;
            
            // Cambiar opacidad de la fila según disponibilidad
            row.style.opacity = disponible ? '1' : '0.5';
            
        } catch (error) {
            console.error('Error al actualizar disponibilidad:', error.message);
            toastError('Error al actualizar','Error al actualizar disponibilidad:', error.message);
            checkbox.checked = !disponible; // Revertir el cambio
        }
    }

    // Configurar eventos
    function configurarEventos() {
        // Búsqueda con debounce
        let timeoutBusqueda = null;
        busquedaInput.addEventListener('input', () => {
            clearTimeout(timeoutBusqueda);
            timeoutBusqueda = setTimeout(() => {
                filtroActual = busquedaInput.value.trim();
                cargarPrecios(true);
            }, 300);
        });

        // Búsqueda al presionar Enter
        busquedaInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                clearTimeout(timeoutBusqueda);
                filtroActual = busquedaInput.value.trim();
                cargarPrecios(true);
            }
        });

        // Scroll infinito en el tbody
        tbody.addEventListener('scroll', () => {
            const scrollBottom = tbody.scrollTop + tbody.clientHeight;
            const scrollHeight = tbody.scrollHeight;

            // Mostrar/ocultar botón subir
            botonSubir.style.display = tbody.scrollTop > 300 ? 'block' : 'none';

            // Cargar más si está cerca del final
            if (scrollBottom >= scrollHeight - 100) {
                cargarPrecios();
            }
        });

    }

    // Inicializar
    configurarEventos();
    await cargarPrecios(true);

    return {
        refrescar: () => cargarPrecios(true)
    };
}

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    await gestionarPreciosProveedores();
});