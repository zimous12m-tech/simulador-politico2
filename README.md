# Teoria das Sociedades

Simulador educativo de políticas públicas aplicado a Portugal.

Criado por **Zimous David**.

---

## O que é

Um simulador que corre no browser, sem instalação, que modela a evolução
de uma sociedade ao longo do tempo. Mostra como diferentes políticas
públicas (educação, saúde, habitação, transição energética, etc.) afectam
a economia, a demografia, a coesão social e as finanças públicas.

**Não é uma previsão.** É uma ferramenta para explorar trade-offs:
"se fizermos X, o que acontece a Y?"

---

## Como correr

### Opção 1 — Offline (mais simples)

Abre o ficheiro `simulador_v3.html` com duplo clique.

Funciona em qualquer browser moderno (Chrome, Edge, Firefox, Safari).
Não precisa de internet, nem de Python, nem de servidor.

### Opção 2 — PWA (instalável)

1. Corre `correr_v3.bat` (arranca servidor local)
2. No browser, clica no ícone "Instalar" na barra de endereço
3. Fica instalado como app no sistema

### Opção 3 — Desenvolvimento

Se quiseres alterar o código:

1. Corre `correr_v3.bat`
2. Abre `http://localhost:8000`
3. F12 → Network → Disable cache
4. Ctrl+Shift+R para recarregar

**Importante:** precisas do `servidor.py` (não uses `python -m http.server`).
O `servidor.py` envia `Cache-Control: no-store` para evitar que o browser
guarde módulos ES6 em cache.

---

## O que o simulador modela

13 sistemas interligados:

| # | Sistema | O que faz |
|---|---|---|
| 1 | **Demografia** | População, fertilidade, mortalidade, migração, idade média |
| 2 | **Educação** | Anos de escolaridade, qualificação, fuga de cérebros |
| 3 | **Trabalho** | População activa, empregados, setores, automação |
| 4 | **Economia** | PIB, produtividade, salários, desemprego |
| 5 | **Setor externo** | Exportações, importações, balança comercial, conta corrente e financiamento externo (quando há dados) |
| 6 | **Política monetária** | Expectativas, taxa directora, crédito, resposta à inflação e desemprego |
| 7 | **Clima / Energia** | Emissões, renováveis, dependência energética, preços e desastres |
| 8 | **Estado** | Receita ligada a emprego, massa salarial, consumo e carbono |
| 9 | **Finanças** | Despesa primária, juros, saldo, dívida, austeridade, default |
| 10 | **Habitação** | Preço m², renda, construção, taxa de esforço, juro de crédito |
| 11 | **Sociedade** | Coesão, Gini, confiança, satisfação |
| 12 | **Política** | Regimes, partidos multidimensionais, eleições, aprovação e execução de políticas |
| 13 | **Crises** | Recessões, choques externos, resgates, desastres |

Ordem do step:

Crises → Política monetária → Demografia → Educação → Setor externo
→ Trabalho → Economia → Estado → Clima → Finanças → Habitação → Sociedade → Política

O motor inclui cenários comparativos com seed comum, história anual e testes de estabilidade. A activação efectiva dos choques pode divergir entre cenários porque as suas probabilidades dependem do estado económico.

**Ainda não implementados no motor v3:** dívida externa bruta, dados de grupos de interesse por setor e coligações parlamentares. O módulo político usa partidos e preferências multidimensionais editáveis no perfil; pesos de eleição e implementação são hipóteses de cenário, não estimativas eleitorais. A primeira aproximação cambial também usa elasticidades assumidas. Perfis sem observações de comércio ou câmbio deixam essas ligações inativas.


---

## Políticas configuráveis

| Input | Descrição |
|---|---|
| **Anos a simular** | Horizonte temporal (30-50 anos recomendado) |
| **Subsídio por filho** | € por criança por ano |
| **Investimento em educação** | % do PIB |
| **Investimento em infraestrutura** | % do PIB |
| **Investimento verde** | % do PIB (transição energética) |
| **Carbono tax** | € por tonelada de CO₂ |
| **Subsídio de renda** | € por mês |
| **Investimento em habitação** | % do PIB |
| **Procura externa** | Crescimento real anual das exportações, %/ano |
| **Juro externo** | Taxa de referência para fluxos de carteira, %/ano |
| **Inflação externa** | Variação anual dos preços globais importados, %/ano |
| **Intervenção de reservas** | Parcela dos fluxos externos absorvida por reservas, %; 0 = câmbio flutuante |
| **Crises activas** | Liga/desliga eventos aleatórios |
| **Seed** | Reprodutibilidade (mesma seed → mesmas crises) |

---

## Modo tendência vs. robustez

- **Modo tendência** (crises OFF): valores puros das políticas, sem aleatoriedade
- **Modo robustez** (crises ON): mostra como o sistema reage a choques

A **seed** garante reprodutibilidade: a mesma seed dá as mesmas crises.

---

## Arquitectura

teoria-das-sociedades/
├── correr_v3.bat Arranca o servidor local (modo dev)
├── distribuir.bat Gera single-file HTML offline
├── build.js Script que compila o single-file
├── servidor.py Servidor HTTP sem cache
├── limpar_cache.bat Auxiliar (limpa cache do browser)
├── index.html Interface
├── app.js Orquestrador
├── estilo.css Estilos (tema escuro)
├── chart.umd.min.js Chart.js (biblioteca externa)
├── manifest.json PWA
├── service-worker.js PWA cache offline
├── icone.svg Ícone
├── README.md Este ficheiro
├── LEIA-ME.txt Guia rápido
├── COMO_PARTILHAR.md Como enviar para alguém
├── NOTAS_CALIBRACAO.md De onde vieram os números
├── dados/
│ └── portugal.json Dados base de Portugal
└── motor/
├── simulacao.js Motor principal
├── utils.js Funções partilhadas
└── sistemas/
├── demografia.js
├── educacao.js
├── trabalho.js
├── economia.js
├── externo.js
├── monetaria.js
├── estado.js
├── financas.js
├── habitacao.js
├── sociedade.js
├── crises.js
└── clima.js


---

## Tecnologia

- **JavaScript puro (ES6)** — sem frameworks
- **Chart.js** — gráficos
- **HTML5 + CSS3** — interface
- **Python 3** — servidor local (só para desenvolvimento)
- **Node.js** — build do single-file (opcional)

**Sem dependências externas** (excepto Chart.js que está incluído).

---

## Filosofia

- **Simulador educativo**, não académico
- **Simplificação legítima** é melhor que falsa precisão
- **Trade-offs são o ponto** — cada política tem custos
- **Sem viés político** — a mesma ferramenta serve esquerda, direita, centro
- **Português (PT-PT)** em toda a interface
- **Sem frameworks** — JavaScript puro, para portabilidade e transparência
- **Funciona offline** — não depende de servidores externos

---

## Limitações conhecidas

- **Horizonte recomendado:** 30-50 anos. Em 100 anos, alguns clamps saturam (idade média, preço m²)
- **Carbono tax:** gera receita mas não acelera a transição (limitação do modelo)
- **Retorno do investimento:** o modelo é conservador no retorno de longo prazo da educação/infra
- **Dívida:** em cenários extremos, bate no tecto ou no mínimo
- **Crises:** aleatórias com seed — não são previsões

---

## Licença

**Livre.** Podes usar, copiar, modificar, partilhar.

Sem garantias. O autor não se responsabiliza por decisões tomadas com base no simulador.

---

## Contacto

**Zimous David**

Para sugestões, bugs, ou melhorias: abre uma issue ou contacta directamente.

