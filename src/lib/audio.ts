let audioCtx: AudioContext | null = null;

export const playClickSound = () => {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Som premium de clique (estilo Apple / modern UI) mais alto
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.03);

    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.8, audioCtx.currentTime + 0.005); // Volume aumentado de 0.15 para 0.8
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03); // Mais curto pra ficar mais seco/nítido

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.03);
  } catch (e) {
    // Silently fail if audio is not supported or blocked
  }
};
