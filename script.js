function showLoadingAnimation()
{
  document.querySelector('.loader').style.display = "flex";
  document.querySelector('.weather').style.display = "none";
}

function hideLoadingAnimation()
{
  document.querySelector('.loader').style.display = "none";
  document.querySelector('.weather').style.display = "unset";
}

showLoadingAnimation();
location_access()
  .then(() =>{
    hideLoadingAnimation();
  })


let search_text;
let list_count_track;

let search_div = document.getElementById("search");
let searchbar = document.getElementsByClassName("searchbar")[0];

document.addEventListener("click", (event) => {
  if (!searchbar.contains(event.target)) {
    document.getElementById("list").style.display = "none";
  }
});

search_div.addEventListener("focus", () => {
  if (search_div.value.length > 2) {
    search_text = document.getElementById("search").value;
    document.getElementById("list").style.display = "unset";
    autocomplete(search_div.value, "address");
    search_div.removeEventListener("focus", search_div);
  }
});

function input_changed() {
  if (search_div.value.length < 3) {
    document.getElementById("list").style.display = "none";
  } else {
    search_text = document.getElementById("search").value;
    document.getElementById("list").style.display = "unset";
    autocomplete(search_div.value, "address");
  }
}

async function autocomplete(location, type) {
  let count = 0;
  list_count_track = 0;
  let api_response;
  await fetch(
    `https://api.geoapify.com/v1/geocode/autocomplete?text=${location}&apiKey=6d962d3d6f0f4dc4ab8149a67362be81`
  )
    .then((response) => response.json())
    .then((result) => (api_response = result));

  let obj = {};
  obj[type === "address" ? "name" : "suburb"] = "";
  obj.county = "";
  obj.state = "";
  obj.country = "";
  obj.lon = "";
  obj.lat = "";

  if (list.firstChild) {
    while (list.firstChild) {
      list.firstChild.remove();
    }
  }

  obj_search_list = [];

  while (count < api_response.features.length) {
    let a = {};
    for (i = 0; i < Object.keys(obj).length; i++) {
      a[Object.keys(obj)[i]] =
        api_response.features[count].properties[Object.keys(obj)[i]];
    }
    obj_search_list.push(a);
    if (type === "coordinates") {
      object_received(a);
      search_div.value = generate_search_string(a);

    } else {
      updateSearchList(a);
    }
    count++;
  }

  listItemsClicked(obj_search_list);
}

function updateSearchList(obj) {
  let str = generate_search_string(obj);
  let list = document.getElementById("list");
  let element = document.createElement("span");
  element.classList.add("list_item");
  element.innerHTML = str;
  list.appendChild(element);
  listItemsClicked(obj);
}

function generate_search_string(obj) {
  let str = "";
  for (let i in obj) {
    if (obj[i] !== undefined && i !== "country" && i !== "lat" && i !== "lon") {
      str = str + obj[i] + " , ";
    } else if (i === "country") {
      str = str + obj[i];
    }
  }
  return str;
}

function listItemsClicked(obj_search_list) {
  let location_list = document.getElementsByClassName("list_item");
  for (let i = 0; i < location_list.length; i++) {
    location_list[i].addEventListener("click", () => {
      document.getElementById("search").value = location_list[i].innerHTML;
      document.getElementById("list").style.display = "none";
      let temp = obj_search_list[i];
      if (temp && temp.lat !== undefined && temp.lon !== undefined) {
        object_received(temp);
      }
    });
  }
}

function current_location() {
  navigator.geolocation.getCurrentPosition(onSuccess, onError);
}

function onSuccess(position) {
  const { latitude, longitude } = position.coords;
  str = `${latitude},${longitude}`;
  autocomplete(str, "coordinates");
}

function onError() {
  console.log(`Failed to get your location!`);
}

async function fetchWeatherData(link) {
  let api_response = await fetch(link).then((response) => response.json());
  let currentWeather = {};
  currentWeather.current_temp = api_response.current.temp_c;
  currentWeather.text = api_response.current.condition.text;
  currentWeather.icon = api_response.current.condition.icon;
  currentWeather.current_time = api_response.current.last_updated.slice(11,13);
  let time = api_response.current.last_updated.slice(11,13);
  if(time.slice(0,1) == "0"){
    currentHour = time.slice(1,2)
  }else{
    currentHour = time
  }
  let hourlyWeather = [];
  let dailyWeather = [];

  for (let i = currentHour; i < 24; i++) {
    if (hourlyWeather.length < 10) {
      let response = api_response.forecast.forecastday[0].hour[i];
      let obj = {};
      obj.current_temp = parseInt(response.temp_c);
      obj.current_time = response.time.slice(11);
      obj.text = response.condition.text;
      obj.icon = response.condition.icon;
      hourlyWeather.push(obj);
    } else {
      break;
    }
  }
  let i = 0
  while (hourlyWeather.length < 10) {
    let response =
      api_response.forecast.forecastday[1].hour[i++];
    let obj = {};
    obj.current_temp = parseInt(response.temp_c);
    obj.current_time = response.time.slice(11);
    obj.text = response.condition.text;
    obj.icon = response.condition.icon;
    hourlyWeather.push(obj);
  }

  let response = api_response.forecast.forecastday;
  let sunset_data = response[0].astro.sunset;
  let sunrise_data = response[0].astro.sunrise;
  let sunset_time = sunset_data.slice(0,2);
  let sunrise_time = sunrise_data.slice(0,2);
  if(sunset_data.includes("PM"))
    sunset_time = Number(sunset_time) + 12;
  if(sunrise_data.includes("PM"))
    sunrise_time = Number(sunrise_time) + 12;
  for (let i = 0; i < response.length; i++) {
    let obj = {};
    if(i == 0)
    {
      obj.sunset_time = sunset_time;
      obj.sunrise_time = sunrise_time;
    }
    obj.date = response[i].date;
    obj.text = response[i].day.condition.text;
    obj.icon = response[i].day.condition.icon;
    obj.max_temp = parseInt(response[i].day.maxtemp_c);
    obj.min_temp = parseInt(response[i].day.mintemp_c);
    dailyWeather.push(obj);
  }
  return [currentWeather, hourlyWeather, dailyWeather];
}

async function object_received(obj) {
  let a = document.getElementById("box1");
  let b = document.getElementById("box2");
  let link = `http://api.weatherapi.com/v1/forecast.json?key=3605460f65b34df89f3144948231608&q=${obj.lat},${obj.lon}&days=10&aqi=no&alerts=no`;
  let result = await fetchWeatherData(link);
  let currentWeather = result[0]
  b.getElementsByTagName("img")[0].src = currentWeather.icon
  let hourlyWeather = result[1]
  let dailyWeather = result[2]
  a.innerHTML = parseInt(currentWeather.current_temp)+"&deg;C"
  b.getElementsByClassName("text")[0].innerHTML = currentWeather.text

  change_background(currentWeather.current_time,dailyWeather[0].sunset_time, dailyWeather[0].sunrise_time);

  let c = document.getElementsByClassName("hourly_weather")
  for(let i = 0 ; i < hourlyWeather.length ; i++){
    c[i].getElementsByTagName("img")[0].src = hourlyWeather[i].icon
    c[i].getElementsByClassName("time")[0].innerHTML = hourlyWeather[i].current_time
    c[i].getElementsByClassName("text")[0].innerHTML = hourlyWeather[i].text
    c[i].getElementsByClassName("temperature")[0].innerHTML = hourlyWeather[i].current_temp+"&deg;C"
  }

  let d = document.getElementsByClassName("day")
  for(let i = 0 ; i < dailyWeather.length ; i++){
    d[i].getElementsByClassName("date")[0].innerHTML = dailyWeather[i].date
    d[i].getElementsByClassName("status")[0].innerHTML = dailyWeather[i].text
    d[i].getElementsByTagName("img")[0].src = dailyWeather[i].icon
    d[i].getElementsByClassName("max_temp")[0].innerHTML = dailyWeather[i].max_temp+"&deg;C"
    d[i].getElementsByClassName("min_temp")[0].innerHTML = dailyWeather[i].min_temp+"&deg;C"
  }
}

function change_background(current_time, sunset_time, sunrise_time)
{
  let weather_status = document.getElementById("box2").getElementsByClassName("text")[0].innerHTML;
  let dynamic_weather_elements = document.body.getElementsByClassName("dynamic_weather_elements")[0];

  if (weather_status.toLowerCase().includes("rain") || weather_status.toLowerCase().includes("thunder")) {
    document.body.id = "rainy";
    if (dynamic_weather_elements) {
      dynamic_weather_elements.remove();
    }
    let element = document.createElement("div");
    element.classList.add("dynamic_weather_elements");
    document.body.appendChild(element);
    for (let i = 0; i < 150; i++) {
      const rain = document.createElement('div');
      rain.classList.add('rain');
      rain.style.right = `${Math.random() * 150}%`;
      rain.style.overflowX = "hidden";
      rain.style.animationDelay = `${Math.random() * 2}s`;
      rain.style.rotate = "-25deg";
      document.body.querySelector('.dynamic_weather_elements').appendChild(rain);
    }
    const root = document.documentElement;
    root.style.setProperty('--font-color','white');
    root.style.setProperty('--box-shadow','0.1px 0.1px 10px rgba(0, 0, 0, 0.1), -0.1px -0.1px 10px rgba(0, 0, 0, 0.1)');
  }
  
  else if(weather_status.toLowerCase().includes("sunny"))
  {
    document.body.id = "sunny";
    if(dynamic_weather_elements)
    {
      dynamic_weather_elements.remove();
    }
    let element = document.createElement("div");
    element.classList.add("dynamic_weather_elements");
    document.body.appendChild(element);
    element = document.createElement("div");
    element.classList.add("sun");
    document.body.querySelector('.dynamic_weather_elements').appendChild(element);
    const root = document.documentElement;
    root.style.setProperty('--font-color','white');
    root.style.setProperty('--box-shadow','0.1px 0.1px 10px rgba(0, 0, 0, 0.1), -0.1px -0.1px 10px rgba(0, 0, 0, 0.1)');
  }
  else if(weather_status.toLowerCase().includes("fog") || weather_status.toLowerCase().includes("mist"))
  {
    document.body.id = "fog";
    if(dynamic_weather_elements)
    {
      dynamic_weather_elements.remove();
    }
    const root = document.documentElement;
    root.style.setProperty('--font-color','black');
    root.style.setProperty('--box-shadow','0.1px 0.1px 10px rgba(0, 0, 0, 0.1), -0.1px -0.1px 10px rgba(0, 0, 0, 0.1)');
  }
  else if(weather_status.toLowerCase().includes("blizzard") || weather_status.toLowerCase().includes("snow"))
  {
    document.body.id = "snow";
    if(dynamic_weather_elements)
    {
      dynamic_weather_elements.remove();
    }
      let element = document.createElement("div");
      element.classList.add("dynamic_weather_elements");
      document.body.appendChild(element);
      for (let i = 0; i < 250; i++) 
      {
        const snow = document.createElement('snow');
        snow.classList.add('snow');
        snow.style.left = `${Math.random() * 110}%`;
        snow.style.animationDelay = `${Math.random() * 10}s`;
        snow.style.overflowY = "hidden";
        document.body.querySelector('.dynamic_weather_elements').appendChild(snow);
      }
      const root = document.documentElement;
      root.style.setProperty('--font-color','black');
      root.style.setProperty('--box-shadow','0.1px 0.1px 10px rgba(0, 0, 0, 0.1), -0.1px -0.1px 10px rgba(0, 0, 0, 0.1)');
  }
  else if(weather_status.toLowerCase().includes("cloudy") || weather_status.toLowerCase().includes("overcast"))
  {
      if(dynamic_weather_elements)
      {
        dynamic_weather_elements.remove();
      }

      let element = document.createElement("div");
      element.classList.add("dynamic_weather_elements")
      document.body.appendChild(element);

      element = document.createElement("div")
      element.classList.add("cloudBase");
      document.body.querySelector('.dynamic_weather_elements').appendChild(element);
      element = document.createElement("div")
      document.body.querySelector('.cloudBase').appendChild(element)
      if(current_time % 24 > (sunset_time) % 24 || current_time % 24 < (sunrise_time) % 24  )
      {
        const root = document.documentElement;
        root.style.setProperty('--font-color','white');
        root.style.setProperty('--box-shadow','0.1px 0.1px 10px rgba(255, 255, 255, 0.057), -0.1px -0.1px 10px rgba(255, 254, 254, 0.084)');
        document.body.id = "night";
        element = document.createElement("div")
        element.classList.add("moon")
        document.body.querySelector('.dynamic_weather_elements').appendChild(element);
      }
      else
      {
        const root = document.documentElement;
        root.style.setProperty('--font-color','black');
        root.style.setProperty('--box-shadow','0.1px 0.1px 10px rgba(255, 255, 255, 0.057), -0.1px -0.1px 10px rgba(255, 254, 254, 0.084)');
        document.body.id = "cloudy_day";
        element = document.createElement("div")
        element.classList.add("sun")
        document.body.querySelector('.dynamic_weather_elements').appendChild(element);
      }
  }
  else if(weather_status.toLowerCase().includes("clear"))
  {
    if(dynamic_weather_elements)
    {
      dynamic_weather_elements.remove();
    }

    let element = document.createElement("div");
    element.classList.add("dynamic_weather_elements")
    document.body.appendChild(element);
    console.log(sunrise_time)
    console.log(sunset_time)
    console.log(current_time)
    if(current_time % 24 > (sunset_time) % 24 || current_time % 24 < (sunrise_time) % 24)
    {
      const root = document.documentElement;
      root.style.setProperty('--font-color','white');
      root.style.setProperty('--box-shadow','0.1px 0.1px 10px rgba(255, 255, 255, 0.057), -0.1px -0.1px 10px rgba(255, 254, 254, 0.084)');
      document.body.id = "night";
      element = document.createElement("div");
      element.classList.add("moon")
      document.body.querySelector('.dynamic_weather_elements').appendChild(element);
    }
    else
    {
      const root = document.documentElement;
      root.style.setProperty('--font-color','white');
      root.style.setProperty('--box-shadow','0.1px 0.1px 10px rgba(0, 0, 0, 0.1), -0.1px -0.1px 10px rgba(0, 0, 0, 0.1)');
      document.body.id = "sunny";
      element = document.createElement("div");
      element.classList.add("sun")
      document.body.querySelector('.dynamic_weather_elements').appendChild(element);
    }
  }
}

function location_access()
{
  return new Promise( async(resolve, reject) =>{
    try{
    navigator.geolocation.getCurrentPosition(async (position) =>{
      const { latitude, longitude } = position.coords
      str = `${latitude},${longitude}`;
      await autocomplete(str,"coordinates");
      resolve();
    })}
    catch(error){
      reject();
    }
  })
}