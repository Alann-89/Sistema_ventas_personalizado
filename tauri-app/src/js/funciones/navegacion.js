// Este script maneja el estado activo del menú lateral y la navegación entre páginas
document.addEventListener('DOMContentLoaded', function() {
    // Obtener todos los botones del menú
    const botonesMenu = document.querySelectorAll('.boton-menu');
    
    const basePath = window.location.origin;
    // Corregir rutas para que apunten correctamente según la estructura del proyecto
    const rutas = {
        'resumenContainer': `${basePath}/index.html`,
        'clientesContainer': `${basePath}/src/paginas/clientes/clientes.html`,
        'productosContainer': `${basePath}/src/paginas/productos/productos.html`,
        'ordenesContainer': `${basePath}/src/paginas/ordenes/ordenes.html`,
        'provedoresContainer': `${basePath}/src/paginas/proveedores/proveedores.html`,
        'rutasContainer': `${basePath}/src/paginas/rutas/rutas.html`,
        'reportesContainer': `${basePath}/src/paginas/reportes/reportes.html`,
        'ajustesContainer': `${basePath}/src/paginas/ajustes/ajustes.html`
    };
    
    // Función para marcar un botón como activo
    function asignarMenuActivo(menuId) {
        botonesMenu.forEach(btn => {
            btn.classList.remove('activo');
        });
        
        // Añadir la clase activo al botón correspondiente
        if (menuId) {
            const activeButton = document.getElementById(menuId);
            if (activeButton) {
                activeButton.classList.add('activo');
            }
        }
        
        // Guardar el estado activo en localStorage para recordarlo entre páginas
        localStorage.setItem('activeMenu', menuId);
    }
    
    // Verificar si hay un estado activo guardado en localStorage
    const guardarMenuActivo = localStorage.getItem('activeMenu');
    
    // Determinar qué botón activar basado en la URL actual o el estado guardado
    function determinarMenuActivo() {
        // Obtener la ruta actual completa
        const currentPath = window.location.pathname;
        
        // Buscar qué botón corresponde a esta página
        let menuIdActivo = null;
        
        for (const [menuId, ruta] of Object.entries(rutas)) {
            // Extraer el nombre de archivo de la ruta para comparación
            const rutaArchivo = ruta.split('/').pop();
            
            // Si la ruta actual contiene el nombre del archivo o es la página principal
            if (currentPath.includes(rutaArchivo) || 
               (currentPath.endsWith('/') && menuId === 'resumenContainer') ||
               (currentPath.endsWith('index.html') && menuId === 'resumenContainer')) {
                menuIdActivo = menuId;
                break;
            }
        }
        
        // Si no encontramos coincidencia, usar el guardado o por defecto 'resumenContainer'
        return menuIdActivo || guardarMenuActivo || 'resumenContainer';
    }
    
    // Activar el menú correspondiente
    asignarMenuActivo(determinarMenuActivo());
    
    // Añadir eventos de clic a los botones del menú
    botonesMenu.forEach(btn => {
        btn.addEventListener('click', function() {
            const menuId = this.id;
            asignarMenuActivo(menuId);
            
            // Navegar a la página correspondiente
            if (rutas[menuId]) {
                // Añadir efecto de transición antes de navegar
                document.body.style.opacity = '0.8';
                document.body.style.transition = 'opacity 0.3s ease';
                
                // Navegar después de un pequeño retraso para mostrar la transición
                setTimeout(() => {
                    window.location.href = rutas[menuId];
                }, 300);
            }
        });
    });
    
    // Efecto de entrada al cargar la página
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.opacity = '1';
        document.body.style.transition = 'opacity 0.5s ease';
    }, 100);

    // Añadir efectos de hover mejorados para las tarjetas
    const tarjetas = document.querySelectorAll('.tarjetas');
    
    //Efectos tarjetas
    tarjetas.forEach(tarjeta => {
        // Efecto de entrada y salida suave
        tarjeta.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        });
        
        tarjeta.addEventListener('mouseleave', function() {
            this.style.transition = 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
        });
        
        // Efecto de clic
        tarjeta.addEventListener('mousedown', function() {
            this.style.transform = 'translateY(-5px) scale(0.98)';
        });
        
        tarjeta.addEventListener('mouseup', function() {
            this.style.transform = 'translateY(-10px) scale(1.05)';
        });
    });
});