import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { seatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const SeatBooking = () => {
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

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

  // Calculate booked and available seats
  const bookedSeats = seats.filter(seat => seat?.isBooked).length;
  const availableSeats = seats.length - bookedSeats;

  // Helper function to get seats in a row
  const getSeatsInRow = (row) => {
    return seats.filter(seat => seat.rowNumber === row + 1);
  };

  // Helper function to get row number from seat index
  const getRowNumber = (seatIndex) => {
    return seats[seatIndex]?.rowNumber - 1 || 0;
  };

  // Helper function to get available seats in a row
  const getAvailableSeatsInRow = (row) => {
    const rowSeats = getSeatsInRow(row);
    return rowSeats.filter(seat => !seat?.isBooked && !selectedSeats.includes(seat?.id));
  };

  // Function to find consecutive seats in a row
  const findConsecutiveSeatsInRow = (row, numSeats) => {
    const rowSeats = getSeatsInRow(row);
    let consecutiveCount = 0;
    let startIndex = -1;

    for (let i = 0; i < rowSeats.length; i++) {
      if (!rowSeats[i]?.isBooked && !selectedSeats.includes(rowSeats[i]?.id)) {
        if (consecutiveCount === 0) startIndex = i;
        consecutiveCount++;
        if (consecutiveCount === numSeats) {
          return rowSeats.slice(startIndex, startIndex + numSeats).map(seat => seat.id);
        }
      } else {
        consecutiveCount = 0;
        startIndex = -1;
      }
    }
    return null;
  };

  // Function to find nearby seats across rows
  const findNearbySeats = (currentRow, numSeats) => {
    const seatsToSelect = [];
    let row = currentRow;
    let remainingSeats = numSeats;

    // Try to find seats in current row first
    const currentRowSeats = findConsecutiveSeatsInRow(row, remainingSeats);
    if (currentRowSeats) {
      return currentRowSeats;
    }

    // If not enough in current row, look for nearby seats
    while (remainingSeats > 0 && row <=11) {
      const availableInRow = getAvailableSeatsInRow(row);
      const seatsToTake = Math.min(availableInRow.length, remainingSeats);
      
      if (seatsToTake > 0) {
        seatsToSelect.push(...availableInRow.slice(0, seatsToTake).map(seat => seat.id));
        remainingSeats -= seatsToTake;
      }
      
      // Try next row
      row++;
    }

    return seatsToSelect.length === numSeats ? seatsToSelect : null;
  };

  const handleSeatClick = (seatId) => {
    const seat = seats.find(s => s.id === seatId);
    
    // Check if the seat is already booked
    if (seat?.isBooked) {
      setError('This seat is already booked');
      return;
    }

    if (selectedSeats.includes(seatId)) {
      // If seat is already selected, unselect it
      setSelectedSeats(selectedSeats.filter(id => id !== seatId));
      setError('');
      return;
    }

    const currentSeatIndex = seats.findIndex(seat => seat.id === seatId);
    const currentRow = getRowNumber(currentSeatIndex);
    const numSeatsToSelect = selectedSeats.length + 1;

    if (numSeatsToSelect > 7) {
      setError('You can only select up to 7 seats at a time');
      return;
    }

    // Try to find seats in current row first
    const consecutiveSeats = findConsecutiveSeatsInRow(currentRow, numSeatsToSelect);
    
    if (consecutiveSeats) {
      // Check if any of the consecutive seats are already booked
      const bookedSeats = consecutiveSeats.filter(id => {
        const seat = seats.find(s => s.id === id);
        return seat?.isBooked;
      });

      if (bookedSeats.length > 0) {
        setError('Some of the selected seats are already booked');
        return;
      }

      setSelectedSeats(consecutiveSeats);
      setError('');
    } else {
      // If not available in current row, look for nearby seats
      const nearbySeats = findNearbySeats(currentRow, numSeatsToSelect);
      
      if (nearbySeats) {
        // Check if any of the nearby seats are already booked
        const bookedSeats = nearbySeats.filter(id => {
          const seat = seats.find(s => s.id === id);
          return seat?.isBooked;
        });

        if (bookedSeats.length > 0) {
          setError('Some of the selected seats are already booked');
          return;
        }

        setSelectedSeats(nearbySeats);
        setError('');
      } else {
        setError('Not enough seats available');
      }
    }
  };

  const handleBooking = async () => {
    if (selectedSeats.length === 0) {
      setError('Please select at least one seat');
      return;
    }

    if (!user) {
      setError('Please login to book seats');
      navigate('/login');
      return;
    }

    try {
      const response = await seatAPI.bookSeats(selectedSeats);
      if (response.data) {
        // Update the seats state with the new booking information
        const updatedSeats = seats.map(seat => {
          if (selectedSeats.includes(seat.id)) {
            return {
              ...seat,
              isBooked: true,
              bookedBy: user.id
            };
          }
          return seat;
        });
        
        setSeats(updatedSeats);
        setSelectedSeats([]);
        setError('');
      }
    } catch (err) {
      console.error('Booking error:', err);
      setError(err.response?.data?.message || 'Booking failed. Please try again.');
    }
  };

  const handleReset = async () => {
    if (!user) {
      toast.error('Please login to reset seats');
      navigate('/login');
      return;
    }

    try {
      const response = await seatAPI.resetDatabase();
      if (response.data && response.data.seats) {
        // Update the seats state with the reset data
        setSeats(response.data.seats);
        setSelectedSeats([]);
        setError('');
        
        // Show success message
        toast.success('All seats have been reset successfully');
      }
    } catch (err) {
      console.error('Reset error:', err);
      if (err.response?.status === 401) {
        toast.error('Please login to reset seats');
        navigate('/login');
      } else {
        setError(err.response?.data?.message || 'Failed to reset seats');
        toast.error(err.response?.data?.message || 'Failed to reset seats');
      }
    }
  };

  const renderSeats = () => {
    const rows = [];
    const maxRow = Math.max(...seats.map(seat => seat.rowNumber));

    for (let row = 1; row <= maxRow; row++) {
      const rowSeats = seats.filter(seat => seat.rowNumber === row);
      const rowSeatsElements = rowSeats.map(seat => {
        const isSelected = selectedSeats.includes(seat.id);
        const isBooked = seat.isBooked;

        return (
          <div
            key={`seat-${seat.id}`}
            className={`seat ${isSelected ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
            onClick={() => !isBooked && handleSeatClick(seat.id)}
          >
            {seat.seatNumber}
          </div>
        );
      });

      rows.push(
        <div key={`row-${row}`} className="seat-row">
          {rowSeatsElements}
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
      <div className="seat-counters">
        <div className="counter-box">
         // <h3>Seats Selected</h3>
          <p className="counter">{selectedSeats.length}</p>
        </div>
        <div className="counter-box">
          <h3>Seats Available</h3>
          <p className="counter">{availableSeats}</p>
        </div>
      </div>
      <div className="booking-info">
        <div className="booking-actions">
          <button
            onClick={handleBooking}
            disabled={selectedSeats.length === 0}
          >
            Book Selected Seats
          </button>
          <button
            onClick={handleReset}
            className="reset-button"
          >
            Reset Selected Seats
          </button>
        </div>
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