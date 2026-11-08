/**
 * SISTEMA: POLÍTICA
 * Ideologias multidimensionais, aprovação, eleições e execução de políticas.
 * Coeficientes são hipóteses de cenário, não estimativas eleitorais.
 */
import { clamp } from "../utils.js";

const EIXOS = [
  "intervencao_economica",
  "tradicionalismo_social",
  "abertura_externa",
  "prioridade_climatica",
];

const PARTIDOS_PADRAO = [
  {
    id: "social",
    nome: "Aliança Social",
    apoio: 0.40,
    posicoes: { intervencao_economica: 0.72, tradicionalismo_social: 0.35, abertura_externa: 0.65, prioridade_climatica: 0.72 },
  },
  {
    id: "liberal",
    nome: "União Liberal",
    apoio: 0.35,
    posicoes: { intervencao_economica: 0.30, tradicionalismo_social: 0.48, abertura_externa: 0.82, prioridade_climatica: 0.42 },
  },
  {
    id: "verde",
    nome: "Movimento Verde",
    apoio: 0.25,
    posicoes: { intervencao_economica: 0.62, tradicionalismo_social: 0.25, abertura_externa: 0.68, prioridade_climatica: 0.96 },
  },
];

const COMPETITIVIDADE_REGIME = {
  democracia: 1,
  hibrido: 0.55,
  autoritario: 0.05,
};

function clonarPartidos(partidos) {
  const origem = Array.isArray(partidos) && partidos.length ? partidos : PARTIDOS_PADRAO;
  const somaApoio = origem.reduce((soma, partido) => soma + Math.max(0, Number(partido.apoio) || 0), 0);
  return origem.map((partido) => ({
    id: String(partido.id),
    nome: String(partido.nome || partido.id),
    apoio: somaApoio > 0 ? Math.max(0, Number(partido.apoio) || 0) / somaApoio : 1 / origem.length,
    posicoes: Object.fromEntries(EIXOS.map((eixo) => [
      eixo,
      Number.isFinite(Number(partido.posicoes?.[eixo]))
        ? clamp(Number(partido.posicoes[eixo]), 0, 1)
        : 0.5,
    ])),
  }));
}

export function criarPolitica(dados = {}) {
  const regime = COMPETITIVIDADE_REGIME[dados.regime]
    ? dados.regime
    : "democracia";
  const preferencias = Object.fromEntries(EIXOS.map((eixo) => [
    eixo,
    Number.isFinite(Number(dados.preferencias_eleitorado?.[eixo]))
      ? clamp(Number(dados.preferencias_eleitorado[eixo]), 0, 1)
      : 0.5,
  ]));
  const qualidade = Number(dados.qualidade_institucional);
  const influenciaGrupos = Number(dados.influencia_grupos_interesse);
  const aprovacaoInicial = Number(dados.aprovacao_inicial);

  return {
    regime,
    competitividade_eleitoral: COMPETITIVIDADE_REGIME[regime],
    qualidade_institucional: Number.isFinite(qualidade) ? clamp(qualidade, 0, 1) : 0.65,
    influencia_grupos_interesse: Number.isFinite(influenciaGrupos) ? clamp(influenciaGrupos, 0, 1) : 0.25,
    ciclo_eleitoral: Math.trunc(clamp(Number(dados.ciclo_eleitoral) || 4, 2, 8)),
    preferencias_eleitorado: preferencias,
    partidos: clonarPartidos(dados.partidos),
    partido_governo: String(dados.partido_governo || dados.partidos?.[0]?.id || "social"),
    aprovacao: Number.isFinite(aprovacaoInicial) ? clamp(aprovacaoInicial, 0, 1) : 0.50,
    apoio_governo: 0.40,
    apoio_oposicao: 0.35,
    partido_oposicao: "liberal",
    eleicao_realizada: false,
    ultima_eleicao: 0,
    multiplicador_implementacao: 1,
    prioridades_politica: {},

    step(contexto) {
      const satisfacao = clamp(Number(contexto.satisfacao) || 0.6, 0, 1);
      const confianca = clamp(Number(contexto.confianca) || 0.5, 0, 1);
      const coesao = clamp(Number(contexto.coesao) || 0.6, 0, 1);
      const gini = clamp(Number(contexto.gini) || 0.33, 0, 1);
      const desemprego = clamp(Number(contexto.desemprego) || 0.06, 0, 1);
      const inflacao = Number(contexto.inflacao) || 0.02;
      const crescimento = Number(contexto.crescimento_real) || 0;
      const ano = Math.max(1, Math.trunc(Number(contexto.ano) || 1));

      const estabilidadePrecos = 1 - clamp(Math.abs(inflacao - 0.02) / 0.15, 0, 1);
      const desempenho = clamp(
        0.28 * satisfacao
        + 0.22 * confianca
        + 0.16 * coesao
        + 0.12 * (1 - gini)
        + 0.12 * (1 - desemprego)
        + 0.06 * estabilidadePrecos
        + 0.04 * clamp(0.5 + crescimento * 5, 0, 1),
        0,
        1
      );
      this.aprovacao = clamp(this.aprovacao * 0.75 + desempenho * 0.25, 0, 1);

      const votos = this.partidos.map((partido) => {
        const distancia = EIXOS.reduce((soma, eixo) => {
          const diferenca = partido.posicoes[eixo] - this.preferencias_eleitorado[eixo];
          return soma + diferenca * diferenca;
        }, 0) / EIXOS.length;
        const compatibilidade = Math.exp(-2 * distancia);
        const bonusGoverno = partido.id === this.partido_governo
          ? 0.7 + this.aprovacao * 0.6
          : 1;
        return { partido, votos: partido.apoio * compatibilidade * bonusGoverno };
      });
      const totalVotos = votos.reduce((soma, item) => soma + item.votos, 0) || 1;
      for (const item of votos) item.votos /= totalVotos;
      votos.sort((a, b) => b.votos - a.votos);

      let eleicaoRealizada = false;
      if (ano % this.ciclo_eleitoral === 0) {
        eleicaoRealizada = true;
        this.ultima_eleicao = ano;
        const incumbente = votos.find((item) => item.partido.id === this.partido_governo);
        const candidatoMaisVotado = votos[0];
        const margemAutoritaria = (1 - this.competitividade_eleitoral) * 0.35;
        const incumbenteAjustado = (incumbente?.votos || 0) + margemAutoritaria;
        if (candidatoMaisVotado.partido.id !== this.partido_governo
          && candidatoMaisVotado.votos * this.competitividade_eleitoral > incumbenteAjustado) {
          this.partido_governo = candidatoMaisVotado.partido.id;
        }
      }

      const governo = this.partidos.find((partido) => partido.id === this.partido_governo) || this.partidos[0];
      const resultadoGoverno = votos.find((item) => item.partido.id === governo.id);
      const oposicao = votos.find((item) => item.partido.id !== governo.id);
      const capacidadeEstado = clamp(
        0.45 + 0.45 * this.qualidade_institucional - 0.15 * this.influencia_grupos_interesse,
        0.20,
        1
      );
      this.multiplicador_implementacao = clamp(
        capacidadeEstado * (0.70 + 0.30 * this.aprovacao),
        0.20,
        1
      );
      this.prioridades_politica = {
        subsidio_filho: clamp(0.75 + 0.25 * governo.posicoes.tradicionalismo_social, 0.5, 1),
        investimento_educacao: clamp(0.65 + 0.35 * governo.posicoes.intervencao_economica, 0.5, 1),
        investimento_infra: clamp(0.65 + 0.35 * governo.posicoes.intervencao_economica, 0.5, 1),
        investimento_verde: clamp(0.50 + 0.50 * governo.posicoes.prioridade_climatica, 0.4, 1),
        carbono_tax_eur_ton: clamp(0.40 + 0.60 * governo.posicoes.prioridade_climatica, 0.3, 1),
        subsidio_renda: clamp(0.65 + 0.35 * governo.posicoes.intervencao_economica, 0.5, 1),
        investimento_habitacao: clamp(0.65 + 0.35 * governo.posicoes.intervencao_economica, 0.5, 1),
      };
      this.apoio_governo = resultadoGoverno?.votos || 0;
      this.apoio_oposicao = oposicao?.votos || 0;
      this.partido_oposicao = oposicao?.partido.id || "";
      this.eleicao_realizada = eleicaoRealizada;

      return {
        regime: this.regime,
        aprovacao: this.aprovacao,
        apoio_governo: this.apoio_governo,
        apoio_oposicao: this.apoio_oposicao,
        partido_governo: governo.id,
        nome_partido_governo: governo.nome,
        partido_oposicao: this.partido_oposicao,
        nome_partido_oposicao: oposicao?.partido.nome || "",
        eleicao_realizada: this.eleicao_realizada,
        competitividade_eleitoral: this.competitividade_eleitoral,
        qualidade_institucional: this.qualidade_institucional,
        capacidade_estado: capacidadeEstado,
        multiplicador_implementacao: this.multiplicador_implementacao,
        prioridades_politica: { ...this.prioridades_politica },
      };
    },

    aplicarPolitica(nome, valor) {
      const prioridade = this.prioridades_politica[nome] ?? 1;
      return Math.max(0, Number(valor) || 0) * this.multiplicador_implementacao * prioridade;
    },
  };
}