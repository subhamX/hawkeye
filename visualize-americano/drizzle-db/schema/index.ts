import { pgTable, text, timestamp } from "drizzle-orm/pg-core";


export const contactUs = pgTable('contact_us', {
  id: text('id').primaryKey(),
  email: text("email").notNull(),
  message: text("message").notNull(),

  country: text("country"),
  city: text("city"),
  region: text("region"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});
