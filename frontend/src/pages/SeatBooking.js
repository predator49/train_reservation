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

const SeatBooking = () => {
  const { user, logout } = useAuth();
  const [seats, setSeats] = useState([]);
  const [numberOfSeats, setNumberOfSeats] = useState(1);
  const [allocatedSeats, setAllocatedSeats] = useState([]);
  const toast = useToast();

  const fetchSeats = useCallback(async () => {
    try {
      const response = await fetch('https://train-reservation-wsrg.onrender.com/api/seats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setSeats(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch seats',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [toast]);

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
      const response = await fetch('https://train-reservation-wsrg.onrender.com:3001/api/seats/book', {
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

      toast({
        title: 'Success',
        description: `Seats ${allocatedSeats.join(', ')} booked successfully`,
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

  const totalSeats = 80;
  const seatsPerRow = 7;
  const rows = Math.ceil(totalSeats / seatsPerRow);
  
  const seatRows = Array.from({ length: rows }, (_, rowIndex) => {
    const start = rowIndex * seatsPerRow;
    const end = Math.min(start + seatsPerRow, totalSeats);
    return seats.slice(start, end);
  });

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
                              {seat.id}
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
                        {allocatedSeats.join(', ')}
                      </Text>
                    </Box>
                  )}

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