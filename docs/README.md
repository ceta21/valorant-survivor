# Documentación de ENDLESS RIFT

Especificación completa del juego: cómo funciona, cómo está construido, la base de datos y cómo
mantenerlo. Es la "memoria" del proyecto: **se actualiza con cada cambio** (ver
[09 · Desarrollo y despliegue](09-desarrollo-y-despliegue.md#mantener-esta-documentación)).

| Documento | Contenido |
|---|---|
| [01 · Visión general](01-vision-general.md) | Qué es el juego, tecnologías, estructura de carpetas, dónde está publicado |
| [02 · Jugabilidad](02-jugabilidad.md) | Partida, agentes, habilidades, armas, mejoras, enemigos, jefes, oleadas, modo infinito, dificultad, fórmulas |
| [03 · Arquitectura del código](03-arquitectura.md) | Motor, bucle de juego, varios jugadores, mundo infinito, render pixel art, efectos, sprites, audio, entrada |
| [04 · Base de datos (Supabase)](04-base-de-datos.md) | Tablas, columnas, permisos (RLS), triggers, funciones y ficheros SQL |
| [05 · Cuentas y progreso](05-cuentas-y-progreso.md) | Registro, inicio de sesión, invitado, qué se guarda y dónde, administrador |
| [06 · Modo cooperativo](06-cooperativo.md) | Salas, conexión P2P, sincronización anfitrión/invitado, caídas y reapariciones |
| [07 · Mercado nocturno](07-mercado-nocturno.md) | Rotación diaria, precios, armas y agentes exclusivos, kits personalizados |
| [08 · Interfaz](08-interfaz.md) | Pantallas, estilo pixel art, idiomas, controles, adaptación a pantallas |
| [09 · Desarrollo y despliegue](09-desarrollo-y-despliegue.md) | Comandos, pruebas, publicación, cómo añadir contenido, lista de comprobación de cambios |
| [10 · Datos del juego](10-datos-del-juego.md) | **Generado automáticamente**: tablas exactas de agentes, armas, enemigos, mejoras… |

## Resumen en una línea

Survivor de oleadas en 2D pixel art ("grietas infinitas de las que emergen hordas de enemigos"), hecho con React + TypeScript + Canvas,
publicado en Vercel, con cuentas, ranking y salas cooperativas en Supabase.

- Juego publicado: https://endless-rift.vercel.app/
- Repositorio (privado): `ceta21/valorant-survivor`, rama `main`
- Creador: Gabriel Vigo Rodríguez — https://www.linkedin.com/in/gabrielvigorodriguez
