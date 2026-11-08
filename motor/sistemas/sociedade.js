/**
 * SISTEMA: SOCIEDADE
 * Coesão social, desigualdade (Gini), confiança institucional, satisfação.
 * Aceita modificadores das Crises e do Clima.
 */

import { clamp } from "../utils.js";

export function criarSociedade(dados) {
  const gini0 = Number(dados.gini);
  const conf0 = Number(dados.confianca_institucional);
  const sat0 = Number(dados.satisfacao_vida);

  return {
    // Estado inicial
    gini: Number.isFinite(gini0) ? gini0 : 0.33,
    confianca: Number.isFinite(conf0) ? conf0 : 0.50,
    satisfacao: Number.isFinite(sat0) ? sat0 : 0.60,
    coesao: 0.70,

    step(contexto) {
      const desemprego = Number(contexto.desemprego) || 0.06;
      const salario_medio = Number(contexto.salario_medio) || 0;
      const taxa_esforco = Number(contexto.taxa_esforco) || 0.5;
      const qualificacao = Number(contexto.qualificacao_media) || 0.4;
      const carga_fiscal = Number(contexto.carga_fiscal) || 0.38;
      const subsidio_filho = Number(contexto.subsidio_filho) || 0;
      const subsidio_renda = Number(contexto.subsidio_renda) || 0;
      const coesao_anterior = Number(contexto.coesao_anterior) || 0.7;
      const modificador_coesao = Number(contexto.modificador_coesao) || 0;
      const modificador_coesao_clima = Number(contexto.modificador_coesao_clima) || 0;

      // ── 1. DESIGUALDADE (Gini) ──
      const efeito_desemprego = (desemprego - 0.06) * 0.4;
      const efeito_qualificacao = (0.4 - qualificacao) * 0.15;
      const efeito_subsidio = -(subsidio_filho / 10000) * 0.02 - (subsidio_renda / 1000) * 0.01;
      const gini_desejado = 0.33 + efeito_desemprego + efeito_qualificacao + efeito_subsidio;
      this.gini = clamp(
        this.gini * 0.95 + gini_desejado * 0.05,
        0.20, 0.60
      );

      // ── 2. CONFIANÇA INSTITUCIONAL ──
      const eficacia = 1 - Math.abs(carga_fiscal - 0.40) * 2;
      const efeito_confianca = (eficacia - 0.5) * 0.05
        - Math.max(0, desemprego - 0.08) * 0.5
        - Math.max(0, this.gini - 0.35) * 0.3;
      this.confianca = clamp(
        this.confianca * 0.95 + (this.confianca + efeito_confianca) * 0.05,
        0.10, 0.95
      );

      // ── 3. SATISFAÇÃO ──
      const salario_relativo = salario_medio / 20000;
      const efeito_salario = (salario_relativo - 0.8) * 0.1;
      const efeito_esforco = -Math.max(0, taxa_esforco - 0.35) * 0.3;
      const efeito_desemprego_sat = -Math.max(0, desemprego - 0.06) * 1.5;
      const satisfacao_desejada = 0.60 + efeito_salario + efeito_esforco + efeito_desemprego_sat;
      this.satisfacao = clamp(
        this.satisfacao * 0.95 + satisfacao_desejada * 0.05,
        0.10, 0.95
      );

      // ── 4. COESÃO SOCIAL ──
      const fator_desigualdade = 1 - (this.gini - 0.20) / 0.40;
      const fator_confianca = this.confianca;
      const fator_satisfacao = this.satisfacao;
      const fator_desemprego = 1 - clamp((desemprego - 0.03) / 0.15, 0, 1);
      const fator_habitacao = 1 - clamp((taxa_esforco - 0.25) / 0.50, 0, 1);

      const coesao_desejada =
        fator_desigualdade * 0.25 +
        fator_confianca * 0.25 +
        fator_satisfacao * 0.20 +
        fator_desemprego * 0.20 +
        fator_habitacao * 0.10 +
        modificador_coesao +
        modificador_coesao_clima;

      // Suavizar (a coesão muda devagar)
      this.coesao = clamp(
        coesao_anterior * 0.9 + coesao_desejada * 0.1,
        0.05, 1.0
      );

      return {
        coesao: this.coesao,
        gini: this.gini,
        confianca: this.confianca,
        satisfacao: this.satisfacao,
      };
    },
  };
}