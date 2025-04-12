import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { seatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const SeatBooking = () => {
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  // Initialize seats array with 80 seats (7 seats per row, last row with 3 seats)
  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const response = await seatAPI.getAllSeats();
        setSeats(response.data);
      } catch (err) {
        setError('Failed to fetch seats');
      }
    };
    fetchSeats();
  }, []);

  const handleSeatClick = (seatId) => {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(id => id !== seatId));
    } else if (selectedSeats.length < 7) {
      // Check if seats are in the same row when possible
      const newSelection = [...selectedSeats, seatId];
      setSelectedSeats(newSelection);
    } else {
      setError('You can only select up to 7 seats at a time');
    }
  };

  const handleBooking = async () => {
    if (selectedSeats.length === 0) {
      setError('Please select at least one seat');
      return;
    }

    try {
      await seatAPI.bookSeats(selectedSeats);
      // Refresh seats after booking
      const response = await seatAPI.getAllSeats();
      setSeats(response.data);
      setSelectedSeats([]);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed');
    }
  };

  const renderSeats = () => {
    const rows = [];
    let seatIndex = 0;

    for (let i = 0; i < 11; i++) {
      const rowSeats = [];
      const seatsInRow = i === 10 ? 3 : 7; // Last row has 3 seats

      for (let j = 0; j < seatsInRow; j++) {
        const seat = seats[seatIndex];
        const isSelected = selectedSeats.includes(seat?.id);
        const isBooked = seat?.isBooked;

        rowSeats.push(
          <div
            key={`seat-${seatIndex}`}
            className={`seat ${isSelected ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
            onClick={() => !isBooked && handleSeatClick(seat?.id)}
          >
            {seatIndex + 1}
          </div>
        );
        seatIndex++;
      }

      rows.push(
        <div key={`row-${i}`} className="seat-row">
          {rowSeats}
        </div>
      );
    }

    return rows;
  };

  return (
    <div className="seat-booking-container">
      <h2>Book Your Seats</h2>
      {error && <div className="error-message">{error}</div>}
      <div className="seat-map">
        {renderSeats()}
      </div>
      <div className="booking-info">
        <p>Selected Seats: {selectedSeats.length}</p>
        <button
          onClick={handleBooking}
          disabled={selectedSeats.length === 0}
        >
          Book Selected Seats
        </button>
      </div>
      <div className="legend">
        <div className="legend-item">
          <div className="seat-example available"></div>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <div className="seat-example selected"></div>
          <span>Selected</span>
        </div>
        <div className="legend-item">
          <div className="seat-example booked"></div>
          <span>Booked</span>
        </div>
      </div>
    </div>
  );
};

export default SeatBooking; 