-- Supabase Schema for UniRewards

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  role TEXT CHECK(role IN ('student', 'professor', 'admin')) NOT NULL DEFAULT 'student',
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0)
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);

-- 2. Products Table
CREATE TABLE products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  base_price INTEGER NOT NULL DEFAULT 0,
  highest_bid INTEGER NOT NULL DEFAULT 0,
  highest_bidder_id UUID REFERENCES profiles(id),
  total_bids INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view products" ON products FOR SELECT USING (true);
-- Insert/Update from server only

-- 3. Transfers Table
CREATE TABLE transfers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) NOT NULL,
  receiver_id UUID REFERENCES profiles(id) NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own transfers" ON transfers FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 4. Bids Table
CREATE TABLE bids (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES products(id) NOT NULL,
  bidder_id UUID REFERENCES profiles(id) NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own bids" ON bids FOR SELECT USING (auth.uid() = bidder_id);

-- 5. RPC function for transferring points safely
CREATE OR REPLACE FUNCTION transfer_points(sender UUID, receiver UUID, transfer_amount INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sender_balance INTEGER;
BEGIN
  IF transfer_amount <= 0 THEN
    RAISE EXCEPTION 'Transfer amount must be positive';
  END IF;

  -- Lock the sender's row
  SELECT balance INTO sender_balance
  FROM profiles
  WHERE id = sender
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sender not found';
  END IF;

  IF sender_balance < transfer_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Deduct from sender
  UPDATE profiles
  SET balance = balance - transfer_amount
  WHERE id = sender;

  -- Add to receiver
  UPDATE profiles
  SET balance = balance + transfer_amount
  WHERE id = receiver;

  -- Insert transfer record
  INSERT INTO transfers (sender_id, receiver_id, amount)
  VALUES (sender, receiver, transfer_amount);
END;
$$;

-- 6. RPC function for placing a bid safely
CREATE OR REPLACE FUNCTION place_bid(product UUID, bidder UUID, bid_amount INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_highest_bid INTEGER;
  bidder_balance INTEGER;
  active_bids_total INTEGER;
BEGIN
  -- Lock the product row strictly to prevent race conditions on bidding
  SELECT highest_bid INTO current_highest_bid
  FROM products
  WHERE id = product
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  IF bid_amount <= current_highest_bid THEN
    RAISE EXCEPTION 'Bid must be higher than current highest bid (%)', current_highest_bid;
  END IF;

  -- Calculate total amount locked in other active winning bids for this user
  -- Assuming status='active' logic applies, though schema.sql doesn't show status. 
  -- Oh wait, I see migration.sql added status. I'll just check status='active' if it exists or omit it.
  -- To be safe with the original schema which didn't have status, I will just exclude the current product.
  -- Wait, I should assume the schema has been migrated, so 'status' exists.
  -- Let's just use the exact logic from migration.sql to keep them synced.
  SELECT COALESCE(SUM(highest_bid), 0) INTO active_bids_total
  FROM products
  WHERE highest_bidder_id = bidder AND id != product AND status = 'active';

  -- Optional: Lock the bidder's row to check balance 
  -- (Assuming deducting points on bid for fairness)
  SELECT balance INTO bidder_balance
  FROM profiles
  WHERE id = bidder
  FOR UPDATE;

  IF bidder_balance < (active_bids_total + bid_amount) THEN
    RAISE EXCEPTION 'Insufficient balance to place this bid (including other active bids)';
  END IF;

  -- We update the product's highest bid
  UPDATE products
  SET highest_bid = bid_amount,
      highest_bidder_id = bidder,
      total_bids = total_bids + 1
  WHERE id = product;

  -- Insert bid log record
  INSERT INTO bids (product_id, bidder_id, amount)
  VALUES (product, bidder, bid_amount);
  
END;
$$;

-- Trigger to automatically create a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role, balance)
  VALUES (new.id, 'student', 0);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
