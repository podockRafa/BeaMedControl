// src/utils/robot.js
import { differenceInCalendarDays, parseISO, isSameDay } from 'date-fns';

/**
 * Função principal que calcula quantas doses deveriam ter sido tomadas
 * desde a última checagem até agora.
 */
export function calcularDosesPendentes(med, agora = new Date()) {
  const ultimaChecagem = new Date(med.ultimaChecagem);
  const inicioTratamento = new Date(med.dataInicioTratamento); // Importante para o intervalo
  let dosesConsumidas = 0;

  // Vamos percorrer hora a hora, desde a ultima checagem até agora
  // (Essa abordagem é segura e evita erros de virada de dia)
  let cursor = new Date(ultimaChecagem.getTime());
  
  // Adiciona 1 minuto ao cursor para não contar a mesma dose duas vezes se for exatamente na hora
  cursor.setMinutes(cursor.getMinutes() + 1);

  while (cursor <= agora) {
    // 1. Verifica se HOJE (dia do cursor) é dia de tomar remédio
    if (ehDiaDeTomar(med, cursor, inicioTratamento)) {
      
      // 2. Verifica se a HORA ATUAL (do cursor) bate com algum horário da prescrição
      const horaFormatada = cursor.getHours().toString().padStart(2, '0') + ':' + 
                            cursor.getMinutes().toString().padStart(2, '0');
      
      if (med.horarios.includes(horaFormatada)) {
        dosesConsumidas += med.dose; // Soma a dose (ex: tomou 2 comprimidos)
      }
    }

    // Avança 1 minuto no tempo
    cursor.setMinutes(cursor.getMinutes() + 1);
  }

  return dosesConsumidas;
}

// Verifica as regras de frequência (Diário, Dias da Semana, Intervalo)
function ehDiaDeTomar(med, dataAtual, dataInicio) {
  // Caso 1: Todo dia
  if (med.frequenciaTipo === 'diario') return true;

  // Caso 2: Dias da Semana (0=Dom, 1=Seg...)
  if (med.frequenciaTipo === 'dias_semana') {
    const diaSemana = dataAtual.getDay(); // Retorna 0 a 6
    return med.frequenciaDias.includes(diaSemana);
  }

  // Caso 3: Intervalo (Dia sim, dia não)
  if (med.frequenciaTipo === 'intervalo') {
    // Calcula quantos dias se passaram desde o início
    const diffDias = differenceInCalendarDays(dataAtual, dataInicio);
    
    // Se o resto da divisão for 0, é dia de tomar.
    // Ex: Intervalo 2. Dia 0 (toma), Dia 1 (não), Dia 2 (toma)...
    return diffDias % med.frequenciaIntervalo === 0;
  }

  return false;
}

/**
 * Calcula o NOVO estado do medicamento após consumir as doses
 */
export function processarConsumo(med, qtdDosesParaConsumir) {
  let { 
    caixaAtivaRestante, 
    estoqueCaixas, 
    capacidadeCaixa 
  } = med;

  let historicoLog = []; // Para sabermos o que aconteceu
  let saldoParaConsumir = qtdDosesParaConsumir;
  let status = 'ok'; // ok, atencao, critico

  // Enquanto tiver dose para descontar...
  while (saldoParaConsumir > 0) {
    if (caixaAtivaRestante > 0) {
      // Tem comprimido na caixa aberta, consome 1
      caixaAtivaRestante--;
      saldoParaConsumir--;
    } else {
      // Caixa ativa acabou! Precisamos abrir uma do estoque
      if (estoqueCaixas > 0) {
        estoqueCaixas--;
        caixaAtivaRestante = capacidadeCaixa; // Enche a caixa ativa
        historicoLog.push(`Abriu nova caixa. Estoque restante: ${estoqueCaixas}`);
        
        // Agora volta pro loop para consumir desse novo saldo
      } else {
        // SOCORRO! Acabou o estoque também.
        status = 'critico';
        historicoLog.push(`FALTA DE MEDICAMENTO! Deixou de tomar ${saldoParaConsumir} doses.`);
        break; // Para o loop, não tem como consumir o que não existe
      }
    }
  }

  // Define alertas baseado no estoque final
  if (estoqueCaixas === 0 && caixaAtivaRestante < 5) {
    status = 'critico';
  } else if (estoqueCaixas === 0) {
    status = 'atencao';
  }

  return {
    novaCaixaAtiva: caixaAtivaRestante,
    novoEstoque: estoqueCaixas,
    novoStatus: status,
    logs: historicoLog
  };
}