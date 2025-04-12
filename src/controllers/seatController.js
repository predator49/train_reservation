const { Seat, sequelize } = require('../models');

// Initialize seats if they don't exist
const initializeSeats = async () => {
  const count = await Seat.count();
  if (count === 0) {
    const seats = [];
    for (let i = 0; i < 11; i++) {
      const seatsInRow = i === 10 ? 3 : 7;
      for (let j = 0; j < seatsInRow; j++) {
        const seatNumber = i * 7 + j + 1;
        seats.push({
          seatNumber,
          rowNumber: i + 1,
          isBooked: false
        });
      }
    }
    await Seat.bulkCreate(seats);
  }
};

exports.getAllSeats = async (req, res) => {
  try {
    await initializeSeats();
    const seats = await Seat.findAll({
      order: [['seatNumber', 'ASC']]
    });
    res.json(seats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching seats', error: error.message });
  }
};

exports.bookSeats = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { seatIds } = req.body;
    const userId = req.user.id;

    if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ message: 'Please provide valid seat IDs' });
    }

    if (seatIds.length > 7) {
      return res.status(400).json({ message: 'You can only book up to 7 seats at a time' });
    }

    // Check if seats exist and are available
    const seats = await Seat.findAll({
      where: { id: seatIds },
      transaction: t
    });

    if (seats.length !== seatIds.length) {
      await t.rollback();
      return res.status(400).json({ message: 'One or more seats not found' });
    }

    const unavailableSeats = seats.filter(seat => seat.isBooked);
    if (unavailableSeats.length > 0) {
      await t.rollback();
      return res.status(400).json({ 
        message: 'One or more seats are already booked',
        unavailableSeats: unavailableSeats.map(seat => seat.seatNumber)
      });
    }

    // Book the seats
    await Promise.all(seats.map(seat => 
      seat.update({
        isBooked: true,
        bookedBy: userId
      }, { transaction: t })
    ));

    await t.commit();
    res.json({ message: 'Seats booked successfully', seats });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: 'Error booking seats', error: error.message });
  }
};

exports.cancelBooking = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { seatIds } = req.body;
    const userId = req.user.id;

    if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ message: 'Please provide valid seat IDs' });
    }

    // Check if seats exist and are booked by the user
    const seats = await Seat.findAll({
      where: { 
        id: seatIds,
        bookedBy: userId
      },
      transaction: t
    });

    if (seats.length !== seatIds.length) {
      await t.rollback();
      return res.status(400).json({ message: 'One or more seats not found or not booked by you' });
    }

    // Cancel the bookings
    await Promise.all(seats.map(seat => 
      seat.update({
        isBooked: false,
        bookedBy: null
      }, { transaction: t })
    ));

    await t.commit();
    res.json({ message: 'Bookings cancelled successfully' });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: 'Error cancelling bookings', error: error.message });
  }
}; 