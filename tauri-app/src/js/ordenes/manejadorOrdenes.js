import { toastAdvertencia, toastError, toastExito, toastInfo, showAlert } from '../funciones/alertas.js';
import { supabase } from '../funciones/conexion.js';

let carrito = [];
let clientes = [];
let productos = [];

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
    } catch (error) {
        console.error('Error al cargar productos:', error);
        toastError('Error al cargar productos',);
    } finally {
        mostrarLoader(false);
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
        toastError('Error al cargar clientes', error.message);
    }
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
        toastAdvertencia('La cantidad debe ser al menos 1' );
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

    const carritoItems = document.getElementById('carritoItems');
    const carritoVacio = document.getElementById('carritoVacio');
    const carritoFooter = document.getElementById('carritoFooter');
    const carritoContador = document.getElementById('carritoContador');
    const carritoTotal = document.getElementById('carritoTotal');

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
        toastError('El carrito está vacío');
        return;
    }

    const selectCliente = document.getElementById('selectCliente');
    const clienteId = selectCliente.value ? parseInt(selectCliente.value) : null;
    
    // Validar cliente si es requerido
    if (!clienteId) {
        toastError('Debe seleccionar un cliente');
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

        showAlert({
            type: 'success',
            title: `Pedido #${pedido.id} procesado exitosamente`,
            message: `Resumen:\n${resumen}\n\nTotal: $${total.toFixed(2)}`,
            buttons: [
                {
                    text: 'Aceptar',
                    type: 'primary',
                    action: () => {
                    // acción opcional después de cerrar
                    console.log('Resumen aceptado');
                    }
                }
            ]
        });
        
        // 4. Limpiar carrito
        carrito = [];
        actualizarCarrito();
        toastExito('Pedido creado', 'Pedido procesado exitosamente');
        
    } catch (error) {
        console.error('Error al procesar pedido:', error);
        toastError('Error al procesar el pedido', error.message );
    } finally {
        mostrarLoader(false);
    }
}

// Generar cotización (similar a procesar pedido pero sin guardar en BD)
async function generarCotizacion() {
    if (carrito.length === 0) {
        toastError('El carrito está vacío');
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
        toastError('Error al generar cotización', error.message );
    } finally {
        mostrarLoader(false);
    }
}



// Funcionalidad de búsqueda
function filtrarProductos() {
    const busqueda = document.getElementById('input-busqueda').value.toLowerCase();
    const tarjetas = document.querySelectorAll('.tarjetas');
    
    tarjetas.forEach(tarjeta => {
        const nombre = tarjeta.querySelector('.producto').textContent.toLowerCase();
        if (nombre.includes(busqueda)) {
            tarjeta.style.display = 'flex';
        } else {
            tarjeta.style.display = 'none';
        }
    });
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
    
    // Búsqueda en tiempo real
    document.getElementById('input-busqueda').addEventListener('input', filtrarProductos);
    
    // Scroll del contenedor de tarjetas
    const contenedor = document.getElementById('contenedor-tarjetas');
    contenedor.addEventListener('scroll', mostrarBotonSubir);
    
    // Botón subir
    document.getElementById('botonSubir').addEventListener('click', function() {
        contenedor.scrollTo({ top: 0, behavior: 'smooth' });
    });
    

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
    
});