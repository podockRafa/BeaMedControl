/**
 * ARQUIVO MESTRE: ROBÔ (CRON) + PAGAMENTOS (ASAAS)
 * Versão Final: Otimizada com Query de Horas (Baixo Custo) 🚀
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors")({ origin: true });

admin.initializeApp();
const db = admin.firestore();

// ==================================================================
// ⚙️ CONFIGURAÇÕES DO ASAAS
// ==================================================================
const ASAAS_URL = process.env.ASAAS_URL; 
const ASAAS_API_KEY = process.env.ASAAS_API_KEY; 
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET; 


// ==================================================================
// 🤖 PARTE 1: ROBÔ BEA (Versão Otimizada e Blindada) 🇧🇷
// ==================================================================

exports.verificarEstoque = onSchedule({
    schedule: "0 * * * *", // Hora cheia
    timeZone: "America/Sao_Paulo",
    timeoutSeconds: 60,
}, async (event) => {
    
    const agora = new Date();
    
    // 1. CALCULA AS HORAS PARA O FILTRO OTIMIZADO
    // Pega a hora atual do Brasil (ex: se são 13:00, pega 13)
    const horaAtual = parseInt(agora.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", hour: '2-digit', hour12: false }));
    
    // Calcula a hora anterior para garantir que não perdemos nada (ex: 12)
    // Se for 00h (meia noite), a anterior é 23h
    const horaAnterior = horaAtual === 0 ? 23 : horaAtual - 1;

    logger.info(`🤖 Robô Bea iniciada: Buscando remédios das janelas ${horaAnterior}h e ${horaAtual}h`);

    try {
        // 🔥 A MÁGICA DA OTIMIZAÇÃO: QUERY DIRECIONADA
        // Em vez de ler TODOS os remédios do banco, lê apenas:
        // 1. Os que estão ativos
        // 2. Os que têm horário marcado para a hora atual ou anterior (usando o índice)
        const snapshot = await db.collection("medicamentos")
            .where("status", "==", "ativo") 
            .where("horarios_horas", "array-contains-any", [horaAnterior, horaAtual])
            .get();

        if (snapshot.empty) {
            logger.info("💤 Nenhum remédio agendado para este horário. Economizamos leituras!");
            return;
        }

        const mapPacientes = {};

        // 2. Agrupa por Paciente
        snapshot.forEach(doc => {
            const med = doc.data();
            // Nota: Não precisamos mais checar se status == 'pausado' aqui, 
            // pois a query lá em cima já filtrou apenas os 'ativo'.
            
            if (!med.horarios) return;
            
            if (!mapPacientes[med.pacienteId]) {
                mapPacientes[med.pacienteId] = [];
            }
            mapPacientes[med.pacienteId].push({ id: doc.id, ref: doc.ref, data: med });
        });

        // 3. Processa cada Paciente
        const promisesPacientes = Object.keys(mapPacientes).map(async (pacienteId) => {
            const listaMeds = mapPacientes[pacienteId];
            let relatorioFinal = []; 
            let houveAcao = false;

            for (const item of listaMeds) {
                const med = item.data;
                // Garante datas válidas
                let ultimaChecagem = med.ultimaChecagem ? new Date(med.ultimaChecagem) : new Date(med.criadoEm.toDate());

                // Filtra horários (Com Fuso Horário Corrigido)
                const horariosParaDescontar = med.horarios.filter(h => {
                    const hojeBR = agora.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
                    const dataString = `${hojeBR}T${h}:00-03:00`;
                    const dataHorarioHoje = new Date(dataString);

                    if (isNaN(dataHorarioHoje.getTime())) return false;
                    return dataHorarioHoje <= agora && dataHorarioHoje > ultimaChecagem;
                });

                if (horariosParaDescontar.length > 0) {
                    // 👇 CHAMA A FUNÇÃO MATEMÁTICA BLINDADA
                    const resultado = await processarDescontoBlindado(item.ref, med, item.id, horariosParaDescontar, agora);
                    if (resultado) {
                        relatorioFinal.push(resultado);
                        houveAcao = true;
                    }
                }
            }

            // 4. Salva o Card Agrupado
            if (houveAcao && relatorioFinal.length > 0) {
                const textoDetalhe = relatorioFinal.join("\n");

                await db.collection("historico_medicamentos").add({
                    data: agora.toISOString(),
                    pacienteId: pacienteId,
                    medicamentoId: "AGRUPADO", 
                    medicamentoNome: "💊 Visita do Robô Bea",
                    acao: "ROBO_CONSUMO",
                    detalhe: textoDetalhe,
                    usuario: "🤖 Robô Bea"
                });
            }
        });

        await Promise.all(promisesPacientes);
        logger.info(`✅ Ciclo do Robô Bea finalizado. Processados ${snapshot.size} remédios.`);

    } catch (error) {
        logger.error("❌ Erro no robô:", error);
    }
});

// 👇 FUNÇÃO AUXILIAR BLINDADA

async function processarDescontoBlindado(docRef, med, medId, horariosVencidos, agora) {
    // 🛡️ 1. CONVERSÃO SEGURA (BLINDAGEM)
    const dose = Number(med.dose || 1);
    const estoqueCaixas = Number(med.estoqueCaixas || 0);
    const caixaAtiva = Number(med.caixaAtivaRestante || 0);
    const capacidade = Number(med.capacidadeCaixa || 30);
    
    // Calcula quantos comprimidos o robô precisa baixar AGORA
    const qtdNecessaria = horariosVencidos.length * dose;

    // Calcula quantos comprimidos existem NO TOTAL (Somando caixa aberta + caixas fechadas)
    const totalDisponivel = caixaAtiva + (estoqueCaixas * capacidade);

    // 🛑 2. VERIFICAÇÃO DE ESTOQUE ZERO
    if (totalDisponivel < qtdNecessaria) {
        await docRef.update({
            ultimaChecagem: agora.toISOString()
        });

        const horariosTexto = horariosVencidos.join(", ");
        return `🚫 ${med.nome}: NÃO TOMOU! Estoque insuficiente para ${qtdNecessaria} dose(s) das ${horariosTexto}.`;
    }

    // ✅ 3. SE TEM ESTOQUE, SEGUE O BAIXA NORMAL
    let novaCaixa = caixaAtiva - qtdNecessaria;
    let novoEstoque = estoqueCaixas;
    let alertaTrocaCaixa = false;

    // Lógica de virar a caixa (abrir nova se a atual acabar)
    while (novaCaixa <= 0) {
        if (novoEstoque > 0) {
            novoEstoque--;       // Tira uma caixa do armário
            novaCaixa += capacidade; // Enche a cartela
            alertaTrocaCaixa = true;
        } else {
            novaCaixa = 0; 
            break;
        }
    }

    // Atualiza no Banco
    await docRef.update({
        caixaAtivaRestante: Number(novaCaixa),
        estoqueCaixas: Number(novoEstoque),
        ultimaChecagem: agora.toISOString()
    });

    const horariosTexto = horariosVencidos.join(", ");
    let msgExtra = alertaTrocaCaixa ? " (Abriu nova caixa 📦)" : "";
    
    return `✅ ${med.nome}: Baixou ${qtdNecessaria} comp. (Horários: ${horariosTexto}). Restam: ${novaCaixa} na caixa.${msgExtra}`;
}

// ==================================================================
// 💳 PARTE 2: CRIAR PAGAMENTO
// ==================================================================

exports.criarPagamento = onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== "POST") return res.status(405).send({ error: "Método não permitido" });

      // --- 🔒 SEGURANÇA (TOKEN) ---
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).send({ error: "Não autorizado." });
      }
      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userId = decodedToken.uid; 
      // ----------------------------

      const { email, nome, cpfCnpj, billingType, cardData } = req.body;

      if (!email) return res.status(400).send({ error: "Email obrigatório." });
      if (billingType === 'CREDIT_CARD' && !cardData) return res.status(400).send({ error: "Dados do cartão obrigatórios." });

      // A. Cliente Asaas
      let customerId;
      try {
          const busca = await axios.get(`${ASAAS_URL}/customers?email=${email}`, { headers: { access_token: ASAAS_API_KEY } });
          if (busca.data.data.length > 0) {
            customerId = busca.data.data[0].id;
            await axios.post(`${ASAAS_URL}/customers/${customerId}`, { cpfCnpj, name: nome }, { headers: { access_token: ASAAS_API_KEY } });
          } else {
            const novo = await axios.post(`${ASAAS_URL}/customers`, { name: nome, email, cpfCnpj, externalReference: userId }, { headers: { access_token: ASAAS_API_KEY } });
            customerId = novo.data.id;
          }
      } catch (err) { throw new Error(`Erro cliente: ${err.message}`); }

      await db.collection("users").doc(userId).update({ asaasCustomerId: customerId }, { merge: true });

      // B. Cobrança
      const hoje = new Date().toISOString().split('T')[0];
      const payload = {
        customer: customerId,
        billingType: billingType || "PIX",
        dueDate: hoje,
        value: 19.90,
        description: "Assinatura Mensal - BeamedControl",
        externalReference: userId,
      };

      if (billingType === 'CREDIT_CARD') {
        payload.creditCard = {
            holderName: cardData.holderName,
            number: cardData.number,
            expiryMonth: cardData.expiryMonth,
            expiryYear: cardData.expiryYear,
            ccv: cardData.ccv
        };
        payload.creditCardHolderInfo = {
            name: nome, email, cpfCnpj,
            postalCode: cardData.postalCode,
            addressNumber: cardData.addressNumber,
            phone: cardData.phone,
            mobilePhone: cardData.phone
        }
      }

      const cobranca = await axios.post(`${ASAAS_URL}/payments`, payload, { headers: { access_token: ASAAS_API_KEY } });
      const idCobranca = cobranca.data.id;

      if (billingType === 'PIX' || !billingType) {
          const qr = await axios.get(`${ASAAS_URL}/payments/${idCobranca}/pixQrCode`, { headers: { access_token: ASAAS_API_KEY } });
          return res.status(200).json({ success: true, type: 'PIX', paymentId: idCobranca, imagem: qr.data.encodedImage, payload: qr.data.payload });
      }

      return res.status(200).json({ success: true, type: 'CREDIT_CARD', paymentId: idCobranca, status: cobranca.data.status });

    } catch (error) {
      logger.error("Erro Pagamento:", error.response?.data || error.message);
      return res.status(500).send({ error: error.response?.data?.errors?.[0]?.description || "Erro ao processar." });
    }
  });
});


// ==================================================================
// 🔗 PARTE 3: WEBHOOK
// ==================================================================

exports.webhookAsaas = onRequest(async (req, res) => {
    try {
        if (req.method !== "POST") return res.status(405).send("Method not allowed");
        if (req.headers["asaas-access-token"] !== WEBHOOK_SECRET) return res.status(401).send("Acesso negado.");

        const { event, payment } = req.body;
        
        if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
            const userId = payment.externalReference;
            if (userId) {
                await db.collection("users").doc(userId).update({
                    status: "ativo",
                    ultimoPagamento: new Date(),
                    valorPago: payment.value
                });
                logger.info(`✅ Usuário ${userId} ativado!`);
            }
        }
        return res.json({ received: true });
    } catch (error) {
        logger.error("Erro Webhook:", error);
        return res.status(200).json({ received: false }); 
    }
});