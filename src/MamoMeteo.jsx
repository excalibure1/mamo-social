import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  Eye,
  Gauge,
  LineChart,
  Loader2,
  MapPin,
  Moon,
  Search,
  Sparkles,
  Sun,
  TriangleAlert,
  Wind,
} from "lucide-react";

const WEATHER_DESCRIPTIONS = {
  0: "Ciel degage",
  1: "Principalement clair",
  2: "Partiellement nuageux",
  3: "Couvert",
  45: "Brouillard",
  48: "Brouillard givrant",
  51: "Bruine legere",
  53: "Bruine moderee",
  55: "Bruine dense",
  61: "Pluie legere",
  63: "Pluie moderee",
  65: "Pluie forte",
  71: "Neige legere",
  73: "Neige moderee",
  75: "Neige forte",
  77: "Grains de neige",
  80: "Averses legeres",
  81: "Averses moderees",
  82: "Averses violentes",
  85: "Averses de neige legeres",
  86: "Averses de neige fortes",
  95: "Orage",
  96: "Orage avec grele legere",
  99: "Orage avec grele forte",
};

const DEFAULT_LOCATION = { lat: 45.5017, lon: -73.5673, name: "Montreal, QC" };

const toHour = (iso) =>
  new Date(iso).toLocaleTimeString("fr-CA", {
    hour: "2-digit",
    minute: "2-digit",
  });

const toDayLabel = (iso, index) => {
  if (index === 0) return "Aujourd'hui";
  return new Date(iso).toLocaleDateString("fr-CA", { weekday: "short" });
};

const getIconComponent = (code) => {
  if (code === 0) return Sun;
  if ([1, 2].includes(code)) return CloudSun;
  if ([3, 45, 48].includes(code)) return Cloud;
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return CloudRain;
  if ([71, 73, 75, 77, 85, 86].includes(code)) return CloudSnow;
  if ([95, 96, 99].includes(code)) return CloudLightning;
  return Cloud;
};

const describeAirQuality = (aqi) => {
  if (aqi == null) return "Donnees indisponibles";
  if (aqi <= 20) return `Excellente (AQI ${aqi})`;
  if (aqi <= 40) return `Bonne (AQI ${aqi})`;
  if (aqi <= 60) return `Moderee (AQI ${aqi})`;
  if (aqi <= 80) return `Faible (AQI ${aqi})`;
  return `Mauvaise (AQI ${aqi})`;
};

const readWeatherCode = (current) => Number(current?.weather_code ?? current?.weathercode ?? 0);
const readWindCurrent = (current) =>
  Number(current?.wind_speed_10m ?? current?.windspeed_10m ?? 0);
const readHourlyWind = (hourly) =>
  hourly?.wind_speed_10m || hourly?.windspeed_10m || [];
const readDailyWeatherCodes = (daily) => daily?.weather_code || daily?.weathercode || [];

const getGeoErrorMessage = (error) => {
  if (!error) return "Impossible de recuperer la position GPS.";
  if (error.code === 1) {
    return "Permission GPS refusee. Autorise la localisation dans ton navigateur puis relance.";
  }
  if (error.code === 2) {
    return "Position indisponible. Verifie ton GPS/Wi-Fi ou essaie a l'exterieur.";
  }
  if (error.code === 3) {
    return "Le GPS a expire (timeout). Reessaie avec un meilleur signal.";
  }
  return "Erreur GPS inconnue. Reessaye dans quelques secondes.";
};

const getCurrentPosition = (options) =>
  new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });

const HourlyTrend = ({ hourly }) => {
  const points = useMemo(() => {
    const labels = (hourly?.time || []).slice(0, 24);
    const temps = (hourly?.temperature_2m || []).slice(0, 24);
    const rain = (hourly?.precipitation_probability || []).slice(0, 24);
    const wind = readHourlyWind(hourly).slice(0, 24);
    if (!labels.length || !temps.length) return [];

    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const tempSpan = Math.max(1, maxTemp - minTemp);
    const maxWind = Math.max(1, ...wind, 1);

    return labels.map((label, i) => {
      const temp = Number(temps[i] ?? 0);
      const rainProb = Number(rain[i] ?? 0);
      const windSpeed = Number(wind[i] ?? 0);
      return {
        hour: toHour(label),
        temp: Math.round(temp),
        rain: Math.round(rainProb),
        wind: Math.round(windSpeed),
        tempHeight: 22 + ((temp - minTemp) / tempSpan) * 92,
        rainHeight: Math.max(4, Math.round((rainProb / 100) * 30)),
        windHeight: Math.max(4, Math.round((windSpeed / maxWind) * 24)),
      };
    });
  }, [hourly]);

  if (!points.length) return <p className="muted">Pas de donnees horaires.</p>;

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: 940 }}>
        <div
          style={{
            height: 232,
            border: "1px solid rgba(56,133,170,0.55)",
            borderRadius: 12,
            background: "rgba(6,17,34,0.85)",
            display: "grid",
            gridTemplateColumns: `repeat(${points.length}, minmax(0,1fr))`,
            alignItems: "end",
            gap: 4,
            padding: "8px 8px 6px",
          }}
        >
          {points.map((row) => (
            <div
              key={row.hour}
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "end",
                alignItems: "center",
                height: "100%",
              }}
            >
              <div style={{ fontSize: 10, color: "#7dd3fc", marginBottom: 4 }}>{row.temp} deg</div>
              <div
                title={`Temp ${row.temp} deg | Pluie ${row.rain}% | Vent ${row.wind} km/h`}
                style={{
                  width: 16,
                  height: `${row.tempHeight}px`,
                  borderRadius: 6,
                  background: "linear-gradient(180deg, #38bdf8 0%, #1d4ed8 100%)",
                  border: "1px solid rgba(125,211,252,0.45)",
                }}
              />
              <div
                title={`Pluie ${row.rain}%`}
                style={{
                  width: 16,
                  height: `${row.rainHeight}px`,
                  marginTop: 4,
                  borderRadius: 4,
                  background: "linear-gradient(180deg, #86efac 0%, #16a34a 100%)",
                  border: "1px solid rgba(134,239,172,0.4)",
                }}
              />
              <div
                title={`Vent ${row.wind} km/h`}
                style={{
                  width: 16,
                  height: `${row.windHeight}px`,
                  marginTop: 3,
                  borderRadius: 4,
                  background: "linear-gradient(180deg, #fdba74 0%, #f97316 100%)",
                  border: "1px solid rgba(251,146,60,0.45)",
                }}
              />
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 8,
            display: "grid",
            gridTemplateColumns: `repeat(${points.length}, minmax(0,1fr))`,
            gap: 4,
            fontSize: 10,
            color: "#9ab8d6",
          }}
        >
          {points.map((row) => (
            <div key={`l-${row.hour}`} style={{ textAlign: "center" }}>
              {row.hour}
            </div>
          ))}
        </div>
        <div className="row" style={{ gap: 12, marginTop: 8, fontSize: 11 }}>
          <span className="muted">Bleu: temperature</span>
          <span className="muted">Vert: pluie</span>
          <span className="muted">Orange: vent</span>
        </div>
      </div>
    </div>
  );
};

export default function MamoMeteo() {
  const [cityQuery, setCityQuery] = useState("");
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [forecast, setForecast] = useState(null);
  const [airQuality, setAirQuality] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingLocate, setLoadingLocate] = useState(false);
  const [message, setMessage] = useState("Station meteo MAMO prete.");
  const [nowString, setNowString] = useState("");

  useEffect(() => {
    const update = () =>
      setNowString(
        new Date().toLocaleDateString("fr-CA", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
    update();
    const id = window.setInterval(update, 60000);
    return () => window.clearInterval(id);
  }, []);

  const fetchAirQuality = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi&timezone=auto`
      );
      const data = await response.json();
      return data?.current?.european_aqi ?? null;
    } catch {
      return null;
    }
  };

  const fetchWeatherByCoords = async (lat, lon, locationName) => {
    const forecastUrl =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      "&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,surface_pressure,cloud_cover,visibility,wind_speed_10m,dew_point_2m,uv_index" +
      "&hourly=temperature_2m,precipitation_probability,wind_speed_10m" +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,wind_speed_10m_max,wind_gusts_10m_max" +
      "&timezone=auto";

    const [weatherResponse, aqi] = await Promise.all([fetch(forecastUrl), fetchAirQuality(lat, lon)]);
    if (!weatherResponse.ok) throw new Error("Impossible de charger la meteo.");
    const weather = await weatherResponse.json();

    setLocation({ lat, lon, name: locationName });
    setForecast(weather);
    setAirQuality(aqi);
  };

  const geocodeCity = async (city) => {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        city
      )}&count=1&language=fr&format=json`
    );
    const data = await response.json();
    if (!data?.results?.length) throw new Error("Ville introuvable.");
    const place = data.results[0];
    return {
      lat: place.latitude,
      lon: place.longitude,
      name: [place.name, place.admin1, place.country_code].filter(Boolean).join(", "),
    };
  };

  const loadDefault = async () => {
    setLoading(true);
    try {
      await fetchWeatherByCoords(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon, DEFAULT_LOCATION.name);
      setMessage("Previsions chargees.");
    } catch (error) {
      setMessage(String(error?.message || "Erreur de chargement initial."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDefault();
  }, []);

  const onSearch = async () => {
    const city = cityQuery.trim();
    if (!city) {
      setMessage("Entre une ville pour la recherche.");
      return;
    }
    setLoading(true);
    try {
      const place = await geocodeCity(city);
      await fetchWeatherByCoords(place.lat, place.lon, place.name);
      setMessage(`Previsions mises a jour pour ${place.name}.`);
    } catch (error) {
      setMessage(String(error?.message || "Recherche impossible."));
    } finally {
      setLoading(false);
    }
  };

  const onLocate = async () => {
    if (!navigator.geolocation) {
      setMessage("Geolocalisation indisponible sur cet appareil.");
      return;
    }
    if (!window.isSecureContext) {
      setMessage("Le GPS demande un contexte securise (localhost/https).");
      return;
    }

    setLoadingLocate(true);
    try {
      let position;
      try {
        position = await getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0,
        });
      } catch {
        position = await getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 20000,
          maximumAge: 300000,
        });
      }

      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      await fetchWeatherByCoords(lat, lon, "Ma position");
      setMessage("Previsions mises a jour avec ta position.");
    } catch (error) {
      setMessage(getGeoErrorMessage(error));
    } finally {
      setLoadingLocate(false);
    }
  };

  const current = forecast?.current || {};
  const daily = forecast?.daily || {};
  const hourly = forecast?.hourly || {};
  const dailyWeatherCodes = readDailyWeatherCodes(daily);

  const weatherCode = readWeatherCode(current);
  const WeatherIcon = getIconComponent(weatherCode);
  const description = WEATHER_DESCRIPTIONS[weatherCode] || "Conditions variables";

  const alerts = useMemo(() => {
    const list = [];
    const rain = Number(daily?.precipitation_probability_max?.[0] ?? 0);
    const maxWind = Number(daily?.wind_speed_10m_max?.[0] ?? 0);
    const maxTemp = Number(daily?.temperature_2m_max?.[0] ?? 0);
    const minTemp = Number(daily?.temperature_2m_min?.[0] ?? 0);

    if ([95, 96, 99].includes(weatherCode)) list.push("Risque orageux detecte.");
    if (rain >= 70) list.push(`Fort risque de pluie (${rain}%).`);
    if (maxWind >= 50) list.push(`Vent fort attendu (${maxWind} km/h).`);
    if (maxTemp >= 30) list.push("Chaleur marquee.");
    if (minTemp <= -10) list.push("Froid intense / gel.");
    return list;
  }, [daily, weatherCode]);

  const insights = useMemo(() => {
    const temp = Math.round(Number(current.temperature_2m ?? 0));
    const feels = Math.round(Number(current.apparent_temperature ?? 0));
    const maxToday = Math.round(Number(daily?.temperature_2m_max?.[0] ?? 0));
    const minToday = Math.round(Number(daily?.temperature_2m_min?.[0] ?? 0));
    const rainProb = Math.round(Number(daily?.precipitation_probability_max?.[0] ?? 0));
    const windNow = Math.round(readWindCurrent(current));
    return [
      `Temperature actuelle ${temp} deg, ressenti ${feels} deg.`,
      `Aujourd'hui: min ${minToday} deg / max ${maxToday} deg.`,
      rainProb >= 60
        ? `Risque de pluie eleve (${rainProb}%).`
        : rainProb >= 30
        ? `Risque de pluie modere (${rainProb}%).`
        : "Risque de pluie faible.",
      windNow >= 40 ? "Vent soutenu, prudence dehors." : "Vent globalement calme.",
    ];
  }, [current, daily]);

  const messageIsWarning = useMemo(() => {
    const m = message.toLowerCase();
    return (
      m.includes("impossible") ||
      m.includes("erreur") ||
      m.includes("refusee") ||
      m.includes("gps") ||
      m.includes("timeout")
    );
  }, [message]);

  return (
    <section className="panel glass neon">
      <div
        className="row"
        style={{ justifyContent: "space-between", marginBottom: 12, alignItems: "flex-start" }}
      >
        <div>
          <h2 style={{ marginBottom: 6 }}>MAMO meteo</h2>
          <p className="muted">Previsions meteo intelligentes et donnees en temps reel.</p>
        </div>
      </div>

      <div className="row" style={{ marginBottom: 12 }}>
        <div className="row" style={{ flex: 1, minWidth: 280 }}>
          <input
            value={cityQuery}
            onChange={(e) => setCityQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            placeholder="Rechercher une ville..."
          />
          <button onClick={onSearch} disabled={loading}>
            {loading ? <Loader2 className="spin" size={14} /> : <Search size={14} />} Rechercher
          </button>
        </div>
        <button onClick={onLocate} disabled={loadingLocate}>
          {loadingLocate ? <Loader2 className="spin" size={14} /> : <MapPin size={14} />} Ma position
        </button>
      </div>

      <p className={messageIsWarning ? "warn" : "muted"}>{message}</p>

      <div className="grid two" style={{ marginTop: 12 }}>
        <div className="card">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p className="muted" style={{ marginTop: 0, marginBottom: 8, fontSize: 12 }}>
                Conditions actuelles
              </p>
              <h3 style={{ marginBottom: 6 }}>{location.name}</h3>
              <p className="muted">{nowString || "-"}</p>
            </div>
            <WeatherIcon size={42} />
          </div>

          <div className="row" style={{ alignItems: "flex-end", marginTop: 8 }}>
            <div style={{ fontSize: 52, fontWeight: 700, lineHeight: 1 }}>
              {Math.round(Number(current.temperature_2m ?? 0))} deg
            </div>
            <div>
              <p style={{ margin: 0 }}>{description}</p>
              <p className="muted" style={{ margin: 0 }}>
                Ressenti: {Math.round(Number(current.apparent_temperature ?? 0))} deg
              </p>
            </div>
          </div>

          <div
            className="grid"
            style={{ gridTemplateColumns: "repeat(2, minmax(0,1fr))", marginTop: 12 }}
          >
            <div className="card">
              <p className="muted">Vent</p>
              <p className="ok" style={{ margin: 0 }}>
                <Wind size={14} style={{ display: "inline", marginRight: 6 }} />
                {Math.round(readWindCurrent(current))} km/h
              </p>
            </div>
            <div className="card">
              <p className="muted">Humidite</p>
              <p className="ok" style={{ margin: 0 }}>
                <Droplets size={14} style={{ display: "inline", marginRight: 6 }} />
                {Math.round(Number(current.relative_humidity_2m ?? 0))} %
              </p>
            </div>
            <div className="card">
              <p className="muted">Pression</p>
              <p style={{ margin: 0 }}>
                <Gauge size={14} style={{ display: "inline", marginRight: 6 }} />
                {Math.round(Number(current.surface_pressure ?? 0))} hPa
              </p>
            </div>
            <div className="card">
              <p className="muted">Visibilite</p>
              <p style={{ margin: 0 }}>
                <Eye size={14} style={{ display: "inline", marginRight: 6 }} />
                {(Number(current.visibility ?? 0) / 1000).toFixed(1)} km
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Details du jour</h3>
          <div className="grid" style={{ gridTemplateColumns: "repeat(2, minmax(0,1fr))" }}>
            <div className="card">
              <p className="muted">UV</p>
              <p style={{ margin: 0 }}>{current.uv_index ?? "--"}</p>
            </div>
            <div className="card">
              <p className="muted">Pluie</p>
              <p style={{ margin: 0 }}>
                {Math.round(Number(daily?.precipitation_probability_max?.[0] ?? 0))}%
              </p>
            </div>
            <div className="card">
              <p className="muted">Lever</p>
              <p style={{ margin: 0 }}>
                <Sun size={14} style={{ display: "inline", marginRight: 6 }} />
                {daily?.sunrise?.[0] ? toHour(daily.sunrise[0]) : "--:--"}
              </p>
            </div>
            <div className="card">
              <p className="muted">Coucher</p>
              <p style={{ margin: 0 }}>
                <Moon size={14} style={{ display: "inline", marginRight: 6 }} />
                {daily?.sunset?.[0] ? toHour(daily.sunset[0]) : "--:--"}
              </p>
            </div>
            <div className="card" style={{ gridColumn: "1 / -1" }}>
              <p className="muted">Qualite de l'air</p>
              <p style={{ margin: 0 }}>{describeAirQuality(airQuality)}</p>
            </div>
          </div>

          <h3 style={{ marginTop: 12 }}>Alertes meteo</h3>
          {!alerts.length && <p className="muted">Aucune alerte majeure.</p>}
          {alerts.map((item, idx) => (
            <div
              key={idx}
              className="card"
              style={{
                borderColor: "rgba(245,158,11,0.45)",
                background: "rgba(245,158,11,0.08)",
              }}
            >
              <p className="warn" style={{ margin: 0 }}>
                <TriangleAlert size={14} style={{ display: "inline", marginRight: 6 }} />
                {item}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h3 style={{ margin: 0 }}>Evolution sur 24 heures</h3>
          <LineChart size={16} />
        </div>
        <p className="muted">Temperature, pluie et vent heure par heure</p>
        <HourlyTrend hourly={hourly} />
      </div>

      <div className="grid two" style={{ marginTop: 12 }}>
        <div className="card">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h3 style={{ margin: 0 }}>Resume intelligent</h3>
            <Sparkles size={16} />
          </div>
          {insights.map((line, idx) => (
            <p key={idx} className="muted" style={{ marginBottom: 8 }}>
              {line}
            </p>
          ))}
        </div>

        <div className="card">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h3 style={{ margin: 0 }}>Previsions 7 jours</h3>
            <CalendarDays size={16} />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, minmax(120px, 1fr))",
              gap: 8,
              overflowX: "auto",
              paddingBottom: 6,
            }}
          >
            {(daily?.time || []).slice(0, 7).map((iso, idx) => {
              const code = Number(dailyWeatherCodes[idx] ?? 0);
              const DayIcon = getIconComponent(code);
              return (
                <div key={iso} className="card" style={{ minWidth: 120, textAlign: "center" }}>
                  <p className="muted" style={{ marginBottom: 6 }}>
                    {toDayLabel(iso, idx)}
                  </p>
                  <DayIcon size={24} style={{ margin: "0 auto 8px" }} />
                  <p style={{ margin: 0, fontSize: 12 }}>
                    {WEATHER_DESCRIPTIONS[code] || "Variable"}
                  </p>
                  <p style={{ margin: "6px 0 0", fontWeight: 700 }}>
                    {Math.round(Number(daily?.temperature_2m_max?.[idx] ?? 0))} deg
                  </p>
                  <p className="muted" style={{ margin: 0, fontSize: 12 }}>
                    Min {Math.round(Number(daily?.temperature_2m_min?.[idx] ?? 0))} deg
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
