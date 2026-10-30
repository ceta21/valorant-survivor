import { audio } from '../utils/audio';
import { t } from '../i18n';

const LINKEDIN = 'https://www.linkedin.com/in/gabrielvigorodriguez';

/** Apoyo: quién ha creado el juego y cómo seguirle. */
export function SupportScreen({ back }: { back: () => void }) {
  return (
    <div className="screen support">
      <header className="top">
        <button className="btn btn-sm" onClick={() => { audio.play('click'); back(); }}><b>{t('Volver')}</b></button>
        <h2>{t('Apoyo')}</h2>
        <span />
      </header>
      <section className="support-box">
        <span className="hub-kicker">{t('Creador del juego')}</span>
        <h3>Gabriel Vigo Rodríguez</h3>
        <p>{t('ENDLESS RIFT es un proyecto creado por Gabriel Vigo Rodríguez. Si te gusta el juego, la mejor forma de apoyarlo es seguirme en LinkedIn y compartirlo con tus amigos.')}</p>
        <a className="btn btn-xl btn-linkedin" href={LINKEDIN} target="_blank" rel="noopener noreferrer" onClick={() => audio.play('click')}>
          <b>in · {t('Ver mi perfil de LinkedIn')}</b>
        </a>
      </section>
    </div>
  );
}
