# RC-001 — Fase 23: voz, velocidade e comandos falados

**Data:** 3 de agosto de 2026  
**Branch:** `feat/phase-22a-progressive-first-screen`  
**PR:** #13  
**Objeto:** leitura configurável e controle da aplicação por voz

## Escopo revisado

- controle de velocidade entre 0.6x e 1.6x;
- seleção de voz disponível no aparelho;
- preferência por português brasileiro;
- teste da voz;
- interrupção da leitura;
- ativação explícita do microfone;
- frase de chamada `Screen Assistant`;
- comandos de leitura, velocidade e navegação;
- desligamento ao ocultar ou fechar a página;
- compatibilidade degradada;
- atualização da PWA;
- testes automatizados.

## Evidências

```yaml
head_testado: f1875f97df4a07909e8ff6f94b8706b6970dab28
workflow: 30790370656
job: 91612409542
testes: 117
aprovados: 117
falhas: 0
segredos: PASS
```

## Revisão por critério

### Leitura por voz

- botão `Ouvir` é interceptado antes do manipulador legado;
- a fala anterior é cancelada antes de iniciar outra;
- somente uma elocução é criada;
- o botão `Interromper voz` acompanha o estado;
- a velocidade é aplicada em `SpeechSynthesisUtterance.rate`;
- a voz selecionada é aplicada quando disponível.

Resultado: `PASS_ESTATICO_E_AUTOMATIZADO`.

### Preferências

- velocidade e identificador da voz são armazenados localmente;
- o microfone não é persistido;
- transcrições não são armazenadas pela aplicação;
- valores fora da faixa são limitados.

Resultado: `PASS`.

### Reconhecimento e wake phrase

- `SpeechRecognition` e `webkitSpeechRecognition` são detectados;
- o microfone começa desligado;
- a ativação depende de ação explícita;
- são aceitas `Screen Assistant` e `Screen Assistente`;
- a frase isolada abre janela de oito segundos;
- sessões encerradas pelo navegador são reiniciadas enquanto armadas;
- erros permanentes de permissão desarmam o recurso.

Resultado: `PASS_ESTATICO`, com gate no dispositivo.

### Comandos

```text
ler resposta
parar voz
mais rápido
mais devagar
velocidade normal
analisar
nova análise
repetir análise
ajuda
desativar comandos
```

Os comandos acionam controles já existentes e respeitam seus estados `disabled`.

Resultado: `PASS`.

### Segurança e privacidade

- não existe escuta oculta;
- o microfone é desligado ao ocultar a página;
- câmera, galeria e seleção de arquivos não são abertas por voz;
- login e saída da conta não são comandados por voz;
- nenhuma execução financeira foi adicionada;
- nenhum segredo foi versionado.

Resultado: `PASS`.

### Acessibilidade

- estado do microfone exposto por `aria-pressed`;
- mensagens por `aria-live`;
- velocidade apresentada como texto;
- rótulos associados aos controles;
- áreas de toque móveis;
- redução de movimento respeitada.

Resultado: `PASS_ESTATICO`.

## Achados

```yaml
critical: 0
high: 0
medium: 3
low: 1
```

### Médio 1 — compatibilidade real

A existência de `SpeechRecognition` varia entre navegadores. É necessário confirmar no aparelho e navegador usados pelo Léo.

### Médio 2 — limite da ativação por frase

A frase de chamada não inicia o microfone a partir de uma página fechada ou sem permissão. O usuário precisa tocar uma vez para armar a sessão e manter a página visível.

### Médio 3 — qualidade das vozes

Nome, quantidade, timbre e execução das vozes são fornecidos pelo sistema operacional ou navegador. A aplicação consegue escolher entre as opções disponíveis, mas não controla a qualidade do motor instalado.

### Baixo — pausa e continuação

O escopo oferece iniciar e interromper. Comandos distintos de pausar e continuar podem ser adicionados depois da validação do ciclo principal.

## Veredito

`PASS_WITH_DEVICE_VALIDATION_GATE`

## Gate no dispositivo

1. abrir o preview no celular;
2. concluir uma análise;
3. abrir `Voz e comandos`;
4. testar 0.6x, 1.0x e 1.6x;
5. selecionar outra voz;
6. tocar em `Ativar comandos de voz`;
7. autorizar o microfone;
8. dizer `Screen Assistant, ler resposta`;
9. dizer `Screen Assistant, mais rápido`;
10. dizer `Screen Assistant, parar voz`;
11. dizer `Screen Assistant, nova análise`;
12. ocultar a página e confirmar o desligamento do microfone.

## Governança

```yaml
merge: NAO_AUTORIZADO
producao: INTACTA
estado: AGUARDANDO_VALIDACAO_NO_DISPOSITIVO
```
