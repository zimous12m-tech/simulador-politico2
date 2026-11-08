/**
 * MOTOR PRINCIPAL v3 — Fase 6 + Carbono Tax + Default + Inflação Variável + Custo Fiscal das Crises
 *
 * ORDEM DO STEP:
 *   Crises → Demografia → Educação → Trabalho → Economia
 *   → Estado → Clima → Finanças → Habitação → Sociedade
 */

import { criarDemografia } from "./sistemas/demografia.js";
import { criarEconomia } from "./sistemas/economia.js";
import { criarSetorExterno } from "./sistemas/externo.js";
import { criarPoliticaMonetaria } from "./sistemas/monetaria.js";
import { criarPolitica } from "./sistemas/politica.js";
import { criarFinancas } from "./sistemas/financas.js";
import { criarTrabalho } from "./sistemas/trabalho.js";
import { criarEducacao } from "./sistemas/educacao.js";
import { criarEstado } from "./sistemas/estado.js";
import { criarHabitacao } from "./sistemas/habitacao.js";
import { criarSociedade } from "./sistemas/sociedade.js";
import { criarCrises } from "./sistemas/crises.js";
import { criarClima } from "./sistemas/clima.js";

function safe(v, fallback = 0) {
  return Number.isFinite(v) ? v : fallback;
}

export class Simulacao {
  constructor(perfilPais, config = {}) {
    this.nome = perfilPais.nome;
    this.ano_base = perfilPais.ano_base;
    this.anos = config.anos || 30;

    const s = perfilPais.sistemas;

    this.demografia = criarDemografia(s.demografia);
    const ativosBase = Number(s.demografia.composicao_etaria?.ativos) || 0.63;
    const participacaoBase = Number(s.trabalho?.taxa_participacao) || 0.60;
    const desempregoBase = Number(s.trabalho?.desemprego ?? s.economia.desemprego) || 0.06;
    this.economia = criarEconomia({
      ...s.economia,
      empregados_base_fracao: ativosBase * participacaoBase * (1 - desempregoBase),
    });
    this.externo = criarSetorExterno(
      s.externo || {},
      this.economia.pib_per_capita_inicial * this.demografia.populacao
    );
    this.monetaria = criarPoliticaMonetaria(s.monetaria || {});
    this.financas = criarFinancas(s.financas);
    this.trabalho = criarTrabalho(s.trabalho || {});
    this.educacao = criarEducacao(s.educacao || {});
    this.estado = criarEstado(s.estado || {});
    this.politica = criarPolitica({ ...(s.politica || {}), ...(config.politica || {}) });
    this.habitacao = criarHabitacao(s.habitacao || {});
    this.sociedade = criarSociedade(s.sociedade || {});
    this.crises = criarCrises({
      seed: config.seed || 12345,
      ativas: config.crises_ativas !== false,
    });
    this.clima = criarClima(s.clima || {});

    // Guardar estado entre anos (para dependência circular)
    this._modificador_setor_verde_anterior = 0;
    this._emissoes_totais_anterior = 0;
    this._crescimento_real_anterior = 0;

    // Efeitos do default do ano anterior (aplicados no próximo step)
    this._default_pendente = {
      pib: 0,
      desemprego: 0,
      coesao: 0,
    };

    this.politicas = {
      subsidio_filho: config.subsidio_filho || 0,
      investimento_educacao: config.investimento_educacao || 0,
      investimento_infra: config.investimento_infra || 0,
      investimento_verde: config.investimento_verde || 0,
      carbono_tax_eur_ton: config.carbono_tax_eur_ton || 0,
      subsidio_renda: config.subsidio_renda || 0,
      investimento_habitacao: config.investimento_habitacao || 0,
      crescimento_procura_externa: config.crescimento_procura_externa ?? 0.02,
      taxa_juro_externa: config.taxa_juro_externa ?? 0.035,
      inflacao_externa: config.inflacao_externa ?? 0.02,
      intervencao_reservas_pct_fluxo: config.intervencao_reservas_pct_fluxo ?? 0,
    };

    this.automacao = 0.10;

    this.historico = {
      ano: [], populacao: [], idade_media: [], fertilidade: [],
      pib: [], pib_per_capita: [], salario_medio: [], desemprego: [],
      pib_per_capita_real: [], indice_precos: [], produtividade: [],
      divida_pct_pib: [], receita: [], despesa: [], saldo: [],
      despesa_primaria: [], juros_divida: [],
      exportacoes: [], importacoes: [], balanca_comercial: [],
      conta_corrente: [], conta_corrente_pct_pib: [],
      necessidade_financiamento_externo: [], setor_externo_ativo: [],
      fluxos_capitais_pct_pib: [], cambio_local_usd: [], variacao_cambio: [],
      indice_preco_importacao: [], inflacao_importada: [], reservas_meses_importacao: [],
      populacao_ativa: [], taxa_participacao: [], empregados: [],
      anos_escolaridade: [], qualificacao_media: [],
      setor_servicos: [], setor_tecnologia: [],
      automacao_media: [], substituicao_empregos_automacao: [],
      novas_atividades_automacao: [], ganho_produtividade_automacao: [],
      pensoes: [], subsidios: [], carga_fiscal: [],
      preco_m2: [], renda_media: [], taxa_esforco: [],
      stock_habitacao: [], construcao_anual: [],
      coesao: [], gini: [], confianca: [], satisfacao: [],
      receita_carbono: [],
      default_ocorreu: [],
      inflacao_actual: [],
      expectativas_inflacao: [], taxa_juro_directora: [], taxa_credito: [],
      consumo_pct_pib: [], investimento_pct_pib: [],
      regime_politico: [], partido_governo: [], partido_oposicao: [],
      aprovacao_governo: [], apoio_governo: [], apoio_oposicao: [],
      eleicao_realizada: [], qualidade_institucional: [], capacidade_estado: [],
      implementacao_politicas: [],

      // Crises
      crise_ativa: [], crise_tipo: [],
      recessao_ativa: [], crise_divida_ativa: [],
      choque_externo_ativo: [], resgate_ativo: [],
      emigracao_massa_ativa: [], fuga_cerebros_aguda_ativa: [],
      crise_energetica_ativa: [], transicao_desordenada_ativa: [],

      // Clima
      emissoes_co2_per_capita: [], emissoes_acumuladas: [],
      percentagem_renovaveis: [], dependencia_externa: [],
      preco_energia_indice: [],
      desastre_natural_ativo: [], desastre_natural_tipo: [],
    };
  }

  step() {
    const ano = this.historico.ano.length + 1;

    // Aplicar efeitos do default do ano anterior (se houve)
    const def = this._default_pendente;
    this._default_pendente = { pib: 0, desemprego: 0, coesao: 0 };

    // 0. CRISES
    const cri = this.crises.step({
      ano,
      pib_per_capita: this.economia.pib_per_capita,
      pib_per_capita_inicial: this.economia.pib_per_capita_inicial,
      desemprego: this.trabalho.desemprego || 0.06,
      divida_pct_pib: this.financas.divida_pct_pib,
      coesao: this.sociedade.coesao,
      salario_medio: this.economia.salario_medio,
      qualificacao_media: this.educacao.qualificacao_media,
      preco_energia_indice: this.clima.preco_energia_indice,
      percentagem_renovaveis: this.clima.percentagem_renovaveis,
    });

    // A política monetária reage aos resultados do ano anterior.
    const mon = this.monetaria.step({
      inflacao: this.economia.inflacao_actual,
      desemprego: this.trabalho.desemprego,
      divida_pct_pib: this.financas.divida_pct_pib,
    });
    const politicaAplicada = (nome) => this.politica.aplicarPolitica(nome, this.politicas[nome]);

    // 1. DEMOGRAFIA
    const dem = this.demografia.step({
      subsidio_filho: politicaAplicada("subsidio_filho"),
      coesao: this.sociedade.coesao,
      salario_medio: this.economia.salario_medio,
      modificador_migracao: cri.modificador_migracao,
      modificador_mortalidade: cri.modificador_mortalidade,
    });

    // 2. EDUCAÇÃO
    const edu = this.educacao.step({
      investimento_educacao: politicaAplicada("investimento_educacao"),
      salario_medio: this.economia.salario_medio,
      coesao: this.sociedade.coesao,
    });

    const ext = this.externo.step({
      pib_real: this.economia.pib_per_capita_real * dem.populacao,
      pib_nominal: this.economia.pib_per_capita * dem.populacao,
      indice_precos: this.economia.indice_precos,
      consumo_pct_pib: this.economia.consumo_pct_pib,
      investimento_pct_pib: this.economia.investimento_pct_pib,
      crescimento_procura_externa: this.politicas.crescimento_procura_externa,
      taxa_juro_directora: mon.taxa_juro_directora,
      taxa_juro_externa: this.politicas.taxa_juro_externa,
      inflacao_externa: this.politicas.inflacao_externa,
      intervencao_reservas_pct_fluxo: this.politicas.intervencao_reservas_pct_fluxo,
    });

    // 3. TRABALHO
    const trab = this.trabalho.step({
      populacao: dem.populacao,
      ativos: dem.ativos,
      qualificacao_media: edu.qualificacao_media,
      investimento_infra: politicaAplicada("investimento_infra"),
      modificador_setor_verde: this._modificador_setor_verde_anterior,
      crescimento_real_anterior: this._crescimento_real_anterior,
      modificador_desemprego: cri.modificador_desemprego + def.desemprego,
    });
    const desemprego_efetivo = trab.desemprego;

    // 4. ECONOMIA (com modificador de crise + default + inflação variável)
    const eco = this.economia.step({
      populacao: dem.populacao,
      ativos: dem.ativos,
      empregados: trab.empregados,
      desemprego: desemprego_efetivo,
      ganho_produtividade_automacao: trab.ganho_produtividade_automacao,
      taxa_credito: mon.taxa_credito,
      preco_energia_indice: this.clima.preco_energia_indice,
      inflacao_importada: ext.inflacao_importada,
      investimento_educacao: politicaAplicada("investimento_educacao"),
      investimento_infra: politicaAplicada("investimento_infra"),
      investimento_verde: politicaAplicada("investimento_verde"),
      modificador_pib: cri.modificador_pib + def.pib + ext.modificador_pib_comercio,
      modificador_pib_energia: cri.modificador_pib_energia,
      modificador_setor_verde: this._modificador_setor_verde_anterior,
      crise_activa: cri.crise_ativa,
      choque_externo: cri.choque_externo_ativo,
    });
    this.economia.desemprego = desemprego_efetivo;
    this._crescimento_real_anterior = eco.crescimento_real;

    // 5. ESTADO
    const est = this.estado.step({
      pib: eco.pib,
      populacao: dem.populacao,
      salario_medio: eco.salario_medio,
      reformados: dem.reformados,
      empregados: trab.empregados,
      consumo_pct_pib: eco.consumo_pct_pib,
      modificador_receita: cri.modificador_receita,
      emissoes_totais: this._emissoes_totais_anterior,
      carbono_tax_eur_ton: politicaAplicada("carbono_tax_eur_ton"),
    });

    // 6. CLIMA
    const cli = this.clima.step({
      populacao: dem.populacao,
      pib: eco.pib,
      investimento_verde: politicaAplicada("investimento_verde"),
      investimento_infra: politicaAplicada("investimento_infra"),
    });

    // Guardar para o próximo ano
    this._modificador_setor_verde_anterior = cli.modificador_setor_verde;
    this._emissoes_totais_anterior = cli.emissoes_co2_per_capita * dem.populacao / 1_000_000;

    // 7. FINANÇAS (pode disparar default + custo fiscal das crises)
    const fin = this.financas.step({
      pib: eco.pib,
      populacao: dem.populacao,
      reformados: dem.reformados,
      salario_medio: eco.salario_medio,
      subsidio_filho: politicaAplicada("subsidio_filho"),
      investimento_educacao: politicaAplicada("investimento_educacao"),
      receita: est.receita,
      modificador_juro: cri.modificador_juro,
      taxa_juro_monetaria: mon.taxa_juro_directora,
      custo_investimento_verde: cli.custo_investimento_verde,
      custo_fiscal_crise: cri.custo_fiscal_crise,
    });

    // Guardar efeitos do default para o próximo ano
    if (fin.default_ocorreu) {
      this._default_pendente = {
        pib: fin.modificador_pib_default,
        desemprego: fin.modificador_desemprego_default,
        coesao: fin.modificador_coesao_default,
      };
    }

    // 8. HABITAÇÃO
    const hab = this.habitacao.step({
      populacao: dem.populacao,
      salario_medio: eco.salario_medio,
      taxa_juro: mon.taxa_credito,
      subsidio_renda: politicaAplicada("subsidio_renda"),
      investimento_habitacao: politicaAplicada("investimento_habitacao"),
    });

    // 9. SOCIEDADE
    const soc = this.sociedade.step({
      populacao: dem.populacao,
      desemprego: desemprego_efetivo,
      salario_medio: eco.salario_medio,
      taxa_esforco: hab.taxa_esforco,
      qualificacao_media: edu.qualificacao_media,
      carga_fiscal: est.carga_fiscal,
      subsidio_filho: politicaAplicada("subsidio_filho"),
      subsidio_renda: politicaAplicada("subsidio_renda"),
      coesao_anterior: this.sociedade.coesao,
      modificador_coesao: cri.modificador_coesao,
      modificador_coesao_clima: cli.modificador_coesao_clima + def.coesao,
    });

    const pol = this.politica.step({
      ano,
      satisfacao: soc.satisfacao,
      confianca: soc.confianca,
      coesao: soc.coesao,
      gini: soc.gini,
      desemprego: desemprego_efetivo,
      inflacao: eco.inflacao,
      crescimento_real: eco.crescimento_real,
    });

    // 10. REGISTAR
    const h = this.historico;
    h.ano.push(ano);
    h.populacao.push(safe(dem.populacao, 0));
    h.idade_media.push(safe(dem.idade_media, 45));
    h.fertilidade.push(safe(dem.fertilidade, 1.3));
    h.pib.push(safe(eco.pib, 0));
    h.pib_per_capita.push(safe(eco.pib_per_capita, 0));
    h.pib_per_capita_real.push(safe(eco.pib_per_capita_real, 0));
    h.indice_precos.push(safe(eco.indice_precos, 1));
    h.produtividade.push(safe(eco.produtividade, 1));
    h.salario_medio.push(safe(eco.salario_medio, 0));
    h.desemprego.push(safe(desemprego_efetivo, 0.06));
    h.divida_pct_pib.push(safe(fin.divida_pct_pib, 0));
    h.receita.push(safe(fin.receita, 0));
    h.despesa.push(safe(fin.despesa, 0));
    h.despesa_primaria.push(safe(fin.despesa_primaria, 0));
    h.juros_divida.push(safe(fin.juro_pago, 0));
    h.exportacoes.push(ext.exportacoes);
    h.importacoes.push(ext.importacoes);
    h.balanca_comercial.push(ext.balanca_comercial);
    h.conta_corrente.push(ext.conta_corrente);
    h.conta_corrente_pct_pib.push(ext.conta_corrente_pct_pib);
    h.necessidade_financiamento_externo.push(ext.necessidade_financiamento_externo);
    h.fluxos_capitais_pct_pib.push(ext.fluxos_capitais_pct_pib);
    h.cambio_local_usd.push(ext.cambio_local_usd);
    h.variacao_cambio.push(ext.variacao_cambio ?? 0);
    h.indice_preco_importacao.push(ext.indice_preco_importacao);
    h.inflacao_importada.push(ext.inflacao_importada);
    h.reservas_meses_importacao.push(ext.reservas_meses_importacao);
    h.setor_externo_ativo.push(ext.ativo);
    h.saldo.push(safe(fin.saldo, 0));
    h.populacao_ativa.push(safe(trab.populacao_ativa, 0));
    h.taxa_participacao.push(safe(trab.taxa_participacao, 0.6));
    h.empregados.push(safe(trab.empregados, 0));
    h.anos_escolaridade.push(safe(edu.anos_escolaridade, 9.5));
    h.qualificacao_media.push(safe(edu.qualificacao_media, 0.4));
    h.setor_servicos.push(safe(trab.setores.servicos, 0.68));
    h.setor_tecnologia.push(safe(trab.setores.tecnologia, 0.06));
    h.automacao_media.push(safe(trab.automacao_media, 0));
    h.substituicao_empregos_automacao.push(safe(trab.substituicao_empregos, 0));
    h.novas_atividades_automacao.push(safe(trab.novas_atividades, 0));
    h.ganho_produtividade_automacao.push(safe(trab.ganho_produtividade_automacao, 0));
    h.pensoes.push(safe(fin.pensoes, 0));
    h.subsidios.push(safe(fin.subsidios, 0));
    h.carga_fiscal.push(safe(est.carga_fiscal, 0));
    h.receita_carbono.push(safe(est.receita_carbono, 0));
    h.default_ocorreu.push(Boolean(fin.default_ocorreu));
    h.inflacao_actual.push(safe(eco.inflacao, 0.024));
    h.expectativas_inflacao.push(safe(mon.expectativas_inflacao, 0.02));
    h.taxa_juro_directora.push(safe(mon.taxa_juro_directora, 0.03));
    h.taxa_credito.push(safe(mon.taxa_credito, 0.05));
    h.consumo_pct_pib.push(safe(eco.consumo_pct_pib, 0.65));
    h.investimento_pct_pib.push(safe(eco.investimento_pct_pib, 0.20));
    h.regime_politico.push(pol.regime);
    h.partido_governo.push(pol.nome_partido_governo);
    h.partido_oposicao.push(pol.nome_partido_oposicao);
    h.aprovacao_governo.push(safe(pol.aprovacao, 0.5));
    h.apoio_governo.push(safe(pol.apoio_governo, 0.4));
    h.apoio_oposicao.push(safe(pol.apoio_oposicao, 0.35));
    h.eleicao_realizada.push(pol.eleicao_realizada);
    h.qualidade_institucional.push(safe(pol.qualidade_institucional, 0.65));
    h.capacidade_estado.push(safe(pol.capacidade_estado, 0.7));
    h.implementacao_politicas.push(safe(pol.multiplicador_implementacao, 1));
    h.preco_m2.push(safe(hab.preco_m2, 0));
    h.renda_media.push(safe(hab.renda_media, 0));
    h.taxa_esforco.push(safe(hab.taxa_esforco_efetiva, 0));
    h.stock_habitacao.push(safe(hab.stock_habitacao, 0));
    h.construcao_anual.push(safe(hab.construcao_anual, 0));
    h.coesao.push(safe(soc.coesao, 0.7));
    h.gini.push(safe(soc.gini, 0.33));
    h.confianca.push(safe(soc.confianca, 0.5));
    h.satisfacao.push(safe(soc.satisfacao, 0.6));

    h.crise_ativa.push(cri.crise_ativa);
    h.crise_tipo.push(cri.crise_tipo);
    h.recessao_ativa.push(cri.recessao_ativa);
    h.crise_divida_ativa.push(cri.crise_divida_ativa);
    h.choque_externo_ativo.push(cri.choque_externo_ativo);
    h.resgate_ativo.push(cri.resgate_ativo);
    h.emigracao_massa_ativa.push(cri.emigracao_massa_ativa);
    h.fuga_cerebros_aguda_ativa.push(cri.fuga_cerebros_aguda_ativa);
    h.crise_energetica_ativa.push(cri.crise_energetica_ativa);
    h.transicao_desordenada_ativa.push(cri.transicao_desordenada_ativa);

    h.emissoes_co2_per_capita.push(safe(cli.emissoes_co2_per_capita, 4.5));
    h.emissoes_acumuladas.push(safe(cli.emissoes_acumuladas, 0));
    h.percentagem_renovaveis.push(safe(cli.percentagem_renovaveis, 0.30));
    h.dependencia_externa.push(safe(cli.dependencia_externa, 0.75));
    h.preco_energia_indice.push(safe(cli.preco_energia_indice, 100));
    h.desastre_natural_ativo.push(cli.desastre_natural_ativo);
    h.desastre_natural_tipo.push(cli.desastre_natural_tipo);
  }

  run() {
    for (let i = 0; i < this.anos; i++) {
      this.step();
    }
    return this.historico;
  }
}