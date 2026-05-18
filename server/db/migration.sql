-- 1. Update profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS student_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Update existing students to approved so they don't lose access
UPDATE profiles SET status = 'approved' WHERE role != 'admin';
UPDATE profiles SET status = 'approved' WHERE role = 'admin';

-- 2. Create allocation_logs table
CREATE TABLE IF NOT EXISTS allocation_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  professor_id UUID REFERENCES profiles(id) NOT NULL,
  student_id UUID REFERENCES profiles(id) NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE allocation_logs ENABLE ROW LEVEL SECURITY;
-- Allow professors to see logs they created, or admins to see all, or students to see their own
CREATE POLICY "View allocations" ON allocation_logs 
FOR SELECT USING (
  auth.uid() = professor_id OR 
  auth.uid() = student_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 3. Update products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
ADD COLUMN IF NOT EXISTS winner_id UUID REFERENCES profiles(id);

-- 4. Update handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  assigned_role TEXT;
  assigned_student_id TEXT;
  assigned_status TEXT;
BEGIN
  -- Extract from metadata, default to student if missing
  assigned_role := COALESCE(new.raw_user_meta_data->>'role', 'student');
  assigned_student_id := new.raw_user_meta_data->>'student_id';
  
  -- Admins are approved manually later, or can be seeded as 'approved'. 
  -- We'll set everyone to 'pending' by default.
  assigned_status := 'pending';

  -- Ensure role is valid
  IF assigned_role NOT IN ('student', 'professor', 'admin') THEN
    assigned_role := 'student';
  END IF;

  INSERT INTO public.profiles (id, role, balance, student_id, status)
  VALUES (new.id, assigned_role, 0, assigned_student_id, assigned_status);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update place_bid RPC to check timeframes
CREATE OR REPLACE FUNCTION place_bid(product UUID, bidder UUID, bid_amount INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_highest_bid INTEGER;
  bidder_balance INTEGER;
  prod_start TIMESTAMP WITH TIME ZONE;
  prod_end TIMESTAMP WITH TIME ZONE;
  prod_status TEXT;
  active_bids_total INTEGER;
BEGIN
  -- Lock the product row strictly to prevent race conditions on bidding
  SELECT highest_bid, start_time, end_time, status 
  INTO current_highest_bid, prod_start, prod_end, prod_status
  FROM products
  WHERE id = product
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  IF prod_status != 'active' THEN
    RAISE EXCEPTION 'Product bidding has ended';
  END IF;

  IF now() < prod_start THEN
    RAISE EXCEPTION 'Bidding has not started yet';
  END IF;

  IF prod_end IS NOT NULL AND now() > prod_end THEN
    RAISE EXCEPTION 'Bidding time has ended';
  END IF;

  IF bid_amount <= current_highest_bid THEN
    RAISE EXCEPTION 'Bid must be higher than current highest bid (%)', current_highest_bid;
  END IF;

  -- Calculate total amount locked in other active winning bids for this user
  SELECT COALESCE(SUM(highest_bid), 0) INTO active_bids_total
  FROM products
  WHERE highest_bidder_id = bidder AND id != product AND status = 'active';

  -- Lock the bidder's row to check balance 
  SELECT balance INTO bidder_balance
  FROM profiles
  WHERE id = bidder
  FOR UPDATE;

  IF bidder_balance < (active_bids_total + bid_amount) THEN
    RAISE EXCEPTION 'Insufficient balance to place this bid (including other active bids)';
  END IF;

  -- Update the product's highest bid
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
