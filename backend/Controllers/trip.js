const Trip = require("../Models/tripModel");
const User = require("../Models/user");
const dotenv = require("dotenv");
const { Client } = require("@googlemaps/google-maps-services-js");
const RideRequest = require("../Models/rideRequestModel");

var polylineUtil = require('@mapbox/polyline');
// const mapsClient = new Client({});
const { PolyUtil } = require("node-geometry-library");
dotenv.config()

// const MS_PER_MINUTE = 60000;
const offsetDurationInMinutes = 15;
const pct = .3; // Percent of route points for source (others are checked for destination)
const radiusOffset = 50;    //TODO: TUNE

// Create a new Google Maps client
const mapsClient = new Client({
    apiKey: process.env.MAPS_API_KEY,
  });

// const RideRequest = require("../Models/rideRequestModel"); // Assuming you have this model
// ...

// Add the new function here
function sendRideRequest(driverId, riderId,src, dst, callback) {
    // Create a new ride request and save it to the database
    const rideRequest = new RideRequest({
        driver: driverId,
        rider: riderId,
        src: {
            type: "Point",
            coordinates: [src.lng, src.lat]
        },
        dst: {
            type: "Point",
            coordinates: [dst.lng, dst.lat]
        },
        status: 'pending', 
    });

    rideRequest.save((err, request) => {
        if (err) {
            console.log(err);
            callback(err, null);
        } else {
            callback(null, request);
        }
    });
}



exports.activeTrip = (req, res) => {
  var riderArray = [];
  User.findById(req.auth._id, (err, user) => {
    if (user.active_trip == undefined || user.active_trip == null) {
      res.statusMessage = "No active trip";
      return res.status(400).end();
    }

    Trip.findById(user.active_trip, (err, trip) => {
      if (!trip) {
        res.statusMessage = "Trip not found";
        return res.status(404).end();
      }

      User.findById(trip.driver, (err, user_driver) => {
        if (!user_driver) {
          res.statusMessage = "Driver not found";
          return res.status(404).end();
        }

        const riders = trip.riders;

        if (riders.length === 0) {
          res.status(200).json({
            ...trip._doc,
            riders: [],
            driver: user_driver.name + ' ' + user_driver.lastname,
            driverPhone: user_driver.phone_number,
          });
        } else {
          var i = 0;
          riders.forEach(rider => {
            User.findById(rider, (err, user_rider) => {
              if (!user_rider) {
                res.statusMessage = "Rider not found";
                return res.status(404).end();
              }

              riderArray.push({
                name: String(user_rider.name + ' ' + user_rider.lastname),
                phone: user_rider.phone_number,
              });

              i++;
              if (i === riders.length) {
                res.status(200).json({
                  ...trip._doc,
                  riders: riderArray,
                  driver: user_driver.name + ' ' + user_driver.lastname,
                  driverPhone: user_driver.phone_number,
                });
              }
            });
          });
        }
      });
    });
  });
};



exports.drive = (req, res) => {
    User.findById(req.auth._id, (err, user) => {
        if (err)
            return res.status(500).end();
        if (user.active_trip == undefined || user.active_trip == null) {
            const tripObj = new Trip({
                driver: req.auth._id,
                source: req.body.src,
                destination: req.body.dst,
                route: req.body.route,
                dateTime: new Date(req.body.dateTime),
                max_riders: req.body.max_riders,
            });
            tripObj.save((err, trip) => {
                if (err) // TODO: ?Handle error coming due to not selecting all the required fields?
                    return res.status(500).end();
                res.status(200).json(trip);
                user.active_trip = trip._id;
                user.trip_role_driver = true;
                user.save((err) => {
                    if (err) {
                        trip.deleteOne();
                        return res.status(500).end();
                    }
                    return res;
                })
                return res.status(500).end();
            })
        } else {
            //TODO: revert
            res.statusMessage = "A trip is already active";
            return res.status(400).end();
        }
    })
}

// ...USED TO SEND REQUEST TO THE DRIVER
exports.ride = (req, res) => {
    User.findById(req.auth._id, (err, user) => {
        if (user.active_trip == undefined || user.active_trip == null) {
            //Matching logic START
            let startDateTime = new Date(req.body.dateTime);
            startDateTime.setMinutes(startDateTime.getMinutes() - offsetDurationInMinutes);
            let endDateTime = new Date(req.body.dateTime);
            endDateTime.setMinutes(endDateTime.getMinutes() + offsetDurationInMinutes);
            Trip.find({
                completed: false,   //trip is active
                available_riders: true,
                date: {
                    $gte: startDateTime,
                    $lte: endDateTime
                },
            }, function (err, trips) {
                if (err) {
                    res.statusMessage = "No matches found. No trips around your time.";
                    return res.status(400).end();
                }
                var trip;
                trips.forEach(tempTrip => {
                    const pctLen = parseInt(tempTrip.route.length * pct)
                    let found = PolyUtil.isLocationOnPath(
                        req.body.src,
                        tempTrip.route.slice(0, pctLen),
                        radiusOffset
                    );
                    if (found) {
                        found = PolyUtil.isLocationOnPath(
                            req.body.dst,
                            tempTrip.route.slice(pctLen),
                            radiusOffset
                        );
                        if (found) {
                            trip = tempTrip;
                            return;
                        }
                    }
                });
                //Matching logic END
                if (trip == undefined || trip == null) {
                    res.statusMessage = "No match found";
                    return res.status(400).end();
                }

                // New step: Send ride request to driver
                sendRideRequest(trip.driver, req.auth._id, req.body.src, req.body.dst, (err, driverResponse) => {
                    if (err) {
                        res.statusMessage = "Error sending ride request";
                        return res.status(500).end();
                    }
                   

                    if (!driverResponse.accepted) {
                        res.statusMessage = "Request sent to driver";
                        return res.status(400).end();
                    }
                    else{
                        res.statusMessage = "Some error occured..";
                        return res.status(400).end();
                    }

                    trip.waypoints = [...trip.waypoints, req.body.src, req.body.dst];
                    // Continue with the rest of the logic to add rider to the trip as before
                    //...
                });
            });
        } else {
            res.statusMessage = "A trip is already active";
            return res.status(400).end();
        }
    })
}

exports.cancelTrip = (req, res) => {
    User.findById(req.auth._id, (err, user) => {
        // if (err)
        //     return res.status(500).end();
        if (user.active_trip == undefined || user.active_trip == null) {
            res.statusMessage = "No active trip";
            return res.status(400).end();
        } else {
            Trip.findById(user.active_trip, (err, trip) => {
                // if (err)
                //     return res.status(500).end();
                if (trip) {
                    if (user.trip_role_driver) {
                        trip.riders.forEach(rider => {  //3
                            User.findById(rider, (err, user_rider) => {
                                if (err)
                                    return res.status(500).end();
                                else {
                                    user_rider.active_trip = null;
                                    user_rider.trip_role_driver = null;
                                    user_rider.save((err) => {
                                        // if (err) {
                                        //     //TODO: revert
                                        //     res.statusMessage = "Error in saving user data for a rider.";
                                        //     return res.status(500).end();
                                        // }
                                    })
                                }
                            })
                        });
                        trip.deleteOne((err) => {
                            // if (err) {
                            //     res.statusMessage = "Error in deleting trip object";
                            //     return res.status(500).end();
                            // }
                        });
                    } else {
                        const riderIndex = trip.riders.indexOf(user._id);
                        trip.waypoints.splice(riderIndex * 2, 2);
                        mapsClient.directions({
                            params: {
                                origin: trip.source,
                                destination: trip.destination,
                                waypoints: trip.waypoints,
                                drivingOptions: {
                                    departureTime: new Date(trip.dateTime),  // for the time N milliseconds from now.
                                },
                                optimize: true,
                                key: process.env.MAPS_API_KEY
                            },
                            timeout: 2000, // milliseconds
                        })
                            .then((r) => {
                                const routeArray = polylineUtil.decode(r.data.routes[0].overview_polyline.points);
                                trip.route = Object.values(routeArray)
                                    .map(item => ({ lat: item[0], lng: item[1] }));
                                trip.riders.splice(riderIndex);
                                trip.available_riders = true;
                                trip.save((err) => {
                                    if (err)
                                        return res.status(500).end();
                                });
                            })
                            .catch((e) => {
                                res.statusMessage = e.response.data.error_message;
                                return res.status(400).end();
                            });
                    }
                }
                user.active_trip = null;
                user.trip_role_driver = null;
                user.save((err) => {
                    // if (err) {
                    //     res.statusMessage = "Error in saving user. Trip was deleted/modified.";
                    //     return res.status(500).end();
                    // }
                    res.status(200).end();
                    return res;
                });
            });
        }
    })
}

exports.tripHistory = (req, res) => {
    User.findById(req.auth._id, (err, user) => {
        // if (err)
        //     return res.status(500).end();
        // else {
            Trip.find({ '_id': { $in: user.trips } }, (err, trips) => {
                // if (err)
                //     return res.status(500).end();
                res.status(200).json(trips);
                return res;
            })
        // }
    })
}

exports.tripDone = (req, res) => {
    User.findById(req.auth._id, (err, user) => {
      
            
            if (user.active_trip == undefined || user.active_trip == null) {
                res.statusMessage = "No active trip";
                return res.status(400).end();
            } else {
                Trip.findById(user.active_trip, (err, trip) => {
                    // if (err)
                    //     return res.status(500).end();
                    // else {
                        trip.completed = true;
                        trip.save((err) => {    //1
                            // if (err) {
                            //     res.statusMessage = "Error in saving trip status.";
                            //     return res.status(500).end();
                            // }
                        });
                        user.trips.push(trip._id);
                        user.active_trip = null;
                        user.trip_role_driver = null;
                        user.save((err) => {    //2
                            // if (err) {
                            //     res.statusMessage = "Error in saving trip to table.";
                            //     return res.status(500).end();
                            // }
                        });
                        trip.riders.forEach(rider => {  //3
                            User.findById(rider, (err, user_rider) => {
                                // if (err)
                                //     return res.status(500).end();
                                // else {
                                    user_rider.trips.push(trip._id);
                                    user_rider.active_trip = null;
                                    user_rider.trip_role_driver = null;
                                    user_rider.save((err) => {
                                        // if (err) {
                                        //     //TODO: revert
                                        //     res.statusMessage = "Error in saving user data for a rider.";
                                        //     return res.status(500).end();
                                        // }
                                    })
                                // }
                            })
                        });
                        return res.status(200).end();
                    // }
                })
            }
        // }
    })
}


exports.tripEdit = (req, res) => {
    User.findById(req.auth._id, (err, user) => {
        if (err) {
            return res.status(500).end();
        }
        
        if (user.active_trip == undefined || user.active_trip == null) {
            res.statusMessage = "No active trip";
            return res.status(400).end();
        } else {
            Trip.findById(user.active_trip, (err, trip) => {
                if (err || !trip) {
                    res.statusMessage = "Trip not found";
                    return res.status(404).end();
                }

                if (trip.driver.toString() !== req.auth._id.toString()) {
                    res.statusMessage = "Unauthorized to update trip datetime";
                    return res.status(403).end();
                }

                // Update the datetime 
                trip.dateTime = new Date(req.body.dateTime);
                trip.dateTime = new Date(Date.parse(req.body.dateTime)); 
                console.log("body");
                console.log(req.body.dateTime);
                // Save updated trip
                trip.save((err) => {
                    if (err) {
                        res.statusMessage = "Error in saving trip datetime";
                        return res.status(500).end();
                    }

                   
                    return res.status(200).json({ message: "Datetime updated successfully" });
                });
            });
        }
    });
}

  
exports.isDriver = (req, res) => {
    User.findById(req.auth._id, (err, user) => {
        
            if (user.trip_role_driver == undefined || user.trip_role_driver == null) {
                res.statusMessage = "No active trip";
                return res.status(400).end();
            }
            else
                res.status(200).json({ "isdriver": user.trip_role_driver })
        
    })
}


exports.getRideRequests = (req, res) => {
    // status is 'pending'
    RideRequest.find({ driver: req.auth._id, status: 'pending' }, async (err, requests) => {
      if (err) {
        console.log(err);
        return res.status(500).send('Error fetching ride requests');
      }
  
      // Fetch the rider details for each ride request
      const updatedRequests = await Promise.all(requests.map(async (request) => {
        const rider = await User.findById(request.rider);
        const requestWithRiderName = { ...request._doc, riderName: `${rider.name} ${rider.lastname}` };
        return requestWithRiderName;
      }));
  
      // Send the updated ride requests with rider names to the client
      res.status(200).json(updatedRequests);
    });
  };
  


//NOT USED
exports.respondToRideRequest = (req, res) => {
    // Update the status of a ride request based on the driver's response
    RideRequest.findById(req.body.requestId, (err, request) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error finding ride request');
        }
        if (!request || request.driver.toString() !== req.auth._id.toString()) {
            return res.status(404).send('Ride request not found');
        }
        request.status = req.body.accepted ? 'accepted' : 'declined';
        request.save(err => {
            if (err) {
                console.log(err);
                return res.status(500).send('Error updating ride request');
            }
            res.status(200).send('Ride request updated successfully');
        });
    });
};

//CHANGED THE FUCNTION TO ACCEPT/DECLINE
exports.joinTripss = (req, res) => {
    Trip.findById(req.body.tripId, (err, trip) => {
      if(err) {
        res.status(500).send("Error finding trip")
      }
      
      // Add rider waypoints to trip waypoints
      trip.waypoints.push(req.body.src, req.body.dst)
      
      // Recalculate route with new waypoints
      mapsClient.directions({
        origin: trip.source,  
        destination: trip.destination,
        waypoints: trip.waypoints,   
        key: process.env.MAPS_API_KEY
      }).then(results => {
        trip.route = polylineUtil.decode(results.overview_polyline)  
      
        // Add rider to trip riders  
        trip.riders.push(req.auth._id)  
      
         // Check available riders   
        trip.available_riders = trip.riders.length < trip.max_riders
         
        // Save updated trip
        trip.save(err => {       
          if(err) res.status(500).send("Error saving trip")
        })
      })
      
      // Associate user with active trip      
      User.findById(req.auth._id, (err, user) => {
        user.active_trip = trip._id
        user.save(err => {
         if(err) res.status(500).send("Error saving user")  
        })  
      })
    })
  }



 



exports.accept = async (req, res) => {
    try {

            // Log the request body to check if the 'id' field is present and has the correct value
            console.log(req.body);
        const requestId = req.body.id;
        console.log("Received ride request ID:", req.body.id);
        // Update the status of the ride request to 'accepted'
        const updatedRequest = await RideRequest.findByIdAndUpdate(requestId, { status: 'accepted' }, { new: true });
        if (!updatedRequest) {
            return res.status(404).json({ message: 'Ride request not found' });
        }

        // Get the rider ID and accepted request details
        const { src, dst } = updatedRequest;
        const driverId = req.body.driverId;
        const riderId = req.body.riderId ;

        console.log("DRIVER ID", driverId);
        console.log("RIDER IS :", riderId);
        // console.log("DRIVER ID",driverId);
        // Find trips where the driver matches and the source and destination match the accepted request
        const trips = await Trip.find({
            driver: driverId, // Use the 'driver' field from RideRequest to find the trip
            // 'source.coordinates': src.coordinates,
            // 'destination.coordinates': dst.coordinates,
            completed: false  // Add this condition to filter out completed trips
        });

        if (trips.length === 0) {
            console.log(" LENGTH IS ZERO , DIDNT FIND A MATCH");

            return res.status(404).json({ message: 'Matching trip not found for the accepted request' });
        }

        // Assuming there's only one trip that matches, add the rider to its riders array
        const trip = trips[0];
        console.log("Current Riders Array:", trip.riders);

        // Check if the trip has available slots for more riders
        if (trip.riders.length >= trip.max_riders) {
            return res.status(400).json({ message: 'Trip is already full' });
        }

        // Add the rider to the trip's riders array
        console.log(" ADDING THE RIDER TO THE RIDERS ARRAY");

        trip.riders.push(riderId);
        trip.available_riders = trip.riders.length < trip.max_riders;
        await trip.save();

        // Update the rider's active_trip and trip_role_driver fields
        const rider = await User.findById(riderId);
        if (!rider) {
            return res.status(404).json({ message: 'Rider not found' });
        }

        rider.active_trip = trip._id;
        rider.trip_role_driver = false;
        await rider.save();
        // Log the updated riders array after adding the new rider
console.log("Updated Riders Array:", trip.riders);


        return res.status(200).json({ message: 'Ride request accepted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error accepting ride request' });
    }
};


  
  // Decline a ride request
  exports.decline = async (req, res) => {
    try {
      const requestId = req.body.id;
      // Update the status of the ride request to 'declined'
      const updatedRequest = await RideRequest.findByIdAndUpdate(
        requestId,
        { status: "declined" },
        { new: true }
      );
      if (!updatedRequest) {
        return res.status(404).json({ message: "Ride request not found" });
      }
      res.status(200).json({ message: "Ride request declined successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error declining ride request" });
    }
  };

  exports.getRideStatus = (req, res) => {
    RideRequest.find(
      {
        rider: req.auth._id,
        status: { $in: ['pending', 'accepted', 'declined'] },
      }
    )
      .sort({ updatedAt: -1 }) // Sort by updatedAt in descending order
      .limit(1) // You can adjust the number of results you want to fetch
      .exec((err, requests) => {
        if (err) {
          console.log(err);
          return res.status(500).send('Error fetching ride requests');
        }
        console.log(req.auth._id);
        const statuses = requests.map((request) => request.status);
        res.status(200).json(statuses);
      });
  };
  