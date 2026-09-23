
const detailsHook = async () => {
    const routeName = document.querySelector(".route-name");
    const routeDescription = document.querySelector(".route-description");
    const routeImage = document.querySelector(".route-image")
    // containers
    const highlights = document.querySelector(".highlights");
    const operatingSchedule = document.querySelector(".months-grid");
    const schedulesGrid = document.querySelector(".schedules-grid")

    // route info
    const region = document.querySelector(".region");
    const duration = document.querySelector(".duration");
    const distance = document.querySelector(".distance");
    const bestSeason = document.querySelector(".best-season")

    // route stations 
    const startStation = document.querySelector(".start-station")
    const endStation = document.querySelector(".end-station")

    const segments = window.location.pathname.split("/").filter(Boolean);
    const tripId = segments[segments.length - 1];
    const res = await fetch(`/api/trips/${tripId}/schedules`)
    if (!res.ok) throw new Error();
    const result = await res.json();
    const schedule = result.schedules;

    // route header content
    routeName.textContent = `${schedule.name}`
    routeDescription.textContent = `${schedule.description}`

    schedule.highlights.forEach(hl => {
        highlights.appendChild(genHl(hl))
    })

    // image 
    const img = document.createElement('img');
    img.src = schedule.imageUrl;
    img.alt = schedule.name;

    routeImage.appendChild(img)
    // route info
    region.textContent = schedule.region.charAt(0).toUpperCase() + schedule.region.slice(1);
    duration.textContent = schedule.duration;
    distance.textContent = schedule.distance;
    bestSeason.textContent = schedule.bestSeason.charAt(0).toUpperCase() + schedule.bestSeason.slice(1);

    // route stations
    startStation.textContent = schedule.startStation.charAt(0).toUpperCase() + schedule.startStation.slice(1);
    endStation.textContent = schedule.endStation.charAt(0).toUpperCase() + schedule.endStation.slice(1);

    // operating months
    schedule.operatingMonths.forEach(month => {
        operatingSchedule.appendChild(opChild(month))
    })

    // schedules 
    schedule.schedules.forEach(sched => {
        schedulesGrid.appendChild(genScheds(sched))
    })
}

function genHl(highlight) {
    const template = document.querySelector(".highlights-tag-template");
    const clone = template.content.cloneNode(true);
    clone.querySelector(".highlight-tag").textContent = `${highlight.charAt(0).toUpperCase() + highlight.slice(1)}`

    return clone;
}
function opChild(month) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const template = document.querySelector(".month-badge-template");
    const clone = template.content.cloneNode(true);
    // Add an event to point a
    clone.querySelector(".month-badge").textContent = monthNames[month - 1]
    return clone;
}

function genScheds(schedule) {
    const template = document.querySelector(".schedule-card-template");
    const clone = template.content.cloneNode(true);

    clone.querySelector(".depart").textContent = schedule.departureTime;
    clone.querySelector(".arrive").textContent = schedule.arrivalTime;
    const daysOfWeek = clone.querySelector(".schedule-days");
    schedule.daysOfWeek.forEach(day => {
        const span = document.createElement("span");
        span.classList.add("day-badge");
        span.textContent = day
        daysOfWeek.appendChild(span)
    })
    return clone;
}

document.addEventListener("DOMContentLoaded", () => {
    if (window.location.pathname.startsWith("/trips/")) {
        detailsHook();
    }
})