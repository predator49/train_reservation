import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
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

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authAPI.login({
        email: email.trim(),
        password: password.trim()
      });

      if (response.data) {
        const token = `Bearer ${response.data.token}`;
        localStorage.setItem('token', token);
        login({ 
          email: email.trim(), 
          id: response.data.id,
          token: token 
        });
        
        toast({
          title: 'Login Successful',
          description: 'Welcome back!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        navigate('/');
      }
    } catch (err) {
      console.error('Login error:', err);
      toast({
        title: 'Login Failed',
        description: err.response?.data?.message || 'Invalid email or password',
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
          <Box
            bg="blue.500"
            p={4}
            borderRadius="full"
            color="white"
            fontSize="3xl"
            width="100px"
            height="100px"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            🚂
          </Box>
        </Center>
        
        <VStack spacing={6} align="stretch">
          <Heading 
            textAlign="center" 
            size="xl" 
            color="blue.600"
            fontWeight="bold"
          >
            Welcome Back
          </Heading>
          
          <Text 
            textAlign="center" 
            color="gray.600"
            fontSize="lg"
          >
            Sign in to continue your journey
          </Text>

          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel color="gray.700">Email Address</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                width="full"
                mt={4}
                isLoading={isLoading}
                loadingText="Signing in..."
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: 'lg',
                }}
              >
                Sign In
              </Button>
            </VStack>
          </form>

          <Text textAlign="center" color="gray.600">
            Don't have an account?{' '}
            <Link
              color="blue.500"
              fontWeight="bold"
              onClick={() => navigate('/register')}
              _hover={{ textDecoration: 'none', color: 'blue.600' }}
            >
              Create one
            </Link>
          </Text>
        </VStack>
      </Box>
    </Container>
  );
};

export default Login; 