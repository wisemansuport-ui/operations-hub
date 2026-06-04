import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDiiKqZWL3X880z1Lcy5_QGXgjSaOHUdhA",
  authDomain: "nytzer-vision.firebaseapp.com",
  projectId: "nytzer-vision",
  storageBucket: "nytzer-vision.firebasestorage.app",
  messagingSenderId: "924366104460",
  appId: "1:924366104460:web:efaed3a6bedd89c6db98a9",
  measurementId: "G-6JR9TFLKPX"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearRilkeData() {
  console.log('Buscando dados do usuario rilke...');
  
  // 1. Delete from user_data (migrated data)
  const userDataSnapshot = await getDocs(collection(db, 'user_data'));
  let count = 0;
  for (const d of userDataSnapshot.docs) {
    if (d.id.toLowerCase().startsWith('rilke_')) {
      await deleteDoc(doc(db, 'user_data', d.id));
      console.log('Deletado user_data:', d.id);
      count++;
    }
  }
  console.log(`Total de user_data deletados: ${count}`);

  // 2. We can also check if he has metas or costs, but since he's a new user who hasn't done anything,
  // the issue was only the migrated `user_data` (goals, etc).
  // But let's also delete metas and costs just in case.
  const metasQuery = query(collection(db, 'metas'), where('operador', '==', 'rilke'));
  const metasSnap = await getDocs(metasQuery);
  for (const d of metasSnap.docs) {
    await deleteDoc(doc(db, 'metas', d.id));
    console.log('Deletado meta:', d.id);
  }

  const costsQuery = query(collection(db, 'costs'), where('operador', '==', 'rilke'));
  const costsSnap = await getDocs(costsQuery);
  for (const d of costsSnap.docs) {
    await deleteDoc(doc(db, 'costs', d.id));
    console.log('Deletado cost:', d.id);
  }

  console.log('Limpeza concluida!');
  process.exit(0);
}

clearRilkeData().catch(console.error);
