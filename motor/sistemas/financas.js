/**
 * SISTEMA: FINANÇAS PÚBLICAS
 * Despesa, dívida, juro. Recebe a receita do Estado.
 *
 * NOVO: aceita custo_fiscal_crise — cada crise aumenta a dívida em X pp.
 * NOVO: outras = 15% (era 18%), pensões limitadas a 14% PIB.
 */

import { clamp } from "../utils.js";

export function criarFinancas(dados) {
  const div0 = Number(dados.divida_pct_pib);
  const juro0 = Number(dados.juro_medio_divida);

  return {
    divida_pct_pib: Number.isFinite(div0) ? div0 : 0.9,
    juro_medio: Number.isFinite(juro0) ? juro0 : 0.025,
    fator_austeridade: 1.0,
    anos_desde_default: 999,

    step(contexto) {
      const pib = Number(contexto.pib) || 0;
      const populacao = Number(contexto.populacao) || 0;
      const reformados = Number(contexto.reformados) || 0.24;
      const salario_medio = Number(contexto.salario_medio) || 0;
      const subsidio_filho = Number(contexto.subsidio_filho) || 0;
      const investimento_educacao = Number(contexto.investimento_educacao) || 0;
      const receita = Number(contexto.receita) || 0;
      const modificador_juro = Number(contexto.modificador_juro) || 0;
      const taxa_juro_monetaria = Number(contexto.taxa_juro_monetaria) || 0.02;
      const custo_investimento_verde = Number(contexto.custo_investimento_verde) || 0;
      const custo_fiscal_crise = Number(contexto.custo_fiscal_crise) || 0;

      if (!Number.isFinite(pib) || pib <= 0) {
        return {
          receita: 0, despesa: 0, saldo: 0, divida: 0,
          divida_pct_pib: this.divida_pct_pib,
          juro_pago: 0, pensoes: 0, subsidios: 0, taxa_juro: this.juro_medio,
          investimento_verde_pago: 0, fator_austeridade: 1.0,
          default_ocorreu: false,
          modificador_pib_default: 0,
          modificador_desemprego_default: 0,
          modificador_coesao_default: 0,
        };
      }

      // ── AUSTERIDADE AUTOMÁTICA ──
      const div_atual = this.divida_pct_pib;
      let fator_austeridade = 1.0;
      if (div_atual > 1.0) {
        fator_austeridade = 1 - Math.min((div_atual - 1.0) * 0.5, 0.50);
      }
      this.fator_austeridade = fator_austeridade;

      const spread_soberano = clamp((div_atual - 0.60) * 0.02, 0, 0.08);
      const taxa_juro = clamp(taxa_juro_monetaria + spread_soberano + modificador_juro, 0, 0.20);
      const juro_pago = div_atual * pib * taxa_juro;

      // ── DESPESA ──
      const n_reformados = populacao * reformados;
      // Pensões LIMITADAS a 14% do PIB
      const pensoes_bruto = n_reformados * salario_medio * 0.55;
      const pensoes = Math.min(pensoes_bruto, pib * 0.14);

      const saude = pib * 0.09;

      const inv_edu_extra = investimento_educacao > 1
        ? investimento_educacao / 100
        : investimento_educacao;
      const educacao_total = pib * (0.06 + clamp(inv_edu_extra, 0, 0.15));

      const n_criancas = populacao * 0.18;
      const subsidios = n_criancas * subsidio_filho;

      const inv_verde = custo_investimento_verde > 1
        ? custo_investimento_verde / 100
        : custo_investimento_verde;
      const investimento_verde_pago = pib * clamp(inv_verde, 0, 0.10) * 0.5;

      // Outras despesas — 15% (era 18%)
      const outras = pib * 0.15;

      const despesa_base = pensoes + saude + educacao_total + subsidios
                         + investimento_verde_pago + outras;

      const despesa_primaria = despesa_base * fator_austeridade;
      const despesa = despesa_primaria + juro_pago;

      // ── SALDO ──
      const saldo = receita - despesa;
      this.juro_medio = taxa_juro;

      // ── DÍVIDA ──
      let divida = div_atual * pib;
      divida -= saldo;

      // CUSTO FISCAL DA CRISE (novo)
      divida += pib * custo_fiscal_crise;

      // ── DEFAULT PARCIAL ──
      let default_ocorreu = false;
      let modificador_pib_default = 0;
      let modificador_desemprego_default = 0;
      let modificador_coesao_default = 0;

      const nova_pct_bruta = divida / pib;

      if (nova_pct_bruta > 3.0 && this.anos_desde_default >= 20) {
        divida = divida * 0.60;
        default_ocorreu = true;
        this.anos_desde_default = 0;
        modificador_pib_default = -0.05;
        modificador_desemprego_default = 0.03;
        modificador_coesao_default = -0.10;
      } else {
        this.anos_desde_default = (this.anos_desde_default || 0) + 1;
      }

      const nova_pct = divida / pib;
      if (!Number.isFinite(nova_pct)) {
        throw new RangeError("A dívida pública tornou-se não finita; verifica as premissas fiscais.");
      }
      this.divida_pct_pib = nova_pct;

      return {
        receita: Number.isFinite(receita) ? receita : 0,
        despesa: Number.isFinite(despesa) ? despesa : 0,
        despesa_primaria: Number.isFinite(despesa_primaria) ? despesa_primaria : 0,
        saldo: Number.isFinite(saldo) ? saldo : 0,
        divida: Number.isFinite(divida) ? divida : 0,
        divida_pct_pib: this.divida_pct_pib,
        juro_pago: Number.isFinite(juro_pago) ? juro_pago : 0,
        pensoes: Number.isFinite(pensoes) ? pensoes : 0,
        subsidios: Number.isFinite(subsidios) ? subsidios : 0,
        investimento_verde_pago: Number.isFinite(investimento_verde_pago) ? investimento_verde_pago : 0,
        taxa_juro,
        spread_soberano,
        fator_austeridade,
        default_ocorreu,
        modificador_pib_default,
        modificador_desemprego_default,
        modificador_coesao_default,
      };
    },
  };
}