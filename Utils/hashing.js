import bcrypt from "bcryptjs";
import { createHmac } from "crypto";

// هاش للباسورد باستخدام bcrypt
export const dohash = async (password, saltvalue) => {
  const result = await bcrypt.hash(password, saltvalue);
  return result;
};

// مقارنة بين الباسورد والهاش
export const compareHash = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// هاش باستخدام HMAC (مثلاً للكود بتاع التحقق)
export const hmacprocess = (value, key) => {
  return createHmac("sha256", key).update(value).digest("hex");
};
