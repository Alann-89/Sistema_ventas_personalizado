import { gestionarClientes } from './uiClientes'
document.addEventListener('DOMContentLoaded', async () => {
  const clientesManager = await gestionarClientes();
  
  // Si necesitas refrescar los productos desde otra parte:
  window.refrescarClientes = clientesManager.refrescar;
});