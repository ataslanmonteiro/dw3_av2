/**
 * Sistema de logging básico para auxiliar na depuração
 * @class Logger
 */
class Logger {
  /**
   * Registra mensagem de informação
   * @param {string} mensagem - Mensagem a ser registrada
   * @param {*} dados - Dados adicionais (opcional)
   */
  static info(mensagem, dados = null) {
    console.log(`[INFO] ${mensagem}`, dados || "");
  }

  /**
   * Registra mensagem de aviso
   * @param {string} mensagem - Mensagem a ser registrada
   * @param {*} dados - Dados adicionais (opcional)
   */
  static warn(mensagem, dados = null) {
    console.warn(`[WARN] ${mensagem}`, dados || "");
  }

  /**
   * Registra mensagem de erro
   * @param {string} mensagem - Mensagem a ser registrada
   * @param {*} dados - Dados adicionais (opcional)
   */
  static error(mensagem, dados = null) {
    console.error(`[ERROR] ${mensagem}`, dados || "");
  }
}

/**
 * Gerenciador de armazenamento local para persistência de dados
 * @class GerenciadorArmazenamento
 */
class GerenciadorArmazenamento {
  /**
   * Salva dados no localStorage
   * @param {string} chave - Chave para armazenamento
   * @param {*} dados - Dados a serem salvos
   */
  static salvar(chave, dados) {
    try {
      const dadosSerializados = JSON.stringify(dados);
      localStorage.setItem(chave, dadosSerializados);
      Logger.info(`Dados salvos para chave: ${chave}`);
    } catch (erro) {
      Logger.error(`Erro ao salvar dados para chave ${chave}:`, erro);
    }
  }

  /**
   * Carrega dados do localStorage
   * @param {string} chave - Chave para recuperação
   * @param {*} valorPadrao - Valor padrão caso não encontre dados
   * @returns {*} Dados recuperados ou valor padrão
   */
  static carregar(chave, valorPadrao = null) {
    try {
      const dadosSerializados = localStorage.getItem(chave);
      if (dadosSerializados === null) {
        return valorPadrao;
      }
      const dados = JSON.parse(dadosSerializados);
      Logger.info(`Dados carregados para chave: ${chave}`);
      return dados;
    } catch (erro) {
      Logger.error(`Erro ao carregar dados para chave ${chave}:`, erro);
      return valorPadrao;
    }
  }

  /**
   * Remove dados do localStorage
   * @param {string} chave - Chave para remoção
   */
  static remover(chave) {
    try {
      localStorage.removeItem(chave);
      Logger.info(`Dados removidos para chave: ${chave}`);
    } catch (erro) {
      Logger.error(`Erro ao remover dados para chave ${chave}:`, erro);
    }
  }
}

/**
 * Classe para gerenciar tarefas
 * @class GerenciadorTarefas
 */
class GerenciadorTarefas {
  constructor() {
    this.tarefas = [];
    this.tarefaEditando = null;
    this.projetoAtivo = "todos";
    this.filtroAtivo = "todas";
    this.carregarTarefas();
    this.inicializarEventos();
  }

  inicializarEventos() {
    const filtros = document.querySelectorAll(".filtro-item");
    filtros.forEach((filtro) => {
      filtro.addEventListener("click", (e) => {
        this.aplicarFiltro(e.target.dataset.filtro);
      });
    });

    Logger.info("Eventos do gerenciador de tarefas inicializados");
  }

  carregarTarefas() {
    this.tarefas = GerenciadorArmazenamento.carregar("tarefas", []);
    Logger.info(`${this.tarefas.length} tarefas carregadas`);
    this.renderizarTarefas();
  }

  salvarTarefas() {
    GerenciadorArmazenamento.salvar("tarefas", this.tarefas);
  }

  /**
   * Gera ID único para nova tarefa
   * @returns {string} ID único
   */
  gerarId() {
    return (
      "tarefa_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
    );
  }

  /**
   * Mostra formulário para adicionar/editar tarefa
   * @param {Object} tarefa - Tarefa para edição (opcional)
   */
  mostrarFormulario(tarefa = null) {
    const formulario = document.getElementById("form-tarefa");
    const titulo = document.getElementById("titulo-tarefa");
    const descricao = document.getElementById("descricao-tarefa");
    const dataVencimento = document.getElementById("data-vencimento");
    const prioridade = document.getElementById("prioridade-tarefa");
    const projetoSelect = document.getElementById("projeto-tarefa");

    this.atualizarOpcoesProjetoNoFormulario();

    if (tarefa) {
      this.tarefaEditando = tarefa;
      titulo.value = tarefa.titulo;
      descricao.value = tarefa.descricao || "";
      dataVencimento.value = tarefa.dataVencimento || "";
      prioridade.value = tarefa.prioridade;
      projetoSelect.value = tarefa.projetoId || "";
      Logger.info("Editando tarefa:", tarefa);
    } else {
      this.tarefaEditando = null;
      titulo.value = "";
      descricao.value = "";
      dataVencimento.value = "";
      prioridade.value = "media";
      projetoSelect.value =
        this.projetoAtivo !== "todos" ? this.projetoAtivo : "";
      Logger.info("Criando nova tarefa");
    }

    formulario.classList.add("ativo");
    formulario.classList.remove("oculto");
    titulo.focus();
  }

  cancelarEdicao() {
    const formulario = document.getElementById("form-tarefa");
    formulario.classList.remove("ativo");
    formulario.classList.add("oculto");
    this.tarefaEditando = null;
    Logger.info("Edição cancelada");
  }

  salvarTarefa() {
    const titulo = document.getElementById("titulo-tarefa").value.trim();
    const descricao = document.getElementById("descricao-tarefa").value.trim();
    const dataVencimento = document.getElementById("data-vencimento").value;
    const prioridade = document.getElementById("prioridade-tarefa").value;
    const projetoId = document.getElementById("projeto-tarefa").value;

    if (!titulo) {
      alert("O título da tarefa é obrigatório.");
      return;
    }

    const dadosTarefa = {
      titulo,
      descricao,
      dataVencimento,
      prioridade,
      projetoId: projetoId || null,
      concluida: false,
      dataCriacao: new Date().toISOString(),
    };

    if (this.tarefaEditando) {
      const indice = this.tarefas.findIndex(
        (t) => t.id === this.tarefaEditando.id
      );
      if (indice !== -1) {
        this.tarefas[indice] = {
          ...this.tarefas[indice],
          ...dadosTarefa,
        };
        Logger.info("Tarefa atualizada:", this.tarefas[indice]);
      }
    } else {
      const novaTarefa = {
        id: this.gerarId(),
        ...dadosTarefa,
      };
      this.tarefas.push(novaTarefa);
      Logger.info("Nova tarefa criada:", novaTarefa);
    }

    this.salvarTarefas();
    this.renderizarTarefas();
    this.cancelarEdicao();
  }

  /**
   * Alterna status de conclusão da tarefa
   * @param {string} id - ID da tarefa
   */
  alternarConclusao(id) {
    const tarefa = this.tarefas.find((t) => t.id === id);
    if (tarefa) {
      tarefa.concluida = !tarefa.concluida;
      this.salvarTarefas();
      this.renderizarTarefas();
      Logger.info(
        `Tarefa ${tarefa.concluida ? "concluída" : "reaberta"}:`,
        tarefa
      );
    }
  }

  /**
   * Remove uma tarefa
   * @param {string} id - ID da tarefa
   */
  removerTarefa(id) {
    if (confirm("Tem certeza que deseja excluir esta tarefa?")) {
      const indice = this.tarefas.findIndex((t) => t.id === id);
      if (indice !== -1) {
        const tarefaRemovida = this.tarefas.splice(indice, 1)[0];
        this.salvarTarefas();
        this.renderizarTarefas();
        Logger.info("Tarefa removida:", tarefaRemovida);
      }
    }
  }

  /**
   * Aplica filtro às tarefas
   * @param {string} filtro - Tipo de filtro
   */
  aplicarFiltro(filtro) {
    this.filtroAtivo = filtro;

    document.querySelectorAll(".filtro-item").forEach((item) => {
      item.classList.remove("ativo");
    });
    document.querySelector(`[data-filtro="${filtro}"]`).classList.add("ativo");

    this.renderizarTarefas();
    Logger.info(`Filtro aplicado: ${filtro}`);
  }

  /**
   * Define projeto ativo para filtragem
   * @param {string} projetoId - ID do projeto
   */
  definirProjetoAtivo(projetoId) {
    this.projetoAtivo = projetoId;
    this.renderizarTarefas();
    Logger.info(`Projeto ativo: ${projetoId}`);
  }

  atualizarOpcoesProjetoNoFormulario() {
    const projetoSelect = document.getElementById("projeto-tarefa");
    const projetos = gerenciadorProjetos.projetos;

    projetoSelect.innerHTML = '<option value="">Sem projeto</option>';

    projetos.forEach((projeto) => {
      const opcao = document.createElement("option");
      opcao.value = projeto.id;
      opcao.textContent = projeto.nome;
      projetoSelect.appendChild(opcao);
    });
  }

  /**
   * Filtra tarefas com base no projeto ativo e filtros
   * @returns {Array} Tarefas filtradas
   */
  obterTarefasFiltradas() {
    let tarefasFiltradas = [...this.tarefas];

    if (this.projetoAtivo !== "todos") {
      tarefasFiltradas = tarefasFiltradas.filter(
        (tarefa) => tarefa.projetoId === this.projetoAtivo
      );
    }

    switch (this.filtroAtivo) {
      case "pendentes":
        tarefasFiltradas = tarefasFiltradas.filter((t) => !t.concluida);
        break;
      case "concluidas":
        tarefasFiltradas = tarefasFiltradas.filter((t) => t.concluida);
        break;
      case "alta":
        tarefasFiltradas = tarefasFiltradas.filter(
          (t) => t.prioridade === "alta"
        );
        break;
      case "media":
        tarefasFiltradas = tarefasFiltradas.filter(
          (t) => t.prioridade === "media"
        );
        break;
      case "baixa":
        tarefasFiltradas = tarefasFiltradas.filter(
          (t) => t.prioridade === "baixa"
        );
        break;
    }

    return tarefasFiltradas;
  }

  renderizarTarefas() {
    const container = document.getElementById("lista-tarefas");
    const tarefasFiltradas = this.obterTarefasFiltradas();

    if (tarefasFiltradas.length === 0) {
      container.innerHTML = `
                        <div class="estado-vazio">
                            <i>📝</i>
                            <p>Nenhuma tarefa encontrada para os filtros selecionados.</p>
                        </div>
                    `;
      return;
    }

    tarefasFiltradas.sort((a, b) => {
      if (a.concluida !== b.concluida) {
        return a.concluida ? 1 : -1;
      }

      const prioridades = { alta: 3, media: 2, baixa: 1 };
      return prioridades[b.prioridade] - prioridades[a.prioridade];
    });

    container.innerHTML = tarefasFiltradas
      .map((tarefa) => this.criarElementoTarefa(tarefa))
      .join("");
  }

  /**
   * Cria HTML para uma tarefa
   * @param {Object} tarefa - Dados da tarefa
   * @returns {string} HTML da tarefa
   */
  criarElementoTarefa(tarefa) {
    const projeto = gerenciadorProjetos.projetos.find(
      (p) => p.id === tarefa.projetoId
    );
    const nomeProjeto = projeto ? projeto.nome : "Sem projeto";

    const dataVencimento = tarefa.dataVencimento
      ? new Date(tarefa.dataVencimento).toLocaleDateString("pt-BR")
      : "Sem prazo";

    return `
                    <div class="tarefa-item ${
                      tarefa.concluida ? "concluida" : ""
                    }">
                        <div class="tarefa-header">
                            <input type="checkbox" class="tarefa-checkbox" 
                                   ${tarefa.concluida ? "checked" : ""} 
                                   onchange="gerenciadorTarefas.alternarConclusao('${
                                     tarefa.id
                                   }')">
                            <h3 class="tarefa-titulo ${
                              tarefa.concluida ? "concluida" : ""
                            }">${tarefa.titulo}</h3>
                            <span class="tarefa-prioridade prioridade-${
                              tarefa.prioridade
                            }">${tarefa.prioridade}</span>
                        </div>
                        
                        ${
                          tarefa.descricao
                            ? `<p class="tarefa-descricao">${tarefa.descricao}</p>`
                            : ""
                        }
                        
                        <div class="tarefa-metadata">
                            <div>
                                <span>📁 ${nomeProjeto}</span> | 
                                <span>📅 ${dataVencimento}</span>
                            </div>
                            <div class="tarefa-acoes">
                                <button class="btn-pequeno" onclick="gerenciadorTarefas.mostrarFormulario(${JSON.stringify(
                                  tarefa
                                ).replace(/"/g, "&quot;")})" title="Editar">
                                    ✏️
                                </button>
                                <button class="btn-pequeno" onclick="gerenciadorTarefas.removerTarefa('${
                                  tarefa.id
                                }')" title="Excluir">
                                    🗑️
                                </button>
                            </div>
                        </div>
                    </div>
                `;
  }
}

/**
 * Classe para gerenciar projetos
 * @class GerenciadorProjetos
 */
class GerenciadorProjetos {
  constructor() {
    this.projetos = [];
    this.projetoEditando = null;
    this.carregarProjetos();
    this.inicializarEventos();
  }

  inicializarEventos() {
    Logger.info("Eventos do gerenciador de projetos inicializados");
  }

  carregarProjetos() {
    this.projetos = GerenciadorArmazenamento.carregar("projetos", []);
    Logger.info(`${this.projetos.length} projetos carregados`);
    this.renderizarProjetos();
  }

  salvarProjetos() {
    GerenciadorArmazenamento.salvar("projetos", this.projetos);
  }

  /**
   * Gera ID único para novo projeto
   * @returns {string} ID único
   */
  gerarId() {
    return (
      "projeto_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
    );
  }

  /**
   * Mostra formulário para adicionar/editar projeto
   * @param {Object} projeto - Projeto para edição (opcional)
   */
  mostrarFormulario(projeto = null) {
    const formulario = document.getElementById("form-projeto");
    const nomeInput = document.getElementById("nome-projeto");

    if (projeto) {
      this.projetoEditando = projeto;
      nomeInput.value = projeto.nome;
      Logger.info("Editando projeto:", projeto);
    } else {
      this.projetoEditando = null;
      nomeInput.value = "";
      Logger.info("Criando novo projeto");
    }

    formulario.classList.add("ativo");
    formulario.classList.remove("oculto");
    nomeInput.focus();
  }

  cancelarEdicao() {
    const formulario = document.getElementById("form-projeto");
    formulario.classList.remove("ativo");
    formulario.classList.add("oculto");
    this.projetoEditando = null;
    Logger.info("Edição de projeto cancelada");
  }

  adicionarProjeto() {
    const nome = document.getElementById("nome-projeto").value.trim();

    if (!nome) {
      alert("O nome do projeto é obrigatório.");
      return;
    }

    const projetoExistente = this.projetos.find(
      (p) =>
        p.nome.toLowerCase() === nome.toLowerCase() &&
        (!this.projetoEditando || p.id !== this.projetoEditando.id)
    );

    if (projetoExistente) {
      alert("Já existe um projeto com este nome.");
      return;
    }

    if (this.projetoEditando) {
      const indice = this.projetos.findIndex(
        (p) => p.id === this.projetoEditando.id
      );
      if (indice !== -1) {
        this.projetos[indice].nome = nome;
        Logger.info("Projeto atualizado:", this.projetos[indice]);
      }
    } else {
      const novoProjeto = {
        id: this.gerarId(),
        nome,
        dataCriacao: new Date().toISOString(),
      };
      this.projetos.push(novoProjeto);
      Logger.info("Novo projeto criado:", novoProjeto);
    }

    this.salvarProjetos();
    this.renderizarProjetos();
    this.cancelarEdicao();

    gerenciadorTarefas.atualizarOpcoesProjetoNoFormulario();
  }

  /**
   * Remove um projeto
   * @param {string} id - ID do projeto
   */
  removerProjeto(id) {
    const projeto = this.projetos.find((p) => p.id === id);
    if (!projeto) return;

    const tarefasAssociadas = gerenciadorTarefas.tarefas.filter(
      (t) => t.projetoId === id
    );

    let confirmar = true;
    if (tarefasAssociadas.length > 0) {
      confirmar = confirm(
        `Este projeto possui ${tarefasAssociadas.length} tarefa(s) associada(s). ` +
          `Deseja excluir o projeto mesmo assim? As tarefas ficarão sem projeto.`
      );
    }

    if (confirmar) {
      tarefasAssociadas.forEach((tarefa) => {
        tarefa.projetoId = null;
      });
      gerenciadorTarefas.salvarTarefas();

      const indice = this.projetos.findIndex((p) => p.id === id);
      if (indice !== -1) {
        const projetoRemovido = this.projetos.splice(indice, 1)[0];
        this.salvarProjetos();
        this.renderizarProjetos();

        if (gerenciadorTarefas.projetoAtivo === id) {
          this.selecionarProjeto("todos");
        }

        gerenciadorTarefas.atualizarOpcoesProjetoNoFormulario();
        gerenciadorTarefas.renderizarTarefas();

        Logger.info("Projeto removido:", projetoRemovido);
      }
    }
  }

  /**
   * Seleciona um projeto como ativo
   * @param {string} projetoId - ID do projeto
   */
  selecionarProjeto(projetoId) {
    document.querySelectorAll(".projeto-item").forEach((item) => {
      item.classList.remove("ativo");
    });
    document
      .querySelector(`[data-projeto-id="${projetoId}"]`)
      .classList.add("ativo");

    const tituloSecao = document.getElementById("titulo-secao");
    if (projetoId === "todos") {
      tituloSecao.textContent = "Todas as Tarefas";
    } else {
      const projeto = this.projetos.find((p) => p.id === projetoId);
      tituloSecao.textContent = projeto
        ? projeto.nome
        : "Projeto não encontrado";
    }

    gerenciadorTarefas.definirProjetoAtivo(projetoId);
    Logger.info(`Projeto selecionado: ${projetoId}`);
  }

  renderizarProjetos() {
    const container = document.getElementById("lista-projetos");

    if (this.projetos.length === 0) {
      container.innerHTML =
        '<p style="text-align: center; color: #a0aec0; padding: 1rem;">Nenhum projeto criado</p>';
      return;
    }

    const projetosOrdenados = [...this.projetos].sort((a, b) =>
      a.nome.localeCompare(b.nome)
    );

    container.innerHTML = projetosOrdenados
      .map(
        (projeto) => `
                    <div class="projeto-item" data-projeto-id="${
                      projeto.id
                    }" onclick="gerenciadorProjetos.selecionarProjeto('${
          projeto.id
        }')">
                        <span>📁 ${projeto.nome}</span>
                        <div class="projeto-acoes" onclick="event.stopPropagation()">
                            <button class="btn-pequeno" onclick="gerenciadorProjetos.mostrarFormulario(${JSON.stringify(
                              projeto
                            ).replace(/"/g, "&quot;")})" title="Editar">
                                ✏️
                            </button>
                            <button class="btn-pequeno" onclick="gerenciadorProjetos.removerProjeto('${
                              projeto.id
                            }')" title="Excluir">
                                🗑️
                            </button>
                        </div>
                    </div>
                `
      )
      .join("");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  Logger.info("Inicializando Sistema de Gerenciamento de Tarefas");

  window.gerenciadorProjetos = new GerenciadorProjetos();
  window.gerenciadorTarefas = new GerenciadorTarefas();

  document.getElementById("form-projeto").classList.add("oculto");
  document.getElementById("form-tarefa").classList.add("oculto");

  Logger.info("Sistema inicializado com sucesso");
});
