const express = require('express');
const { body } = require('express-validator');
const seatController = require('../controllers/seatController');
const auth = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const bookingValidation = [
  body('seatIds')
    .isArray()
    .withMessage('seatIds must be an array')
    .custom((value) => {
      if (value.length > 7) {
        throw new Error('You can only book up to 7 seats at a time');
      }
      if (value.length === 0) {
        throw new Error('Please select at least one seat');
      }
      return true;
    })
];

// All routes require authentication
router.use(auth);

// Routes
router.get('/', seatController.getAllSeats);

router.post('/book', bookingValidation, seatController.bookSeats);
router.post('/cancel', bookingValidation, seatController.cancelBooking);

module.exports = router; 