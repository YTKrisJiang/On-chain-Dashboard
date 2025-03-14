-- 创建clankers表
CREATE TABLE IF NOT EXISTS clankers (
  id SERIAL PRIMARY KEY,
  token_name VARCHAR(255) NOT NULL,
  token_image_url TEXT,
  address VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  token_id VARCHAR(255) NOT NULL,
  token_value VARCHAR(50) DEFAULT '0',
  token_price VARCHAR(50) DEFAULT '0',
  user_avatar TEXT,
  user_name VARCHAR(255),
  user_handle VARCHAR(255),
  followers VARCHAR(50) DEFAULT '0',
  following VARCHAR(50) DEFAULT '0'
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_clankers_address ON clankers(address);
CREATE INDEX IF NOT EXISTS idx_clankers_token_id ON clankers(token_id);
CREATE INDEX IF NOT EXISTS idx_clankers_created_at ON clankers(created_at);

-- 插入一些测试数据
INSERT INTO clankers (
  token_name, token_image_url, address, created_at, token_id, token_value, token_price,
  user_avatar, user_name, user_handle, followers, following
) VALUES 
(
  'Clanker #1', 
  'https://i.imgur.com/example1.png', 
  '8xrt6aqbv3mYfGNF7nNTx9wBbo6yVR3xUwfRBXV6YQ5C', 
  NOW() - INTERVAL '2 HOURS', 
  'CLK001', 
  '10.5', 
  '2.34', 
  'https://i.imgur.com/user1.png', 
  'Kate', 
  '@kate', 
  '1.2K', 
  '234'
),
(
  'Clanker #2', 
  'https://i.imgur.com/example2.png', 
  'DRtXHDgC312wpNdNCSb8vPXNWMSK3vj6uMo1GVgABbKi', 
  NOW() - INTERVAL '5 HOURS', 
  'CLK002', 
  '5.2', 
  '1.87', 
  'https://i.imgur.com/user2.png', 
  'John', 
  '@john', 
  '3.4K', 
  '567'
),
(
  'Clanker #3', 
  'https://i.imgur.com/example3.png', 
  'Gq1BgL4mZQA6cX4YFkSJUAKJUvLPUKzYpEJ4BQHdEBCx', 
  NOW() - INTERVAL '1 DAY', 
  'CLK003', 
  '8.7', 
  '3.21', 
  'https://i.imgur.com/user3.png', 
  'Alice', 
  '@alice', 
  '5.6K', 
  '789'
),
(
  'Clanker #4', 
  'https://i.imgur.com/example4.png', 
  'FvQJMiRpqkF9K7Eo8M6dU5tW2Xz4YbHgNcPjLmSaQrDv', 
  NOW() - INTERVAL '3 DAYS', 
  'CLK004', 
  '12.3', 
  '4.56', 
  'https://i.imgur.com/user4.png', 
  'Bob', 
  '@bob', 
  '7.8K', 
  '123'
),
(
  'Clanker #5', 
  'https://i.imgur.com/example5.png', 
  'HjKlMnOpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYz', 
  NOW() - INTERVAL '1 WEEK', 
  'CLK005', 
  '3.9', 
  '0.98', 
  'https://i.imgur.com/user5.png', 
  'Charlie', 
  '@charlie', 
  '9.0K', 
  '456'
); 