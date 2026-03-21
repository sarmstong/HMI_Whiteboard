-- Run this in the Supabase SQL editor

CREATE TABLE app_state (
  user_id    uuid  REFERENCES auth.users ON DELETE CASCADE,
  key        text  NOT NULL,
  value      jsonb NOT NULL,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, key)
);

ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own data"
  ON app_state FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
