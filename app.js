/**
 * APP.JS — interface do Simulador de Sociedades v3.
 * Mantém o HTML existente e liga-o ao motor modular.
 */
import { Simulacao } from "./motor/simulacao.js";

let perfilPais = null;
let paisSelecionado = null;
let graficos = {};

const CORES = ["#60a5fa", "#34d399", "#fbbf24", "#f87171", "#a78bfa"];

function porId(id) {
  return document.getElementById(id);
}

function numero(id, fallback = 0) {
  const valor = Number(porId(id)?.value);
  return Number.isFinite(valor) ? valor : fallback;
}

function fmt(valor, casas = 0) {
  return Number(valor).toLocaleString("pt-PT", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

function bandeira(iso2) {
  if (!iso2 || iso2.length !== 2) return "🌐";
  const base = 0x1f1e6 - 65;
  return String.fromCodePoint(base + iso2.toUpperCase().charCodeAt(0), base + iso2.toUpperCase().charCodeAt(1));
}

function dadosBase() {
  return location.pathname.includes("/dist/") ? "../dados" : "dados";
}

function obterListaPaises() {
  return Array.isArray(window.PAISES_MUNDO) ? [...window.PAISES_MUNDO] : [];
}

function renderizarPaises() {
  const container = porId("lista-paises");
  if (!container) return;
  const termo = (porId("pesquisa-pais")?.value || "").trim().toLocaleLowerCase("pt-PT");
  const regiao = porId("filtro-regiao")?.value || "";
  const ordem = porId("ordenar-pais")?.value || "nome";
  const traducoes = { Portugal: "Portugal", Spain: "Espanha", France: "França", Germany: "Alemanha", Brazil: "Brasil" };
  const paises = obterListaPaises().map((pais) => {
    const item = { ...pais, nome_pt: traducoes[pais.nome] || pais.nome };
    if (pais.iso3 === "PRT" && window.__PORTUGAL__) {
      item.populacao = window.__PORTUGAL__.sistemas.demografia.populacao;
      item.pib_per_capita = window.__PORTUGAL__.sistemas.economia.pib_per_capita;
      item.idade_media = window.__PORTUGAL__.sistemas.demografia.idade_media;
    }
    return item;
  });
  const filtrados = paises.filter((pais) =>
    (!termo || `${pais.nome_pt} ${pais.nome} ${pais.iso3}`.toLocaleLowerCase("pt-PT").includes(termo)) &&
    (!regiao || pais.regiao.trim() === regiao)
  );

  if (ordem === "populacao") filtrados.sort((a, b) => b.populacao - a.populacao);
  else if (ordem === "pib") filtrados.sort((a, b) => b.pib_per_capita - a.pib_per_capita);
  else if (ordem === "idade") filtrados.sort((a, b) => b.idade_media - a.idade_media);
  else filtrados.sort((a, b) => a.nome_pt.localeCompare(b.nome_pt, "pt-PT"));

  porId("contador-paises").textContent = `${filtrados.length} país${filtrados.length === 1 ? "" : "es"}`;
  container.replaceChildren();
  for (const pais of filtrados) {
    const cartao = document.createElement("button");
    cartao.type = "button";
    cartao.className = "cartao-pais";
    cartao.classList.toggle("selecionado", paisSelecionado?.iso3 === pais.iso3);
    cartao.classList.toggle("sugerido", pais.iso3 === "PRT");
    cartao.innerHTML = `<span class="bandeira">${bandeira(pais.iso2)}</span><span class="info-pais"><span class="nome-pais"></span><span class="stats-pais"></span></span>`;
    cartao.querySelector(".nome-pais").textContent = pais.nome_pt;
    cartao.querySelector(".stats-pais").textContent = `${fmt(pais.populacao)} hab. · ${fmt(pais.pib_per_capita)} € PIB per capita`;
    cartao.addEventListener("click", () => selecionarPais(pais));
    container.appendChild(cartao);
  }
}

function inicializarFiltroRegioes() {
  const select = porId("filtro-regiao");
  if (!select) return;
  const regioes = [...new Set(obterListaPaises().map((pais) => pais.regiao.trim()))].sort();
  for (const regiao of regioes) {
    const opcao = document.createElement("option");
    opcao.value = regiao;
    opcao.textContent = regiao;
    select.appendChild(opcao);
  }
}

function selecionarPais(pais) {
  paisSelecionado = pais;
  porId("pais-selecionado-texto").textContent = `${bandeira(pais.iso2)} ${pais.nome_pt} selecionado`;
  porId("btn-pais-proximo").disabled = false;
  renderizarPaises();
}

function filtrarPaises() {
  renderizarPaises();
}

async function carregarPerfilPais(pais) {
  if (pais.iso3 === "PRT" && window.__PORTUGAL__) {
    return JSON.parse(JSON.stringify(window.__PORTUGAL__));
  }
  if (pais.iso3 === "PRT") {
    const respostaPortugal = await fetch(`${dadosBase()}/portugal.json`);
    if (respostaPortugal.ok) return respostaPortugal.json();
  }
  const nomeFicheiro = `${pais.iso3.toLowerCase()}.json`;
  const embutido = window.__PAISES_DADOS__?.[nomeFicheiro];
  if (embutido) return JSON.parse(JSON.stringify(embutido));
  const resposta = await fetch(`${dadosBase()}/paises/${nomeFicheiro}`);
  if (!resposta.ok) throw new Error(`Não foi possível carregar os dados de ${pais.nome_pt} (HTTP ${resposta.status}).`);
  return resposta.json();
}

async function irParaCenario() {
  if (!paisSelecionado) return;
  try {
    perfilPais = await carregarPerfilPais(paisSelecionado);
    porId("bandeira-pais-cenario").textContent = bandeira(paisSelecionado.iso2);
    porId("nome-pais-cenario").textContent = paisSelecionado.nome_pt;
    porId("ecra-pais").classList.remove("ativo");
    porId("ecra-criar-pais").classList.remove("ativo");
    porId("ecra-cenario").classList.add("ativo");
    porId("resultado").style.display = "none";
    porId("graficos").style.display = "none";
    window.scrollTo(0, 0);
  } catch (erro) {
    alert(`Erro ao carregar país: ${erro.message}`);
  }
}

function mostrarEcraPais(id) {
  for (const ecra of ["ecra-pais", "ecra-criar-pais", "ecra-cenario"]) {
    porId(ecra)?.classList.toggle("ativo", ecra === id);
  }
  window.scrollTo(0, 0);
}

function voltarParaPaises() {
  mostrarEcraPais("ecra-pais");
}

function irParaCriarPais() {
  mostrarEcraPais("ecra-criar-pais");
}

function abrirUploadPais() {
  porId("input-upload-pais").click();
}

function lerFormularioPais() {
  const percentagem = (id) => numero(id) / 100;
  const setores = {
    agricultura: percentagem("cp-agricultura"),
    industria: percentagem("cp-industria"),
    servicos: percentagem("cp-servicos"),
    tecnologia: percentagem("cp-tecnologia"),
  };
  const somaSetores = Object.values(setores).reduce((soma, valor) => soma + valor, 0);
  if (somaSetores <= 0) throw new Error("A soma dos setores tem de ser superior a zero.");
  for (const setor of Object.keys(setores)) setores[setor] /= somaSetores;

  return {
    nome: porId("cp-nome").value.trim() || "País personalizado",
    iso3: "CUS",
    regiao: "Personalizado",
    ano_base: numero("cp-ano", 2026),
    sistemas: {
      demografia: {
        populacao: numero("cp-populacao"), idade_media: numero("cp-idade"),
        fertilidade: numero("cp-fertilidade"), esperanca_vida: numero("cp-esperanca"),
        saldo_migratorio_anual: numero("cp-migracao"), mortalidade_base: 0.011,
        composicao_etaria: { jovens: 0.13, ativos: 0.63, reformados: 0.24 },
      },
      economia: {
        pib_per_capita: numero("cp-pib"), salario_medio: numero("cp-salario"),
        desemprego: percentagem("cp-desemprego"), inflacao: percentagem("cp-inflacao"),
        crescimento_real_base: 0.01, produtividade_base: 1,
        consumo_pct_pib: 0.65, investimento_pct_pib: 0.20,
      },
      trabalho: { taxa_participacao: 0.60, desemprego: percentagem("cp-desemprego"), setores },
      educacao: { anos_escolaridade: numero("cp-escolaridade"), qualificacao_media: percentagem("cp-qualificacao"), fuga_cerebros: 0.015 },
      financas: { divida_pct_pib: percentagem("cp-divida"), juro_medio_divida: percentagem("cp-juro") },
      estado: { irs_medio: 0.20, tsu_media: 0.2375, iva_medio: 0.23, outras_pct_pib: 0.05 },
      habitacao: { preco_m2: numero("cp-preco-m2"), renda_media: numero("cp-renda"), stock_habitacao: numero("cp-populacao") * 0.5 },
      sociedade: { gini: numero("cp-gini"), confianca_institucional: percentagem("cp-confianca"), satisfacao_vida: percentagem("cp-satisfacao") },
      clima: { emissoes_co2_per_capita: numero("cp-emissoes"), percentagem_renovaveis: percentagem("cp-renovaveis"), dependencia_externa: percentagem("cp-dependencia"), preco_energia_indice: 100 },
    },
  };
}

function guardarPaisPersonalizado() {
  try {
    perfilPais = lerFormularioPais();
    paisSelecionado = { nome_pt: perfilPais.nome, iso2: "", iso3: "CUS" };
    porId("bandeira-pais-cenario").textContent = "🌍";
    porId("nome-pais-cenario").textContent = perfilPais.nome;
    mostrarEcraPais("ecra-cenario");
  } catch (erro) {
    alert(erro.message);
  }
}

function descarregarPaisPersonalizado() {
  try {
    const dados = lerFormularioPais();
    const ficheiro = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(ficheiro);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${dados.nome.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (erro) {
    alert(erro.message);
  }
}

async function carregarPaisUpload(evento) {
  const ficheiro = evento.target.files?.[0];
  if (!ficheiro) return;
  try {
    const dados = JSON.parse(await ficheiro.text());
    if (!dados.nome || !dados.sistemas?.demografia || !dados.sistemas?.economia) {
      throw new Error("O JSON precisa de nome, demografia e economia.");
    }
    perfilPais = dados;
    paisSelecionado = { nome_pt: dados.nome, iso2: dados.iso2 || "", iso3: dados.iso3 || "CUS" };
    porId("bandeira-pais-cenario").textContent = bandeira(paisSelecionado.iso2);
    porId("nome-pais-cenario").textContent = dados.nome;
    mostrarEcraPais("ecra-cenario");
  } catch (erro) {
    alert(`Não foi possível carregar o país: ${erro.message}`);
  } finally {
    evento.target.value = "";
  }
}

async function preencherExemplo(nomeFicheiro) {
  try {
    let perfil = window.__PAISES_DADOS__?.[nomeFicheiro];
    if (!perfil) {
      const resposta = await fetch(`${dadosBase()}/paises/${nomeFicheiro}`);
      if (!resposta.ok) throw new Error("Exemplo histórico indisponível nesta versão.");
      perfil = await resposta.json();
    }
    const s = perfil.sistemas;
    const valores = {
      "cp-nome": perfil.nome, "cp-ano": perfil.ano_base,
      "cp-populacao": s.demografia.populacao, "cp-idade": s.demografia.idade_media,
      "cp-fertilidade": s.demografia.fertilidade, "cp-esperanca": s.demografia.esperanca_vida,
      "cp-migracao": s.demografia.saldo_migratorio_anual, "cp-pib": s.economia.pib_per_capita,
      "cp-salario": s.economia.salario_medio, "cp-desemprego": s.economia.desemprego * 100,
      "cp-inflacao": (s.economia.inflacao || 0.02) * 100,
      "cp-agricultura": s.trabalho.setores.agricultura * 100, "cp-industria": s.trabalho.setores.industria * 100,
      "cp-servicos": s.trabalho.setores.servicos * 100, "cp-tecnologia": s.trabalho.setores.tecnologia * 100,
      "cp-escolaridade": s.educacao.anos_escolaridade, "cp-qualificacao": s.educacao.qualificacao_media * 100,
      "cp-divida": s.financas.divida_pct_pib * 100, "cp-juro": s.financas.juro_medio_divida * 100,
      "cp-preco-m2": s.habitacao.preco_m2, "cp-renda": s.habitacao.renda_media,
      "cp-gini": s.sociedade.gini, "cp-confianca": s.sociedade.confianca_institucional * 100,
      "cp-satisfacao": s.sociedade.satisfacao_vida * 100,
      "cp-emissoes": s.clima.emissoes_co2_per_capita,
      "cp-renovaveis": s.clima.percentagem_renovaveis * 100,
      "cp-dependencia": s.clima.dependencia_externa * 100,
    };
    for (const [id, valor] of Object.entries(valores)) if (valor !== undefined) porId(id).value = valor;
  } catch (erro) {
    alert(erro.message);
  }
}

function preencherComAlemanha2004() { return preencherExemplo("deu_2004.json"); }
function preencherComPortugal2004() { return preencherExemplo("prt_2004.json"); }

function destruirGraficos() {
  for (const grafico of Object.values(graficos)) grafico?.destroy();
  graficos = {};
}

function criarGraficos(historico, anoBase) {
  destruirGraficos();
  const anos = historico.ano.map((ano) => anoBase + ano);
  const definicoes = [
    ["g-populacao", "População", [["População (habitantes)", historico.populacao]]],
    ["g-economia", "Economia", [["PIB per capita nominal (€)", historico.pib_per_capita], ["PIB per capita real (€ base)", historico.pib_per_capita_real], ["Salário médio nominal (€)", historico.salario_medio]]],
    ["g-monetaria", "Política monetária", [["Inflação (%)", historico.inflacao_actual.map((v) => v * 100)], ["Taxa directora (%)", historico.taxa_juro_directora.map((v) => v * 100)], ["Taxa de crédito (%)", historico.taxa_credito.map((v) => v * 100)]]],
    ["g-politica", "Sistema político", [["Aprovação (%)", historico.aprovacao_governo.map((v) => v * 100)], ["Apoio governo (%)", historico.apoio_governo.map((v) => v * 100)], ["Implementação (%)", historico.implementacao_politicas.map((v) => v * 100)]]],
    ["g-externo", "Comércio externo", [["Exportações (% PIB)", historico.exportacoes.map((v, i) => historico.setor_externo_ativo[i] ? v / historico.pib[i] * 100 : null)], ["Importações (% PIB)", historico.importacoes.map((v, i) => historico.setor_externo_ativo[i] ? v / historico.pib[i] * 100 : null)], ["Conta corrente (% PIB)", historico.conta_corrente_pct_pib.map((v) => v === null ? null : v * 100)]]],
    ["g-cambio", "Câmbio e preços importados", [["Câmbio (moeda local/USD)", historico.cambio_local_usd], ["Índice preço importação", historico.indice_preco_importacao]]],
    ["g-reservas", "Reservas", [["Meses de importação", historico.reservas_meses_importacao]]],
    ["g-trabalho", "Trabalho", [["Desemprego (%)", historico.desemprego.map((v) => v * 100)], ["Qualificação (%)", historico.qualificacao_media.map((v) => v * 100)], ["Automação média (%)", historico.automacao_media.map((v) => v * 100)]]],
    ["g-divida", "Finanças", [["Dívida (% PIB)", historico.divida_pct_pib.map((v) => v * 100)], ["Receita carbono (€)", historico.receita_carbono]]],
    ["g-sociedade", "Sociedade", [["Coesão (%)", historico.coesao.map((v) => v * 100)], ["Gini × 100", historico.gini.map((v) => v * 100)], ["Satisfação (%)", historico.satisfacao.map((v) => v * 100)]]],
    ["g-habitacao", "Habitação", [["Preço m² (€)", historico.preco_m2], ["Taxa de esforço (%)", historico.taxa_esforco.map((v) => v * 100)]]],
    ["g-clima-emissoes", "Clima", [["Emissões CO₂ (t/hab.)", historico.emissoes_co2_per_capita], ["Renováveis (%)", historico.percentagem_renovaveis.map((v) => v * 100)]]],
    ["g-clima-energia", "Energia", [["Preço energia (índice)", historico.preco_energia_indice], ["Dependência externa (%)", historico.dependencia_externa.map((v) => v * 100)]]],
  ];
  for (const [id, titulo, series] of definicoes) {
    const canvas = porId(id);
    if (!canvas) continue;
    graficos[id] = new Chart(canvas, {
      type: "line",
      data: { labels: anos, datasets: series.map(([label, data], i) => ({
        label, data, borderColor: CORES[i % CORES.length], backgroundColor: "transparent",
        borderWidth: 2, pointRadius: 0, tension: 0.2,
      })) },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: { title: { display: false, text: titulo }, legend: { labels: { color: "#cbd5e1" } } },
        scales: {
          x: { ticks: { color: "#94a3b8", maxTicksLimit: 8 }, grid: { color: "rgba(148,163,184,.1)" } },
          y: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(148,163,184,.1)" } },
        },
      },
    });
  }
  porId("graficos").style.display = "grid";
}

function formatarResumo(h, perfil, anos) {
  const n = h.ano.length - 1;
  return [
    `País: ${perfil.nome}`,
    `Período: ${perfil.ano_base}–${perfil.ano_base + anos}`,
    "",
    `População: ${fmt(h.populacao[0])} → ${fmt(h.populacao[n])} habitantes`,
    `PIB per capita: ${fmt(h.pib_per_capita[0])} → ${fmt(h.pib_per_capita[n])} €/ano`,
    `PIB per capita real: ${fmt(h.pib_per_capita_real[n])} €/ano (preços do ano base)`,
    `Salário médio: ${fmt(h.salario_medio[0])} → ${fmt(h.salario_medio[n])} €/ano`,
    `Desemprego: ${fmt(h.desemprego[0] * 100, 1)}% → ${fmt(h.desemprego[n] * 100, 1)}%`,
    `Automação média: ${fmt(h.automacao_media[n] * 100, 1)}%`,
    `Efeito anual da automação: ${fmt(h.substituicao_empregos_automacao[n] * 100, 2)} pp substituídos; ${fmt(h.novas_atividades_automacao[n] * 100, 2)} pp em novas atividades`,
    `Inflação final: ${fmt(h.inflacao_actual[n] * 100, 1)}%`,
    `Expectativas de inflação: ${fmt(h.expectativas_inflacao[n] * 100, 1)}%`,
    `Taxa directora / crédito: ${fmt(h.taxa_juro_directora[n] * 100, 2)}% / ${fmt(h.taxa_credito[n] * 100, 2)}%`,
    `Consumo / investimento: ${fmt(h.consumo_pct_pib[n] * 100, 1)}% / ${fmt(h.investimento_pct_pib[n] * 100, 1)}% do PIB`,
    `Receitas / despesas públicas: ${fmt(h.receita[n] / 1_000_000_000, 1)} / ${fmt(h.despesa[n] / 1_000_000_000, 1)} mil M€`,
    `Saldo orçamental: ${fmt(h.saldo[n] / 1_000_000_000, 1)} mil M€ (${fmt(h.saldo[n] / Math.max(h.pib[n], 1) * 100, 1)}% do PIB)`,
    `Dívida pública: ${fmt(h.divida_pct_pib[0] * 100, 1)}% → ${fmt(h.divida_pct_pib[n] * 100, 1)}% do PIB`,
    `Serviço anual da dívida: ${fmt(h.juros_divida[n] / 1_000_000_000, 1)} mil M€`,
    ...(h.setor_externo_ativo[n]
      ? [
          `Exportações / importações: ${fmt(h.exportacoes[n] / 1_000_000_000, 1)} / ${fmt(h.importacoes[n] / 1_000_000_000, 1)} mil M€`,
          `Balança comercial / conta corrente: ${fmt(h.balanca_comercial[n] / 1_000_000_000, 1)} / ${fmt(h.conta_corrente[n] / 1_000_000_000, 1)} mil M€ (${fmt(h.conta_corrente_pct_pib[n] * 100, 2)}% PIB)`,
          `Necessidade de financiamento externo: ${fmt(h.necessidade_financiamento_externo[n] / 1_000_000_000, 1)} mil M€`,
          ...(Number.isFinite(h.fluxos_capitais_pct_pib[n])
            ? [
                `Fluxos de carteira: ${fmt(h.fluxos_capitais_pct_pib[n] * 100, 2)}% PIB`,
                `Câmbio local/USD: ${fmt(h.cambio_local_usd[n], 4)}; preço importado: ${fmt(h.indice_preco_importacao[n], 3)}`,
                `Reservas: ${Number.isFinite(h.reservas_meses_importacao[n]) ? `${fmt(h.reservas_meses_importacao[n], 2)} meses de importações` : "sem observação"}`,
                `Contribuição da inflação importada: ${fmt(h.inflacao_importada[n] * 100, 2)} pp`,
              ]
            : ["Câmbio e fluxos de capital: sem cotação observada para este perfil"]),
        ]
      : ["Setor externo: dados de comércio não disponíveis para este perfil"]),
    `Habitação: ${fmt(h.preco_m2[n])} €/m²; esforço ${fmt(h.taxa_esforco[n] * 100, 1)}%`,
    `Coesão: ${fmt(h.coesao[n] * 100, 1)}%; Gini ${fmt(h.gini[n], 3)}`,
    `Regime: ${h.regime_politico[n]}; governo: ${h.partido_governo[n]} | oposição: ${h.partido_oposicao[n]}`,
    `Aprovação / apoio do governo: ${fmt(h.aprovacao_governo[n] * 100, 1)}% / ${fmt(h.apoio_governo[n] * 100, 1)}%`,
    `Implementação efectiva das políticas: ${fmt(h.implementacao_politicas[n] * 100, 1)}%; eleições no horizonte: ${h.eleicao_realizada.filter(Boolean).length}`,
    `Renováveis: ${fmt(h.percentagem_renovaveis[n] * 100, 1)}%; emissões ${fmt(h.emissoes_co2_per_capita[n], 2)} t/hab.`,
    `Anos com crise: ${h.crise_ativa.filter(Boolean).length} de ${anos}`,
  ].join("\n");
}

function lerConfiguracao() {
  const anos = Math.trunc(numero("input-anos", 30));
  if (anos < 1 || anos > 100) throw new Error("O horizonte deve estar entre 1 e 100 anos.");
  return {
    anos,
    subsidio_filho: numero("input-subsidio"),
    investimento_educacao: numero("input-educacao") / 100,
    investimento_infra: numero("input-infra") / 100,
    investimento_verde: numero("input-verde") / 100,
    carbono_tax_eur_ton: numero("input-carbono"),
    subsidio_renda: numero("input-subsidio-renda"),
    investimento_habitacao: numero("input-invest-habitacao") / 100,
    crescimento_procura_externa: numero("input-procura-externa") / 100,
    taxa_juro_externa: numero("input-juro-externo") / 100,
    inflacao_externa: numero("input-inflacao-externa") / 100,
    intervencao_reservas_pct_fluxo: numero("input-intervencao-reservas") / 100,
    politica: {
      regime: porId("input-regime").value,
      qualidade_institucional: numero("input-instituicoes") / 100,
      influencia_grupos_interesse: numero("input-grupos-interesse") / 100,
      ciclo_eleitoral: Math.trunc(numero("input-ciclo-eleitoral", 4)),
      preferencias_eleitorado: {
        intervencao_economica: numero("input-pref-intervencao") / 100,
        tradicionalismo_social: numero("input-pref-tradicao") / 100,
        abertura_externa: numero("input-pref-abertura") / 100,
        prioridade_climatica: numero("input-pref-clima") / 100,
      },
    },
    seed: Math.trunc(numero("input-seed", 12345)),
    crises_ativas: porId("input-crises").checked,
  };
}

window.correrTeste = function () {
  try {
    if (!perfilPais) throw new Error("Escolhe ou carrega um país primeiro.");
    const configuracao = lerConfiguracao();
    const historico = new Simulacao(perfilPais, configuracao).run();
    porId("output").textContent = formatarResumo(historico, perfilPais, configuracao.anos);
    porId("resultado").style.display = "block";
    criarGraficos(historico, perfilPais.ano_base);
  } catch (erro) {
    console.error(erro);
    alert(`Erro na simulação: ${erro.message}`);
  }
};

window.compararCenarioBase = function () {
  try {
    if (!perfilPais) throw new Error("Escolhe ou carrega um país primeiro.");
    const configuracao = lerConfiguracao();
    const configuracaoBase = {
      ...configuracao,
      subsidio_filho: 0,
      investimento_educacao: 0,
      investimento_infra: 0,
      investimento_verde: 0,
      carbono_tax_eur_ton: 0,
      subsidio_renda: 0,
      investimento_habitacao: 0,
    };
    const atual = new Simulacao(perfilPais, configuracao).run();
    const base = new Simulacao(perfilPais, configuracaoBase).run();
    const n = atual.ano.length - 1;
    const deltaPib = (atual.pib_per_capita_real[n] / Math.max(base.pib_per_capita_real[n], 1) - 1) * 100;
    const deltaDesemprego = (atual.desemprego[n] - base.desemprego[n]) * 100;
    const deltaDivida = (atual.divida_pct_pib[n] - base.divida_pct_pib[n]) * 100;
    const deltaEsforco = (atual.taxa_esforco[n] - base.taxa_esforco[n]) * 100;
    const deltaCoesao = (atual.coesao[n] - base.coesao[n]) * 100;

    porId("output").textContent = [
      formatarResumo(atual, perfilPais, configuracao.anos),
      "",
      "COMPARAÇÃO COM CENÁRIO SEM POLÍTICAS",
      `PIB real per capita: ${deltaPib >= 0 ? "+" : ""}${fmt(deltaPib, 1)}%`,
      `Desemprego: ${deltaDesemprego >= 0 ? "+" : ""}${fmt(deltaDesemprego, 1)} pp`,
      `Dívida pública: ${deltaDivida >= 0 ? "+" : ""}${fmt(deltaDivida, 1)} pp do PIB`,
      `Taxa de esforço: ${deltaEsforco >= 0 ? "+" : ""}${fmt(deltaEsforco, 1)} pp`,
      `Coesão: ${deltaCoesao >= 0 ? "+" : ""}${fmt(deltaCoesao, 1)} pp`,
      `Ambos usam seed ${configuracao.seed}. Choques são endógenos: a activação pode divergir quando as condições económicas divergem.`,
    ].join("\n");
    porId("resultado").style.display = "block";
    criarGraficos(atual, perfilPais.ano_base);
  } catch (erro) {
    console.error(erro);
    alert(`Erro ao comparar cenários: ${erro.message}`);
  }
};

async function inicializar() {
  if (!window.PAISES_MUNDO) {
    alert("Os dados de países não foram carregados. Confirma o ficheiro dados/paises.js.");
    return;
  }
  if (!window.__PORTUGAL__) {
    try {
      const resposta = await fetch(`${dadosBase()}/portugal.json`);
      if (resposta.ok) window.__PORTUGAL__ = await resposta.json();
    } catch {
      // O perfil calibrado é opcional fora do servidor; perfis por país continuam disponíveis.
    }
  }
  inicializarFiltroRegioes();
  renderizarPaises();
}

Object.assign(window, {
  filtrarPaises, irParaCenario, voltarParaPaises, irParaCriarPais,
  abrirUploadPais, carregarPaisUpload, guardarPaisPersonalizado,
  descarregarPaisPersonalizado, preencherComAlemanha2004, preencherComPortugal2004,
});

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", inicializar);
else inicializar();