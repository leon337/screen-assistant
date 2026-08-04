# Fase 24A — Incidente 005 — travamento do microfone no desktop

## Evidência real

O usuário enviou duas capturas do Brave no Linux. A barra universal estava visível, porém o botão permaneceu no estado `Ouvindo…` e a aplicação deixou de responder normalmente.

## Observabilidade

```yaml
deployment_do_incidente: dpl_fKoemgN99Rc24YcRNe3dnFBQjZ96
route: /api/v1/transcribe-command
request_time_utc: 2026-08-04T02:54:45Z
http_status: 200
```

A rota de transcrição recebeu a gravação e respondeu com sucesso. O travamento ocorreu no navegador depois da interação com o microfone.

## Causa

O módulo desktop observava atributos e conteúdo do próprio botão de microfone. Enquanto a gravação ou o processamento estavam ativos, o callback reaplicava propriedades como `disabled`, classe e texto. No Brave/Linux, esse desenho podia produzir uma sequência recursiva de mutações e prender a interface no estado `Ouvindo…`.

A camada antiga de reconhecimento contínuo também permanecia disponível e podia disputar o estado do mesmo botão e o acesso ao microfone.

## Classificação CAF

```yaml
classe: RECUPERAVEL
efeito_confirmado:
  main_alterada: false
  produção_alterada: false
  backend_com_erro: false
  navegador_travado: true
recuperação_escolhida:
  - substituir_o_botão_visível_por_clone_sem_listeners_antigos
  - não_observar_o_próprio_botão
  - desarmar_reconhecimento_contínuo_no_desktop
  - limitar_gravação_a_5_segundos
  - watchdog_de_stop_em_1_5_segundo
  - timeout_de_transcrição_em_12_segundos
  - voltar_obrigatoriamente_ao_estado_Mic
```

## Correção

Arquivo principal:

```text
public/voice-desktop-stability-v24a.js
```

Comportamento:

1. substitui somente o botão de microfone por uma instância sem listeners antigos;
2. preserva o dock, leitura neural, velocidade e ajustes;
3. aplica mudanças visuais apenas quando o valor realmente mudou;
4. encerra a gravação automaticamente após cinco segundos;
5. reinicia o estado se o evento `stop` do `MediaRecorder` não chegar;
6. cancela transcrição que exceda doze segundos;
7. libera o botão antes de executar comandos demorados, como `ler`;
8. desarma e oculta os controles antigos de reconhecimento contínuo no desktop;
9. cancela gravação e transcrição quando a aba fica oculta ou é fechada.

## Testes adicionados

Arquivo:

```text
tests/phase24a-desktop-mic-stability.test.js
```

Cobertura:

- sintaxe;
- remoção de listeners antigos;
- ausência de observação recursiva do botão;
- mutações idempotentes;
- watchdog da gravação;
- timeout da transcrição;
- desarme da camada antiga;
- retorno ao estado ocioso;
- runtime e PWA.

## Evidências da correção

```yaml
functional_commit: 683474e6245fc3d11242722ba83edf159f7767da
head_validado_antes_deste_registro: 46be4b9bc2166101f6942f34a1108d09d8ed522b
workflow: 30873611224
job: 91880424857
tests: 177
pass: 177
fail: 0
secrets: PASS
```

## Estado

```yaml
implementation: COMPLETE_ON_BRANCH
CI: PASS
device_retest: PENDING
merge: NOT_AUTHORIZED
production_deployment: NOT_AUTHORIZED
```
