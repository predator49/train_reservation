const { Seat, sequelize } = require('../models');

// Initialize seats if they don't exist
const initializeSeats = async () => {
  const count = await Seat.count();
  if (count === 0) {
    const seats = [];
    let seatNumber = 1;
    
    // Create 11 rows with 7 seats each
    for (let row = 1; row <= 11; row++) {
      for (let col = 1; col <= 7; col++) {
        seats.push({
          seatNumber,
          rowNumber: row,
          isBooked: false
        });
        seatNumber++;
      }
    }
    
    // Create last row with 3 seats
    for (let col = 1; col <= 3; col++) {
      seats.push({
        seatNumber,
        rowNumber: 12,
        isBooked: false
      });
      seatNumber++;
    }

    console.log('Creating seats:', seats.length); // Debug log
    await Seat.bulkCreate(seats);
  }
};

exports.getAllSeats = async (req, res) => {
  try {
    await initializeSeats();
    const seats = await Seat.findAll({
      order: [['seatNumber', 'ASC']],
      attributes: ['id', 'seatNumber', 'rowNumber', 'isBooked', 'bookedBy'],
      raw: true // Get plain objects instead of Sequelize instances
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
    await Seat.update(
      {
        isBooked: true,
        bookedBy: userId
      },
      {
        where: { id: seatIds },
        transaction: t
      }
    );

    await t.commit();
    
    // Fetch the updated seats to return
    const updatedSeats = await Seat.findAll({
      where: { id: seatIds },
      attributes: ['id', 'seatNumber', 'rowNumber', 'isBooked', 'bookedBy']
    });

    res.json({ 
      message: 'Seats booked successfully',
      seats: updatedSeats
    });
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

exports.unselectSeats = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { seatIds } = req.body;

    if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ message: 'Please provide valid seat IDs' });
    }

    // Check if seats exist
    const seats = await Seat.findAll({
      where: { id: seatIds },
      transaction: t
    });

    if (seats.length !== seatIds.length) {
      await t.rollback();
      return res.status(400).json({ message: 'One or more seats not found' });
    }

    // Unselect the seats
    await Promise.all(seats.map(seat => 
      seat.update({
        isBooked: false,
        bookedBy: null
      }, { transaction: t })
    ));

    await t.commit();
    res.json({ message: 'Seats unselected successfully' });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: 'Error unselecting seats', error: error.message });
  }
};

exports.resetSeats = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const t = await sequelize.transaction();
  try {
    // Delete all existing seats
    await Seat.destroy({
      where: {},
      transaction: t
    });

    // Create new seats
    const seats = [];
    let seatNumber = 1;
    
    // Create 11 rows with 7 seats each
    for (let row = 1; row <= 11; row++) {
      for (let col = 1; col <= 7; col++) {
        seats.push({
          seatNumber,
          rowNumber: row,
          isBooked: false
        });
        seatNumber++;
      }
    }
    
    // Create last row with 3 seats
    for (let col = 1; col <= 3; col++) {
      seats.push({
        seatNumber,
        rowNumber: 12,
        isBooked: false
      });
      seatNumber++;
    }

    console.log('Creating seats:', seats.length); // Debug log
    await Seat.bulkCreate(seats, { transaction: t });
    await t.commit();

    // Fetch all seats to return
    const allSeats = await Seat.findAll({
      order: [['seatNumber', 'ASC']],
      attributes: ['id', 'seatNumber', 'rowNumber', 'isBooked', 'bookedBy'],
      raw: true
    });

    res.json({
      message: 'All seats have been reset successfully',
      seats: allSeats
    });
  } catch (error) {
    await t.rollback();
    console.error('Reset seats error:', error);
    res.status(500).json({ message: 'Error resetting seats', error: error.message });
  }
};

exports.resetSelectedSeats = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { seatIds } = req.body;

    if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ message: 'Please provide valid seat IDs' });
    }

    // Check if the seats exist
    const seats = await Seat.findAll({
      where: { id: seatIds },
      transaction: t
    });

    if (seats.length !== seatIds.length) {
      await t.rollback();
      return res.status(400).json({ message: 'One or more seats not found' });
    }

    // Reset the selected seats
    await Promise.all(seats.map(seat =>
      seat.update({
        isBooked: false,
        bookedBy: null
      }, { transaction: t })
    ));

    await t.commit();

    // Fetch updated seats
    const updatedSeats = await Seat.findAll({
      where: { id: seatIds },
      attributes: ['id', 'seatNumber', 'rowNumber', 'isBooked', 'bookedBy'],
      raw: true
    });

    res.json({
      message: 'Selected seats have been reset successfully',
      seats: updatedSeats
    });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: 'Error resetting selected seats', error: error.message });
  }
};

// Completely reset the database and recreate all seats
exports.resetDatabase = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const t = await sequelize.transaction();
  try {
    // Delete all existing seats
    await Seat.destroy({
      where: {},
      transaction: t
    });

    // Create new seats
    const seats = [];
    let seatNumber = 1;
    
    // Create 11 rows with 7 seats each
    for (let row = 1; row <= 11; row++) {
      for (let col = 1; col <= 7; col++) {
        seats.push({
          seatNumber,
          rowNumber: row,
          isBooked: false
        });
        seatNumber++;
      }
    }
    
    // Create last row with 3 seats
    for (let col = 1; col <= 3; col++) {
      seats.push({
        seatNumber,
        rowNumber: 12,
        isBooked: false
      });
      seatNumber++;
    }

    console.log('Creating seats:', seats.length); // Debug log
    await Seat.bulkCreate(seats, { transaction: t });
    await t.commit();

    // Fetch all seats to return
    const allSeats = await Seat.findAll({
      order: [['seatNumber', 'ASC']],
      attributes: ['id', 'seatNumber', 'rowNumber', 'isBooked', 'bookedBy'],
      raw: true
    });

    res.json({
      message: 'All seats have been reset successfully',
      seats: allSeats
    });
  } catch (error) {
    await t.rollback();
    console.error('Reset database error:', error);
    res.status(500).json({ message: 'Error resetting database', error: error.message });
  }
}; 