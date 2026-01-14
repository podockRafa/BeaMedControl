/**
 * ARQUIVO MESTRE: ROBÔ + PAGAMENTOS (ASAAS)
 * Versão Final: Híbrida, Segura e com Relatório de Erros Detalhado
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const axios = require("axios");
// 👇 O CORS É OBRIGATÓRIO PARA USAR AXIOS NO FRONTEND
const cors = require("cors")({ origin: true });

admin.initializeApp();
const db = admin.firestore();

// ==================================================================
// ⚙️ CONFIGURAÇÕES DO ASAAS
// ==================================================================

const ASAAS_URL = process.env.ASAAS_URL; 
// SUA CHAVE API (Sandbox)
const ASAAS_API_KEY = process.env.ASAAS_API_KEY; 
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET; 


// ==================================================================
// 🤖 PARTE 1: O ROBÔ AUTOMÁTICO (Scheduler) - AJUSTADO PARA BRASIL 🇧🇷
// ==================================================================

exports.roboMedicacao = onSchedule("every 60 minutes", async (event) => {
    // 1. Pega a hora certa no Brasil, não importa onde o servidor esteja
    const agora = getHoraBrasilia();
    
    logger.info(`🤖 Robô iniciado (Hora Brasil: ${agora.toLocaleString()})...`);

    const snapshot = await db.collection("medicamentos").get();

    if (snapshot.empty) {
        logger.info("Nenhum medicamento encontrado.");
        return;
    }

    const updates = [];

    snapshot.forEach((doc) => {
        const med = doc.data();
        const medId = doc.id;

        // Verifica dia usando a hora Brasil
        if (!ehDiaDeTomar(med, agora)) return;

        // Calcula doses usando a hora Brasil
        const dosesPendentes = calcularDosesPendentes(med, agora);

        if (dosesPendentes > 0) {
            logger.info(`💊 Descontando ${dosesPendentes} doses de: ${med.nome}`);
            updates.push(processarDesconto(doc.ref, med, medId, dosesPendentes, agora));
        }
    });

    await Promise.all(updates);
    logger.info("✅ Ciclo do robô finalizado.");
});




// ==================================================================
// 🧠 FUNÇÕES AUXILIARES (ATUALIZADAS PARA FUSO HORÁRIO)
// ==================================================================

// 👇 NOVA FUNÇÃO MÁGICA PARA CORRIGIR O FUSO
function getHoraBrasilia() {
    // Cria uma data baseada no servidor
    const dataServidor = new Date();
    // Converte para string no fuso de SP
    const stringBrasil = dataServidor.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
    // Cria um novo objeto Date com a hora certa do Brasil
    return new Date(stringBrasil);
}

function ehDiaDeTomar(med, dataAtual) {
    if (!med.dataInicioTratamento) return true;
    
    // Ajusta o início do tratamento para considerar apenas a data (00:00)
    const dataInicio = new Date(med.dataInicioTratamento + "T00:00:00");
    
    // Zera as horas para comparar apenas dias
    const diaAtualZero = new Date(dataAtual);
    diaAtualZero.setHours(0, 0, 0, 0);
    
    const diffTime = Math.abs(diaAtualZero - dataInicio);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (med.frequenciaTipo === 'diario') return true;
    
    if (med.frequenciaTipo === 'intervalo') {
        const intervalo = med.frequenciaIntervalo || 2;
        return (diffDays % intervalo) === 0;
    }
    
    if (med.frequenciaTipo === 'dias_semana') {
        const diaHoje = dataAtual.getDay(); 
        return med.frequenciaDias && med.frequenciaDias.includes(diaHoje);
    }
    return true;
}

function calcularDosesPendentes(med, agora) {
    // Se nunca foi checado, não desconta retroativo loucamente, 
    // assume que a ultima checagem foi "agora" para começar a contar daqui pra frente
    // OU se quiser ser rigoroso, precisaria de uma logica de "created_at"
    if (!med.ultimaChecagem) return 0; 

    // A ultima checagem já deve estar salva como ISOString. 
    // Precisamos converter ela para objeto Date para comparar.
    const ultimaChecagem = new Date(med.ultimaChecagem);
    let contador = 0;

    med.horarios.forEach(horarioStr => {
        const [hora, minuto] = horarioStr.split(':').map(Number);
        
        // Cria o horário do remédio HOJE usando a data BRASIL
        const dataHorarioHoje = new Date(agora);
        dataHorarioHoje.setHours(hora, minuto, 0, 0);

        // A MÁGICA:
        // Se o horário do remédio (ex: 15:00) é DEPOIS da última vez que o robô passou
        // E é ANTES ou IGUAL a hora de agora (ex: 15:05)
        // Então tem que tomar!
        if (dataHorarioHoje > ultimaChecagem && dataHorarioHoje <= agora) {
            contador++;
        }
    });
    return contador;
}

// ... (MANTENHA A processarDesconto IGUAL) ...
async function processarDesconto(docRef, med, medId, qtdDoses, agora) {
    const dosePorTomada = Number(med.dose || 1);
    const doseTotalNecessaria = qtdDoses * dosePorTomada;
    
    // 1. Calcula o Estoque TOTAL Real (O que está na cartela + O que está nas caixas fechadas)
    const estoqueTotalFisico = Number(med.caixaAtivaRestante) + (Number(med.estoqueCaixas) * Number(med.capacidadeCaixa));

    // 🚨 CENÁRIO DE FALTA: O paciente precisa tomar, mas não tem remédio físico
    if (estoqueTotalFisico < doseTotalNecessaria) {
        
        logger.warn(`🚫 FALTA DE ESTOQUE para ${med.nome}. Necessário: ${doseTotalNecessaria}, Disponível: ${estoqueTotalFisico}`);

        // A. Registra o "Crime" no histórico (Bem explicadinho)
        await db.collection("historico_medicamentos").add({
            data: agora.toISOString(),
            pacienteId: med.pacienteId,
            medicamentoId: medId,
            medicamentoNome: med.nome,
            acao: "FALTA_ESTOQUE", // 👈 Novo código de erro
            detalhe: `PACIENTE NÃO TOMOU! Dose de ${doseTotalNecessaria} un não realizada por falta de estoque.`,
            usuario: "Sistema Automático"
        });

        // B. Atualiza SÓ a hora (para o robô não ficar tentando descontar isso para sempre e travar)
        // O estoque permanece zerado (ou baixo), não fica negativo.
        await docRef.update({
            ultimaChecagem: agora.toISOString()
        });

        return; // Para por aqui. Não desconta nada.
    }

    // ✅ CENÁRIO NORMAL (Tem estoque suficiente)
    let novaCaixaAtiva = Number(med.caixaAtivaRestante) - doseTotalNecessaria;
    let novoEstoque = Number(med.estoqueCaixas);

    // Lógica de abrir novas caixas se a ativa acabar
    while (novaCaixaAtiva <= 0) {
        if (novoEstoque > 0) {
            novoEstoque--;
            novaCaixaAtiva += Number(med.capacidadeCaixa);
        } else {
            // Essa parte teoricamente nunca vai ser atingida agora por causa da trava acima, 
            // mas mantemos por segurança matemática.
            break; 
        }
    }

    // Atualiza o banco com os novos valores
    await docRef.update({
        caixaAtivaRestante: novaCaixaAtiva,
        estoqueCaixas: novoEstoque,
        ultimaChecagem: agora.toISOString()
    });

    await db.collection("historico_medicamentos").add({
        data: agora.toISOString(),
        pacienteId: med.pacienteId,
        medicamentoId: medId,
        medicamentoNome: med.nome,
        acao: "ROBO_CONSUMO",
        detalhe: `Robô descontou ${doseTotalNecessaria} dose(s) automaticamente.`,
        usuario: "Sistema Automático"
    });
}


// ==================================================================
// 💳 PARTE 2: CRIAR PAGAMENTO (HÍBRIDO & SEGURO 🔒)
// ==================================================================

exports.criarPagamento = onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== "POST") {
        return res.status(405).send({ error: "Método não permitido" });
      }

      // --- 🔒 CAMADA DE SEGURANÇA (TOKEN) ---
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
         logger.warn("Tentativa de acesso sem token.");
         return res.status(401).send({ error: "Não autorizado. Faça login novamente." });
      }

      const idToken = authHeader.split('Bearer ')[1];
      let decodedToken;

      try {
         decodedToken = await admin.auth().verifyIdToken(idToken);
      } catch (error) {
         logger.warn("Token inválido ou expirado.");
         return res.status(403).send({ error: "Sessão inválida." });
      }

      const userId = decodedToken.uid; 
      // ------------------------------------------------

      const { email, nome, cpfCnpj, billingType, cardData } = req.body;

      if (!email) {
        return res.status(400).send({ error: "Email obrigatório." });
      }

      if (billingType === 'CREDIT_CARD' && !cardData) {
         return res.status(400).send({ error: "Dados do cartão são obrigatórios." });
      }

      // A. Procura ou Cria o Cliente no Asaas
      let customerId;
      try {
          const buscaCliente = await axios.get(`${ASAAS_URL}/customers?email=${email}`, {
            headers: { access_token: ASAAS_API_KEY }
          });

          if (buscaCliente.data.data.length > 0) {
            customerId = buscaCliente.data.data[0].id;
            await axios.post(`${ASAAS_URL}/customers/${customerId}`, {
                cpfCnpj: cpfCnpj,
                name: nome
            }, { headers: { access_token: ASAAS_API_KEY } });
          } else {
            const novoCliente = await axios.post(`${ASAAS_URL}/customers`, {
              name: nome,
              email: email,
              cpfCnpj: cpfCnpj || "",
              externalReference: userId,
              notificationDisabled: false,
            }, { headers: { access_token: ASAAS_API_KEY } });
            customerId = novoCliente.data.id;
          }
      } catch (errCliente) {
          throw new Error(`Erro ao criar cliente: ${errCliente.response?.data?.errors?.[0]?.description || errCliente.message}`);
      }

      await db.collection("users").doc(userId).update({
        asaasCustomerId: customerId
      }, { merge: true });

      // C. Monta a Cobrança
      const hoje = new Date().toISOString().split('T')[0];
      
      const payloadCobranca = {
        customer: customerId,
        billingType: billingType || "PIX",
        dueDate: hoje,
        value: 19.90, // Valor ajustado
        description: "Assinatura Mensal - BeamedControl",
        externalReference: userId,
      };

      if (billingType === 'CREDIT_CARD') {
        payloadCobranca.creditCard = {
            holderName: cardData.holderName,
            number: cardData.number,
            expiryMonth: cardData.expiryMonth,
            expiryYear: cardData.expiryYear,
            ccv: cardData.ccv
        };
        payloadCobranca.creditCardHolderInfo = {
            name: nome,
            email: email,
            cpfCnpj: cpfCnpj,
            postalCode: cardData.postalCode,      // CEP Real
            addressNumber: cardData.addressNumber, // Número Real
            phone: cardData.phone,                 // Celular Real
            mobilePhone: cardData.phone            // Celular Real
        }
      }

      // D. Envia ao Asaas
      const cobranca = await axios.post(`${ASAAS_URL}/payments`, payloadCobranca, {
        headers: { access_token: ASAAS_API_KEY }
      });

      const idCobranca = cobranca.data.id;

      // E. Resposta
      if (billingType === 'PIX' || !billingType) {
          const responseQrCode = await axios.get(
            `${ASAAS_URL}/payments/${idCobranca}/pixQrCode`,
            { headers: { access_token: ASAAS_API_KEY } }
          );

          return res.status(200).json({
            success: true,
            type: 'PIX',
            paymentId: idCobranca,
            imagem: responseQrCode.data.encodedImage, 
            payload: responseQrCode.data.payload      
          });
      }

      if (billingType === 'CREDIT_CARD') {
          return res.status(200).json({
              success: true,
              type: 'CREDIT_CARD',
              paymentId: idCobranca,
              status: cobranca.data.status 
          });
      }

    } catch (error) {
      // 🛡️ SEGURANÇA: SANITIZAÇÃO DE LOGS (Proteção de Dados)
      const dadosSeguros = { ...req.body };
      
      // Censura o cartão antes de gravar no log
      if (dadosSeguros.cardData) {
          dadosSeguros.cardData = {
              number: "MASCARADO **** " + (req.body.cardData?.number ? req.body.cardData.number.slice(-4) : "XXXX"),
              ccv: "***", 
              holderName: "MASCARADO",
              expiryMonth: "**",
              expiryYear: "****"
          };
      }

      // Tenta capturar a mensagem de erro REAL do Asaas
      let mensagemErroAsaas = "Houve um problema ao processar o pagamento.";
      if (error.response?.data?.errors && error.response.data.errors.length > 0) {
          mensagemErroAsaas = error.response.data.errors[0].description; // Ex: "Cartão vencido"
      } else if (error.message) {
          mensagemErroAsaas = error.message;
      }

      // Loga o erro técnico (seguro)
      logger.error("Erro no pagamento:", {
          erroTecnico: error.response?.data || error.message,
          inputDoUsuario: dadosSeguros 
      });
      
      // Devolve para o Front a mensagem amigável do Asaas
      return res.status(500).send({ 
        error: mensagemErroAsaas, // Agora o React vai mostrar o motivo real!
        details: mensagemErroAsaas 
      });
    }
  });
});


// ==================================================================
// 🔗 PARTE 3: WEBHOOK (Confirmação de Pagamento)
// ==================================================================

exports.webhookAsaas = onRequest(async (req, res) => {
    try {
        if (req.method !== "POST") return res.status(405).send("Method not allowed");

        const tokenRecebido = req.headers["asaas-access-token"];
        if (tokenRecebido !== WEBHOOK_SECRET) {
            logger.warn("Tentativa de acesso não autorizado ao Webhook.");
            return res.status(401).send("Acesso negado.");
        }

        const evento = req.body.event;
        const pagamento = req.body.payment;
        
        logger.info(`Recebi evento: ${evento}`);

        if (evento === "PAYMENT_CONFIRMED" || evento === "PAYMENT_RECEIVED") {
            const userId = pagamento.externalReference;

            if (userId) {
                await db.collection("users").doc(userId).update({
                    status: "ativo",
                    ultimoPagamento: new Date(),
                    valorPago: pagamento.value
                });
                logger.info(`✅ Usuário ${userId} ativado com sucesso!`);
            }
        }

        return res.json({ received: true });

    } catch (error) {
        logger.error("Erro no Webhook:", error);
        return res.status(200).json({ received: false }); 
    }
});


// ==================================================================
// 🧠 FUNÇÕES AUXILIARES (Lógica do Robô)
// ==================================================================

function ehDiaDeTomar(med, dataAtual) {
    if (!med.dataInicioTratamento) return true;
    const dataInicio = new Date(med.dataInicioTratamento + "T00:00:00");
    const diffTime = Math.abs(dataAtual - dataInicio);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (med.frequenciaTipo === 'diario') return true;
    if (med.frequenciaTipo === 'intervalo') {
        const intervalo = med.frequenciaIntervalo || 2;
        return (diffDays % intervalo) === 0;
    }
    if (med.frequenciaTipo === 'dias_semana') {
        const diaHoje = dataAtual.getDay(); 
        return med.frequenciaDias && med.frequenciaDias.includes(diaHoje);
    }
    return true;
}

function calcularDosesPendentes(med, agora) {
    if (!med.horarios || !med.ultimaChecagem) return 0;
    const ultimaChecagem = new Date(med.ultimaChecagem);
    let contador = 0;

    med.horarios.forEach(horarioStr => {
        const [hora, minuto] = horarioStr.split(':').map(Number);
        const dataHorarioHoje = new Date(agora);
        dataHorarioHoje.setHours(hora, minuto, 0, 0);

        if (dataHorarioHoje > ultimaChecagem && dataHorarioHoje <= agora) {
            contador++;
        }
    });
    return contador;
}

async function processarDesconto(docRef, med, medId, qtdDoses, agora) {
    const doseTotal = qtdDoses * (med.dose || 1);
    let novaCaixaAtiva = Number(med.caixaAtivaRestante) - doseTotal;
    let novoEstoque = Number(med.estoqueCaixas);

    while (novaCaixaAtiva <= 0) {
        if (novoEstoque > 0) {
            novoEstoque--;
            novaCaixaAtiva += Number(med.capacidadeCaixa);
        } else {
            break; 
        }
    }

    await docRef.update({
        caixaAtivaRestante: novaCaixaAtiva,
        estoqueCaixas: novoEstoque,
        ultimaChecagem: agora.toISOString()
    });

    await db.collection("historico_medicamentos").add({
        data: agora.toISOString(),
        pacienteId: med.pacienteId,
        medicamentoId: medId,
        medicamentoNome: med.nome,
        acao: "ROBO_CONSUMO",
        detalhe: `Robô descontou ${doseTotal} dose(s) automaticamente.`,
        usuario: "Sistema Automático"
    });
}