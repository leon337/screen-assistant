# RC-002 — Fase 23: voz, velocidade e comandos falados

**Data:** 3 de agosto de 2026  
**Projeto:** Screen Assistant  
**PR:** #13  
**Objeto:** implementação funcional, política do microfone e preview

## Evidências funcionais

```yaml
functional_head: a89e350327cc2f86bcc8319774741218923b6bf5
workflow: 30791040001
job: 91614436399
testes: 120
aprovados: 120
falhas: 0
segredos: PASS
deployment: dpl_9xPndjDjYoYHAXCuKidEN3BQxQzT
deployment_state: READY
runtime_errors_fatal: 0
```

## Escopo confirmado

- velocidade da leitura entre 0.6x e 1.6x;
- preferência local de velocidade;
- seleção entre vozes disponibilizadas pelo aparelho;
- preferência por português brasileiro;
- teste da voz;
- interrupção da leitura;
- ativação explícita do microfone;
- indicador de escuta;
- wake phrase `Screen Assistant`;
- janela de oito segundos quando a frase é falada isoladamente;
- comandos para leitura, velocidade, análise, repetição e nova análise;
- desativação por comando;
- desligamento ao ocultar ou fechar a página;
- fallback sem reconhecimento;
- PWA atualizada;
- marcador de runtime verificável.

## Incidente corrigido — política do microfone

### Estado encontrado

```http
Permissions-Policy: camera=(self), microphone=(), geolocation=()
```

Esse cabeçalho bloquearia comandos de voz mesmo após autorização do usuário.

### Estado corrigido

```http
Permissions-Policy: camera=(self), microphone=(self), geolocation=()
```

A correção permite câmera e microfone exclusivamente para a própria origem. Geolocalização permanece bloqueada.

### Controle de regressão

Dois testes verificam a política:

- teste geral de permissões;
- teste específico da Fase 23.

## Falha recuperada da CI

A primeira execução após a mudança da política falhou porque um teste legado ainda exigia `microphone=()`.

```yaml
workflow_com_falha: 30790977862
causa: expectativa_obsoleta
efeito_na_aplicacao: nenhum
recuperacao: atualizar_teste_legado
reteste: PASS
```

## Revisão de privacidade

```yaml
microfone_inicial: desligado
ativacao: gesto_explicito
transcricoes_persistidas: nao
microfone_persistido: nao
desligamento_automatico:
  - pagina_oculta
  - fechamento
  - permissao_negada
camera_ou_galeria_por_voz: nao
login_por_voz: nao
execucao_financeira_por_voz: nao
```

## Achados finais

```yaml
critical: 0
high: 0
medium: 3
low: 1
```

### Médio 1 — compatibilidade do reconhecimento

O suporte e o comportamento da API de reconhecimento variam conforme navegador e sistema operacional. Necessita confirmação no aparelho usado pelo Léo.

### Médio 2 — limite da wake phrase

A frase de chamada funciona somente após o usuário ativar o microfone na sessão e enquanto a página estiver visível.

### Médio 3 — vozes fornecidas pelo sistema

Quantidade, nome, qualidade e timbre das vozes dependem do aparelho e do navegador.

### Baixo — pausa e continuação

O ciclo atual oferece iniciar e parar. Pausar e continuar podem entrar em fase posterior.

## Veredito

`PASS_WITH_DEVICE_VALIDATION_GATE`

## Gate no celular

1. concluir uma análise;
2. abrir `Voz e comandos`;
3. testar velocidades 0.6x, 1.0x e 1.6x;
4. selecionar e testar outra voz;
5. ativar comandos e permitir o microfone;
6. dizer `Screen Assistant, ler resposta`;
7. dizer `Screen Assistant, mais rápido`;
8. dizer `Screen Assistant, parar voz`;
9. dizer `Screen Assistant, nova análise`;
10. ocultar a página e confirmar que o microfone foi desligado.

## Governança

```yaml
merge: NAO_AUTORIZADO
producao: INTACTA
estado: AGUARDANDO_VALIDACAO_NO_DISPOSITIVO
```
