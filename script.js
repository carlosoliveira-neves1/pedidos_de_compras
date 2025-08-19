function arredondaPara99(valor) {
  if (!valor || isNaN(valor)) return null;
  const inteiro = Math.floor(valor);
  return inteiro + 0.99;
}

let produtos = [];
let produtoMap = new Map();
let fornecedorSelecionado = "todos";

// Corrigir o custo com vírgula e transformar em número
function parseCusto(valor) {
  if (typeof valor === "string") {
    valor = valor.replace(",", ".");
  }
  return parseFloat(valor);
}

async function carregarProdutos() {
  const response = await fetch("produtos.json");
  if (response.ok) {
    const dados = await response.json();
    produtos = dados.map(p => {
      const prod = {
        codigo: p.codigo,
        descricao: p.descricao || "Sem descrição",
        fornecedor: p.fornecedor || "",
        custo: parseCusto(p.custo),
        fator: 2.5
      };
      produtoMap.set(p.codigo, prod);
      return prod;
    });

    atualizarFiltroFornecedores();
    renderTabelaProdutos();
  }
}

function atualizarFiltroFornecedores() {
  const fornecedores = [...new Set(produtos.map(p => p.fornecedor).filter(f => f))];
  const select = document.getElementById("filtro-fornecedor");

  select.innerHTML = '<option value="todos">Todos</option>';

  fornecedores.forEach(fornecedor => {
    const option = document.createElement("option");
    option.value = fornecedor;
    option.textContent = fornecedor;
    select.appendChild(option);
  });
}

function renderTabelaProdutos() {
  const tabela = document.querySelector("#tabela-produtos tbody");
  tabela.innerHTML = "";

  const listaFiltrada = fornecedorSelecionado === "todos"
    ? produtos
    : produtos.filter(p => p.fornecedor === fornecedorSelecionado);

  listaFiltrada.forEach((produto) => {
    const tr = document.createElement("tr");

    // Código
    const tdCodigo = document.createElement("td");
    tdCodigo.textContent = produto.codigo;
    tr.appendChild(tdCodigo);

    // Descrição (nome do produto)
    const tdNome = document.createElement("td");
    tdNome.textContent = produto.descricao;
    tr.appendChild(tdNome);

    // Custo
    const tdCusto = document.createElement("td");
    const inputCusto = document.createElement("input");
    inputCusto.type = "number";
    inputCusto.step = "0.01";
    inputCusto.value = produto.custo || "";
    inputCusto.dataset.codigo = produto.codigo;
    inputCusto.addEventListener("change", (e) => {
      const codigo = parseInt(e.target.dataset.codigo);
      const valor = parseFloat(e.target.value);
      const prod = produtoMap.get(codigo);
      if (prod) {
        prod.custo = valor;
        atualizarPrecoSugerido(prod);
      }
    });
    tdCusto.appendChild(inputCusto);
    tr.appendChild(tdCusto);

    // Multiplicador
    const tdMult = document.createElement("td");
    const selectMult = document.createElement("select");
    selectMult.dataset.codigo = produto.codigo;

    ["2.5", "3", "4", "5"].forEach((mult) => {
      const option = document.createElement("option");
      option.value = mult;
      option.textContent = `x${mult}`;
      if (parseFloat(mult) === produto.fator) option.selected = true;
      selectMult.appendChild(option);
    });

    selectMult.addEventListener("change", (e) => {
      const codigo = parseInt(e.target.dataset.codigo);
      const fator = parseFloat(e.target.value);
      const prod = produtoMap.get(codigo);
      if (prod) {
        prod.fator = fator;
        atualizarPrecoSugerido(prod);
      }
    });

    tdMult.appendChild(selectMult);
    tr.appendChild(tdMult);

    // Preço sugerido
    const tdSugestao = document.createElement("td");
    tdSugestao.classList.add("preco-sug");
    tdSugestao.dataset.codigo = produto.codigo;
    tdSugestao.textContent = "-";
    tr.appendChild(tdSugestao);

    tabela.appendChild(tr);

    // Calcular preço sugerido inicial
    atualizarPrecoSugerido(produto);
  });
}

function atualizarPrecoSugerido(produto) {
  if (produto.custo && produto.fator) {
    let sugestao = arredondaPara99(produto.custo * produto.fator);
    const tdSug = document.querySelector(`.preco-sug[data-codigo="${produto.codigo}"]`);
    if (tdSug && sugestao) {
      tdSug.textContent = `R$ ${sugestao.toFixed(2)}`;
    }
  }
}

// ✅ Exportar como Excel (.xlsx)
function exportarProdutos() {
  const dadosExportar = produtos.map((p) => ({
    Código: p.codigo,
    Descrição: p.descricao,
    "Custo ICMS": p.custo,
    Multiplicador: `x${p.fator}`,
    "Preço Sugerido": arredondaPara99(p.custo * p.fator)?.toFixed(2) ?? "-"
  }));

  const worksheet = XLSX.utils.json_to_sheet(dadosExportar);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Produtos");

  XLSX.writeFile(workbook, "produtos_atualizado.xlsx");
}

document.addEventListener("DOMContentLoaded", () => {
  carregarProdutos();

  document.getElementById("btn-exportar").addEventListener("click", exportarProdutos);

  document.getElementById("filtro-fornecedor").addEventListener("change", (e) => {
    fornecedorSelecionado = e.target.value;
    renderTabelaProdutos();
  });
});
