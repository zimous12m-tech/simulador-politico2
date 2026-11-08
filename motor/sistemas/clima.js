/**
 * SISTEMA: CLIMA / ENERGIA
 * Emissões de CO₂, transição energética, preço da energia,
 * dependência externa, desastres naturais.
 *
 * Portugal ~2026:
 *   - Emissões per capita: ~4,5 t/ano
 *   - Mix energético: ~30% renováveis, ~70% fósseis
 *   - Dependência externa: ~75%
 *   - Preço da energia: 100 (índice)
 *
 * O utilizador controla o "investimento verde" (% PIB).
 *
 * Efeitos propagados (via contexto):
 *   modificador_pib_energia     → economia.js
 *   modificador_setor_verde     → trabalho.js
 *   custo_investimento_verde    → financas.js
 *   modificador_coesao_clima    → sociedade.js
 *   modificador_mortalidade     → demografia.js (desastres)
 */

import { clamp } from "../utils.js";

export function criarClima(dados = {}) {
  const emissoes0 = Number(dados.emissoes_co2_per_capita);
  const renovaveis0 = Number(dados.percentagem_renovaveis);
  const dependencia0 = Number(dados.dependencia_externa);
  const preco0 = Number(dados.preco_energia_indice);

  return {
    // ── Estado inicial ──
    emissoes_co2_per_capita: Number.isFinite(emissoes0) ? emissoes0 : 4.5,
    emissoes_acumuladas: 0,          // proxy para temperatura
    percentagem_renovaveis: Number.isFinite(renovaveis0) ? renovaveis0 : 0.30,
    dependencia_externa: Number.isFinite(dependencia0) ? dependencia0 : 0.75,
    preco_energia_indice: Number.isFinite(preco0) ? preco0 : 100,

    // ── Estado dinâmico ──
    temperatura_proxy: 0,            // sobe com emissões acumuladas
    desastre_natural_ativo: false,
    desastre_natural_tipo: "",
    desastre_natural_duracao: 0,
    desastre_natural_intensidade: 0,

    // ── Alertas para a UI ──
    alerta_clima: false,
    alerta_tipo: "",

    step(contexto) {
      const populacao = Number(contexto.populacao) || 11_000_000;
      const pib = Number(contexto.pib) || 250_000_000_000;
      const investimento_verde_bruto = Number(contexto.investimento_verde) || 0;
      const investimento_infra = Number(contexto.investimento_infra) || 0;

      // Normalizar investimento verde (aceitar % ou fracção)
      const inv_verde = clamp(
        investimento_verde_bruto > 1
          ? investimento_verde_bruto / 100
          : investimento_verde_bruto,
        0, 0.10
      );

      // ── 1. DURAÇÃO DE DESASTRES ──
      if (this.desastre_natural_ativo) {
        this.desastre_natural_duracao -= 1;
        if (this.desastre_natural_duracao <= 0) {
          this.desastre_natural_ativo = false;
          this.desastre_natural_tipo = "";
          this.desastre_natural_intensidade = 0;
        }
      }

      // ── 2. EMISSÕES ──
      //    Sobe com PIB per capita, desce com investimento verde.
      const pib_per_capita = pib / Math.max(populacao, 1);
      const pib_per_capita_inicial = 25000;
      const fator_riqueza = pib_per_capita / pib_per_capita_inicial;

      const fator_renovaveis = 1 - this.percentagem_renovaveis * 1.2;
      const emissoes_desejadas = 4.5 * fator_riqueza * clamp(fator_renovaveis, 0.2, 1.2);
      this.emissoes_co2_per_capita = clamp(
        this.emissoes_co2_per_capita * 0.9 + emissoes_desejadas * 0.1,
        0.5, 15
      );

      // Emissões totais acumuladas (proxy temperatura)
      const emissoes_totais_ano = this.emissoes_co2_per_capita * populacao / 1_000_000;
      this.emissoes_acumuladas += emissoes_totais_ano;
      this.temperatura_proxy = this.emissoes_acumuladas / 10000; // escala

      // ── 3. TRANSIÇÃO ENERGÉTICA ──
      //    % renováveis sobe com investimento verde, desce com crise.
      const efeito_inv = inv_verde * 2.5;
      const efeito_infra = investimento_infra * 0.5;
      // Rendimento pode acelerar o investimento, mas rendimento baixo não desinstala capacidade existente.
      const efeito_pib = Math.max(0, fator_riqueza - 1) * 0.025;
      const crescimento_renovaveis = efeito_inv + efeito_infra + efeito_pib;

      this.percentagem_renovaveis = clamp(
        this.percentagem_renovaveis + crescimento_renovaveis,
        0.10, 0.95
      );

      // ── 4. DEPENDÊNCIA EXTERNA ──
      //    Desce com renováveis, sobe com consumo.
      const dependencia_desejada = clamp(
        0.90 - this.percentagem_renovaveis * 0.80,
        0.05, 0.90
      );
      this.dependencia_externa = clamp(
        this.dependencia_externa * 0.85 + dependencia_desejada * 0.15,
        0.05, 0.95
      );

      // ── 5. PREÇO DA ENERGIA ──
      //    Sobe com dependência, desce com renováveis.
      const preco_desejado = 100
        + this.dependencia_externa * 80
        - this.percentagem_renovaveis * 40;

      // Ajuste suave
      this.preco_energia_indice = clamp(
        this.preco_energia_indice * 0.9 + preco_desejado * 0.1,
        50, 300
      );

      // ── 6. DESASTRES NATURAIS ──
      //    Raro, mas a probabilidade sobe com temperatura_proxy.
      //    Usa um RNG local determinístico baseado em emissões acumuladas.
      if (!this.desastre_natural_ativo) {
        const prob_base = 0.005; // 0,5%/ano
        const prob_temp = this.temperatura_proxy * 0.002;
        const prob = clamp(prob_base + prob_temp, 0, 0.05);

        // RNG determinístico simples (baseado em ano + emissões)
        const seed = (this.emissoes_acumuladas * 1000 + populacao) % 1;
        if (seed < prob) {
          const tipos = ["Seca", "Cheia", "Incêndio", "Onda de calor"];
          const idx = Math.floor((seed * 10000) % tipos.length);
          this.desastre_natural_ativo = true;
          this.desastre_natural_tipo = tipos[idx];
          this.desastre_natural_duracao = 1;
          this.desastre_natural_intensidade = 0.3 + (seed * 100 % 1) * 0.5;
        }
      }

      // ── 7. MODIFICADORES PARA OUTROS SISTEMAS ──
      //    Preço da energia: 100 = neutro; >100 = penaliza economia
      const modificador_pib_energia = clamp(
        -(this.preco_energia_indice - 100) / 100 * 0.005,
        -0.01, 0.005
      );

      // Transição verde: estimula setor tecnologia, penaliza indústria
      const modificador_setor_verde = clamp(
        inv_verde * 0.5 + crescimento_renovaveis * 0.2,
        0, 0.03
      );

      // Custo do investimento verde (% PIB extra na despesa)
      const custo_investimento_verde = inv_verde;

      // Efeito na coesão: desastres e transição desordenada
      let modificador_coesao_clima = 0;
      if (this.desastre_natural_ativo) {
        modificador_coesao_clima -= this.desastre_natural_intensidade * 0.02;
      }
      // Transição muito rápida também stressa
      if (crescimento_renovaveis > 0.04) {
        modificador_coesao_clima -= 0.005;
      }

      // Mortalidade extra por desastres
      const modificador_mortalidade = this.desastre_natural_ativo
        ? this.desastre_natural_intensidade * 0.0002
        : 0;

      // ── 8. ALERTAS ──
      this.alerta_clima =
        this.desastre_natural_ativo ||
        this.preco_energia_indice > 180 ||
        this.percentagem_renovaveis < 0.15;

      const alertas = [];
      if (this.desastre_natural_ativo) {
        alertas.push(`Desastre: ${this.desastre_natural_tipo}`);
      }
      if (this.preco_energia_indice > 180) {
        alertas.push("Preço da energia elevado");
      }
      if (this.percentagem_renovaveis < 0.15) {
        alertas.push("Transição energética atrasada");
      }
      this.alerta_tipo = alertas.join(" · ");

      return {
        emissoes_co2_per_capita: this.emissoes_co2_per_capita,
        emissoes_acumuladas: this.emissoes_acumuladas,
        temperatura_proxy: this.temperatura_proxy,
        percentagem_renovaveis: this.percentagem_renovaveis,
        dependencia_externa: this.dependencia_externa,
        preco_energia_indice: this.preco_energia_indice,

        desastre_natural_ativo: this.desastre_natural_ativo,
        desastre_natural_tipo: this.desastre_natural_tipo,
        desastre_natural_intensidade: this.desastre_natural_intensidade,

        alerta_clima: this.alerta_clima,
        alerta_tipo: this.alerta_tipo,

        // Modificadores para outros sistemas
        modificador_pib_energia,
        modificador_setor_verde,
        custo_investimento_verde,
        modificador_coesao_clima,
        modificador_mortalidade,
      };
    },
  };
}