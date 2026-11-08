/**
 * SISTEMA: DEMOGRAFIA
 * População, fertilidade, mortalidade, migração, composição etária.
 * Aceita modificador de migração e de mortalidade das Crises.
 */

import { clamp } from "../utils.js";

export function criarDemografia(dados) {
  const pop0 = Number(dados.populacao);
  const id0 = Number(dados.idade_media);
  const fert0 = Number(dados.fertilidade);
  const mort0 = Number(dados.mortalidade_base);
  const mig0 = Number(dados.saldo_migratorio_anual);

  return {
    populacao: Number.isFinite(pop0) ? pop0 : 11_000_000,
    idade_media: Number.isFinite(id0) ? id0 : 45,
    fertilidade: Number.isFinite(fert0) ? fert0 : 1.3,
    mortalidade_base: Number.isFinite(mort0) ? mort0 : 0.011,
    esperanca_vida: Number(dados.esperanca_vida) || 81.5,
    saldo_migratorio_anual: Number.isFinite(mig0) ? mig0 : 0,

    composicao_etaria: {
      jovens: Number(dados.composicao_etaria?.jovens) || 0.13,
      ativos: Number(dados.composicao_etaria?.ativos) || 0.63,
      reformados: Number(dados.composicao_etaria?.reformados) || 0.24,
    },

    nascimentos_ultimo_ano: 0,
    mortes_ultimo_ano: 0,
    imigrantes_acumulados: 0,
    emigrantes_acumulados: 0,

    step(contexto) {
      const subsidio_filho = Number(contexto.subsidio_filho) || 0;
      const coesao = Number(contexto.coesao) || 0.7;
      const modificador_migracao = Number(contexto.modificador_migracao) || 0;
      const modificador_mortalidade = Number(contexto.modificador_mortalidade) || 0;

      // ── 1. Fertilidade ──
      const fator_coesao = 0.3 + 0.7 * coesao;
      const efeito_subsidio = (subsidio_filho / 1000) * 0.012;
      const fertilidade_desejada = clamp(
        this.fertilidade + efeito_subsidio * fator_coesao,
        0.5, 4.0
      );
      this.fertilidade = clamp(
        this.fertilidade * 0.9 + fertilidade_desejada * 0.1,
        0.5, 4.0
      );

      // ── 2. Nascimentos ──
      const mulheres_ferteis = this.populacao * 0.20;
      this.nascimentos_ultimo_ano = mulheres_ferteis * (this.fertilidade / 35);

      // ── 3. Mortes (com modificador de crise/pandemia) ──
      const mortalidade_efetiva = this.mortalidade_base + modificador_mortalidade;
      this.mortes_ultimo_ano = this.populacao * mortalidade_efetiva;

      // ── 4. Migração (com modificador de crise) ──
      const imigrantes = this.saldo_migratorio_anual + modificador_migracao;
      this.imigrantes_acumulados += imigrantes;

      // ── 5. Atualizar população ──
      this.populacao += this.nascimentos_ultimo_ano - this.mortes_ultimo_ano + imigrantes;

      // Proteção contra NaN
      if (!Number.isFinite(this.populacao) || this.populacao < 0) {
        this.populacao = 0;
      }

      // ── 6. Idade média ──
      const efeito_fertilidade = (this.fertilidade - 1.3) * -1.5;
      const efeito_imigracao = -(imigrantes / Math.max(this.populacao, 1)) * 20;
      this.idade_media = clamp(
        this.idade_media + 0.08 + efeito_fertilidade * 0.1 + efeito_imigracao * 0.1,
        18, 70
      );
      if (!Number.isFinite(this.idade_media)) this.idade_media = 45;

      // ── 7. Composição etária ──
      const j = clamp(0.13 + (this.fertilidade - 1.3) * 0.02, 0.05, 0.45);
      const r = clamp(0.24 + (this.idade_media - 45) * 0.005, 0.03, 0.35);
      this.composicao_etaria = {
        jovens: j,
        ativos: clamp(1 - j - r, 0.40, 0.75),
        reformados: r,
      };

      return {
        populacao: this.populacao,
        idade_media: this.idade_media,
        fertilidade: this.fertilidade,
        jovens: this.composicao_etaria.jovens,
        ativos: this.composicao_etaria.ativos,
        reformados: this.composicao_etaria.reformados,
        imigrantes_acumulados: this.imigrantes_acumulados,
      };
    },
  };
}