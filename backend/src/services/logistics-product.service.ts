import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RedisService } from './redis.service';
import { 
  LogisticsProduct, 
  LogisticsProductFilter, 
  LogisticsType, 
  PackageType,
  PaginatedResponse 
} from '../../../shared/types';
import { CreateProductDto, UpdateProductDto } from '../dtos/logistics-product.dto';

@Injectable()
export class LogisticsProductService {
  private readonly logger = new Logger(LogisticsProductService.name);
  private readonly CACHE_TTL = 3600; // 1小时缓存
  
  constructor(
    @InjectModel('LogisticsProduct') private productModel: Model<LogisticsProduct>,
    private redisService: RedisService
  ) {}

  /**
   * 创建物流产品
   */
  async createProduct(createDto: CreateProductDto): Promise<LogisticsProduct> {
    try {
      this.logger.log(`Creating new logistics product: ${createDto.name}`);
      
      // 检查产品代码是否已存在
      const existingProduct = await this.productModel.findOne({ 
        code: createDto.code 
      });
      
      if (existingProduct) {
        throw new Error(`Product with code ${createDto.code} already exists`);
      }
      
      // 创建产品
      const product = new this.productModel({
        ...createDto,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      });
      
      const savedProduct = await product.save();
      
      // 清除相关缓存
      await this.clearProductCache();
      
      this.logger.log(`Product created successfully: ${savedProduct.id}`);
      return savedProduct.toObject();
    } catch (error) {
      this.logger.error(`Failed to create product: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取产品详情
   */
  async getProductById(id: string): Promise<LogisticsProduct | null> {
    try {
      // 尝试从缓存获取
      const cacheKey = `product:${id}`;
      const cachedProduct = await this.redisService.get<LogisticsProduct>(cacheKey);
      
      if (cachedProduct) {
        this.logger.debug(`Retrieved product ${id} from cache`);
        return cachedProduct;
      }
      
      // 从数据库获取
      const product = await this.productModel.findById(id).lean();
      
      if (product) {
        // 缓存产品
        await this.redisService.set(cacheKey, product, this.CACHE_TTL);
        this.logger.debug(`Cached product ${id}`);
      }
      
      return product;
    } catch (error) {
      this.logger.error(`Failed to get product ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取产品列表（支持分页和过滤）
   */
  async getProducts(
    filter: LogisticsProductFilter = {},
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResponse<LogisticsProduct>> {
    try {
      const skip = (page - 1) * pageSize;
      
      // 构建查询条件
      const query: any = {};
      
      if (filter.originCountry) {
        query.originCountries = { $in: [filter.originCountry] };
      }
      
      if (filter.destinationCountry) {
        query.destinationCountries = { $in: [filter.destinationCountry] };
      }
      
      if (filter.logisticsType && filter.logisticsType.length > 0) {
        query.type = { $in: filter.logisticsType };
      }
      
      if (filter.packageType && filter.packageType.length > 0) {
        query.supportedPackageTypes = { $in: filter.packageType };
      }
      
      if (filter.carrier && filter.carrier.length > 0) {
        query.carrier = { $in: filter.carrier };
      }
      
      if (filter.minTransitDays !== undefined) {
        query.maxTransitDays = { $gte: filter.minTransitDays };
      }
      
      if (filter.maxTransitDays !== undefined) {
        query.minTransitDays = { $lte: filter.maxTransitDays };
      }
      
      if (filter.status) {
        query.status = filter.status;
      } else {
        query.status = 'active'; // 默认只返回活跃产品
      }
      
      if (filter.searchText) {
        query.$or = [
          { name: { $regex: filter.searchText, $options: 'i' } },
          { code: { $regex: filter.searchText, $options: 'i' } },
          { description: { $regex: filter.searchText, $options: 'i' } },
          { carrier: { $regex: filter.searchText, $options: 'i' } }
        ];
      }
      
      // 执行查询
      const [products, total] = await Promise.all([
        this.productModel
          .find(query)
          .sort({ priority: 1, name: 1 })
          .skip(skip)
          .limit(pageSize)
          .lean(),
        this.productModel.countDocuments(query)
      ]);
      
      const totalPages = Math.ceil(total / pageSize);
      
      return {
        items: products,
        total,
        page,
        pageSize,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };
    } catch (error) {
      this.logger.error(`Failed to get products: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 更新产品信息
   */
  async updateProduct(id: string, updateDto: UpdateProductDto): Promise<LogisticsProduct | null> {
    try {
      this.logger.log(`Updating product ${id}`);
      
      const product = await this.productModel.findById(id);
      
      if (!product) {
        return null;
      }
      
      // 更新产品信息
      Object.assign(product, updateDto);
      product.updatedAt = new Date();
      product.version += 1;
      
      const updatedProduct = await product.save();
      
      // 清除相关缓存
      await this.clearProductCache(id);
      
      this.logger.log(`Product ${id} updated successfully`);
      return updatedProduct.toObject();
    } catch (error) {
      this.logger.error(`Failed to update product ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 删除产品（软删除）
   */
  async deleteProduct(id: string): Promise<boolean> {
    try {
      this.logger.log(`Deleting product ${id}`);
      
      const result = await this.productModel.findByIdAndUpdate(
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
        await this.clearProductCache(id);
        this.logger.log(`Product ${id} deleted successfully`);
        return true;
      }
      
      return false;
    } catch (error) {
      this.logger.error(`Failed to delete product ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 搜索物流产品
   */
  async searchProducts(
    originCountry: string,
    destinationCountry: string,
    weight: number,
    dimensions?: { length: number; width: number; height: number }
  ): Promise<LogisticsProduct[]> {
    try {
      this.logger.log(`Searching products from ${originCountry} to ${destinationCountry}`);
      
      const query: any = {
        originCountries: { $in: [originCountry] },
        destinationCountries: { $in: [destinationCountry] },
        status: 'active',
        minWeight: { $lte: weight },
        maxWeight: { $gte: weight }
      };
      
      // 添加尺寸限制
      if (dimensions) {
        query.minLength = { $lte: dimensions.length };
        query.maxLength = { $gte: dimensions.length };
        query.minWidth = { $lte: dimensions.width };
        query.maxWidth = { $gte: dimensions.width };
        query.minHeight = { $lte: dimensions.height };
        query.maxHeight = { $gte: dimensions.height };
      }
      
      // 按优先级和时效排序
      const products = await this.productModel
        .find(query)
        .sort({ 
          priority: 1,
          estimatedTransitDays: 1,
          carrier: 1 
        })
        .lean();
      
      return products;
    } catch (error) {
      this.logger.error(`Failed to search products: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取热门物流路线
   */
  async getPopularRoutes(limit = 10): Promise<Array<{
    origin: string;
    destination: string;
    productCount: number;
    averageTransitDays: number;
  }>> {
    try {
      const cacheKey = 'popular-routes';
      const cachedRoutes = await this.redisService.get<any>(cacheKey);
      
      if (cachedRoutes) {
        return cachedRoutes;
      }
      
      // 聚合查询热门路线
      const routes = await this.productModel.aggregate([
        { $match: { status: 'active' } },
        { $unwind: '$originCountries' },
        { $unwind: '$destinationCountries' },
        {
          $group: {
            _id: {
              origin: '$originCountries',
              destination: '$destinationCountries'
            },
            productCount: { $sum: 1 },
            averageTransitDays: { $avg: '$estimatedTransitDays' }
          }
        },
        { $sort: { productCount: -1 } },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            origin: '$_id.origin',
            destination: '$_id.destination',
            productCount: 1,
            averageTransitDays: { $round: ['$averageTransitDays', 1] }
          }
        }
      ]);
      
      // 缓存结果
      await this.redisService.set(cacheKey, routes, this.CACHE_TTL);
      
      return routes;
    } catch (error) {
      this.logger.error(`Failed to get popular routes: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取物流类型统计
   */
  async getLogisticsTypeStats(): Promise<Array<{
    type: LogisticsType;
    count: number;
    percentage: number;
  }>> {
    try {
      const cacheKey = 'logistics-type-stats';
      const cachedStats = await this.redisService.get<any>(cacheKey);
      
      if (cachedStats) {
        return cachedStats;
      }
      
      // 聚合查询物流类型统计
      const stats = await this.productModel.aggregate([
        { $match: { status: 'active' } },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            type: '$_id',
            count: 1
          }
        },
        { $sort: { count: -1 } }
      ]);
      
      // 计算百分比
      const total = stats.reduce((sum, item) => sum + item.count, 0);
      const statsWithPercentage = stats.map(item => ({
        ...item,
        percentage: total > 0 ? Math.round((item.count / total) * 100) : 0
      }));
      
      // 缓存结果
      await this.redisService.set(cacheKey, statsWithPercentage, this.CACHE_TTL);
      
      return statsWithPercentage;
    } catch (error) {
      this.logger.error(`Failed to get logistics type stats: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 批量导入物流产品
   */
  async importProducts(products: CreateProductDto[]): Promise<{
    success: number;
    failed: number;
    errors: Array<{ index: number; error: string }>;
  }> {
    try {
      this.logger.log(`Importing ${products.length} products`);
      
      const results = {
        success: 0,
        failed: 0,
        errors: []
      };
      
      for (let i = 0; i < products.length; i++) {
        try {
          await this.createProduct(products[i]);
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            index: i,
            error: error.message
          });
          this.logger.warn(`Failed to import product at index ${i}: ${error.message}`);
        }
      }
      
      // 清除所有产品缓存
      await this.clearProductCache();
      
      this.logger.log(`Import completed: ${results.success} successful, ${results.failed} failed`);
      return results;
    } catch (error) {
      this.logger.error(`Failed to import products: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 清除产品缓存
   */
  private async clearProductCache(productId?: string): Promise<void> {
    try {
      const cacheKeys = [
        'product:*',
        'popular-routes',
        'logistics-type-stats'
      ];
      
      if (productId) {
        cacheKeys.push(`product:${productId}`);
      }
      
      // 批量清除缓存
      for (const pattern of cacheKeys) {
        await this.redisService.delPattern(pattern);
      }
      
      this.logger.debug('Product cache cleared');
    } catch (error) {
      this.logger.warn(`Failed to clear product cache: ${error.message}`);
    }
  }
}