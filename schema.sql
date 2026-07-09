CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(320) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipes (
  recipe_id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  ingredients JSONB NOT NULL,
  instructions TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ingredients_is_array CHECK (jsonb_typeof(ingredients) = 'array')
);

CREATE TABLE IF NOT EXISTS reviews (
  review_id BIGSERIAL PRIMARY KEY,
  recipe_id BIGINT NOT NULL REFERENCES recipes(recipe_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (recipe_id, user_id)
);

CREATE INDEX IF NOT EXISTS recipes_created_at_idx ON recipes (created_at DESC);
CREATE INDEX IF NOT EXISTS recipes_user_id_idx ON recipes (user_id);
CREATE INDEX IF NOT EXISTS reviews_recipe_id_idx ON reviews (recipe_id);

