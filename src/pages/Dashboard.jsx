// src/pages/Dashboard.jsx
import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { db } from '../services/firebaseConnection';
// 👇 Adicionei deleteDoc nas importações
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, where, getDoc, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
// 👇 Adicionei Trash2 (Lixeira) nos ícones
import { LogOut, Plus, User, Activity, Pencil, ClipboardList, DoorOpen, Trash2 } from 'lucide-react';

export default function Dashboard() {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [pacientes, setPacientes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  
  // Estados do formulário
  const [editingId, setEditingId] = useState(null);
  const [nome, setNome] = useState('');
  const [status, setStatus] = useState('ok'); 
  const [obs, setObs] = useState('');
  const [quarto, setQuarto] = useState('');

  // 1. Carregar PERFIL
  useEffect(() => {
    async function loadProfile() {
      if(!user?.uid) return;
      const docRef = doc(db, "users", user.uid);
      const snapshot = await getDoc(docRef);
      if(snapshot.exists()) {
        setUserProfile(snapshot.data());
      }
    }
    loadProfile();
  }, [user?.uid]);

  // 2. Carregar pacientes
  useEffect(() => {
    if(!user?.uid) return; 

    const q = query(
        collection(db, "pacientes"), 
        where("userId", "==", user.uid),
        orderBy("nome")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      let lista = [];
      snapshot.forEach((doc) => {
        lista.push({
          id: doc.id,
          ...doc.data()
        })
      });
      setPacientes(lista);
    });

    return () => unsub();
  }, [user?.uid]);

  function handleOpenNew() {
    setEditingId(null);
    setNome('');
    setStatus('ok');
    setObs('');
    setQuarto('');
    setShowModal(true);
  }

  function handleEditPatient(e, paciente) {
    e.stopPropagation(); 
    setEditingId(paciente.id);
    setNome(paciente.nome);
    setStatus(paciente.status);
    setObs(paciente.obs || '');
    setQuarto(paciente.quarto || '');
    setShowModal(true);
  }

  // 👇 NOVA FUNÇÃO: DELETAR PACIENTE
  async function handleDeletePatient(e, id, nomePaciente) {
    e.stopPropagation(); // Impede que abra o detalhe do paciente ao clicar na lixeira
    
    const confirmacao = window.confirm(`Tem certeza que deseja excluir o paciente ${nomePaciente}?`);
    
    if(confirmacao) {
        try {
            await deleteDoc(doc(db, "pacientes", id));
            // Opcional: Se quiser apagar os medicamentos dele também, precisaria de uma Cloud Function ou fazer aqui.
            // Por enquanto, apaga só o paciente da lista.
        } catch (error) {
            alert("Erro ao excluir paciente.");
            console.log(error);
        }
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    if(nome === '') return;

    try {
      if (editingId) {
        const docRef = doc(db, "pacientes", editingId);
        await updateDoc(docRef, {
            nome: nome,
            status: status,
            obs: obs,
            quarto: quarto
        });
      } else {
        await addDoc(collection(db, "pacientes"), {
            nome: nome,
            status: status,
            obs: obs,
            quarto: quarto,
            userId: user.uid, 
            criadoEm: new Date()
        });
      }
      setShowModal(false);
    } catch (error) {
      console.log(error);
      alert("Erro ao salvar paciente");
    }
  }

  function getStatusColor(st) {
    if(st === 'critico') return 'border-l-4 border-alert-red bg-red-50';
    if(st === 'atencao') return 'border-l-4 border-warning-yellow bg-yellow-50';
    return 'border-l-4 border-safe-green bg-white';
  }

  const displayName = userProfile?.nome || user?.displayName || user?.email?.split('@')[0];
  const displayPhoto = userProfile?.fotoUrl || user?.photoURL;

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      
      {/* CABEÇALHO */}
      <header className="bg-hospital-blue text-white p-4 shadow-md sticky top-0 z-10">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Activity size={20} />
              BeaMedControl
            </h1>
            <p className="text-sm font-medium opacity-90">Olá, {displayName}</p>
          </div>
          
          <button 
            onClick={() => navigate('/perfil')} 
            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full transition flex items-center justify-center overflow-hidden border border-white/30"
          >
              {displayPhoto ? (
                  <img src={displayPhoto} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                  <User size={20} />
              )}
          </button>
        </div>
      </header>

      {/* LISTA DE PACIENTES */}
      <main className="p-4 max-w-4xl mx-auto space-y-4">
        {pacientes.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            <p>Nenhum paciente cadastrado.</p>
            <p className="text-sm">Toque no + para adicionar.</p>
          </div>
        )}

        {pacientes.map((item) => (
          <article 
            key={item.id} 
            onClick={() => navigate(`/paciente/${item.id}`)}
            className={`p-4 rounded-lg shadow-sm flex justify-between items-start transition-all hover:shadow-md cursor-pointer relative group ${getStatusColor(item.status)}`}
          >
            {/* Visual do Quarto - Empurrei mais pra esquerda (right-24) pra caber os botões */}
            {item.quarto && (
                <div className="absolute top-3 right-24 bg-blue-100 text-hospital-blue text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                    <DoorOpen size={12} />
                    {item.quarto}
                </div>
            )}

            {/* GRUPO DE BOTÕES (EDITAR E EXCLUIR) */}
            <div className="absolute top-2 right-2 flex gap-1 z-10">
                {/* Botão Editar */}
                <button 
                    onClick={(e) => handleEditPatient(e, item)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
                    title="Editar"
                >
                    <Pencil size={18} />
                </button>

                {/* 👇 Botão Excluir (Novo) */}
                <button 
                    onClick={(e) => handleDeletePatient(e, item.id, item.nome)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                    title="Excluir"
                >
                    <Trash2 size={18} />
                </button>
            </div>

            <div>
              <h2 className="font-bold text-gray-800 flex items-center gap-2 pr-24">
                <User size={18} className="text-gray-400"/>
                {item.nome}
              </h2>
              {item.obs && (
                <p className="text-sm text-gray-600 mt-1 max-w-[80%] line-clamp-2">{item.obs}</p>
              )}
            </div>
            
            <div className="text-xs font-bold uppercase tracking-wide mt-8 sm:mt-0">
                {item.status === 'ok' && <span className="text-safe-green">Estável</span>}
                {item.status === 'atencao' && <span className="text-warning-yellow">Atenção</span>}
                {item.status === 'critico' && <span className="text-alert-red">Crítico</span>}
            </div>
          </article>
        ))}
      </main>

      {/* BOTÕES FLUTUANTES */}
      <div className="fixed bottom-6 right-6 flex items-center gap-3 z-20">
        <button 
          onClick={() => navigate('/checklist')}
          className="bg-white text-hospital-blue border border-blue-100 font-bold py-3 px-5 rounded-full shadow-lg hover:bg-blue-50 transition-transform hover:scale-105 flex items-center gap-2"
        >
          <ClipboardList size={20} />
          Checklist
        </button>

        <button 
          onClick={handleOpenNew}
          className="bg-hospital-blue text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-transform hover:scale-105 active:scale-95"
        >
          <Plus size={28} />
        </button>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                {editingId ? 'Editar Paciente' : 'Novo Paciente'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">Fechar</button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                    <input 
                      type="text"
                      placeholder="Ex: Dona Maria"
                      className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-hospital-blue"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      required
                    />
                  </div>
                  <div className="w-1/3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nº Quarto</label>
                    <input 
                      type="text"
                      placeholder="104"
                      className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-hospital-blue text-center"
                      value={quarto}
                      onChange={(e) => setQuarto(e.target.value)}
                    />
                  </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status Geral</label>
                <select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border rounded-lg p-3 outline-none bg-white"
                >
                  <option value="ok">Verde - Estável (OK)</option>
                  <option value="atencao">Amarelo - Atenção</option>
                  <option value="critico">Vermelho - Crítico</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observação</label>
                <textarea 
                  placeholder="Ex: Diabética, acamada..."
                  className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-hospital-blue"
                  rows={3}
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-hospital-blue text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition"
              >
                {editingId ? 'Salvar Alterações' : 'Cadastrar Paciente'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}