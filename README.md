# 🏥 BeaMedControl - Sistema Inteligente de Gestão de Enfermagem

![Status](https://img.shields.io/badge/Status-Em_Desenvolvimento-blue)
![Tech](https://img.shields.io/badge/Tech-React_|_Firebase_|_Node-orange)
![License](https://img.shields.io/badge/License-Proprietary-red)

O **BeaMedControl** é uma aplicação Web Progressiva (PWA) desenvolvida para auxiliar enfermeiros, cuidadores e home cares na gestão completa de pacientes. O sistema automatiza o controle de estoque de medicamentos, gerencia prontuários digitais e facilita a rotina de cuidados com uma interface moderna e intuitiva.

## 🚀 Funcionalidades Principais

* **👥 Gestão de Pacientes:** Prontuário digital completo, histórico de saúde e dados vitais.
* **💊 Controle de Estoque Inteligente:**
    * Cadastro de caixas fechadas e unidades soltas.
    * **Robô Automatizado (Cloud Functions):** Desconta automaticamente o estoque com base na prescrição médica, sem necessidade de baixa manual.
    * Alerta de falta de estoque no histórico.
* **🤖 Automação de Horários:** Lógica avançada para cálculo de doses e horários de medicação.
* **💰 Sistema de Assinatura (SaaS):**
    * Integração com gateway de pagamento **Asaas**.
    * Suporte a **Pix** (com QR Code e Copia e Cola) e **Cartão de Crédito**.
    * Gestão automática de status (Ativo, Bloqueado, Trial).
* **📱 PWA (Progressive Web App):** Instalável em celulares Android/iOS como um aplicativo nativo.
* **🛡️ Segurança:** Autenticação via Firebase Auth e proteção de rotas.
* **💬 Suporte Integrado:** Envio de mensagens de suporte direto pelo app via EmailJS.

## 🛠️ Tecnologias Utilizadas

### Frontend
* **React + Vite:** Performance e desenvolvimento ágil.
* **TailwindCSS:** Estilização moderna e responsiva.
* **Lucide React:** Ícones leves e intuitivos.
* **Context API:** Gerenciamento de estado global (Autenticação).
* **EmailJS:** Serviço de envio de e-mails de suporte.

### Backend (Serverless)
* **Firebase Authentication:** Login seguro.
* **Firebase Firestore:** Banco de dados NoSQL em tempo real.
* **Firebase Storage:** Armazenamento de fotos de perfil.
* **Cloud Functions:** Lógica do robô de estoque e webhooks de pagamento.

## 📸 Screenshots

*(Espaço reservado para prints do sistema - Adicione imagens na pasta /assets e linke aqui futuramente)*

## ⚙️ Configuração e Instalação

### Pré-requisitos
* Node.js instalado.
* Conta no Firebase configurada.

### Rodando Localmente

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/podockRafa/BeaMedControl.git](https://github.com/podockRafa/BeaMedControl.git)
    cd beamedcontrol
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as Variáveis de Ambiente:**
    Crie um arquivo `.env` na raiz do projeto seguindo o modelo abaixo:

    ```env
    # Firebase Config
    VITE_FIREBASE_API_KEY=sua_api_key
    VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=seu_projeto_id
    # ... outras chaves do Firebase

    # EmailJS
    VITE_EMAILJS_SERVICE_ID=seu_service_id
    VITE_EMAILJS_TEMPLATE_ID=seu_template_id
    VITE_EMAILJS_PUBLIC_KEY=sua_public_key
    ```

4.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```

## 🔐 Segurança do Backend (Cloud Functions)

As chaves sensíveis de pagamento (Asaas) estão protegidas no Backend.
Para configurar as funções:

1.  Acesse a pasta `functions`:
    ```bash
    cd functions
    npm install
    ```
2.  Crie o arquivo `functions/.env` (não comitar este arquivo):
    ```env
    ASAAS_API_KEY=sua_chave_secreta_asaas
    ASAAS_URL=[https://sandbox.asaas.com/api/v3](https://sandbox.asaas.com/api/v3)
    WEBHOOK_SECRET=sua_senha_webhook
    ```

## 📦 Deploy

O projeto utiliza **Firebase Hosting** para o Frontend e **Cloud Functions** para o Backend.

```bash
# Build e Deploy completo
npm run build
firebase deploy