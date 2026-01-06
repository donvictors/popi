# Popi

Aplicación móvil y backend para encontrar baños cercanos en Santiago, Chile.

## Estructura
- `backend/`: API Express con consultas a Overpass (OSM), clasificación y caché.
- `mobile/`: app Expo (React Native) que muestra mapa/lista y permite reportar estado.

## Backend

### Configuración
1. Instalar dependencias:
   ```bash
   cd backend
   npm install
   ```
2. Ejecutar en desarrollo:
   ```bash
   npm start
   ```

El servidor escucha en `http://localhost:4000` por defecto. La base SQLite se guarda en `backend/data/popi.db`.

### Endpoints
- `GET /toilets?lat=...&lng=...&radius=...` (radio por defecto 200m, máximo 2000m). Responde con lista normalizada y categoría.
- `POST /reports` payload `{ toilet_id, lat, lng, status (LIMPIO|SUCIO|CERRADO), comment? }`.
- `GET /reports?toilet_id=...&limit=...` devuelve el último o los últimos N reportes.

### Decisiones técnicas
- Distancia calculada en backend con Haversine (probada) para entregar valores coherentes en mapa y lista.
- Caché en memoria (TTL 3 min) por `lat,lng,radius` para reducir presión a Overpass.
- Clasificación `classifyToilet(tags)` implementa heurísticas (público, pagado, asociado a local, desconocido) y cuenta con pruebas unitarias.

### Pruebas
```bash
npm test
```

## App móvil (Expo)

### Configuración de proyecto
1. Instalar dependencias:
   ```bash
   cd mobile
   npm install
   ```
2. Configurar la API key de Google Maps en `app.json`:
   ```json
   "android": {
     "config": { "googleMaps": { "apiKey": "TU_API_KEY_ANDROID" } }
   },
   "ios": {
     "config": { "googleMapsApiKey": "TU_API_KEY_IOS" }
   }
   ```
3. Define la URL del backend en `mobile/src/config.js` o variable de entorno `EXPO_PUBLIC_API_URL`.

### Ejecutar
Usa Expo Go o un emulador:
```bash
npx expo start
```

### Funcionalidades clave
- Solicita permisos de ubicación (expo-location) y centra el mapa en Santiago.
- Muestra marcadores de baños con categorías (público/pagado/asociado).
- Botón "Más cercano" enfoca el mejor candidato y abre Google Maps para navegación.
- Selector de radio 200/500/1000m.
- Lista ordenada por distancia con categoría y fee.
- Detalle con dirección, tags relevantes, botón "Cómo llegar" y reporte de estado.

### Notas
- Para iOS, activa Google Maps como provider (requiere API key y que la app se ejecute en dispositivo/emulador compatible).
- Si no hay resultados en 200m, la UI sugiere aumentar el radio.
- La app maneja errores de permisos, red u Overpass lento mostrando mensajes en pantalla.
