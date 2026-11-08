/**
 * SISTEMA: TRABALHO
 * População ativa, empregados, setores, automação.
 * Aceita modificador de transição verde do clima.
 */

import { clamp } from "../utils.js";

export function criarTrabalho(dados) {
  const tp0 = Number(dados.taxa_participacao);
  const des0 = Number(dados.desemprego);
  const setores = {
    agricultura: Number(dados.setores?.agricultura) || 0.04,
    industria: Number(dados.setores?.industria) || 0.22,
    servicos: Number(dados.setores?.servicos) || 0.68,
    tecnologia: Number(dados.setores?.tecnologia) || 0.06,
  };
  const automacao = {
    agricultura: 0.30,
    industria: 0.40,
    servicos: 0.10,
    tecnologia: 0.20,
  };
  const somaSetores = Object.values(setores).reduce((soma, valor) => soma + valor, 0);
  for (const setor of Object.keys(setores)) setores[setor] /= somaSetores;
  const automacaoMediaInicial = Object.keys(setores).reduce(
    (soma, setor) => soma + setores[setor] * automacao[setor],
    0
  );

  return {
    populacao_ativa: 0,
    taxa_participacao: Number.isFinite(tp0) ? tp0 : 0.60,
    empregados: 0,
    desempregados: 0,
    desemprego: Number.isFinite(des0) ? des0 : 0.06,

    setores,
    automacao,
    automacao_media_anterior: automacaoMediaInicial,

    salario_relativo: {
      baixa: 0.7,
      media: 1.0,
      alta: 1.6,
    },

    step(contexto) {
      const populacao = Number(contexto.populacao) || 0;
      const ativos = Number(contexto.ativos) || 0.63;
      const qualificacao_media = Number(contexto.qualificacao_media) || 0.4;
      const investimento_infra = Number(contexto.investimento_infra) || 0;
      const modificador_setor_verde = Number(contexto.modificador_setor_verde) || 0;
      const crescimento_real_anterior = Number(contexto.crescimento_real_anterior) || 0;
      const modificador_desemprego = Number(contexto.modificador_desemprego) || 0;

      // 1. População ativa
      this.populacao_ativa = populacao * ativos;

      // 2. Taxa de participação
      const participacao_desejada = clamp(
        0.55 + qualificacao_media * 0.15,
        0.50, 0.75
      );
      this.taxa_participacao = clamp(
        this.taxa_participacao * 0.9 + participacao_desejada * 0.1,
        0.50, 0.75
      );

      // 3. Setores
      const infra = investimento_infra;

      // Evolução base (sem verde)
      this.setores.agricultura = clamp(this.setores.agricultura - 0.002, 0.01, 0.10);
      this.setores.industria = clamp(this.setores.industria - 0.001, 0.10, 0.30);
      this.setores.servicos = clamp(this.setores.servicos - 0.001 + infra * 0.02, 0.55, 0.75);
      this.setores.tecnologia = clamp(this.setores.tecnologia + 0.002 + infra * 0.01, 0.03, 0.20);

      // Efeito da transição verde:
      //   - indústria perde (fósseis, produção intensiva em energia)
      //   - tecnologia ganha (renováveis, inovação, serviços verdes)
      if (modificador_setor_verde > 0) {
        this.setores.industria = clamp(
          this.setores.industria - modificador_setor_verde * 0.5,
          0.08, 0.30
        );
        this.setores.tecnologia = clamp(
          this.setores.tecnologia + modificador_setor_verde * 0.8,
          0.03, 0.25
        );
        this.setores.servicos = clamp(
          this.setores.servicos + modificador_setor_verde * 0.2,
          0.55, 0.78
        );
      }

      // Normalizar
      const soma = this.setores.agricultura + this.setores.industria
                 + this.setores.servicos + this.setores.tecnologia;
      if (soma > 0) {
        for (const k in this.setores) this.setores[k] /= soma;
      }

      // 4. Automação
      this.automacao.agricultura = clamp(this.automacao.agricultura + 0.003, 0, 0.85);
      this.automacao.industria = clamp(this.automacao.industria + 0.004, 0, 0.85);
      this.automacao.servicos = clamp(this.automacao.servicos + 0.005, 0, 0.85);
      this.automacao.tecnologia = clamp(this.automacao.tecnologia + 0.006, 0, 0.85);

      // 5. Adoção de automação afeta produtividade e transições no emprego.
      const automacao_media =
        this.setores.agricultura * this.automacao.agricultura +
        this.setores.industria * this.automacao.industria +
        this.setores.servicos * this.automacao.servicos +
        this.setores.tecnologia * this.automacao.tecnologia;
      const variacao_automacao = Math.max(0, automacao_media - this.automacao_media_anterior);
      this.automacao_media_anterior = automacao_media;

      const substituicao_empregos = variacao_automacao * (1 - qualificacao_media) * 0.55;
      const novas_atividades = variacao_automacao * qualificacao_media * 0.18;
      const efeito_ciclo = -clamp(crescimento_real_anterior, -0.10, 0.10) * 0.12;
      this.desemprego = clamp(
        this.desemprego + substituicao_empregos - novas_atividades + efeito_ciclo + modificador_desemprego,
        0.02,
        0.30
      );

      // 6. Emprego usa o desemprego atualizado neste passo.
      this.empregados = this.populacao_ativa * this.taxa_participacao * (1 - this.desemprego);
      this.desempregados = this.populacao_ativa * this.taxa_participacao * this.desemprego;

      return {
        populacao_ativa: this.populacao_ativa,
        taxa_participacao: this.taxa_participacao,
        empregados: this.empregados,
        desempregados: this.desempregados,
        desemprego: this.desemprego,
        setores: { ...this.setores },
        automacao_media,
        variacao_automacao,
        substituicao_empregos,
        novas_atividades,
        ganho_produtividade_automacao: variacao_automacao * 0.30,
        salario_relativo: { ...this.salario_relativo },
      };
    },
  };
}