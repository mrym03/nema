# Supabase Setup Guide

To complete the setup of your Zero Waste Pantry app with Supabase, you need to create the database tables. Follow these steps:

## Setting Up Tables

1. Log in to your Supabase dashboard: https://app.supabase.com/
2. Select your project
3. Go to the SQL Editor (left sidebar)
4. Create a new query
5. Copy and paste the SQL code below
6. Run the query

```sql
-- Create pantry_items table
CREATE TABLE IF NOT EXISTS pantry_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  expiryDate TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  imageUrl TEXT,
  notes TEXT,
  addedAt TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security) on pantry_items
ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own pantry items
CREATE POLICY "Users can only access their own pantry items"
  ON pantry_items
  FOR ALL
  USING (auth.uid() = user_id);

-- Create shopping_list_items table
CREATE TABLE IF NOT EXISTS shopping_list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  addedAt TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on shopping_list_items
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own shopping list items
CREATE POLICY "Users can only access their own shopping list items"
  ON shopping_list_items
  FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX idx_pantry_items_user_id ON pantry_items(user_id);
CREATE INDEX idx_shopping_list_items_user_id ON shopping_list_items(user_id);
```

## Temporary Development Mode

While you're setting up the database, you can run the app in "Development Mode" which uses local storage instead of Supabase:

1. Open `utils/api.ts`
2. Change `const DEV_MODE = false;` to `const DEV_MODE = true;`
3. Restart the app

This will allow you to use the app without database errors while you set up Supabase.

## Advanced Setup (Optional)

If you want to build a custom development client that supports the barcode scanner:

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to your Expo account
eas login

# Configure the project
eas build:configure

# Create a development build
eas build --profile development --platform ios  # For iOS
eas build --profile development --platform android  # For Android
```

This will create a custom development build that supports native modules like the camera for barcode scanning. 