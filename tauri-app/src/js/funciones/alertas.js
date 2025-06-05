// Asegurar que el contenedor de toasts exista
function ensureToastContainer() {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    return container;
}

// Sistema de Alertas Modales
function showAlert({ type = 'info', title, message, buttons = [] }) {
    // Crear overlay
    const overlay = document.createElement('div');
    overlay.className = 'alert-overlay';
    
    // Crear contenedor de la alerta
    const container = document.createElement('div');
    container.className = 'alert-container';
    
    // Iconos según el tipo
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    
    container.innerHTML = `
        <div class="alert-icon ${type}">
            ${icons[type] || icons.info}
        </div>
        <div class="alert-title">${title}</div>
        <div class="alert-message">${message}</div>
        <div class="alert-buttons" id="alertButtons"></div>
    `;
    
    // Agregar botones
    const buttonsContainer = container.querySelector('#alertButtons');
    buttons.forEach(button => {
        const btn = document.createElement('button');
        btn.className = `alert-button ${button.type || 'secondary'}`;
        btn.textContent = button.text;
        btn.onclick = () => {
            hideAlert(overlay);
            if (button.action) button.action();
        };
        buttonsContainer.appendChild(btn);
    });
    
    // Si no hay botones, agregar uno por defecto
    if (buttons.length === 0) {
        const defaultBtn = document.createElement('button');
        defaultBtn.className = 'alert-button primary';
        defaultBtn.textContent = 'Aceptar';
        defaultBtn.onclick = () => hideAlert(overlay);
        buttonsContainer.appendChild(defaultBtn);
    }
    
    overlay.appendChild(container);
    document.body.appendChild(overlay);
    
    // Mostrar con animación
    setTimeout(() => overlay.classList.add('show'), 10);
    
    // Cerrar al hacer clic en el overlay
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            hideAlert(overlay);
        }
    });
    
    // Cerrar con ESC
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            hideAlert(overlay);
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
}

function hideAlert(overlay) {
    overlay.classList.remove('show');
    setTimeout(() => {
        if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    }, 300);
}

// Sistema de Notificaciones Toast
function showToast({ type = 'info', title, message, duration = 4000 }) {
    const toastContainer = ensureToastContainer();
    
    // Crear toast
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    // Iconos según el tipo
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    
    toast.innerHTML = `
        <div class="toast-icon ${type}">
            ${icons[type] || icons.info}
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">×</button>
    `;
    
    // Agregar evento de cierre
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.onclick = () => hideToast(toast);
    
    toastContainer.appendChild(toast);
    
    // Mostrar con animación
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto ocultar
    if (duration > 0) {
        setTimeout(() => hideToast(toast), duration);
    }
}

function hideToast(toast) {
    toast.classList.remove('show');
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 300);
}

// Funciones de toast para feedback rápido
function toastExito(titulo, mensaje) {
    showToast({
        type: 'success',
        title: titulo,
        message: mensaje,
        duration: 4000
    });
}

function toastError(titulo, mensaje) {
    showToast({
        type: 'error',
        title: titulo,
        message: mensaje,
        duration: 5000
    });
}

function toastAdvertencia(titulo, mensaje) {
    showToast({
        type: 'warning',
        title: titulo,
        message: mensaje,
        duration: 4500
    });
}

function toastInfo(titulo, mensaje) {
    showToast({
        type: 'info',
        title: titulo,
        message: mensaje,
        duration: 3500
    });
}

function errorObtencionPedido(errores = []) {
    let mensaje = 'Error al obtener datos del pedido:';
    if (errores.length > 0) {
        mensaje += '\n\n• ' + errores.join('\n• ');
    } else {
        mensaje = 'Vuelva a intentar mas tarde.';
    }
    
    showAlert({
        type: 'error',
        title: 'Error de Obtencion de Datos',
        message: mensaje,
        buttons: [
            { 
                text: 'Entendido', 
                type: 'primary', 
                action: () => {} 
            }
        ]
    });
}

// Exportar funciones para uso en módulos ES6
export {
    errorObtencionPedido,
    showAlert,
    showToast,
    toastExito,
    toastError,
    toastAdvertencia,
    toastInfo
};