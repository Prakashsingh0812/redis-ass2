const express = require('express');
const axios = require('axios');
const redis = require('ioredis');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const redisClient = require('./redisClient');

// Route to fetch weather data
app.get('/weather/:city', async (req, res) => {
    const city = req.params.city;

    // Check Redis for cached weather data
    redisClient.get(city, async (err, data) => {
        if (data) {
            // Return cached data
            return res.json({ source: 'cache', data: JSON.parse(data) });
        }

        try {
            // Fetch data from external API
            const response = await axios.get(`http://api.weatherapi.com/v1/current.json?key=&q=London&aqi=no`, {
                params: {
                    q: city,
                    appid: process.env.OPENWEATHERMAP_API_KEY,
                }
            });

            const weatherData = response.data;

            // Cache the result in Redis for 10 minutes
            redisClient.setex(city, 600, JSON.stringify(weatherData));

            res.json({ source: 'api', data: weatherData });
        } catch (error) {
            res.status(500).send('Error fetching weather data');
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
