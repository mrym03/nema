import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Define types for user preferences
export type DietaryPreference =
  | "vegetarian"
  | "vegan"
  | "breakfast"
  | "dessert"
  | "pasta"
  | "seafood"
  | "side"
  | "starter";

export type CuisinePreference =
  | "american"
  | "british"
  | "canadian"
  | "chinese"
  | "croatian"
  | "dutch"
  | "egyptian"
  | "filipino"
  | "french"
  | "greek"
  | "indian"
  | "irish"
  | "italian"
  | "jamaican"
  | "japanese"
  | "kenyan"
  | "malaysian"
  | "mexican"
  | "moroccan"
  | "polish"
  | "portuguese"
  | "russian"
  | "spanish"
  | "thai"
  | "tunisian"
  | "turkish"
  | "vietnamese";

export interface UserPreferences {
  completedOnboarding: boolean;
  dietaryPreferences: DietaryPreference[];
  cuisinePreferences: CuisinePreference[];
  mealsPerDay: number;
}

interface PreferencesContextType {
  preferences: UserPreferences;
  setDietaryPreferences: (preferences: DietaryPreference[]) => void;
  setCuisinePreferences: (preferences: CuisinePreference[]) => void;
  setMealsPerDay: (count: number) => void;
  completeOnboarding: () => void;
  loading: boolean;
}

const defaultPreferences: UserPreferences = {
  completedOnboarding: false,
  dietaryPreferences: [],
  cuisinePreferences: [],
  mealsPerDay: 2,
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(
  undefined
);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [preferences, setPreferences] =
    useState<UserPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load saved preferences when the component mounts
    const loadPreferences = async () => {
      try {
        const savedPreferences = await AsyncStorage.getItem("userPreferences");
        if (savedPreferences) {
          setPreferences(JSON.parse(savedPreferences));
        }
      } catch (error) {
        console.error("Failed to load preferences:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, []);

  // Save preferences whenever they change
  useEffect(() => {
    const savePreferences = async () => {
      try {
        await AsyncStorage.setItem(
          "userPreferences",
          JSON.stringify(preferences)
        );
      } catch (error) {
        console.error("Failed to save preferences:", error);
      }
    };

    if (!loading) {
      savePreferences();
    }
  }, [preferences, loading]);

  const setDietaryPreferences = (dietaryPreferences: DietaryPreference[]) => {
    setPreferences((prev) => ({ ...prev, dietaryPreferences }));
  };

  const setCuisinePreferences = (cuisinePreferences: CuisinePreference[]) => {
    setPreferences((prev) => ({ ...prev, cuisinePreferences }));
  };

  const setMealsPerDay = (mealsPerDay: number) => {
    setPreferences((prev) => ({ ...prev, mealsPerDay }));
  };

  const completeOnboarding = () => {
    setPreferences((prev) => ({ ...prev, completedOnboarding: true }));
  };

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        setDietaryPreferences,
        setCuisinePreferences,
        setMealsPerDay,
        completeOnboarding,
        loading,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
};
