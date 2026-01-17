import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Privacidade() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        
        {/* Cabeçalho */}
        <div className="bg-hospital-blue p-6 text-white flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition"
            title="Voltar"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck size={24}/> Política de Privacidade
            </h1>
            <p className="text-sm opacity-90">LGPD & Segurança de Dados</p>
          </div>
        </div>

        {/* Conteúdo do Texto */}
        <div className="p-8 space-y-6 text-gray-700 leading-relaxed">
            
            <p className="text-sm text-gray-400 italic">Última atualização: 16 de Janeiro de 2026</p>

            <section>
                <p>
                    O <strong>Bea Med Control</strong> leva sua privacidade a sério. Esta Política descreve como coletamos, usamos e protegemos suas informações, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD).
                </p>
            </section>

            <section>
                <h3 className="text-lg font-bold text-gray-900 mb-2">1. Controlador e Operador</h3>
                <p>Para fins da legislação de proteção de dados:</p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li><strong>Você (Usuário):</strong> É o <strong>Controlador</strong> dos dados dos pacientes que você insere no sistema.</li>
                    <li><strong>Nós (Bea Med Control):</strong> Somos o <strong>Operador</strong>, responsáveis pelo armazenamento e segurança da infraestrutura.</li>
                </ul>
            </section>

            <section>
                <h3 className="text-lg font-bold text-gray-900 mb-2">2. Dados que Coletamos</h3>
                <div className="space-y-2">
                    <p><strong>A. Dados do Usuário (Você):</strong></p>
                    <ul className="list-disc pl-5 text-sm">
                        <li>Nome, E-mail e Foto (para identificação e login).</li>
                        <li>CPF/CNPJ (exigido para emissão de cobranças via Asaas).</li>
                    </ul>
                    <p><strong>B. Dados de Terceiros (Pacientes):</strong></p>
                    <ul className="list-disc pl-5 text-sm">
                        <li>Nome, observações de saúde e status clínico.</li>
                        <li>Medicamentos, dosagens e horários de tratamento.</li>
                    </ul>
                    <p><strong>C. Logs e Auditoria:</strong></p>
                    <ul className="list-disc pl-5 text-sm">
                        <li>O sistema registra automaticamente um histórico de ações (quem criou um paciente, quem baixou estoque, ações do robô) para fins de segurança e auditoria do próprio usuário.</li>
                    </ul>
                </div>
            </section>

            <section>
                <h3 className="text-lg font-bold text-gray-900 mb-2">3. Compartilhamento de Dados</h3>
                <p>Não vendemos seus dados. Compartilhamos informações apenas com parceiros essenciais para o funcionamento do serviço:</p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li><strong>Google Cloud / Firebase (EUA):</strong> Provedor de infraestrutura de banco de dados e autenticação. Possui certificações de segurança de nível global (ISO 27001).</li>
                    <li><strong>Asaas (Brasil):</strong> Instituição de Pagamento. Seus dados cadastrais são enviados estritamente para processar pagamentos e assinaturas.</li>
                </ul>
            </section>

            <section>
                <h3 className="text-lg font-bold text-gray-900 mb-2">4. Segurança</h3>
                <p>
                    Adotamos medidas técnicas robustas, incluindo criptografia em trânsito (HTTPS/TLS) e no repouso, controle de acesso rigoroso e monitoramento contra vulnerabilidades.
                </p>
            </section>

            <section>
                <h3 className="text-lg font-bold text-gray-900 mb-2">5. Seus Direitos</h3>
                <p>Você pode, a qualquer momento:</p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li>Solicitar acesso aos seus dados armazenados.</li>
                    <li>Corrigir dados incompletos ou desatualizados.</li>
                    <li><strong>Solicitar a exclusão da sua conta:</strong> Isso apagará permanentemente seus dados e os dados de pacientes vinculados a você de nossos servidores.</li>
                </ul>
            </section>

            <section>
                <h3 className="text-lg font-bold text-gray-900 mb-2">6. Cookies e Tecnologias</h3>
                <p>
                    Utilizamos cookies essenciais para manter sua sessão de login ativa e segura. Não utilizamos cookies de rastreamento publicitário de terceiros dentro da área logada do sistema.
                </p>
            </section>

            <div className="pt-6 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                    Para exercer seus direitos ou tirar dúvidas, contate nossa equipe pelo e-mail: <a href="mailto:beamedcontrol@gmail.com" className="text-hospital-blue hover:underline">beamedcontrol@gmail.com</a>
                </p>
            </div>

        </div>
      </div>
    </div>
  );
}