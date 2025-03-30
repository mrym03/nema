import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Pressable, 
  Alert, 
  Platform,
  Dimensions,
  StatusBar
} from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePantryStore } from '@/store/pantryStore';
import { FoodItem, FoodCategory } from '@/types';
import Colors from '@/constants/colors';
import { getExpiringItems, sortByExpiryDate } from '@/utils/helpers';
import FoodItemCard from '@/components/FoodItemCard';
import ExpiringFoodAlert from '@/components/ExpiringFoodAlert';
import EmptyState from '@/components/EmptyState';
import AddItemButton from '@/components/AddItemButton';
import CategoryPicker from '@/components/CategoryPicker';
import { 
  Filter, 
  Plus, 
  Trash2, 
  RefreshCcw, 
  Search, 
  PanelTop,
  ChevronUp,
  ChevronDown,
  Grid,
  List as ListIcon
} from 'lucide-react-native';
import CardContainer from '@/components/CardContainer';
import MaskedView from '@react-native-masked-view/masked-view';
import { Image } from 'expo-image';

// Conditional imports to handle potential errors
let LinearGradient: any = View;
let Animatable: any = { View };

// Try to import the libraries, but use fallbacks if they fail
try {
  // First try the Expo version of LinearGradient
  LinearGradient = require('expo-linear-gradient').LinearGradient;
} catch (e) {
  try {
    // Fall back to react-native-linear-gradient if Expo version fails
    LinearGradient = require('react-native-linear-gradient').LinearGradient;
  } catch (e) {
    console.warn('Linear gradient not available, using fallback');
  }
}

try {
  Animatable = require('react-native-animatable');
} catch (e) {
  console.warn('react-native-animatable not available, using fallback');
}

const { width, height } = Dimensions.get('window');

// Custom animations
const fadeInDownFast = {
  0: { opacity: 0, translateY: -10 },
  1: { opacity: 1, translateY: 0 },
};

const slideInUp = {
  0: { opacity: 0, translateY: 50 },
  1: { opacity: 1, translateY: 0 },
};

const fadeInLeft = {
  0: { opacity: 0, translateX: 20 },
  1: { opacity: 1, translateX: 0 },
};

export default function PantryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, clearAllItems } = usePantryStore();
  const flatListRef = useRef<FlatList>(null);
  
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchVisible, setSearchVisible] = useState(false);
  
  // On component mount
  useEffect(() => {
    // Animate stats card in when component mounts
    setTimeout(() => {
      setShowStats(true);
    }, 300);
  }, []);
  
  const expiringItems = getExpiringItems(items);
  
  const filteredItems = selectedCategory
    ? items.filter(item => item.category === selectedCategory)
    : items;
  
  const sortedItems = sortByExpiryDate(filteredItems);
  
  const handleAddItem = () => {
    router.push('../add-item');
  };
  
  const handleItemPress = (item: FoodItem) => {
    router.push({
      pathname: '../item-details',
      params: { id: item.id }
    });
  };
  
  const handleExpiringPress = () => {
    setSelectedCategory(null);
    setShowFilters(true);
  };
  
  const handleClearPantry = () => {
    Alert.alert(
      'Clear Pantry',
      'Are you sure you want to remove ALL items from your pantry? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Clear Everything',
          style: 'destructive',
          onPress: () => {
            clearAllItems();
            Alert.alert('Success', 'Pantry cleared successfully!');
          }
        }
      ]
    );
  };
  
  const refreshList = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  };
  
  // Calculate pantry stats
  const calculateStats = () => {
    if (items.length === 0) return null;
    
    const totalItems = items.length;
    const expiringCount = expiringItems.length;
    
    // Count items by category
    const categoryCount: Record<string, number> = {};
    items.forEach(item => {
      const category = item.category || 'other';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
    
    // Find most common category
    let mostCommonCategory = 'other';
    let maxCount = 0;
    Object.entries(categoryCount).forEach(([category, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonCategory = category;
      }
    });
    
    // Calculate percentage of pantry that is expiring soon
    const expiringPercentage = Math.round((expiringCount / totalItems) * 100);
    
    return {
      totalItems,
      expiringCount,
      expiringPercentage,
      mostCommonCategory
    };
  };
  
  const pantryStats = calculateStats();
  
  // Check if required components are available
  const shouldUseGradient = LinearGradient !== View;
  const AnimatableView = Animatable.View || View;
  
  // Render item with animations
  const renderItem = useCallback(({ item, index }: { item: FoodItem; index: number }) => (
    <AnimatableView
      animation={fadeInLeft}
      duration={400}
      delay={index * 80}
      useNativeDriver
    >
      <FoodItemCard foodItem={item} onPress={handleItemPress} />
    </AnimatableView>
  ), []);
  
  // Grid view render
  const renderGridItem = useCallback(({ item, index }: { item: FoodItem; index: number }) => {
    const itemStyle = {
      width: (width - 48) / 2,
    };
    
    return (
      <AnimatableView
        animation={fadeInLeft}
        duration={400}
        delay={index * 50}
        useNativeDriver
        style={itemStyle}
      >
        <CardContainer style={styles.gridItem}>
          <Pressable
            style={({ pressed }) => [
              styles.gridItemPressable,
              pressed && styles.pressed
            ]}
            onPress={() => handleItemPress(item)}
          >
            <View style={styles.gridImageContainer}>
              <Image
                source={{ uri: getFoodImageUrl(item) }}
                style={styles.gridImage}
                contentFit="cover"
              />
              <View style={[styles.categoryDot, { backgroundColor: Colors[item.category || 'other'] }]} />
              
              {item.expiryDate && (
                <View style={[
                  styles.gridExpiryTag,
                  isExpired(item) ? styles.expiredTag : 
                  isExpiringSoon(item) ? styles.expiringSoonTag : styles.normalExpiryTag
                ]}>
                  <Text style={styles.gridExpiryText} numberOfLines={1}>
                    {isExpired(item) ? 'Expired' : 
                     isExpiringSoon(item) ? 'Expiring soon' : 'Good until'}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.gridContent}>
              <Text style={styles.gridItemName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.gridItemQuantity}>
                {item.quantity || 1} {item.unit || 'item'}
                {(item.quantity || 1) > 1 && item.unit !== 'kg' && item.unit !== 'g' && 's'}
              </Text>
            </View>
          </Pressable>
        </CardContainer>
      </AnimatableView>
    );
  }, []);
  
  const isExpired = (item: FoodItem): boolean => {
    return item.expiryDate
      ? new Date(item.expiryDate) < new Date()
      : false;
  };
  
  const isExpiringSoon = (item: FoodItem): boolean => {
    if (!item.expiryDate) return false;
    
    const expiryDate = new Date(item.expiryDate);
    const now = new Date();
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(now.getDate() + 3);
    
    return expiryDate > now && expiryDate <= threeDaysFromNow;
  };
  
  const getFoodImageUrl = (item: FoodItem): string => {
    // This is a placeholder. You would implement your own image selection logic here
    return item.imageUrl || `https://source.unsplash.com/300x300/?${item.name.split(' ')[0]},food`;
  };
  
  const renderEmptyState = () => (
    <AnimatableView animation="fadeIn" duration={800} style={styles.emptyStateContainer}>
      <EmptyState
        title="Your pantry is empty"
        message="Add items to start tracking your food and reduce waste. We'll help you keep everything organized."
        imageUrl="https://images.unsplash.com/photo-1584473457493-17c4c24290c5?q=80&w=300"
      />
    </AnimatableView>
  );
  
  // Calculate the bottom padding to avoid the tab bar and add button overlap
  const tabBarHeight = Platform.OS === 'ios' ? 90 : 75;
  const addButtonHeight = 68; // Approximate height of the add button with margin
  const bottomPadding = (insets.bottom > 0 ? tabBarHeight : tabBarHeight + 10) + addButtonHeight;
  
  // Render circular progress for expiring items
  const renderExpiryProgress = () => {
    if (!pantryStats || pantryStats.totalItems === 0) return null;
    
    const { expiringPercentage } = pantryStats;
    const circumference = 2 * Math.PI * 38; // radius: 38
    const progressOffset = circumference - (circumference * expiringPercentage) / 100;
    
    return (
      <View style={styles.expiryProgressContainer}>
        <Svg height="100" width="100" viewBox="0 0 100 100">
          <Circle
            cx="50"
            cy="50"
            r="38"
            stroke="#E0E0E0"
            strokeWidth="8"
            fill="transparent"
          />
          <Circle
            cx="50"
            cy="50"
            r="38"
            stroke={expiringPercentage > 50 ? Colors.danger : expiringPercentage > 25 ? Colors.warning : Colors.success}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={progressOffset}
            strokeLinecap="round"
            rotation="-90"
            origin="50, 50"
          />
        </Svg>
        <View style={styles.expiryProgressTextContainer}>
          <Text style={styles.expiryProgressPercentage}>{expiringPercentage}%</Text>
          <Text style={styles.expiryProgressLabel}>expiring</Text>
        </View>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Background */}
      {shouldUseGradient ? (
        <LinearGradient
          colors={['#F0F2F5', '#E8EBF0']}
          style={StyleSheet.absoluteFillObject}
        />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#F0F2F5' }]} />
      )}
      
      {/* Pattern overlay */}
      <View style={styles.patternOverlay} />
      
      {/* Header */}
      <SafeAreaView style={styles.header} edges={['top']}>
        <AnimatableView animation={fadeInDownFast} duration={600}>
          <View style={styles.headerContent}>
            <View>
              <MaskedView
                maskElement={
                  <Text style={styles.titleMask}>My Pantry</Text>
                }
              >
                {shouldUseGradient ? (
                  <LinearGradient
                    colors={[Colors.primary, Colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ height: 50 }}
                  />
                ) : (
                  <View style={{ height: 50, backgroundColor: Colors.primary }} />
                )}
              </MaskedView>
              <Text style={styles.subtitle}>
                {pantryStats ? `${pantryStats.totalItems} items` : 'No items'}
              </Text>
            </View>
            
            <View style={styles.headerButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.iconButtonCircle,
                  pressed && styles.pressed
                ]}
                onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              >
                {viewMode === 'list' ? (
                  <Grid size={20} color={Colors.primary} />
                ) : (
                  <ListIcon size={20} color={Colors.primary} />
                )}
              </Pressable>
              
              <Pressable
                style={({ pressed }) => [
                  styles.iconButtonCircle,
                  pressed && styles.pressed
                ]}
                onPress={refreshList}
              >
                <RefreshCcw size={20} color={Colors.primary} />
              </Pressable>
              
              <Pressable
                style={({ pressed }) => [
                  styles.iconButtonCircle,
                  pressed && styles.pressed
                ]}
                onPress={() => setShowFilters(!showFilters)}
              >
                <Filter size={20} color={Colors.primary} />
              </Pressable>
            </View>
          </View>
        </AnimatableView>
      </SafeAreaView>
      
      {/* Main content */}
      <View style={styles.mainContent}>
        {/* Stats cards row */}
        {showStats && pantryStats && (
          <AnimatableView 
            animation={fadeInDownFast} 
            duration={600} 
            delay={200}
            style={styles.statsRow}
          >
            <CardContainer style={styles.statsCard}>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{pantryStats.totalItems}</Text>
                <Text style={styles.statLabel}>Total Items</Text>
              </View>
            </CardContainer>
            
            <CardContainer style={styles.statsCard}>
              <View style={styles.statContent}>
                <Text style={[
                  styles.statValue, 
                  pantryStats.expiringCount > 0 ? { color: Colors.warning } : {}
                ]}>
                  {pantryStats.expiringCount}
                </Text>
                <Text style={styles.statLabel}>Expiring Soon</Text>
              </View>
            </CardContainer>
          </AnimatableView>
        )}
        
        {/* Category filter */}
        {showFilters && (
          <AnimatableView 
            animation="fadeIn" 
            duration={400}
            style={styles.filterContainer}
          >
            <CardContainer style={styles.blurContainer}>
              <Text style={styles.filterTitle}>Filter by Category</Text>
              <CategoryPicker
                selectedCategory={selectedCategory as FoodCategory}
                onSelectCategory={(category) => {
                  // Toggle selected category
                  const newCategory = category === selectedCategory ? null : category;
                  setSelectedCategory(newCategory);
                }}
              />
              
              {selectedCategory && (
                <Pressable
                  style={styles.clearFilterButton}
                  onPress={() => setSelectedCategory(null)}
                >
                  <Text style={styles.clearFilterText}>Clear Filter</Text>
                </Pressable>
              )}
            </CardContainer>
          </AnimatableView>
        )}
        
        {/* List header */}
        <View style={styles.listHeaderContainer}>
          <Text style={styles.listHeaderText}>
            {selectedCategory 
              ? `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} (${filteredItems.length})`
              : `All Items`}
          </Text>
        </View>
        
        {/* FlatList for items */}
        <FlatList
          ref={flatListRef}
          data={sortedItems}
          renderItem={viewMode === 'list' ? renderItem : renderGridItem}
          keyExtractor={(item) => item.id}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode === 'grid' ? 'grid' : 'list'} // Force re-render when switching view modes
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: bottomPadding },
            sortedItems.length === 0 && styles.emptyListContent
          ]}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
        
        {/* Floating add button with gradient */}
        <View style={[
          styles.addButtonContainer, 
          { bottom: Math.max(insets.bottom, 0) + tabBarHeight }
        ]}>
          {shouldUseGradient ? (
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addButtonBackground}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.addButton,
                  pressed && styles.addButtonPressed
                ]}
                onPress={handleAddItem}
              >
                <Plus size={28} color="#FFFFFF" strokeWidth={2.5} />
              </Pressable>
            </LinearGradient>
          ) : (
            <View style={[styles.addButtonBackground, { backgroundColor: Colors.primary }]}>
              <Pressable
                style={({ pressed }) => [
                  styles.addButton,
                  pressed && styles.addButtonPressed
                ]}
                onPress={handleAddItem}
              >
                <Plus size={28} color="#FFFFFF" strokeWidth={2.5} />
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// Import SVG components for circular progress
const Svg = ({ height, width, viewBox, children, ...props }: any) => {
  return (
    <View style={{ height, width }} {...props}>
      {children}
    </View>
  );
};

const Circle = ({ cx, cy, r, ...props }: any) => {
  return <View {...props} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.02,
    backgroundColor: 'transparent',
    backgroundSize: 'cover',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleMask: {
    fontSize: 34,
    fontWeight: '800',
    color: '#000000',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
    marginTop: -5,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButtonCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }]
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 12,
  },
  statsCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statContent: {
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textLight,
  },
  filterContainer: {
    margin: 16,
    marginTop: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  blurContainer: {
    padding: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  clearFilterButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
  },
  clearFilterText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  listHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  listHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonContainer: {
    position: 'absolute',
    right: 24,
    elevation: 8,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  addButtonBackground: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonPressed: {
    transform: [{ scale: 0.95 }],
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  expiryProgressContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expiryProgressTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expiryProgressPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  expiryProgressLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  gridItem: {
    margin: 8,
    borderRadius: 16,
    overflow: 'hidden',
    height: 180,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gridItemPressable: {
    flex: 1,
  },
  gridImageContainer: {
    height: 120,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  categoryDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  gridContent: {
    padding: 12,
  },
  gridItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  gridItemQuantity: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  gridExpiryTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  expiredTag: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  expiringSoonTag: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  normalExpiryTag: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  gridExpiryText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});