# Notas de calibração

De onde vieram os números do `portugal.json`.

Última actualização: **FASE 6** (calibração com dados reais 2024).

---

## Fontes

| Fonte | O que forneceu |
|---|---|
| **INE** (Instituto Nacional de Estatística) | População, fertilidade, idade, emprego, salários, habitação |
| **Banco de Portugal** | Dívida pública, taxas de juro |
| **Eurostat** | PIB per capita, qualificação, comparação UE |
| **OCDE** | Qualificação da população |
| **APA** (Agência Portuguesa do Ambiente) | Emissões CO₂ |
| **REN** (Redes Energéticas Nacionais) | Mix energético, renováveis |
| **DGEG** | Dependência energética externa |
| **Pordata** | Gini, coesão social |
| **Eurobarómetro** | Confiança institucional |
| **Observatório da Emigração** | Fuga de cérebros |
| **Confidencial Imobiliário** | Preço m² habitação |

---

## Valores calibrados

### Demografia

| Variável | Valor | Fonte | Notas |
|---|---|---|---|
| População | 11 443 231 | Estimativa | Inclui imigrantes em processo de legalização |
| Idade média | 45,8 | INE 2024 | |
| Fertilidade | 1,35 | INE 2023 | Real é 1,44, ajustado para baixo |
| Mortalidade base | 0,0114 | INE | |
| Esperança de vida | 81,9 | INE 2023 | |
| Saldo migratório | 80 000 | INE 2023 | Real ~120k, conservador |

### Economia

| Variável | Valor | Fonte | Notas |
|---|---|---|---|
| PIB per capita | 24 500 € | Eurostat 2024 | |
| Salário médio | 17 500 € | INE | Ganho médio real é ~19,5k, ajustado |
| Desemprego | 6,4% | INE 2024 | |
| Inflação | 2,4% | INE 2024 | |

### Finanças

| Variável | Valor | Fonte | Notas |
|---|---|---|---|
| Dívida pública | 95,7% PIB | BdP 2024 | |
| Juro médio | 2,7% | BdP | |

### Trabalho

| Variável | Valor | Fonte | Notas |
|---|---|---|---|
| Taxa participação | 62% | INE | |
| Agricultura | 4,5% | INE | |
| Indústria | 18% | INE | |
| Serviços | 71% | INE | |
| Tecnologia | 6,5% | Eurostat | |

### Educação

| Variável | Valor | Fonte | Notas |
|---|---|---|---|
| Anos escolaridade | 10,2 | Eurostat | |
| Qualificação média | 42% | OCDE | |
| Fuga de cérebros | 2,0% | Obs. Emigração | |

### Habitação

| Variável | Valor | Fonte | Notas |
|---|---|---|---|
| Preço m² | 2 800 € | Conf. Imobiliário | Média nacional |
| Renda média | 1 000 € | INE | |
| Stock habitacional | 6 100 000 | INE | |

### Sociedade

| Variável | Valor | Fonte | Notas |
|---|---|---|---|
| Gini | 0,32 | INE/Eurostat | |
| Confiança institucional | 48% | Eurobarómetro | |
| Satisfação com a vida | 62% | Eurostat | |

### Clima / Energia

| Variável | Valor | Fonte | Notas |
|---|---|---|---|
| Emissões CO₂ | 4,3 t/hab | APA 2024 | |
| Renováveis | 35% | REN 2024 | |
| Dependência externa | 72% | DGEG | |
| Preço energia | 100 (índice) | Base | |

---

## Valores de referência antigos (Fase 6)

**Obsoletos após as alterações causais.** A tabela abaixo pertence à versão agregada anterior e não deve ser usada como oráculo para o motor actual. Usa `npm run validar` para consultar a comparação histórica corrente; os desvios actuais são conhecidos e ainda requerem calibração.

Corrido com: **30 anos, tudo a 0, crises OFF, seed 12345**.

| Variável | Inicial | Final |
|---|---|---|
| População | 11 481 055 | 12 519 330 |
| Idade média | 45,8 | 47,6 |
| Fertilidade | 1,35 | 1,35 |
| Anos escolaridade | 10,2 | 12,4 |
| Qualificação | 42,0% | 51,7% |
| Empregados | — | 4 504 013 |
| Desemprego | 6,4% | 6,0% |
| Setor serviços | — | 70,5% |
| Setor tecnologia | — | 13,1% |
| PIB per capita | 24 500 € | **33 036 €** |
| Salário médio | 17 500 € | 20 987 € |
| Preço m² | 2 800 € | 3 004 € |
| Taxa esforço | — | 54,6% |
| Renováveis | 35,0% | 37,2% |
| Emissões CO₂ | 4,13 | 3,17 |
| Coesão | — | 61,2% |
| Gini | 0,32 | 0,318 |
| Confiança | 48% | 51,5% |
| Satisfação | 62% | 55,8% |
| Dívida | 95,7% | **80,5%** |

Se algum destes valores estiver **muito diferente** em novas execuções, há bug.

---

## Ajustes feitos na FASE 6

### O que mudou desde a versão anterior

| Sistema | Variável | De | Para |
|---|---|---|---|
| Demografia | Fertilidade | 1,30 | **1,35** |
| Demografia | Mortalidade | 0,011 | **0,0114** |
| Demografia | Esperança vida | 81,5 | **81,9** |
| Demografia | Saldo migratório | 60 000 | **80 000** |
| Economia | PIB per capita | 25 250 € | **24 500 €** |
| Economia | Inflação | 2,5% | **2,4%** |
| Economia | Desemprego | 6,0% | **6,4%** |
| Economia | Salário médio | 16 250 € | **17 500 €** |
| Finanças | Dívida | 89,7% | **95,7%** |
| Finanças | Juro médio | 2,5% | **2,7%** |
| Trabalho | Taxa participação | 60% | **62%** |
| Trabalho | Indústria | 22% | **18%** |
| Trabalho | Serviços | 68% | **71%** |
| Trabalho | Agricultura | 4,0% | **4,5%** |
| Trabalho | Tecnologia | 6,0% | **6,5%** |
| Educação | Anos escolaridade | 9,5 | **10,2** |
| Educação | Qualificação | 40% | **42%** |
| Educação | Fuga cérebros | 1,5% | **2,0%** |
| Habitação | Preço m² | 2 500 € | **2 800 €** |
| Habitação | Renda média | 900 € | **1 000 €** |
| Habitação | Stock | 5,9M | **6,1M** |
| Sociedade | Gini | 0,33 | **0,32** |
| Sociedade | Confiança | 50% | **48%** |
| Sociedade | Satisfação | 60% | **62%** |
| Clima | Emissões | 4,5 t | **4,3 t** |
| Clima | Renováveis | 30% | **35%** |
| Clima | Dependência | 75% | **72%** |

---

## Limitações conhecidas

### 0. Trabalho e automação (protótipo causal)

O motor agora liga a variação anual da automação ao crescimento real e ao emprego:

- `ΔA = max(0, A_t - A_(t-1))`, em fracção por ano.
- Ganho de produtividade: `0,30 × ΔA`, em taxa de crescimento real anual.
- Empregos substituídos: `ΔA × (1 - qualificação) × 0,55`.
- Novas atividades: `ΔA × qualificação × 0,18`.
- Desemprego: `u_t = clamp(u_(t-1) + substituição - novas atividades - 0,12 × crescimento_real_(t-1) + choques, 0,02, 0,30)`.
- A taxa de desemprego actualizada determina emprego e salários no passo económico.
- PIB real per capita varia com produtividade acumulada e com a fracção empregada relativamente ao emprego-base do país.
- IRS/TSU usam massa salarial efectiva (`empregados × salário médio`); IVA usa a fracção endógena de consumo.

Os coeficientes 0,30, 0,55, 0,18 e 0,12 são **hipóteses estruturais de protótipo**, não estimativas econométricas. Os testes verificam direção causal e estabilidade, não validade empírica. Devem ser recalibrados com séries históricas de automação, produtividade e emprego antes de qualquer interpretação quantitativa.

### Política monetária, procura e unidades do PIB (protótipo causal)

- Expectativas: `Eπ_t = 0,75 × Eπ_(t-1) + 0,25 × π_(t-1)`.
- Taxa directora desejada: `i* = clamp(1% + Eπ + 1,5 × (Eπ - meta) + 0,5 × (u_tendencial - u), 0%, 15%)`.
- Taxa aplicada: `i_t = 0,75 × i_(t-1) + 0,25 × i*`; taxa de crédito acrescenta 2 pp e spread soberano.
- Crédito acima de 5% reduz gradualmente as parcelas de consumo e investimento; as parcelas alteram a procura agregada e o crescimento real.
- Energia e procura alteram a inflação desejada, que converge com inércia. Inflação e juro usam fracções anuais no motor (0,02 = 2%).
- Produtividade acumula apenas crescimento real. `PIBpc_nominal = PIBpc_real × índice_precos`; o índice acumula inflação anual.
- Serviço da dívida é despesa pública: `despesa_total = despesa_primaria + juros`; `saldo = receita - despesa_total`; a dívida acumula o défice uma vez.

As elasticidades, a regra de taxa e o spread são simplificações transparentes para cenários, não parâmetros estimados. A regra não representa BCE nem incorpora expectativas racionais, política cambial, curva de rendimentos ou balanços bancários.

### Setor externo e câmbio (protótipo causal)

- Exportações e importações de base vêm de percentagens observadas do PIB; os dados World Bank são recolhidos pelo gerador quando disponíveis.
- Importações reais reagem à absorção (`consumo + investimento`) e ao preço relativo importado; elasticidades padrão 1,0 e 1,0.
- Exportações reais reagem à procura externa (premissa de cenário, padrão 2%/ano) e à competitividade cambial (elasticidade padrão 1,0).
- `ΔPIB_real_comércio = Δ(exportações_reais - importações_reais) / PIB_real_anterior`, limitado a ±10% por ano.
- A conta corrente nominal é balança comercial mais rendimentos/transferências líquidos residuais calibrados para reproduzir o saldo inicial observado. Necessidade de financiamento externa é `-conta_corrente`.
- Diferencial entre taxa directora e benchmark externo gera fluxos de carteira (`0,25 × diferencial`, limitado a ±3% do PIB); conta corrente + fluxo financeiro move a cotação em moeda local/USD com sensibilidade 0,4 e variação anual limitada a ±5%.
- O câmbio e uma premissa de inflação externa alteram o índice de preço importado; a parcela importada transmite o choque ao IPC e à procura de importações.
- Reservas só absorvem uma fracção configurável dos fluxos externos. O padrão 0% representa câmbio flutuante; não força a acumulação de todo o excedente em reservas.
- O teste centenário de Portugal com comércio activo verifica finitude, dívida abaixo de 10× PIB, conta corrente abaixo de 10% PIB e câmbio positivo. Isto verifica estabilidade deste cenário, não validação universal dos coeficientes.

Esta fatia ainda não modela dívida externa bruta, investimento directo, maturidades, composição por moeda nem risco-país completo. Elasticidades e a regra de câmbio são hipóteses, não estimativas. Necessidade de financiamento é uma identidade da conta corrente, não um fluxo de capital observado.

### Sistema político (protótipo multidimensional)

- O eleitorado tem quatro eixos separados: intervenção económica, tradicionalismo social, abertura externa e prioridade climática; cada partido tem uma posição própria em cada eixo.
- Compatibilidade ideológica usa distância quadrática nos quatro eixos; desempenho social/económico actualiza aprovação com inércia de 75% no ano anterior.
- Eleições ocorrem no ciclo configurado. Competitividade: democracia 1, híbrido 0,55, autoritarismo 0,05; o regime não altera a definição de preferências/partidos.
- Capacidade institucional e influência de grupos de interesse alteram a execução: `capacidade = clamp(0,45 + 0,45 × instituições - 0,15 × influência, 0,20, 1)`; `execução = capacidade × (0,70 + 0,30 × aprovação)`.
- O partido no governo altera prioridades efectivas de educação, infraestruturas, clima, carbono, família e habitação. Os resultados das políticas alimentam a sociedade e actualizam aprovação e apoio eleitoral nos passos seguintes.

Os pesos são premissas explícitas para cenários, não previsões ou estimativas eleitorais. Perfis podem fornecer partidos próprios no objecto `sistemas.politica.partidos`.

### 1. Horizonte temporal

O histórico de 100 anos testa finitude e explosão numérica, não calibração centenária. Alguns estados ainda usam limites estruturais:
- Idade média (limite 70)
- Preço m² (limite 1 500-8 000 €)
- Desemprego (limite 2-30%)
- Taxas directoras e de crédito têm limites explícitos.

A dívida deixou de ter piso/tecto numérico. Valores negativos significam activos líquidos públicos no modelo; não são uma calibração de dívida líquida real.

### 2. Retorno do investimento

O modelo é **conservador** no retorno de longo prazo:
- Educação: máx +1,0%/ano de produtividade
- Infra: máx +1,0%/ano
- Na realidade, retornos são maiores (5-10% no PIB)

### 3. Carbono tax

Gera receita mas **não acelera a transição** nem sobe o preço da energia.
Na realidade, a carbono tax tem efeitos comportamentais.

### 4. Crises

Aleatórias com seed. **Não são previsões** — são cenários.
A mesma seed dá as mesmas crises (reprodutibilidade).

### 5. Austeridade automática

Dispara acima de 100% de dívida, com redução máxima de 50% da despesa primária.
**Simplificação:** na realidade, a austeridade é política, não automática.

### 6. Default parcial

Dispara a 300% de dívida, máximo 1 em 20 anos.
**Simplificação:** na realidade, defaults são eventos políticos complexos.

---

## Como recalibrar no futuro

1. Vai a `dados/portugal.json`
2. Altera os valores
3. Corre `correr_v3.bat`
4. Testa o cenário base
5. Documenta os novos valores de referência

**Recomendação:** recalibrar a cada 2-3 anos (quando saírem dados novos do INE).

---

## Filosofia da calibração

- **Simplificação legítima** > falsa precisão
- **Valores redondos** quando possível (facilita leitura)
- **Fontes citadas** para transparência
- **Documentar ajustes** (porque é que 1,44 virou 1,35)
- **Testar sempre** o cenário base depois de calibrar