/**
 * Database Schema Definitions
 * 
 * Defines all database tables, types, and validation schemas
 * for the blockchain communication platform.
 */

import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Import profile schema
export * from "./profile-schema";

// Import referral schema
export * from "./referral-schema";

// Wallet management table - stores encrypted wallet data
export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  address: text("address").notNull().unique(),
  name: text("name").notNull(),
  encryptedPrivateKey: text("encrypted_private_key").notNull(),
  encryptedMnemonic: text("encrypted_mnemonic"),
  isImported: boolean("is_imported").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Blockchain network configurations
export const networks = pgTable("networks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  chainId: integer("chain_id").notNull().unique(),
  rpcUrl: text("rpc_url").notNull(),
  symbol: text("symbol").notNull(),
  blockExplorerUrl: text("block_explorer_url"),
  isTestnet: boolean("is_testnet").default(true),
});

// Transaction history tracking
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id").references(() => wallets.id),
  hash: text("hash").notNull().unique(),
  from: text("from").notNull(),
  to: text("to").notNull(),
  value: decimal("value", { precision: 78, scale: 18 }).notNull(),
  gasPrice: decimal("gas_price", { precision: 78, scale: 0 }),
  gasUsed: decimal("gas_used", { precision: 78, scale: 0 }),
  status: text("status").notNull(), // pending, confirmed, failed
  blockNumber: integer("block_number"),
  networkId: integer("network_id").references(() => networks.id),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Wallet balance tracking across networks
export const balances = pgTable("balances", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id").references(() => wallets.id),
  networkId: integer("network_id").references(() => networks.id),
  balance: decimal("balance", { precision: 78, scale: 18 }).notNull(),
  usdValue: decimal("usd_value", { precision: 10, scale: 2 }),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Wallet-to-wallet messaging system
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  from: text("from").notNull(),
  to: text("to").notNull(),
  content: text("content").notNull(),
  attachmentName: text("attachment_name"),
  attachmentType: text("attachment_type"),
  attachmentSize: integer("attachment_size"),
  attachmentData: text("attachment_data"),
  read: boolean("read").default(false),
  delivered: boolean("delivered").default(false),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Contact management and address book
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  ownerWalletAddress: text("owner_wallet_address").notNull(),
  contactWalletAddress: text("contact_wallet_address").notNull(),
  contactName: text("contact_name").notNull(),
  notes: text("notes"),
  isFavorite: boolean("is_favorite").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Escrow smart contracts registry
export const escrowContracts = pgTable("escrow_contracts", {
  id: serial("id").primaryKey(),
  contractAddress: text("contract_address").notNull().unique(),
  deployer: text("deployer").notNull(),
  networkId: integer("network_id").references(() => networks.id),
  abiVersion: text("abi_version").notNull(),
  deploymentTxHash: text("deployment_tx_hash").notNull(),
  isActive: boolean("is_active").default(true),
  auditLink: text("audit_link"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sub-wallets for contract-specific escrow accounts
export const subWallets = pgTable("sub_wallets", {
  id: serial("id").primaryKey(),
  address: text("address").notNull().unique(),
  name: text("name").notNull(), // Human-readable name based on contract
  mainWalletAddress: text("main_wallet_address").notNull(),
  encryptedPrivateKey: text("encrypted_private_key").notNull(),
  contractId: text("contract_id"), // Links to specific contract
  purpose: text("purpose").notNull(), // escrow, trade_finance, etc.
  isActive: boolean("is_active").default(true),
  contractSigned: boolean("contract_signed").default(false), // Track if contract is signed
  signedAt: timestamp("signed_at"), // When contract was signed
  contractRole: text("contract_role"), // party, arbitrator
  createdAt: timestamp("created_at").defaultNow(),
});

// Sub-wallet invitations for party confirmation
export const subWalletInvitations = pgTable("sub_wallet_invitations", {
  id: serial("id").primaryKey(),
  inviterAddress: text("inviter_address").notNull(),
  inviteeAddress: text("invitee_address").notNull(),
  contractType: text("contract_type").notNull(), // trade_finance, escrow, etc.
  contractDetails: text("contract_details").notNull(), // JSON string
  status: text("status").notNull(), // pending, accepted, rejected, expired
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
});

// Individual escrow instances
export const escrows = pgTable("escrows", {
  id: serial("id").primaryKey(),
  contractAddress: text("contract_address").notNull(),
  escrowId: text("escrow_id").notNull(), // on-chain escrow ID
  exporter: text("exporter").notNull(), // wallet address
  importer: text("importer").notNull(), // wallet address
  financier: text("financier"), // optional wallet address
  exporterSubWallet: text("exporter_sub_wallet"), // dedicated sub-wallet for exporter
  importerSubWallet: text("importer_sub_wallet"), // dedicated sub-wallet for importer
  amount: decimal("amount", { precision: 78, scale: 18 }).notNull(),
  tokenAddress: text("token_address").notNull(), // ERC20 token or ETH
  tokenSymbol: text("token_symbol").notNull(),
  status: text("status").notNull(), // created, funded, released, expired, disputed
  expiryDate: timestamp("expiry_date"),
  networkId: integer("network_id").references(() => networks.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User role management
export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull().unique(),
  role: text("role").notNull(), // exporter, importer, financier, admin
  kycStatus: text("kyc_status").default("pending"), // pending, approved, failed
  kycDocuments: text("kyc_documents"), // JSON string of document links
  lastActivity: timestamp("last_activity").defaultNow(),
  referralSource: text("referral_source"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// On-chain event logs
export const eventLogs = pgTable("event_logs", {
  id: serial("id").primaryKey(),
  transactionHash: text("transaction_hash").notNull(),
  contractAddress: text("contract_address").notNull(),
  eventName: text("event_name").notNull(), // EscrowCreated, FundsDeposited, EscrowReleased, etc.
  blockNumber: integer("block_number").notNull(),
  logIndex: integer("log_index").notNull(),
  eventData: text("event_data").notNull(), // JSON string of event parameters
  networkId: integer("network_id").references(() => networks.id),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Token registry for monitoring
export const tokenRegistry = pgTable("token_registry", {
  id: serial("id").primaryKey(),
  address: text("address").notNull(),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  decimals: integer("decimals").notNull(),
  networkId: integer("network_id").references(() => networks.id),
  isActive: boolean("is_active").default(true),
  totalValueLocked: decimal("total_value_locked", { precision: 78, scale: 18 }).default("0"),
  priceUsd: decimal("price_usd", { precision: 10, scale: 6 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    uniqueTokenPerNetwork: unique().on(table.address, table.networkId),
  };
});

// Validation schemas for database operations
export const insertWalletSchema = createInsertSchema(wallets).omit({
  id: true,
  createdAt: true,
});

export const insertNetworkSchema = createInsertSchema(networks).omit({
  id: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  timestamp: true,
});

export const insertBalanceSchema = createInsertSchema(balances).omit({
  id: true,
  lastUpdated: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEscrowContractSchema = createInsertSchema(escrowContracts).omit({
  id: true,
  createdAt: true,
});

export const insertEscrowSchema = createInsertSchema(escrows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserRoleSchema = createInsertSchema(userRoles).omit({
  id: true,
  createdAt: true,
});

export const insertEventLogSchema = createInsertSchema(eventLogs).omit({
  id: true,
  timestamp: true,
});

export const insertTokenRegistrySchema = createInsertSchema(tokenRegistry).omit({
  id: true,
  createdAt: true,
});

export const insertSubWalletSchema = createInsertSchema(subWallets).omit({
  id: true,
  createdAt: true,
});

export const insertSubWalletInvitationSchema = createInsertSchema(subWalletInvitations).omit({
  id: true,
  createdAt: true,
});

export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof wallets.$inferSelect;
export type InsertNetwork = z.infer<typeof insertNetworkSchema>;
export type Network = typeof networks.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertBalance = z.infer<typeof insertBalanceSchema>;
export type Balance = typeof balances.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;
export type InsertEscrowContract = z.infer<typeof insertEscrowContractSchema>;
export type EscrowContract = typeof escrowContracts.$inferSelect;
export type InsertEscrow = z.infer<typeof insertEscrowSchema>;
export type Escrow = typeof escrows.$inferSelect;
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;
export type UserRole = typeof userRoles.$inferSelect;
export type InsertEventLog = z.infer<typeof insertEventLogSchema>;
export type EventLog = typeof eventLogs.$inferSelect;
export type InsertTokenRegistry = z.infer<typeof insertTokenRegistrySchema>;
export type TokenRegistry = typeof tokenRegistry.$inferSelect;
export type InsertSubWallet = z.infer<typeof insertSubWalletSchema>;
export type SubWallet = typeof subWallets.$inferSelect;
export type InsertSubWalletInvitation = z.infer<typeof insertSubWalletInvitationSchema>;
export type SubWalletInvitation = typeof subWalletInvitations.$inferSelect;

// Contract drafting and signing system
export const contractDrafts = pgTable("contract_drafts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  contractType: text("contract_type").notNull(), // escrow, trade_finance, service, etc.
  creatorAddress: text("creator_address").notNull(),
  partnerAddress: text("partner_address").notNull(),
  totalValue: decimal("total_value", { precision: 78, scale: 18 }).notNull(),
  currency: text("currency").notNull(),
  terms: text("terms"), // Legacy field - replaced by deliverables table
  status: text("status").notNull().default("draft"), // draft, sent, signed, active, completed, cancelled
  subWalletAddress: text("sub_wallet_address"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contract supporting documents
export const contractDocuments = pgTable("contract_documents", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").references(() => contractDrafts.id).notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(), // application/pdf, image/png, etc.
  fileSize: integer("file_size").notNull(), // in bytes
  fileData: text("file_data").notNull(), // base64 encoded file content
  uploadedBy: text("uploaded_by").notNull(), // wallet address
  description: text("description"), // optional description of the document
  documentType: text("document_type").notNull(), // contract_template, legal_document, specification, proof_of_work, etc.
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Contract signatures for wallet-based signing
export const contractSignatures = pgTable("contract_signatures", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").references(() => contractDrafts.id).notNull(),
  signerAddress: text("signer_address").notNull(),
  signature: text("signature").notNull(), // Wallet signature
  signedAt: timestamp("signed_at").defaultNow(),
  role: text("role").notNull(), // creator, partner, witness
});

// Contract deliverables and milestones
export const contractDeliverables = pgTable("contract_deliverables", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").references(() => contractDrafts.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  value: decimal("value", { precision: 78, scale: 18 }).notNull(),
  dueDate: timestamp("due_date"),
  status: text("status").notNull().default("pending"), // pending, claimed, verified, completed, disputed
  claimedBy: text("claimed_by"), // wallet address
  claimedAt: timestamp("claimed_at"),
  verifiedBy: text("verified_by"), // wallet address
  verifiedAt: timestamp("verified_at"),
  evidence: text("evidence"), // JSON string with proof/documents
  createdAt: timestamp("created_at").defaultNow(),
});

// Contract verification and disputes
export const contractVerifications = pgTable("contract_verifications", {
  id: serial("id").primaryKey(),
  deliverableId: integer("deliverable_id").references(() => contractDeliverables.id).notNull(),
  verifierAddress: text("verifier_address").notNull(),
  status: text("status").notNull(), // approved, rejected, disputed
  signature: text("signature").notNull(), // Wallet signature for verification
  comments: text("comments"),
  evidence: text("evidence"), // JSON string with verification proof
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for contract system
export const insertContractDraftSchema = createInsertSchema(contractDrafts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContractSignatureSchema = createInsertSchema(contractSignatures).omit({
  id: true,
  signedAt: true,
});

export const insertContractDeliverableSchema = createInsertSchema(contractDeliverables).omit({
  id: true,
  createdAt: true,
});

export const insertContractVerificationSchema = createInsertSchema(contractVerifications).omit({
  id: true,
  createdAt: true,
});

export const insertContractDocumentSchema = createInsertSchema(contractDocuments).omit({
  id: true,
  uploadedAt: true,
});

// Types for contract system
export type InsertContractDraft = z.infer<typeof insertContractDraftSchema>;
export type ContractDraft = typeof contractDrafts.$inferSelect;
export type InsertContractSignature = z.infer<typeof insertContractSignatureSchema>;
export type ContractSignature = typeof contractSignatures.$inferSelect;
export type InsertContractDeliverable = z.infer<typeof insertContractDeliverableSchema>;
export type ContractDeliverable = typeof contractDeliverables.$inferSelect;
export type InsertContractVerification = z.infer<typeof insertContractVerificationSchema>;
export type ContractVerification = typeof contractVerifications.$inferSelect;
export type InsertContractDocument = z.infer<typeof insertContractDocumentSchema>;
export type ContractDocument = typeof contractDocuments.$inferSelect;

// Invoice management system
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  senderAddress: text("sender_address").notNull(),
  recipientAddress: text("recipient_address").notNull(),
  recipientEmail: text("recipient_email"),
  recipientName: text("recipient_name"),
  title: text("title").notNull(),
  description: text("description"),
  totalAmount: decimal("total_amount", { precision: 78, scale: 18 }).notNull(),
  currency: text("currency").notNull().default("USDC"),
  dueDate: timestamp("due_date").notNull(),
  status: text("status").notNull().default("draft"), // draft, sent, viewed, paid, overdue, cancelled
  paymentAddress: text("payment_address"), // Sub-wallet for payment collection
  paymentTxHash: text("payment_tx_hash"), // Transaction hash when paid
  paidAt: timestamp("paid_at"),
  paidAmount: decimal("paid_amount", { precision: 78, scale: 18 }),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"), // Percentage
  taxAmount: decimal("tax_amount", { precision: 78, scale: 18 }).default("0"),
  discountRate: decimal("discount_rate", { precision: 5, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 78, scale: 18 }).default("0"),
  subtotal: decimal("subtotal", { precision: 78, scale: 18 }).notNull(),
  notes: text("notes"),
  terms: text("terms"),
  isRecurring: boolean("is_recurring").default(false),
  recurringInterval: text("recurring_interval"), // monthly, quarterly, yearly
  nextInvoiceDate: timestamp("next_invoice_date"),
  templateId: text("template_id"),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoice line items for detailed billing
export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id).notNull(),
  itemName: text("item_name").notNull(),
  description: text("description"),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
  unitPrice: decimal("unit_price", { precision: 78, scale: 18 }).notNull(),
  totalPrice: decimal("total_price", { precision: 78, scale: 18 }).notNull(),
  category: text("category"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Invoice templates for reusable invoice structures
export const invoiceTemplates = pgTable("invoice_templates", {
  id: serial("id").primaryKey(),
  creatorAddress: text("creator_address").notNull(),
  templateName: text("template_name").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  currency: text("currency").notNull().default("USDC"),
  defaultDueDays: integer("default_due_days").default(30),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
  terms: text("terms"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  items: text("items"), // JSON string of default items
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoice payment tracking and reminders
export const invoicePayments = pgTable("invoice_payments", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id).notNull(),
  paymentAmount: decimal("payment_amount", { precision: 78, scale: 18 }).notNull(),
  paymentMethod: text("payment_method").notNull(), // crypto, bank_transfer, card
  transactionHash: text("transaction_hash"),
  paymentAddress: text("payment_address"),
  blockNumber: integer("block_number"),
  paymentStatus: text("payment_status").notNull(), // pending, confirmed, failed
  paidBy: text("paid_by"), // Payer address
  paymentDate: timestamp("payment_date").defaultNow(),
  gasUsed: decimal("gas_used", { precision: 78, scale: 0 }),
  notes: text("notes"),
});

// Invoice notifications and reminders
export const invoiceNotifications = pgTable("invoice_notifications", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id).notNull(),
  notificationType: text("notification_type").notNull(), // sent, viewed, reminder, overdue
  recipientAddress: text("recipient_address").notNull(),
  sentAt: timestamp("sent_at").defaultNow(),
  deliveryStatus: text("delivery_status").default("sent"), // sent, delivered, failed
  reminderCount: integer("reminder_count").default(0),
  nextReminderAt: timestamp("next_reminder_at"),
});

// Insert schemas for invoice system
export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({
  id: true,
  createdAt: true,
});

export const insertInvoiceTemplateSchema = createInsertSchema(invoiceTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoicePaymentSchema = createInsertSchema(invoicePayments).omit({
  id: true,
  paymentDate: true,
});

export const insertInvoiceNotificationSchema = createInsertSchema(invoiceNotifications).omit({
  id: true,
  sentAt: true,
});

// Types for invoice system
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceTemplate = z.infer<typeof insertInvoiceTemplateSchema>;
export type InvoiceTemplate = typeof invoiceTemplates.$inferSelect;
export type InsertInvoicePayment = z.infer<typeof insertInvoicePaymentSchema>;
export type InvoicePayment = typeof invoicePayments.$inferSelect;
export type InsertInvoiceNotification = z.infer<typeof insertInvoiceNotificationSchema>;
export type InvoiceNotification = typeof invoiceNotifications.$inferSelect;

// Notifications system for milestone and contract updates
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  recipientAddress: text("recipient_address").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // milestone_due, milestone_completed, contract_signed, verification_required, funds_released
  relatedId: integer("related_id"), // Contract ID, deliverable ID, etc.
  relatedType: text("related_type"), // contract, deliverable, verification
  actionRequired: boolean("action_required").default(false),
  actionUrl: text("action_url"), // Frontend route for action
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Export all referral-related schemas
export * from './referral-schema';
