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
      if (!token) {
        setError('Please login to view seats');
        navigate('/login');
        return;
      }

      console.log('Fetching seats with token:', token); // Debug log

      const response = await fetch('https://train-reservation-wsrg.onrender.com/api/seats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Seats response status:', response.status); // Debug log

      if (!response.ok) {
        if (response.status === 401) {
          console.log('Unauthorized - redirecting to login'); // Debug log
          localStorage.removeItem('token');
          setError('Please login to view seats');
          navigate('/login');
          return;
        }
        throw new Error('Failed to fetch seats');
      }

      const data = await response.json();
      console.log('Seats data:', data); // Debug log

      if (Array.isArray(data)) {
        setSeats(data);
        setError('');
      } else {
        console.error('Invalid seats data format:', data); // Debug log
        setSeats([]);
        setError('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching seats:', error);
      setError('Failed to fetch seats. Please try again.');
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
    const sortedSeats = [...availableSeats].sort((a, b) => a.id - b.id);
    
    for (let i = 0; i <= sortedSeats.length - numSeats; i++) {
      const potentialGroup = sortedSeats.slice(i, i + numSeats);
      const isAdjacent = potentialGroup.every((seat, index) => {
        if (index === 0) return true;
        return seat.id === potentialGroup[index - 1].id + 1;
      });
      
      if (isAdjacent) {
        return potentialGroup.map(seat => seat.id);
      }
    }
    
    return null;
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
      const response = await fetch('https://train-reservation-wsrg.onrender.com/api/seats/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          seatIds: allocatedSeats
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to book seats');
      }

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
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Please login to reset seats');
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