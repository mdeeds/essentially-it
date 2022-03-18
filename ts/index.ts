import { Game } from "./game";
import { S } from "./settings";
import { HardWordle } from "./hardWordle";

async function getAudioContext(): Promise<AudioContext> {
  const c = document.createElement('div');
  const div = document.createElement('div');
  div.innerHTML = '<div>Essentially It.</div>';
  div.classList.add('begin');
  c.appendChild(div);
  document.body.appendChild(c);
  S.appendHelpText(c);
  return new Promise((resolve) => {
    div.addEventListener('click', (ev) => {
      c.remove();
      resolve(new window.AudioContext());
    });
  });
}

async function go() {
  if (S.float('wd')) {
    new HardWordle();
  } else {
    new Game(await getAudioContext());
  }
}

go();
