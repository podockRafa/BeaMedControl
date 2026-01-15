/**
 * ARQUIVO MESTRE: ROBÔ (CRON) + PAGAMENTOS (ASAAS)
 * Versão Final: Corrigida e Otimizada
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
// 🤖 PARTE 1: ROBÔ BEA (Versão Blindada Anti-NaN e Fuso BR) 🇧🇷
// ==================================================================

exports.verificarEstoque = onSchedule({
    schedule: "0 * * * *", // Hora cheia
    timeZone: "America/Sao_Paulo",
    timeoutSeconds: 60,
}, async (event) => {
    
    const agora = new Date();
    logger.info(`🤖 Robô Bea iniciada: ${agora.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`);

    try {
        const snapshot = await db.collection("medicamentos").get();
        if (snapshot.empty) return;

        const mapPacientes = {};

        // 1. Agrupa por Paciente
        snapshot.forEach(doc => {
            const med = doc.data();
            if (med.status === 'pausado' || !med.horarios) return;
            
            if (!mapPacientes[med.pacienteId]) {
                mapPacientes[med.pacienteId] = [];
            }
            mapPacientes[med.pacienteId].push({ id: doc.id, ref: doc.ref, data: med });
        });

        // 2. Processa cada Paciente
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

            // 3. Salva o Card Agrupado (Aqui que estava o erro do nome!)
            if (houveAcao && relatorioFinal.length > 0) {
                const textoDetalhe = relatorioFinal.join("\n");

                await db.collection("historico_medicamentos").add({
                    data: agora.toISOString(),
                    pacienteId: pacienteId,
                    medicamentoId: "AGRUPADO", 
                    medicamentoNome: "💊 Visita do Robô Bea", // O NOME CERTO
                    acao: "ROBO_CONSUMO",
                    detalhe: textoDetalhe,
                    usuario: "🤖 Robô Bea"
                });
            }
        });

        await Promise.all(promisesPacientes);
        logger.info("✅ Ciclo do Robô Bea finalizado.");

    } catch (error) {
        logger.error("❌ Erro no robô:", error);
    }
});

// 👇 Substitua a função auxiliar lá no final do arquivo functions/index.js

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

    // 🛑 2. VERIFICAÇÃO DE ESTOQUE ZERO (A MUDANÇA ESTÁ AQUI)
    if (totalDisponivel < qtdNecessaria) {
        // Se não tem remédio suficiente, a gente NÃO SUBTRAI nada.
        // Apenas atualizamos a data para o robô não ficar tentando de novo daqui a 1 hora.
        await docRef.update({
            ultimaChecagem: agora.toISOString()
        });

        const horariosTexto = horariosVencidos.join(", ");
        // Retorna a mensagem de erro para o histórico
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
            // Isso aqui teoricamente nunca vai acontecer por causa do IF lá em cima,
            // mas deixamos como segurança.
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

    // Retorna a frase de sucesso
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


// ==================================================================
// 🧠 FUNÇÕES AUXILIARES ÚNICAS (Lógica de Desconto e Estoque)
// ==================================================================

async function processarDesconto(docRef, med, medId, qtdHorarios, agora) {
    const dosePorTomada = Number(med.dose || 1);
    // TOTAL DE COMPRIMIDOS = (Quantos horários passaram) * (Quantos comprimidos por vez)
    const totalComprimidosNecessarios = qtdHorarios * dosePorTomada;
    
    // 1. Estoque TOTAL Real
    const estoqueTotalFisico = Number(med.caixaAtivaRestante) + (Number(med.estoqueCaixas) * Number(med.capacidadeCaixa));

    // 🚨 FALTA DE ESTOQUE
    if (estoqueTotalFisico < totalComprimidosNecessarios) {
        logger.warn(`🚫 FALTA DE ESTOQUE: ${med.nome}`);
        
        await db.collection("historico_medicamentos").add({
            data: agora.toISOString(),
            pacienteId: med.pacienteId,
            medicamentoId: medId,
            medicamentoNome: med.nome,
            acao: "FALTA_ESTOQUE",
            detalhe: `PACIENTE NÃO TOMOU! Necessário ${totalComprimidosNecessarios} un, estoque insuficiente.`,
            usuario: "Sistema Automático"
        });

        // Só atualiza a hora para não travar o robô
        await docRef.update({ ultimaChecagem: agora.toISOString() });
        return; 
    }

    // ✅ TEM ESTOQUE - DESCONTA
    let novaCaixaAtiva = Number(med.caixaAtivaRestante) - totalComprimidosNecessarios;
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
        // 👇 MENSAGEM CORRIGIDA PARA O USUÁRIO ENTENDER
        detalhe: `Robô baixou ${totalComprimidosNecessarios} comprimido(s) (ref. a ${qtdHorarios} horários).`,
        usuario: "Sistema Automático"
    });
}