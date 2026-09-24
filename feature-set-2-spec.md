# Feature Set 2 : Schedules

## Tasks:
    [] - Create the Mongoose schema for schedules in src/models/schemas/schedules.js.
    [] - Create the following model function in src/models/schedules.js. (This function should use Mongoose and your new schema to query the database and return the results.) 
    [] - Create the following API controller function in src/controllers/schedules.js. (This should send JSON responses with the appropriate status codes for success, failure, and so forth.)
    [] - Create the following API route in src/routes/api-routes.js (including Swagger documentation):
                - /api/trips/{id}/schedules: returns the schedules for a trip.
                - /api/trips/{id}/schedules?month={month}: returns the schedules for a trip in a specific month.
    [] - Update the trip details page (src/view/trips/details.ejs) so the schedules component is powered by the API and updates when the user selects a month. When the user selects a month, the client-side JavaScript should fetch the relevant schedule data from the API and update the displayed schedules accordingly.
    [] - Update the existing trip details EJS controller function. It should no longer need to get the schedules, because those will be populated later on the client side.


## Issues:

#### Issue 1: 
    - Create the Mongoose schema for schedules in src/models/schemas/schedules.js.

        `Example Data`
            Schema :  {
                "id": 1, 
                "tripId": "alpine-panorama",
                "departureTime": "08:30",
                "arrivalTime": "13:00",
                "daysOfWeek": ["monday", "tuesday", "wednesday", "thursday", "friday"],
                "status": true
            }

        -  id : number
        - tripId : enum [
            alpine-panorama
            coastal-breeze
            sakura-valley
            gorge-explorer
            winter-wetlands
            romantic-gorge
        ]
        - departureTime : DateTime - Get Time Of Day
        - arrivalTime : DateTime - Get Time Of Dya 
        - daysOfWeek : enum [Days of the week]
        - status : boolean

#### Issue 2: 

    - Create the following model function in src/models/schedules.js. (This function should use Mongoose and your new schema to query the database and return the results.) 

        - (getSchedulesByTripId, which receives a trip ID and an optional month number and returns the schedules for that trip.)


#### Issue 3: 

    - Create the following API controller function in src/controllers/schedules.js. (This should send JSON responses with the appropriate status codes for success, failure, and so forth.)

        - getSchedulesForTrip: Receives a trip ID. 
        - getSchedulesForTripAndMonth: Receives a trip ID and a month number.

#### Issue 4:
    - Create the following API route in src/routes/api-routes.js (including Swagger documentation):

        - /api/trips/{id}/schedules: returns the schedules for a trip.

            - Reponses :
                200 : Returns a list of schedules for a trip
                404 :  The trip does not exist 
                400 : Trip id is not a valid id 
                500 : Internal Server Error

        - /api/trips/{id}/schedules?month={month}: returns the schedules for a trip in a specific month.

            - Responses: 
                200 : returns a list of trips of a specific month 
                400 : query is not a month, provide a valid month

#### Issue 5: 
    - Update the trip details page (src/view/trips/details.ejs) so the schedules component is powered by the API and updates when the user selects a month. When the user selects a month, the client-side JavaScript should fetch the relevant schedule data from the API and update the displayed schedules accordingly.

#### Issue 6: 
    - Update the existing trip details EJS controller function. It should no longer need to get the schedules, because those will be populated later on the client side.