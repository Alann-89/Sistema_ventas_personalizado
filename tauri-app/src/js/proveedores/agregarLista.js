import { supabase } from '../funciones/conexion.js';
import { toastExito, toastAdvertencia, toastError } from '../funciones/alertas.js';
import { descartarCambios, mostrarCambiosSinGuardar } from './alertaProveedores.js'

export async function gestionarPreciosProveedores() {
    const params = new URLSearchParams(window.location.search);
    const proveedorId = params.get('id');
    
    if (!proveedorId) {
        console.error('No se proporcionó ID de proveedor');
        return;
    }

    // Elementos del DOM
    const tbodyDisponibles = document.getElementById('productos-disponibles');
    const tbodySeleccionados = document.getElementById('productos-seleccionados');
    const btnGuardar = document.getElementById('btn-guardar');
    const btnCancelar = document.querySelector('.btn-cancelar');
    const botonAtras = document.querySelector('.boton-atras');
    const resumenCambios = document.getElementById('resumen-cambios');
    const resumenTexto = document.getElementById('resumen-texto');

    // Variables de estado
    let productosSeleccionados = new Map();
    let cambiosRealizados = false;
    let todosProductos = [];
    let preciosProveedor = [];

    // Inicializar
    await cargarDatosIniciales();
    configurarEventos();

    // Función para cargar datos iniciales
    async function cargarDatosIniciales() {
        try {
            // Cargar productos disponibles
            const { data: productosData, error: productosError } = await supabase
                .from('productos')
                .select('id, nombre, precio_base')
                .order('nombre', { ascending: true });
            
            if (productosError) throw productosError;
            todosProductos = productosData || [];

            // Cargar precios existentes del proveedor
            const { data: preciosData, error: preciosError } = await supabase
                .from('precios_proveedores')
                .select('id, producto_id, precio_unitario, disponible')
                .eq('proveedor_id', proveedorId);
            
            if (preciosError) throw preciosError;
            preciosProveedor = preciosData || [];

            // Renderizar productos disponibles
            renderizarProductosDisponibles();
            
            // Renderizar productos seleccionados (vacío inicialmente)
            renderizarProductosSeleccionados();

            // Actualizar contadores
            actualizarContadores();

        } catch (error) {
            console.error('Error al cargar datos:', error);
            toastError('Error al cargar datos', error.message);
        }
    }

    // Función para renderizar productos disponibles
    function renderizarProductosDisponibles() {
        tbodyDisponibles.innerHTML = '';

        // Filtrar productos que no están ya seleccionados
        const productosDisponibles = todosProductos.filter(producto => 
            !productosSeleccionados.has(producto.id.toString())
        );

        if (productosDisponibles.length === 0) {
            tbodyDisponibles.innerHTML = `
                <tr class="mensaje-vacio">
                    <td colspan="3">No hay productos disponibles</td>
                </tr>
            `;
            return;
        }

        productosDisponibles.forEach(producto => {
            const precioExistente = preciosProveedor.find(p => p.producto_id === producto.id);
            
            const row = document.createElement('tr');
            row.dataset.id = producto.id;
            row.innerHTML = `
                <td>
                    <div class="producto-nombre">${producto.nombre}</div>
                </td>
                <td>
                    <div class="producto-precio">$${producto.precio_base?.toFixed(2) || '0.00'}</div>
                </td>
                <td>
                    <button class="btn-seleccionar">
                        <img class="icono-btn" alt="" src="../../recursos/iconos/icono_agregar.svg">
                        <span>Seleccionar</span>
                    </button>
                </td>
            `;

            // Configurar evento de selección
            row.querySelector('.btn-seleccionar').addEventListener('click', () => {
                seleccionarProducto(row);
            });

            tbodyDisponibles.appendChild(row);
        });
    }

    // Función para renderizar productos seleccionados
    function renderizarProductosSeleccionados() {
        tbodySeleccionados.innerHTML = '';

        if (productosSeleccionados.size === 0) {
            tbodySeleccionados.innerHTML = `
                <tr class="mensaje-vacio">
                    <td colspan="3">
                        <div>No hay productos seleccionados</div>
                        <div style="font-size: 12px; margin-top: 4px;">Selecciona productos de la tabla de la izquierda</div>
                    </td>
                </tr>
            `;
            return;
        }

        productosSeleccionados.forEach((producto, id) => {
            const row = document.createElement('tr');
            row.dataset.id = id;
            row.innerHTML = `
                <td><div class="producto-nombre">${producto.nombre}</div></td>
                <td>
                    <input type="number" 
                           class="precio-proveedor-input" 
                           value="${producto.precioProveedor?.toFixed(2) || ''}" 
                           placeholder="0.00" 
                           step="0.01" 
                           min="0">
                </td>
                <td>
                    <button class="btn-quitar">
                        <img class="icono-btn" alt="" src="../../recursos/iconos/icono_quitar.svg">
                        <span>Quitar</span>
                    </button>
                </td>
            `;

            // Configurar eventos
            const inputPrecio = row.querySelector('.precio-proveedor-input');
            inputPrecio.addEventListener('input', () => {
                actualizarPrecioProveedor(inputPrecio, id);
            });

            inputPrecio.addEventListener('change', () => {
                validarPrecio(inputPrecio);
            });

            row.querySelector('.btn-quitar').addEventListener('click', () => {
                quitarProducto(row);
            });

            tbodySeleccionados.appendChild(row);
        });
    }

    // Función para seleccionar producto
    function seleccionarProducto(row) {
        const id = row.dataset.id;
        const producto = todosProductos.find(p => p.id.toString() === id);
        
        if (!producto) return;

        // Agregar a productos seleccionados
        const precioExistente = preciosProveedor.find(p => p.producto_id === producto.id);
        
        productosSeleccionados.set(id, {
            id: producto.id,
            nombre: producto.nombre,
            precioVenta: producto.precio_base?.toFixed(2) || '0.00',
            precioProveedor: precioExistente?.precio_unitario || null,
            precioExistenteId: precioExistente?.id
        });

        // Renderizar ambas tablas
        renderizarProductosDisponibles();
        renderizarProductosSeleccionados();
        
        // Marcar cambios
        cambiosRealizados = true;
        actualizarEstadoBotones();
        actualizarContadores();
    }

    // Función para quitar producto
    function quitarProducto(row) {
        const id = row.dataset.id;
        productosSeleccionados.delete(id);
        
        // Renderizar ambas tablas
        renderizarProductosDisponibles();
        renderizarProductosSeleccionados();
        
        // Actualizar estado
        cambiosRealizados = productosSeleccionados.size > 0;
        actualizarEstadoBotones();
        actualizarContadores();
    }

    // Función para actualizar precio
    function actualizarPrecioProveedor(input, id) {
        const precio = parseFloat(input.value) || null;
        if (productosSeleccionados.has(id)) {
            const producto = productosSeleccionados.get(id);
            producto.precioProveedor = precio;
            productosSeleccionados.set(id, producto);
        }
        cambiosRealizados = true;
        actualizarEstadoBotones();
    }

    // Función para validar precio
    function validarPrecio(input) {
        const valor = parseFloat(input.value);
        if (isNaN(valor)) {
            input.value = '';
            return;
        }
        input.value = Math.max(0, valor).toFixed(2);
    }

    // Función para actualizar contadores
    function actualizarContadores() {
        const disponibles = todosProductos.length - productosSeleccionados.size;
        const seleccionados = productosSeleccionados.size;
        
        document.getElementById('contador-disponibles').textContent = disponibles;
        document.getElementById('contador-seleccionados').textContent = seleccionados;
    }

    // Función para actualizar estado de botones
    function actualizarEstadoBotones() {
        const hayProductosConPrecio = Array.from(productosSeleccionados.values())
            .some(producto => producto.precioProveedor !== null && producto.precioProveedor > 0);
        
        btnGuardar.disabled = !hayProductosConPrecio;
        btnCancelar.disabled = !cambiosRealizados;
        
        // Actualizar resumen
        actualizarResumen();
    }

    // Función para actualizar resumen
    function actualizarResumen() {
        const productosConPrecio = Array.from(productosSeleccionados.entries())
            .filter(([id, producto]) => producto.precioProveedor !== null && producto.precioProveedor > 0);
        
        if (productosConPrecio.length > 0) {
            resumenCambios.classList.add('activo');
            resumenTexto.innerHTML = `Se asignarán precios de proveedor a <strong>${productosConPrecio.length}</strong> producto(s):<br>
                ${productosConPrecio.map(([id, producto]) => 
                    `• ${producto.nombre}: $${producto.precioProveedor.toFixed(2)}`
                ).join('<br>')}`;
        } else {
            resumenCambios.classList.remove('activo');
            resumenTexto.innerHTML = '';
        }
    }

    // Función para guardar cambios en Supabase
    async function guardarCambios() {
        const productosConPrecio = Array.from(productosSeleccionados.values())
            .filter(producto => producto.precioProveedor !== null && producto.precioProveedor > 0);
        
        if (productosConPrecio.length === 0) {
            toastAdvertencia('Sin cambios', 'No hay productos con precios válidos para guardar');
            return;
        }
        
        try {
            // Preparar operaciones
            const operaciones = productosConPrecio.map(producto => {
                if (producto.precioExistenteId) {
                    // Actualizar precio existente
                    return supabase
                        .from('precios_proveedores')
                        .update({
                            precio_unitario: producto.precioProveedor,
                            fecha_actualizacion: new Date().toISOString()
                        })
                        .eq('id', producto.precioExistenteId);
                } else {
                    // Crear nuevo precio
                    return supabase
                        .from('precios_proveedores')
                        .insert({
                            producto_id: producto.id,
                            proveedor_id: proveedorId,
                            precio_unitario: producto.precioProveedor,
                            disponible: true
                        });
                }
            });

            // Ejecutar todas las operaciones
            const resultados = await Promise.all(operaciones);
            
            // Verificar errores
            const errores = resultados.filter(r => r.error);
            if (errores.length > 0) {
                throw new Error(errores.map(e => e.error.message).join('; '));
            }

            // Mostrar éxito
            toastExito('Cambios guardados', `Se actualizaron ${productosConPrecio.length} precios correctamente`);

            // Recargar datos
            await cargarDatosIniciales();
            cambiosRealizados = false;
            actualizarEstadoBotones();

        } catch (error) {
            console.error('Error al guardar cambios:', error);
            toastError('Error al guardar', error.message);
        }
    }

    // Función para cancelar cambios
   function cancelarCambios() {
        if (!cambiosRealizados) return;
        
        descartarCambios({
            onConfirm: () => {
                productosSeleccionados.clear();
                cambiosRealizados = false;
                renderizarProductosDisponibles();
                renderizarProductosSeleccionados();
                actualizarEstadoBotones();
                actualizarContadores();
            },
            onCancel: () => {
                // No hacer nada si el usuario cancela
            }
        });
    }

    // Configurar eventos globales
    function configurarEventos() {
        // Botón de regresar
        botonAtras.addEventListener('click', () => {
            if (cambiosRealizados) {
                mostrarCambiosSinGuardar();
                return;
            }
            window.history.back();
        });

        // Botones de acción
        btnGuardar.addEventListener('click', guardarCambios);
        btnCancelar.addEventListener('click', cancelarCambios);

        // Búsqueda de productos
        
        // Crear input de búsqueda
        const buscador = document.createElement('input');
        buscador.type = 'text';
        buscador.placeholder = 'Buscar productos...';
        buscador.className = 'buscador';

        buscador.addEventListener('input', (e) => {
            const termino = e.target.value.toLowerCase();
            const filas = tbodyDisponibles.querySelectorAll('tr');
            
            filas.forEach(fila => {
                if (fila.classList.contains('mensaje-vacio')) return;
                
                const nombre = fila.querySelector('.producto-nombre').textContent.toLowerCase();
                fila.style.display = nombre.includes(termino) ? '' : 'none';
            });
        });

        // Insertar buscador en el header
        const header = document.querySelector('.formulario-header');
        header.appendChild(buscador);
    }

    return {
        refrescar: () => cargarDatosIniciales()
    };
}

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    window.gestionPrecios = await gestionarPreciosProveedores();
});