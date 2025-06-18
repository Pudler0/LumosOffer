import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.urlencoded({ extended: true }));

app.post("/api/solarinfo", async (req, res) => {
  const address = req.body.address;
  if (!address) return res.status(400).json({ error: "No address provided" });

  try {
    // 1. Adresse → Koordinaten
    const geo = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
      params: { address, key: process.env.GOOGLE_MAPS_API_KEY },
    });

    if (!geo.data.results.length) {
      return res.status(400).json({ error: "Ungültige Adresse" });
    }

    const location = geo.data.results[0].geometry.location;
    const lat = location.lat;
    const lon = location.lng;

    // 2. PVGIS API aufrufen
    const pvgis = await axios.get(`https://re.jrc.ec.europa.eu/api/PVcalc`, {
      params: {
        lat,
        lon,
        peakpower: 10,
        loss: 14,
        outputformat: "json",
      }
    });

    const data = pvgis.data;
    const E_y = data?.outputs?.totals?.fixed?.E_y;

    if (!E_y) {
      return res.status(500).json({ error: "PVGIS response incomplete" });
    }

    const solar_kwh_year = Math.round(E_y);

    res.json({
      solar_kwh_year,
      roof_angle: 30,
      roof_orientation: "SW",
      suitability: solar_kwh_year > 7000 ? "Sehr gut" : "Gut",
    });

  } catch (e) {
    console.error(e.message);
    return res.status(500).json({ error: "Server error", details: e.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Server running on port", port));
