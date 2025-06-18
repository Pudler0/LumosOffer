import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

app.post("/api/solarinfo", async (req, res) => {
  const address = req.body.address;
  if (!address) return res.status(400).json({ error: "No address provided" });

  try {
    const geo = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
      params: { address, key: process.env.GOOGLE_MAPS_API_KEY },
    });

    const location = geo.data.results[0].geometry.location;
    const lat = location.lat;
    const lon = location.lng;

    const pvgis = await axios.get(
      `https://re.jrc.ec.europa.eu/api/PVcalc?lat=${lat}&lon=${lon}&peakpower=10&loss=14`
    );

    const solar_kwh_year = Math.round(pvgis.data.outputs.totals.fixed.E_y);

    res.json({
      solar_kwh_year,
      roof_angle: 30,
      roof_orientation: "SW",
      suitability: solar_kwh_year > 7000 ? "Sehr gut" : "Gut",
    });
  } catch (e) {
    res.status(500).json({ error: "Something went wrong", details: e.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Server running on port", port));
