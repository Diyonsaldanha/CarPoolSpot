import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
const CheckRideStatus = () => {
  const [rideStatus, setRideStatus] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRideStatus = async () => {
      try {
        const response = await fetch(process.env.REACT_APP_END_POINT + '/trip/checkstatus', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Coookie': Cookies.get('tokken')
          }
        });

        const data = await response.json();
        console.log('API Response:', data); 
        setRideStatus(data);
      } catch (error) {
        console.error(error);
      } finally {
        // setIsLoading(false);
      }
    };

    fetchRideStatus();
  }, []);

  const getMessage = () => {
 
      if (rideStatus.includes('pending')) {
        return 'Your ride request is pending.';
      } else if (rideStatus.includes('accepted')) {
        return 'Your ride request has been accepted.';
      } else if (rideStatus.includes('declined')) {
        return 'Your ride request has been declined.';
      } else {
        return 'No ride status data available.';
      }
    // } else {
    //   return 'No ride status data available.';
    // }
 };
  

  return (
    <div style={{ width: '100%', height: '100%', textAlign: 'center', marginTop: '30vh' }}>
      <h1>{getMessage()}</h1>
    </div>
  );
};

export default CheckRideStatus;
