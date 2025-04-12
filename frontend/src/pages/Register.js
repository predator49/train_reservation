import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  Link,
  Container,
  useToast,
  InputGroup,
  InputRightElement,
  IconButton,
  Image,
  Center,
} from '@chakra-ui/react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      toast({
        title: 'Registration Successful',
        description: 'You can now login with your credentials',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      navigate('/login');
    } catch (err) {
      toast({
        title: 'Registration Failed',
        description: err.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.sm" py={10}>
      <Box
        maxW="md"
        mx="auto"
        p={8}
        borderWidth="1px"
        borderRadius="lg"
        boxShadow="xl"
        bg="white"
      >
        <Center mb={6}>
          <Image
            src="/train-logo.png"
            alt="Train Logo"
            boxSize="100px"
            objectFit="contain"
          />
        </Center>

        <VStack spacing={6} align="stretch">
          <Heading 
            textAlign="center" 
            size="xl" 
            color="blue.600"
            fontWeight="bold"
          >
            Create Account
          </Heading>

          <Text 
            textAlign="center" 
            color="gray.600"
            fontSize="lg"
          >
            Join us for your journey
          </Text>

          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel color="gray.700">Full Name</FormLabel>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  size="lg"
                  focusBorderColor="blue.500"
                  isDisabled={isLoading}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel color="gray.700">Email Address</FormLabel>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  size="lg"
                  focusBorderColor="blue.500"
                  isDisabled={isLoading}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel color="gray.700">Password</FormLabel>
                <InputGroup size="lg">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    focusBorderColor="blue.500"
                    isDisabled={isLoading}
                  />
                  <InputRightElement>
                    <IconButton
                      variant="ghost"
                      icon={showPassword ? '👁️' : '👁️‍🗨️'}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      isDisabled={isLoading}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <FormControl isRequired>
                <FormLabel color="gray.700">Confirm Password</FormLabel>
                <InputGroup size="lg">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    focusBorderColor="blue.500"
                    isDisabled={isLoading}
                  />
                  <InputRightElement>
                    <IconButton
                      variant="ghost"
                      icon={showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      isDisabled={isLoading}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                width="full"
                mt={4}
                isLoading={isLoading}
                loadingText="Creating account..."
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: 'lg',
                }}
              >
                Register
              </Button>
            </VStack>
          </form>

          <Text textAlign="center" color="gray.600">
            Already have an account?{' '}
            <Link
              color="blue.500"
              fontWeight="bold"
              onClick={() => navigate('/login')}
              _hover={{ textDecoration: 'none', color: 'blue.600' }}
            >
              Sign in
            </Link>
          </Text>
        </VStack>
      </Box>
    </Container>
  );
};

export default Register; 