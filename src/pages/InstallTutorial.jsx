import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Smartphone, Apple } from 'lucide-react';

export default function InstallTutorial() {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState('android');
  const [step, setStep] = useState(0);

  // DADOS DO TUTORIAL
  const tutorials = {
    android: [
        {
        title: "1. Manual de Instalação do BeaMedControl",
        desc: "Este manual irá te ajudar a instalar nosso aplicativo no seu aparelho Android",
        img: "/9.png" // 👈 Coloque o nome da sua foto aqui
      },
      {
        title: "2. Abra o Menu",
        desc: "No navegador Chrome, clique nos 3 pontinhos no canto superior direito.",
        img: "/10.png" // 👈 Coloque o nome da sua foto aqui
      },
      {
        title: "3. Adicionar à tela inicial",
        desc: "Procure pela opção Adicionar à tela inicial e clique nela.",
        img: "/11.png"
      },
      {
        title: "4. Escolha a opção instalar",
        desc: "Vai aparecer 2 opções, escolha a opção INSTALAR. ",
        img: "/12.png"
      },
      {
        title: "5. Confirme a instalação",
        desc: "Confirme se é o nosso ícone que aparece e clique em INSTALAR.  ",
        img: "/13.png"
      },
      {
        title: "6. Acesse nosso aplicativo",
        desc: "Aguarde em média 1 minuto e confira se nosso ícone já está na sua tela inicial. Se já estiver, pode clicar nele e usar o aplicativo. ",
        img: "/14.png"
      }
    ],
    ios: [
      {
        title: "1. Manual de Instalação do BeaMedControl",
        desc: "Este manual irá te ajudar a instalar nosso aplicativo no seu aparelho Iphone",
        img: "/9.png"
      }
    ]
  };

  const currentSteps = tutorials[platform];

  function nextStep() {
    if (step < currentSteps.length - 1) {
        setStep(step + 1);
    } else {
        // Se estiver no último passo, vai para o login
        navigate('/login');
    }
  }

  function prevStep() {
    if (step > 0) setStep(step - 1);
  }

  // 👇 CORREÇÃO: Lógica à prova de falhas
  function handleStoryClick(e) {
    // 1. Pega as coordenadas exatas do container na tela
    const rect = e.currentTarget.getBoundingClientRect();
    
    // 2. Calcula onde foi o clique relativo ao container (X do mouse - Esquerda do elemento)
    const x = e.clientX - rect.left;
    
    // 3. Verifica se foi na metade direita ou esquerda
    if (x > rect.width / 2) {
        nextStep();
    } else {
        prevStep();
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* HEADER */}
      <header className="bg-white p-4 shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={24} className="text-gray-600"/>
          </button>
          <h1 className="text-xl font-bold text-gray-800">Instalar App</h1>
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full p-4 flex flex-col">
        
        {/* ABAS (Android / iOS) */}
        <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex mb-6">
            <button 
                onClick={() => { setPlatform('android'); setStep(0); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${
                    platform === 'android' ? 'bg-green-100 text-green-700 shadow-sm' : 'text-gray-400 hover:bg-gray-50'
                }`}
            >
                <Smartphone size={20} /> Android
            </button>
            <button 
                onClick={() => { setPlatform('ios'); setStep(0); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${
                    platform === 'ios' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-50'
                }`}
            >
                <Apple size={20} /> iPhone
            </button>
        </div>

        {/* ÁREA INTERATIVA (STORIES) */}
        <div className="flex-1 flex flex-col items-center justify-start relative">
            
            {/* Barra de Progresso (Barrinhas no topo igual Instagram) */}
            <div className="flex gap-1 w-full max-w-[280px] mb-2 px-1">
                {currentSteps.map((_, i) => (
                    <div 
                        key={i} 
                        className={`h-1 rounded-full flex-1 transition-all duration-300 ${
                            i <= step ? 'bg-hospital-blue' : 'bg-gray-300'
                        }`} 
                    />
                ))}
            </div>

            {/* A FOTO CLICÁVEL */}
            <div 
                onClick={handleStoryClick}
                className="bg-white p-2 rounded-2xl shadow-lg border-4 border-gray-200 w-full max-w-[280px] aspect-[9/19] overflow-hidden relative mb-6 cursor-pointer active:scale-95 transition-transform"
            >
                <img 
                    src={currentSteps[step].img} 
                    alt="Tutorial" 
                    className="w-full h-full object-cover rounded-xl pointer-events-none select-none"
                />

                {/* Área de toque invisível para feedback visual (opcional) */}
                <div className="absolute inset-0 flex">
                    <div className="w-1/2 h-full"></div> {/* Esquerda */}
                    <div className="w-1/2 h-full"></div> {/* Direita */}
                </div>

                {/* Dica visual no primeiro passo */}
                {step === 0 && (
                     <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1 rounded-full animate-pulse pointer-events-none">
                        Toque aqui para avançar 👉
                     </div>
                )}
            </div>

            {/* TEXTO */}
            <div className="text-center px-4 h-24 max-w-[320px]">
                <h2 className="text-xl font-bold text-gray-800 mb-2 transition-all animate-fade-in">
                    {currentSteps[step].title}
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed animate-fade-in">
                    {currentSteps[step].desc}
                </p>
            </div>

        </div>

      </main>
    </div>
  );
}