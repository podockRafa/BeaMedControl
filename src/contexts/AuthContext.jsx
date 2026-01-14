// src/contexts/AuthContext.jsx
import { useState, useEffect, createContext } from 'react';
import { auth, db } from '../services/firebaseConnection'; // 👇 Adicionei 'db'
// 👇 Adicionei as funções de login/create para garantir que não faltem
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'; 
// 👇 Importante para a Auto-Cura
import { doc, getDoc, setDoc } from 'firebase/firestore'; 

export const AuthContext = createContext({});

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if(user){
        // --- 🚑 INÍCIO DA AUTO-CURA ---
        // Se o usuário logou, verificamos se ele tem pasta no banco
        try {
            const docRef = doc(db, "users", user.uid);
            const snapshot = await getDoc(docRef);

            if (!snapshot.exists()) {
                console.log("⚠️ Usuário sem dados (Limbo). Criando pasta agora...");
                // Cria a pasta automaticamente se não existir
                await setDoc(docRef, {
                    nome: user.displayName || "Usuário Recuperado",
                    email: user.email,
                    status: "trial", // Libera um teste para ele não ficar bloqueado
                    plano: "mensal",
                    criadoEm: new Date(),
                    fotoUrl: user.photoURL || null
                });
            }
        } catch (error) {
            console.log("Erro na verificação automática:", error);
        }
        // --- FIM DA AUTO-CURA ---

        // Salva os dados na memória do site
        setUser({
          uid: user.uid,
          email: user.email,
          nome: user.displayName,
          emailVerified: user.emailVerified
        })
      } else {
        setUser(null);
      }
      setLoadingAuth(false);
    });

    return () => unsub();
  }, [])

  // 👇 Funções extras para garantir que seu app não quebre se usar elas em outro lugar
  async function signIn(email, password) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  // Essa função tenta criar no banco, mas se falhar, a Auto-Cura lá em cima resolve depois
  async function signUp(email, password, nome) {
    const value = await createUserWithEmailAndPassword(auth, email, password);
    try {
        await setDoc(doc(db, "users", value.user.uid), {
            nome: nome,
            email: email,
            status: "trial",
            criadoEm: new Date(),
            fotoUrl: null
        });
    } catch (error) {
        console.log("Erro ao criar pasta no cadastro (será corrigido no login):", error);
    }
  }

  async function logout(){
    await signOut(auth);
    setUser(null);
  }

  return(
    <AuthContext.Provider value={{ 
        signed: !!user, 
        user, 
        loadingAuth, 
        logout,
        signIn, // Exportando para usar nas telas de Login se precisar
        signUp  // Exportando para usar nas telas de Cadastro se precisar
    }}>
      {children}
    </AuthContext.Provider>
  )
}