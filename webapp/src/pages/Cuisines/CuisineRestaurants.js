import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Button,
  IconButton,
  Divider,
  Card,
  CardMedia,
  CardContent,
  useMediaQuery,
  useTheme
} from '@mui/material';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import { trackEvent, EventTypes } from '../../utils/eventTracking';

// Cuisine descriptions for reference
const cuisineDescriptions = {
  'Italian': 'Experience the rich flavors of Italy, from perfect pasta to wood-fired pizzas',
  'Mexican': 'Bold, vibrant dishes featuring spicy flavors and fresh ingredients',
  'Mediterranean': 'Healthy cuisine emphasizing olive oil, fresh vegetables, and herbs',
  'Indian': 'Aromatic spices create rich curries, tandoori specialties, and naan bread',
  'Thai': 'Balance of sweet, sour, salty and spicy flavors in every authentic dish',
  'Chinese': 'Diverse regional styles with stir-fries, dumplings, and flavorful specialties',
  'Japanese': 'Precise preparation and presentation of sushi, ramen, and more',
  'American': 'Classic comfort foods from burgers to BBQ with regional variations',
  'Greek': 'Mediterranean flavors featuring olive oil, feta, seafood, and more'
};

// Navigation items
const navItems = [
  { name: 'Home', path: '/' },
  { name: 'Top Picks', path: '/top-picks' }
];

function CuisineRestaurants() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { cuisineTitle } = useParams();
  
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (!cuisineTitle) return;
    
    // Track the cuisine selection event
    trackEvent(EventTypes.CUISINE_SELECTED, { cuisineType: cuisineTitle });
    
    // Load restaurants for the selected cuisine
    loadRestaurantsForCuisine();
  }, [cuisineTitle]);

  // Function to load restaurants for the selected cuisine
  const loadRestaurantsForCuisine = async () => {
    try {
      setLoading(true);
      
      // Get auth token if available
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      // Fetch restaurants from API filtered by cuisine and sorted by rating
      const response = await axios.get(`${API_URL}/restaurants?cuisine=${cuisineTitle}&sortBy=rating&sortOrder=desc`, config);
      
      // If we get data, use it
      if (response.data && response.data.length > 0) {
        setRestaurants(response.data);
      } else {
        // Otherwise, fetch recommendations and filter by cuisine
        const recResponse = await axios.get(`${API_URL}/recommendations`, config);
        
        // Filter recommendations that match the cuisine
        const filteredRecs = recResponse.data.filter(rec => 
          rec.restaurantCategories && rec.restaurantCategories.toLowerCase().includes(cuisineTitle.toLowerCase())
        );
        
        // Transform API response to match expected format
        const transformedRecs = filteredRecs.map(rec => ({
          id: rec.id,
          name: rec.restaurantName,
          categories: rec.restaurantCategories,
          image: `/images/cuisine_images/${cuisineTitle}_cuisine.jpg`,
          rating: rec.rating,
          reviewCount: rec.reviewCount || Math.floor(Math.random() * 200) + 50,
          priceRange: rec.priceRange || '$$ - $$$',
          city: "Minneapolis",
          distance: "1-5 mi",
          bookmarked: false
        }));
        
        // Sort by rating in descending order
        const sortedRecs = transformedRecs.sort((a, b) => b.rating - a.rating);
        setRestaurants(sortedRecs);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading restaurants:', error);
      setError('Failed to load restaurants');
      setLoading(false);
      
      // Fallback to create mock data for the selected cuisine
      const mockRestaurants = createMockRestaurants();
      setRestaurants(mockRestaurants);
    }
  };

  // Create mock restaurants if API fails
  const createMockRestaurants = () => {
    const restaurantNames = {
      'Italian': ['Bella Italia', 'Pasta Paradise', 'Trattoria Milano', 'Pizza Napoli', 'Romano\'s'],
      'Mexican': ['Cancun Grill', 'Taco Fiesta', 'El Mariachi', 'Casa Mexico', 'Oaxaca Kitchen'],
      'Mediterranean': ['Athens Taverna', 'Olive & Herb', 'Santorini', 'The Mediterranean', 'Cyprus Grill'],
      'Indian': ['Mumbai Spice', 'Taj Palace', 'Delhi Darbar', 'Curry House', 'Saffron Indian Cuisine'],
      'Thai': ['Bangkok Kitchen', 'Thai Orchid', 'Basil & Spice', 'Siam Thai', 'Royal Thai'],
      'Chinese': ['Golden Dragon', 'Peking Palace', 'Shanghai Garden', 'Wok & Roll', 'Dim Sum House'],
      'Japanese': ['Tokyo Sushi', 'Sakura', 'Fuji Japanese', 'Miyako', 'Ramen House'],
      'American': ['American Diner', 'Burger Shack', 'Stars & Stripes', 'Liberty Grill', 'Main Street Cafe'],
      'Greek': ['Olympus Taverna', 'Greek Islands', 'Acropolis', 'Mykonos', 'Athena Greek Cuisine'],
      'Burger': ['The Burger Joint', 'Patty Palace', 'Gourmet Burgers', 'Flame Grilled', 'Burger Heaven']
    };
    
    const names = restaurantNames[cuisineTitle] || 
      [`${cuisineTitle} Restaurant 1`, `${cuisineTitle} Restaurant 2`, `${cuisineTitle} Restaurant 3`, 
       `${cuisineTitle} Restaurant 4`, `${cuisineTitle} Restaurant 5`];
    
    return names.map((name, index) => ({
      id: index + 1,
      name: name,
      image: `/images/cuisine_images/${cuisineTitle}_cuisine.jpg`,
      categories: cuisineTitle,
      rating: parseFloat((4 + Math.random()).toFixed(1)),
      reviewCount: Math.floor(Math.random() * 200) + 50,
      priceRange: ['$', '$$', '$$$'][Math.floor(Math.random() * 3)],
      city: "Minneapolis",
      distance: `${(Math.random() * 5 + 0.5).toFixed(1)} mi`,
      bookmarked: false
    })).sort((a, b) => b.rating - a.rating); // Sort by rating in descending order
  };

  // Restaurant card component
  const RestaurantCard = ({ restaurant }) => (
    <Card
      onClick={() => {
        // Track restaurant view event
        trackEvent(EventTypes.RESTAURANT_VIEWED, { 
          restaurantId: restaurant.id,
          restaurantName: restaurant.name 
        });
        console.log(`Navigate to restaurant page: ${restaurant.name}`);
      }}
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        borderRadius: 2,
        overflow: 'hidden',
        mb: 3,
        height: { xs: 'auto', md: 200 },
        cursor: 'pointer',
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: 5
        }
      }}
    >
      <CardMedia
        component="img"
        image={restaurant.image}
        alt={restaurant.name}
        sx={{ 
          width: { xs: '100%', md: 200 },
          height: { xs: 200, md: '100%' },
          objectFit: 'cover'
        }}
      />
      
      <CardContent sx={{ flex: 1, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
            {restaurant.name}
          </Typography>
          
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              trackEvent(EventTypes.RESTAURANT_BOOKMARKED, {
                restaurantId: restaurant.id,
                restaurantName: restaurant.name,
                bookmarked: !restaurant.bookmarked
              });
            }}
          >
            {restaurant.bookmarked ? (
              <StarIcon sx={{ color: '#F76B06' }} />
            ) : (
              <StarBorderIcon sx={{ color: '#F76B06' }} />
            )}
          </IconButton>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box sx={{ 
            backgroundColor: '#F76B06', 
            color: 'white',
            borderRadius: 1,
            px: 1,
            py: 0.5,
            display: 'flex',
            alignItems: 'center',
            mr: 2
          }}>
            <Typography variant="body2" fontWeight="bold">
              {typeof restaurant.rating === 'number' ? restaurant.rating.toFixed(1) : restaurant.rating}
            </Typography>
            <StarIcon sx={{ fontSize: 16, ml: 0.5 }} />
          </Box>
          
          <Typography variant="body2" color="text.secondary">
            {restaurant.reviewCount} reviews
          </Typography>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
          
          <Typography variant="body2" color="text.secondary">
            {restaurant.priceRange}
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.primary" sx={{ mb: 2 }}>
          {restaurant.categories}
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          {restaurant.city} • {restaurant.distance} away
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar 
        buttonLabel="Log in" 
        buttonPath="/login" 
        navItems={navItems} 
      />
      
      <Container maxWidth="lg" sx={{ flex: 1, py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Button 
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')}
            sx={{ mr: 2 }}
          >
            Back to Home
          </Button>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            {cuisineTitle} Restaurants
          </Typography>
        </Box>
        
        {/* <Typography variant="subtitle1" sx={{ mb: 4 }}>
          {cuisineDescriptions[cuisineTitle] || `Explore the best ${cuisineTitle} restaurants in your area`}
        </Typography> */}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" align="center" sx={{ my: 4 }}>
            {error}
          </Typography>
        ) : restaurants.length > 0 ? (
          <Box>
            {restaurants.map(restaurant => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </Box>
        ) : (
          <Typography variant="body1" align="center" sx={{ my: 4 }}>
            No restaurants found for {cuisineTitle} cuisine.
          </Typography>
        )}
      </Container>
      
      <Footer />
    </Box>
  );
}

export default CuisineRestaurants;