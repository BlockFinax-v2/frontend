import { pgTable, serial, text, timestamp, decimal, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Escrow contracts table
export const escrowContracts = pgTable("escrow_contracts", {
  id: serial("id").primaryKey(),
  contractAddress: text("contract_address").notNull().unique(),
  creatorWalletId: integer("creator_wallet_id").notNull(),
  importerAddress: text("importer_address").notNull(),
  exporterAddress: text("exporter_address").notNull(),
  amount: decimal("amount", { precision: 36, scale: 18 }).notNull(),
  currency: text("currency").notNull().default("ETH"),
  networkId: integer("network_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, funded, released, refunded, disputed
  description: text("description"),
  termsAndConditions: text("terms_and_conditions"),
  deliveryDeadline: timestamp("delivery_deadline"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  metadata: jsonb("metadata"), // Store additional contract data
});

// Sub-wallets for escrow participants
export const escrowSubWallets = pgTable("escrow_sub_wallets", {
  id: serial("id").primaryKey(),
  escrowContractId: integer("escrow_contract_id").notNull(),
  walletAddress: text("wallet_address").notNull(),
  role: text("role").notNull(), // importer, exporter, arbitrator
  permissions: jsonb("permissions"), // What actions this wallet can perform
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Escrow milestones and payments
export const escrowMilestones = pgTable("escrow_milestones", {
  id: serial("id").primaryKey(),
  escrowContractId: integer("escrow_contract_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 36, scale: 18 }).notNull(),
  percentage: decimal("percentage", { precision: 5, scale: 2 }), // Percentage of total contract
  status: text("status").notNull().default("pending"), // pending, completed, released
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  releasedAt: timestamp("released_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Escrow disputes and arbitration
export const escrowDisputes = pgTable("escrow_disputes", {
  id: serial("id").primaryKey(),
  escrowContractId: integer("escrow_contract_id").notNull(),
  initiatedBy: text("initiated_by").notNull(), // importer or exporter
  reason: text("reason").notNull(),
  description: text("description"),
  evidence: jsonb("evidence"), // Array of evidence files/links
  arbitratorAddress: text("arbitrator_address"),
  status: text("status").notNull().default("open"), // open, in_review, resolved
  resolution: text("resolution"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Escrow transactions and events
export const escrowTransactions = pgTable("escrow_transactions", {
  id: serial("id").primaryKey(),
  escrowContractId: integer("escrow_contract_id").notNull(),
  transactionHash: text("transaction_hash").notNull(),
  eventType: text("event_type").notNull(), // funded, released, refunded, disputed
  fromAddress: text("from_address").notNull(),
  toAddress: text("to_address"),
  amount: decimal("amount", { precision: 36, scale: 18 }),
  gasUsed: text("gas_used"),
  gasPrice: text("gas_price"),
  blockNumber: integer("block_number"),
  timestamp: timestamp("timestamp").notNull(),
  metadata: jsonb("metadata"),
});

// Create insert schemas
export const insertEscrowContractSchema = createInsertSchema(escrowContracts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEscrowSubWalletSchema = createInsertSchema(escrowSubWallets).omit({
  id: true,
  createdAt: true,
});

export const insertEscrowMilestoneSchema = createInsertSchema(escrowMilestones).omit({
  id: true,
  createdAt: true,
});

export const insertEscrowDisputeSchema = createInsertSchema(escrowDisputes).omit({
  id: true,
  createdAt: true,
});

export const insertEscrowTransactionSchema = createInsertSchema(escrowTransactions).omit({
  id: true,
});

// Type exports
export type EscrowContract = typeof escrowContracts.$inferSelect;
export type InsertEscrowContract = z.infer<typeof insertEscrowContractSchema>;
export type EscrowSubWallet = typeof escrowSubWallets.$inferSelect;
export type InsertEscrowSubWallet = z.infer<typeof insertEscrowSubWalletSchema>;
export type EscrowMilestone = typeof escrowMilestones.$inferSelect;
export type InsertEscrowMilestone = z.infer<typeof insertEscrowMilestoneSchema>;
export type EscrowDispute = typeof escrowDisputes.$inferSelect;
export type InsertEscrowDispute = z.infer<typeof insertEscrowDisputeSchema>;
export type EscrowTransaction = typeof escrowTransactions.$inferSelect;
export type InsertEscrowTransaction = z.infer<typeof insertEscrowTransactionSchema>;