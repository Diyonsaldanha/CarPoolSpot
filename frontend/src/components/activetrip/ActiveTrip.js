import React, { useState, useEffect, useRef } from 'react';
import { Button, Col, Container, Row } from 'react-bootstrap';
import { GoogleMap, DirectionsRenderer, DirectionsService, Marker } from '@react-google-maps/api';
import Cookies from 'js-cookie';
import Geocode from 'react-geocode';


import './ActiveTrip.css';

Geocode.setApiKey(process.env.REACT_APP_MAPS_API_KEY);

const mapContainerStyle = {
  height: '35vh',
  width: '100%',
};

const options = {
  disableDefaultUI: true,
  zoomControl: true,
};

const center = {
  lat: 43.473078230478336,
  lng: -80.54225947407059,
};

export default function ActiveTrip({ setActiveTrip }) {
  const [mapCoords, setMapCoords] = useState({});
  const [routeResp, setRouteResp] = useState();
  const [waypoints, setWaypoints] = useState([]);
  const mapRef = useRef();

  const onMapLoad = (map) => {
    mapRef.current = map;
  };

  const directionsCallback = (response) => {
    if (response !== null) {
      if (response.status === 'OK') setRouteResp(response);
      else alert('Problem fetching directions');
    } else alert('Problem fetching directions');
  };

  const getDateandTime = (dtString) => {
    const d = new Date(dtString);
    let date = d.toDateString();
    dtString = d.toTimeString();
    let time = dtString.split(' ')[0].split(':');
    return date + ' @ ' + time[0] + ':' + time[1];
  };

  const setWaypointsFn = (localWaypoints) => {
    localWaypoints.forEach(function (part, index) {
      this[index] = { location: this[index], stopover: false };
    }, localWaypoints);
    setWaypoints(localWaypoints);
  };

  const getLocFromCoords = (coords, type) => {
    let lat = coords['lat'];
    let long = coords['lng'];

    Geocode.fromLatLng(lat, long).then(
      (res) => {
        const location = res.results[0].formatted_address;
        if (type === 'src') {
          setsource(location);
        } else {
          setdestination(location);
        }
      },
      (err) => {
        console.error(err);
        if (type === 'src') {
          setsource(lat + ',' + long);
        } else {
          setdestination(lat + ',' + long);
        }
      }
    );
  };


  const [isDriver, setIsDriver] = useState(false);

  useEffect(() => {
    fetch(process.env.REACT_APP_END_POINT + '/trip/isdriver', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Coookie': Cookies.get('tokken'),
      },
    })
      .then((response) => {
        if (response.ok) return response.json();
      })
      .then((responseJson) => {
        if (responseJson.isdriver) {
          setIsDriver(true);
        }
      })
      .catch((error) => {
        alert(error);
      });
  }, []);

  const handleCancel = (e) => {
    e.preventDefault();

    return fetch(process.env.REACT_APP_END_POINT + '/trip', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Coookie': Cookies.get('tokken'),
      },
    })
      .then((response) => {
        if (response.ok) {
          setActiveTrip(null);
          alert('Trip cancelled successfully');
          window.location.reload();
          return;
        }
        throw new Error(response.statusText);
      })
      .catch((error) => {
        console.log(error);
        alert(error);
      });
  };
 
 // New state to track edited datetime
 const [editedDatetime, setEditedDatetime] = useState('');
 // State to track if datetime is being edited
 const [isEditingDatetime, setIsEditingDatetime] = useState(false);


// Function to handle the edit button click
const handleEdit = () => {
  // Start editing datetime
  setIsEditingDatetime(true);

  // Set the original datetime and edited datetime to the current datetime initially
  // setOriginalDatetime(datetime);
  setEditedDatetime(datetime);
  console.log(datetime);


};



// Function to handle input change when editing the date-time
const handleTimeChange = (e) => {
  // Parse the editedDatetime to a Date object
  const editedDate = new Date(editedDatetime);

  // Parse the value of the input to a Date object
  const newTime = new Date(e.target.value);

  // Update only the time part of the editedDate
  editedDate.setHours(newTime.getHours());
  editedDate.setMinutes(newTime.getMinutes());

  // Format the edited date and time
  const formattedEditedDatetime = getDateandTime(editedDate.toISOString());

  // Update both editedDatetime and formattedDatetime states
  setEditedDatetime(editedDate.toISOString());
  setFormattedDatetime(formattedEditedDatetime);
};

 // Function to handle the "Save" button click
const handleSave = (e) => {
  e.preventDefault();

  // Calculate the time difference in milliseconds between the original datetime and edited datetime
  const timeDifference = new Date(editedDatetime) - new Date(datetime);

  // Check if the time difference is within one hour (3600000 milliseconds)
  if (Math.abs(timeDifference) > 3600000) {
    alert('You can only change the time within one hour from the original date.');
    return;
  }

  fetch(process.env.REACT_APP_END_POINT + `/trip/edit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Coookie': Cookies.get('tokken'),
    },
    body: JSON.stringify({
      dateTime: editedDatetime,
    }),
  })
    .then((response) => {
      if (response.ok) {
        setIsEditingDatetime(false);

        // Update the datetime state with the new edited datetime
        setdatetime(editedDatetime); // Use setdatetime, not setDatetime

        // Update the formattedDatetime state with the new formatted datetime
        setFormattedDatetime(getDateandTime(editedDatetime)); // Format the editedDatetime

        alert('Datetime updated successfully');
      } else {
        throw new Error(response.statusText);
      }
    })
    .catch((error) => {
      console.log(error);
      alert(error);
    });
};


  const handleDone = (e) => {
    e.preventDefault();

    return fetch(process.env.REACT_APP_END_POINT + '/trip/done', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Coookie': Cookies.get('tokken'),
      },
    })
      .then((response) => {
        console.log(response);
        if (response.ok) {
          setActiveTrip(null);
          alert('Trip marked completed');
          window.location.reload();
          return;
        }
        throw new Error(response.statusText);
      })
      .catch((error) => {
        console.log(error);
        alert(error);
      });
  };

  const [source, setsource] = useState('');
  const [destination, setdestination] = useState('');
  const [datetime, setdatetime] = useState('');
  const [driver, setDriver] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [riders, setRiders] = useState([]);

    // New state to track formatted datetime
    const [formattedDatetime, setFormattedDatetime] = useState('');

    // ... (Rest of your code)
  
    useEffect(() => {
      fetch(process.env.REACT_APP_END_POINT + '/trip/activetrip', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Coookie': Cookies.get('tokken'),
        },
      })
        .then((response) => {
          if (response.ok) return response.json();
          throw new Error('Failed to fetch active trip details');
        })
        .then((responseJson) => {
          console.log(responseJson);
          setWaypointsFn(responseJson.waypoints);
  
          // Set the initial datetime state and formattedDatetime
          const initialDatetime = getDateandTime(responseJson.dateTime);
          setdatetime(initialDatetime);
          setEditedDatetime(responseJson.dateTime); // Set editedDatetime as well if needed
          setFormattedDatetime(initialDatetime);
  
          setDriver(responseJson.driver);
          setDriverPhone(responseJson.driverPhone);
  
          if (Array.isArray(responseJson.riders) && responseJson.riders.length > 0) {
            setRiders(responseJson.riders);
          } else {
            setRiders([]);
            console.log('No riders found in the active trip.');
          }
  
          getLocFromCoords(responseJson.source, 'src');
          getLocFromCoords(responseJson.destination, 'dest');
  
          setMapCoords((prevCoords) => ({
            ...prevCoords,
            src: responseJson.source,
            dst: responseJson.destination,
          }));
          console.log(mapCoords);
        })
        .catch((error) => {
          alert(error);
        });
    }, []);
  
// Calculate the minimum and maximum dates for the calendar based on one hour range
const minDate = new Date(datetime);
minDate.setHours(minDate.getHours() - 1);
const maxDate = new Date(datetime);
maxDate.setHours(maxDate.getHours() + 1);

  return (
    <>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={15}
        center={center}
        options={options}
        onLoad={onMapLoad}
      >
        {routeResp == null && mapCoords['src'] != null && mapCoords['dst'] != null && (
          <DirectionsService
            options={{
              destination: mapCoords['dst'],
              origin: mapCoords['src'],
              travelMode: 'DRIVING',
              waypoints: waypoints,
              optimizeWaypoints: true,
            }}
            callback={directionsCallback}
          />
        )}

        {routeResp !== null && (
          <DirectionsRenderer
            options={{
              directions: routeResp,
            }}
          />
        )}
      </GoogleMap>

      <Container id="activeTripContainer" fluid="lg">
        <Row style={{ marginTop: '1rem' }}>
          <Col md="10">
            <h1>Active Trip Details</h1>
            <Row>
              <Col md="6">
                <h4 className="trip-attributes">Source:</h4>
                <p>{source}</p>

                <h4 className="trip-attributes">Destination:</h4>
                <p>{destination}</p>

                      {/* Display the original datetime unless it's being edited */}
                      {!isEditingDatetime && (
  <>
    <h4 className="trip-attributes">Date:</h4>
    <p>{formattedDatetime}</p> {/* Use formattedDatetime instead of datetime */}
  </>
)}
{isEditingDatetime && (
  <>
    <h4 className="trip-attributes">Edit Date:</h4>
    <input
      type="datetime-local"
      value={editedDatetime.slice(0, 16)} // Display the datetime without timezone offset
      onChange={handleTimeChange}
      min={minDate.toISOString().slice(0, 16)} // Set the min date based on the one-hour range
      max={maxDate.toISOString().slice(0, 16)} // Set the max date based on the one-hour range
    />
    <Button variant="primary" id="saveTripButton" onClick={handleSave}>
      Save
    </Button>
  </>
)}
              </Col>

              <Col md="6">
                <h4 className="trip-attributes">Driver:</h4>
                <p>{driver}</p>

                <h4 className="trip-attributes">Driver Phone:</h4>
                <p>{driverPhone}</p>

                <h4 className="trip-attributes">Rider(s):</h4>
                <ul>
                  {riders.map((rider, index) => (
                    <li key={index}>
                      {rider.name} - {rider.phone}
                    </li>
                  ))}
                </ul>
              </Col>
            </Row>
          </Col>

          <Col md="2">
            <Row>
            {!isEditingDatetime && isDriver && (
  <Button variant="warning" id="editTripButton" onClick={handleEdit}>
    Edit
  </Button>
)}

              {isDriver && (
                <Button variant="primary" id="doneTripButton" onClick={handleDone}>
                  Done
                </Button>
              )}
              <Button variant="danger" id="cancelTripButton" onClick={handleCancel}>
                Cancel trip
              </Button>
            </Row>
          </Col>
        </Row>
      </Container>
    </>
  );
}
