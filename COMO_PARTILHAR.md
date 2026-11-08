# Como partilhar o simulador

## Opção 1 — Enviar o ficheiro HTML (mais simples)

Envia o ficheiro `simulador_v3.html` por:
- Email (anexo)
- WhatsApp
- Telegram
- Pen drive
- Google Drive / Dropbox

Quem recebe:
1. Guarda o ficheiro onde quiser
2. Duplo clique
3. Abre no browser, funciona

**Não precisa de instalar nada.** Não precisa de Python, Node, nem internet.

**Tamanho:** ~700 KB (cabe em qualquer anexo).

---

## Opção 2 — Pen drive

1. Copia `simulador_v3.html` para a pen
2. Quem recebe copia para o computador dele
3. Duplo clique

---

## Opção 3 — Servidor online (se quiseres URL)

Se quiseres partilhar por link:

### Netlify Drop (5 minutos)
1. Vai a https://app.netlify.com/drop
2. Arrasta a **pasta dist/** para a página
3. Espera 30 segundos
4. Recebes um URL tipo `https://random-name.netlify.app`

**Prós:** rápido, sem conta (ou com conta GitHub)
**Contras:** depende de internet, URL temporário (a não ser que cries conta)

### GitHub Pages (permanente)
1. Cria repositório no GitHub
2. Coloca o `simulador_v3.html` como `index.html`
3. Activa GitHub Pages nas settings
4. URL permanente: `https://teu-username.github.io/nome-do-repo/`

**Prós:** URL permanente, grátis, controlas o código
**Contras:** mais passos

---

## Actualizar a versão

Sempre que alterares o código:

1. Corre `distribuir.bat`
2. Novo `simulador_v3.html` é gerado em `dist/`
3. Envia a nova versão

Quem recebeu antes:
- **Se for ficheiro:** substitui o antigo pelo novo
- **Se for online:** basta o link (actualiza automaticamente)

---

## Instalação como app (PWA)

Se alguém quiser instalar como app:

1. Corre `correr_v3.bat` (servidor local)
2. No browser: ícone "Instalar" na barra de endereço
3. Fica como app no sistema (Chrome, Edge, telemóvel)

**Nota:** isto só funciona com o servidor (não com o HTML single-file).

---

## Dicas para partilhar

**Para amigos / família:**
- Envia o `.html` por WhatsApp
- Diz: "duplo clique e está pronto"

**Para escola / trabalho:**
- Envia o `.html` por email
- Anexa também o `LEIA-ME.txt` (instruções)

**Para apresentação:**
- Usa o modo online (Netlify) para mostrar por link
- Ou abre o `.html` no teu portátil e mostra

**Para redes sociais:**
- GitHub Pages é a melhor opção
- Cria um README apelativo
- Adiciona screenshots

---

## Compatibilidade

| Dispositivo | Funciona? |
|---|---|
| Windows (Chrome, Edge, Firefox) | ✅ |
| Mac (Safari, Chrome, Firefox) | ✅ |
| Linux (Chrome, Firefox) | ✅ |
| Android (Chrome) | ✅ |
| iPhone / iPad (Safari) | ✅ |
| Tablet | ✅ |

**Requisito mínimo:** qualquer browser dos últimos 5 anos.