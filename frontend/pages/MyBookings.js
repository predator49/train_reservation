import React, { useState, useEffect } from 'react';
import { seatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await seatAPI.getAllSeats();
      // Filter seats booked by current user
      const userBookings = response.data.filter(seat => 
        seat.isBooked && seat.bookedBy === user.id
      );
      setBookings(userBookings);
    } catch (err) {
      setError('Failed to fetch bookings');
    }
  };

  const handleCancelBooking = async (seatIds) => {
    try {
      await seatAPI.cancelBooking(seatIds);
      await fetchBookings();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const groupBookingsByRow = () => {
    const groupedBookings = {};
    bookings.forEach(booking => {
      const rowNumber = Math.floor((booking.seatNumber - 1) / 7) + 1;
      if (!groupedBookings[rowNumber]) {
        groupedBookings[rowNumber] = [];
      }
      groupedBookings[rowNumber].push(booking);
    });
    return groupedBookings;
  };

  return (
    <div className="my-bookings-container">
      <h2>My Bookings</h2>
      {error && <div className="error-message">{error}</div>}
      
      {Object.entries(groupBookingsByRow()).map(([rowNumber, rowBookings]) => (
        <div key={rowNumber} className="booking-row">
          <h3>Row {rowNumber}</h3>
          <div className="booking-seats">
            {rowBookings.map(booking => (
              <div key={booking.id} className="booked-seat">
                <span>Seat {booking.seatNumber}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => handleCancelBooking(rowBookings.map(b => b.id))}
            className="cancel-button"
          >
            Cancel Row Booking
          </button>
        </div>
      ))}

      {bookings.length === 0 && (
        <p className="no-bookings">You have no current bookings</p>
      )}
    </div>
  );
};

export default MyBookings; 