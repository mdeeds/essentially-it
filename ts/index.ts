import { Game } from "./game";

async function getAudioContext(): Promise<AudioContext> {
  const div = document.createElement('div');
  div.innerHTML = '<div>Essentially It.</div>';
  div.classList.add('begin');
  document.body.appendChild(div);
  return new Promise((resolve) => {
    div.addEventListener('click', (ev) => {
      div.remove();
      resolve(new window.AudioContext());
    });
  });
}

async function go() {
  new Game(await getAudioContext());
}

go();
