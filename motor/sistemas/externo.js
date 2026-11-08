/**
 * SISTEMA: SETOR EXTERNO
 * Comércio, conta corrente, fluxos de capital, câmbio e preço de importação.
 * Sem observações de comércio, o sistema fica explicitamente inativo.
 */
import { clamp } from "../utils.js";

function neutro() {
  return {
    ativo: false,
    exportacoes: null,
    importacoes: null,
    balanca_comercial: null,
    conta_corrente: null,
    conta_corrente_pct_pib: null,
    necessidade_financiamento_externo: null,
    modificador_pib_comercio: 0,
    crescimento_importacoes: 0,
    fluxos_capitais_pct_pib: null,
    cambio_local_usd: null,
    indice_preco_importacao: null,
    inflacao_importada: 0,
    reservas_meses_importacao: null,
  };
}

export function criarSetorExterno(dados = {}, pibInicial = 0) {
  const exportacoesPct = Number(dados.exportacoes_pct_pib);
  const importacoesPct = Number(dados.importacoes_pct_pib);
  const contaCorrentePct = Number(dados.conta_corrente_pct_pib);
  const cambioInicial = Number(dados.cambio_local_usd);
  const reservasIniciais = Number(dados.reservas_meses_importacao);
  const pibBase = Number(pibInicial);
  const ativo = Number.isFinite(exportacoesPct)
    && Number.isFinite(importacoesPct)
    && Number.isFinite(contaCorrentePct)
    && Number.isFinite(pibBase)
    && pibBase > 0;

  if (!ativo) {
    return { ativo: false, step: neutro };
  }

  const elasticidadeImportacoes = Number.isFinite(Number(dados.elasticidade_importacoes))
    ? clamp(Number(dados.elasticidade_importacoes), 0, 3)
    : 1.0;
  const exportacoesReaisIniciais = pibBase * exportacoesPct;
  const importacoesReaisIniciais = pibBase * importacoesPct;
  const transferenciasERendimentosPctPib = contaCorrentePct - exportacoesPct + importacoesPct;

  return {
    ativo: true,
    exportacoes_reais: exportacoesReaisIniciais,
    importacoes_reais: importacoesReaisIniciais,
    pib_real_anterior: pibBase,
    absorcao_real_anterior: pibBase * 0.85,
    transferencias_e_rendimentos_pct_pib: transferenciasERendimentosPctPib,
    elasticidade_importacoes: elasticidadeImportacoes,
    cambio_ativo: Number.isFinite(cambioInicial) && cambioInicial > 0,
    cambio_local_usd: Number.isFinite(cambioInicial) && cambioInicial > 0 ? cambioInicial : null,
    indice_preco_importacao: 1,
    inflacao_importada: 0,
    reservas_meses_importacao: Number.isFinite(reservasIniciais) ? Math.max(0, reservasIniciais) : null,
    conta_corrente_pct_pib_anterior: contaCorrentePct,
    elasticidade_importacao_preco: Number.isFinite(Number(dados.elasticidade_importacao_preco))
      ? clamp(Number(dados.elasticidade_importacao_preco), 0, 2)
      : 1.0,
    elasticidade_exportacoes_cambio: Number.isFinite(Number(dados.elasticidade_exportacoes_cambio))
      ? clamp(Number(dados.elasticidade_exportacoes_cambio), 0, 2)
      : 1.0,

    step(contexto) {
      const pibReal = Math.max(1, Number(contexto.pib_real) || this.pib_real_anterior);
      const pibNominal = Math.max(1, Number(contexto.pib_nominal) || pibReal);
      const indicePrecos = Math.max(0.01, Number(contexto.indice_precos) || 1);
      const consumoPctPib = clamp(Number(contexto.consumo_pct_pib) || 0.65, 0, 1);
      const investimentoPctPib = clamp(Number(contexto.investimento_pct_pib) || 0.20, 0, 1);
      const procuraExterna = clamp(Number(contexto.crescimento_procura_externa) || 0, -0.20, 0.20);
      const taxaJuroDirectora = clamp(Number(contexto.taxa_juro_directora) || 0, 0, 0.20);
      const taxaJuroExterna = clamp(Number(contexto.taxa_juro_externa) || 0.035, 0, 0.20);
      const inflacaoExterna = clamp(Number(contexto.inflacao_externa) || 0.02, -0.05, 0.30);

      let fluxosCapitaisPctPib = null;
      let variacaoCambio = 0;
      if (this.cambio_ativo) {
        // Diferencial de juros proxy de fluxos de carteira; coeficiente assumido, não estimado.
        fluxosCapitaisPctPib = clamp((taxaJuroDirectora - taxaJuroExterna) * 0.25, -0.03, 0.03);
        const fluxoLiquidoAnterior = this.conta_corrente_pct_pib_anterior + fluxosCapitaisPctPib;
        variacaoCambio = clamp(-fluxoLiquidoAnterior * 0.40, -0.05, 0.05);
        this.cambio_local_usd *= 1 + variacaoCambio;

        const variacaoPrecoImportado = clamp(inflacaoExterna + variacaoCambio, -0.20, 0.40);
        const indiceAnterior = this.indice_preco_importacao;
        this.indice_preco_importacao *= 1 + variacaoPrecoImportado;
        const variacaoIndiceImportacao = this.indice_preco_importacao / Math.max(indiceAnterior, 1e-9) - 1;
        this.inflacao_importada = variacaoIndiceImportacao * importacoesPct;
        this.variacao_preco_importacao = variacaoIndiceImportacao;
      }

      const absorcaoReal = pibReal * (consumoPctPib + investimentoPctPib);
      const crescimentoProcuraInterna = clamp(
        absorcaoReal / Math.max(this.absorcao_real_anterior, 1) - 1,
        -0.30,
        0.30
      );
      const crescimentoExportacoes = clamp(
        procuraExterna + variacaoCambio * this.elasticidade_exportacoes_cambio,
        -0.30,
        0.30
      );
      const crescimentoImportacoes = clamp(
        crescimentoProcuraInterna * this.elasticidade_importacoes
          - this.variacao_preco_importacao * this.elasticidade_importacao_preco,
        -0.30,
        0.30
      );

      const exportacoesReaisAnterior = this.exportacoes_reais;
      const importacoesReaisAnterior = this.importacoes_reais;
      this.exportacoes_reais *= 1 + crescimentoExportacoes;
      this.importacoes_reais *= 1 + crescimentoImportacoes;

      const saldoLiquidoRealAnterior = exportacoesReaisAnterior - importacoesReaisAnterior;
      const saldoLiquidoReal = this.exportacoes_reais - this.importacoes_reais;
      const modificadorPibComercio = clamp(
        (saldoLiquidoReal - saldoLiquidoRealAnterior) / Math.max(this.pib_real_anterior, 1),
        -0.10,
        0.10
      );

      const exportacoes = this.exportacoes_reais * indicePrecos;
      const importacoes = this.importacoes_reais * indicePrecos * this.indice_preco_importacao;
      const balancaComercial = exportacoes - importacoes;
      const rendimentosTransferencias = pibNominal * this.transferencias_e_rendimentos_pct_pib;
      const contaCorrente = balancaComercial + rendimentosTransferencias;
      const contaCorrentePctPibActual = contaCorrente / pibNominal;

      if (this.cambio_ativo) {
        const fluxoLiquidoActual = contaCorrentePctPibActual + fluxosCapitaisPctPib;
        if (this.reservas_meses_importacao !== null) {
          const intervencaoReservas = clamp(
            Number(contexto.intervencao_reservas_pct_fluxo) || 0,
            0,
            1
          );
          const variacaoReservas = 12 * fluxoLiquidoActual * intervencaoReservas
            / Math.max(importacoes / pibNominal, 0.01);
          this.reservas_meses_importacao = Math.max(0, this.reservas_meses_importacao + variacaoReservas);
        }
        this.conta_corrente_pct_pib_anterior = contaCorrentePctPibActual;
      }

      this.pib_real_anterior = pibReal;
      this.absorcao_real_anterior = absorcaoReal;

      return {
        ativo: true,
        exportacoes,
        importacoes,
        balanca_comercial: balancaComercial,
        conta_corrente: contaCorrente,
        conta_corrente_pct_pib: contaCorrentePctPibActual,
        necessidade_financiamento_externo: -contaCorrente,
        modificador_pib_comercio: modificadorPibComercio,
        crescimento_importacoes: crescimentoImportacoes,
        fluxos_capitais_pct_pib: fluxosCapitaisPctPib,
        cambio_local_usd: this.cambio_local_usd,
        variacao_cambio: variacaoCambio,
        indice_preco_importacao: this.cambio_ativo ? this.indice_preco_importacao : null,
        inflacao_importada: this.cambio_ativo ? this.inflacao_importada : 0,
        variacao_preco_importacao: this.cambio_ativo ? this.variacao_preco_importacao : 0,
        reservas_meses_importacao: this.reservas_meses_importacao,
      };
    },
  };
}