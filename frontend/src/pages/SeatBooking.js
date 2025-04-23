import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  SimpleGrid,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
  Container,
  Card,
  CardBody,
  Badge,
  Flex,
  Tooltip,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const SeatBooking = () => {
  const { user, logout } = useAuth();
  const [seats, setSeats] = useState([]);
  const [numberOfSeats, setNumberOfSeats] = useState(1);
  const [allocatedSeats, setAllocatedSeats] = useState([]);
  const [sessionBookedSeats, setSessionBookedSeats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const toast = useToast();
  const navigate = useNavigate();

  const fetchSeats = useCallback(async () => {
    if (!user) {
      setError('Please login to view seats');
      setIsLoading(false);
      navigate('/login');
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      // Check if token exists
      if (!token) {
        console.log('No token found - redirecting to login');
        setError('Please login to view seats');
        navigate('/login');
        return;
      }

      // Validate token format
      if (!token.startsWith('Bearer ')) {
        console.log('Invalid token format - redirecting to login');
        localStorage.removeItem('token');
        setError('Please login to view seats');
        navigate('/login');
        return;
      }

      console.log('Fetching seats with token:', token);

      const response = await fetch('https://train-reservation-wsrg.onrender.com/api/seats', {
        method: 'GET',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      console.log('Seats response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          console.log('Token expired or invalid - redirecting to login');
          localStorage.removeItem('token');
          setError('Your session has expired. Please login again.');
          navigate('/login');
          return;
        }
        throw new Error('Failed to fetch seats');
      }

      const data = await response.json();
      console.log('Seats data:', data);

      if (Array.isArray(data)) {
        setSeats(data);
        setError('');
      } else {
        console.error('Invalid seats data format:', data);
        setSeats([]);
        setError('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching seats:', error);
      if (error.message.includes('401')) {
        localStorage.removeItem('token');
        setError('Your session has expired. Please login again.');
        navigate('/login');
      } else {
        setError('Failed to fetch seats. Please try again.');
      }
      setSeats([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchSeats();
  }, [fetchSeats]);

  const findAdjacentSeats = (numSeats) => {
    const availableSeats = seats.filter(seat => !seat.isBooked);
    const bookedSeats = seats.filter(seat => seat.isBooked);
    const sortedSeats = [...availableSeats].sort((a, b) => a.seatNumber - b.seatNumber);
    
    // If no seats available or requesting more seats than available
    if (availableSeats.length < numSeats) {
      return null;
    }

    // Get rows that have booked seats
    const rowsWithBookedSeats = new Set(bookedSeats.map(seat => seat.rowNumber));

    // Filter out seats from rows that already have bookings
    const validSeats = sortedSeats.filter(seat => !rowsWithBookedSeats.has(seat.rowNumber));

    // If we have enough valid seats, use only those
    const seatsToUse = validSeats.length >= numSeats ? validSeats : sortedSeats;

    // First, try to find consecutive seats anywhere (not just in same row)
    for (let i = 0; i <= seatsToUse.length - numSeats; i++) {
      const potentialGroup = seatsToUse.slice(i, i + numSeats);
      const isConsecutive = potentialGroup.every((seat, index) => {
        if (index === 0) return true;
        return seat.seatNumber === potentialGroup[index - 1].seatNumber + 1;
      });

      if (isConsecutive) {
        return potentialGroup.map(seat => seat.id);
      }
    }

    // If no consecutive seats found, find seats in clusters
    const findSeatsInClusters = () => {
      // Group available seats by row
      const seatsByRow = {};
      seatsToUse.forEach(seat => {
        if (!seatsByRow[seat.rowNumber]) {
          seatsByRow[seat.rowNumber] = [];
        }
        seatsByRow[seat.rowNumber].push(seat);
      });

      // Find all possible combinations of numSeats seats
      const combinations = [];
      for (let i = 0; i <= seatsToUse.length - numSeats; i++) {
        combinations.push(seatsToUse.slice(i, i + numSeats));
      }

      // Score each combination based on row grouping and proximity to booked seats
      const scoredCombinations = combinations.map(combo => {
        // Sort the combo by seat number for consistent analysis
        const sortedCombo = [...combo].sort((a, b) => a.seatNumber - b.seatNumber);

        // Count seats in each row for this combination
        const seatsInRow = {};
        sortedCombo.forEach(seat => {
          seatsInRow[seat.rowNumber] = (seatsInRow[seat.rowNumber] || 0) + 1;
        });

        // Calculate maximum consecutive seats in any row
        let maxConsecutiveInRow = 0;
        Object.entries(seatsInRow).forEach(([rowNum, count]) => {
          const rowSeats = sortedCombo
            .filter(s => s.rowNumber === parseInt(rowNum))
            .sort((a, b) => a.seatNumber - b.seatNumber);
          
          let currentConsecutive = 1;
          let maxConsecutive = 1;
          
          for (let i = 1; i < rowSeats.length; i++) {
            if (rowSeats[i].seatNumber === rowSeats[i-1].seatNumber + 1) {
              currentConsecutive++;
              maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
            } else {
              currentConsecutive = 1;
            }
          }
          
          maxConsecutiveInRow = Math.max(maxConsecutiveInRow, maxConsecutive);
        });

        // Calculate spread (difference between highest and lowest seat numbers)
        const spread = sortedCombo[sortedCombo.length - 1].seatNumber - sortedCombo[0].seatNumber;

        // Calculate adjacency score (how many seats are next to each other)
        let adjacencyScore = 0;
        for (let i = 1; i < sortedCombo.length; i++) {
          const gap = sortedCombo[i].seatNumber - sortedCombo[i-1].seatNumber;
          if (gap === 1) {
            adjacencyScore += 10000;
          } else {
            // Penalize based on gap size
            adjacencyScore -= gap * 5000;
          }
        }

        // Calculate row transitions
        const rowTransitions = new Set(sortedCombo.map(s => s.rowNumber)).size - 1;
        const rowTransitionPenalty = rowTransitions * 15000;

        // Calculate final score
        const score = (maxConsecutiveInRow * 20000) +  // Heavily reward consecutive seats
                     adjacencyScore +                   // Reward adjacent seats
                     (validSeats.length >= numSeats ? 50000 : 0) - // Bonus for using completely free rows
                     (spread * 2000) -                 // Penalize spread
                     rowTransitionPenalty;             // Penalize row changes

        return {
          seats: combo,
          score,
          maxConsecutive: maxConsecutiveInRow,
          spread,
          rowTransitions
        };
      });

      // Sort by score (highest first)
      scoredCombinations.sort((a, b) => b.score - a.score);

      // Return the highest scoring combination
      return scoredCombinations[0].seats.map(seat => seat.id);
    };

    return findSeatsInClusters();
  };

  const handleSeatNumberChange = (value) => {
    const num = parseInt(value);
    if (num >= 1 && num <= 7) {
      setNumberOfSeats(num);
      const adjacentSeats = findAdjacentSeats(num);
      setAllocatedSeats(adjacentSeats || []);
    }
  };

  const handleBookSeats = async () => {
    if (allocatedSeats.length === 0) {
      toast({
        title: 'Error',
        description: 'No available adjacent seats found',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to book seats');
        navigate('/login');
        return;
      }

      const response = await fetch('https://train-reservation-wsrg.onrender.com/api/seats/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          seatIds: allocatedSeats
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          setError('Your session has expired. Please login again.');
          navigate('/login');
          return;
        }
        const data = await response.json();
        throw new Error(data.message || 'Failed to book seats');
      }

      const data = await response.json();

      setSessionBookedSeats(prev => [...prev, ...allocatedSeats]);

      toast({
        title: 'Success',
        description: `Seats ${allocatedSeats.map(id => {
          const seat = seats.find(s => s.id === id);
          return seat ? seat.seatNumber : id;
        }).join(', ')} booked successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      fetchSeats();
      setAllocatedSeats([]);
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleResetSeats = async () => {
    if (!user) {
      setError('Please login to reset seats');
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to reset seats');
        navigate('/login');
        return;
      }

      const response = await fetch('https://train-reservation-wsrg.onrender.com/api/seats/reset', {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          setError('Your session has expired. Please login again.');
          navigate('/login');
          return;
        }
        throw new Error('Failed to reset seats');
      }

      const data = await response.json();
      
      // Update the frontend state with the reset data from backend
      setSeats(prevSeats => 
        prevSeats.map(seat => ({
          ...seat,
          isBooked: false
        }))
      );
      
      setAllocatedSeats([]);
      setNumberOfSeats(1);
      setSessionBookedSeats([]);
      
      toast({
        title: 'Success',
        description: 'All seats have been reset successfully',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });

      // Refresh the seats data from the backend
      fetchSeats();
    } catch (error) {
      console.error('Reset error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset seats',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Calculate total seats and rows
  const totalSeats = 80;
  const seatsPerRow = 7;
  const rows = Math.ceil(totalSeats / seatsPerRow);
  
  // Only create seatRows if seats is an array
  const seatRows = Array.isArray(seats) ? Array.from({ length: rows }, (_, rowIndex) => {
    const start = rowIndex * seatsPerRow;
    const end = Math.min(start + seatsPerRow, totalSeats);
    return seats.slice(start, end);
  }) : [];

  if (isLoading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text>Loading seats...</Text>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text color="red.500">{error}</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Card mb={8} boxShadow="xl">
        <CardBody>
          <Flex justify="space-between" align="center" mb={6}>
            <Heading size="xl" color="blue.600">Train Seat Booking</Heading>
            <HStack spacing={4}>
              <Badge colorScheme="blue" fontSize="md" p={2}>
                Welcome, {user?.email}
              </Badge>
              <Button
                colorScheme="red"
                variant="outline"
                onClick={logout}
                _hover={{ bg: 'red.50' }}
              >
                Logout
              </Button>
            </HStack>
          </Flex>

          <HStack spacing={8} align="flex-start">
            <Box flex="1">
              <VStack spacing={4} align="stretch">
                <Box
                  p={4}
                  borderWidth="1px"
                  borderRadius="lg"
                  bg="gray.50"
                >
                  <Text fontSize="lg" fontWeight="bold" mb={4} textAlign="center">
                    Seat Map
                  </Text>
                  <VStack spacing={4}>
                    {seatRows.map((row, rowIndex) => (
                      <SimpleGrid
                        key={rowIndex}
                        columns={row.length}
                        spacing={2}
                        width="100%"
                      >
                        {row.map((seat) => (
                          <Tooltip
                            key={seat.id}
                            label={seat.isBooked ? 'Booked' : 'Available'}
                            placement="top"
                          >
                            <Button
                              size="sm"
                              colorScheme={
                                seat.isBooked 
                                  ? 'red' 
                                  : allocatedSeats.includes(seat.id)
                                    ? 'blue' 
                                    : 'green'
                              }
                              isDisabled={true}
                              _hover={{ cursor: 'default' }}
                            >
                              {seat.seatNumber}
                            </Button>
                          </Tooltip>
                        ))}
                      </SimpleGrid>
                    ))}
                  </VStack>
                </Box>
              </VStack>
            </Box>

            <Card width="350px" boxShadow="lg">
              <CardBody>
                <VStack spacing={6} align="stretch">
                  <Heading size="md" color="blue.600">Booking Details</Heading>
                  
                  <HStack spacing={4} justify="center" mb={4}>
                    <Box
                      p={4}
                      borderRadius="lg"
                      bg="blue.50"
                      boxShadow="sm"
                      minW="150px"
                      textAlign="center"
                    >
                      <Text fontSize="sm" color="blue.600" fontWeight="medium">Booked Seats</Text>
                      <Text fontSize="2xl" color="blue.700" fontWeight="bold">
                        {seats.filter(seat => seat.isBooked).length}
                      </Text>
                      {sessionBookedSeats.length > 0 && (
                        <Text fontSize="xs" color="blue.500" mt={1}>
                          (Session: {sessionBookedSeats.length})
                        </Text>
                      )}
                    </Box>
                    <Box
                      p={4}
                      borderRadius="lg"
                      bg="green.50"
                      boxShadow="sm"
                      minW="150px"
                      textAlign="center"
                    >
                      <Text fontSize="sm" color="green.600" fontWeight="medium">Available Seats</Text>
                      <Text fontSize="2xl" color="green.700" fontWeight="bold">
                        {seats.filter(seat => !seat.isBooked).length}
                      </Text>
                    </Box>
                  </HStack>

                  <FormControl>
                    <FormLabel color="gray.700">Number of Seats</FormLabel>
                    <NumberInput
                      min={1}
                      max={7}
                      value={numberOfSeats}
                      onChange={handleSeatNumberChange}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>

                  {allocatedSeats.length > 0 && (
                    <Box
                      p={4}
                      borderWidth="1px"
                      borderRadius="md"
                      bg="blue.50"
                    >
                      <Text fontWeight="bold" color="blue.700">
                        Allocated Seats:
                      </Text>
                      <Text fontSize="lg" color="blue.600">
                        {allocatedSeats.map(id => {
                          const seat = seats.find(s => s.id === id);
                          return seat ? seat.seatNumber : id;
                        }).join(', ')}
                      </Text>
                    </Box>
                  )}

                  <Button
                    colorScheme="gray"
                    variant="outline"
                    onClick={handleResetSeats}
                    mb={4}
                  >
                    Reset Selection
                  </Button>

                  <Button
                    colorScheme="blue"
                    size="lg"
                    onClick={handleBookSeats}
                    isDisabled={allocatedSeats.length === 0}
                    _hover={{
                      transform: 'translateY(-2px)',
                      boxShadow: 'lg',
                    }}
                  >
                    Book Seats
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          </HStack>
        </CardBody>
      </Card>
    </Container>
  );
};

export default SeatBooking; 