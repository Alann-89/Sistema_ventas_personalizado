import { supabase } from '../funciones/conexion.js';
import { toastError, toastExito } from '../funciones/alertas.js';
import { mostrarConfirmacionEliminarCategorias } from './alertaProductos.js';

let categories = [];

document.addEventListener('DOMContentLoaded', async () => {
  await cargarCategorias();

  document.getElementById('categoryForm').addEventListener('submit', agregarCategoria);
  document.getElementById('editForm').addEventListener('submit', actualizarCategoria);
});

// Cargar categorías desde Supabase
async function cargarCategorias() {
  const { data, error } = await supabase
    .from('categorias')
    .select('id, nombre')
    .order('id', { ascending: true });

  if (error) {
    toastError('Error al cargar categorías', error.message);
    return;
  }

  categories = data;
  renderTable();
}

// Renderizar tabla de categorías
function renderTable() {
  const tableBody = document.getElementById('categoriesTableBody');
  const emptyState = document.getElementById('emptyState');

  if (categories.length === 0) {
    tableBody.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  tableBody.innerHTML = categories.map(cat => `
    <tr>
        <td>${cat.id}</td>
        <td>${cat.nombre}</td>
        <td>
            <div class="action-buttons">
                <button class="btn-edit" onclick="editCategory(${cat.id}, '${cat.nombre.replace(/'/g, "\\'")}')">
                    <img class="icono" alt="" src="../../recursos/iconos/icono_editar.svg">
                    <div class="texto-boton">Editar</div>
                </button>
        
                <button class="btn-delete" onclick="deleteCategory(${cat.id})">
                    <img class="icono" alt="" src="../../recursos/iconos/icono_basura.svg">
                    <div class="texto-boton">Eliminar</div>
                </button>
            </div>
        </td>
    </tr>
  `).join('');
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

// Agregar nueva categoría
async function agregarCategoria(e) {
  e.preventDefault();

  const nombre = escapeHtml(document.getElementById('categoryName').value.trim());

  if (!nombre) return;

  const existe = categories.find(c => c.nombre.toLowerCase() === nombre.toLowerCase());

  if (existe) {
    toastError('Error al Guardar','Ya existe una categoría con ese nombre');
    return;
  }

  const { data, error } = await supabase
    .from('categorias')
    .insert({ nombre })
    .select();

  if (error) {
    toastError('Error al agregar categoría', error.message);
    return;
  }

  categories.push(data[0]);
  renderTable();
  document.getElementById('categoryForm').reset();
  toastExito('Exito', 'Categoría agregada exitosamente');
}

// Mostrar modal para editar
window.editCategory = (id, nombre) => {
  document.getElementById('editCategoryId').value = id;
  document.getElementById('editCategoryName').value = nombre;
  document.getElementById('editModal').style.display = 'block';
};

// Cerrar modal
window.closeEditModal = () => {
  document.getElementById('editModal').style.display = 'none';
};

// Actualizar categoría
async function actualizarCategoria(e) {
  e.preventDefault();

  const id = parseInt(document.getElementById('editCategoryId').value);
  const nuevoNombre = escapeHtml(document.getElementById('editCategoryName').value.trim());

  if (!nuevoNombre) return;

  const existe = categories.find(c => c.nombre.toLowerCase() === nuevoNombre.toLowerCase() && c.id !== id);

  if (existe) {
    toastError('Error al Guardar','Ya existe una categoría con ese nombre');
    return;
  }
   

  const { error } = await supabase
    .from('categorias')
    .update({ nombre: nuevoNombre })
    .eq('id', id)

  if (error) {
    toastError('Error al actualizar categoría', error.message);
    return;
  }

  const index = categories.findIndex(c => c.id === id);
  categories[index].nombre = nuevoNombre;

  renderTable();
  closeEditModal();
  toastExito('Exito', 'Categoría actualizada exitosamente');
}

// Eliminar categoría
window.deleteCategory = async (id) => {
    mostrarConfirmacionEliminarCategorias(async () => {
        try {
            const { error } = await supabase
            .from('categorias')
            .delete()
            .eq('id', id);

        } catch (error) {
            showToast({
                type: 'error',
                title: 'Error al eliminar',
                message: error.message
            });
        }
        categories = categories.filter(c => c.id !== id);
        renderTable();
    });
};

// Cerrar modal al hacer clic fuera
window.onclick = function (event) {
  const modal = document.getElementById('editModal');
  if (event.target === modal) closeEditModal();
};
