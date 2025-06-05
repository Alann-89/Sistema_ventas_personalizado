import { toastAdvertencia, toastError, toastExito, toastInfo } from '../funciones/alertas.js';
import { supabase } from '../funciones/conexion.js';

let carrito = [];
let clientes = [];
let productos = [];
let categoriasDisponibles = [];
let filtroCategoriaActivo = null;
let filtroPrecioActivo = null;

// Mostrar u ocultar loader
function mostrarLoader(mostrar) {
    document.getElementById('loaderOverlay').style.display = mostrar ? 'flex' : 'none';
}

// Cargar productos desde Supabase
async function cargarProductos() {
    mostrarLoader(true);
    try {
        const { data, error } = await supabase
            .from('productos')
            .select('*')
            .order('nombre', { ascending: true });

        if (error) throw error;
        
        productos = data;
        renderizarProductos(data);

        // Extraer categorías únicas de los productos
        categoriasDisponibles = [...new Set(data.map(p => p.categoria))].filter(Boolean);
        actualizarFiltroCategorias();
    } catch (error) {
        console.error('Error al cargar productos:', error.message);
        toastError('Error al cargar productos',);
    } finally {
        mostrarLoader(false);
    }
}

// Función para actualizar las opciones de categoría en el menú
function actualizarFiltroCategorias() {
    const menuCategorias = document.createElement('div');
    menuCategorias.className = 'menu-filtro';
    
    // Opción para mostrar todos
    const opcionTodos = document.createElement('div');
    opcionTodos.className = 'opcion-filtro';
    opcionTodos.textContent = 'Todas las categorías';
    opcionTodos.addEventListener('click', () => {
        aplicarFiltroCategoria(null);
    });
    menuCategorias.appendChild(opcionTodos);
    
    // Opciones por categoría
    categoriasDisponibles.forEach(categoria => {
        const opcion = document.createElement('div');
        opcion.className = 'opcion-filtro';
        opcion.textContent = categoria;
        opcion.addEventListener('click', () => {
            aplicarFiltroCategoria(categoria);
        });
        menuCategorias.appendChild(opcion);
    });
    
    // Guardar referencia al menú
    document.body.appendChild(menuCategorias);
    window.menuCategorias = menuCategorias;
}

// Función para mostrar/ocultar menú de categorías
function toggleMenuCategorias() {
    const menu = window.menuCategorias;
    if (menu) {
        const botonCategorias = document.querySelector('.boton:nth-of-type(1)');
        const rect = botonCategorias.getBoundingClientRect();
        
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
        menu.style.position = 'absolute';
        menu.style.top = `${rect.bottom}px`;
        menu.style.left = `${rect.left}px`;
        menu.style.zIndex = '1000';
        menu.style.backgroundColor = 'white';
        menu.style.border = '1px solid #ccc';
        menu.style.borderRadius = '4px';
        menu.style.padding = '8px 0';
        menu.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    }
}

// Función para aplicar filtro por categoría
function aplicarFiltroCategoria(categoria) {
    filtroCategoriaActivo = categoria;
    actualizarFiltros();
    
    // Actualizar estilo del botón
    const botonCategorias = document.querySelector('.boton:nth-of-type(1)');
    if (categoria) {
        botonCategorias.classList.add('filtro-activo');
        botonCategorias.querySelector('.texto-boton').textContent = `Categoría: ${categoria}`;
    } else {
        botonCategorias.classList.remove('filtro-activo');
        botonCategorias.querySelector('.texto-boton').textContent = 'Categorías';
    }
    
    // Ocultar menú
    if (window.menuCategorias) {
        window.menuCategorias.style.display = 'none';
    }
}

// Función para mostrar/ocultar menú de precios
function toggleMenuPrecios() {
    const menu = document.getElementById('menuPrecios');
    if (!menu) {
        crearMenuPrecios();
        return;
    }
    
    const botonPrecios = document.querySelector('.boton:nth-of-type(2)');
    const rect = botonPrecios.getBoundingClientRect();
    
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    menu.style.position = 'absolute';
    menu.style.top = `${rect.bottom}px`;
    menu.style.left = `${rect.left}px`;
}

// Función para crear el menú de precios
function crearMenuPrecios() {
    const menuPrecios = document.createElement('div');
    menuPrecios.id = 'menuPrecios';
    menuPrecios.className = 'menu-filtro';
    
    const rangos = [
        { label: 'Todos los precios', min: null, max: null },
        { label: 'Menos de $50', min: 0, max: 50 },
        { label: '$50 - $100', min: 50, max: 100 },
        { label: '$100 - $200', min: 100, max: 200 },
        { label: 'Más de $200', min: 200, max: null }
    ];
    
    rangos.forEach(rango => {
        const opcion = document.createElement('div');
        opcion.className = 'opcion-filtro';
        opcion.textContent = rango.label;
        opcion.addEventListener('click', () => {
            aplicarFiltroPrecio(rango.min, rango.max);
        });
        menuPrecios.appendChild(opcion);
    });
    
    document.body.appendChild(menuPrecios);
    window.menuPrecios = menuPrecios;
    toggleMenuPrecios(); // Mostrar el menú después de crearlo
}

// Función para aplicar filtro por precio
function aplicarFiltroPrecio(min, max) {
    filtroPrecioActivo = { min, max };
    actualizarFiltros();
    
    // Actualizar estilo del botón
    const botonPrecios = document.querySelector('.boton:nth-of-type(2)');
    if (min !== null || max !== null) {
        botonPrecios.classList.add('filtro-activo');
        let texto = 'Precio: ';
        if (min === null) texto += `hasta $${max}`;
        else if (max === null) texto += `desde $${min}`;
        else texto += `$${min}-$${max}`;
        botonPrecios.querySelector('.texto-boton').textContent = texto;
    } else {
        botonPrecios.classList.remove('filtro-activo');
        botonPrecios.querySelector('.texto-boton').textContent = 'Precio';
    }
    
    // Ocultar menú
    if (window.menuPrecios) {
        window.menuPrecios.style.display = 'none';
    }
}

// Cargar clientes desde Supabase
async function cargarClientes() {
    try {
        const { data, error } = await supabase
            .from('clientes')
            .select('id, nombre')
            .order('nombre', { ascending: true });

        if (error) throw error;
        
        clientes = data;
        actualizarSelectClientes(data);
    } catch (error) {
        console.error('Error al cargar clientes:', error);
        toastError('Error al cargar clientes', error);
    }
}


// Función para aplicar todos los filtros activos
function actualizarFiltros() {
    let productosFiltrados = [...productos];
    
    // Aplicar filtro de categoría si está activo
    if (filtroCategoriaActivo) {
        productosFiltrados = productosFiltrados.filter(
            p => p.categoria === filtroCategoriaActivo
        );
    }
    
    // Aplicar filtro de precio si está activo
    if (filtroPrecioActivo) {
        const { min, max } = filtroPrecioActivo;
        productosFiltrados = productosFiltrados.filter(p => {
            const precio = p.precio_base;
            return (min === null || precio >= min) && 
                   (max === null || precio <= max);
        });
    }
    
    // Aplicar filtro de búsqueda si hay texto
    const busqueda = document.getElementById('input-busqueda').value.toLowerCase();
    if (busqueda) {
        productosFiltrados = productosFiltrados.filter(p =>
            p.nombre.toLowerCase().includes(busqueda)
    )}
    
    renderizarProductos(productosFiltrados);
}

// Actualizar el select de clientes
function actualizarSelectClientes(clientes) {
    const select = document.getElementById('selectCliente');
    select.innerHTML = '<option value="">Seleccionar cliente</option>';
    
    clientes.forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente.id;
        option.textContent = cliente.nombre;
        select.appendChild(option);
    });
}

// Renderizar productos en el DOM
function renderizarProductos(productos) {
    const contenedor = document.getElementById('contenedor-tarjetas');
    contenedor.innerHTML = '';

    productos.forEach(producto => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'tarjetas';
        tarjeta.innerHTML = `
            <img class="imagen-producto" src="${producto.imagen || 'ruta/imagen_por_defecto.jpg'}" alt="${producto.nombre}" />
            <b class="producto">${producto.nombre}</b>
            
            <div class="info-producto">
                <div class="div-datos">
                    <span class="texto-cantidad">Cantidad:</span>
                    <span class="cantidad">${producto.cantidad || 0}</span>
                </div>
                
                <div class="item-precio">
                    $${(producto.precio_base || 0).toFixed(2)}
                </div>
            </div>
            
            <div class="controles-cantidad">
                <input type="number" id="cantidad-${producto.id}" class="input-cantidad" min="1" value="1">
                <button class="btn-agregar-carrito" data-product-id="${producto.id}">
                    +
                </button>
            </div>
        `;
        contenedor.appendChild(tarjeta);
    });

    // Asignar event listeners después de renderizar
    document.querySelectorAll('.btn-agregar-carrito').forEach(button => {
        button.addEventListener('click', function() {
            const productId = parseInt(this.getAttribute('data-product-id'));
            agregarAlCarrito(productId);
        });
    });
}

// Agregar producto al carrito
function agregarAlCarrito(productId) {
    const producto = productos.find(p => p.id === productId);
    if (!producto) return;

    const cantidadInput = document.getElementById(`cantidad-${productId}`);
    const cantidadSeleccionada = parseInt(cantidadInput?.value || 1);
    
    if (cantidadSeleccionada < 1) {
        toastAdvertencia('La cantidad debe ser al menos 1', error);
        return;
    }

    const itemExistente = carrito.find(item => item.id === productId);

    if (itemExistente) {
        itemExistente.cantidadCarrito += cantidadSeleccionada;
    } else {
        carrito.push({
            ...producto,
            cantidadCarrito: cantidadSeleccionada,
            precio_unitario: producto.precio_base
        });
    }

    actualizarCarrito();
    toastExito('Producto agregado',`${producto.nombre} agregado al carrito`);
}

// Actualizar visualización del carrito
function actualizarCarrito() {
    console.log("Running actualizarCarrito...");
    console.log("Carrito:", carrito);
    console.log("Document body:", document.body.innerHTML); // Check if elements exist

    const carritoItems = document.getElementById('carritoItems');
    const carritoVacio = document.getElementById('carritoVacio');
    const carritoFooter = document.getElementById('carritoFooter');
    const carritoContador = document.getElementById('carritoContador');
    const carritoTotal = document.getElementById('carritoTotal');

    console.log("Found elements:", {
        carritoItems,
        carritoVacio,
        carritoFooter,
        carritoContador,
        carritoTotal
    });

    // Actualizar contador
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidadCarrito, 0);
    carritoContador.textContent = totalItems;

    if (carrito.length === 0) {
        carritoVacio.style.display = 'block';
        carritoFooter.style.display = 'none';
        carritoItems.innerHTML = '';
       
    } else {
        carritoVacio.style.display = 'none';
        carritoFooter.style.display = 'block';
        carritoItems.innerHTML = '';
        
        carrito.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'carrito-item';
            itemElement.innerHTML = `
                <div class="item-info">
                    <img src="${item.imagen || 'ruta/imagen_por_defecto.jpg'}" alt="${item.nombre}" class="item-imagen">
                    <div class="item-detalles">
                        <div class="item-nombre">${item.nombre}</div>
                        <div class="item-precio">${(item.precio_unitario || 0).toFixed(2)} c/u</div>
                    </div>
                </div>
                <div class="item-controles">
                    <div class="cantidad-controles">
                        <button class="btn-cantidad" data-product-id="${item.id}" data-cambio="-1">-</button>
                        <span class="item-cantidad">${item.cantidadCarrito}</span>
                        <button class="btn-cantidad" data-product-id="${item.id}" data-cambio="1">+</button>
                    </div>
                    <button class="btn-eliminar-item" data-product-id="${item.id}">
                        <img class="icono-btn" alt="" src="../../recursos/iconos/icono_basura.svg">
                    </button>
                </div>
            `;
            carritoItems.appendChild(itemElement);
        });

        // Asignar event listeners después de Actualizar
        document.querySelectorAll('.btn-cantidad').forEach(button => {
            button.addEventListener('click', function() {
                const productId = parseInt(this.dataset.productId); // Usando dataset
                const cambio = parseInt(this.dataset.cambio); // -1
                cambiarCantidad(productId, cambio);
            });
        });

        document.querySelectorAll('.btn-eliminar-item').forEach(button => {
            button.addEventListener('click', function() {
                const productId = parseInt(this.dataset.productId); // Usando dataset
                eliminarDelCarrito(productId);
            });
        });

        // Calcular y mostrar total
        const total = carrito.reduce((sum, item) => sum + (item.precio_unitario * item.cantidadCarrito), 0);
        carritoTotal.textContent = `${total.toFixed(2)}`;
    }
}

// Cambiar cantidad de un producto en el carrito
function cambiarCantidad(productId, cambio) {
    const item = carrito.find(item => item.id === productId);
    if (item) {
        item.cantidadCarrito += cambio;
        if (item.cantidadCarrito <= 0) {
            eliminarDelCarrito(productId);
        } else {
            actualizarCarrito();
        }
    }
}

// Eliminar producto del carrito
function eliminarDelCarrito(productId) {
    const index = carrito.findIndex(item => item.id === productId);
    if (index > -1) {
        const producto = carrito[index];
        carrito.splice(index, 1);
        actualizarCarrito();
        toastInfo('Producto eliminado',`${producto.nombre} eliminado del carrito`);
    }
}

// Limpiar todo el carrito
function limpiarCarrito() {
    if (carrito.length > 0) {
        carrito = [];
        actualizarCarrito();
        toastInfo('Carrito limpiado', 'El carrito fue limpiado');
    }
}

// Crear un nuevo pedido en Supabase
async function crearPedido(clienteId, observaciones = '') {
    try {
        const { data, error } = await supabase
            .from('pedidos')
            .insert([
                { 
                    cliente_id: clienteId || null,
                    estado: 'pendiente',
                    observaciones: observaciones
                }
            ])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error al crear pedido:', error);
        throw error;
    }
}

// Agregar items al pedido en Supabase
async function agregarItemsPedido(pedidoId, items) {
    try {
        const itemsParaInsertar = items.map(item => ({
            pedido_id: pedidoId,
            producto_id: item.id,
            cantidad: item.cantidadCarrito,
            precio_unitario: item.precio_unitario,
            subtotal: item.precio_unitario * item.cantidadCarrito
        }));

        const { error } = await supabase
            .from('items_pedido')
            .insert(itemsParaInsertar);

        if (error) throw error;
    } catch (error) {
        console.error('Error al agregar items al pedido:', error);
        throw error;
    }
}

// Procesar pedido
async function procesarPedido() {
    if (carrito.length === 0) {
        toastError('El carrito está vacío', error.mensaje);
        return;
    }

    const selectCliente = document.getElementById('selectCliente');
    const clienteId = selectCliente.value ? parseInt(selectCliente.value) : null;
    
    // Validar cliente si es requerido
    if (!clienteId) {
        toastError('Debe seleccionar un cliente', error.mensaje);
        return;
    }

    mostrarLoader(true);
    
    try {
        // 1. Crear el pedido
        const pedido = await crearPedido(clienteId);
        
        // 2. Agregar los items al pedido
        await agregarItemsPedido(pedido.id, carrito);
        
        // 3. Mostrar confirmación
        const total = carrito.reduce((sum, item) => sum + (item.precio_unitario * item.cantidadCarrito), 0);
        const resumen = carrito.map(item => 
            `${item.nombre} x${item.cantidadCarrito} = ${(item.precio_unitario * item.cantidadCarrito).toFixed(2)}`
        ).join('\n');

        alert(`Pedido #${pedido.id} procesado exitosamente!\n\nResumen:\n${resumen}\n\nTotal: ${total.toFixed(2)}`);
        
        // 4. Limpiar carrito
        carrito = [];
        actualizarCarrito();
        toastExito('Pedido creado', 'Pedido procesado exitosamente');
        
    } catch (error) {
        console.error('Error al procesar pedido:', error);
        toastError('Error al procesar el pedido', error.mensaje);
    } finally {
        mostrarLoader(false);
    }
}

// Generar cotización (similar a procesar pedido pero sin guardar en BD)
async function generarCotizacion() {
    if (carrito.length === 0) {
        toastError('El carrito está vacío', error.mensaje);
        return;
    }

    mostrarLoader(true);
    
    try {
        // Obtener datos del cliente seleccionado
        const selectCliente = document.getElementById('selectCliente');
        const clienteId = selectCliente.value ? parseInt(selectCliente.value) : null;
        let clienteInfo = { nombre: "Cliente no especificado" };
        
        if (clienteId) {
            const cliente = clientes.find(c => c.id === clienteId);
            if (cliente) {
                clienteInfo = {
                    nombre: cliente.nombre,
                    telefono: cliente.telefono || 'No especificado',
                    correo: cliente.correo || 'No especificado'
                };
            }
        }

        // Calcular totales
        const subtotal = carrito.reduce((sum, item) => sum + (item.precio_unitario * item.cantidadCarrito), 0);
        const iva = subtotal * 0.16; // Suponiendo 16% de IVA
        const total = subtotal + iva;

        // Crear PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Configuración inicial
        doc.setFont('helvetica');
        doc.setFontSize(12);
        
        // Logo (opcional)
        // doc.addImage(logoData, 'JPEG', 15, 10, 30, 15);
        
        // Encabezado
        doc.setFontSize(20);
        doc.setTextColor(40);
        doc.text('COTIZACIÓN', 105, 20, { align: 'center' });
        
        doc.setFontSize(10);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 15, 30);
        doc.text(`No. Cotización: ${Math.floor(Math.random() * 10000)}`, 15, 35);
        
        // Información del cliente
        doc.setFontSize(12);
        doc.text('Cliente:', 15, 50);
        doc.text(clienteInfo.nombre, 15, 55);
        doc.text(`Teléfono: ${clienteInfo.telefono}`, 15, 60);
        doc.text(`Correo: ${clienteInfo.correo}`, 15, 65);
        
        // Tabla de productos
        doc.setFontSize(14);
        doc.text('Detalle de productos', 15, 80);
        
        const headers = [['Código', 'Producto', 'Cantidad', 'Precio Unitario', 'Subtotal']];
        const data = carrito.map(item => [
            item.codigo || 'N/A',
            item.nombre,
            item.cantidadCarrito,
            `$${item.precio_unitario.toFixed(2)}`,
            `$${(item.precio_unitario * item.cantidadCarrito).toFixed(2)}`
        ]);
        
        doc.autoTable({
            startY: 85,
            head: headers,
            body: data,
            theme: 'grid',
            headStyles: {
                fillColor: [83, 183, 89] // Color verde similar al de tu diseño
            },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 60 },
                2: { cellWidth: 20 },
                3: { cellWidth: 30 },
                4: { cellWidth: 30 }
            }
        });
        
        // Totales
        const finalY = doc.lastAutoTable.finalY + 15;
        
        doc.setFontSize(12);
        doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 140, finalY);
        doc.text(`IVA (16%): $${iva.toFixed(2)}`, 140, finalY + 5);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Total: $${total.toFixed(2)}`, 140, finalY + 15);
        
        // Notas
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('Notas:', 15, finalY + 25);
        doc.text('• Esta cotización es válida por 15 días naturales', 15, finalY + 30);
        doc.text('• Precios sujetos a disponibilidad', 15, finalY + 35);
        doc.text('• Formas de pago: Transferencia, Efectivo o Tarjeta', 15, finalY + 40);
        
        // Pie de página
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text('Gracias por su preferencia', 105, 280, { align: 'center' });
        doc.text('© ' + new Date().getFullYear() + ' - Todos los derechos reservados', 105, 285, { align: 'center' });
        
        // Guardar PDF
        doc.save(`Cotizacion_${new Date().toISOString().slice(0, 10)}.pdf`);
        
        toastInfo('Cotización generada');
    } catch (error) {
        console.error('Error al generar cotización:', error);
        toastError('Error al generar cotización', error.mensaje);
    } finally {
        mostrarLoader(false);
    }
}



// Funcionalidad de búsqueda
function filtrarProductos() {
    actualizarFiltros();
}

// Botón subir
function mostrarBotonSubir() {
    const contenedor = document.getElementById('contenedor-tarjetas');
    const botonSubir = document.getElementById('botonSubir');
    
    if (contenedor.scrollTop > 300) {
        botonSubir.style.display = 'block';
    } else {
        botonSubir.style.display = 'none';
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {

    cargarProductos();
    cargarClientes();
    actualizarCarrito();

     // Event listeners para los botones de filtro
    document.querySelector('.boton:nth-of-type(1)').addEventListener('click', toggleMenuCategorias);
    document.querySelector('.boton:nth-of-type(2)').addEventListener('click', toggleMenuPrecios);
    
    // Búsqueda en tiempo real
    document.getElementById('input-busqueda').addEventListener('input', filtrarProductos);
    
    // Scroll del contenedor de tarjetas
    const contenedor = document.getElementById('contenedor-tarjetas');
    contenedor.addEventListener('scroll', mostrarBotonSubir);
    
    // Botón subir
    document.getElementById('botonSubir').addEventListener('click', function() {
        contenedor.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    // Actualizar el botón de generar cotización
    document.querySelector('.btn-procesar:nth-of-type(2)').addEventListener('click', generarCotizacion);

    // Asignar event listeners después de renderizar
    const btnLimpiar = document.getElementById('limpiar');
    btnLimpiar.addEventListener('click', function () {
        limpiarCarrito();
    });

    const btnProcesar = document.getElementById('procesar');
    btnProcesar.addEventListener('click', function () {
        procesarPedido();
    });

    const btnCotizar = document.getElementById('cotizar');
    btnCotizar.addEventListener('click', function () {
        generarCotizacion();
    });

    // Cerrar menús al hacer clic fuera de ellos
    document.addEventListener('click', (e) => {
        const botonCategorias = document.querySelector('.boton:nth-of-type(1)');
        const botonPrecios = document.querySelector('.boton:nth-of-type(2)');
        
        if (!e.target.closest('.boton:nth-of-type(1)') && !e.target.closest('.menu-filtro')) {
            if (window.menuCategorias) window.menuCategorias.style.display = 'none';
        }
        
        if (!e.target.closest('.boton:nth-of-type(2)') && !e.target.closest('.menu-filtro')) {
            if (window.menuPrecios) window.menuPrecios.style.display = 'none';
        }
    });
    
});