/**
 * SISTEMA: HABITAÇÃO
 * Preço, renda, construção, taxa de esforço. Calibrado para Portugal.
 */

import { clamp } from "../utils.js";

export function criarHabitacao(dados) {
  const preco0 = Number(dados.preco_m2);
  const renda0 = Number(dados.renda_media);
  const stock0 = Number(dados.stock_habitacao);

  return {
    preco_m2: Number.isFinite(preco0) ? preco0 : 2500,
    renda_media: Number.isFinite(renda0) ? renda0 : 900,
    renda_base: Number.isFinite(renda0) ? renda0 : 900,
    stock_habitacao: Number.isFinite(stock0) ? stock0 : 5_900_000,

    construcao_anual: 0,
    pressao_turistica: 0.10,
    taxa_esforco: 0,
    taxa_esforco_efetiva: 0,

    step(contexto) {
      const populacao = Number(contexto.populacao) || 0;
      const salario_medio = Number(contexto.salario_medio) || 0;
      const taxa_juro = Number(contexto.taxa_juro) || 0.03;
      const subsidio_renda = Number(contexto.subsidio_renda) || 0;
      const investimento_publico = Number(contexto.investimento_habitacao) || 0;

      if (populacao <= 0 || salario_medio <= 0) {
        return {
          preco_m2: this.preco_m2,
          renda_media: this.renda_media,
          renda_efetiva: this.renda_media,
          taxa_esforco: this.taxa_esforco,
          taxa_esforco_efetiva: this.taxa_esforco_efetiva,
          construcao_anual: 0,
          stock_habitacao: this.stock_habitacao,
          pressao_turistica: this.pressao_turistica,
          pressao_demografica: 1,
        };
      }

      const salario_mensal = salario_medio / 12;

      // ── 1. PRESSÃO DEMOGRÁFICA ──
      const stock_efetivo = this.stock_habitacao * (1 + investimento_publico * 2);
      const capacidade_habitacional = stock_efetivo * 2.5;
      const pressao = populacao / Math.max(capacidade_habitacional, 1);

      // ── 2. PRESSÃO TURÍSTICA ──
      this.pressao_turistica = clamp(
        this.pressao_turistica + (salario_medio / 20000 - 0.8) * 0.001,
        0.05, 0.25
      );
      const pressao_total = pressao * (1 + this.pressao_turistica);

      // ── 3. PREÇO ──
      const ajuste_pressao = (pressao_total - 1) * 0.10;
      this.preco_m2 = clamp(
        this.preco_m2 * (1 + 0.02 + ajuste_pressao),
        1500, 8000
      );

      // ── 4. RENDA BASE (sem subsídio) ──
      //    A renda base é calculada a partir do preço, todos os anos,
      //    sem acumular o subsídio. É o valor de mercado "puro".
      const renda_desejada = this.preco_m2 * 80 * 0.004;
      this.renda_base = clamp(
        this.renda_base * 0.8 + renda_desejada * 0.2,
        300, 3000
      );

      // ── 5. RENDA DE MERCADO (com captura do subsídio) ──
      //    O subsídio é somado UMA VEZ à renda base, todos os anos.
      //    Não acumula porque a renda base não o inclui.
      const captura = 0.5;
      this.renda_media = clamp(
        this.renda_base + subsidio_renda * captura,
        300, 3500
      );

      // ── 6. TAXA DE ESFORÇO ──
      this.taxa_esforco = this.renda_media / Math.max(salario_mensal, 1);
      const renda_efetiva = Math.max(this.renda_media - subsidio_renda, 0);
      this.taxa_esforco_efetiva = renda_efetiva / Math.max(salario_mensal, 1);

      // ── 7. CONSTRUÇÃO ──
      const fator_preco = clamp((this.preco_m2 - 2000) / 3000, 0, 1);
      const fator_juro = clamp(1 - (taxa_juro - 0.03) * 8, 0.4, 1.2);
      const fator_publico = 1 + investimento_publico * 30;
      const taxa_construcao = 0.003 + fator_preco * 0.008;
      this.construcao_anual =
        this.stock_habitacao * taxa_construcao * fator_juro * fator_publico;

      // ── 8. STOCK ──
      this.stock_habitacao += this.construcao_anual - this.stock_habitacao * 0.002;
      this.stock_habitacao = Math.max(this.stock_habitacao, 1_000_000);

      return {
        preco_m2: this.preco_m2,
        renda_media: this.renda_media,
        renda_base: this.renda_base,
        renda_efetiva,
        taxa_esforco: this.taxa_esforco,
        taxa_esforco_efetiva: this.taxa_esforco_efetiva,
        construcao_anual: this.construcao_anual,
        stock_habitacao: this.stock_habitacao,
        pressao_turistica: this.pressao_turistica,
        pressao_demografica: pressao_total,
      };
    },
  };
}