import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, ShieldCheck, Clock, CheckCircle, ArrowRight, Star, HeartPulse, Smartphone } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      
      {/* --- NAVBAR --- */}
      <nav className="flex justify-between items-center p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <HeartPulse size={24} className="text-white" />
          </div>
          <span className="text-xl font-bold text-gray-800 tracking-tight">BeamedControl</span>
        </div>
        <div className="flex gap-4">
            <button 
                onClick={() => navigate('/login')}
                className="text-gray-600 font-medium hover:text-blue-600 transition"
            >
                Já tenho conta
            </button>
            <button 
                onClick={() => navigate('/login')} // Manda pro cadastro
                className="hidden sm:block bg-blue-600 text-white px-5 py-2 rounded-full font-bold hover:bg-blue-700 transition shadow-lg hover:shadow-blue-200"
            >
                Acessar Sistema
            </button>
        </div>
      </nav>

      {/* --- HERO SECTION (A Promessa) --- */}
      <header className="max-w-6xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 animate-slide-up">
            <div className="inline-block bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold mb-2">
                🚀 O App nº 1 para Enfermeiros e Cuidadores
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-gray-900">
                Seu Plantão no <span className="text-blue-600">Piloto Automático.</span>
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
                Pare de anotar medicações na luva. Deixe que nosso <strong>Robô 24h</strong> monitore os horários, controle o estoque e garanta a segurança dos seus pacientes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button 
                    onClick={() => navigate('/login')} 
                    className="bg-blue-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-700 transition shadow-xl hover:scale-105 transform duration-200 flex items-center justify-center gap-2"
                >
                    Começar Agora <ArrowRight size={20}/>
                </button>
                <button className="px-8 py-4 rounded-full font-bold text-gray-600 hover:bg-gray-100 transition border border-gray-200">
                    Ver como funciona
                </button>
            </div>
            <p className="text-sm text-gray-400 flex items-center gap-2">
                <CheckCircle size={14} className="text-green-500"/> Cancelamento grátis a qualquer momento.
            </p>
        </div>

        {/* Imagem Ilustrativa / Mockup */}
        <div className="relative animate-fade-in">
            <div className="absolute top-0 right-0 bg-blue-100 w-72 h-72 rounded-full filter blur-3xl opacity-50 -z-10"></div>
            <div className="bg-white border-4 border-gray-100 rounded-3xl shadow-2xl overflow-hidden transform rotate-2 hover:rotate-0 transition duration-500">
                {/* Simulando a interface do app */}
                <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
                    <span className="font-bold">Paciente: Dona Maria</span>
                    <Bot size={20} />
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex gap-4 items-center bg-green-50 p-3 rounded-lg border-l-4 border-green-500">
                        <CheckCircle className="text-green-600" />
                        <div>
                            <p className="font-bold text-gray-800">Losartana 50mg</p>
                            <p className="text-xs text-green-700">Administrado às 08:00 (Pelo Robô)</p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-center bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-500">
                        <Clock className="text-yellow-600" />
                        <div>
                            <p className="font-bold text-gray-800">Dipirona SOS</p>
                            <p className="text-xs text-yellow-700">Próxima dose disponível em 2h</p>
                        </div>
                    </div>
                     <div className="flex gap-4 items-center bg-gray-50 p-3 rounded-lg opacity-50">
                        <ShieldCheck className="text-gray-400" />
                        <div>
                            <p className="font-bold text-gray-800">Estoque Seguro</p>
                            <p className="text-xs text-gray-500">3 caixas restantes</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </header>

      {/* --- DIFERENCIAIS (Por que nós?) --- */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Por que arriscar se você pode controlar?</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    O BeamedControl não é apenas uma agenda. É um sistema de inteligência para Home Care e ILPIs.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Card 1 */}
                <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition duration-300 border border-gray-100">
                    <div className="bg-blue-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                        <Bot size={32} className="text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-gray-800">Robô Farmacêutico</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                        Nosso algoritmo verifica os horários a cada 60 minutos e desconta as doses automaticamente. Você nunca mais vai esquecer de dar baixa.
                    </p>
                </div>

                {/* Card 2 */}
                <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition duration-300 border border-gray-100">
                    <div className="bg-green-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                        <ShieldCheck size={32} className="text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-gray-800">Estoque Infalível</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                        Controle de caixas ativas e fechadas. O sistema avisa quando o remédio está acabando e sugere a compra antes da falha.
                    </p>
                </div>

                {/* Card 3 */}
                <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition duration-300 border border-gray-100">
                    <div className="bg-purple-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                        <Smartphone size={32} className="text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-gray-800">Acesso em Qualquer Lugar</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                        Funciona no celular, tablet ou computador. Seu prontuário digital está sempre no bolso, com dados sincronizados em tempo real.
                    </p>
                </div>
            </div>
        </div>
      </section>

      {/* --- PREÇO (CTA Final) --- */}
      <section className="bg-blue-900 py-20 px-6 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Pronto para profissionalizar seu cuidado?</h2>
        <p className="text-blue-200 mb-10 max-w-xl mx-auto">
            Junte-se a enfermeiros que já estão economizando tempo e garantindo segurança.
        </p>
        
        <div className="bg-white text-gray-900 max-w-sm mx-auto rounded-3xl p-8 shadow-2xl transform hover:scale-105 transition duration-300">
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Oferta de Lançamento</span>
            <div className="mt-6 mb-2">
                <span className="text-5xl font-extrabold">R$ 19,90</span>
                <span className="text-gray-500">/mês</span>
            </div>
            <p className="text-gray-500 text-sm mb-8">Acesso total ao Robô e Gestão de Estoque</p>
            
            <ul className="text-left space-y-3 mb-8 text-sm">
                <li className="flex gap-2"><CheckCircle size={16} className="text-green-500"/> Pacientes Ilimitados</li>
                <li className="flex gap-2"><CheckCircle size={16} className="text-green-500"/> Robô de Consumo 24h</li>
                <li className="flex gap-2"><CheckCircle size={16} className="text-green-500"/> Suporte Prioritário</li>
            </ul>

            <button 
                onClick={() => navigate('/login')}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg"
            >
                Quero Assinar Agora
            </button>
            <p className="text-xs text-gray-400 mt-4">Pagamento seguro via Pix ou Cartão</p>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-gray-50 py-10 text-center text-gray-400 text-sm">
        <p>&copy; 2026 BeamedControl. Todos os direitos reservados.</p>
        <div className="flex justify-center gap-4 mt-4 flex-wrap">
            {/* 👇 NOVO LINK AQUI 👇 */}
            <button onClick={() => navigate('/instalar')} className="hover:text-gray-600">
                Como Instalar o App
            </button>
            
            <span>|</span>
            
            <button onClick={() => navigate('/legal/termos')} className="hover:text-gray-600">Termos de Uso</button>

            <span>|</span>

            <button onClick={() => navigate('/legal/privacidade')} className="hover:text-gray-600">Privacidade</button>
        </div>
      </footer>
    </div>
  );
}