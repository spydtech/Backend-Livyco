import { FoodItem } from "../models/Menu.js";

// Get all food items with filtering
export const getFoodItems = async (req, res) => {
  try {
    console.log('GET /api/menu query params:', req.query);
    
    const { day, category } = req.query;
    let filter = {};
    
    if (day) filter.day = day;
    if (category) filter.category = category;
    
    console.log('Database filter:', filter);
    
    const foodItems = await FoodItem.find(filter).sort({ createdAt: -1 });
    
    console.log('Found items:', foodItems.length);
    res.json({
      success: true,
      data: foodItems
    });
  } catch (error) {
    console.error('Error in getFoodItems:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get weekly menu structure
export const getWeeklyMenu = async (req, res) => {
  try {
    console.log('GET /api/menu/weekly');
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const categories = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];
    
    const weeklyMenu = {};
    
    for (const day of days) {
      weeklyMenu[day] = {};
      
      for (const category of categories) {
        const items = await FoodItem.find({
          day: day,
          category: category
        }).sort({ createdAt: -1 });
        
        weeklyMenu[day][category] = items;
      }
    }
    
    res.json({
      success: true,
      data: weeklyMenu
    });
  } catch (error) {
    console.error('Error in getWeeklyMenu:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Add a new food item via POST (CORRECTED)
export const addFoodItem = async (req, res) => {
  try {
    console.log('POST /api/menu body:', req.body);
    
    const { name, description, category, day } = req.body;
    
    if (!name || !category || !day) {
      return res.status(400).json({
        success: false,
        message: 'Name, category, and day are required'
      });
    }
    
    // Validate day
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    if (!validDays.includes(day)) {
      return res.status(400).json({
        success: false,
        message: 'Day must be a valid day of the week'
      });
    }
    
    // Validate category
    const validCategories = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Category must be Breakfast, Lunch, Snacks, or Dinner'
      });
    }
    
    const foodItem = new FoodItem({
      name,
      description: description || '',
      category,
      day
    });
    
    const savedItem = await foodItem.save();
    console.log('Food item created via POST:', savedItem);
    
    res.status(201).json({
      success: true,
      data: savedItem
    });
  } catch (error) {
    console.error('Error in addFoodItem:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete a food item via DELETE (CORRECTED)
export const deleteFoodItem = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('DELETE /api/menu/', id);
    
    const deletedItem = await FoodItem.findByIdAndDelete(id);
    
    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Food item deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteFoodItem:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Clear menu items for a specific day via DELETE (CORRECTED)
export const clearDayMenu = async (req, res) => {
  try {
    const { day } = req.query;
    
    if (!day) {
      return res.status(400).json({
        success: false,
        message: 'Day parameter is required'
      });
    }
    
    // Validate day
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    if (!validDays.includes(day)) {
      return res.status(400).json({
        success: false,
        message: 'Day must be a valid day of the week'
      });
    }
    
    const result = await FoodItem.deleteMany({ day });
    
    console.log(`Cleared ${result.deletedCount} items for day: ${day}`);
    
    res.json({
      success: true,
      message: `Menu items for ${day} cleared successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error in clearDayMenu:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Clear menu items for multiple days via DELETE (CORRECTED)
export const clearDaysMenu = async (req, res) => {
  try {
    const { days } = req.query;
    
    if (!days) {
      return res.status(400).json({
        success: false,
        message: 'Days parameter is required'
      });
    }
    
    const daysArray = days.split(',');
    
    // Validate days
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    for (const day of daysArray) {
      if (!validDays.includes(day)) {
        return res.status(400).json({
          success: false,
          message: `Invalid day: ${day}. Must be a valid day of the week`
        });
      }
    }
    
    const result = await FoodItem.deleteMany({ day: { $in: daysArray } });
    
    console.log(`Cleared ${result.deletedCount} items for days: ${days}`);
    
    res.json({
      success: true,
      message: 'Menu items cleared successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error in clearDaysMenu:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};