import type { FalaRoteiro } from '../../core/tipos';

export const MOCK_SCRIPTS: FalaRoteiro[][] = [
  // Scenario 1: IAM (Infarto)
  [
    { speaker: 'SYS', text: 'Gravação e transcrição iniciadas.', delay: 500 },
    { speaker: 'TARM', text: 'SAMU 192, qual a sua emergência?', delay: 1500 },
    { speaker: 'CALLER', text: 'Moça, pelo amor de Deus, meu pai tá passando mal! Ele tá com muita dor no peito e suando frio!', delay: 4000,
      extract: { symptoms: ['Dor no peito irradiante', 'Sudorese fria'], risk: 'RED', protocol: 'Suspeita de IAM (Infarto)' } },
    { speaker: 'TARM', text: 'Calma, o socorro já está sendo providenciado. Qual o nome e a idade dele? Ele tem algum problema de saúde?', delay: 7000 },
    { speaker: 'CALLER', text: 'O nome dele é João da Silva. Ele tem 65 anos. Ele tem pressão alta e diabetes.', delay: 10000,
      extract: { patientName: 'João da Silva', age: '65 anos', gender: 'Masculino', comorbidities: ['Hipertensão (HAS)', 'Diabetes (DM)'] } },
    { speaker: 'TARM', text: 'Ele está consciente? Ele consegue falar com você?', delay: 13000 },
    { speaker: 'CALLER', text: 'Tá consciente, mas tá com muita falta de ar, não consegue falar direito. A dor tá indo pro braço esquerdo.', delay: 16000,
      extract: { symptoms: ['Dor no peito irradiante', 'Sudorese fria', 'Dispneia (Falta de ar)', 'Dor irradiando para MSE'] } },
    { speaker: 'TARM', text: 'Certo. O endereço é Rua Direita, 120, correto?', delay: 19000 },
    { speaker: 'CALLER', text: 'Isso, apartamento 42. O porteiro já tá avisado pra liberar a ambulância.', delay: 22000 },
    { speaker: 'TARM', text: 'Ótimo. Mantenha ele sentado e calmo. Não dê água nem comida. O médico vai falar com você agora para mais orientações enquanto a UTI móvel chega.', delay: 26000 },
    { speaker: 'CALLER', text: 'Tá bom, tô aguardando na linha. Por favor, pede pra eles virem rápido!', delay: 30000 },
    { speaker: 'TARM', text: 'Eles já estão a caminho. Transferindo para o médico regulador.', delay: 33000 }
  ],
  // Scenario 2: Trauma (Acidente de Moto)
  [
    { speaker: 'SYS', text: 'Gravação e transcrição iniciadas.', delay: 500 },
    { speaker: 'TARM', text: 'SAMU 192, qual a sua emergência?', delay: 1500 },
    { speaker: 'CALLER', text: 'Teve um acidente aqui na avenida! Um motoqueiro bateu num carro.', delay: 4000,
      extract: { symptoms: ['Vítima de trauma', 'Acidente de trânsito'], risk: 'YELLOW', protocol: 'Trauma - Colisão Auto x Moto' } },
    { speaker: 'TARM', text: 'Entendi. O endereço é Avenida Paulista, na altura do número 1578?', delay: 7000 },
    { speaker: 'CALLER', text: 'Isso, sentido Consolação.', delay: 10000 },
    { speaker: 'TARM', text: 'O socorro está a caminho. Você sabe o nome da vítima? Qual a idade aparente?', delay: 13000 },
    { speaker: 'CALLER', text: 'Não sei o nome, acho que uns 30 anos. Ele tá de capacete no chão.', delay: 16000,
      extract: { age: '~30 anos', gender: 'Masculino', patientName: 'Desconhecido' } },
    { speaker: 'TARM', text: 'Ele está acordado? Tem algum sangramento visível?', delay: 19000 },
    { speaker: 'CALLER', text: 'Tá acordado, gemendo de dor na perna. A perna parece quebrada, mas não vejo muito sangue.', delay: 22000,
      extract: { symptoms: ['Vítima de trauma', 'Acidente de trânsito', 'Dor intensa em MMII', 'Suspeita de fratura fechada'] } },
    { speaker: 'TARM', text: 'Por favor, não tente tirar o capacete dele e peça para ele não se mover. Tem vazamento de combustível na pista?', delay: 26000 },
    { speaker: 'CALLER', text: 'Não, não tô sentindo cheiro de gasolina. Tem gente sinalizando a via.', delay: 30000 },
    { speaker: 'TARM', text: 'Perfeito. A ambulância já foi despachada. Vou passar para o médico regulador para orientações adicionais.', delay: 34000 }
  ],
  // Scenario 3: OVACE (Engasgo Bebê) - Longo
  [
    { speaker: 'SYS', text: 'Gravação e transcrição iniciadas.', delay: 500 },
    { speaker: 'TARM', text: 'SAMU 192, qual a sua emergência?', delay: 1500 },
    { speaker: 'CALLER', text: 'Meu bebê! Meu bebê não tá respirando! Ele engasgou com o leite!', delay: 4000,
      extract: { symptoms: ['Asfixia', 'Engasgo com líquido'], risk: 'RED', protocol: 'OVACE - Lactente' } },
    { speaker: 'TARM', text: 'Senhora, mantenha a calma, a ambulância já está saindo. Qual o nome do bebê e quantos meses ele tem?', delay: 7000 },
    { speaker: 'CALLER', text: 'É o Lucas! Ele tem 8 meses! Pelo amor de Deus, me ajuda!', delay: 10000,
      extract: { patientName: 'Lucas', age: '8 meses', gender: 'Masculino' } },
    { speaker: 'TARM', text: 'Vou te ajudar agora. O bebê está chorando ou tossindo? Qual a cor da pele dele?', delay: 13000 },
    { speaker: 'CALLER', text: 'Não tá chorando! Ele tá ficando roxinho! Ele não faz barulho!', delay: 16000,
      extract: { symptoms: ['Asfixia', 'Engasgo com líquido', 'Cianose', 'Ausência de choro/tosse'] } },
    { speaker: 'TARM', text: 'Ok, coloque o Lucas de bruços no seu antebraço, com a cabeça mais baixa que o corpo. Segure a cabecinha dele.', delay: 19000 },
    { speaker: 'CALLER', text: 'Tá, coloquei! E agora?', delay: 22000 },
    { speaker: 'TARM', text: 'Dê 5 tapinhas nas costas dele, entre as escápulas. Com o calcanhar da mão.', delay: 25000 },
    { speaker: 'CALLER', text: 'Um, dois, três, quatro, cinco! Ele chorou! Ele chorou! Saiu um monte de leite!', delay: 28000,
      extract: { symptoms: ['Asfixia revertida', 'Choro presente', 'Desobstrução de vias aéreas'], risk: 'YELLOW', protocol: 'OVACE Revertido - Avaliação' } },
    { speaker: 'TARM', text: 'Graças a Deus. A cor dele está voltando ao normal?', delay: 31000 },
    { speaker: 'CALLER', text: 'Tá sim, ele tá chorando forte agora. Muito obrigada!', delay: 34000 },
    { speaker: 'TARM', text: 'A ambulância continua a caminho para avaliar ele. Vou transferir para o médico para acompanhamento.', delay: 38000 }
  ],
  // Cenário de estresse: TROTE. Nenhuma extração clínica acontece (o risco permanece
  // PENDING) e o encerramento correto é o botão "Encerrar · trote / engano" — sem
  // regulação, com registro em auditoria. A detecção NÃO é automática: quem decide
  // que é trote é o operador; o sistema só registra.
  [
    { speaker: 'TARM', text: 'SAMU, emergência. Qual é a ocorrência?', delay: 1500 },
    { speaker: 'CALLER', text: '(risadas ao fundo) Alô? É da pizzaria?', delay: 4500 },
    { speaker: 'TARM', text: 'Aqui é o SAMU 192, serviço de emergência médica. Há alguma emergência no local?', delay: 8000 },
    { speaker: 'CALLER', text: '(mais risadas) Manda uma ambulância de pepperoni… (desliga)', delay: 12000 },
    { speaker: 'TARM', text: 'Senhor, trote ao 192 mantém a linha ocupada e pode custar uma vida. A ligação fica registrada.', delay: 15500 }
  ],
  // 5 · AVC — LARANJA: a janela terapêutica é o argumento vivo do tempo medido.
  [
    { speaker: 'CALLER', text: 'Moço, minha mãe acordou com a boca torta e não consegue falar direito. Ela tá muito estranha.', delay: 1500 },
    { speaker: 'TARM', text: 'Vou te ajudar. Qual o nome e a idade dela? E a que horas você percebeu isso?', delay: 5000 },
    { speaker: 'CALLER', text: 'Terezinha, 68 anos. Foi agora, faz uns vinte minutos. Ela tentou levantar e o braço esquerdo não obedece.', delay: 9500,
      extract: { patientName: 'Terezinha Almeida', age: '68 anos', gender: 'Feminino', inicioSintomasMinutos: 20 } },
    { speaker: 'TARM', text: 'Peça para ela sorrir. O sorriso está torto? E peça para repetir uma frase simples.', delay: 14000 },
    { speaker: 'CALLER', text: 'Tá torto sim, só um lado mexe. E a fala sai toda enrolada, não dá pra entender nada.', delay: 18500,
      extract: { symptoms: ['Desvio de rima labial', 'Fraqueza em braço esquerdo', 'Fala arrastada (disartria)'], risk: 'ORANGE', protocol: 'Suspeita de AVC — janela terapêutica' } },
    { speaker: 'TARM', text: 'Entendi. Deite ela de lado, não dê água nem comida, e anote a hora em que começou — isso é muito importante para o tratamento. O socorro já está sendo acionado.', delay: 23000 },
    { speaker: 'CALLER', text: 'Anotei: começou 7h40. Por favor, venham rápido.', delay: 27500 },
    { speaker: 'TARM', text: 'O horário ficou registrado. Vou passar para o médico regulador agora — fique na linha.', delay: 31000 }
  ],
  // 6 · Obstétrico — LARANJA: docs/12 exige o caso representado; a demo espelha.
  [
    { speaker: 'CALLER', text: 'Minha esposa tá em trabalho de parto! As contrações tão muito perto uma da outra!', delay: 1500 },
    { speaker: 'TARM', text: 'Calma, vou te orientar. Qual o nome dela, quantas semanas de gestação, e de quanto em quanto tempo vêm as contrações?', delay: 5500 },
    { speaker: 'CALLER', text: 'Luana, 27 anos, tá de 39 semanas. As contrações vêm de 4 em 4 minutos, e a bolsa estourou faz meia hora.', delay: 10500,
      extract: { patientName: 'Luana Ferreira', age: '27 anos', gender: 'Feminino', symptoms: ['Trabalho de parto ativo', 'Bolsa rota há 30 min', 'Contrações 4/4 min'], risk: 'ORANGE', protocol: 'Obstétrico — parto iminente' } },
    { speaker: 'TARM', text: 'É o primeiro filho dela? Ela sente vontade de fazer força?', delay: 15500 },
    { speaker: 'CALLER', text: 'É o segundo. E ela tá dizendo que a pressão tá aumentando muito!', delay: 19500,
      extract: { symptoms: ['Multípara — evolução rápida'] } },
    { speaker: 'TARM', text: 'Deite ela do lado esquerdo, separe toalhas limpas e não deixe ela ir ao banheiro sozinha. A equipe já está sendo acionada com prioridade.', delay: 24000 },
    { speaker: 'CALLER', text: 'Tá certo, já deitei ela. Vem logo, por favor!', delay: 28500 },
    { speaker: 'TARM', text: 'Transferindo agora para o médico regulador. Continue na linha comigo.', delay: 32000 }
  ],
  // 7 · VERDE — orientação sem despacho: o sistema também protege a frota do
  // acionamento desnecessário; o desfecho digno é o encaminhamento certo.
  [
    { speaker: 'CALLER', text: 'Boa tarde. Tô com uma dor nas costas que não passa, já faz uns dias. Queria uma ambulância pra ir ao hospital.', delay: 1500 },
    { speaker: 'TARM', text: 'Boa tarde. Vou entender o seu caso. A dor começou quando? O senhor consegue andar e se mover normalmente?', delay: 5500 },
    { speaker: 'CALLER', text: 'Faz umas duas semanas. Ando sim, só incomoda quando fico muito tempo sentado.', delay: 10000,
      extract: { patientName: 'Antônio Ribeiro', age: '52 anos', gender: 'Masculino', symptoms: ['Lombalgia há 2 semanas', 'Deambulando normalmente'] } },
    { speaker: 'TARM', text: 'O senhor tem febre, perda de força nas pernas ou dificuldade para urinar?', delay: 14500 },
    { speaker: 'CALLER', text: 'Não, nada disso. É só a dor mesmo.', delay: 18000,
      extract: { risk: 'GREEN', protocol: 'Orientação — rede básica (UBS)' } },
    { speaker: 'TARM', text: 'Entendi. Pelo que o senhor descreve, não é uma emergência — e a ambulância precisa ficar livre para risco de vida. O caminho certo é a UBS do seu bairro. Se surgir perda de força, febre alta ou a dor mudar de repente, ligue de novo na hora.', delay: 22500 },
    { speaker: 'CALLER', text: 'Ah, entendi. Vou na UBS amanhã cedo então. Obrigado, viu?', delay: 28000 },
    { speaker: 'TARM', text: 'Às ordens. Melhoras para o senhor.', delay: 31000 }
  ],
  // 8 · PCR — RCP guiada por telefone (T-CPR): O caso da regulação. O operador
  // guia as compressões pela linha da CENTRAL (shadow: nós nunca falamos); o
  // CoPilot mostra o protocolo e CARIMBA o tempo até a 1ª compressão —
  // indicador de sobrevida (AHA). Cenário T16 do docs/23; origem docs/26.
  [
    { speaker: 'SYS', text: 'Gravação e transcrição iniciadas.', delay: 500 },
    { speaker: 'TARM', text: 'SAMU 192, qual a sua emergência?', delay: 1500 },
    { speaker: 'CALLER', text: 'Meu pai desmaiou e não acorda! Ele não tá respirando, pelo amor de Deus!', delay: 4000,
      extract: { symptoms: ['Inconsciência', 'Ausência de respiração'], risk: 'RED', protocol: 'PCR — parada cardiorrespiratória' } },
    { speaker: 'TARM', text: 'A ambulância já está sendo acionada. Qual o nome e a idade dele? Ele está deitado de costas?', delay: 7000 },
    { speaker: 'CALLER', text: 'Roberto, 58 anos. Tá de costas no chão da sala.', delay: 10000,
      extract: { patientName: 'Roberto Nunes', age: '58 anos', gender: 'Masculino' } },
    { speaker: 'TARM', text: 'Ajoelhe do lado dele, mãos sobrepostas no centro do peito, braços esticados — comprima forte e rápido, no meu ritmo: um, dois, três, quatro…', delay: 13500,
      extract: { marco: 'rcp_iniciada' } },
    { speaker: 'CALLER', text: 'Tô comprimindo! Um, dois, três… assim?', delay: 17500 },
    { speaker: 'TARM', text: 'Perfeito, não pare. Se tiver mais alguém aí, peça para buscar o desfibrilador (DEA) da portaria e revezar com você a cada 2 minutos.', delay: 21500 },
    { speaker: 'CALLER', text: 'Minha mãe foi buscar! Continuo aqui, não vou parar.', delay: 25500 },
    { speaker: 'TARM', text: 'A equipe está chegando. Continue no meu ritmo e me avise qualquer mudança — estou na linha com você.', delay: 29000 }
  ]
];
