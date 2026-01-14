
// src/pages/ForgotPassword.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth'; // 👇 A mágica do Firebase
import { auth } from '../services/firebaseConnection';
import { ArrowLeft, Mail, Loader2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleReset(e) {
    e.preventDefault();
    
    if(email === '') {
        alert("Digite seu e-mail!");
        return;
    }

    setLoading(true);
    try {
        await sendPasswordResetEmail(auth, email);
        alert(`Enviamos um email para ${email}. Verifique sua caixa de entrada (e spam) para criar sua senha.`);
        navigate('/'); // Manda de volta pro login
    } catch (error) {
        console.log(error);
        if(error.code === 'auth/user-not-found'){
            alert("Este e-mail não está cadastrado.");
        } else if(error.code === 'auth/invalid-email'){
            alert("E-mail inválido.");
        } else {
            alert("Erro ao enviar email de recuperação.");
        }
    } finally {
        setLoading(false);
    }
  }

  return (
    <div className="flex h-screen bg-gray-100 items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        
        <Link to="/" className="text-gray-500 hover:text-hospital-blue flex items-center gap-2 mb-6">
            <ArrowLeft size={18} /> Voltar
        </Link>

        <div className="flex flex-col items-center mb-6 text-center">
           <h1 className="text-2xl font-bold text-gray-800">Recuperar Senha</h1>
           <p className="text-sm text-gray-500 mt-2">
             Digite seu e-mail abaixo. Se você usa Login com Google, isso vai criar uma senha para você usar também.
           </p>
        </div>

        <form onSubmit={handleReset} className="flex flex-col gap-4">
          <div>
              <label className="text-sm font-medium text-gray-700">E-mail Cadastrado</label>
              <div className="relative mt-1">
                <input 
                    type="email"
                    placeholder="exemplo@email.com"
                    value={email}
                    onChange={ (e) => setEmail(e.target.value) }
                    className="w-full p-3 pl-10 border border-gray-300 rounded focus:border-hospital-blue outline-none transition"
                />
                <Mail size={20} className="absolute left-3 top-3.5 text-gray-400" />
              </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-hospital-blue text-white p-3 rounded font-bold hover:bg-blue-700 transition flex justify-center items-center"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Enviar Link de Recuperação'}
          </button>
        </form>

      </div>
    </div>
  )
}