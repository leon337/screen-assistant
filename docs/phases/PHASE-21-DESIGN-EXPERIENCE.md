# Fase 21 — Design Experience

**Autoridade:** Léo  
**Estado:** implementada em branch; merge não autorizado  
**Base:** `feat/phase-20-saas-auth`

## 1. Problema observado

As capturas enviadas pelo Léo mostraram:

- excesso de cartões com peso visual semelhante;
- ações repetidas na área principal e na barra móvel;
- configuração técnica antes da tarefa principal;
- seletor de especialista com destaque excessivo;
- resultado vazio ocupando uma tela;
- estado operacional exposto como conteúdo principal;
- acesso do piloto com aparência administrativa;
- hierarquia insuficiente entre ação, configuração e evidência.

## 2. Princípio central

Uma tela deve possuir uma ação predominante.

```text
Entrar
→ Enviar imagem
→ Escolher objetivo
→ Receber resultado
```

## 3. Jornada

### Estado 1 — entrada

- autenticação como porta de entrada do produto;
- identidade do Screen Assistant;
- login, cadastro e recuperação;
- sem conteúdo da aplicação visível antes da sessão.

### Estado 2 — imagem

- tirar foto;
- escolher imagem;
- preview;
- nenhuma barra inferior duplicada antes da seleção.

### Estado 3 — objetivo

- explicar imagem;
- encontrar problema;
- avaliar arquitetura;
- avaliar interface;
- analisar gráfico;
- especialista sugerido automaticamente;
- ajustes avançados recolhidos.

### Estado 4 — resultado

- resposta principal;
- evidências;
- ações contextuais;
- acesso aos detalhes;
- navegação de resultado oculta até existir conteúdo.

## 4. Sistema visual

```yaml
produto: SaaS_profissional
tema: escuro
acao_primaria: violeta_eletrico
sucesso: verde_suave
cards: 20px
controles: 14px
hierarquia:
  primaria: uma_acao_por_tela
  secundaria: configuracoes_recolhidas
  terciaria: estado_tecnico_em_Mais
```

## 5. Acessibilidade

- foco visível;
- alvos de toque compatíveis com uso móvel;
- rótulos persistentes;
- contraste reforçado;
- mensagens próximas ao contexto;
- suporte a `prefers-reduced-motion`;
- estados sem dependência exclusiva de cor;
- elementos indisponíveis ocultados quando apropriado.

## 6. Implementação

### Novos arquivos

- `public/design-v21.js`
- `public/design-v21.css`
- `public/auth-v21.css`
- `tests/phase21-design-experience.test.js`

### Arquivos alterados

- `public/design.js`
- `public/service-worker.js`

## 7. Critérios de aceitação

- [x] jornada de três etapas visível;
- [x] duplicação da barra móvel removida antes da imagem;
- [x] cinco objetivos com ícones e hierarquia;
- [x] configurações avançadas recolhidas;
- [x] resultado oculto antes da resposta;
- [x] login refinado;
- [x] foco visível;
- [x] redução de movimento;
- [x] cache PWA atualizado;
- [x] lógica de autenticação e análise preservada.

## 8. Governança

```yaml
merge: nao_autorizado
producao: intacta
cobranca: fora_do_escopo
backend: preservado
supabase: preservado
```
