import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RedisService } from './redis.service';
import { 
  SalesMethod, 
  SalesMethodType, 
  TargetAudience,
  PricingModel,
  Requirement,
  Benefit,
  PaginatedResponse
} from '../../../shared/types';
import { CreateSalesMethodDto, UpdateSalesMethodDto } from '../dtos/sales-method.dto';

@Injectable()
export class SalesMethodService {
  private readonly logger = new Logger(SalesMethodService.name);
  private readonly CACHE_TTL = 7200; // 2小时缓存
  
  constructor(
    @InjectModel('SalesMethod') private salesMethodModel: Model<SalesMethod>,
    private redisService: RedisService
  ) {}

  /**
   * 创建销售方法
   */
  async createSalesMethod(createDto: CreateSalesMethodDto): Promise<SalesMethod> {
    try {
      this.logger.log(`Creating new sales method: ${createDto.name}`);
      
      // 检查销售方法代码是否已存在
      const existingMethod = await this.salesMethodModel.findOne({ 
        code: createDto.code 
      });
      
      if (existingMethod) {
        throw new Error(`Sales method with code ${createDto.code} already exists`);
      }
      
      // 验证定价模型
      this.validatePricingModel(createDto.pricingModel);
      
      // 创建销售方法
      const salesMethod = new this.salesMethodModel({
        ...createDto,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      });
      
      const savedMethod = await salesMethod.save();
      
      // 清除相关缓存
      await this.clearSalesMethodCache();
      
      this.logger.log(`Sales method created successfully: ${savedMethod.id}`);
      return savedMethod.toObject();
    } catch (error) {
      this.logger.error(`Failed to create sales method: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取销售方法详情
   */
  async getSalesMethodById(id: string): Promise<SalesMethod | null> {
    try {
      // 尝试从缓存获取
      const cacheKey = `sales-method:${id}`;
      const cachedMethod = await this.redisService.get<SalesMethod>(cacheKey);
      
      if (cachedMethod) {
        this.logger.debug(`Retrieved sales method ${id} from cache`);
        return cachedMethod;
      }
      
      // 从数据库获取
      const method = await this.salesMethodModel.findById(id).lean();
      
      if (method) {
        // 缓存销售方法
        await this.redisService.set(cacheKey, method, this.CACHE_TTL);
        this.logger.debug(`Cached sales method ${id}`);
      }
      
      return method;
    } catch (error) {
      this.logger.error(`Failed to get sales method ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 根据代码获取销售方法
   */
  async getSalesMethodByCode(code: string): Promise<SalesMethod | null> {
    try {
      const cacheKey = `sales-method:code:${code}`;
      const cachedMethod = await this.redisService.get<SalesMethod>(cacheKey);
      
      if (cachedMethod) {
        return cachedMethod;
      }
      
      const method = await this.salesMethodModel.findOne({ code }).lean();
      
      if (method) {
        await this.redisService.set(cacheKey, method, this.CACHE_TTL);
      }
      
      return method;
    } catch (error) {
      this.logger.error(`Failed to get sales method by code ${code}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取销售方法列表
   */
  async getSalesMethods(
    filter: {
      type?: SalesMethodType;
      status?: string;
      region?: string;
      searchText?: string;
    } = {},
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResponse<SalesMethod>> {
    try {
      const skip = (page - 1) * pageSize;
      
      // 构建查询条件
      const query: any = {};
      
      if (filter.type) {
        query.type = filter.type;
      }
      
      if (filter.status) {
        query.status = filter.status;
      } else {
        query.status = 'active'; // 默认只返回活跃的销售方法
      }
      
      if (filter.region) {
        query.targetAudience = {
          $elemMatch: { region: filter.region }
        };
      }
      
      if (filter.searchText) {
        query.$or = [
          { name: { $regex: filter.searchText, $options: 'i' } },
          { code: { $regex: filter.searchText, $options: 'i' } },
          { description: { $regex: filter.searchText, $options: 'i' } }
        ];
      }
      
      // 执行查询
      const [methods, total] = await Promise.all([
        this.salesMethodModel
          .find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(pageSize)
          .lean(),
        this.salesMethodModel.countDocuments(query)
      ]);
      
      const totalPages = Math.ceil(total / pageSize);
      
      return {
        items: methods,
        total,
        page,
        pageSize,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };
    } catch (error) {
      this.logger.error(`Failed to get sales methods: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 更新销售方法
   */
  async updateSalesMethod(id: string, updateDto: UpdateSalesMethodDto): Promise<SalesMethod | null> {
    try {
      this.logger.log(`Updating sales method ${id}`);
      
      const method = await this.salesMethodModel.findById(id);
      
      if (!method) {
        return null;
      }
      
      // 验证定价模型（如果提供）
      if (updateDto.pricingModel) {
        this.validatePricingModel(updateDto.pricingModel);
      }
      
      // 更新销售方法信息
      Object.assign(method, updateDto);
      method.updatedAt = new Date();
      method.version += 1;
      
      const updatedMethod = await method.save();
      
      // 清除相关缓存
      await this.clearSalesMethodCache(id);
      
      this.logger.log(`Sales method ${id} updated successfully`);
      return updatedMethod.toObject();
    } catch (error) {
      this.logger.error(`Failed to update sales method ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 删除销售方法
   */
  async deleteSalesMethod(id: string): Promise<boolean> {
    try {
      this.logger.log(`Deleting sales method ${id}`);
      
      const result = await this.salesMethodModel.findByIdAndUpdate(
        id,
        { 
          status: 'inactive',
          deletedAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      );
      
      if (result) {
        // 清除相关缓存
        await this.clearSalesMethodCache(id);
        this.logger.log(`Sales method ${id} deleted successfully`);
        return true;
      }
      
      return false;
    } catch (error) {
      this.logger.error(`Failed to delete sales method ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取适用于特定客户的销售方法
   */
  async getApplicableSalesMethods(
    customerInfo: {
      region: string;
      industry?: string;
      companySize?: string;
      customerType?: string;
    }
  ): Promise<SalesMethod[]> {
    try {
      this.logger.log(`Finding applicable sales methods for customer in ${customerInfo.region}`);
      
      const query: any = {
        status: 'active',
        targetAudience: {
          $elemMatch: { region: customerInfo.region }
        }
      };
      
      // 添加其他筛选条件
      if (customerInfo.industry) {
        query['targetAudience.$[].industry'] = customerInfo.industry;
      }
      
      if (customerInfo.companySize) {
        query['targetAudience.$[].companySize'] = customerInfo.companySize;
      }
      
      if (customerInfo.customerType) {
        query['targetAudience.$[].customerType'] = customerInfo.customerType;
      }
      
      const methods = await this.salesMethodModel
        .find(query)
        .sort({ commissionRate: 1, createdAt: -1 })
        .lean();
      
      return methods;
    } catch (error) {
      this.logger.error(`Failed to get applicable sales methods: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 计算销售佣金
   */
  async calculateCommission(
    salesMethodId: string,
    saleAmount: number,
    volume: number = 1
  ): Promise<{
    commissionAmount: number;
    commissionRate: number;
    tier?: string;
  }> {
    try {
      const method = await this.getSalesMethodById(salesMethodId);
      
      if (!method) {
        throw new Error(`Sales method ${salesMethodId} not found`);
      }
      
      if (method.status !== 'active') {
        throw new Error(`Sales method ${salesMethodId} is not active`);
      }
      
      // 获取适用的佣金率
      const commissionRate = this.getApplicableCommissionRate(method.pricingModel, volume);
      
      // 计算佣金金额
      const commissionAmount = saleAmount * (commissionRate / 100);
      
      return {
        commissionAmount,
        commissionRate,
        tier: this.getTierName(method.pricingModel, volume)
      };
    } catch (error) {
      this.logger.error(`Failed to calculate commission: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取适用的佣金率
   */
  private getApplicableCommissionRate(pricingModel: PricingModel, volume: number): number {
    const { type, details } = pricingModel;
    
    switch (type) {
      case 'fixed':
        return details[0]?.price || 0;
        
      case 'tiered':
      case 'volume':
        // 找到适用的价格层级
        const applicableTier = details
          .sort((a, b) => a.minVolume - b.minVolume)
          .find(tier => volume >= tier.minVolume && (!tier.maxVolume || volume <= tier.maxVolume));
        
        return applicableTier?.price || details[details.length - 1]?.price || 0;
        
      case 'negotiated':
        // 对于协商定价，返回基准价格
        return details[0]?.price || 0;
        
      default:
        return 0;
    }
  }

  /**
   * 获取层级名称
   */
  private getTierName(pricingModel: PricingModel, volume: number): string {
    const { type, details } = pricingModel;
    
    if (type === 'tiered' || type === 'volume') {
      const applicableTier = details
        .sort((a, b) => a.minVolume - b.minVolume)
        .find(tier => volume >= tier.minVolume && (!tier.maxVolume || volume <= tier.maxVolume));
      
      if (applicableTier) {
        if (applicableTier.maxVolume) {
          return `Tier ${applicableTier.minVolume}-${applicableTier.maxVolume}`;
        } else {
          return `Tier ${applicableTier.minVolume}+`;
        }
      }
    }
    
    return 'Standard';
  }

  /**
   * 验证定价模型
   */
  private validatePricingModel(pricingModel: PricingModel): void {
    const { type, details } = pricingModel;
    
    if (!type || !details || details.length === 0) {
      throw new Error('Pricing model must have type and details');
    }
    
    if (type === 'fixed' && details.length !== 1) {
      throw new Error('Fixed pricing model should have exactly one price detail');
    }
    
    if ((type === 'tiered' || type === 'volume') && details.length < 1) {
      throw new Error('Tiered/volume pricing model should have at least one price detail');
    }
    
    // 验证层级不重叠且有序
    if (type === 'tiered' || type === 'volume') {
      const sortedDetails = [...details].sort((a, b) => a.minVolume - b.minVolume);
      
      for (let i = 0; i < sortedDetails.length; i++) {
        const current = sortedDetails[i];
        
        if (current.minVolume < 0) {
          throw new Error(`Tier ${i + 1}: minVolume must be non-negative`);
        }
        
        if (current.maxVolume !== undefined && current.maxVolume < current.minVolume) {
          throw new Error(`Tier ${i + 1}: maxVolume must be greater than or equal to minVolume`);
        }
        
        if (i > 0) {
          const previous = sortedDetails[i - 1];
          if (current.minVolume <= (previous.maxVolume || previous.minVolume)) {
            throw new Error(`Tier ${i + 1}: minVolume must be greater than previous tier's maxVolume`);
          }
        }
      }
    }
  }

  /**
   * 获取销售方法统计
   */
  async getSalesMethodStats(): Promise<{
    totalMethods: number;
    byType: Array<{ type: SalesMethodType; count: number }>;
    byStatus: Array<{ status: string; count: number }>;
    averageCommissionRate: number;
    topRegions: Array<{ region: string; count: number }>;
  }> {
    try {
      const cacheKey = 'sales-method-stats';
      const cachedStats = await this.redisService.get<any>(cacheKey);
      
      if (cachedStats) {
        return cachedStats;
      }
      
      const stats = await this.salesMethodModel.aggregate([
        {
          $facet: {
            totalMethods: [{ $count: 'count' }],
            byType: [
              { $group: { _id: '$type', count: { $sum: 1 } } },
              { $project: { type: '$_id', count: 1, _id: 0 } }
            ],
            byStatus: [
              { $group: { _id: '$status', count: { $sum: 1 } } },
              { $project: { status: '$_id', count: 1, _id: 0 } }
            ],
            averageCommissionRate: [
              { $group: { _id: null, avg: { $avg: '$commissionRate' } } }
            ],
            topRegions: [
              { $unwind: '$targetAudience' },
              { $group: { _id: '$targetAudience.region', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 10 },
              { $project: { region: '$_id', count: 1, _id: 0 } }
            ]
          }
        }
      ]);
      
      const result = stats[0];
      
      const formattedStats = {
        totalMethods: result.totalMethods[0]?.count || 0,
        byType: result.byType,
        byStatus: result.byStatus,
        averageCommissionRate: result.averageCommissionRate[0]?.avg || 0,
        topRegions: result.topRegions
      };
      
      // 缓存结果
      await this.redisService.set(cacheKey, formattedStats, this.CACHE_TTL);
      
      return formattedStats;
    } catch (error) {
      this.logger.error(`Failed to get sales method stats: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 批量导入销售方法
   */
  async importSalesMethods(methods: CreateSalesMethodDto[]): Promise<{
    success: number;
    failed: number;
    errors: Array<{ index: number; error: string }>;
  }> {
    try {
      this.logger.log(`Importing ${methods.length} sales methods`);
      
      const results = {
        success: 0,
        failed: 0,
        errors: []
      };
      
      for (let i = 0; i < methods.length; i++) {
        try {
          await this.createSalesMethod(methods[i]);
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            index: i,
            error: error.message
          });
          this.logger.warn(`Failed to import sales method at index ${i}: ${error.message}`);
        }
      }
      
      // 清除所有销售方法缓存
      await this.clearSalesMethodCache();
      
      this.logger.log(`Import completed: ${results.success} successful, ${results.failed} failed`);
      return results;
    } catch (error) {
      this.logger.error(`Failed to import sales methods: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 清除销售方法缓存
   */
  private async clearSalesMethodCache(methodId?: string): Promise<void> {
    try {
      const cacheKeys = [
        'sales-method:*',
        'sales-method-stats'
      ];
      
      if (methodId) {
        cacheKeys.push(`sales-method:${methodId}`);
      }
      
      // 批量清除缓存
      for (const pattern of cacheKeys) {
        await this.redisService.delPattern(pattern);
      }
      
      this.logger.debug('Sales method cache cleared');
    } catch (error) {
      this.logger.warn(`Failed to clear sales method cache: ${error.message}`);
    }
  }
}