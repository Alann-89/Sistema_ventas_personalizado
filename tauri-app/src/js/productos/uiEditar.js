export function renderFormularioEdicion(producto, categorias) {
  return `
    <div class="nombre-producto">
      <button class="boton-atras">
        <img class="icono-atras" alt="" src="../../recursos/iconos/icono_atras.svg">
      </button>
      Editar Producto
    </div>
    <form id="formulario-edicion">
        <div class="conetenedor-actualizar">
            <div class="contenedor-imagen" id="imagen-actual-container">
                <img id="preview-img" class="imagen" alt="${producto.nombre}" src="${producto.imagen}">
            </div>
            <div class="contenedor-informacion">
                ${renderCampos(producto, categorias)}
            </div>
        </div>
        <div class="actualizar" id="upload-area">
            <img class="vector-icon" alt="" src="../../recursos/iconos/icono_vector.svg">
            <div class="titulo2">Selecciona una nueva imagen</div>
            <input type="file" id="imagen" accept="image/*" style="display: none;" />
        </div>
        <div class="guardar-producto">
            <button type="submit" class="boton">
                <img class="icono" alt="" src="../../recursos/iconos/icono_guardar.svg">
                <div class="texto-boton">Guardar Cambios</div>
            </button>
            <button type="button" id="btn-eliminar" class="boton-eliminar">
                <img class="icono" alt="" src="../../recursos/iconos/icono_eliminar.svg">
                <div class="texto-boton">Eliminar Producto</div>
            </button>
        </div>
    </form>
  `;
}

function escapeHtml(unsafe) {
  return unsafe.replace(/[&<"'>]/g, (match) =>
    ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[match])
  );
}

function renderCampos(p, categorias) {
  return `
    ${campoTexto("Nombre", "nombre", escapeHtml(p.nombre))}
    ${campoNumero("Precio", "precio", p.precio_base)}
    ${campoNumero("Existencia", "existencia", p.cantidad)}
    ${campoSelect("Categoría", "categoria", p.categoria, categorias)}
    ${campoTextarea("Descripción", "descripcion", p.descripcion)}
    ${campoTexto("SKU / Código", "codigo", p.codigo)}
  `;
}

function campoTexto(titulo, id, valor) {
  return `
    <div class="informacion-producto">
      <div class="titulos">${titulo}</div>
      <div class="informacin-del-producto-wrapper">
        <input type="text" id="${id}" class="informacin-del-producto" value="${valor}" />
      </div>
    </div>
  `;
}

function campoNumero(titulo, id, valor) {
  return `
    <div class="informacion-producto">
      <div class="titulos">${titulo}</div>
      <div class="informacin-del-producto-wrapper">
        <input type="number" id="${id}" class="informacin-del-producto" value="${valor}" />
      </div>
    </div>
  `;
}

function campoSelect(titulo, id, valor, opciones) {
  const opcionesHtml = opciones.map(cat => `
    <option value="${cat.id}" ${cat.id === valor ? 'selected' : ''}>
      ${escapeHtml(cat.nombre)}
    </option>
  `).join('');

  return `
    <div class="informacion-producto">
      <div class="titulos">${titulo}</div>
      <div class="informacin-del-producto-wrapper">
        <select id="${id}" class="informacin-del-producto">
          ${opcionesHtml}
        </select>
      </div>
    </div>
  `;
}

function campoTextarea(titulo, id, valor) {
  return `
    <div class="informacion-producto">
      <div class="titulos">${titulo}</div>
      <div class="informacin-del-producto-wrapper">
        <textarea id="${id}" class="informacin-del-producto" style="resize: none;">${valor}</textarea>
      </div>
    </div>
  `;
}
