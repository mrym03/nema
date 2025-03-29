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