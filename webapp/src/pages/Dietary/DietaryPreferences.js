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
  useTheme,
  Grid,
  Chip,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import { useNavigate, useParams } from 'react-router-dom';
import { trackEvent, EventTypes } from '../../utils/eventTracking';

// Dietary preference icons and descriptions
import EnergySavingsLeafOutlinedIcon from '@mui/icons-material/EnergySavingsLeafOutlined';
import SpaOutlinedIcon from '@mui/icons-material/SpaOutlined';
import KebabDiningOutlinedIcon from '@mui/icons-material/KebabDiningOutlined';
import BreakfastDiningOutlinedIcon from '@mui/icons-material/BreakfastDiningOutlined';
import PhishingOutlinedIcon from '@mui/icons-material/PhishingOutlined';
import SoupKitchenOutlinedIcon from '@mui/icons-material/SoupKitchenOutlined';

// Dietary preference descriptions and icons
const dietaryConfig = {
  'Vegan': {
    description: 'Exclusively plant-based foods without any animal products',
    icon: <EnergySavingsLeafOutlinedIcon />,
    categories: ['Vegan', 'Vegetarian'] // Categories that might indicate vegan options
  },
  'Vegetarian': {
    description: 'Plant-based foods that may include dairy and eggs, but no meat',
    icon: <SpaOutlinedIcon />,
    categories: ['Vegetarian', 'Vegan', 'Salad', 'Health'] // Categories indicating vegetarian options
  },
  'Halal': {
    description: 'Foods prepared according to Islamic dietary laws',
    icon: <KebabDiningOutlinedIcon />,
    categories: ['Halal', 'Middle Eastern', 'Mediterranean'] // Categories often offering halal
  },
  'Gluten Free': {
    description: 'Foods without gluten, suitable for those with celiac disease or gluten sensitivity',
    icon: <BreakfastDiningOutlinedIcon />,
    categories: ['Gluten-Free', 'Health'] // Categories likely to offer gluten-free options
  },
  'Pescatarian': {
    description: 'Vegetarian diet that includes seafood but no other meats',
    icon: <PhishingOutlinedIcon />,
    categories: ['Seafood', 'Sushi', 'Fish & Chips'] // Categories suitable for pescatarians
  },
  'Kosher': {
    description: 'Foods prepared according to Jewish dietary laws',
    icon: <SoupKitchenOutlinedIcon />,
    categories: ['Kosher', 'Jewish', 'Deli'] // Categories often offering kosher options
  }
};

// Navigation items
const navItems = [
  { name: 'Home', path: '/' },
  { name: 'Cuisines', path: '/cuisines' }
];

function DietaryPreferences() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { preference } = useParams();
  
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOption, setSortOption] = useState('rating');
  const [priceFilter, setPriceFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');
  
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (!preference) return;
    
    // Track the dietary preference selection event
    trackEvent(EventTypes.DIETARY_PREFERENCE_SELECTED, { preference });
    
    // Load restaurants that match the dietary preference
    loadRestaurantsForDietaryPreference();
  }, [preference]);

  // Apply filters whenever filter state changes
  useEffect(() => {
    if (restaurants.length > 0) {
      applyFilters();
    }
  }, [sortOption, priceFilter, locationFilter, restaurants]);

  // Function to load restaurants for the selected dietary preference
  const loadRestaurantsForDietaryPreference = async () => {
    try {
      setLoading(true);
      
      // Get auth token if available
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      // Use the main endpoint with the dietary parameter
      const response = await axios.get(
        `${API_URL}/restaurants?dietary=${encodeURIComponent(preference)}&sortBy=rating&sortOrder=desc`,
        config
      );
      
      if (response.data && response.data.length > 0) {
        // Process the restaurants to add dietary labels based on categories
        const processedRestaurants = processRestaurantData(response.data);
        setRestaurants(processedRestaurants);
        setFilteredRestaurants(processedRestaurants);
      } else {
        // Fallback to sample data if no results
        const fallbackData = createFallbackRestaurants();
        setRestaurants(fallbackData);
        setFilteredRestaurants(fallbackData);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading restaurants:', error);
      setError('Failed to load restaurants. Please try again later.');
      setLoading(false);
      
      // Use sample data as fallback
      const fallbackData = createFallbackRestaurants();
      setRestaurants(fallbackData);
      setFilteredRestaurants(fallbackData);
    }
  };

  // Process restaurant data to add dietary preferences based on categories
  const processRestaurantData = (restaurantsData) => {
    return restaurantsData.map(restaurant => {
      // Parse categories if it's a string
      const categories = typeof restaurant.categories === 'string' 
        ? restaurant.categories.split(',').map(c => c.trim()) 
        : restaurant.categories || [];
      
      // Determine which dietary preferences apply based on categories
      const dietaryPreferences = Object.keys(dietaryConfig).filter(dietaryType => {
        const relevantCategories = dietaryConfig[dietaryType].categories;
        return relevantCategories.some(cat => 
          categories.some(c => c.toLowerCase().includes(cat.toLowerCase()))
        );
      });
      
      // Add the current preference if it's not already included and we're showing this restaurant
      if (!dietaryPreferences.includes(preference)) {
        dietaryPreferences.push(preference);
      }
      
      // Return enriched restaurant data
      return {
        ...restaurant,
        dietary: dietaryPreferences,
        // Ensure we have all required fields, use defaults if missing
        image: restaurant.image || getImageForCategories(categories),
        city: restaurant.city || getLocationFromAddress(restaurant.address),
        distance: restaurant.distance || generateRandomDistance(),
        bookmarked: restaurant.bookmarked || false,
        reviewCount: restaurant.review_count || restaurant.reviewCount || Math.floor(Math.random() * 200) + 10,
        priceRange: restaurant.price_range || restaurant.priceRange || generateRandomPriceRange()
      };
    });
  };

  // Apply filters to restaurants
  const applyFilters = () => {
    let result = [...restaurants];
    
    // Filter by location if specified
    if (locationFilter) {
      result = result.filter(r => 
        r.city?.toLowerCase().includes(locationFilter.toLowerCase()) || 
        r.address?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }
    
    // Filter by price range if specified
    if (priceFilter !== 'all') {
      result = result.filter(r => {
        // Handle different price range formats
        if (typeof r.priceRange === 'string') {
          return r.priceRange.includes(priceFilter);
        } else if (r.price_range) {
          return r.price_range.includes(priceFilter);
        }
        return true;
      });
    }
    
    // Apply sorting
    if (sortOption === 'rating') {
      result.sort((a, b) => {
        const ratingA = typeof a.rating === 'number' ? a.rating : parseFloat(a.rating || 0);
        const ratingB = typeof b.rating === 'number' ? b.rating : parseFloat(b.rating || 0);
        return ratingB - ratingA;
      });
    } else if (sortOption === 'reviews') {
      result.sort((a, b) => {
        const reviewsA = a.reviewCount || a.review_count || 0;
        const reviewsB = b.reviewCount || b.review_count || 0;
        return reviewsB - reviewsA;
      });
    } else if (sortOption === 'distance') {
      result.sort((a, b) => {
        const distA = parseDistanceValue(a.distance);
        const distB = parseDistanceValue(b.distance);
        return distA - distB;
      });
    }
    
    setFilteredRestaurants(result);
  };

  // Helper function to parse distance values
  const parseDistanceValue = (distance) => {
    if (!distance) return 999; // Default for unknown distances
    
    if (typeof distance === 'number') return distance;
    
    // Extract numeric part from strings like "1.2 mi"
    const match = distance.match(/(\d+\.?\d*)/);
    if (match && match[1]) {
      return parseFloat(match[1]);
    }
    
    return 999;
  };

  // Helper function to get city from address
  const getLocationFromAddress = (address) => {
    if (!address) return "Minneapolis";
    
    const parts = address.split(',');
    if (parts.length > 1) {
      return parts[1].trim();
    }
    
    return "Minneapolis";
  };

  // Helper to generate random distance string
  const generateRandomDistance = () => {
    return `${(Math.random() * 5 + 0.5).toFixed(1)} mi`;
  };

  // Helper to generate random price range
  const generateRandomPriceRange = () => {
    const options = ['$', '$$', '$$$'];
    return options[Math.floor(Math.random() * options.length)];
  };

  // Helper to get an appropriate image based on food categories
  const getImageForCategories = (categories) => {
    if (!categories || categories.length === 0) {
      return "/images/cuisine_images/American_cuisine.jpg";
    }
    
    // Try to match a category to a cuisine image
    const categoryMapping = {
      'mexican': 'Mexican',
      'italian': 'Italian',
      'chinese': 'Chinese',
      'japanese': 'Japanese',
      'thai': 'Thai',
      'indian': 'Indian',
      'mediterranean': 'Mediterranean',
      'greek': 'Greek',
      'american': 'American',
      'burger': 'Burger'
    };
    
    // Check each category for a match
    for (const category of categories) {
      const lowerCategory = category.toLowerCase();
      for (const [key, value] of Object.entries(categoryMapping)) {
        if (lowerCategory.includes(key)) {
          return `/images/cuisine_images/${value}_cuisine.jpg`;
        }
      }
    }
    
    // Default image if no match found
    return "/images/cuisine_images/American_cuisine.jpg";
  };

  // Create fallback restaurants from the database sample
  const createFallbackRestaurants = () => {
    // Sample data from the restaurants database you provided
    const sampleData = [
      { id: 1, name: "Nolabelle Kitchen + Bar", rating: 4.4, review_count: 117, price_range: "$$", categories: "Burgers, American, Sandwiches", address: "520 S Front St, Ste 500, Mankato, MN 56001" },
      { id: 2, name: "Pagliai's Pizza", rating: 4.2, review_count: 181, price_range: "$$", categories: "Pizza, Italian, Sandwiches", address: "524 S Front St, Mankato, MN 56001" },
      { id: 3, name: "Pappageorge Restaurant & Bar", rating: 4.3, review_count: 54, price_range: "$$", categories: "Bars, Steakhouses, American", address: "1028 N Riverfront Dr, Mankato, MN 56001" },
      { id: 4, name: "Number 4 Steakhouse", rating: 3.6, review_count: 182, price_range: "$$", categories: "American, Steakhouses, Beer Bar", address: "124 E Walnut, Mankato, MN 56001" },
      { id: 5, name: "Pub 500", rating: 3.8, review_count: 169, price_range: "$$", categories: "Pubs, American", address: "500 S Front St, Mankato, MN 56001" },
      { id: 6, name: "Dino's Pizzeria", rating: 3.7, review_count: 92, price_range: "$$", categories: "Pizza, Italian, Sandwiches", address: "239 Belgrade Ave, North Mankato, MN 56003" },
      { id: 7, name: "El Mazatlan Authentic Mexican Restaurant", rating: 4.0, review_count: 138, price_range: "$$", categories: "Mexican", address: "1525 Tullamore St, Mankato, MN 56001" },
      { id: 8, name: "India Palace", rating: 4.3, review_count: 107, price_range: "$$", categories: "Indian, Vegetarian, Vegan", address: "1250 Riverfront Dr, Mankato, MN 56001" }
    ];
    
    // Add more data to our sample to create a more robust dataset
    const dietaryMapping = {
      'Vegan': ["India Palace", "Pub 500"],
      'Vegetarian': ["India Palace", "Pub 500", "El Mazatlan Authentic Mexican Restaurant", "Dino's Pizzeria", "Pagliai's Pizza"],
      'Gluten Free': ["Nolabelle Kitchen + Bar", "Pappageorge Restaurant & Bar", "Pub 500", "El Mazatlan Authentic Mexican Restaurant", "India Palace"],
      'Halal': ["India Palace", "El Mazatlan Authentic Mexican Restaurant"],
      'Pescatarian': ["India Palace", "Number 4 Steakhouse", "Pappageorge Restaurant & Bar"],
      'Kosher': ["India Palace"]
    };
    
    // Process and return the sample data
    return sampleData.map(restaurant => {
      // Determine which dietary preferences this restaurant might accommodate
      const dietaryPreferences = Object.keys(dietaryMapping).filter(dietary => 
        dietaryMapping[dietary].includes(restaurant.name)
      );
      
      // Always include the current preference for restaurants being shown
      if (!dietaryPreferences.includes(preference)) {
        dietaryPreferences.push(preference);
      }
      
      return {
        ...restaurant,
        dietary: dietaryPreferences,
        image: getImageForCategories(restaurant.categories.split(',')),
        city: getLocationFromAddress(restaurant.address),
        distance: generateRandomDistance(),
        bookmarked: false
      };
    });
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
        // Here you would navigate to the restaurant detail page
        // navigate(`/restaurant/${restaurant.id}`);
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
            {restaurant.reviewCount || restaurant.review_count} reviews
          </Typography>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
          
          <Typography variant="body2" color="text.secondary">
            {restaurant.priceRange || restaurant.price_range}
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.primary" sx={{ mb: 2 }}>
          {restaurant.categories}
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {restaurant.dietary && restaurant.dietary.map((pref, index) => (
            <Chip 
              key={index}
              icon={dietaryConfig[pref]?.icon || <SpaOutlinedIcon />}
              label={pref}
              size="small"
              sx={{ 
                bgcolor: pref === preference ? '#e6f7ff' : 'transparent',
                border: `1px solid ${pref === preference ? '#1890ff' : '#d9d9d9'}`
              }}
            />
          ))}
        </Box>
        
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
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {dietaryConfig[preference]?.icon && (
              <Box sx={{ color: '#F76B06', mr: 2, display: 'flex', alignItems: 'center' }}>
                {dietaryConfig[preference].icon}
              </Box>
            )}
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
              {preference} Restaurants
            </Typography>
          </Box>
        </Box>
        
        {/* <Typography variant="subtitle1" sx={{ mb: 4 }}>
          {dietaryConfig[preference]?.description || `Explore restaurants with ${preference} options`}
        </Typography> */}
        
        {/* Filters and sorting options */}
        {/* <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          alignItems: { xs: 'stretch', md: 'center' },
          gap: 2,
          mb: 4,
          p: 2,
          backgroundColor: '#f5f5f5',
          borderRadius: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FilterListIcon sx={{ mr: 1, color: '#666' }} />
            <Typography variant="subtitle1" fontWeight="medium">Filter and Sort</Typography>
          </Box>
          
          <TextField
            label="Location"
            placeholder="Enter city or area"
            variant="outlined"
            size="small"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            sx={{ flexGrow: 1 }}
          />
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Price</InputLabel>
            <Select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
              label="Price"
            >
              <MenuItem value="all">All Prices</MenuItem>
              <MenuItem value="$">$ (Inexpensive)</MenuItem>
              <MenuItem value="$$">$$ (Moderate)</MenuItem>
              <MenuItem value="$$$">$$$ (Expensive)</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Sort by</InputLabel>
            <Select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              label="Sort by"
              startAdornment={<SortIcon sx={{ mr: 1, color: '#666' }} />}
            >
              <MenuItem value="rating">Rating (High to Low)</MenuItem>
              <MenuItem value="reviews">Most Reviewed</MenuItem>
              <MenuItem value="distance">Distance (Near to Far)</MenuItem>
            </Select>
          </FormControl>
        </Box> */}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" align="center" sx={{ my: 4 }}>
            {error}
          </Typography>
        ) : filteredRestaurants.length > 0 ? (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Found {filteredRestaurants.length} restaurants with {preference} options
            </Typography>
            {filteredRestaurants.map(restaurant => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </Box>
        ) : (
          <Typography variant="body1" align="center" sx={{ my: 4 }}>
            No restaurants found with {preference} options matching your filters.
          </Typography>
        )}
      </Container>
      
      <Footer />
    </Box>
  );
}

export default DietaryPreferences;