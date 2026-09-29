const hookTripsCatalog = async () => {
    const listEl = document.getElementById('trips-list');
    const templateEl = document.getElementById('trip-card-template');
    const loadingEl = document.getElementById('trips-loading');
    const errorEl = document.getElementById('trips-error');
    const emptyEl = document.getElementById('trips-empty');
    const paginationEl = document.getElementById('trips-pagination');
    const previousButton = document.getElementById('trips-previous');
    const nextButton = document.getElementById('trips-next');
    const pageStatusEl = document.getElementById('trips-page-status');
    const regionSelect = document.getElementById('region-filter');
    const seasonSelect = document.getElementById('season-filter');

    if (!listEl || !templateEl || !regionSelect || !seasonSelect || !paginationEl) {
        return;
    }

    const pageSize = 10;
    let currentPage = 1;
    let trips = [];
    let totalPages = 0;
    let loading = false;

    const renderTrips = () => {
        const selectedRegion = regionSelect.value;
        const selectedSeason = seasonSelect.value;
        const visibleTrips = trips.filter((trip) =>
            (selectedRegion === 'all' || trip.region === selectedRegion) &&
            (selectedSeason === 'all' || trip.bestSeason === selectedSeason)
        );
        const fragment = document.createDocumentFragment();

        visibleTrips.forEach((trip) => {
            const card = templateEl.content.cloneNode(true);
            const cardEl = card.querySelector('.route-card');
            cardEl.classList.add(trip.region);
            card.querySelector('[data-field="name"]').textContent = trip.name;
            card.querySelector('[data-field="region"]').textContent = trip.region;
            card.querySelector('[data-field="start-station"]').textContent = trip.startStation;
            card.querySelector('[data-field="end-station"]').textContent = trip.endStation;
            card.querySelector('[data-field="duration"]').textContent = trip.duration;
            card.querySelector('[data-field="distance"]').textContent = trip.distance;
            card.querySelector('[data-field="description"]').textContent = trip.description;

            const seasonEl = card.querySelector('[data-field="season"]');
            seasonEl.classList.add(`season-${trip.bestSeason}`);
            seasonEl.textContent = `Best in ${trip.bestSeason}`;

            const highlightsEl = card.querySelector('[data-field="highlights"]');
            trip.highlights.forEach((highlight) => {
                const highlightEl = document.createElement('span');
                highlightEl.className = 'highlight-tag';
                highlightEl.textContent = highlight;
                highlightsEl.appendChild(highlightEl);
            });

            const detailsLink = card.querySelector('[data-field="details-link"]');
            detailsLink.href = `/trips/${trip.id}`;
            fragment.appendChild(card);
        });

        listEl.replaceChildren(fragment);
        if (emptyEl) {
            emptyEl.hidden = visibleTrips.length > 0;
        }
    };

    const updatePagination = () => {
        paginationEl.hidden = totalPages === 0;
        previousButton.disabled = loading || currentPage <= 1;
        nextButton.disabled = loading || currentPage >= totalPages;
        pageStatusEl.textContent = totalPages > 0 ? `Page ${currentPage} of ${totalPages}` : '';
    };

    const loadPage = async (page) => {
        loading = true;
        if (loadingEl) {
            loadingEl.hidden = false;
        }
        if (errorEl) {
            errorEl.hidden = true;
        }
        listEl.replaceChildren();
        if (emptyEl) {
            emptyEl.hidden = true;
        }
        updatePagination();

        try {
            const response = await fetch(`/api/trips?page=${page}&limit=${pageSize}`);
            if (!response.ok) {
                throw new Error(`Failed to load trips (${response.status})`);
            }

            const payload = await response.json();
            trips = payload.trips;
            currentPage = payload.pagination.page;
            totalPages = payload.pagination.totalPages;

            if (regionSelect.options.length === 1) {
                payload.filterOptions.regions.forEach((region) => {
                    regionSelect.add(new Option(region.charAt(0).toUpperCase() + region.slice(1), region));
                });
                payload.filterOptions.seasons.forEach((season) => {
                    seasonSelect.add(new Option(season.charAt(0).toUpperCase() + season.slice(1), season));
                });

                const url = new URL(window.location.href);
                regionSelect.value = url.searchParams.get('region') || 'all';
                seasonSelect.value = url.searchParams.get('season') || 'all';
            }

            renderTrips();
        } catch (error) {
            if (errorEl) {
                errorEl.hidden = false;
                errorEl.textContent = 'Unable to load trips right now. Please try again in a moment.';
            }
        } finally {
            loading = false;
            if (loadingEl) {
                loadingEl.hidden = true;
            }
            updatePagination();
        }
    };

    previousButton.addEventListener('click', () => {
        if (!loading && currentPage > 1) {
            loadPage(currentPage - 1);
        }
    });
    nextButton.addEventListener('click', () => {
        if (!loading && currentPage < totalPages) {
            loadPage(currentPage + 1);
        }
    });
    regionSelect.addEventListener('change', renderTrips);
    seasonSelect.addEventListener('change', renderTrips);

    try {
        await loadPage(1);
    } catch (error) {
        if (loadingEl) {
            loadingEl.hidden = true;
        }
        if (errorEl) {
            errorEl.hidden = false;
            errorEl.textContent = 'Unable to load trips right now. Please try again in a moment.';
        }
    }
};

const hookTrainsCatalog = async () => {
    const listEl = document.getElementById('trains-list');
    const templateEl = document.getElementById('train-card-template');
    const loadingEl = document.getElementById('trains-loading');
    const errorEl = document.getElementById('trains-error');

    if (!listEl || !templateEl) {
        return;
    }

    try {
        const response = await fetch('/api/trains');
        if (!response.ok) {
            throw new Error(`Failed to load trains (${response.status})`);
        }

        const payload = await response.json();
        const trains = payload.trains || [];
        const fragment = document.createDocumentFragment();

        trains.forEach((train) => {
            const card = templateEl.content.cloneNode(true);
            const imageEl = card.querySelector('[data-field="image"]');

            imageEl.src = train.imageUrl;
            imageEl.alt = train.imageAlt || `${train.name} train`;

            card.querySelector('[data-field="name"]').textContent = train.name;
            card.querySelector('[data-field="operator"]').textContent = train.operator;
            card.querySelector('[data-field="type"]').textContent = train.type;
            card.querySelector('[data-field="speed"]').textContent = `${train.maxSpeedKmh} km/h`;
            card.querySelector('[data-field="seats"]').textContent = `${train.capacity} seats`;
            card.querySelector('[data-field="power"]').textContent = train.powerSource;
            card.querySelector('[data-field="description"]').textContent = train.description;
            card.querySelector('[data-field="best-for"]').textContent = train.bestFor;

            fragment.appendChild(card);
        });

        listEl.replaceChildren(fragment);
        if (loadingEl) {
            loadingEl.hidden = true;
        }
    } catch (error) {
        if (loadingEl) {
            loadingEl.hidden = true;
        }
        if (errorEl) {
            errorEl.hidden = false;
            errorEl.textContent = 'Unable to load trains right now. Please try again in a moment.';
        }
    }
};

const schedulesHook = async () => {
    const schedules_grid = document.querySelector(".schedules-grid");
    const segments = window.location.pathname.split("/").filter(Boolean);
    const tripId = segments[segments.length - 1];
    const res = await fetch(`/api/trips/${tripId}/schedules`)
    if (!res.ok) throw new Error();
    const schedules = await res.json();

    schedules.schedules.forEach(sched => {
        schedules_grid.appendChild(genCards(sched))
    })
}

const genCards = (sched) => {
    const template = document.querySelector(".schedules-grid-template");
    const clone = template.content.cloneNode(true);

    clone.querySelector(".departure").textContent = sched.departureTime;
    clone.querySelector(".arrival").textContent = sched.arrivalTime;
    clone.querySelector(".book-btn").href = `/trips/booking/${sched.id}`
    const daysOfWeek = clone.querySelector(".schedule-days");

    sched.daysOfWeek.forEach(day => {
        const badge = document.createElement("span");
        badge.classList.add("day-badge");
        badge.textContent = day;

        daysOfWeek.appendChild(badge)
    })
    return clone;
}
// for the bookings list in User Dashboard
const genBookings = async () => {
    console.log("this is running")
    const bookingListContainer = document.querySelector(".booking-list");
    try {
        const res = await fetch("/trips/user-booking")
        if (!res.ok) {
            bookingListContainer.innerHTML = `<div>No bookings</div>`;
            return
        }
        const bookings = await res.json();

        bookings.forEach(item => {
            bookingListContainer.appendChild(genBookCards(item))
        })
    } catch (err) {
        console.error(err);
    }
}

// Generate booking cards
const genBookCards = (details) => {
    const template = document.querySelector(".booking-card");
    const clone = template.content.cloneNode(true);

    clone.querySelector(".booking-id").textContent = details.id;
    clone.querySelector(".booking-class").textContent = details.ticketClass;
    clone.querySelector(".trip").textContent = details.tripId;
    clone.querySelector(".day").textContent = details.selectedDay;
    clone.querySelector(".schedule").textContent = details.selectedDay;
    clone.querySelector(".booking-created").textContent = details.createdAt;

    return clone;
}

document.addEventListener('DOMContentLoaded', () => {
    hookTripsCatalog();
    hookTrainsCatalog();
    schedulesHook();
    genBookings();
});