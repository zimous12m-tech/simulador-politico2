/**
 * SISTEMA: ECONOMIA
 * PIB, produtividade, salários, desemprego, inflação variável.
 *
 * CORRECÇÃO v3:
 *   - Crescimento real POR PAÍS (vem do ficheiro)
 *   - Inflação fixa a 2,0%/ano
 *   - Fallback: 1,0% se o ficheiro não tiver o campo
 */

import { clamp } from "../utils.js";

export function criarEconomia(dados) {
  const pib0 = Number(dados.pib_per_capita);
  const sal0 = Number(dados.salario_medio);
  const cresc0 = Number(dados.crescimento_real_base);
  const inflacao0 = Number(dados.inflacao);
  const empregoBase0 = Number(dados.empregados_base_fracao);

  return {
    pib_per_capita: Number.isFinite(pib0) ? pib0 : 25000,
    pib_per_capita_inicial: Number.isFinite(pib0) ? pib0 : 25000,
    produtividade: Number(dados.produtividade_base) || 1.0,
    empregados_base_fracao: Number.isFinite(empregoBase0) && empregoBase0 > 0
      ? empregoBase0
      : 0.36,
    inflacao_base: 0.02,
    inflacao_actual: Number.isFinite(inflacao0) ? clamp(inflacao0, -0.05, 0.30) : 0.02,
    crescimento_real_base: Number.isFinite(cresc0) ? cresc0 : 0.010,
    desemprego: Number(dados.desemprego) || 0.06,
    salario_medio: Number.isFinite(sal0) ? sal0 : 16250,
    indice_precos: 1,
    pib_per_capita_real: Number.isFinite(pib0) ? pib0 : 25000,
    consumo_pct_pib: Number(dados.consumo_pct_pib) || 0.65,
    investimento_pct_pib: Number(dados.investimento_pct_pib) || 0.20,

    step(contexto) {
      const populacao = Number(contexto.populacao) || 0;
      const ativos = Number(contexto.ativos) || 0.63;
      const empregadosInformados = Number(contexto.empregados);
      const fracaoEmpregada = populacao > 0 && Number.isFinite(empregadosInformados)
        ? empregadosInformados / populacao
        : this.empregados_base_fracao;
      const desemprego = clamp(
        Number.isFinite(Number(contexto.desemprego)) ? Number(contexto.desemprego) : this.desemprego,
        0.02,
        0.30
      );
      const investimento_educacao = Number(contexto.investimento_educacao) || 0;
      const investimento_infra = Number(contexto.investimento_infra) || 0;
      const investimento_verde = Number(contexto.investimento_verde) || 0;
      const taxa_credito = clamp(Number(contexto.taxa_credito) || 0.05, 0, 0.25);
      const preco_energia_indice = Number(contexto.preco_energia_indice) || 100;
      const inflacao_importada = clamp(Number(contexto.inflacao_importada) || 0, -0.05, 0.10);
      const ganho_produtividade_automacao = Number(contexto.ganho_produtividade_automacao) || 0;
      const modificador_pib = Number(contexto.modificador_pib) || 0;
      const modificador_pib_energia = Number(contexto.modificador_pib_energia) || 0;
      const modificador_setor_verde = Number(contexto.modificador_setor_verde) || 0;
      const crise_activa = Boolean(contexto.crise_activa);
      const choque_externo = Boolean(contexto.choque_externo);

      // 1. Normalizar investimentos
      const inv_edu = investimento_educacao > 1
        ? investimento_educacao / 100 : investimento_educacao;
      const inv_infra = investimento_infra > 1
        ? investimento_infra / 100 : investimento_infra;
      const inv_verde = investimento_verde > 1
        ? investimento_verde / 100 : investimento_verde;

      // 2. Efeitos do investimento
      const efeito_educacao = clamp(inv_edu * 0.10, 0, 0.010);
      const efeito_infra = clamp(inv_infra * 0.075, 0, 0.010);
      const efeito_verde_curto = -clamp(inv_verde * 0.02, 0, 0.002);
      const efeito_verde_longo = clamp(modificador_setor_verde * 0.1, 0, 0.003);
      const efeito_automacao = clamp(ganho_produtividade_automacao, 0, 0.01);

      // Crédito mais caro reduz consumo e investimento com ajustamento gradual.
      const desvio_credito = taxa_credito - 0.05;
      const consumo_desejado = clamp(this.consumo_pct_pib * (1 - desvio_credito * 0.60), 0.45, 0.80);
      const investimento_desejado = clamp(this.investimento_pct_pib * (1 - desvio_credito * 2.5), 0.05, 0.35);
      this.consumo_pct_pib = this.consumo_pct_pib * 0.70 + consumo_desejado * 0.30;
      this.investimento_pct_pib = this.investimento_pct_pib * 0.70 + investimento_desejado * 0.30;
      const efeito_procura = clamp(
        (this.consumo_pct_pib - 0.65) * 0.05 + (this.investimento_pct_pib - 0.20) * 0.08,
        -0.01,
        0.01
      );

      // 3. Crescimento REAL — vem do ficheiro do país
      const crescimento_real = clamp(
        this.crescimento_real_base
        + efeito_educacao
        + efeito_infra
        + efeito_verde_curto
        + efeito_verde_longo
        + efeito_automacao
        + efeito_procura
        + modificador_pib
        + modificador_pib_energia,
        -0.10, 0.10
      );

      // 4. Inflação variável (2% base + crises)
      const pressao_energia = clamp((preco_energia_indice - 100) / 100 * 0.01, -0.01, 0.03);
      const pressao_procura = clamp(
        (this.consumo_pct_pib + this.investimento_pct_pib - 0.85) * 0.10,
        -0.01,
        0.02
      );
      let inflacao_desejada = this.inflacao_base + pressao_energia + pressao_procura + inflacao_importada;
      if (crise_activa) inflacao_desejada += 0.02;
      if (choque_externo) inflacao_desejada += 0.03;
      inflacao_desejada = clamp(inflacao_desejada, 0.005, 0.15);

      this.inflacao_actual = this.inflacao_actual * 0.7 + inflacao_desejada * 0.3;

      // Produtividade cresce em termos reais; inflação é acumulada no deflator.
      this.produtividade *= (1 + crescimento_real);
      this.indice_precos *= (1 + this.inflacao_actual);

      // 6. PIB per capita real e nominal mantêm unidades distintas.
      const fator_emprego = fracaoEmpregada / this.empregados_base_fracao;
      this.pib_per_capita_real = this.pib_per_capita_inicial * this.produtividade * fator_emprego;
      this.pib_per_capita = this.pib_per_capita_real * this.indice_precos;

      // 7. PIB total
      const pib_novo = this.pib_per_capita * populacao;

      // 8. Salário médio
      const poder_salarial = clamp(1 + (0.06 - desemprego) * 0.5, 0.90, 1.10);
      const salario_desejado = this.pib_per_capita * 0.65 * poder_salarial;
      this.salario_medio = this.salario_medio * 0.7 + salario_desejado * 0.3;

      // O mercado de trabalho calcula o desemprego e devolve-o ao estado económico.
      this.desemprego = desemprego;

      return {
        pib: pib_novo,
        pib_per_capita: this.pib_per_capita,
        pib_per_capita_real: this.pib_per_capita_real,
        indice_precos: this.indice_precos,
        salario_medio: this.salario_medio,
        desemprego: this.desemprego,
        produtividade: this.produtividade,
        fator_emprego,
        crescimento_real,
        inflacao: this.inflacao_actual,
        consumo_pct_pib: this.consumo_pct_pib,
        investimento_pct_pib: this.investimento_pct_pib,
        crescimento_real_base: this.crescimento_real_base,
      };
    },
  };
}