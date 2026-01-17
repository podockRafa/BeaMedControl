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
            
            <p className="text-sm text-gray-400 italic">Última atualização: 16 de Janeiro de 2026</p>

            <section>
                <h3 className="text-lg font-bold text-gray-900 mb-2">1. Aceitação dos Termos</h3>
                <p>
                    Bem-vindo ao <strong>BeaMedControl</strong>. Ao criar uma conta, acessar ou utilizar nossa plataforma de gestão para enfermagem ("Serviço"), você concorda em vincular-se a estes Termos de Uso. Se você não concordar com qualquer parte dos termos, não deverá utilizar o serviço.
                </p>
            </section>

            <section>
                <h3 className="text-lg font-bold text-gray-900 mb-2">2. Descrição do Serviço</h3>
                <p>
                    O BeaMedControl é uma ferramenta SaaS (Software as a Service) destinada a auxiliar na organização de pacientes, controle de estoque de medicamentos e automação de baixas via sistema (Robô). Nós fornecemos a tecnologia para gestão, mas <strong>não realizamos serviços médicos</strong>.
                </p>
            </section>

            <section>
                <h3 className="text-lg font-bold text-gray-900 mb-2">3. Período de Testes (Trial)</h3>
                <p>
                    Oferecemos um período de degustação gratuito de <strong>72 horas</strong> (3 dias) após o cadastro. Durante este período, todas as funcionalidades estão liberadas.
                </p>
                <p className="mt-2">
                    Após o término das 72 horas, o acesso ao painel será bloqueado automaticamente até que uma assinatura seja ativada. Não haverá cobrança automática ao fim do teste sem a sua expressa autorização e inserção de dados de pagamento.
                </p>
            </section>

            <section>
                <h3 className="text-lg font-bold text-gray-900 mb-2">4. Conta e Segurança</h3>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Você é responsável por manter a confidencialidade de suas credenciais de acesso.</li>
                    <li>O cadastro é permitido apenas para maiores de 18 anos e profissionais ou cuidadores da área de saúde.</li>
                </ul>
            </section>

            <section>
                <h3 className="text-lg font-bold text-gray-900 mb-2">5. Assinatura e Pagamentos</h3>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li><strong>Processamento:</strong> Os pagamentos são processados de forma segura pela instituição parceira <strong>Asaas Gestão Financeira S.A.</strong>.</li>
                    <li><strong>Renovação:</strong> As assinaturas são mensais e renovadas automaticamente até o cancelamento.</li>
                    <li><strong>Bloqueio:</strong> Em caso de falha no pagamento, o acesso às funcionalidades será suspenso imediatamente.</li>
                </ul>
            </section>

            <section>
                <h3 className="text-lg font-bold text-gray-900 mb-2">6. Cancelamento e Exclusão</h3>
                <p>
                    Você pode cancelar sua assinatura a qualquer momento. O cancelamento interrompe cobranças futuras, mas não reembolsa valores já pagos pelo mês vigente. Você também pode solicitar a exclusão definitiva de seus dados e conta através do painel.
                </p>
            </section>

            <section>
                <h3 className="text-lg font-bold text-gray-900 mb-2">7. Limitação de Responsabilidade (Automação)</h3>
                <p>
                    O sistema possui funcionalidades de automação ("Robô") que realizam a baixa de estoque baseada em horários programados. <strong>Atenção:</strong>
                </p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li>O sistema serve como <strong>apoio administrativo</strong> e não substitui a conferência física do estoque e a responsabilidade clínica do profissional.</li>
                    <li>Não nos responsabilizamos por falhas na internet, falta de energia ou erros de configuração que impeçam o robô de rodar no horário exato.</li>
                    <li>É dever do usuário conferir se a medicação foi efetivamente administrada ao paciente, independentemente do status no sistema.</li>
                </ul>
            </section>

            <section>
                <h3 className="text-lg font-bold text-gray-900 mb-2">8. Responsabilidade sobre Dados (LGPD)</h3>
                <p>
                    Ao cadastrar pacientes, você atua como <strong>Controlador</strong> desses dados. O BeaMedControl atua apenas como <strong>Operador</strong> tecnológico. Você garante ter autorização legal para gerir as informações de saúde inseridas na plataforma.
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