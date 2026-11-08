/**
 * SISTEMA: CRISES
 * Eventos raros com grande impacto: recessões, crise de dívida,
 * emigração em massa, fuga de cérebros, resgate externo, choques externos,
 * crise energética, desastre natural, transição desordenada.
 *
 * RNG estável (mulberry32) para reprodutibilidade.
 *
 * MODO "TENDÊNCIA": se `ativas: false`, devolve modificadores a zero.
 *
 * NOTA: as recessões têm efeito TRANSITÓRIO — no ano seguinte ao fim,
 * há um impulso de recuperação que devolve ~2/3 do crescimento perdido.
 */

import { clamp } from "../utils.js";

function criarRNG(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function resultadoNeutro() {
  return {
    crise_ativa: false,
    crise_tipo: "",
    eventos: [],
    modificador_pib: 0,
    modificador_desemprego: 0,
    modificador_receita: 0,
    modificador_juro: 0,
    modificador_migracao: 0,
    modificador_coesao: 0,
    modificador_mortalidade: 0,
    modificador_pib_energia: 0,
    custo_fiscal_crise: 0,
    recessao_ativa: false,
    crise_divida_ativa: false,
    choque_externo_ativo: false,
    resgate_ativo: false,
    emigracao_massa_ativa: false,
    fuga_cerebros_aguda_ativa: false,
    crise_energetica_ativa: false,
    transicao_desordenada_ativa: false,
  };
}

export function criarCrises(dados = {}) {
  const seed = Number.isFinite(dados.seed) ? dados.seed : 12345;
  const ativas = dados.ativas !== false;
  const rng = criarRNG(seed);

  return {
    ativas,

    // ── Estado interno ──
    recessao_ativa: false,
    recessao_duracao: 0,
    recessao_intensidade: 0,
    impulso_recuperacao: 0,

    crise_divida_ativa: false,
    resgate_ativo: false,
    resgate_duracao: 0,

    choque_externo_ativo: false,
    choque_externo_tipo: "",
    choque_externo_duracao: 0,
    choque_externo_intensidade: 0,

    crise_energetica_ativa: false,
    crise_energetica_duracao: 0,
    crise_energetica_intensidade: 0,

    transicao_desordenada_ativa: false,

    emigracao_massa_ativa: false,
    fuga_cerebros_aguda_ativa: false,

    // ── UI ──
    eventos_ultimo_ano: [],
    crise_ativa: false,
    crise_tipo: "",

    step(contexto) {
      if (!this.ativas) {
        return resultadoNeutro();
      }

      const pib_per_capita_inicial = Number(contexto.pib_per_capita_inicial) || 25000;
      const desemprego = Number(contexto.desemprego) || 0.06;
      const divida_pct_pib = Number(contexto.divida_pct_pib) || 0.9;
      const coesao = Number(contexto.coesao) || 0.7;
      const salario_medio = Number(contexto.salario_medio) || 16000;
      const qualificacao = Number(contexto.qualificacao_media) || 0.4;
      const preco_energia = Number(contexto.preco_energia_indice) || 100;
      const renovaveis = Number(contexto.percentagem_renovaveis) || 0.30;

      this.eventos_ultimo_ano = [];
      this.impulso_recuperacao = 0;

      // ── 0. Actualizar durações ──
      if (this.recessao_ativa) {
        this.recessao_duracao -= 1;
        if (this.recessao_duracao <= 0) {
          this.recessao_ativa = false;
          this.eventos_ultimo_ano.push("Fim da recessão");
          this.impulso_recuperacao = this.recessao_intensidade * 0.02;
          this.recessao_intensidade = 0;
        }
      }

      if (this.choque_externo_ativo) {
        this.choque_externo_duracao -= 1;
        if (this.choque_externo_duracao <= 0) {
          this.choque_externo_ativo = false;
          this.choque_externo_tipo = "";
          this.choque_externo_intensidade = 0;
          this.eventos_ultimo_ano.push("Fim do choque externo");
        }
      }

      if (this.crise_energetica_ativa) {
        this.crise_energetica_duracao -= 1;
        if (this.crise_energetica_duracao <= 0) {
          this.crise_energetica_ativa = false;
          this.crise_energetica_intensidade = 0;
          this.eventos_ultimo_ano.push("Fim da crise energética");
        }
      }

      if (this.resgate_ativo) {
        this.resgate_duracao -= 1;
        if (this.resgate_duracao <= 0) {
          this.resgate_ativo = false;
          this.eventos_ultimo_ano.push("Fim do resgate externo");
        }
      }

      // ── 1. RECESSÃO ──
      if (!this.recessao_ativa) {
        let prob_recessao = 0.07;
        if (desemprego > 0.10) prob_recessao += 0.04;
        if (this.choque_externo_ativo) prob_recessao += 0.08;
        if (divida_pct_pib > 1.5) prob_recessao += 0.04;
        if (preco_energia > 160) prob_recessao += 0.03;
        prob_recessao = clamp(prob_recessao, 0, 0.30);

        if (rng() < prob_recessao) {
          this.recessao_ativa = true;
          this.recessao_duracao = 1 + Math.floor(rng() * 3);
          this.recessao_intensidade = 0.3 + rng() * 0.5;
          this.eventos_ultimo_ano.push(
            `Recessão (${this.recessao_duracao} anos, intensidade ${(this.recessao_intensidade * 100).toFixed(0)}%)`
          );
        }
      }

      // ── 2. CHOQUE EXTERNO ──
      if (!this.choque_externo_ativo) {
        const prob_choque = 0.015;
        if (rng() < prob_choque) {
          const tipos = ["Pandemia", "Guerra", "Crise financeira internacional"];
          this.choque_externo_ativo = true;
          this.choque_externo_tipo = tipos[Math.floor(rng() * tipos.length)];
          this.choque_externo_duracao = 1 + Math.floor(rng() * 2);
          this.choque_externo_intensidade = 0.4 + rng() * 0.4;
          this.eventos_ultimo_ano.push(
            `Choque externo: ${this.choque_externo_tipo} (${this.choque_externo_duracao} anos)`
          );
        }
      }

      // ── 3. CRISE ENERGÉTICA ──
      if (preco_energia > 160 && !this.crise_energetica_ativa) {
        this.crise_energetica_ativa = true;
        this.crise_energetica_duracao = 2 + Math.floor(rng() * 2);
        this.crise_energetica_intensidade = clamp((preco_energia - 160) / 100, 0.2, 0.8);
        this.eventos_ultimo_ano.push(
          `Crise energética (${this.crise_energetica_duracao} anos, preço ${preco_energia.toFixed(0)})`
        );
      }

      // ── 4. TRANSIÇÃO DESORDENADA ──
      const transicao_rapida = renovaveis > 0.6;
      const preco_alto = preco_energia > 130;
      if (transicao_rapida && preco_alto) {
        if (!this.transicao_desordenada_ativa) {
          this.eventos_ultimo_ano.push("Transição energética desordenada");
        }
        this.transicao_desordenada_ativa = true;
      } else {
        this.transicao_desordenada_ativa = false;
      }

      // ── 5. CRISE DE DÍVIDA ──
      if (divida_pct_pib > 1.5) {
        if (!this.crise_divida_ativa) {
          this.crise_divida_ativa = true;
          this.eventos_ultimo_ano.push("Crise de dívida soberana");
        }
      } else if (divida_pct_pib < 1.2) {
        this.crise_divida_ativa = false;
      }

      // ── 6. EMIGRAÇÃO EM MASSA ──
      const salario_baixo = salario_medio < pib_per_capita_inicial * 0.65 * 0.6;
      const nova_emigracao = coesao < 0.35 && salario_baixo;
      if (nova_emigracao && !this.emigracao_massa_ativa) {
        this.eventos_ultimo_ano.push("Emigração em massa");
      }
      this.emigracao_massa_ativa = nova_emigracao;

      // ── 7. FUGA DE CÉREBROS ──
      const nova_fuga = qualificacao > 0.60 && salario_baixo;
      if (nova_fuga && !this.fuga_cerebros_aguda_ativa) {
        this.eventos_ultimo_ano.push("Fuga de cérebros aguda");
      }
      this.fuga_cerebros_aguda_ativa = nova_fuga;

      // ── 8. RESGATE EXTERNO ──
      if (divida_pct_pib > 2.0 && !this.resgate_ativo) {
        this.resgate_ativo = true;
        this.resgate_duracao = 3;
        this.eventos_ultimo_ano.push("Resgate externo (FMI/BCE)");
      }

      // ── 9. MODIFICADORES ──
      let modificador_pib = 0;
      if (this.recessao_ativa) modificador_pib -= this.recessao_intensidade * 0.015;
      if (this.choque_externo_ativo) modificador_pib -= this.choque_externo_intensidade * 0.01;
      if (this.resgate_ativo) modificador_pib += 0.005;
      modificador_pib += this.impulso_recuperacao;

      let modificador_desemprego = 0;
      if (this.recessao_ativa) modificador_desemprego += this.recessao_intensidade * 0.02;
      if (this.choque_externo_ativo) modificador_desemprego += this.choque_externo_intensidade * 0.015;
      if (this.crise_energetica_ativa) modificador_desemprego += this.crise_energetica_intensidade * 0.015;

      let modificador_receita = 0;
      if (this.recessao_ativa) modificador_receita -= this.recessao_intensidade * 0.02;
      if (this.choque_externo_ativo) modificador_receita -= this.choque_externo_intensidade * 0.015;

      let modificador_juro = 0;
      if (this.crise_divida_ativa) modificador_juro += 0.03;
      if (this.resgate_ativo) modificador_juro -= 0.01;

      let modificador_migracao = 0;
      if (this.emigracao_massa_ativa) modificador_migracao = -80000;

      let modificador_coesao = 0;
      if (this.recessao_ativa) modificador_coesao -= this.recessao_intensidade * 0.02;
      if (this.choque_externo_ativo) modificador_coesao -= this.choque_externo_intensidade * 0.01;
      if (this.transicao_desordenada_ativa) modificador_coesao -= 0.005;

      let modificador_pib_energia = 0;
      if (this.crise_energetica_ativa) {
        modificador_pib_energia -= this.crise_energetica_intensidade * 0.02;
      }

      let modificador_mortalidade = 0;
      if (this.choque_externo_ativo && this.choque_externo_tipo === "Pandemia") {
        modificador_mortalidade = this.choque_externo_intensidade * 0.0003;
      }

      // ── 10. UI ──
      this.crise_ativa =
        this.recessao_ativa ||
        this.crise_divida_ativa ||
        this.choque_externo_ativo ||
        this.resgate_ativo ||
        this.emigracao_massa_ativa ||
        this.fuga_cerebros_aguda_ativa ||
        this.crise_energetica_ativa ||
        this.transicao_desordenada_ativa;

      const tipos = [];
      if (this.recessao_ativa) tipos.push("Recessão");
      if (this.crise_divida_ativa) tipos.push("Crise de dívida");
      if (this.choque_externo_ativo) tipos.push(`Choque: ${this.choque_externo_tipo}`);
      if (this.crise_energetica_ativa) tipos.push("Crise energética");
      if (this.transicao_desordenada_ativa) tipos.push("Transição desordenada");
      if (this.resgate_ativo) tipos.push("Resgate externo");
      if (this.emigracao_massa_ativa) tipos.push("Emigração em massa");
      if (this.fuga_cerebros_aguda_ativa) tipos.push("Fuga de cérebros");
      this.crise_tipo = tipos.join(" · ");

      return {
        crise_ativa: this.crise_ativa,
        crise_tipo: this.crise_tipo,
        eventos: this.eventos_ultimo_ano.slice(),

        modificador_pib,
        modificador_desemprego,
        modificador_receita,
        modificador_juro,
        modificador_migracao,
        modificador_coesao,
        modificador_mortalidade,
        modificador_pib_energia,
        custo_fiscal_crise: (
          (this.recessao_ativa ? this.recessao_intensidade * 0.02 : 0) +
          (this.choque_externo_ativo ? this.choque_externo_intensidade * 0.03 : 0) +
          (this.crise_energetica_ativa ? this.crise_energetica_intensidade * 0.02 : 0) +
          (this.resgate_ativo ? 0.02 : 0) +
          (this.crise_divida_ativa ? 0.01 : 0)
        ),
        recessao_ativa: this.recessao_ativa,
        crise_divida_ativa: this.crise_divida_ativa,
        choque_externo_ativo: this.choque_externo_ativo,
        resgate_ativo: this.resgate_ativo,
        emigracao_massa_ativa: this.emigracao_massa_ativa,
        fuga_cerebros_aguda_ativa: this.fuga_cerebros_aguda_ativa,
        crise_energetica_ativa: this.crise_energetica_ativa,
        transicao_desordenada_ativa: this.transicao_desordenada_ativa,
      };
    },
  };
}