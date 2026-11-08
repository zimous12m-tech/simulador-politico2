/**
 * SISTEMA: ESTADO
 * Receita fiscal + carbono tax.
 * Aceita modificador de receita das crises.
 */

import { clamp } from "../utils.js";

export function criarEstado(dados) {
  const irs0 = Number(dados.irs_medio);
  const tsu0 = Number(dados.tsu_media);
  const iva0 = Number(dados.iva_medio);
  const outras0 = Number(dados.outras_pct_pib);

  return {
    irs_medio: Number.isFinite(irs0) ? irs0 : 0.20,
    tsu_media: Number.isFinite(tsu0) ? tsu0 : 0.2375,
    iva_medio: Number.isFinite(iva0) ? iva0 : 0.23,
    outras_pct_pib: Number.isFinite(outras0) ? outras0 : 0.05,

    step(contexto) {
      const pib = Number(contexto.pib) || 0;
      const populacao = Number(contexto.populacao) || 0;
      const empregados = Number(contexto.empregados) || 0;
      const salario_medio = Number(contexto.salario_medio) || 0;
      const consumo_pct_pib = clamp(Number(contexto.consumo_pct_pib) || 0.65, 0, 1);
      const modificador_receita = Number(contexto.modificador_receita) || 0;
      const emissoes_totais = Number(contexto.emissoes_totais) || 0;
      const carbono_tax_eur_ton = Number(contexto.carbono_tax_eur_ton) || 0;

      if (!Number.isFinite(pib) || pib <= 0) {
        return {
          receita: 0, receita_irs: 0, receita_tsu: 0, receita_iva: 0,
          receita_outras: 0, receita_carbono: 0, carga_fiscal: 0,
        };
      }

      // ── RECEITA BASE ──
      const massa_salarial_efetiva = Math.min(
        pib,
        Math.max(0, empregados) * Math.max(0, salario_medio)
      );
      const receita_irs = massa_salarial_efetiva * this.irs_medio;
      const receita_tsu = massa_salarial_efetiva * this.tsu_media;
      const consumo = pib * consumo_pct_pib;
      const receita_iva = consumo * this.iva_medio;
      const receita_outras = pib * this.outras_pct_pib;

      // ── CARBONO TAX ──
      //    emissoes_totais em milhões de toneladas → converter para toneladas
      //    Ex: 51 Mt × 50 €/t = 2 550 M€ = 2,55 mil M€
      const receita_carbono = emissoes_totais * 1_000_000 * carbono_tax_eur_ton;

      // ── RECEITA TOTAL ──
      let receita = receita_irs + receita_tsu + receita_iva + receita_outras + receita_carbono;

      // Modificador de crise
      receita *= (1 + modificador_receita);

      const carga_fiscal = clamp(receita / pib, 0.25, 0.55);

      return {
        receita,
        receita_irs,
        receita_tsu,
        receita_iva,
        receita_outras,
        receita_carbono,
        massa_salarial_efetiva,
        consumo,
        carga_fiscal,
      };
    },
  };
}