import { gestionarProductos } from './uiProductos'
document.addEventListener('DOMContentLoaded', async () => {
  const productosManager = await gestionarProductos();
  
  // Si necesitas refrescar los productos desde otra parte:
  window.refrescarProductos = productosManager.refrescar;
});