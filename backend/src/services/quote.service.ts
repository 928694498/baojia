import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RedisService } from './redis.service';
import { 
  QuoteRequest, 
  QuoteResponse, 
  LogisticsOffer, 
  Surcharge, 
  Discount,
  ServiceLevel,
  PackageInfo,
  Address,
  LogisticsProduct
} from '../../../shared/types';
import { LogisticsProductService } from './logistics-product.service';
import { PricingCalculator } from '../utils/pricing-calculator';
import { ValidationService } from './validation.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class QuoteService {
  private readonly logger = new Logger(QuoteService.name);
  private readonly QUOTE_CACHE_TTL = 1800; // 30分钟缓存
  
  constructor(
    @InjectModel('QuoteResponse') private quoteModel: Model<QuoteResponse>,
    private productService: LogisticsProductService,
    private pricingCalculator: PricingCalculator,
    private validationService: ValidationService,
    private redisService: RedisService
  ) {}

  /**
   * 生成物流报价
   */
  async generateQuote(quoteRequest: QuoteRequest): Promise<QuoteResponse> {
    try {
      this.logger.log('Generating new quote');
      
      // 验证报价请求
      await this.validationService.validateQuoteRequest(quoteRequest);
      
      // 检查缓存中是否有相同请求的报价
      const cacheKey = this.generateQuoteCacheKey(quoteRequest);
      const cachedQuote = await this.redisService.get<QuoteResponse>(cacheKey);
      
      if (cachedQuote) {
        this.logger.debug('Returning cached quote');
        return cachedQuote;
      }
      
      // 获取适用的物流产品
      const applicableProducts = await this.getApplicableProducts(quoteRequest);
      
      if (applicableProducts.length === 0) {
        throw new Error('No applicable logistics products found for the given request');
      }
      
      // 为每个产品生成报价
      const offers = await this.generateOffers(quoteRequest, applicableProducts);
      
      // 按总价排序
      offers.sort((a, b) => a.totalPrice - b.totalPrice);
      
      // 创建报价响应
      const quoteResponse: QuoteResponse = {
        quoteId: uuidv4(),
        request: quoteRequest,
        offers,
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时后过期
      };
      
      // 保存到数据库
      const savedQuote = await this.quoteModel.create(quoteResponse);
      
      // 缓存报价
      await this.redisService.set(cacheKey, savedQuote.toObject(), this.QUOTE_CACHE_TTL);
      
      this.logger.log(`Quote generated successfully: ${savedQuote.quoteId}`);
      return savedQuote.toObject();
    } catch (error) {
      this.logger.error(`Failed to generate quote: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取报价详情
   */
  async getQuoteById(quoteId: string): Promise<QuoteResponse | null> {
    try {
      // 尝试从缓存获取
      const cacheKey = `quote:${quoteId}`;
      const cachedQuote = await this.redisService.get<QuoteResponse>(cacheKey);
      
      if (cachedQuote) {
        return cachedQuote;
      }
      
      // 从数据库获取
      const quote = await this.quoteModel.findOne({ quoteId }).lean();
      
      if (quote) {
        // 缓存报价
        await this.redisService.set(cacheKey, quote, this.QUOTE_CACHE_TTL);
      }
      
      return quote;
    } catch (error) {
      this.logger.error(`Failed to get quote ${quoteId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取用户的报价历史
   */
  async getUserQuoteHistory(
    userId: string,
    page = 1,
    pageSize = 20
  ): Promise<{
    items: QuoteResponse[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * pageSize;
      
      // 构建查询条件（根据实际情况调整）
      const query = {
        'request.customerId': userId
      };
      
      const [quotes, total] = await Promise.all([
        this.quoteModel
          .find(query)
          .sort({ generatedAt: -1 })
          .skip(skip)
          .limit(pageSize)
          .lean(),
        this.quoteModel.countDocuments(query)
      ]);
      
      const totalPages = Math.ceil(total / pageSize);
      
      return {
        items: quotes,
        total,
        page,
        pageSize,
        totalPages
      };
    } catch (error) {
      this.logger.error(`Failed to get user quote history: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取适用的物流产品
   */
  private async getApplicableProducts(quoteRequest: QuoteRequest): Promise<LogisticsProduct[]> {
    try {
      const { sender, recipient, packages } = quoteRequest;
      
      // 获取总重量和最大尺寸
      const totalWeight = packages.reduce((sum, pkg) => sum + pkg.weight * pkg.quantity, 0);
      
      // 获取最大尺寸
      let maxLength = 0, maxWidth = 0, maxHeight = 0;
      packages.forEach(pkg => {
        maxLength = Math.max(maxLength, pkg.length);
        maxWidth = Math.max(maxWidth, pkg.width);
        maxHeight = Math.max(maxHeight, pkg.height);
      });
      
      // 检查危险品
      const hasDangerousGoods = packages.some(pkg => pkg.dangerousGoods && pkg.dangerousGoods !== 'none');
      
      // 搜索适用的产品
      const products = await this.productService.searchProducts(
        sender.country,
        recipient.country,
        totalWeight,
        { length: maxLength, width: maxWidth, height: maxHeight }
      );
      
      // 过滤支持危险品的产品（如果有危险品）
      if (hasDangerousGoods) {
        return products.filter(product => 
          product.supportedDangerousGoods && 
          product.supportedDangerousGoods.length > 0
        );
      }
      
      return products;
    } catch (error) {
      this.logger.error(`Failed to get applicable products: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 为产品生成报价
   */
  private async generateOffers(
    quoteRequest: QuoteRequest,
    products: LogisticsProduct[]
  ): Promise<LogisticsOffer[]> {
    const offers: LogisticsOffer[] = [];
    
    for (const product of products) {
      try {
        const offer = await this.generateOfferForProduct(quoteRequest, product);
        if (offer) {
          offers.push(offer);
        }
      } catch (error) {
        this.logger.warn(`Failed to generate offer for product ${product.id}: ${error.message}`);
      }
    }
    
    return offers;
  }

  /**
   * 为单个产品生成报价
   */
  private async generateOfferForProduct(
    quoteRequest: QuoteRequest,
    product: LogisticsProduct
  ): Promise<LogisticsOffer> {
    // 计算基础价格
    const basePrice = this.pricingCalculator.calculateBasePrice(
      quoteRequest,
      product
    );
    
    // 计算附加费
    const surcharges = this.pricingCalculator.calculateSurcharges(
      quoteRequest,
      product,
      basePrice
    );
    
    // 计算折扣
    const discounts = this.pricingCalculator.calculateDiscounts(
      quoteRequest,
      product,
      basePrice
    );
    
    // 计算总价
    const surchargeTotal = surcharges.reduce((sum, charge) => sum + charge.amount, 0);
    const discountTotal = discounts.reduce((sum, discount) => sum + discount.amount, 0);
    const totalPrice = basePrice + surchargeTotal - discountTotal;
    
    // 确定服务等级
    const serviceLevel = this.determineServiceLevel(product, quoteRequest);
    
    // 计算预计送达日期
    const estimatedDeliveryDate = this.calculateEstimatedDeliveryDate(
      quoteRequest.timeline.pickupDate,
      product.estimatedTransitDays
    );
    
    // 构建报价条款
    const terms = this.buildTermsAndConditions(product, quoteRequest);
    
    return {
      product,
      basePrice,
      surcharges,
      discounts,
      totalPrice,
      currency: 'USD', // 根据实际情况调整
      estimatedDeliveryDate,
      transitDays: product.estimatedTransitDays,
      serviceLevel,
      terms
    };
  }

  /**
   * 确定服务等级
   */
  private determineServiceLevel(
    product: LogisticsProduct,
    quoteRequest: QuoteRequest
  ): ServiceLevel {
    const { requirements, timeline } = quoteRequest;
    
    if (timeline.urgent) {
      return ServiceLevel.EXPRESS;
    }
    
    if (requirements.temperatureControl || requirements.humidityControl) {
      return ServiceLevel.PREMIUM;
    }
    
    if (product.type === 'express') {
      return ServiceLevel.EXPRESS;
    }
    
    if (product.estimatedTransitDays <= 7) {
      return ServiceLevel.STANDARD;
    }
    
    return ServiceLevel.ECONOMY;
  }

  /**
   * 计算预计送达日期
   */
  private calculateEstimatedDeliveryDate(
    pickupDate: Date,
    transitDays: number
  ): Date {
    const deliveryDate = new Date(pickupDate);
    deliveryDate.setDate(deliveryDate.getDate() + transitDays);
    
    // 跳过周末（简单实现）
    const dayOfWeek = deliveryDate.getDay();
    if (dayOfWeek === 0) { // 周日
      deliveryDate.setDate(deliveryDate.getDate() + 1);
    } else if (dayOfWeek === 6) { // 周六
      deliveryDate.setDate(deliveryDate.getDate() + 2);
    }
    
    return deliveryDate;
  }

  /**
   * 构建条款和条件
   */
  private buildTermsAndConditions(
    product: LogisticsProduct,
    quoteRequest: QuoteRequest
  ): any {
    const declaredValue = quoteRequest.packages.reduce(
      (sum, pkg) => sum + pkg.declaredValue * pkg.quantity,
      0
    );
    
    const insuranceValue = quoteRequest.insuranceRequired 
      ? quoteRequest.insuranceValue || declaredValue
      : 0;
    
    return {
      liabilityLimit: Math.min(declaredValue * 0.1, 1000), // 责任限制
      insuranceCoverage: insuranceValue,
      cancellationPolicy: 'Cancellation allowed up to 24 hours before pickup with 10% fee',
      claimProcess: 'Claims must be submitted within 30 days of delivery',
      specialTerms: product.restrictions || [],
      complianceRequirements: product.requirements || []
    };
  }

  /**
   * 生成报价缓存键
   */
  private generateQuoteCacheKey(quoteRequest: QuoteRequest): string {
    // 创建请求的简单哈希（实际应用中应该使用更复杂的哈希算法）
    const requestString = JSON.stringify({
      sender: quoteRequest.sender.country + quoteRequest.sender.city,
      recipient: quoteRequest.recipient.country + quoteRequest.recipient.city,
      packages: quoteRequest.packages.map(pkg => ({
        type: pkg.packageType,
        weight: pkg.weight,
        dimensions: `${pkg.length}x${pkg.width}x${pkg.height}`
      })),
      requirements: {
        urgent: quoteRequest.timeline.urgent,
        fragile: quoteRequest.requirements.fragile,
        insurance: quoteRequest.insuranceRequired
      }
    });
    
    // 简单哈希函数
    let hash = 0;
    for (let i = 0; i < requestString.length; i++) {
      const char = requestString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    
    return `quote:${Math.abs(hash)}`;
  }

  /**
   * 批量报价（为多个请求生成报价）
   */
  async batchGenerateQuotes(quoteRequests: QuoteRequest[]): Promise<QuoteResponse[]> {
    try {
      this.logger.log(`Generating batch quotes for ${quoteRequests.length} requests`);
      
      const results: QuoteResponse[] = [];
      const errors: Array<{ index: number; error: string }> = [];
      
      // 并行处理报价请求
      const promises = quoteRequests.map(async (request, index) => {
        try {
          const quote = await this.generateQuote(request);
          results.push(quote);
        } catch (error) {
          errors.push({
            index,
            error: error.message
          });
          this.logger.warn(`Failed to generate quote for request ${index}: ${error.message}`);
        }
      });
      
      await Promise.all(promises);
      
      this.logger.log(`Batch quote generation completed: ${results.length} successful, ${errors.length} failed`);
      
      // 如果有错误，可以记录或抛出
      if (errors.length > 0) {
        this.logger.warn(`Batch quote errors: ${JSON.stringify(errors)}`);
      }
      
      return results;
    } catch (error) {
      this.logger.error(`Failed to generate batch quotes: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取报价统计信息
   */
  async getQuoteStats(timeRange: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<{
    totalQuotes: number;
    averageResponseTime: number;
    conversionRate: number;
    popularOrigins: Array<{ country: string; count: number }>;
    popularDestinations: Array<{ country: string; count: number }>;
  }> {
    try {
      // 根据时间范围构建查询条件
      const dateFilter = this.buildDateFilter(timeRange);
      
      const stats = await this.quoteModel.aggregate([
        { $match: { generatedAt: dateFilter } },
        {
          $facet: {
            totalQuotes: [{ $count: 'count' }],
            responseTimes: [{ $project: { responseTime: 1 } }],
            origins: [
              { $group: { _id: '$request.sender.country', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 10 }
            ],
            destinations: [
              { $group: { _id: '$request.recipient.country', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 10 }
            ]
          }
        }
      ]);
      
      const result = stats[0];
      
      return {
        totalQuotes: result.totalQuotes[0]?.count || 0,
        averageResponseTime: this.calculateAverageResponseTime(result.responseTimes),
        conversionRate: 0, // 需要订单数据来计算转化率
        popularOrigins: result.origins.map((item: any) => ({
          country: item._id,
          count: item.count
        })),
        popularDestinations: result.destinations.map((item: any) => ({
          country: item._id,
          count: item.count
        }))
      };
    } catch (error) {
      this.logger.error(`Failed to get quote stats: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 构建日期过滤器
   */
  private buildDateFilter(timeRange: string): any {
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }
    
    return { $gte: startDate };
  }

  /**
   * 计算平均响应时间
   */
  private calculateAverageResponseTime(responseTimes: any[]): number {
    if (responseTimes.length === 0) return 0;
    
    const total = responseTimes.reduce((sum, item) => sum + (item.responseTime || 0), 0);
    return Math.round(total / responseTimes.length);
  }
}