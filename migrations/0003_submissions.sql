-- 提交项目：用户投稿记录
CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_url ON submissions(url);
CREATE INDEX IF NOT EXISTS idx_submissions_user ON submissions(user_id);
