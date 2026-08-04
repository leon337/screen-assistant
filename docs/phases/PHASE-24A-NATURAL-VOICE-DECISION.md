# Fase 24A — Decisão de voz natural em português do Brasil

**Estado:** aprovada para implementação na branch  
**PR:** #13  
**Merge:** não autorizado  
**Produção:** intacta

## Problema

A voz local baseada em `speechSynthesis` funciona, mas a naturalidade depende das vozes instaladas no Android. Alterar apenas velocidade e voz não garante prosódia natural, pausas adequadas ou entonação consistente.

## Decisão

Adotar arquitetura híbrida com dois modos:

```yaml
modo_natural:
  padrão: true
  origem: backend_autenticado
  provedor_inicial: Gemini_TTS
  idioma: pt-BR
  estilo: calmo_claro_didático
  fallback: voz_do_aparelho

modo_dispositivo:
  origem: Web_Speech_API
  idioma: pt-BR
  disponibilidade: imediata
  uso:
    - falha_de_rede
    - cota_indisponível
    - modo_economia
```

## Justificativa

O backend atual já mantém `GEMINI_API_KEY` no servidor e autentica as rotas. A síntese natural deve ser implementada em nova rota serverless; a chave nunca será exposta no navegador.

A API Gemini TTS permite orientar estilo, ritmo e tom por linguagem natural. A voz local permanece como fallback para disponibilidade e baixo custo.

## Contrato da nova rota

```http
POST /api/v1/synthesize-speech
Authorization: Bearer <token>
Content-Type: application/json
```

Entrada:

```json
{
  "text": "Texto da resposta",
  "language": "pt-BR",
  "style": "calmo, natural, claro e didático",
  "voice": "default",
  "requestId": "uuid"
}
```

Saída:

```json
{
  "status": "success",
  "data": {
    "audio": "base64",
    "mimeType": "audio/wav",
    "provider": "gemini-tts",
    "model": "configurado_no_servidor",
    "cached": false
  }
}
```

## Preparação do texto

Antes da síntese:

1. remover Markdown visual que não deve ser pronunciado;
2. converter títulos em pausas curtas;
3. transformar listas em frases naturais;
4. não ler IDs, hashes e detalhes técnicos por padrão;
5. preservar números e unidades relevantes;
6. dividir textos longos em blocos sem cortar frases;
7. adicionar instrução de estilo em português do Brasil.

## Reprodução

```yaml
velocidade:
  controle: HTMLAudioElement.playbackRate
  faixa: 0.8x_a_1.4x
  padrão: 1.0x
  nova_geração_ao_mudar_velocidade: false

cache:
  chave: hash_texto_voz_estilo
  escopo: sessão_ou_servidor
  objetivo: reduzir_latência_e_custo
```

## Interface

```text
Voz: Natural
[Microfone] [Ouvir/Parar] [1.0x] [Ajustes]
```

Nos ajustes:

- `Natural` — voz neural pt-BR;
- `Dispositivo` — voz local do Android;
- velocidade;
- testar voz;
- aviso quando o fallback for usado.

## Privacidade e segurança

- texto enviado apenas após ação de ouvir ou configuração de leitura automática;
- autenticação obrigatória;
- limite de caracteres;
- rate limit separado;
- sem persistência de transcrições;
- nenhum segredo no frontend;
- fallback local em falhas do provedor;
- logs sem conteúdo integral da resposta.

## Gates de implementação

1. criar configuração de TTS no servidor;
2. criar provedor isolado;
3. criar rota autenticada;
4. integrar player de áudio no frontend;
5. preservar `speechSynthesis` como fallback;
6. controlar velocidade sem regenerar áudio;
7. adicionar testes de autenticação, limite, erro e fallback;
8. validar latência no Android;
9. validar naturalidade com três textos: curto, técnico e longo;
10. executar RC antes de merge.

## Critérios de aceite

```yaml
idioma: pt-BR
voz_natural: disponível
fallback_local: funcional
chave_no_frontend: ausente
mudança_de_velocidade: sem_nova_requisição
interrupção: imediata
reprodução_repetida: usa_cache
texto_técnico: não_lê_hashes_por_padrão
mobile: sem_sobreposição
```

## Relação com a correção de design

A voz natural passa a integrar a mesma RC-003 da Fase 24A. A fase só poderá receber PASS quando:

- barra compacta não cobrir conteúdo;
- painel mobile estiver corrigido;
- elemento lateral tiver origem identificada;
- voz natural e fallback local forem testados no Android.
