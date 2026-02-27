'use client';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';

const CIMap = dynamic(() => import('../components/CIMap'), { ssr: false });
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function Home() {
  const [ethnies, setEthnies] = useState([]);
  const [chat, setChat] = useState([]);
  const [msg, setMsg] = useState('');
  const [text, setText] = useState('Bonjour');
  const [translation, setTranslation] = useState('');

  const socket = useMemo(() => io(API_URL), []);

  useEffect(() => {
    fetch(`${API_URL}/ethnies`).then((r) => r.json()).then(setEthnies).catch(() => setEthnies([]));
    socket.on('chat:message', (m) => setChat((prev) => [...prev, m]));
    return () => socket.disconnect();
  }, [socket]);

  const sendMessage = () => {
    socket.emit('chat:message', { user: 'Visiteur', text: msg });
    setMsg('');
  };

  const runTranslate = async () => {
    const res = await fetch(`${API_URL}/bridge/translate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, source_lang: 'fr', target_lang: 'baoule' })
    });
    const data = await res.json();
    setTranslation(data.translated_text);
  };

  return (
    <main className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
      <section className="sunrise rounded-2xl p-8 min-h-56 flex flex-col justify-end">
        <h1 className="text-4xl font-bold">MOYÉ</h1>
        <p>Plateforme intelligente du patrimoine culturel ivoirien.</p>
        <input className="input mt-3" placeholder="Recherche universelle..." />
      </section>

      <section className="card">
        <h2 className="text-2xl font-semibold mb-3">Carte interactive</h2>
        <CIMap />
      </section>

      <section className="card">
        <h2 className="text-2xl font-semibold mb-3">Découverte (Ethnies)</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {ethnies.map((e) => <article key={e.id} className="bg-slate-800 p-3 rounded"><h3 className="font-bold">{e.name}</h3><p>{e.history}</p></article>)}
        </div>
      </section>

      <section className="card grid md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-xl font-semibold">Pont IA - Traduction simulée</h2>
          <input className="input my-2" value={text} onChange={(e) => setText(e.target.value)} />
          <button className="btn" onClick={runTranslate}>Traduire</button>
          <p className="mt-2">Résultat: {translation}</p>
          <button className="btn mt-2" onClick={() => speechSynthesis.speak(new SpeechSynthesisUtterance(translation || text))}>Synthèse vocale</button>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Chat temps réel</h2>
          <div className="h-36 overflow-auto bg-slate-800 rounded p-2 text-sm">
            {chat.map((c, i) => <p key={i}><b>{c.user}:</b> {c.text} <i>{c.translated}</i></p>)}
          </div>
          <div className="flex gap-2 mt-2">
            <input className="input" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Votre message" />
            <button className="btn" onClick={sendMessage}>Envoyer</button>
          </div>
        </div>
      </section>

      <section className="card">
        <h2 className="text-2xl font-semibold">Académie & Podcast (MVP)</h2>
        <p>Niveaux, quiz, points, badges et upload/streaming audio via API disponibles côté backend.</p>
      </section>
    </main>
  );
}
