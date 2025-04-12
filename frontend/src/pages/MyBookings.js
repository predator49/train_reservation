import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  HStack,
} from '@chakra-ui/react';

const MyBookings = () => {
  const { user, logout } = useAuth();

  // Mock booking data
  const bookings = [
    { id: 1, seatNumber: 5, date: '2023-04-15', status: 'Confirmed' },
    { id: 2, seatNumber: 12, date: '2023-04-16', status: 'Pending' },
  ];

  return (
    <Box p={4}>
      <HStack justify="space-between" mb={4}>
        <Heading>My Bookings</Heading>
        <Button onClick={logout}>Logout</Button>
      </HStack>

      <Text mb={4}>Welcome, {user?.email}</Text>

      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Seat Number</Th>
            <Th>Date</Th>
            <Th>Status</Th>
            <Th>Action</Th>
          </Tr>
        </Thead>
        <Tbody>
          {bookings.map((booking) => (
            <Tr key={booking.id}>
              <Td>{booking.seatNumber}</Td>
              <Td>{booking.date}</Td>
              <Td>{booking.status}</Td>
              <Td>
                <Button
                  colorScheme="red"
                  size="sm"
                  onClick={() => {
                    // TODO: Implement cancel booking logic
                    console.log(`Canceling booking ${booking.id}`);
                  }}
                >
                  Cancel
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default MyBookings; 