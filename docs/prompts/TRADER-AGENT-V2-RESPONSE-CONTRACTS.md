# Leonardo Trader V2 — Contratos de entrada e resposta

## 1. Objetivo

Separar o comportamento permanente do agente, a tarefa escolhida e o formato de resposta exibido pela interface.

## 2. Contrato de entrada

```json
{
  "profileId": "trader-analyst",
  "taskId": "quick_read | complete_analysis | map_scenarios | validate_setup | explain_indicators | build_checklist",
  "responseMode": "concise | standard | detailed",
  "question": "texto livre do usuário",
  "context": {
    "market": "ações | índices | moedas | criptomoedas | commodities | futuros | não informado",
    "asset": "texto ou não informado",
    "timeframe": "texto ou não informado",
    "operationStyle": "position | swing | day_trade | scalping | estudo | não informado",
    "analysisTime": "texto ou não informado",
    "studyMode": true
  },
  "userRules": [],
  "imageCount": 1
}
```

## 3. Contrato-base de resposta

```json
{
  "status": "success | insufficient_data",
  "taskId": "string",
  "classification": "aguardar | cenário_em_formação | cenário_observável | configuração_válida_para_estudo",
  "directAnswer": "resposta curta",
  "observedFacts": [],
  "interpretations": [],
  "missingData": [],
  "riskWarnings": [],
  "educationNotice": "Análise educacional em modo de estudo ou simulação."
}
```

A interface pode renderizar JSON estruturado ou Markdown equivalente. O modelo nunca deve mostrar campos vazios desnecessários.

## 4. `quick_read`

```json
{
  "marketSummary": "até três linhas",
  "apparentTrend": {
    "value": "altista | baixista | lateral | indefinida",
    "evidence": []
  },
  "mainStructure": "string",
  "mainRegion": "string ou não foi possível confirmar",
  "mainAlert": "string",
  "missingData": [],
  "classification": "string"
}
```

## 5. `map_scenarios`

```json
{
  "buyerScenario": {
    "condition": "string",
    "regionOfInterest": "string",
    "requiredTrigger": "string",
    "invalidation": "string",
    "technicalObjectives": [],
    "risks": []
  },
  "sellerScenario": {
    "condition": "string",
    "regionOfInterest": "string",
    "requiredTrigger": "string",
    "invalidation": "string",
    "technicalObjectives": [],
    "risks": []
  },
  "neutralScenario": {
    "reason": "string",
    "regionsToWatch": [],
    "exitConditions": [],
    "whyWait": "string"
  }
}
```

## 6. `validate_setup`

```json
{
  "receivedRules": [],
  "metConditions": [],
  "unmetConditions": [],
  "unconfirmedConditions": [],
  "checklistResult": "aprovado_para_estudo | reprovado | inconclusivo",
  "missingData": [],
  "notes": []
}
```

O agente não cria regras ausentes.

## 7. `complete_analysis`

```json
{
  "marketSummary": "string",
  "mainTrend": {
    "value": "altista | baixista | lateral | indefinida",
    "evidence": []
  },
  "marketStructure": [],
  "importantRegions": [],
  "buyerScenario": {},
  "sellerScenario": {},
  "neutralScenario": {},
  "educationalEntry": {
    "available": false,
    "direction": "compra | venda | aguardar",
    "context": "string",
    "regionOfInterest": "string",
    "requiredTrigger": "string",
    "invalidation": "string",
    "hypotheticalProtection": "string",
    "technicalObjectives": [],
    "riskReturnAssessment": "coerente | inadequada | não foi possível confirmar",
    "structuralQuality": "baixa | moderada | alta",
    "qualityReason": "string",
    "doNotTradeConditions": []
  },
  "riskManagement": [],
  "lesson": {
    "concept": "string",
    "whereItAppears": "string",
    "relevance": "string",
    "confirmation": "string",
    "commonMistake": "string",
    "exercise": "string"
  },
  "classification": "string",
  "missingData": []
}
```

Se `educationalEntry.available` for `false`, os demais campos da entrada podem ser omitidos e o motivo deve ser informado.

## 8. Regras de apresentação mobile

### Primeiro nível visível

1. resposta direta;
2. classificação;
3. principal evidência;
4. principal risco;
5. ação educacional seguinte.

### Conteúdo recolhido

- estrutura completa;
- cenários;
- indicadores;
- lição;
- metadados técnicos.

### Ações da interface

- `Ver cenários`;
- `Ver gestão de risco`;
- `Ouvir resumo`;
- `Analisar com mais detalhes`;
- `Reanalisar com outro período`.

## 9. Coerência

- `classification = aguardar` não pode trazer ordem de entrada;
- uma entrada educacional exige gatilho e invalidação;
- qualidade estrutural não representa probabilidade;
- dados ausentes não podem ser preenchidos por inferência;
- cenários podem existir sem entrada;
- um cenário neutro é obrigatório quando não existe vantagem clara.

## 10. Estado

```yaml
versao: v2
implementacao: nao_iniciada
contrato_api_atual: ainda_nao_alterado
merge: nao_autorizado
deploy: nao_autorizado
```
