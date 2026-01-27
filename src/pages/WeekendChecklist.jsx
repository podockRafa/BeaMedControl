// src/pages/WeekendChecklist.jsx
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { db } from '../services/firebaseConnection';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { ArrowLeft, CheckCircle, ShoppingCart, AlertTriangle, User } from 'lucide-react'; // Adicionei User
import { addDays, format, differenceInCalendarDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function WeekendChecklist() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pacientesEmRisco, setPacientesEmRisco] = useState([]);
  const DIAS_PADRAO = 5; // <--- Mude aqui quando quiser o padrão geral

  useEffect(() => {
    async function gerarRelatorio() {
      if (!user?.uid) return;

      try {
        // 1. Busca Pacientes
        const qPacientes = query(collection(db, "pacientes"), where("userId", "==", user.uid), orderBy("nome"));
        const snapPacientes = await getDocs(qPacientes);

        // 2. Busca Medicamentos
        const qMeds = query(collection(db, "medicamentos"), where("userId", "==", user.uid));
        const snapMeds = await getDocs(qMeds);

        const mapaPacientes = {};
        // Guardamos o objeto completo (nome + diasVerificacao)
        snapPacientes.forEach(doc => { mapaPacientes[doc.id] = doc.data(); });

        // OBJETO PARA AGRUPAMENTO
        // Estrutura: { "Ana": { nome: "Ana", statusGeral: "critico", meds: [...] }, "Joao": ... }
        let grupos = {};

        snapMeds.forEach(doc => {
            const med = { id: doc.id, ...doc.data() };
            const dadosPaciente = mapaPacientes[med.pacienteId];

            if(!dadosPaciente) return;

            // Pega dias personalizados ou usa 4 padrão
            const diasParaChecar = Number(dadosPaciente.diasVerificacao || DIAS_PADRAO);

            // Estoque Total
            const estoqueTotal = Number(med.caixaAtivaRestante) + (Number(med.estoqueCaixas) * Number(med.capacidadeCaixa));

            // Simulação de Consumo
            let consumoNecessario = 0;
            let dataCursor = new Date();
            
            for (let i = 0; i < diasParaChecar; i++) {
                if (ehDiaDeTomar(med, dataCursor)) {
                    consumoNecessario += (Number(med.dose) * med.horarios.length);
                }
                dataCursor = addDays(dataCursor, 1);
            }

            // LÓGICA DE RISCO
            let nivelRisco = null; // null, 'atencao' ou 'critico'
            let faltaEmTexto = '';

            if (estoqueTotal < consumoNecessario) {
                nivelRisco = 'critico';
                faltaEmTexto = estoqueTotal === 0 ? 'ACABOU' : 'VAI FALTAR';
            } else if (estoqueTotal <= consumoNecessario + 2) {
                nivelRisco = 'atencao';
                faltaEmTexto = 'RISCO';
            }

            // SE TEM RISCO, ADICIONA NO GRUPO DO PACIENTE
            if (nivelRisco) {
                const nomePac = dadosPaciente.nome;

                // Se o grupo desse paciente ainda não existe, cria
                if (!grupos[nomePac]) {
                    grupos[nomePac] = {
                        nome: nomePac,
                        diasCheck: diasParaChecar,
                        statusGeral: 'atencao', // Começa leve, piora se tiver critico
                        meds: []
                    };
                }

                // Se esse remédio for crítico, o card inteiro vira crítico (vermelho)
                if (nivelRisco === 'critico') {
                    grupos[nomePac].statusGeral = 'critico';
                }

                // Adiciona o remédio na lista desse paciente
                grupos[nomePac].meds.push({
                    id: med.id,
                    nome: med.nome,
                    gramatura: med.gramatura || '',
                    estoqueTotal,
                    consumoNecessario,
                    faltaEm: faltaEmTexto,
                    status: nivelRisco
                });
            }
        });

        // Transforma o Objeto { Ana: {...}, Joao: {...} } em Array [ {...}, {...} ] para o React ler
        setPacientesEmRisco(Object.values(grupos));
      
      } catch (error) {
          console.error("Erro checklist:", error);
      } finally {
          setLoading(false);
      }
    }

    if(user) gerarRelatorio();

  }, [user]);

  function ehDiaDeTomar(med, dataSimulada) {
    if(!med.dataInicioTratamento) return true;
    const inicio = new Date(med.dataInicioTratamento + "T00:00:00");
    
    if (med.frequenciaTipo === 'diario') return true;
    if (med.frequenciaTipo === 'dias_semana') {
        return med.frequenciaDias && med.frequenciaDias.includes(dataSimulada.getDay());
    }
    if (med.frequenciaTipo === 'intervalo') {
        const diff = differenceInCalendarDays(dataSimulada, inicio);
        return diff % med.frequenciaIntervalo === 0;
    }
    return false;
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <header className="bg-white p-4 shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={24} className="text-gray-600"/>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Previsão de Estoque</h1>
            <p className="text-xs text-gray-500">Análise personalizada por paciente</p>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-6">
        {loading && <div className="flex justify-center mt-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hospital-blue"></div></div>}

        {!loading && pacientesEmRisco.length === 0 && (
            <div className="text-center mt-10 bg-green-50 p-8 rounded-lg border border-green-200 animate-fade-in">
                <CheckCircle size={48} className="mx-auto text-green-500 mb-4"/>
                <h2 className="text-lg font-bold text-green-700">Tudo Garantido!</h2>
                <p className="text-green-600 text-sm">Nenhum paciente corre risco de ficar sem medicação nos próximos dias.</p>
            </div>
        )}

        {/* LOOP DOS PACIENTES (CARD MAIOR) */}
        {pacientesEmRisco.map((paciente, idx) => (
            <div key={idx} className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
                paciente.statusGeral === 'critico' ? 'border-red-200' : 'border-yellow-200'
            }`}>
                
                {/* CABEÇALHO DO CARD (NOME DO PACIENTE) */}
                <div className={`p-3 border-b flex justify-between items-center ${
                    paciente.statusGeral === 'critico' ? 'bg-red-50' : 'bg-yellow-50'
                }`}>
                    <div className="flex items-center gap-2">
                        <div className="bg-white p-1.5 rounded-full shadow-sm">
                            <User size={16} className={paciente.statusGeral === 'critico' ? 'text-red-500' : 'text-yellow-600'}/>
                        </div>
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            {paciente.nome}
                            <span className="text-[10px] font-normal text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-100">
                                Previsão: {paciente.diasCheck} dias
                            </span>
                        </h3>
                    </div>
                    {paciente.statusGeral === 'critico' && (
                        <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-1 rounded-full flex items-center gap-1 border border-red-200">
                            <AlertTriangle size={10}/> AÇÃO NECESSÁRIA
                        </span>
                    )}
                </div>

                {/* LISTA DE REMÉDIOS DESSE PACIENTE */}
                <div className="divide-y divide-gray-100">
                    {paciente.meds.map((med, i) => (
                        <div key={i} className="p-4 hover:bg-gray-50 transition flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-gray-700">{med.nome} <span className="text-sm font-normal text-gray-400">{med.gramatura}</span></h4>
                                <div className="text-xs mt-1 text-gray-500 flex flex-col sm:flex-row sm:gap-4">
                                    <span>Tem: <strong className="text-gray-800">{med.estoqueTotal}</strong></span>
                                    <span>Precisa: <strong className="text-gray-800">{med.consumoNecessario}</strong></span>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                    med.status === 'critico' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                    {med.faltaEm}
                                </span>
                                <button className="text-hospital-blue bg-blue-50 hover:bg-blue-100 p-2 rounded-full transition" title="Adicionar à lista de compras">
                                    <ShoppingCart size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ))}
      </main>
    </div>
  );
}