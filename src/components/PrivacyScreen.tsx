import { audio } from '../utils/audio';
import { t } from '../i18n';

const LINKEDIN = 'https://www.linkedin.com/in/gabrielvigorodriguez';
const EMAIL = 'fnceta@gmail.com';

/** Privacidad y aviso legal: qué datos usa el juego, para qué y cómo pedir que se borren. */
export function PrivacyScreen({ back }: { back: () => void }) {
  const sec = (title: string, items: string[]) => (
    <section>
      <h3>{t(title)}</h3>
      <ul>{items.map(s => <li key={s}>{t(s)}</li>)}</ul>
    </section>
  );
  return (
    <div className="screen privacy">
      <header className="top">
        <button className="btn btn-sm" onClick={() => { audio.play('click'); back(); }}><b>{t('Volver')}</b></button>
        <h2>{t('Privacidad y aviso legal')}</h2>
        <span />
      </header>
      <div className="privacy-box">
        <p className="lead">{t('ENDLESS RIFT es un juego gratuito para navegador creado por Gabriel Vigo Rodríguez, que es el responsable de los datos. Aquí se explica, en corto, qué se guarda y por qué.')}</p>
        {sec('Qué datos se guardan', [
          'Con cuenta: tu nombre de usuario, tu contraseña (cifrada, nadie puede leerla) y tu progreso en el juego (créditos, héroes, mejoras, estadísticas y ajustes).',
          'Ranking: si publicas una marca, se guarda el nombre que se muestra, el héroe, la zona, la dificultad y los datos de la partida. Son públicos para el resto de jugadores.',
          'Como invitado, tu progreso no se envía ni se guarda: se pierde al cerrar la página.',
          'Estadísticas anónimas de uso: al abrir el juego y en cada partida se envía qué ha pasado (héroe, zona, cuánto duró, si se usó el tutorial, tipo de dispositivo e idioma) con un identificador al azar que se borra al cerrar la página. No llevan tu cuenta, tu nombre ni tu IP, y sirven solo para mejorar el juego. Puedes desactivarlas en Configuración.',
          'En el navegador también se guardan tus preferencias (idioma, controles, volumen) para no tener que configurarlas cada vez.',
          'No se pide correo, ni nombre real, ni datos de pago. No hay publicidad, ni cookies de seguimiento, ni servicios de estadísticas de terceros.',
        ])}
        {sec('Para qué se usan', [
          'Para que puedas jugar (entrar en tu cuenta, guardar tu progreso, mostrar el ranking y jugar en pareja) y, con las estadísticas anónimas, para ver qué mejorar. No se venden ni se comparten con nadie para otros fines.',
        ])}
        {sec('Dónde se guardan', [
          'Las cuentas, el progreso y el ranking se guardan en Supabase. La web se sirve desde Vercel.',
          'En el modo en pareja, los datos de la partida pasan por Supabase y pueden ir directamente entre los dos navegadores; tu compañero solo ve tu nombre, tu héroe y lo que haces en la partida.',
        ])}
        {sec('Tus derechos', [
          'Puedes borrar tu progreso cuando quieras en Configuración → Borrar progreso.',
          'Para borrar tu cuenta o tus marcas del ranking, o para cualquier duda sobre tus datos, escríbeme a fnceta@gmail.com (o por LinkedIn) indicando tu nombre de usuario. Tus datos se conservan mientras la cuenta exista.',
          'Si crees que no se han respetado tus derechos, puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).',
        ])}
        {sec('Aviso legal', [
          'ENDLESS RIFT es un proyecto personal y sin ánimo de lucro. Los créditos y objetos del juego no tienen valor real ni se pueden comprar con dinero.',
          'Los personajes, enemigos, mapas y nombres son originales del juego; no está relacionado con ninguna otra compañía ni juego.',
          'Los nombres que se usan en el ranking deben ser respetuosos: los que no lo sean se pueden borrar sin aviso.',
        ])}
        <a className="btn btn-red" href={'mailto:' + EMAIL} onClick={() => audio.play('click')}>
          <b>✉ {t('Escribir a {e}', { e: EMAIL })}</b>
        </a>
        <a className="btn" href={LINKEDIN} target="_blank" rel="noopener noreferrer" onClick={() => audio.play('click')}>
          <b>in · {t('Contactar por LinkedIn')}</b>
        </a>
        <p className="auth-note">{t('Última actualización: noviembre de 2026.')}</p>
      </div>
    </div>
  );
}
