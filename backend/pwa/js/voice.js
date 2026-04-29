async function initVoice() {
  const res = await fetch('./voice-commands.json');
  const COMMANDS = await res.json();
  console.log('COMMANDS loaded:', COMMANDS);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn('SpeechRecognition ni podprt');
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = 'sl-SI';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  const btn = document.querySelector('#btn-voice');

  document.querySelector('#btn-voice').addEventListener('click', () => {
    recognition.start();
    btn.classList.add('recording');
  });

  recognition.onend = () => {
    btn.classList.remove('recording');
  };

  function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'sl-SI';
    speechSynthesis.speak(utterance);
  }

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.toLowerCase().trim();
    const match = Object.keys(COMMANDS).find((cmd) => transcript.includes(cmd));
    console.log(transcript);

    if (!match) {
      speak('Ukaz ni prepoznan, možni ukazi so:');
      Object.keys(COMMANDS).forEach((key, i) => {
        speak(key);
      });
      return;
    }

    const navigateTo = COMMANDS[match];

    if (match === 'dodaj cilj') {
      speak('Dodajam cilj');
      window.openGoalModal(null);
    } else if (match === 'dodaj nalogo') {
      speak('Dodajam nalogo');
      window.openTaskModal(null);
    } else if (match === 'odjava') {
      speak('Odjavljam');
      window.logout();
      window.location.reload();
    } else {
      speak(match);
      window.showView(navigateTo);
    }
  };
}

initVoice().catch((err) => console.error('Voice init napaka:', err));
