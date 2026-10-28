import { audio } from '../utils/audio';

const LINKEDIN = 'https://www.linkedin.com/in/gabrielvigorodriguez';

/** Apoyo: quién ha creado el juego y cómo seguirle. */
export function SupportScreen({ back }: { back: () => void }) {
  return (
    <div className="screen support">
      <header className="top">
        <button className="btn btn-sm" onClick={() => { audio.play('click'); back(); }}><b>Volver</b></button>
        <h2>Apoyo</h2>
        <span />
      </header>
      <section className="support-box">
        <span className="hub-kicker">Creador del juego</span>
        <h3>Gabriel Vigo Rodríguez</h3>
        <p>VALORANT SURVIVORS es un proyecto creado por Gabriel Vigo Rodríguez. Si te gusta el juego, la mejor forma de apoyarlo es seguirme en LinkedIn y compartirlo con tus amigos.</p>
        <a className="btn btn-xl btn-linkedin" href={LINKEDIN} target="_blank" rel="noopener noreferrer" onClick={() => audio.play('click')}>
          <b>in · Ver mi perfil de LinkedIn</b>
        </a>
      </section>
    </div>
  );
}
