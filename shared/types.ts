/**
 * 跨境物流系统共享类型定义
 */

// 基础类型
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  version: number;
}

// 用户相关
export enum UserRole {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
  LOGISTICS_MANAGER = 'logistics_manager',
  SALES = 'sales',
  SUPPORT = 'support'
}

export interface User extends BaseEntity {
  email: string;
  username: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'suspended';
  lastLoginAt?: Date;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  language: string;
  currency: string;
  timezone: string;
  notificationSettings: NotificationSettings;
}

export interface NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
  wechat: boolean;
}

// 物流产品相关
export enum LogisticsType {
  EXPRESS = 'express',      // 快递
  AIR_FREIGHT = 'air_freight', // 空运
  SEA_FREIGHT = 'sea_freight', // 海运
  RAIL_FREIGHT = 'rail_freight', // 铁路
  ROAD_FREIGHT = 'road_freight'  // 陆运
}

export enum PackageType {
  DOCUMENT = 'document',    // 文件
  PARCEL = 'parcel',        // 包裹
  PALLET = 'pallet',        // 托盘
  CONTAINER = 'container'   // 集装箱
}

export enum DangerousGoodsType {
  NONE = 'none',
  FLAMMABLE = 'flammable',
  EXPLOSIVE = 'explosive',
  CORROSIVE = 'corrosive',
  TOXIC = 'toxic',
  RADIOACTIVE = 'radioactive'
}

export interface LogisticsProduct extends BaseEntity {
  name: string;
  code: string;
  description: string;
  type: LogisticsType;
  carrier: string;          // 承运商
  originCountries: string[]; // 起运国家
  destinationCountries: string[]; // 目的国家
  supportedPackageTypes: PackageType[];
  supportedDangerousGoods: DangerousGoodsType[];
  
  // 时效信息
  minTransitDays: number;
  maxTransitDays: number;
  estimatedTransitDays: number;
  
  // 重量尺寸限制
  minWeight: number;        // kg
  maxWeight: number;        // kg
  minLength: number;        // cm
  maxLength: number;        // cm
  minWidth: number;         // cm
  maxWidth: number;         // cm
  minHeight: number;        // cm
  maxHeight: number;        // cm
  
  // 服务特性
  features: string[];
  restrictions: string[];
  requirements: string[];
  
  // 状态
  status: 'active' | 'inactive' | 'maintenance';
  priority: number;         // 优先级，用于排序
}

// 报价相关
export interface QuoteRequest {
  // 发件人信息
  sender: Address;
  
  // 收件人信息
  recipient: Address;
  
  // 包裹信息
  packages: PackageInfo[];
  
  // 物流要求
  requirements: LogisticsRequirements;
  
  // 其他信息
  insuranceRequired: boolean;
  insuranceValue?: number;
  customsClearance: boolean;
  pickupRequired: boolean;
  deliveryRequired: boolean;
  timeline: Timeline;
}

export interface Address {
  country: string;
  province: string;
  city: string;
  district?: string;
  address: string;
  postalCode: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  company?: string;
  taxId?: string;
}

export interface PackageInfo {
  packageType: PackageType;
  weight: number;           // kg
  length: number;          // cm
  width: number;           // cm
  height: number;          // cm
  declaredValue: number;   // 申报价值
  description: string;
  dangerousGoods?: DangerousGoodsType;
  hsCode?: string;         // 海关编码
  quantity: number;        // 数量
}

export interface LogisticsRequirements {
  preferredCarriers?: string[];
  preferredServices?: string[];
  deliveryTimeWindow?: {
    start: Date;
    end: Date;
  };
  specialInstructions?: string;
  temperatureControl?: boolean;
  humidityControl?: boolean;
  fragile: boolean;
}

export interface Timeline {
  pickupDate: Date;
  expectedDeliveryDate?: Date;
  urgent: boolean;
}

export interface QuoteResponse {
  quoteId: string;
  request: QuoteRequest;
  offers: LogisticsOffer[];
  generatedAt: Date;
  expiresAt: Date;
}

export interface LogisticsOffer {
  product: LogisticsProduct;
  basePrice: number;       // 基础价格
  surcharges: Surcharge[];  // 附加费
  discounts: Discount[];   // 折扣
  totalPrice: number;      // 总价
  currency: string;
  estimatedDeliveryDate: Date;
  transitDays: number;
  serviceLevel: ServiceLevel;
  terms: TermsAndConditions;
}

export interface Surcharge {
  name: string;
  description: string;
  amount: number;
  type: 'percentage' | 'fixed';
}

export interface Discount {
  name: string;
  description: string;
  amount: number;
  type: 'percentage' | 'fixed';
}

export enum ServiceLevel {
  ECONOMY = 'economy',
  STANDARD = 'standard',
  EXPRESS = 'express',
  PREMIUM = 'premium'
}

export interface TermsAndConditions {
  liabilityLimit: number;
  insuranceCoverage: number;
  cancellationPolicy: string;
  claimProcess: string;
}

// 订单相关
export interface Order extends BaseEntity {
  orderNumber: string;
  customerId: string;
  quoteId: string;
  selectedOffer: LogisticsOffer;
  
  // 订单状态
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  
  // 财务信息
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  paidAmount: number;
  
  // 时间线
  timeline: OrderTimeline;
  
  // 跟踪信息
  trackingNumber?: string;
  trackingUrl?: string;
  
  // 备注
  notes?: string;
}

export enum OrderStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export enum FulfillmentStatus {
  NOT_STARTED = 'not_started',
  PICKUP_SCHEDULED = 'pickup_scheduled',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  EXCEPTION = 'exception'
}

export interface OrderTimeline {
  createdAt: Date;
  confirmedAt?: Date;
  paidAt?: Date;
  pickupScheduledAt?: Date;
  pickedUpAt?: Date;
  inTransitAt?: Date;
  outForDeliveryAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
}

// 销售方法相关
export interface SalesMethod extends BaseEntity {
  name: string;
  code: string;
  description: string;
  type: SalesMethodType;
  targetAudience: TargetAudience[];
  commissionRate: number;      // 佣金比例
  pricingModel: PricingModel;
  requirements: Requirement[];
  benefits: Benefit[];
  status: 'active' | 'inactive';
}

export enum SalesMethodType {
  DIRECT_SALES = 'direct_sales',
  AGENT = 'agent',
  PARTNER = 'partner',
  RESELLER = 'reseller',
  AFFILIATE = 'affiliate',
  ONLINE_PLATFORM = 'online_platform'
}

export interface TargetAudience {
  region: string;
  industry?: string;
  companySize?: 'small' | 'medium' | 'large' | 'enterprise';
  customerType?: 'b2b' | 'b2c' | 'both';
}

export interface PricingModel {
  type: 'fixed' | 'tiered' | 'volume' | 'negotiated';
  details: PricingDetail[];
}

export interface PricingDetail {
  minVolume: number;
  maxVolume?: number;
  price: number;
  unit: string;
}

export interface Requirement {
  type: 'document' | 'certification' | 'experience' | 'financial';
  description: string;
  mandatory: boolean;
}

export interface Benefit {
  name: string;
  description: string;
  value: string;
}

// 企业微信机器人相关
export interface WeChatBotConfig {
  corpId: string;
  agentId: string;
  secret: string;
  token: string;
  encodingAESKey: string;
  callbackUrl: string;
}

export interface WeChatMessage {
  msgId: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  msgType: WeChatMsgType;
  content: string;
  createTime: number;
  event?: WeChatEvent;
}

export enum WeChatMsgType {
  TEXT = 'text',
  IMAGE = 'image',
  VOICE = 'voice',
  VIDEO = 'video',
  LOCATION = 'location',
  LINK = 'link',
  EVENT = 'event'
}

export enum WeChatEvent {
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  CLICK = 'click',
  VIEW = 'view',
  SCAN = 'scan',
  LOCATION = 'location'
}

export interface WeChatResponse {
  msgType: WeChatMsgType;
  content: string;
  articles?: WeChatArticle[];
}

export interface WeChatArticle {
  title: string;
  description: string;
  url: string;
  picUrl?: string;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp: Date;
  requestId: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 搜索和过滤
export interface LogisticsProductFilter {
  originCountry?: string;
  destinationCountry?: string;
  logisticsType?: LogisticsType[];
  packageType?: PackageType[];
  carrier?: string[];
  minTransitDays?: number;
  maxTransitDays?: number;
  status?: string;
  searchText?: string;
}

export interface QuoteHistoryFilter {
  customerId?: string;
  startDate?: Date;
  endDate?: Date;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
}

// 数据统计
export interface LogisticsStats {
  totalOrders: number;
  totalRevenue: number;
  averageTransitTime: number;
  onTimeDeliveryRate: number;
  topCarriers: CarrierStats[];
  popularRoutes: RouteStats[];
  monthlyTrend: MonthlyTrend[];
}

export interface CarrierStats {
  carrier: string;
  orderCount: number;
  revenue: number;
  onTimeRate: number;
}

export interface RouteStats {
  origin: string;
  destination: string;
  orderCount: number;
  averagePrice: number;
}

export interface MonthlyTrend {
  month: string;
  orders: number;
  revenue: number;
  averageTransitTime: number;
}

// WebSocket事件
export interface WebSocketEvent {
  type: string;
  data: any;
  timestamp: Date;
  userId?: string;
}

export enum WebSocketEventType {
  ORDER_UPDATED = 'order_updated',
  QUOTE_GENERATED = 'quote_generated',
  NOTIFICATION = 'notification',
  CHAT_MESSAGE = 'chat_message',
  SYSTEM_ALERT = 'system_alert'
}