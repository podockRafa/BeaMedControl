// src/contexts/AuthContext.jsx
import { useState, useEffect, createContext } from 'react';
import { auth, db } from '../services/firebaseConnection'; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'; 
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'; // 👇 Adicionei onSnapshot

export const AuthContext = createContext({});

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if(currentUser){
        const uid = currentUser.uid;
        const docRef = doc(db, "users", uid);

        // --- 🚑 1. AUTO-CURA (Mantida) ---
        // Garante que o usuário tenha documento no banco
        try {
            const snapshotCheck = await getDoc(docRef);
            if (!snapshotCheck.exists()) {
                console.log("⚠️ Usuário sem dados. Criando pasta...");
                await setDoc(docRef, {
                    nome: currentUser.displayName || "Usuário Recuperado",
                    email: currentUser.email,
                    status: "trial",
                    plano: "mensal",
                    criadoEm: new Date(),
                    fotoUrl: currentUser.photoURL || null
                });
            }
        } catch (error) {
            console.log("Erro na auto-cura:", error);
        }
        // --------------------------------

        // --- 👂 2. OUVINTE EM TEMPO REAL (Novo!) ---
        // É isso aqui que traz o 'status' e o 'criadoEm' para o App.jsx
        const unsubDoc = onSnapshot(docRef, (snapshot) => {
            if(snapshot.exists()){
                const data = snapshot.data();
                setUser({
                    uid: uid,
                    email: currentUser.email,
                    // 👇 O Pulo do Gato: joga status, criadoEm, etc pra dentro do user
                    ...data 
                });
            } else {
                // Fallback caso a auto-cura falhe
                setUser({
                    uid: uid,
                    email: currentUser.email
                });
            }
            setLoadingAuth(false);
        });

        // Limpa o ouvinte se o user mudar
        return () => unsubDoc();

      } else {
        setUser(null);
        setLoadingAuth(false);
      }
    });

    return () => unsub();
  }, [])

  // 👇 Funções extras mantidas (Não perdeu nada!)
  async function signIn(email, password) {
    await signInWithEmailAndPassword(auth, email, password);
  }

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
        console.log("Erro ao criar pasta:", error);
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
        signIn, 
        signUp  
    }}>
      {children}
    </AuthContext.Provider>
  )
}