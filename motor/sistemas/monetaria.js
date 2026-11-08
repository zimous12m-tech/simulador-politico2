/**
 * SISTEMA: POLÍTICA MONETÁRIA
 * Regra de reação simples com expectativas e inércia da taxa directora.
 * Taxas em fracções anuais; não representa um banco central específico.
 */
import { clamp } from "../utils.js";

export function criarPoliticaMonetaria(dados = {}) {
  const taxaInicial = Number(dados.taxa_juro_directora);
  const meta = Number(dados.meta_inflacao);
  const desempregoNatural = Number(dados.desemprego_tendencial);

  return {
    meta_inflacao: Number.isFinite(meta) ? clamp(meta, 0, 0.10) : 0.02,
    desemprego_tendencial: Number.isFinite(desempregoNatural)
      ? clamp(desempregoNatural, 0.02, 0.20)
      : 0.06,
    expectativas_inflacao: Number.isFinite(meta) ? meta : 0.02,
    taxa_juro_directora: Number.isFinite(taxaInicial) ? clamp(taxaInicial, 0, 0.15) : 0.03,
    taxa_credito: 0.05,

    step(contexto) {
      const inflacao = clamp(Number(contexto.inflacao) || 0, -0.05, 0.30);
      const desemprego = clamp(Number(contexto.desemprego) || 0.06, 0.02, 0.30);
      const dividaPctPib = Math.max(0, Number(contexto.divida_pct_pib) || 0);

      this.expectativas_inflacao = clamp(
        this.expectativas_inflacao * 0.75 + inflacao * 0.25,
        -0.02,
        0.30
      );

      const hiatoInflacao = this.expectativas_inflacao - this.meta_inflacao;
      const hiatoDesemprego = this.desemprego_tendencial - desemprego;
      const taxaDesejada = clamp(
        0.01 + this.expectativas_inflacao + 1.5 * hiatoInflacao + 0.5 * hiatoDesemprego,
        0,
        0.15
      );

      this.taxa_juro_directora = clamp(
        this.taxa_juro_directora * 0.75 + taxaDesejada * 0.25,
        0,
        0.15
      );

      const spreadSoberano = clamp((dividaPctPib - 0.60) * 0.02, 0, 0.08);
      this.taxa_credito = clamp(this.taxa_juro_directora + 0.02 + spreadSoberano, 0.005, 0.25);

      return {
        expectativas_inflacao: this.expectativas_inflacao,
        taxa_juro_directora: this.taxa_juro_directora,
        taxa_credito: this.taxa_credito,
        spread_soberano: spreadSoberano,
      };
    },
  };
}