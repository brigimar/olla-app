ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY \"users-can-view-own-orders\" 
ON orders FOR SELECT
USING (auth.uid() = user_id);
