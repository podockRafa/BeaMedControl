// src/pages/PatientDetails.jsx
import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../services/firebaseConnection';
import { AuthContext } from '../contexts/AuthContext'; 
import { doc, getDoc, collection, addDoc, query, onSnapshot, where, deleteDoc, updateDoc, orderBy, getDocs } from 'firebase/firestore'; 
import { ArrowLeft, Pill, Plus, Package, Clock, Calendar, Trash2, Pencil, Settings, RotateCcw, Syringe, Save, AlertTriangle, History, X, User } from 'lucide-react'; 
import { processarConsumo } from '../utils/robot'; 

export default function PatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [paciente, setPaciente] = useState(null);
  const [medicamentos, setMedicamentos] = useState([]);
  
  // MODAIS
  const [showModal, setShowModal] = useState(false); 
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false); 
  const [historyList, setHistoryList] = useState([]); 
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [selectedMed, setSelectedMed] = useState(null); 

  // ESTADOS PARA AJUSTE MANUAL
  const [manualCaixaAtiva, setManualCaixaAtiva] = useState(0);
  const [manualEstoque, setManualEstoque] = useState(0);

  // --- ESTADOS DO FORMULÁRIO ---
  const [gramatura, setGramatura] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [nomeMed, setNomeMed] = useState('');
  const [capacidadeCaixa, setCapacidadeCaixa] = useState(30);
  const [estoqueCaixas, setEstoqueCaixas] = useState(1);
  const [dose, setDose] = useState(1);
  
  // 👇 MUDANÇA 1: Horários agora é um Array (Lista), não texto solto
  const [horarios, setHorarios] = useState(['08:00']); 
  
  const [obsMed, setObsMed] = useState('');
  const [frequencia, setFrequencia] = useState('diario'); 
  const [diasSemana, setDiasSemana] = useState([]); 
  const [intervalo, setIntervalo] = useState(2); 
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);

  // 1. Carregar Paciente
  useEffect(() => {
    async function loadPatient() {
      const docRef = doc(db, "pacientes", id);
      const snapshot = await getDoc(docRef);
      if(snapshot.exists()){
        setPaciente(snapshot.data());
      } else {
        alert("Paciente não encontrado");
        navigate('/dashboard');
      }
    }
    loadPatient();
  }, [id, navigate]);

  // 2. Carregar Medicamentos (Realtime)
  useEffect(() => {
    const q = query(collection(db, "medicamentos"), where("pacienteId", "==", id));
    const unsub = onSnapshot(q, (snapshot) => {
      let lista = [];
      snapshot.forEach((doc) => {
        lista.push({ id: doc.id, ...doc.data() })
      });
      setMedicamentos(lista);
    });
    return () => unsub();
  }, [id]);

  // --- FUNÇÕES DE CONTROLE DE HORÁRIO (NOVO) ---
  function addHorario() {
    setHorarios([...horarios, ""]); // Adiciona vazio
  }

  function removeHorario(index) {
    const novaLista = horarios.filter((_, i) => i !== index);
    setHorarios(novaLista);
  }

  function updateHorario(index, valor) {
    const novaLista = [...horarios];
    novaLista[index] = valor;
    setHorarios(novaLista);
  }

  // --- FUNÇÃO DE BUSCAR HISTÓRICO ---
  async function handleOpenHistory() {
      setShowHistoryModal(true);
      setLoadingHistory(true);
      try {
          const q = query(
              collection(db, "historico_medicamentos"), 
              where("pacienteId", "==", id),
              orderBy("data", "desc")
          );
          
          const snapshot = await getDocs(q);
          let lista = [];
          snapshot.forEach(doc => {
              lista.push({ id: doc.id, ...doc.data() });
          });
          setHistoryList(lista);

      } catch (error) {
          console.log("Erro ao buscar histórico", error);
      } finally {
          setLoadingHistory(false);
      }
  }

  // --- FUNÇÃO DE SALVAR LOG ---
  async function registrarHistorico(med, tipoAcao, detalhe) {
      try {
          await addDoc(collection(db, "historico_medicamentos"), {
              data: new Date().toISOString(),
              pacienteId: id,
              pacienteNome: paciente?.nome,
              medicamentoId: med.id,
              medicamentoNome: med.nome,
              acao: tipoAcao, 
              detalhe: detalhe,
              usuario: user?.email || "Sistema"
          });
      } catch (error) { console.log("Erro log", error); }
  }

  // --- FUNÇÕES DE MALEABILIDADE ---
  function handleOpenOptions(med) {
      setSelectedMed(med);
      setManualCaixaAtiva(med.caixaAtivaRestante);
      setManualEstoque(med.estoqueCaixas);
      setShowOptionsModal(true);
  }

  async function handleDevolverDose() {
      if(!selectedMed) return;
      const novaQtd = Number(selectedMed.caixaAtivaRestante) + 1;
      
      if(novaQtd > selectedMed.capacidadeCaixa) {
          alert("A cartela já está cheia!");
          return;
      }

      try {
          await updateDoc(doc(db, "medicamentos", selectedMed.id), {
              caixaAtivaRestante: novaQtd
          });
          await registrarHistorico(selectedMed, "DEVOLUCAO", "Enfermeira devolveu 1 dose ao estoque.");
          alert("Dose devolvida com sucesso!");
          setShowOptionsModal(false);
      } catch (err) { alert("Erro ao devolver dose"); }
  }

  async function handleAdministrarSOS() {
      if(!selectedMed) return;
      const resultado = processarConsumo(selectedMed, 1); 
      
      try {
          await updateDoc(doc(db, "medicamentos", selectedMed.id), {
              caixaAtivaRestante: resultado.novaCaixaAtiva,
              estoqueCaixas: resultado.novoEstoque
          });
          await registrarHistorico(selectedMed, "SOS", "Administrado 1 dose extra (SOS).");
          alert("Medicamento SOS registrado!");
          setShowOptionsModal(false);
      } catch (err) { alert("Erro ao registrar SOS"); }
  }

  async function handleSalvarAjusteManual() {
      if(!selectedMed) return;
      try {
          await updateDoc(doc(db, "medicamentos", selectedMed.id), {
              caixaAtivaRestante: Number(manualCaixaAtiva),
              estoqueCaixas: Number(manualEstoque)
          });
          await registrarHistorico(selectedMed, "AJUSTE_MANUAL", `Correção: ${manualCaixaAtiva} na caixa, ${manualEstoque} no estoque.`);
          alert("Inventário corrigido!");
          setShowOptionsModal(false);
      } catch (err) { alert("Erro ao corrigir inventário"); }
  }

  // --- FUNÇÕES CRUD BÁSICAS ---
  async function handleDeleteMed(medId) {
    if(confirm("Tem certeza que deseja excluir este medicamento?")) {
      await deleteDoc(doc(db, "medicamentos", medId));
    }
  }

  function handleOpenNew() {
    setEditingId(null);
    resetForm();
    setShowModal(true);
  }

  function handleEditMed(med) {
    setEditingId(med.id);
    setNomeMed(med.nome);
    setCapacidadeCaixa(med.capacidadeCaixa);
    setEstoqueCaixas(med.estoqueCaixas);
    setDose(med.dose);
    
    // 👇 MUDANÇA 2: Carrega a lista direta (ou cria uma padrão se estiver vazio)
    setHorarios(med.horarios && med.horarios.length > 0 ? med.horarios : ['08:00']);
    
    setObsMed(med.obs);
    setGramatura(med.gramatura || '');
    setFrequencia(med.frequenciaTipo);
    setDiasSemana(med.frequenciaDias || []);
    setIntervalo(med.frequenciaIntervalo || 2);
    setDataInicio(med.dataInicioTratamento);
    setShowModal(true);
  }

  async function handleSaveMed(e) {
    e.preventDefault();
    
    // 👇 MUDANÇA 3: Limpa horários vazios antes de salvar
    const listaHorariosLimpa = horarios.filter(h => h !== "");

    if(listaHorariosLimpa.length === 0) {
        alert("Adicione pelo menos um horário.");
        return;
    }

    if(frequencia === 'dias_semana' && diasSemana.length === 0) {
      alert("Selecione pelo menos um dia da semana.");
      return;
    }

    const dadosBase = {
        pacienteId: id,
        userId: user.uid, // 🔒 SEGURANÇA: Vincula ao dono da conta para o filtro funcionar
        nome: nomeMed,
        capacidadeCaixa: Number(capacidadeCaixa),
        dose: Number(dose),
        gramatura: gramatura, 
        horarios: listaHorariosLimpa, // Salva o array direto
        obs: obsMed,
        frequenciaTipo: frequencia,
        frequenciaDias: diasSemana,
        frequenciaIntervalo: Number(intervalo),
        dataInicioTratamento: dataInicio,
        ultimaChecagem: new Date().toISOString()
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "medicamentos", editingId), { ...dadosBase });
        alert("Medicamento atualizado!");
      } else {
        await addDoc(collection(db, "medicamentos"), {
            ...dadosBase,
            caixaAtivaRestante: Number(capacidadeCaixa),
            estoqueCaixas: Number(estoqueCaixas) - 1,
        });
      }
      setShowModal(false);
      resetForm();
      setEditingId(null);
    } catch (error) { console.log(error); alert("Erro ao salvar"); }
  }

  function resetForm() {
    setNomeMed(''); setCapacidadeCaixa(30); setEstoqueCaixas(1); setDose(1);
    setHorarios(['08:00']); // Reseta para array
    setObsMed(''); setFrequencia('diario');
    setDiasSemana([]); setIntervalo(2); setGramatura('');
  }

  function toggleDia(indexDia) {
    if(diasSemana.includes(indexDia)) { setDiasSemana(diasSemana.filter(d => d !== indexDia)); } 
    else { setDiasSemana([...diasSemana, indexDia].sort()); }
  }

  function getCardColor(med) {
    if (med.estoqueCaixas === 0 && med.caixaAtivaRestante < 5) return "border-alert-red bg-red-50";
    if (med.estoqueCaixas === 0) return "border-warning-yellow bg-yellow-50";
    return "border-hospital-blue bg-white";
  }

  function renderFrequenciaText(med) {
    if(med.frequenciaTipo === 'diario') return "Todo dia";
    if(med.frequenciaTipo === 'intervalo') return med.frequenciaIntervalo === 2 ? "Dia sim, Dia não" : `A cada ${med.frequenciaIntervalo} dias`;
    if(med.frequenciaTipo === 'dias_semana') {
      const mapDias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      return med.frequenciaDias.map(d => mapDias[d]).join(', ');
    }
    return "Personalizado";
  }

  function formatarData(isoString) {
      if(!isoString) return "-";
      const data = new Date(isoString);
      return `${data.toLocaleDateString('pt-BR')} às ${data.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`;
  }

  function renderBadgeAcao(acao) {
      switch(acao) {
          case 'ROBO_CONSUMO': 
            return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] font-bold uppercase">🤖 Automático</span>;
          
          case 'SOS': 
            return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-[10px] font-bold uppercase">💊 SOS / Extra</span>;
          
          case 'DEVOLUCAO': 
            return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold uppercase">↩️ Devolução</span>;
          
          case 'AJUSTE_MANUAL': 
            return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-[10px] font-bold uppercase">⚙️ Ajuste Manual</span>;
          
          // 👇 O NOVO ALERTA "CHAMATIVO"
          case 'FALTA_ESTOQUE': 
            return (
                <span className="bg-red-600 text-white px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 animate-pulse">
                    🚫 NÃO TOMOU (SEM ESTOQUE)
                </span>
            );

          default: 
            return <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{acao}</span>;
      }
  }

  if(!paciente) return <div className="p-8">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      
      {/* HEADER */}
      <header className="bg-white p-4 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={24} className="text-gray-600"/>
                </button>
                <div>
                    <h1 className="text-xl font-bold text-gray-800">{paciente.nome}</h1>
                    <p className="text-xs text-gray-500">Prontuário Digital</p>
                </div>
            </div>

            {/* BOTÃO DE HISTÓRICO */}
            <button 
                onClick={handleOpenHistory}
                className="flex flex-col items-center text-hospital-blue hover:bg-blue-50 p-2 rounded-lg transition"
            >
                <History size={20} />
                <span className="text-[10px] font-bold">Histórico</span>
            </button>
        </div>
      </header>

      {/* LISTA DE MEDICAMENTOS */}
      <main className="p-4 max-w-4xl mx-auto space-y-4">
        {medicamentos.length === 0 && (
          <div className="text-center text-gray-400 mt-10 p-8 border-2 border-dashed border-gray-300 rounded-lg">
            <Pill size={48} className="mx-auto mb-2 opacity-50"/>
            <p>Nenhum medicamento cadastrado.</p>
          </div>
        )}

        {medicamentos.map(med => (
          <div key={med.id} className={`p-4 rounded-lg shadow-sm border-l-4 relative group transition-colors ${getCardColor(med)}`}>
            
            <div className="absolute top-2 right-2 flex gap-2">
                <button 
                  onClick={() => handleOpenOptions(med)}
                  className="text-gray-400 hover:text-gray-800 p-1 transition bg-white/50 rounded-full"
                  title="Opções de Estoque e SOS"
                >
                  <Settings size={20} />
                </button>
                <div className="w-px h-4 bg-gray-300 self-center mx-1"></div>
                <button onClick={() => handleEditMed(med)} className="text-gray-300 hover:text-blue-500 p-1">
                  <Pencil size={16} />
                </button>
                <button onClick={() => handleDeleteMed(med.id)} className="text-gray-300 hover:text-red-500 p-1">
                  <Trash2 size={16} />
                </button>
            </div>

            <div className="flex justify-between items-start mb-3 pr-24">
              <h3 className="font-bold text-lg text-gray-800">{med.nome} <span className="text-sm font-normal text-gray-500">{med.gramatura}</span></h3>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-bold whitespace-nowrap">
                {med.caixaAtivaRestante} ativos
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Package size={16}/>
                <span>Estoque: <strong>{med.estoqueCaixas}</strong> cx</span>
              </div>
              <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                <Calendar size={16}/>
                <span className="truncate">{renderFrequenciaText(med)}</span>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <Clock size={16}/>
                <span>{med.horarios.join(' / ')}</span>
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* FAB ADD */}
      <button 
        onClick={handleOpenNew}
        className="fixed bottom-6 right-6 bg-hospital-blue text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition z-20"
      >
        <Plus size={28} />
      </button>

      {/* MODAL DE HISTÓRICO */}
      {showHistoryModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl animate-slide-up flex flex-col max-h-[85vh]">
                
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <History size={20} className="text-hospital-blue"/>
                        Histórico de Movimentações
                    </h3>
                    <button onClick={() => setShowHistoryModal(false)} className="p-2 hover:bg-gray-200 rounded-full">
                        <X size={20} className="text-gray-500"/>
                    </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1 space-y-4 bg-gray-50/50">
                    {loadingHistory ? (
                        <div className="text-center py-10 text-gray-400">Carregando histórico...</div>
                    ) : historyList.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">Nenhuma movimentação registrada.</div>
                    ) : (
                        historyList.map(item => (
                            <div key={item.id} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex flex-col gap-1">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        {renderBadgeAcao(item.acao)}
                                        <span className="text-xs text-gray-400 font-mono">{formatarData(item.data)}</span>
                                    </div>
                                </div>
                                <p className="font-bold text-gray-800">{item.medicamentoNome}</p>
                                <p className="text-sm text-gray-600">{item.detalhe}</p>
                                <div className="mt-2 pt-2 border-t border-gray-50 flex items-center gap-1 text-[10px] text-gray-400">
                                    <User size={10} />
                                    {item.usuario === 'Sistema Automático' ? '🤖 Robô' : item.usuario}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
          </div>
      )}

      {/* MODAL OPÇÕES */}
      {showOptionsModal && selectedMed && (
          <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
            <div className="bg-white w-full max-w-sm rounded-xl p-6 shadow-2xl animate-slide-up">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">{selectedMed.nome}</h3>
                        <p className="text-xs text-gray-500">Painel de Ajuste Rápido</p>
                    </div>
                    <button onClick={() => setShowOptionsModal(false)} className="text-gray-400 hover:text-gray-600">Fechar</button>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={handleAdministrarSOS} className="flex flex-col items-center gap-2 bg-red-50 text-red-600 p-4 rounded-lg hover:bg-red-100 border border-red-100 transition">
                            <Syringe size={24} />
                            <span className="font-bold text-sm">Aplicar SOS</span>
                            <span className="text-[10px] opacity-70">(-1 dose agora)</span>
                        </button>
                        <button onClick={handleDevolverDose} className="flex flex-col items-center gap-2 bg-green-50 text-green-700 p-4 rounded-lg hover:bg-green-100 border border-green-100 transition">
                            <RotateCcw size={24} />
                            <span className="font-bold text-sm">Devolver</span>
                            <span className="text-[10px] opacity-70">(Paciente não tomou)</span>
                        </button>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
                        <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-3">
                            <AlertTriangle size={16} className="text-orange-500"/>
                            Correção de Inventário
                        </h4>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-[10px] uppercase font-bold text-gray-500">Na Cartela</label>
                                <input type="number" className="w-full p-2 border rounded bg-white font-bold text-center"
                                    value={manualCaixaAtiva} onChange={(e) => setManualCaixaAtiva(e.target.value)} />
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] uppercase font-bold text-gray-500">Estoque (cx)</label>
                                <input type="number" className="w-full p-2 border rounded bg-white font-bold text-center"
                                    value={manualEstoque} onChange={(e) => setManualEstoque(e.target.value)} />
                            </div>
                        </div>
                        <button onClick={handleSalvarAjusteManual} className="w-full mt-3 bg-gray-800 text-white py-2 rounded text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-900">
                            <Save size={16} /> Salvar Correção
                        </button>
                    </div>
                </div>
            </div>
          </div>
      )}

      {/* MODAL FORMULÁRIO (ADD/EDIT) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-xl p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">{editingId ? 'Editar Medicamento' : 'Novo Medicamento'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400">Fechar</button>
            </div>
            <form onSubmit={handleSaveMed} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                        <label className="label-form">Nome do Medicamento</label>
                        <input required type="text" className="input-form" value={nomeMed} onChange={e => setNomeMed(e.target.value)} placeholder="Ex: Losartana"/>
                    </div>
                    <div>
                        <label className="label-form">Gramatura</label>
                        <input type="text" className="input-form" value={gramatura} onChange={e => setGramatura(e.target.value)} placeholder="Ex: 50mg"/>
                    </div>
                </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-form">Qtd na Caixa</label>
                  <input required type="number" className="input-form" value={capacidadeCaixa} onChange={e => setCapacidadeCaixa(e.target.value)}/>
                </div>
                <div>
                  <label className="label-form">Caixas Compradas</label>
                  <input required type="number" className="input-form" value={estoqueCaixas} onChange={e => setEstoqueCaixas(e.target.value)}/>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-3">
                <p className="text-sm font-bold text-gray-700 flex items-center gap-2"><Clock size={16}/> Como tomar?</p>
                <div>
                  <label className="label-form">Frequência</label>
                  <select value={frequencia} onChange={e => setFrequencia(e.target.value)} className="input-form bg-white">
                    <option value="diario">Todo dia</option>
                    <option value="intervalo">Intervalo de dias</option>
                    <option value="dias_semana">Dias específicos</option>
                  </select>
                </div>
                {frequencia === 'intervalo' && (
                  <div className="animate-fade-in">
                    <label className="label-form">A cada quantos dias?</label>
                    <div className="flex gap-2">
                        <input type="number" min="2" className="input-form" value={intervalo} onChange={e => setIntervalo(e.target.value)}/>
                        <div className="flex items-center text-sm text-gray-500 whitespace-nowrap">{intervalo == 2 ? '(Dia Sim, Dia Não)' : 'dias'}</div>
                    </div>
                  </div>
                )}
                {frequencia === 'dias_semana' && (
                    <div className="animate-fade-in">
                      <label className="label-form mb-2">Selecione os dias:</label>
                      <div className="flex justify-between gap-1">
                        {['D','S','T','Q','Q','S','S'].map((dia, index) => (
                          <button key={index} type="button" onClick={() => toggleDia(index)} className={`w-8 h-8 rounded-full text-xs font-bold transition-colors ${diasSemana.includes(index) ? 'bg-hospital-blue text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>{dia}</button>
                        ))}
                      </div>
                    </div>
                )}
                <div>
                    <label className="label-form">Início do Tratamento</label>
                    <input type="date" className="input-form" required value={dataInicio} onChange={e => setDataInicio(e.target.value)}/>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label-form">Dose (comps)</label>
                        <input required type="number" className="input-form" value={dose} onChange={e => setDose(e.target.value)}/>
                    </div>
                    {/* 👇 CAMPO DE HORÁRIOS NOVO E MODERNO */}
                    <div>
                        <label className="label-form flex justify-between items-center">
                            Horários
                            <button type="button" onClick={addHorario} className="text-hospital-blue hover:bg-blue-50 rounded-full p-1"><Plus size={14}/></button>
                        </label>
                        <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                            {horarios.map((h, i) => (
                                <div key={i} className="flex gap-1 items-center">
                                    <input 
                                        type="time" 
                                        className="input-form text-center p-1 h-9" 
                                        value={h} 
                                        onChange={e => updateHorario(i, e.target.value)}
                                        required
                                    />
                                    {horarios.length > 1 && (
                                        <button type="button" onClick={() => removeHorario(i)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
              </div>
              <button type="submit" className="btn-primary w-full">{editingId ? 'Salvar Alterações' : 'Cadastrar Medicamento'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}