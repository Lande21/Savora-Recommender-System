import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  TextField,
  Card,
  CardMedia,
  CardContent,
  Stack,
  IconButton,
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import RoomIcon from '@mui/icons-material/Room';
import EnergySavingsLeafOutlinedIcon from '@mui/icons-material/EnergySavingsLeafOutlined';
import SpaOutlinedIcon from '@mui/icons-material/SpaOutlined';
import KebabDiningOutlinedIcon from '@mui/icons-material/KebabDiningOutlined';
import BreakfastDiningOutlinedIcon from '@mui/icons-material/BreakfastDiningOutlined';
import PhishingOutlinedIcon from '@mui/icons-material/PhishingOutlined';
import SoupKitchenOutlinedIcon from '@mui/icons-material/SoupKitchenOutlined';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { trackEvent, EventTypes } from '../../utils/eventTracking';
import { Favorite, FavoriteBorder, ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import CloseIcon from '@mui/icons-material/Close';

// Define the standard navigation items for Home page
const homeNavItems = [
  { name: 'Cuisines', path: '/cuisines' },
  { name: 'Locations', path: '/locations' },
  { name: 'Top Picks', path: '/top-picks' }
];

function Home() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [recommendedRestaurants, setRecommendedRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [selectedCuisine, setSelectedCuisine] = useState(null);
  const [cuisineRestaurants, setCuisineRestaurants] = useState([]);
  const [loadingCuisine, setLoadingCuisine] = useState(false);
  const [openRestaurantDialog, setOpenRestaurantDialog] = useState(false);
  
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  
  useEffect(() => {
    // Fetch personalized recommendations
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Set auth header if token exists
        const config = token 
          ? { headers: { Authorization: `Bearer ${token}` } } 
          : {};
          
        const response = await axios.get(`${API_URL}/recommendations`, config);
        
        // Transform API response to match our component's expected format
        const transformedRecommendations = response.data.map(rec => {
          // Get the first category or use "American" as default
          const firstCategory = rec.restaurantCategories 
              ? rec.restaurantCategories.split(',')[0].trim() 
              : "American";
              
          return {
              id: rec.id || Math.floor(Math.random() * 1000),
              name: rec.restaurantName || "Restaurant",
              image: `/images/cuisine_images/${firstCategory}_cuisine.jpg`,
              city: "Minneapolis",
              distance: "1-5 mi",
              rating: rec.rating || 4.0,
              bookmarked: false,
              categories: rec.restaurantCategories || "American, Burgers",
              reviewCount: rec.reviewCount || Math.floor(Math.random() * 200) + 50,
              priceRange: rec.priceRange || '$$'
          };
        });
        
        setRecommendedRestaurants(transformedRecommendations);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching recommendations:", err);
        setError("Failed to load recommendations");
        setLoading(false);
        
        // Fallback to hardcoded recommendations
        setRecommendedRestaurants([
          {
            id: 1,
            name: "Bella Italia",
            image: "/images/cuisine_images/Italian_cuisine.jpg",
            city: "Minneapolis",
            distance: "1.2 mi",
            rating: 4.8,
            bookmarked: false
          },
          {
            id: 2,
            name: "Mumbai Spice",
            image: "/images/cuisine_images/Indian_cuisine.jpg",
            city: "St. Paul",
            distance: "2.5 mi",
            rating: 4.6,
            bookmarked: true
          },
          {
            id: 3,
            name: "La Parisienne",
            image: "/images/cuisine_images/French_cuisine.jpg",
            city: "Minneapolis",
            distance: "0.8 mi",
            rating: 4.7,
            bookmarked: false
          },
          {
            id: 4,
            name: "Cancun Grill",
            image: "/images/cuisine_images/Mexican_cuisine.jpg",
            city: "Bloomington",
            distance: "3.1 mi",
            rating: 4.5,
            bookmarked: true
          },
          {
            id: 5,
            name: "Bangkok Kitchen",
            image: "/images/cuisine_images/Thai_cuisine.jpg",
            city: "Eagan",
            distance: "4.2 mi",
            rating: 4.4,
            bookmarked: false
          },
          {
            id: 6,
            name: "Athens Taverna",
            image: "/images/cuisine_images/Mediterranean_cuisine.jpg",
            city: "Edina",
            distance: "2.7 mi",
            rating: 4.3,
            bookmarked: false
          }
        ]);
      }
    };
    
    fetchRecommendations();
  }, [API_URL]);

  // Cuisine data
  const cuisines = [
    { title: 'Italian', img: '/images/cuisine_images/Italian_cuisine.jpg', description: 'Experience the rich flavors of Italy, from perfect pasta to wood-fired pizzas' },
    { title: 'Mexican', img: '/images/cuisine_images/Mexican_cuisine.jpg', description: 'Bold, vibrant dishes featuring spicy flavors and fresh ingredients' },
    { title: 'Mediterranean', img: '/images/cuisine_images/Mediterranean_cuisine.jpg', description: 'Healthy cuisine emphasizing olive oil, fresh vegetables, and herbs' },
    { title: 'Indian', img: '/images/cuisine_images/Indian_cuisine.jpg', description: 'Aromatic spices create rich curries, tandoori specialties, and naan bread' },
    { title: 'Thai', img: '/images/cuisine_images/Thai_cuisine.jpg', description: 'Balance of sweet, sour, salty and spicy flavors in every authentic dish' },
    { title: 'Chinese', img: '/images/cuisine_images/Chinese_cuisine.jpg', description: 'Diverse regional styles with stir-fries, dumplings, and flavorful specialties' },
    { title: 'Japanese', img: '/images/cuisine_images/Japanese_cuisine.jpg', description: 'Precise preparation and presentation of sushi, ramen, and more' },
    { title: 'American', img: '/images/cuisine_images/American_cuisine.jpg', description: 'Classic comfort foods from burgers to BBQ with regional variations' },
    { title: 'Greek', img: '/images/cuisine_images/Mediterranean_cuisine.jpg', description: 'Mediterranean flavors featuring olive oil, feta, seafood, and more' },
    { title: 'Burger', img: '/images/cuisine_images/Burger_cuisine.jpg', description: 'Juicy, flavorful patties with endless topping combinations and sides' }
  ];

  // Dietary preferences data
  const dietaryPreferences = [
    { title: 'Vegan', icon: <EnergySavingsLeafOutlinedIcon /> },
    { title: 'Vegetarian', icon: <SpaOutlinedIcon /> },
    { title: 'Halal', icon: <KebabDiningOutlinedIcon /> },
    { title: 'Gluten Free', icon: <BreakfastDiningOutlinedIcon /> },
    { title: 'Pescatarian', icon: <PhishingOutlinedIcon /> },
    { title: 'Kosher', icon: <SoupKitchenOutlinedIcon /> },
  ];

  // Function to handle slider navigation
  const handleSlideChange = (direction) => {
    const totalSlides = Math.ceil(recommendedRestaurants.length / 3);
    if (direction === 'next') {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    } else {
      setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    }
  };

  // Determine visible restaurants based on current slide
  const visibleRestaurants = isMobile
    ? recommendedRestaurants.slice(currentSlide, currentSlide + 1)
    : recommendedRestaurants.slice(currentSlide * 3, (currentSlide + 1) * 3);

  // Cuisine card component for reuse
  const CuisineCard = ({ cuisine, height }) => (
    <Card
      onClick={() => {
        // Track cuisine selection event
        trackEvent(EventTypes.CUISINE_SELECTED, { cuisineType: cuisine.title });
        console.log(`Selected cuisine: ${cuisine.title}`);
        
        // Navigate directly to the cuisine restaurants page
        navigate(`/cuisines/${encodeURIComponent(cuisine.title)}`);
      }}
      sx={{
        position: 'relative',
        borderRadius: 2,
        boxShadow: 3,
        overflow: 'hidden',
        height: height,
        width: '100%',
        cursor: 'pointer'
      }}
    >
      <CardMedia
        component="img"
        image={cuisine.img}
        alt={cuisine.title}
        sx={{ 
          height: '100%',
          objectFit: 'cover'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          backgroundColor: '#D3D3D3',
          px: 2,
          py: 0.5,
          borderRadius: 1,
          boxShadow: 1
        }}
      >
        <Typography
          variant="subtitle2"
          color="text.primary"
          sx={{ fontWeight: 'bold' }}
        >
          {cuisine.title}
        </Typography>
      </Box>
    </Card>
  );

  // Preference tile component
  const PreferenceTile = ({ preference }) => (
    <Card
      onClick={() => {
        // Track dietary preference selection event
        trackEvent(EventTypes.DIETARY_PREFERENCE_SELECTED, { preference: preference.title });
        console.log(`Selected dietary preference: ${preference.title}`);
        
        // Navigate to the dietary preferences page
        navigate(`/dietary/${encodeURIComponent(preference.title)}`);
      }}
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        height: 15,
        borderRadius: 2,
        backgroundColor: '#E5E5E5',
        boxShadow: 1,
        padding: 2,
        '&:hover': {
          boxShadow: 3,
          cursor: 'pointer',
          backgroundColor: '#D5D5D5'
        }
      }}
    >
      <Box sx={{ color: '#F76B06', mr: 2 }}>
        {preference.icon}
      </Box>
      <Typography 
        variant="subtitle1"
        sx={{ fontWeight: 'bold' }}
      >
        {preference.title}
      </Typography>
    </Card>
  );

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
        position: 'relative',
        borderRadius: 2,
        height: 280,
        width: '100%',
        backgroundColor: '#E5E5E5',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: 5
        }
      }}
    >
      {/* Rating badge */}
      <Box
        sx={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 2,
          backgroundColor: '#F76B06',
          color: 'white',
          px: 1,
          py: 0.5,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          fontWeight: 'bold'
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          {restaurant.rating.toFixed(1)}
        </Typography>
        <StarIcon sx={{ fontSize: 16, ml: 0.5 }} />
      </Box>
      
      {/* Bookmark button */}
      <IconButton
        onClick={(e) => {
          e.stopPropagation(); // Prevent card click
          // Track bookmark event
          trackEvent(EventTypes.RESTAURANT_BOOKMARKED, {
            restaurantId: restaurant.id,
            restaurantName: restaurant.name,
            bookmarked: !restaurant.bookmarked
          });
          console.log(`Toggle bookmark for: ${restaurant.name}`);
        }}
        sx={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          width: 32,
          height: 32,
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.9)'
          }
        }}
      >
        {restaurant.bookmarked ? (
          <StarIcon sx={{ color: '#F76B06', fontSize: 18 }} />
        ) : (
          <StarBorderIcon sx={{ color: '#F76B06', fontSize: 18 }} />
        )}
      </IconButton>
      
      {/* Restaurant Image */}
      <CardMedia
        component="img"
        image={restaurant.image}
        alt={restaurant.name}
        sx={{ height: 180, objectFit: 'cover' }}
      />
      
      {/* Restaurant Details */}
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5, lineHeight: 1.2 }}>
          {restaurant.name}
        </Typography>
        
        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <RoomIcon sx={{ fontSize: 16, mr: 0.5, color: '#666' }} />
          {restaurant.city}
        </Typography>
        
        <Divider sx={{ my: 1 }} />
        
        <Typography variant="body2" sx={{ textAlign: 'center', color: '#666' }}>
          {restaurant.distance} away
        </Typography>
      </Box>
    </Card>
  );

  const loadRestaurantsForCuisine = async (cuisine) => {
    try {
      setLoadingCuisine(true);
      setSelectedCuisine(cuisine);
      setOpenRestaurantDialog(true);
      
      // Track the cuisine selection event
      trackEvent(EventTypes.CUISINE_SELECTED, { cuisineType: cuisine.title });
      
      // Get auth token if available
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      // Fetch restaurants from API filtered by cuisine
      const response = await axios.get(`${API_URL}/restaurants?cuisine=${cuisine.title}&sortBy=rating&sortOrder=desc`, config);
      
      // If we get data, use it
      if (response.data && response.data.length > 0) {
        setCuisineRestaurants(response.data);
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
        setCuisineRestaurants(sortedRecs);
      }
      
      setLoadingCuisine(false);
    } catch (error) {
      console.error('Error loading restaurants:', error);
      setLoadingCuisine(false);
      
      // Fallback to create mock data for the selected cuisine
      const mockRestaurants = createMockRestaurants(cuisine.title);
      setCuisineRestaurants(mockRestaurants);
    }
  };

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

  const RestaurantListItem = ({ restaurant }) => (
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
      {/* Navbar with updated navigation items */}
      <Navbar 
        buttonLabel="Log in" 
        buttonPath="/login" 
        navItems={homeNavItems}
      />

      {/* Main Content */}
      <Box sx={{ flex: 1 }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, md: 3 } }}>
          {/* HERO SECTION */}
          <Box
            sx={{
              background: `linear-gradient(
                rgba(211, 211, 211, 0.6),
                rgba(211, 211, 211, 0.6)
              ), url("/images/cuisine_images/Mexican_cuisine.jpg")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              py: { xs: 6, md: 10 },
              color: '#fff',
              textAlign: 'center',
              borderRadius: 2,
              my: 3
            }}
          >
            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              sx={{ fontWeight: 700, color: '#030303' }}
            >
              Discover the Best Restaurants with Savora
            </Typography>
            <Typography variant="subtitle1" sx={{ fontSize: '1.3rem', mb: 5, color: '#030303'}}>
              Find top-rated dining spots near you!
            </Typography>

            {/* Search Row */}
            <Box
              sx={{
                backgroundColor: '#D3D3D3',
                borderRadius: 9999, // Pill shape (very large value creates rounded ends)
                p: 3,
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                mt: 3,
                mx: { xs: 2, md: 4 },
                width: { xs: 'auto', md: 'auto' }, // Make responsive
                overflow: 'hidden' // Ensure children don't overflow the rounded corners
              }}
            >
              {/* Location Field */}
              <Box sx={{ flexGrow: 1, width: { xs: '100%', sm: 'auto' } }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Location
                </Typography>
                <TextField
                  variant="outlined"
                  placeholder="Enter your city or neighborhood"
                  fullWidth
                  sx={{
                    bgcolor: '#fff',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 0 // Cornerless input
                    }
                  }}
                />
              </Box>
              
              {/* Date Field */}
              <Box sx={{ flexGrow: 1, width: { xs: '100%', sm: 'auto' } }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Date
                </Typography>
                <TextField
                  variant="outlined"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  sx={{
                    bgcolor: '#fff',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 0 // Cornerless input
                    }
                  }}
                />
              </Box>
              
              {/* Time Field - Changed to dropdown */}
              <Box sx={{ flexGrow: 1, width: { xs: '100%', sm: 'auto' } }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Time
                </Typography>
                <FormControl 
                  fullWidth
                  sx={{
                    bgcolor: '#fff',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 0 // Cornerless input
                    }
                  }}
                >
                  <Select
                    displayEmpty
                    defaultValue=""
                  >
                    <MenuItem value="">Select time</MenuItem>
                    <MenuItem value="07:00">7:00 AM</MenuItem>
                    <MenuItem value="07:30">7:30 AM</MenuItem>
                    <MenuItem value="08:00">8:00 AM</MenuItem>
                    <MenuItem value="08:30">8:30 AM</MenuItem>
                    <MenuItem value="09:00">9:00 AM</MenuItem>
                    <MenuItem value="09:30">9:30 AM</MenuItem>
                    <MenuItem value="10:00">10:00 AM</MenuItem>
                    <MenuItem value="10:30">10:30 AM</MenuItem>
                    <MenuItem value="11:00">11:00 AM</MenuItem>
                    <MenuItem value="11:30">11:30 AM</MenuItem>
                    <MenuItem value="12:00">12:00 PM</MenuItem>
                    <MenuItem value="12:30">12:30 PM</MenuItem>
                    <MenuItem value="13:00">1:00 PM</MenuItem>
                    <MenuItem value="13:30">1:30 PM</MenuItem>
                    <MenuItem value="14:00">2:00 PM</MenuItem>
                    <MenuItem value="14:30">2:30 PM</MenuItem>
                    <MenuItem value="15:00">3:00 PM</MenuItem>
                    <MenuItem value="15:30">3:30 PM</MenuItem>
                    <MenuItem value="16:00">4:00 PM</MenuItem>
                    <MenuItem value="16:30">4:30 PM</MenuItem>
                    <MenuItem value="17:00">5:00 PM</MenuItem>
                    <MenuItem value="17:30">5:30 PM</MenuItem>
                    <MenuItem value="18:00">6:00 PM</MenuItem>
                    <MenuItem value="18:30">6:30 PM</MenuItem>
                    <MenuItem value="19:00">7:00 PM</MenuItem>
                    <MenuItem value="19:30">7:30 PM</MenuItem>
                    <MenuItem value="20:00">8:00 PM</MenuItem>
                    <MenuItem value="20:30">8:30 PM</MenuItem>
                    <MenuItem value="21:00">9:00 PM</MenuItem>
                    <MenuItem value="21:30">9:30 PM</MenuItem>
                    <MenuItem value="22:00">10:00 PM</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              {/* Guests Field */}
              <Box sx={{ flexGrow: 1, width: { xs: '100%', sm: 'auto' } }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Guests
                </Typography>
                <FormControl 
                  fullWidth
                  sx={{
                    bgcolor: '#fff',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 0 // Cornerless input
                    }
                  }}
                >
                  <Select
                    displayEmpty
                    defaultValue=""
                    renderValue={(selected) => {
                      if (!selected) {
                        return (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PersonOutlineOutlinedIcon sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography sx={{ color: 'text.secondary' }}>Select Guests</Typography>
                          </Box>
                        );
                      }
                      return selected;
                    }}
                  >
                    <MenuItem value="">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonOutlineOutlinedIcon sx={{ mr: 1 }} />
                        <span>Select Guests</span>
                      </Box>
                    </MenuItem>
                    <MenuItem value={1}>1 person</MenuItem>
                    <MenuItem value={2}>2 people</MenuItem>
                    <MenuItem value={3}>3 people</MenuItem>
                    <MenuItem value={4}>4 people</MenuItem>
                    <MenuItem value={5}>5 people</MenuItem>
                    <MenuItem value={6}>6 people</MenuItem>
                    <MenuItem value={7}>7 people</MenuItem>
                    <MenuItem value={8}>8+ people</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              {/* Search Button */}
              <Box sx={{ display: 'flex', alignItems: 'flex-end', width: { xs: '100%', sm: 'auto' } }}>
                <Button
                  variant="contained"
                  disableElevation
                  onClick={() => {
                    // Track search event
                    trackEvent(EventTypes.SEARCH_PERFORMED, {
                      location: document.querySelector('input[placeholder="Enter your city or neighborhood"]').value,
                      date: document.querySelector('input[type="date"]').value,
                      // Get other search parameters
                    });
                  }}
                  sx={{
                    bgcolor: '#F76B06',
                    '&:hover': { bgcolor: '#e86000' },
                    textTransform: 'none',
                    borderRadius: 0, // Cornerless button
                    height: 56,
                    width: { xs: '100%', sm: 56 },
                    minWidth: 56,
                    p: 0,
                    mt: { xs: 0, sm: 3.5 } // Align with fields when label is visible
                  }}
                >
                  <ArrowForwardOutlinedIcon sx={{ fontSize: 28 }} /> {/* Increased icon size from default to 28px */}
                </Button>
              </Box>
            </Box>
          </Box>

          {/* POPULAR CUISINES SECTION - 2 ROWS OF 5 */}
          <Box sx={{ my: { xs: 4, md: 6 } }}>
            <Typography variant="h4" align="left" gutterBottom sx={{ fontWeight: 600 }}>
              Popular cuisines
            </Typography>

            <Grid container spacing={2}>
              {cuisines.map((cuisine, index) => (
                <Grid 
                  item 
                  xs={6} 
                  sm={4} 
                  md={2.4} // This makes 5 items per row on medium and larger screens
                  key={index}
                >
                  <CuisineCard cuisine={cuisine} height={130} />
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* DIETARY PREFERENCES SECTION */}
          <Box sx={{ my: { xs: 4, md: 6 } }}>
            <Typography variant="h4" align="left" gutterBottom sx={{ fontWeight: 600 }}>
              Dietary preferences
            </Typography>
            
            <Grid container spacing={3}>
              {/* First Row */}
              <Grid item xs={12} sm={4} md={4}>
                <PreferenceTile preference={dietaryPreferences[0]} /> {/* Vegan */}
              </Grid>
              <Grid item xs={12} sm={4} md={4}>
                <PreferenceTile preference={dietaryPreferences[1]} /> {/* Vegetarian */}
              </Grid>
              <Grid item xs={12} sm={4} md={4}>
                <PreferenceTile preference={dietaryPreferences[2]} /> {/* Halal */}
              </Grid>
              
              {/* Second Row */}
              <Grid item xs={12} sm={4} md={4}>
                <PreferenceTile preference={dietaryPreferences[3]} /> {/* Gluten Free */}
              </Grid>
              <Grid item xs={12} sm={4} md={4}>
                <PreferenceTile preference={dietaryPreferences[4]} /> {/* Pescatarian */}
              </Grid>
              <Grid item xs={12} sm={4} md={4}>
                <PreferenceTile preference={dietaryPreferences[5]} /> {/* Kosher */}
              </Grid>
            </Grid>
          </Box>

          {/* HIGHLY RECOMMENDED SECTION WITH SLIDER */}
          <Box sx={{ my: { xs: 4, md: 6 }, pb: 4 }}>
            <Typography variant="h4" align="left" gutterBottom sx={{ fontWeight: 600 }}>
              Highly recommended
            </Typography>

            {/* Slider container */}
            <Box sx={{ position: 'relative', mt: 2 }}>
              {/* Navigation buttons */}
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  position: 'absolute',
                  width: '100%',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 2,
                  px: 1
                }}
              >
                <IconButton
                  onClick={() => handleSlideChange('prev')}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.7)',
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' }
                  }}
                >
                  <ArrowBackIosNewIcon />
                </IconButton>
                <IconButton
                  onClick={() => handleSlideChange('next')}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.7)',
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' }
                  }}
                >
                  <ArrowForwardIosIcon />
                </IconButton>
              </Box>

              {/* Restaurant cards grid */}
              <Grid container spacing={3}>
                {visibleRestaurants.map(restaurant => (
                  <Grid item xs={12} sm={6} md={4} key={restaurant.id}>
                    <RestaurantCard restaurant={restaurant} />
                  </Grid>
                ))}
              </Grid>

              {/* Pagination indicators */}
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  mt: 2
                }}
              >
                {Array.from(Array(Math.ceil(recommendedRestaurants.length / (isMobile ? 1 : 3))).keys()).map((index) => (
                  <Box
                    key={index}
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: currentSlide === index ? '#F76B06' : '#D3D3D3',
                      mx: 0.5,
                      cursor: 'pointer'
                    }}
                    onClick={() => setCurrentSlide(index)}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Footer />

      {/* Restaurant List Dialog */}
      <Dialog
        open={openRestaurantDialog}
        onClose={() => setOpenRestaurantDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 0
        }}>
          <Box>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
              {selectedCuisine?.title} Restaurants
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {selectedCuisine?.description}
            </Typography>
          </Box>
          <IconButton 
            onClick={() => setOpenRestaurantDialog(false)}
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
          {loadingCuisine ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : cuisineRestaurants.length > 0 ? (
            <Box>
              {cuisineRestaurants.map(restaurant => (
                <RestaurantListItem key={restaurant.id} restaurant={restaurant} />
              ))}
            </Box>
          ) : (
            <Typography variant="body1" align="center" sx={{ py: 4 }}>
              No restaurants found for {selectedCuisine?.title} cuisine.
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default Home;
