import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Divider,
  Chip,
  CircularProgress,
  Button,
  IconButton,
  useMediaQuery,
  useTheme,
  TextField,
  InputAdornment
} from '@mui/material';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import SearchIcon from '@mui/icons-material/Search';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import { useNavigate } from 'react-router-dom';
import { trackEvent, EventTypes } from '../../utils/eventTracking';

// Define navigation items for cuisines page
const cuisineNavItems = [
  { name: 'Home', path: '/' },
  { name: 'Locations', path: '/locations' },
  { name: 'Top Picks', path: '/top-picks' }
];

// All available cuisines with their images
const allCuisines = [
  { id: 1, title: 'Italian', img: '/images/cuisine_images/Italian_cuisine.jpg', description: 'Experience the rich flavors of Italy, from perfect pasta to wood-fired pizzas' },
  { id: 2, title: 'Mexican', img: '/images/cuisine_images/Mexican_cuisine.jpg', description: 'Bold, vibrant dishes featuring spicy flavors and fresh ingredients' },
  { id: 3, title: 'Mediterranean', img: '/images/cuisine_images/Mediterranean_cuisine.jpg', description: 'Healthy cuisine emphasizing olive oil, fresh vegetables, and herbs' },
  { id: 4, title: 'Indian', img: '/images/cuisine_images/Indian_cuisine.jpg', description: 'Aromatic spices create rich curries, tandoori specialties, and naan bread' },
  { id: 5, title: 'Thai', img: '/images/cuisine_images/Thai_cuisine.jpg', description: 'Balance of sweet, sour, salty and spicy flavors in every authentic dish' },
  { id: 6, title: 'Chinese', img: '/images/cuisine_images/Chinese_cuisine.jpg', description: 'Diverse regional styles with stir-fries, dumplings, and flavorful specialties' },
  { id: 7, title: 'Japanese', img: '/images/cuisine_images/Japanese_cuisine.jpg', description: 'Precise preparation and presentation of sushi, ramen, and more' },
  { id: 8, title: 'American', img: '/images/cuisine_images/American_cuisine.jpg', description: 'Classic comfort foods from burgers to BBQ with regional variations' },
  { id: 9, title: 'Greek', img: '/images/cuisine_images/Mediterranean_cuisine.jpg', description: 'Mediterranean flavors featuring olive oil, feta, seafood, and more' }
];

function Cuisines() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  
  const [selectedCuisine, setSelectedCuisine] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cuisines, setCuisines] = useState(allCuisines);
  
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    // Filter cuisines based on search term
    if (searchTerm) {
      const filtered = allCuisines.filter(cuisine => 
        cuisine.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setCuisines(filtered);
    } else {
      setCuisines(allCuisines);
    }
  }, [searchTerm]);

  // Function to load restaurants for a selected cuisine
  const loadRestaurantsForCuisine = async (cuisine) => {
    try {
      setLoading(true);
      setSelectedCuisine(cuisine);
      
      // Track the cuisine selection event
      trackEvent(EventTypes.CUISINE_SELECTED, { cuisineType: cuisine.title });
      
      // Get auth token if available
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      // Fetch restaurants from API filtered by cuisine and sorted by rating
      const response = await axios.get(`${API_URL}/restaurants?cuisine=${cuisine.title}&sortBy=rating&sortOrder=desc`, config);
      
      // If we get data, use it
      if (response.data && response.data.length > 0) {
        setRestaurants(response.data);
      } else {
        // Otherwise, fetch recommendations and filter by cuisine
        const recResponse = await axios.get(`${API_URL}/recommendations`, config);
        
        // Filter recommendations that match the cuisine
        const filteredRecs = recResponse.data.filter(rec => 
          rec.restaurantCategories && rec.restaurantCategories.toLowerCase().includes(cuisine.title.toLowerCase())
        );
        
        // Transform API response to match expected format
        const transformedRecs = filteredRecs.map(rec => ({
          id: rec.id,
          name: rec.restaurantName,
          categories: rec.restaurantCategories,
          image: `/images/cuisine_images/${cuisine.title}_cuisine.jpg`,
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
      setLoading(false);
      
      // Fallback to create mock data for the selected cuisine
      const mockRestaurants = createMockRestaurants(cuisine.title);
      setRestaurants(mockRestaurants);
    }
  };

  // Create mock restaurants for a cuisine if API fails
  const createMockRestaurants = (cuisineTitle) => {
    const restaurantNames = {
      'Italian': ['Bella Italia', 'Pasta Paradise', 'Trattoria Milano', 'Pizza Napoli', 'Romano\'s'],
      'Mexican': ['Cancun Grill', 'Taco Fiesta', 'El Mariachi', 'Casa Mexico', 'Oaxaca Kitchen'],
      'Mediterranean': ['Athens Taverna', 'Olive & Herb', 'Santorini', 'The Mediterranean', 'Cyprus Grill'],
      'Indian': ['Mumbai Spice', 'Taj Palace', 'Delhi Darbar', 'Curry House', 'Saffron Indian Cuisine'],
      'Thai': ['Bangkok Kitchen', 'Thai Orchid', 'Basil & Spice', 'Siam Thai', 'Royal Thai'],
      'Chinese': ['Golden Dragon', 'Peking Palace', 'Shanghai Garden', 'Wok & Roll', 'Dim Sum House'],
      'Japanese': ['Tokyo Sushi', 'Sakura', 'Fuji Japanese', 'Miyako', 'Ramen House'],
      'American': ['American Diner', 'Burger Shack', 'Stars & Stripes', 'Liberty Grill', 'Main Street Cafe'],
      'Greek': ['Olympus Taverna', 'Greek Islands', 'Acropolis', 'Mykonos', 'Athena Greek Cuisine']
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
              {restaurant.rating}
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
        navItems={cuisineNavItems} 
      />
      
      <Container maxWidth="lg" sx={{ flex: 1, py: 4 }}>
        {selectedCuisine ? (
          // Selected cuisine view with restaurants
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <Button 
                startIcon={<ArrowBackIcon />}
                onClick={() => setSelectedCuisine(null)}
                sx={{ mr: 2 }}
              >
                Back to Cuisines
              </Button>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                {selectedCuisine.title} Restaurants
              </Typography>
            </Box>
            
            <Typography variant="subtitle1" sx={{ mb: 4 }}>
              {selectedCuisine.description}
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box>
                {restaurants.map(restaurant => (
                  <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                ))}
              </Box>
            )}
          </>
        ) : (
          // Cuisine selection view
          <>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 4 }}>
              Explore Cuisines
            </Typography>
            
            <TextField
              fullWidth
              placeholder="Search cuisines..."
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ mb: 4 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            
            <Grid container spacing={3}>
              {cuisines.map((cuisine) => (
                <Grid item xs={12} sm={6} md={4} key={cuisine.id}>
                  <Card 
                    onClick={() => loadRestaurantsForCuisine(cuisine)}
                    sx={{
                      position: 'relative',
                      borderRadius: 2,
                      overflow: 'hidden',
                      height: 250,
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
                      image={cuisine.img}
                      alt={cuisine.title}
                      sx={{ height: '100%' }}
                    />
                    <Box sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      p: 2,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
                      color: 'white'
                    }}>
                      <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
                        {cuisine.title}
                      </Typography>
                      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                        <RestaurantIcon sx={{ fontSize: 16, mr: 0.5 }} />
                        <Typography variant="body2">
                          Explore restaurants
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Container>
      
      <Footer />
    </Box>
  );
}

export default Cuisines;