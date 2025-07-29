// geo-select.js
let currentRegion = "<%= user_profile.region || '' %>";

document.addEventListener("DOMContentLoaded", () => {
  const saveBtn = document.getElementById("guardar-location");
  const regionSelect = document.getElementById("regiao");

  const createOption = (value, text) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = text;
    return option;
  };

  const updateSaveButton = () => {
    if (regionSelect.value && regionSelect.value !== currentRegion) {
      saveBtn.style.display = "inline-block";
    } else {
      saveBtn.style.display = "none";
    }
  };

  regionSelect.addEventListener("change", updateSaveButton);

  console.log("Está a carregar regiões da API para a localização...");

  fetch("https://json.geoapi.pt/distritos?json=1")
    .then((response) => response.json())
    .then((distritos) => {
      console.log("Regioes carregadas:", distritos);

      distritos.forEach((distrito) => {
        const option = createOption(distrito.distrito, distrito.distrito);
        regionSelect.appendChild(option);
      });

      updateSaveButton();
    })
    .catch((error) => {
      console.error("Erro ao carregar regioes:", error);
    });
});
