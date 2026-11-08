/**
 * SISTEMA: EDUCAÇÃO
 */

import { clamp } from "../utils.js";

export function criarEducacao(dados) {
  const anos0 = Number(dados.anos_escolaridade);
  const qual0 = Number(dados.qualificacao_media);
  const fuga0 = Number(dados.fuga_cerebros);

  return {
    anos_escolaridade: Number.isFinite(anos0) ? anos0 : 9.5,
    qualificacao_media: Number.isFinite(qual0) ? qual0 : 0.40,

    niveis: {
      basico: Number(dados.niveis?.basico) || 0.45,
      secundario: Number(dados.niveis?.secundario) || 0.35,
      superior: Number(dados.niveis?.superior) || 0.20,
    },

    fuga_cerebros: Number.isFinite(fuga0) ? fuga0 : 0.015,

    step(contexto) {
      const inv_bruto = Number(contexto.investimento_educacao) || 0;
      const salario = Number(contexto.salario_medio) || 16000;
      const coesao = Number(contexto.coesao) || 0.7;

      // Normalizar
      const inv = inv_bruto > 1 ? inv_bruto / 100 : inv_bruto;
      const investimento = clamp(inv, 0, 0.15);

      // Crescimento da qualificação POR ANO
      //   4% PIB → +0.4%/ano
      //   6% PIB → +0.6%/ano
      //   8% PIB → +0.8%/ano
      const efeito_investimento = investimento * 0.10;
      const efeito_coesao = (coesao - 0.5) * 0.005;
      const base = 0.003;
      const crescimento = base + efeito_investimento + efeito_coesao;

      // Aplicar DIRETAMENTE o crescimento (sem suavização que o anula)
      this.qualificacao_media = clamp(
        this.qualificacao_media + crescimento,
        0.20, 0.95
      );

      // Anos de escolaridade: reagem à qualificação
      const anos_desejados = 6 + this.qualificacao_media * 12.6;
      this.anos_escolaridade = clamp(
        this.anos_escolaridade * 0.7 + anos_desejados * 0.3,
        6, 18
      );

      // Níveis de ensino
      const alvo_superior = clamp(0.10 + this.qualificacao_media * 0.40, 0.10, 0.50);
      const alvo_basico = clamp(0.50 - this.qualificacao_media * 0.45, 0.05, 0.50);
      const alvo_secundario = clamp(1 - alvo_superior - alvo_basico, 0.30, 0.60);

      this.niveis.basico = this.niveis.basico * 0.9 + alvo_basico * 0.1;
      this.niveis.secundario = this.niveis.secundario * 0.9 + alvo_secundario * 0.1;
      this.niveis.superior = this.niveis.superior * 0.9 + alvo_superior * 0.1;

      const soma = this.niveis.basico + this.niveis.secundario + this.niveis.superior;
      if (soma > 0) {
        this.niveis.basico /= soma;
        this.niveis.secundario /= soma;
        this.niveis.superior /= soma;
      }

      // Fuga de cérebros
      const salario_atrativo = salario > 25000;
      const fuga = this.fuga_cerebros * (salario_atrativo ? 0.3 : 1.5);
      const efeito_fuga = fuga * this.niveis.superior * 0.05;
      this.qualificacao_media = clamp(
        this.qualificacao_media - efeito_fuga,
        0.20, 0.95
      );

      return {
        anos_escolaridade: this.anos_escolaridade,
        qualificacao_media: this.qualificacao_media,
        niveis: { ...this.niveis },
        fuga_cerebros: fuga,
      };
    },
  };
}