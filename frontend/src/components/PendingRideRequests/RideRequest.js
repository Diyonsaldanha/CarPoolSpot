import React from 'react';

const RideRequest = ({ request, onAccept, onDecline }) => {
  return (
    <div className="ride-request">
      <p>Source: {request.src}</p>
      <p>Destination: {request.dst}</p>
      <p>Status: {request.status}</p>
      <button onClick={onAccept}>Accept</button>
      <button onClick={onDecline}>Decline</button>
    </div>
  );
};

export default RideRequest;
