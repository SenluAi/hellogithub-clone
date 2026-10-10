-- 给账号加自定义头像字段（存 data URI 或 https 图片地址）
ALTER TABLE users ADD COLUMN avatar TEXT;
