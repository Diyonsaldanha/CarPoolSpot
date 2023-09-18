import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import './PendingRideRequests.css'; // Import the CSS file

const PendingRideRequests = () => {
  const [rideRequests, setRideRequests] = useState([]);
  const [riderNames, setRiderNames] = useState({});

  const fetchRideRequests = async () => {
    try {
      const response = await fetch(process.env.REACT_APP_END_POINT + '/trip/pendingrequest', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Coookie': Cookies.get('tokken')
        }
      });
      const data = await response.json();
      setRideRequests(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchRideRequests();
  }, []);

  const handleAccept = async (requestId, driverId,riderId) => {
    try {
      await fetch(process.env.REACT_APP_END_POINT + `/trip/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Coookie': Cookies.get('tokken')
        },
        body: JSON.stringify({ id: requestId, driverId,riderId }) // Pass the requestId and driverId as the payload
      });
      // Refresh the ride requests after accepting one
      fetchRideRequests();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDecline = async (requestId) => {
    const confirmed = window.confirm('Are you sure you want to decline this ride request?');
  
    if (confirmed) {
      try {
        await fetch(process.env.REACT_APP_END_POINT + `/trip/decline`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Coookie': Cookies.get('tokken')
          },
          body: JSON.stringify({ id: requestId }) // Pass the request ID as the payload
        });
        // Refresh the ride requests after declining one
        fetchRideRequests();
      } catch (error) {
        console.error(error);
      }
    }
  };
  

  return (
    <>
      {rideRequests.length === 0 ? (
        <h1 style={{ width: '100%', height: '100%', textAlign: 'center', marginTop: '30vh' }}>No ride requests found</h1>
      ) : (
        <div>
          {rideRequests.map((request) => (
            <div key={request._id} className="ride-request">
              <p style={{ fontSize: '18px', fontWeight: 'bold' }}>Rider Name: {request.riderName}</p>
              {/* You can also display other rider details if available */}
              <button
                  onClick={() => handleAccept(request._id, request.driver, request.rider)}
                  style={{ marginRight: '10px', background: 'green', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
              >
                Accept
              </button>
              <button
                onClick={() => handleDecline(request._id)}
                style={{ background: 'red', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
              >
                Decline
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default PendingRideRequests;
