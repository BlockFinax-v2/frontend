import { pgTable, text, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userProfiles = pgTable("user_profiles", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  walletAddress: varchar("wallet_address", { length: 42 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }),
  firstName: varchar("first_name", { length: 50 }),
  lastName: varchar("last_name", { length: 50 }),
  email: varchar("email", { length: 255 }),
  phoneNumber: varchar("phone_number", { length: 20 }),
  companyName: varchar("company_name", { length: 200 }),
  jobTitle: varchar("job_title", { length: 100 }),
  country: varchar("country", { length: 100 }),
  city: varchar("city", { length: 100 }),
  address: text("address"),
  postalCode: varchar("postal_code", { length: 20 }),
  dateOfBirth: varchar("date_of_birth", { length: 10 }), // YYYY-MM-DD format
  nationality: varchar("nationality", { length: 100 }),
  idType: varchar("id_type", { length: 50 }), // passport, driver_license, national_id
  idNumber: varchar("id_number", { length: 100 }),
  taxId: varchar("tax_id", { length: 100 }),
  website: varchar("website", { length: 255 }),
  linkedIn: varchar("linkedin", { length: 255 }),
  twitter: varchar("twitter", { length: 255 }),
  bio: text("bio"),
  avatar: text("avatar"), // base64 image data or URL
  kycStatus: varchar("kyc_status", { length: 20 }).default("pending"), // pending, verified, rejected
  kycDocuments: text("kyc_documents"), // JSON array of document hashes
  isPublic: boolean("is_public").default(false),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;