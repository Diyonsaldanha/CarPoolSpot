const express = require("express");
const { isSignedin } = require("../Controllers/authenticate");

var router = express.Router()
const { drive, ride, cancelTrip, tripDone, tripHistory, activeTrip, isDriver ,respondToRideRequest ,accept,decline,getRideRequests,tripEdit,getRideStatus} = require("../Controllers/trip.js");

router.post("/trip/drive", isSignedin, drive)  // Swagger Api done
router.post("/trip/ride", isSignedin, ride)    //Swagger Api done
router.delete("/trip", isSignedin, cancelTrip) // Swagger Api pending
router.post("/trip/done", isSignedin, tripDone) // Swagger Api pending
router.get("/trip/history", isSignedin, tripHistory)// Swagger Api pending
router.get("/trip/isdriver", isSignedin, isDriver) 
router.get("/trip/activetrip", isSignedin, activeTrip)
router.get("/trip/pendingrequest", isSignedin, getRideRequests)
router.post("/trip/respondrequest", isSignedin, respondToRideRequest)
router.post("/trip/accept", isSignedin, accept)
router.post("/trip/decline", isSignedin, decline)
router.post("/trip/edit", isSignedin, tripEdit)
router.get("/trip/checkstatus", isSignedin, getRideStatus)




module.exports = router;
