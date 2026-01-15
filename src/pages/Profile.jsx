import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { db, storage, auth } from '../services/firebaseConnection'; 
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore'; 
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'; 
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from 'firebase/auth'; 
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
// 👇 Importando o EmailJS
import emailjs from '@emailjs/browser';
import { 
  ArrowLeft, CreditCard, LogOut, Calendar, Download, Share, Edit2, 
  Check, Camera, Loader2, Lock, KeyRound, Trash2, ChevronRight, Smartphone, Copy, QrCode, MapPin, Phone, Headset, FileText, Shield, Send, Mail
} from 'lucide-react';

export default function Profile() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  
  const [installPrompt, setInstallPrompt] = useState(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [cpf, setCpf] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  
  const [imageAvatar, setImageAvatar] = useState(null);
  const [loadingImage, setLoadingImage] = useState(false);

  // Estados Senha
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingPassword, setLoadingPassword] = useState(false);
  
  const [hasPassword, setHasPassword] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  // Estados Pagamento
  const [paymentMethod, setPaymentMethod] = useState("PIX"); 
  const [pixImage, setPixImage] = useState(null);
  const [pixCopiaCola, setPixCopiaCola] = useState("");
  
  // Estados do Cartão + Endereço
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCcv, setCardCcv] = useState("");
  const [cardPostalCode, setCardPostalCode] = useState("");
  const [cardAddressNumber, setCardAddressNumber] = useState("");
  const [cardPhone, setCardPhone] = useState("");

  // Estados Suporte
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [sendingSupport, setSendingSupport] = useState(false);

  const API_URL = "https://us-central1-beamedcontrol.cloudfunctions.net/criarPagamento"; 

  // 1. Verifica provedores e senha
  useEffect(() => {
    function checkProviders() {
        const userReal = auth.currentUser;
        if (userReal) {
            const temSenha = userReal.providerData.some(p => p.providerId === 'password');
            setHasPassword(temSenha);
        }
    }
    checkProviders();
    if(user) checkProviders();
  }, [user]);

  // 2. Carrega Usuário
  useEffect(() => {
    async function loadUser() {
      if(!user?.uid) return;
      const docRef = doc(db, "users", user.uid);
      const snapshot = await getDoc(docRef);
      if(snapshot.exists()) {
        const data = snapshot.data();
        setUserData(data);
        setTempName(data.nome || user.displayName || "");
        if(data.fotoUrl) {
            setImageAvatar(data.fotoUrl);
        }
      }
    }
    loadUser();

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    });
  }, [user]);

  // Lógica de Exclusão
  async function handleDeleteAccount() {
    const confirm = window.confirm("TEM CERTEZA? Essa ação é irreversível.");
    if(!confirm) return;
    setLoadingDelete(true);
    try {
        const q = query(collection(db, "pacientes"), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        snapshot.forEach(async (docPac) => { await deleteDoc(docPac.ref); });
        await deleteDoc(doc(db, "users", user.uid));
        if(userData?.fotoUrl) {
            try { await deleteObject(ref(storage, `users/${user.uid}/profile_photo`)); } catch (err) {}
        }
        const userReal = auth.currentUser;
        if(userReal) await deleteUser(userReal);
        alert("Sua conta foi excluída com sucesso.");
        navigate('/');
    } catch (error) {
        alert("Erro ao excluir: " + error.message);
    } finally { setLoadingDelete(false); }
  }

  // Lógica de Senha
  async function handlePasswordUpdate(e) {
    e.preventDefault();
    if(newPassword.length < 6) { alert("Mínimo 6 caracteres."); return; }
    if(newPassword !== confirmPassword) { alert("Senhas não batem."); return; }
    setLoadingPassword(true);
    try {
        const userReal = auth.currentUser;
        if(hasPassword) {
             const credential = EmailAuthProvider.credential(userReal.email, currentPassword);
             await reauthenticateWithCredential(userReal, credential);
        }
        await updatePassword(userReal, newPassword);
        setHasPassword(true);
        alert("Senha atualizada!");
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (error) { alert("Erro ao atualizar senha."); } 
    finally { setLoadingPassword(false); }
  }

  // Upload de Foto
  async function handleFile(e) {
    if(e.target.files[0]) {
        const image = e.target.files[0];
        if(image.type === 'image/jpeg' || image.type === 'image/png') {
            setLoadingImage(true);
            const uploadRef = ref(storage, `users/${user.uid}/profile_photo`);
            try {
                await uploadBytes(uploadRef, image);
                const url = await getDownloadURL(uploadRef);
                await updateDoc(doc(db, "users", user.uid), { fotoUrl: url });
                setImageAvatar(url);
            } catch (error) { alert("Erro ao enviar foto."); } finally { setLoadingImage(false); }
        }
    }
  }

  async function handleSaveName() {
    if(!tempName.trim()) return;
    try {
        await updateDoc(doc(db, "users", user.uid), { nome: tempName });
        setUserData({ ...userData, nome: tempName });
        setIsEditingName(false);
    } catch (error) { alert("Erro ao salvar nome."); }
  }

  function getInitials(name) {
    if(!name) return "US"; 
    const names = name.split(' ');
    if(names.length >= 2) { return (names[0][0] + names[1][0]).toUpperCase(); }
    return name.substring(0, 2).toUpperCase();
  }

  async function handleInstallApp() {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') { setInstallPrompt(null); }
  }

  function calcularVencimento() {
    if (!userData?.ultimoPagamento) return null;
    const dataPagamento = userData.ultimoPagamento.toDate();
    const dataVencimento = new Date(dataPagamento);
    dataVencimento.setMonth(dataVencimento.getMonth() + 1);
    if (dataVencimento.getDate() !== dataPagamento.getDate()) { dataVencimento.setDate(0); }
    return dataVencimento.toLocaleDateString('pt-BR');
  }

  // --- MÁSCARAS DE INPUT ---
  function mascaraCartao(valor) {
    return valor.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim();
  }
  function mascaraValidade(valor) {
    return valor.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').substring(0, 5); // MM/AA
  }
  function mascaraCep(valor) {
    return valor.replace(/\D/g, '').substring(0, 8); 
  }
  function mascaraTelefone(valor) {
    return valor.replace(/\D/g, '').substring(0, 11); 
  }

  // 👇 LÓGICA DE ASSINATURA (PIX + CARTÃO COM ENDEREÇO)
  async function handleAssinar() {
    if(cpf.length < 11) { alert("CPF inválido."); return; }

    if (paymentMethod === 'CREDIT_CARD') {
        if (!cardNumber || !cardHolder || !cardExpiry || !cardCcv || !cardPostalCode || !cardAddressNumber || !cardPhone) {
            alert("Preencha todos os dados do cartão e endereço.");
            return;
        }
        if (cardPostalCode.length < 8) {
            alert("CEP inválido.");
            return;
        }
    }

    setLoadingPayment(true);
    setPixImage(null);
    
    try {
        const token = await auth.currentUser.getIdToken();
        
        let cardDataPayload = null;
        if (paymentMethod === 'CREDIT_CARD') {
            const [mes, ano] = cardExpiry.split('/');
            const fullYear = ano.length === 2 ? `20${ano}` : ano;
            
            cardDataPayload = {
                holderName: cardHolder,
                number: cardNumber.replace(/\s/g, ''),
                expiryMonth: mes,
                expiryYear: fullYear,
                ccv: cardCcv,
                postalCode: cardPostalCode,
                addressNumber: cardAddressNumber,
                phone: cardPhone
            };
        }

        const response = await axios.post(API_URL, {
            email: user.email, 
            nome: userData?.nome || "Cliente", 
            cpfCnpj: cpf,
            billingType: paymentMethod, 
            cardData: cardDataPayload
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
             if (paymentMethod === 'PIX') {
                 setPixImage(response.data.imagem);
                 setPixCopiaCola(response.data.payload);
             } else {
                 alert("Pagamento Processado com Sucesso!");
                 window.location.reload(); 
             }
        }

    } catch (error) { 
        console.error(error);
        alert("Erro no pagamento: " + (error.response?.data?.error || "Verifique os dados e tente novamente.")); 
    } finally { 
        setLoadingPayment(false); 
    }
  }

  function copyToClipboard() {
      navigator.clipboard.writeText(pixCopiaCola);
      alert("Código Pix copiado!");
  }

  function renderStatus(status) {
    if(status === 'ativo') return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Ativo</span>;
    if(status === 'vitalicio') return <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold uppercase">💎 Vitalício</span>;
    if(status === 'trial') return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Período de Teste</span>;
    return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Bloqueado</span>;
  }

  function handleLogout() { logout(); navigate('/'); }

  const displayName = userData?.nome || user?.displayName || 'Usuário';
  const currentPhoto = imageAvatar || user?.photoURL || user?.providerData?.[0]?.photoURL;

  function changeTab(method) {
      setPaymentMethod(method);
      setPixImage(null); 
      setPixCopiaCola("");
  }

  // 👇 LÓGICA DE ENVIAR SUPORTE VIA EMAILJS
  async function handleSendSupport() {
      if(!supportMessage.trim()) return;
      setSendingSupport(true);

      const templateParams = {
          from_name: displayName,
          from_email: user.email,
          message: supportMessage
      };

      try {
          // 1. Envia via EmailJS (Substitua pelos seus IDs)
          await emailjs.send(
                import.meta.env.VITE_EMAILJS_SERVICE_ID,
                import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
                templateParams,
                import.meta.env.VITE_EMAILJS_PUBLIC_KEY
          );

          // 2. Opcional: Salva no Banco como histórico
          await addDoc(collection(db, "fale_conosco"), {
              uid: user.uid,
              nome: displayName,
              email: user.email,
              mensagem: supportMessage,
              data: new Date(),
              origem: "EmailJS"
          });

          alert("Mensagem enviada! Verifique seu e-mail em breve.");
          setSupportMessage("");
          setShowSupportModal(false);

      } catch (error) {
          console.log("Erro EmailJS", error);
          alert("Erro ao enviar mensagem. Tente o e-mail direto abaixo.");
      } finally {
          setSendingSupport(false);
      }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      
      <header className="bg-white p-4 shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={24} className="text-gray-600"/>
          </button>
          <h1 className="text-xl font-bold text-gray-800">Perfil</h1>
        </div>
      </header>

      <main className="p-4 max-w-md mx-auto space-y-6 pb-20">
        
        {/* CARTÃO DE PERFIL */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center">
            <div className="relative group cursor-pointer mb-4">
                <input type="file" accept="image/*" onChange={handleFile} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                <div className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden border-4 border-gray-50 bg-hospital-blue text-white shadow-sm relative">
                    {loadingImage ? <Loader2 className="animate-spin" size={32} /> : currentPhoto ? <img src={currentPhoto} alt="Foto" referrerPolicy="no-referrer" className="w-full h-full object-cover" /> : <span className="text-3xl font-bold">{getInitials(displayName)}</span>}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"><Camera size={24} className="text-white" /></div>
                </div>
            </div>
            
            <div className="flex items-center gap-2 mb-1 justify-center w-full">
                {isEditingName ? (
                    <div className="flex items-center gap-2">
                        <input value={tempName} onChange={(e) => setTempName(e.target.value)} className="border-b-2 border-hospital-blue outline-none text-center font-bold text-gray-800 w-40" autoFocus />
                        <button onClick={handleSaveName} className="p-1 bg-green-100 text-green-700 rounded-full"><Check size={16}/></button>
                    </div>
                ) : (
                    <>
                        <h2 className="text-xl font-bold text-gray-800 text-center">{displayName}</h2>
                        <button onClick={() => setIsEditingName(true)} className="text-gray-400 hover:text-hospital-blue"><Edit2 size={16} /></button>
                    </>
                )}
            </div>
            
            <p className="text-sm text-gray-500 mb-3">{user?.email}</p>
            
            <div className="flex flex-col items-center gap-2">
                {renderStatus(userData?.status)}
                {userData?.status === 'ativo' && userData?.ultimoPagamento && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100"><Calendar size={12} /><span>Válido até {calcularVencimento()}</span></div>
                )}
            </div>
        </div>

        {/* LISTA DE OPÇÕES */}
        <div className="space-y-3">
             <button onClick={() => navigate('/instalar')} className="w-full bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition group">
                 <div className="flex items-center gap-3">
                     <div className="bg-gray-100 text-gray-600 p-2 rounded-lg"><Smartphone size={20} /></div>
                     <span className="font-bold text-gray-700">Manual de Instalação</span>
                 </div>
                 <ChevronRight size={18} className="text-gray-400"/>
             </button>

             <button onClick={() => setShowSupportModal(true)} className="w-full bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition group">
                 <div className="flex items-center gap-3">
                     <div className="bg-blue-50 text-hospital-blue p-2 rounded-lg"><Headset size={20} /></div>
                     <span className="font-bold text-gray-700">Atendimento ao Cliente</span>
                 </div>
                 <ChevronRight size={18} className="text-gray-400"/>
             </button>

             <button onClick={() => navigate('/legal/termos')} className="w-full bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition group">
                 <div className="flex items-center gap-3">
                     <div className="bg-gray-100 text-gray-600 p-2 rounded-lg"><FileText size={20} /></div>
                     <span className="font-bold text-gray-700">Termos de Uso</span>
                 </div>
                 <ChevronRight size={18} className="text-gray-400"/>
             </button>

             <button onClick={() => navigate('/legal/privacidade')} className="w-full bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition group">
                 <div className="flex items-center gap-3">
                     <div className="bg-gray-100 text-gray-600 p-2 rounded-lg"><Shield size={20} /></div>
                     <span className="font-bold text-gray-700">Política de Privacidade (LGPD)</span>
                 </div>
                 <ChevronRight size={18} className="text-gray-400"/>
             </button>
        </div>

        {/* SEÇÃO ASSINATURA */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                <CreditCard className="text-hospital-blue" size={20}/>
                <h3 className="font-bold text-gray-700">Detalhes do Plano</h3>
            </div>
            <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-600">Valor</span>
                    <span className="font-bold text-gray-800">R$ 19,90 / mês</span>
                </div>
                
                {userData?.status !== 'ativo' && userData?.status !== 'vitalicio' ? (
                    <>
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">CPF do Pagador</label>
                            <input type="text" placeholder="Somente números" value={cpf} onChange={(e) => setCpf(e.target.value.replace(/\D/g, ''))} className="w-full p-3 border border-gray-300 rounded focus:border-hospital-blue outline-none" maxLength={11} />
                        </div>

                        <div className="flex gap-2 mb-4">
                            <button onClick={() => changeTab('PIX')} className={`flex-1 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition ${paymentMethod === 'PIX' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}><QrCode size={18} /> Pix</button>
                            <button onClick={() => changeTab('CREDIT_CARD')} className={`flex-1 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition ${paymentMethod === 'CREDIT_CARD' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}><CreditCard size={18} /> Cartão</button>
                        </div>

                        {paymentMethod === 'CREDIT_CARD' && (
                            <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-100 animate-fade-in space-y-3">
                                <h4 className="text-xs font-bold text-gray-700 border-b border-gray-200 pb-2">Dados do Cartão</h4>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Número do Cartão</label>
                                    <input placeholder="0000 0000 0000 0000" className="w-full p-2 border rounded outline-none focus:border-blue-500" value={cardNumber} onChange={(e) => setCardNumber(mascaraCartao(e.target.value))} maxLength={19} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Nome no Cartão</label>
                                    <input placeholder="COMO ESTÁ NO CARTÃO" className="w-full p-2 border rounded outline-none focus:border-blue-500 uppercase" value={cardHolder} onChange={(e) => setCardHolder(e.target.value.toUpperCase())} />
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Validade</label>
                                        <input placeholder="MM/AA" className="w-full p-2 border rounded outline-none focus:border-blue-500" value={cardExpiry} onChange={(e) => setCardExpiry(mascaraValidade(e.target.value))} maxLength={5} />
                                    </div>
                                    <div className="w-20">
                                        <label className="text-xs font-bold text-gray-500 uppercase">CVV</label>
                                        <input placeholder="123" className="w-full p-2 border rounded outline-none focus:border-blue-500" value={cardCcv} onChange={(e) => setCardCcv(e.target.value.replace(/\D/g, '').substring(0, 4))} />
                                    </div>
                                </div>

                                <h4 className="text-xs font-bold text-gray-700 border-b border-gray-200 pb-2 mt-4 pt-2">Dados de Cobrança</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">CEP (Apenas nº)</label>
                                        <div className="relative">
                                            <MapPin size={14} className="absolute left-2 top-3 text-gray-400"/>
                                            <input placeholder="00000000" className="w-full pl-7 p-2 border rounded outline-none focus:border-blue-500" value={cardPostalCode} onChange={(e) => setCardPostalCode(mascaraCep(e.target.value))} maxLength={8} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Número</label>
                                        <input placeholder="100" className="w-full p-2 border rounded outline-none focus:border-blue-500" value={cardAddressNumber} onChange={(e) => setCardAddressNumber(e.target.value)} />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Celular</label>
                                    <div className="relative">
                                        <Phone size={14} className="absolute left-2 top-3 text-gray-400"/>
                                        <input placeholder="(11) 99999-9999" className="w-full pl-7 p-2 border rounded outline-none focus:border-blue-500" value={cardPhone} onChange={(e) => setCardPhone(mascaraTelefone(e.target.value))} maxLength={11} />
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {(!pixImage || paymentMethod === 'CREDIT_CARD') && (
                            <button onClick={handleAssinar} disabled={loadingPayment || cpf.length < 11} className={`w-full py-3 rounded text-sm font-bold flex justify-center items-center transition shadow-md ${loadingPayment || cpf.length < 11 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : paymentMethod === 'PIX' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white' }`}>
                                {loadingPayment ? <><Loader2 className="animate-spin mr-2" size={16}/> Processando...</> : `Assinar com ${paymentMethod === 'PIX' ? 'Pix' : 'Cartão'}`}
                            </button>
                        )}

                        {pixImage && paymentMethod === 'PIX' && (
                            <div className="mt-4 flex flex-col items-center p-4 bg-gray-50 rounded border-2 border-green-100 animate-fade-in">
                                <p className="font-bold text-gray-700 mb-2">Escaneie para pagar:</p>
                                <div className="bg-white p-2 rounded shadow-sm">
                                    <img src={`data:image/png;base64,${pixImage}`} alt="QR Code Pix" className="w-48 h-48" />
                                </div>
                                <div className="w-full mt-4">
                                    <div className="flex justify-between items-center mb-1"><p className="text-xs text-gray-500">Ou copie o código:</p><button onClick={copyToClipboard} className="text-xs text-hospital-blue font-bold flex items-center gap-1"><Copy size={12}/> Copiar</button></div>
                                    <textarea readOnly value={pixCopiaCola} className="w-full text-xs p-2 border rounded bg-white h-20 outline-none text-gray-600 font-mono" />
                                </div>
                                <p className="text-xs text-center text-gray-400 mt-2">Após pagar, seu acesso é liberado em instantes.</p>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="bg-green-50 text-green-700 p-3 rounded text-center text-sm font-medium border border-green-100">✨ Sua assinatura está em dia!</div>
                )}
            </div>
        </div>

        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 p-4 rounded-lg font-bold hover:bg-red-100 transition"><LogOut size={20} /> Sair do Sistema</button>
        <button onClick={handleDeleteAccount} className="w-full flex items-center justify-center gap-2 text-xs text-gray-400 p-4 hover:text-red-500 transition mt-4"><Trash2 size={14} />{loadingDelete ? 'Excluindo...' : 'Excluir minha conta definitivamente'}</button>
      </main>

      {/* 👇 MODAL DE SUPORTE (COM LINK DIRETO) */}
      {showSupportModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
              <div className="bg-white w-full max-w-sm rounded-xl p-6 shadow-2xl animate-slide-up">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Headset size={20}/> Fale Conosco</h3>
                      <button onClick={() => setShowSupportModal(false)} className="text-gray-400 hover:text-gray-600">Fechar</button>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">Dúvidas, problemas ou sugestões? Escreva abaixo.</p>
                  
                  <textarea 
                      className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-hospital-blue mb-4 h-32 resize-none"
                      placeholder="Digite sua mensagem aqui..."
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                  />
                  
                  <button 
                      onClick={handleSendSupport}
                      disabled={sendingSupport || !supportMessage.trim()}
                      className={`w-full py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition ${sendingSupport || !supportMessage.trim() ? 'bg-blue-300 cursor-not-allowed' : 'bg-hospital-blue hover:bg-blue-700'}`}
                  >
                      {sendingSupport ? <Loader2 className="animate-spin" size={18}/> : <><Send size={18}/> Enviar Mensagem</>}
                  </button>

                  {/* 👇 LINK DIRETO PARA O E-MAIL (NOVO) */}
                  <div className="mt-4 text-center border-t border-gray-100 pt-3">
                      <p className="text-xs text-gray-400 mb-1">Prefere mandar um e-mail direto?</p>
                      <a href="mailto:beamedcontrol@gmail.com" className="text-sm font-bold text-hospital-blue hover:underline flex items-center justify-center gap-1">
                          <Mail size={14}/>
                          beamedcontrol@gmail.com
                      </a>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}