document.addEventListener("DOMContentLoaded", async () => {
  const selectElement1 = document.getElementById("city-select1");
  const selectElement2 = document.getElementById("city-select2");
  const chartCanvas = document.getElementById("comparisonChart");
  const buttonsContainer = document.createElement("div");
  buttonsContainer.className = "button-container";
  let chart;
  let citiesData;
  let selectedDataKey = "Endring siste år";

  const shortButtonLabels = {
    "Endring siste måned": "1 mnd",
    "Endring sesongjustert siste måned": "Sj. 1 mnd",
    "Endring hittil i år": "I år",
    "Endring siste år": "1 år",
    "Endring siste 5 år": "5 år",
    "Endring siste 10 år": "10 år",
  };

  const createButton = (dataKey) => {
    const button = document.createElement("button");
    button.textContent = shortButtonLabels[dataKey];
    button.addEventListener("click", function () {
      document
        .querySelectorAll("button")
        .forEach((b) => b.classList.remove("active"));

      this.classList.add("active");

      selectedDataKey = dataKey;
      handleCityChange();
    });
    buttonsContainer.appendChild(button);
  };

  [
    "Endring siste måned",
    "Endring sesongjustert siste måned",
    "Endring hittil i år",
    "Endring siste år",
    "Endring siste 5 år",
    "Endring siste 10 år",
  ].forEach(createButton);
  document
    .querySelector("section:last-of-type")
    .insertBefore(buttonsContainer, chartCanvas);

  const populateSelectElement = (selectElement, options, defaultValue) => {
    options.forEach((option) => {
      const opt = document.createElement("option");
      opt.value = option;
      opt.textContent = option;
      selectElement.appendChild(opt);
    });
    if (defaultValue && options.includes(defaultValue)) {
      selectElement.value = defaultValue;
    }
  };

  const convertPercentageToFloat = (value) => {
    if (typeof value === "string" && value.includes("%")) {
      return parseFloat(value.replace("%", "").replace(",", "."));
    }
    return value;
  };

  const cleanData = (data) => {
    const cleanedData = {};
    for (const [city, values] of Object.entries(data)) {
      cleanedData[city] = {};
      for (const [key, value] of Object.entries(values)) {
        cleanedData[city][key] = convertPercentageToFloat(value);
      }
    }
    return cleanedData;
  };

  const fetchCitiesAndData = async () => {
    if (citiesData) return citiesData;

    const url = encodeURIComponent(
      "https://ommu1982.pythonanywhere.com/static/boligprisstatistikk.json"
    );
    try {
      const response = await fetch(` https://corsproxy.io/?${url}`);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const rawData = await response.json();
      citiesData = cleanData(rawData);
      populateTable(citiesData);
      const cities = Object.keys(citiesData);
      populateSelectElement(selectElement1, cities, "Norge");
      populateSelectElement(selectElement2, cities, "Oslo");
      handleCityChange();
      return citiesData;
    } catch (error) {
      console.error("Error loading data:", error);
      throw error;
    }
  };

  const initializeChart = (data1, data2) => {
    if (chart) chart.destroy();

    const currentPrice1 = parseFloat(
      data1["Gjennomsnittspris"]
        .replace(/\s/g, "")
        .replace("kr", "")
        .replace(",", ".")
    );
    const currentPrice2 = parseFloat(
      data2["Gjennomsnittspris"]
        .replace(/\s/g, "")
        .replace("kr", "")
        .replace(",", ".")
    );

    const { labels: labels1, values: values1 } = getChartData(
      currentPrice1,
      data1[selectedDataKey],
      selectedDataKey
    );
    const { labels: labels2, values: values2 } = getChartData(
      currentPrice2,
      data2[selectedDataKey],
      selectedDataKey
    );

    chart = new Chart(chartCanvas, {
      type: "line",
      data: {
        labels: labels1,
        labels2,
        datasets: [
          {
            label: selectElement1.value,
            data: values1,
            borderColor: "rgb(255, 99, 132)",
            pointBackgroundColor: "rgb(255, 99, 132)",
            pointRadius: 8,
            pointHoverRadius: 30,
            tension: 0.4,
          },
          {
            label: selectElement2.value,
            data: values2,
            borderColor: "rgb(54, 162, 235)",
            pointBackgroundColor: "rgb(54, 162, 235)",
            pointRadius: 8,
            pointHoverRadius: 30,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: {
            type: "category",
          },
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  };

  const getChartData = (currentValue, percentChange) => {
    const today = new Date();
    const labels = {
      "Endring siste måned": [
        new Date(today.getFullYear(), today.getMonth() - 1).toLocaleString(
          "default",
          { month: "long", year: "numeric" }
        ),
        today.toLocaleString("default", { month: "long", year: "numeric" }),
      ],
      "Endring sesongjustert siste måned": [
        new Date(today.getFullYear(), today.getMonth() - 1).toLocaleString(
          "default",
          { month: "long", year: "numeric" }
        ),
        today.toLocaleString("default", { month: "long", year: "numeric" }),
      ],
      "Endring hittil i år": [
        new Date(today.getFullYear(), 0).toLocaleString("default", {
          month: "long",
          year: "numeric",
        }),
        today.toLocaleString("default", { month: "long", year: "numeric" }),
      ],
      "Endring siste år": [
        new Date(today.getFullYear() - 1, today.getMonth()).toLocaleString(
          "default",
          { month: "long", year: "numeric" }
        ),
        today.toLocaleString("default", { month: "long", year: "numeric" }),
      ],
      "Endring siste 5 år": [
        new Date(today.getFullYear() - 5, today.getMonth()).toLocaleString(
          "default",
          { month: "long", year: "numeric" }
        ),
        today.toLocaleString("default", { month: "long", year: "numeric" }),
      ],
      "Endring siste 10 år": [
        new Date(today.getFullYear() - 10, today.getMonth()).toLocaleString(
          "default",
          { month: "long", year: "numeric" }
        ),
        today.toLocaleString("default", { month: "long", year: "numeric" }),
      ],
    };
    const values = calculatePrices(currentValue, percentChange);
    return { labels: labels[selectedDataKey], values };
  };

  const calculatePrices = (currentValue, percentChange, selectedDataKey) => {
    let prices = [currentValue];
    let previousPrice;

    switch (selectedDataKey) {
      case "Endring siste måned":
      case "Endring sesongjustert siste måned":
        previousPrice = currentValue / (1 + percentChange / 100);
        break;
      case "Endring hittil i år":
        const monthsInYear = new Date().getMonth() + 1;
        previousPrice =
          currentValue / Math.pow(1 + percentChange / 100, 1 / monthsInYear);
        break;
      case "Endring siste år":
        previousPrice = currentValue / (1 + percentChange / 100);
        break;
      case "Endring siste 5 år":
        previousPrice = currentValue / Math.pow(1 + percentChange / 100, 1 / 5);
        break;
      case "Endring siste 10 år":
        previousPrice =
          currentValue / Math.pow(1 + percentChange / 100, 1 / 10);
        break;
      default:
        previousPrice = currentValue / (1 + percentChange / 100);
    }

    prices.unshift(previousPrice);
    return prices;
  };

  const populateTable = (data) => {
    const tableBody = document
      .getElementById("citiesTable")
      .getElementsByTagName("tbody")[0];
    tableBody.innerHTML = "";

    for (const [city, values] of Object.entries(data)) {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${city}</td>
        <td>${values["Endring siste måned"]}</td>
        <td>${values["Endring sesongjustert siste måned"]}</td>
        <td>${values["Endring hittil i år"]}</td>
        <td>${values["Gjennomsnitt kvm. pris"]}</td>
        <td>${values["Gjennomsnittspris"]}</td>
      `;
      tableBody.appendChild(row);
    }
  };

  const createInfoSection = (data1, data2) => {
    const infoSection = document.getElementById("info-section");
    infoSection.innerHTML = "";

    const city1 = selectElement1.value;
    const city2 = selectElement2.value;

    const selectedDataKey1 = data1[selectedDataKey];
    const selectedDataKey2 = data2[selectedDataKey];
    const averageSquareMeterPrice1 = data1["Gjennomsnitt kvm. pris"];
    const averageSquareMeterPrice2 = data2["Gjennomsnitt kvm. pris"];
    const averagePrice1 = data1["Gjennomsnittspris"];
    const averagePrice2 = data2["Gjennomsnittspris"];

    infoSection.innerHTML = `
      <p>${selectedDataKey}: ${city1} (${selectedDataKey1}%) vs. ${city2} (${selectedDataKey2}%)</p>
      <p>Kvadratmeterpris: ${city1} (${averageSquareMeterPrice1} kr) vs. ${city2} (${averageSquareMeterPrice2} kr)</p>
      <p>Gjennomsnittspris: ${city1} (${averagePrice1} kr) vs. ${city2} (${averagePrice2} kr)</p>
    `;
  };

  const updateChartTitle = () => {
    const city1 = selectElement1.value;
    const city2 = selectElement2.value;
    const chartTitle = document.getElementById("chart-title");
    chartTitle.textContent = `Sammenligning av Boligpriser: ${city1} vs. ${city2}`;
  };

  const handleCityChange = async () => {
    const data = await fetchCitiesAndData();
    createInfoSection(data[selectElement1.value], data[selectElement2.value]);
    updateChartTitle();
    initializeChart(data[selectElement1.value], data[selectElement2.value]);
  };

  await fetchCitiesAndData();

  selectElement1.addEventListener("change", handleCityChange);
  selectElement2.addEventListener("change", handleCityChange);
});
