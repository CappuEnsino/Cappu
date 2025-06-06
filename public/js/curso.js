// JS dinâmico para adicionar/remover módulos e aulas na criação de curso

let modulos = [];

function renderModulos() {
  const modulosContainer = document.getElementById('modulosContainer');
  modulosContainer.innerHTML = '';
  modulos.forEach((modulo, i) => {
    const moduloDiv = document.createElement('div');
    moduloDiv.className = 'modulo-bloco';
    moduloDiv.innerHTML = `
      <h3>Módulo ${i + 1}</h3>
      <input id="modulo-titulo-${i}" type="text" placeholder="Título do módulo" value="${modulo.titulo}" onchange="updateModuloTitulo(${i}, this.value)" required />
      <textarea id="modulo-desc-${i}" placeholder="Descrição do módulo" onchange="updateModuloDescricao(${i}, this.value)" required>${modulo.descricao}</textarea>
      <button type="button" onclick="removeModulo(${i})">Remover módulo</button>
      <div class="aulas">
        <h4>Aulas</h4>
        ${modulo.aulas.map((aula, j) => `
          <div class="aula-bloco">
            <input id="aula-titulo-${i}-${j}" type="text" placeholder="Título da aula" value="${aula.titulo}" onchange="updateAulaTitulo(${i},${j},this.value)" required />
            <textarea id="aula-desc-${i}-${j}" placeholder="Descrição da aula" onchange="updateAulaDescricao(${i},${j},this.value)" required>${aula.descricao}</textarea>
            <button type="button" onclick="removeAula(${i},${j})">Remover aula</button>
          </div>
        `).join('')}
        <button type="button" onclick="addAula(${i})">Adicionar aula</button>
      </div>
    `;
    modulosContainer.appendChild(moduloDiv);
  });
}

function addModulo() {
  modulos.push({ titulo: '', descricao: '', aulas: [] });
  renderModulos();
}
function removeModulo(index) {
  modulos.splice(index, 1);
  renderModulos();
  showNotify('success', 'Módulo removido!');
}
function updateModuloTitulo(index, value) {
  modulos[index].titulo = value;
}
function updateModuloDescricao(index, value) {
  modulos[index].descricao = value;
}
function addAula(moduloIndex) {
  modulos[moduloIndex].aulas.push({ titulo: '', descricao: '' });
  renderModulos();
  showNotify('success', 'Aula adicionada!');
}
function removeAula(moduloIndex, aulaIndex) {
  modulos[moduloIndex].aulas.splice(aulaIndex, 1);
  renderModulos();
  showNotify('success', 'Aula removida!');
}
function updateAulaTitulo(moduloIndex, aulaIndex, value) {
  modulos[moduloIndex].aulas[aulaIndex].titulo = value;
}
function updateAulaDescricao(moduloIndex, aulaIndex, value) {
  modulos[moduloIndex].aulas[aulaIndex].descricao = value;
}

// Serializar módulos/aulas antes do submit
function showNotify(status, text) {
  new Notify({ status, title: status === 'success' ? 'Sucesso' : 'Erro', text, position: 'left top' });
}

document.addEventListener('DOMContentLoaded', function() {
  renderModulos();
  document.getElementById('addModuloBtn').onclick = function() {
    addModulo();
    showNotify('success', 'Módulo adicionado!');
  };
  document.getElementById('formCriarCurso').onsubmit = function(e) {
    // Validação dos campos obrigatórios
    let valid = true;
    document.querySelectorAll('.campo-invalido').forEach(el => el.classList.remove('campo-invalido'));
    modulos.forEach((modulo, i) => {
      if (!modulo.titulo) {
        valid = false;
        highlightInvalidField(`#modulo-titulo-${i}`);
      }
      if (!modulo.descricao) {
        valid = false;
        highlightInvalidField(`#modulo-desc-${i}`);
      }
      modulo.aulas.forEach((aula, j) => {
        if (!aula.titulo) {
          valid = false;
          highlightInvalidField(`#aula-titulo-${i}-${j}`);
        }
        if (!aula.descricao) {
          valid = false;
          highlightInvalidField(`#aula-desc-${i}-${j}`);
        }
      });
    });
    if (!valid) {
      e.preventDefault();
      showNotify('error', 'Preencha todos os campos obrigatórios de módulos e aulas!');
      return false;
    }
    document.getElementById('modulosInput').value = JSON.stringify(modulos);
  };
});

function highlightInvalidField(selector) {
  const el = document.querySelector(selector);
  if (el) el.classList.add('campo-invalido');
}
