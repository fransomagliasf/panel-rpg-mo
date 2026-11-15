# MO Tracker

Panel comunitario y estático para jugadores de [RPG MO](https://mo.ee). La primera versión incluye:

- perfil local, objetivo diario y banco manual de horas 2×;
- registro de sesiones de experiencia, resumen semanal y exportación JSON;
- buscador sobre miles de ítems del juego;
- armador de sets con suma de estadísticas y requisitos;
- calculadora de experiencia física por mob y postura;
- planificador inicial de niveles, acciones y materiales por oficio.

Los datos personales se guardan únicamente en `localStorage`. El sitio no tiene backend ni envía información del personaje.

## Desarrollo local

Requiere Node.js 22 o posterior.

```bash
npm ci
npm run dev
```

Validación completa:

```bash
npm test
npm run build
npm run preview -- --host 127.0.0.1 --port 4174
```

## Actualizar los datos

La aplicación contiene un snapshot reducido de los datos publicados por [`marcqg/rpg-mo-wiki`](https://github.com/marcqg/rpg-mo-wiki), que a su vez documenta la extracción desde `data.mo.ee`.

Para descargar la última versión desde GitHub:

```bash
npm run sync:data
```

Para usar un checkout local ya revisado:

```bash
RPG_MO_WIKI_DIR=/ruta/al/rpg-mo-wiki npm run sync:data
```

Revisá los cambios generados en `public/data/` antes de publicarlos.

## Publicar en GitHub Pages

1. Subir estos archivos a la rama `main`.
2. En GitHub, abrir **Settings → Pages**.
3. En **Build and deployment**, elegir **GitHub Actions**.
4. El workflow `Deploy GitHub Pages` ejecutará tests, compilará y publicará el sitio en cada push a `main`.

Vite usa rutas relativas y navegación por hash, por lo que funciona bajo `https://<usuario>.github.io/panel-rpg-mo/` sin configurar un dominio base.

## Criterios y límites

La XP por mob se calcula a partir de la vida completa y la distribución documentada para cada postura. Es una estimación: no incluye regeneración, daño compartido, magia ni recompensas especiales. Los valores de mercado, highscores y estado global del evento 2× todavía no se importan automáticamente porque requieren una fuente estable y compatible con un sitio estático.

Consultá [NOTICE.md](NOTICE.md) para conocer las fuentes y atribuciones.
