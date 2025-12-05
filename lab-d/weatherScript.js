class WeatherApp {
    constructor(apiKey, resultsBlockSelector) {
        this.apiKey = apiKey;
        this.resultsBlock = document.querySelector(resultsBlockSelector);

        this.currentWeatherLink =
            "https://api.openweathermap.org/data/2.5/weather?q={query}&appid=" +
            this.apiKey +
            "&units=metric&lang=pl";

        this.forecastLink =
            "https://api.openweathermap.org/data/2.5/forecast?q={query}&appid=" +
            this.apiKey +
            "&units=metric&lang=pl";
    }




    getCurrentWeather(query) {
        const url = this.currentWeatherLink.replace("{query}", query);
        const req = new XMLHttpRequest();

        req.open("GET", url, true);

        req.addEventListener("load", () => {
            console.log("Odpowiedź CURRENT WEATHER:", req.responseText);

            try {
                this.currentWeather = JSON.parse(req.responseText);
                this.drawWeather();
            } catch (err) {
                console.error("Błąd pobierania current przez XML:", err);
            }
        });

        req.send();
    }




    getForecast(query) {
        const url = this.forecastLink.replace("{query}", query);

        fetch(url)
            .then(response => response.json())
            .then(data => {
                console.log("Odpowiedź FORECAST (fetch):", data);

                if (!data.list) {
                    throw new Error("Brak danych prognozy.");
                }

                this.forecast = data.list;
                this.drawWeather();
            })
            .catch(err => {
                console.error("Błąd pobierania forecast przez fetch:", err);
            });
    }




    getWeather(query) {
        this.resultsBlock.innerHTML = "";
        this.getCurrentWeather(query);
        this.getForecast(query);
    }




    drawWeather() {
        this.resultsBlock.innerHTML = "";


        if (this.currentWeather) {
            const date = new Date(this.currentWeather.dt * 1000);
            const temp = this.currentWeather.main.temp;
            const feels = this.currentWeather.main.feels_like;
            const icon = this.currentWeather.weather[0].icon;
            const desc = this.currentWeather.weather[0].description;

            const block = this.createWeatherBlock(
                `${date.toLocaleDateString("pl-PL")} ${date.toLocaleTimeString("pl-PL")}`,
                `${temp} °C`,
                `Odczuwalna ${feels} °C`,
                icon,
                desc
            );

            this.resultsBlock.appendChild(block);
        }


        if (this.forecast) {
            for (const item of this.forecast) {
                const date = new Date(item.dt * 1000);

                const block = this.createWeatherBlock(
                    `${date.toLocaleDateString("pl-PL")} ${date.toLocaleTimeString("pl-PL")}`,
                    `${item.main.temp} °C`,
                    `Odczuwalna ${item.main.feels_like} °C`,
                    item.weather[0].icon,
                    item.weather[0].description
                );

                this.resultsBlock.appendChild(block);
            }
        }
    }




    createWeatherBlock(dateString, temp, feelsTemp, icon, desc) {
        const weatherBlock = document.createElement("div");
        weatherBlock.className = "weather-block";

        weatherBlock.innerHTML = `
            <div class="weather-date">${dateString}</div>
            <div class="weather-temperature">${temp}</div>
            <div class="weather-temperature-feels-like">${feelsTemp}</div>
            <img class="weather-icon" src="https://openweathermap.org/img/wn/${icon}@2x.png">
            <div class="weather-description">${desc}</div>
        `;

        return weatherBlock;
    }
}





document.weatherApp = new WeatherApp(
    "fa3d2aab4fd4debeabecd57f6fc32948",
    "#weather-results-container"
);

document.querySelector("#checkButton").addEventListener("click", () => {
    const query = document.querySelector("#locationInput").value;
    document.weatherApp.getWeather(query);
});
