import { gestionarProveedores } from './uiProveedores.js'
document.addEventListener('DOMContentLoaded', async () => {
  const clientesManager = await gestionarProveedores();
  
  // Si necesitas refrescar los productos desde otra parte:
  window.refrescarClientes = clientesManager.refrescar;
});