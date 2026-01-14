import { ArrowLeft, ScrollText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Termos() {
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
              <ScrollText size={24}/> Termos de Uso
            </h1>
            <p className="text-sm opacity-90">Beamed Control</p>
          </div>
        </div>

        {/* Conteúdo do Texto */}
        <div className="p-8 space-y-6 text-gray-700 leading-relaxed">
            
            <p className="text-sm text-gray-400 italic">Última atualização: 04 de Janeiro de 2026</p>

            <section>
                <h3 className="text-lg font-bold text-gray-900 mb-2">1. Aceitação dos Termos</h3>
                <p>
                    Bem-vindo ao <strong>BeaMedControl</strong>. Ao criar uma conta, acessar ou utilizar nossa plataforma de gestão para enfermagem ("Serviço"), você concorda em vincular-se a estes Termos de Uso. Se você não concordar com qualquer parte dos termos, não deverá utilizar o serviço.
                </p>
            </section>

            <section>
                <h3 className="text-lg font-bold text-gray-900 mb-2">2. Descrição do Serviço</h3>
                <p>
                    O BeaMedControl é uma ferramenta SaaS (Software as a Service) destinada a enfermeiros, cuidadores e clínicas para auxiliar na organização de pacientes, anotações de prontuários e checklists de rotina. Nós fornecemos a tecnologia, mas <strong>não realizamos serviços médicos</strong> nem nos responsabilizamos pelas decisões clínicas tomadas pelos usuários.
                </p>
            </section>

            <section>
                <h3 className="text-lg font-bold text-gray-900 mb-2">3. Conta e Segurança</h3>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Você é responsável por manter a confidencialidade de suas credenciais de acesso (Login Google ou Senha).</li>
                    <li>Você é o único responsável por todas as atividades que ocorram em sua conta.</li>
                    <li>O cadastro é permitido apenas para maiores de 18 anos e profissionais ou estudantes da área de saúde.</li>
                </ul>
            </section>

            <section>
                <h3 className="text-lg font-bold text-gray-900 mb-2">4. Assinatura e Pagamentos</h3>
                <p>
                    O uso contínuo da plataforma requer uma assinatura ativa.
                </p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li><strong>Processamento:</strong> Os pagamentos são processados de forma segura pela instituição de pagamento parceira <strong>Asaas Gestão Financeira S.A.</strong>.</li>
                    <li><strong>Renovação:</strong> As assinaturas são mensais e renovadas automaticamente até que haja o cancelamento.</li>
                    <li><strong>Inadimplência:</strong> Em caso de falha no pagamento, o acesso às funcionalidades premium poderá ser suspenso até a regularização.</li>
                </ul>
            </section>

            <section>
                <h3 className="text-lg font-bold text-gray-900 mb-2">5. Cancelamento e Exclusão de Dados</h3>
                <p>
                    Você pode cancelar sua assinatura a qualquer momento através do painel do usuário. O cancelamento interrompe cobranças futuras, mas não reembolsa valores já pagos pelo período vigente.
                </p>
                <p className="mt-2">
                    Você tem o direito de <strong>excluir definitivamente sua conta</strong> através da opção "Excluir Minha Conta" no perfil. Esta ação é irreversível e removerá todos os dados de pacientes e históricos associados ao seu usuário.
                </p>
            </section>

            <section>
                <h3 className="text-lg font-bold text-gray-900 mb-2">6. Responsabilidade sobre Dados de Terceiros</h3>
                <p>
                    Ao cadastrar dados de pacientes na plataforma, você declara estar ciente de que atua como <strong>Controlador</strong> desses dados perante a LGPD, sendo o BeaMedControl apenas o <strong>Operador</strong> tecnológico. Você garante ter a autorização necessária ou base legal para inserir tais informações no sistema.
                </p>
            </section>

            <section>
                <h3 className="text-lg font-bold text-gray-900 mb-2">7. Alterações nos Termos</h3>
                <p>
                    Reservamo-nos o direito de modificar estes termos a qualquer momento. Notificaremos sobre alterações significativas através do e-mail cadastrado ou aviso na plataforma.
                </p>
            </section>

            <div className="pt-6 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                    Dúvidas? Entre em contato: <a href="mailto:beamedcontrol@gmail.com" className="text-hospital-blue hover:underline">beamedcontrol@gmail.com</a>
                </p>
            </div>

        </div>
      </div>
    </div>
  );
}