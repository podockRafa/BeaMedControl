// src/pages/WeekendChecklist.jsx
import { useState, useEffect, useContext } from 'react'; // 👈 Adicionei useContext
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext'; // 👈 Importei o Contexto
import { db } from '../services/firebaseConnection';
// 👇 Adicionei o 'where' nas importações
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { ArrowLeft, CheckCircle, ShoppingCart, AlertTriangle } from 'lucide-react';
import { differenceInCalendarDays, addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function WeekendChecklist() {
  const { user } = useContext(AuthContext); // 👈 Pegamos o usuário logado
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [alertas, setAlertas] = useState([]);

  useEffect(() => {
    async function gerarRelatorio() {
      // 🔒 SEGURANÇA: Se não tem usuário carregado, não busca nada
      if (!user?.uid) return;

      try {
        // 1. Busca SÓ os pacientes DESTE usuário
        const qPacientes = query(
            collection(db, "pacientes"), 
            where("userId", "==", user.uid), // 🔒 O CADEADO
            orderBy("nome")
        );
        const snapPacientes = await getDocs(qPacientes);

        // 2. Busca SÓ os medicamentos DESTE usuário
        const qMeds = query(
            collection(db, "medicamentos"),
            where("userId", "==", user.uid) // 🔒 O CADEADO
        );
        const snapMeds = await getDocs(qMeds);

        const mapaPacientes = {};
        snapPacientes.forEach(doc => { mapaPacientes[doc.id] = doc.data().nome; });

        let listaDeRisco = [];
        const diasParaChecar = 4; 

        snapMeds.forEach(doc => {
            const med = { id: doc.id, ...doc.data() };
            
            // Segurança extra: se por algum motivo o med não tiver paciente linkado no mapa, ignora
            if(!mapaPacientes[med.pacienteId]) return;

            // ESTOQUE TOTAL
            const estoqueTotal = Number(med.caixaAtivaRestante) + (Number(med.estoqueCaixas) * Number(med.capacidadeCaixa));

            // SIMULAÇÃO DE CONSUMO
            let consumoNecessario = 0;
            let dataCursor = new Date();
            
            for (let i = 0; i < diasParaChecar; i++) {
                if (ehDiaDeTomar(med, dataCursor)) {
                    consumoNecessario += (Number(med.dose) * med.horarios.length);
                }
                dataCursor = addDays(dataCursor, 1);
            }

            // LÓGICA DE RISCO
            if (estoqueTotal < consumoNecessario) {
                listaDeRisco.push({
                    id: med.id,
                    pacienteNome: mapaPacientes[med.pacienteId],
                    medNome: med.nome,
                    gramatura: med.gramatura || '',
                    estoqueTotal,
                    consumoNecessario,
                    faltaEm: estoqueTotal === 0 ? 'ACABOU' : 'VAI FALTAR',
                    status: 'critico'
                });
            } 
            else if (estoqueTotal <= consumoNecessario + 2) { 
                listaDeRisco.push({
                    id: med.id,
                    pacienteNome: mapaPacientes[med.pacienteId],
                    medNome: med.nome,
                    gramatura: med.gramatura || '',
                    estoqueTotal,
                    consumoNecessario,
                    faltaEm: 'RISCO',
                    status: 'atencao'
                });
            }
        });

        setAlertas(listaDeRisco);
      
      } catch (error) {
          console.error("Erro ao gerar checklist:", error);
      } finally {
          setLoading(false);
      }
    }

    // Só roda a função se o usuário estiver logado
    if(user) {
        gerarRelatorio();
    }

  }, [user]); // 👈 O efeito depende do 'user' agora

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

  const dataFinal = addDays(new Date(), 3);
  const textoDataFinal = format(dataFinal, "EEEE", { locale: ptBR });

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white p-4 shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={24} className="text-gray-600"/>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Previsão de Estoque</h1>
            <p className="text-xs text-gray-500">Garantia para os próximos 4 dias (até {textoDataFinal})</p>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto pb-20">
        {loading && <div className="flex justify-center mt-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hospital-blue"></div></div>}

        {!loading && alertas.length === 0 && (
            <div className="text-center mt-10 bg-green-50 p-8 rounded-lg border border-green-200 animate-fade-in">
                <CheckCircle size={48} className="mx-auto text-green-500 mb-4"/>
                <h2 className="text-lg font-bold text-green-700">Tudo Garantido!</h2>
                <p className="text-green-600 text-sm">Você tem estoque suficiente para passar o fim de semana/feriado tranquilo.</p>
            </div>
        )}

        <div className="space-y-3">
            {alertas.map((item, index) => (
                <div key={index} className={`bg-white p-4 rounded-lg shadow-sm border-l-4 flex justify-between items-center ${
                    item.status === 'critico' ? 'border-red-500 bg-red-50' : 'border-yellow-400 bg-yellow-50'
                }`}>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold bg-white border px-1 rounded text-gray-500 uppercase">{item.pacienteNome}</span>
                            {item.status === 'critico' && <span className="text-[10px] font-bold bg-red-200 text-red-800 px-1 rounded flex items-center gap-1"><AlertTriangle size={10}/> URGENTE</span>}
                        </div>
                        
                        <h3 className="font-bold text-gray-800">
                            {item.medNome} <span className="text-sm font-normal text-gray-600">{item.gramatura}</span>
                        </h3>
                        
                        <p className="text-xs text-gray-600 mt-1">
                            Você tem <strong>{item.estoqueTotal}</strong>. Precisa de <strong>{item.consumoNecessario}</strong>.
                        </p>
                    </div>

                    <div className="text-right flex flex-col items-end">
                         <span className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${
                             item.faltaEm === 'ACABOU' ? 'bg-red-600 text-white' : 'bg-yellow-200 text-yellow-800'
                         }`}>
                             {item.faltaEm === 'ACABOU' ? 'COMPRAR HOJE' : 'COMPRAR JÁ'}
                         </span>
                         {/* Botão sem ação por enquanto, apenas visual */}
                         <button className="mt-2 text-hospital-blue hover:text-blue-800 bg-white p-2 rounded-full shadow-sm">
                            <ShoppingCart size={20} />
                         </button>
                    </div>
                </div>
            ))}
        </div>
      </main>
    </div>
  );
}