import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as xml2js from 'xml2js';
import axios from 'axios';
import { RedisService } from './redis.service';
import { 
  WeChatBotConfig, 
  WeChatMessage, 
  WeChatResponse, 
  WeChatMsgType,
  WeChatEvent,
  WeChatArticle
} from '../../../shared/types';

@Injectable()
export class WeChatBotService {
  private readonly logger = new Logger(WeChatBotService.name);
  private readonly ACCESS_TOKEN_CACHE_KEY = 'wechat:access_token';
  private readonly ACCESS_TOKEN_EXPIRE = 7200; // 2小时
  
  private config: WeChatBotConfig;
  
  constructor(private redisService: RedisService) {
    // 从环境变量或配置加载
    this.config = this.loadConfig();
  }
  
  /**
   * 加载企业微信配置
   */
  private loadConfig(): WeChatBotConfig {
    return {
      corpId: process.env.WECHAT_CORP_ID || '',
      agentId: process.env.WECHAT_AGENT_ID || '',
      secret: process.env.WECHAT_SECRET || '',
      token: process.env.WECHAT_TOKEN || '',
      encodingAESKey: process.env.WECHAT_ENCODING_AES_KEY || '',
      callbackUrl: process.env.WECHAT_CALLBACK_URL || ''
    };
  }
  
  /**
   * 验证企业微信回调签名
   */
  verifySignature(
    signature: string,
    timestamp: string,
    nonce: string,
    echostr: string
  ): string | null {
    try {
      const arr = [this.config.token, timestamp, nonce].sort();
      const str = arr.join('');
      const sha1 = crypto.createHash('sha1');
      sha1.update(str);
      const calculatedSignature = sha1.digest('hex');
      
      if (calculatedSignature === signature) {
        // 验证成功，返回解密后的echostr
        return this.decryptMessage(echostr);
      }
      
      return null;
    } catch (error) {
      this.logger.error(`Failed to verify signature: ${error.message}`, error.stack);
      return null;
    }
  }
  
  /**
   * 解密消息
   */
  private decryptMessage(encrypted: string): string {
    try {
      // Base64解码
      const decoded = Buffer.from(encrypted, 'base64');
      
      // 使用AES解密
      const key = Buffer.from(this.config.encodingAESKey + '=', 'base64');
      const iv = key.slice(0, 16);
      
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      decipher.setAutoPadding(false);
      
      let decrypted = decipher.update(decoded, 'binary', 'utf8');
      decrypted += decipher.final('utf8');
      
      // 去除补位字符
      const pad = decrypted.charCodeAt(decrypted.length - 1);
      if (pad < 1 || pad > 32) {
        pad = 0;
      }
      decrypted = decrypted.substring(0, decrypted.length - pad);
      
      // 移除前16个字节的随机字符串
      decrypted = decrypted.substring(16);
      
      // 获取消息长度
      const length = parseInt(decrypted.substring(0, 4), 10);
      
      // 提取消息内容
      const content = decrypted.substring(4, 4 + length);
      
      return content;
    } catch (error) {
      this.logger.error(`Failed to decrypt message: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * 加密消息
   */
  private encryptMessage(content: string): string {
    try {
      // 生成16位随机字符串
      const randomStr = crypto.randomBytes(16).toString('hex');
      
      // 构造消息体
      const msgLength = Buffer.byteLength(content).toString().padStart(4, '0');
      const text = randomStr + msgLength + content + this.config.corpId;
      
      // 使用AES加密
      const key = Buffer.from(this.config.encodingAESKey + '=', 'base64');
      const iv = key.slice(0, 16);
      
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      cipher.setAutoPadding(false);
      
      // 补位
      const blockSize = 32;
      const padLength = blockSize - (text.length % blockSize);
      const padChar = String.fromCharCode(padLength);
      const paddedText = text + padChar.repeat(padLength);
      
      let encrypted = cipher.update(paddedText, 'utf8', 'binary');
      encrypted += cipher.final('binary');
      
      // Base64编码
      return Buffer.from(encrypted, 'binary').toString('base64');
    } catch (error) {
      this.logger.error(`Failed to encrypt message: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * 解析XML消息
   */
  async parseXmlMessage(xml: string): Promise<WeChatMessage> {
    try {
      const parser = new xml2js.Parser({
        explicitArray: false,
        ignoreAttrs: true
      });
      
      const result = await parser.parseStringPromise(xml);
      const xmlData = result.xml;
      
      return {
        msgId: xmlData.MsgId,
        fromUserId: xmlData.FromUserName,
        fromUserName: xmlData.FromUserName,
        toUserId: xmlData.ToUserName,
        toUserName: xmlData.ToUserName,
        msgType: xmlData.MsgType as WeChatMsgType,
        content: xmlData.Content || xmlData.EventKey || '',
        createTime: parseInt(xmlData.CreateTime, 10) * 1000,
        event: xmlData.Event as WeChatEvent
      };
    } catch (error) {
      this.logger.error(`Failed to parse XML message: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * 生成XML响应
   */
  generateXmlResponse(response: WeChatResponse, fromUser: string, toUser: string): string {
    try {
      const builder = new xml2js.Builder({
        xmldec: { version: '1.0', encoding: 'UTF-8' },
        renderOpts: { pretty: false }
      });
      
      const now = Math.floor(Date.now() / 1000);
      let xmlObj: any;
      
      switch (response.msgType) {
        case WeChatMsgType.TEXT:
          xmlObj = {
            xml: {
              ToUserName: fromUser,
              FromUserName: toUser,
              CreateTime: now,
              MsgType: 'text',
              Content: response.content
            }
          };
          break;
          
        case WeChatMsgType.NEWS:
          xmlObj = {
            xml: {
              ToUserName: fromUser,
              FromUserName: toUser,
              CreateTime: now,
              MsgType: 'news',
              ArticleCount: response.articles?.length || 0,
              Articles: {
                item: response.articles?.map(article => ({
                  Title: article.title,
                  Description: article.description,
                  PicUrl: article.picUrl,
                  Url: article.url
                }))
              }
            }
          };
          break;
          
        default:
          xmlObj = {
            xml: {
              ToUserName: fromUser,
              FromUserName: toUser,
              CreateTime: now,
              MsgType: 'text',
              Content: '暂不支持的消息类型'
            }
          };
      }
      
      return builder.buildObject(xmlObj);
    } catch (error) {
      this.logger.error(`Failed to generate XML response: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * 获取访问令牌
   */
  async getAccessToken(): Promise<string> {
    try {
      // 尝试从缓存获取
      const cachedToken = await this.redisService.get<string>(this.ACCESS_TOKEN_CACHE_KEY);
      
      if (cachedToken) {
        this.logger.debug('Retrieved access token from cache');
        return cachedToken;
      }
      
      // 从企业微信API获取
      const url = `https://qyapi.weixin.qq.com/cgi-bin/gettoken`;
      const params = {
        corpid: this.config.corpId,
        corpsecret: this.config.secret
      };
      
      const response = await axios.get(url, { params });
      
      if (response.data.errcode !== 0) {
        throw new Error(`Failed to get access token: ${response.data.errmsg}`);
      }
      
      const accessToken = response.data.access_token;
      const expiresIn = response.data.expires_in || this.ACCESS_TOKEN_EXPIRE;
      
      // 缓存访问令牌
      await this.redisService.set(
        this.ACCESS_TOKEN_CACHE_KEY,
        accessToken,
        expiresIn - 300 // 提前5分钟过期
      );
      
      this.logger.debug('Retrieved new access token from API');
      return accessToken;
    } catch (error) {
      this.logger.error(`Failed to get access token: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * 发送消息到企业微信
   */
  async sendMessage(
    toUser: string,
    message: WeChatResponse
  ): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();
      const url = `https://qyapi.weixin.qq.com/cgi-bin/message/send`;
      
      let msgData: any;
      
      switch (message.msgType) {
        case WeChatMsgType.TEXT:
          msgData = {
            touser: toUser,
            msgtype: 'text',
            agentid: this.config.agentId,
            text: {
              content: message.content
            }
          };
          break;
          
        case WeChatMsgType.NEWS:
          msgData = {
            touser: toUser,
            msgtype: 'news',
            agentid: this.config.agentId,
            news: {
              articles: message.articles?.map(article => ({
                title: article.title,
                description: article.description,
                url: article.url,
                picurl: article.picUrl
              }))
            }
          };
          break;
          
        default:
          throw new Error(`Unsupported message type: ${message.msgType}`);
      }
      
      const response = await axios.post(`${url}?access_token=${accessToken}`, msgData);
      
      if (response.data.errcode !== 0) {
        this.logger.error(`Failed to send message: ${response.data.errmsg}`);
        return false;
      }
      
      this.logger.debug(`Message sent successfully to ${toUser}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send message: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * 处理消息（核心业务逻辑）
   */
  async processMessage(message: WeChatMessage): Promise<WeChatResponse> {
    try {
      this.logger.log(`Processing message from ${message.fromUserName}: ${message.content}`);
      
      // 根据消息类型处理
      if (message.msgType === WeChatMsgType.EVENT) {
        return this.handleEvent(message);
      } else if (message.msgType === WeChatMsgType.TEXT) {
        return this.handleTextMessage(message);
      } else {
        return {
          msgType: WeChatMsgType.TEXT,
          content: '暂不支持的消息类型，请发送文本消息'
        };
      }
    } catch (error) {
      this.logger.error(`Failed to process message: ${error.message}`, error.stack);
      return {
        msgType: WeChatMsgType.TEXT,
        content: '处理消息时发生错误，请稍后重试'
      };
    }
  }
  
  /**
   * 处理事件消息
   */
  private handleEvent(message: WeChatMessage): WeChatResponse {
    switch (message.event) {
      case WeChatEvent.SUBSCRIBE:
        return {
          msgType: WeChatMsgType.TEXT,
          content: '欢迎使用跨境物流助手！\n\n' +
                  '您可以发送以下指令：\n' +
                  '• 查询物流产品\n' + 
                  '• 获取报价\n' +
                  '• 查看订单状态\n' +
                  '• 联系客服\n\n' +
                  '输入"帮助"查看详细说明'
        };
        
      case WeChatEvent.CLICK:
        return this.handleMenuClick(message.content);
        
      default:
        return {
          msgType: WeChatMsgType.TEXT,
          content: '收到事件消息'
        };
    }
  }
  
  /**
   * 处理菜单点击
   */
  private handleMenuClick(eventKey: string): WeChatResponse {
    switch (eventKey) {
      case 'QUERY_PRODUCTS':
        return {
          msgType: WeChatMsgType.TEXT,
          content: '请发送"查询产品"获取物流产品列表，或直接告诉我：\n' +
                  '• 从[国家]到[国家]\n' +
                  '• [重量]kg的包裹\n' +
                  '• 需要[空运/海运/快递]'
        };
        
      case 'GET_QUOTE':
        return {
          msgType: WeChatMsgType.TEXT,
          content: '请发送以下信息获取报价：\n' +
                  '1. 起运国家/城市\n' +
                  '2. 目的国家/城市\n' + 
                  '3. 包裹信息（重量、尺寸）\n' +
                  '4. 特殊要求（如有）\n\n' +
                  '例如：从上海到纽约，10kg包裹，尺寸30x20x15cm'
        };
        
      case 'ORDER_STATUS':
        return {
          msgType: WeChatMsgType.TEXT,
          content: '请输入订单号查询状态，或发送"我的订单"查看所有订单'
        };
        
      case 'CONTACT_SUPPORT':
        return {
          msgType: WeChatMsgType.TEXT,
          content: '客服热线：400-xxx-xxxx\n' +
                  '客服邮箱：support@logistics.com\n' +
                  '工作时间：周一至周五 9:00-18:00'
        };
        
      default:
        return {
          msgType: WeChatMsgType.TEXT,
          content: '请选择其他功能'
        };
    }
  }
  
  /**
   * 处理文本消息
   */
  private async handleTextMessage(message: WeChatMessage): Promise<WeChatResponse> {
    const content = message.content.trim().toLowerCase();
    
    // 帮助命令
    if (content === '帮助' || content === 'help' || content === '?') {
      return this.getHelpResponse();
    }
    
    // 查询物流产品
    if (content.includes('查询') || content.includes('产品') || content.includes('物流')) {
      return this.handleProductQuery(content);
    }
    
    // 获取报价
    if (content.includes('报价') || content.includes('价格') || content.includes('费用')) {
      return this.handleQuoteRequest(content);
    }
    
    // 订单查询
    if (content.includes('订单') || content.includes('状态') || content.includes('跟踪')) {
      return this.handleOrderQuery(content);
    }
    
    // 联系客服
    if (content.includes('客服') || content.includes('联系') || content.includes('帮助')) {
      return {
        msgType: WeChatMsgType.TEXT,
        content: '客服信息：\n' +
                '• 电话：400-xxx-xxxx\n' +
                '• 邮箱：support@logistics.com\n' + 
                '• 工作时间：工作日 9:00-18:00\n\n' +
                '如需人工服务，请在工作时间联系我们'
      };
    }
    
    // 默认回复
    return {
      msgType: WeChatMsgType.TEXT,
      content: '抱歉，我没有理解您的意思。\n\n' +
              '您可以发送以下指令：\n' +
              '• 查询物流产品\n' +
              '• 获取报价\n' + 
              '• 查看订单状态\n' +
              '• 联系客服\n\n' +
              '输入"帮助"查看详细说明'
    };
  }
  
  /**
   * 获取帮助响应
   */
  private getHelpResponse(): WeChatResponse {
    return {
      msgType: WeChatMsgType.TEXT,
      content: '📦 跨境物流助手使用指南\n\n' +
              '🔍 查询物流产品：\n' +
              '• "查询产品"\n' +
              '• "从中国到美国有哪些物流方式"\n' +
              '• "海运产品有哪些"\n\n' +
              '💰 获取报价：\n' + 
              '• "获取报价"\n' +
              '• "从上海到纽约，10kg包裹报价"\n' +
              '• "空运到德国费用多少"\n\n' +
              '📊 订单管理：\n' +
              '• "订单状态"\n' +
              '• "查询订单 ABC123"\n' +
              '• "我的订单"\n\n' +
              '👥 客服支持：\n' +
              '• "联系客服"\n' +
              '• "人工服务"\n\n' +
              '💡 提示：您也可以使用下方菜单快速操作'
    };
  }
  
  /**
   * 处理产品查询
   */
  private async handleProductQuery(content: string): Promise<WeChatResponse> {
    // 这里可以集成实际的物流产品查询服务
    // 暂时返回示例数据
    
    const articles: WeChatArticle[] = [
      {
        title: '国际快递服务',
        description: 'DHL/FedEx/UPS，3-5工作日送达全球主要城市',
        url: 'https://your-logistics-site.com/products/express',
        picUrl: 'https://your-logistics-site.com/images/express.jpg'
      },
      {
        title: '国际空运服务',
        description: '5-7工作日送达，适合中小批量货物',
        url: 'https://your-logistics-site.com/products/air-freight',
        picUrl: 'https://your-logistics-site.com/images/air-freight.jpg'
      },
      {
        title: '国际海运服务',
        description: '20-40天送达，适合大批量、低成本运输',
        url: 'https://your-logistics-site.com/products/sea-freight',
        picUrl: 'https://your-logistics-site.com/images/sea-freight.jpg'
      }
    ];
    
    return {
      msgType: WeChatMsgType.NEWS,
      content: '为您推荐以下物流产品：',
      articles
    };
  }
  
  /**
   * 处理报价请求
   */
  private async handleQuoteRequest(content: string): Promise<WeChatResponse> {
    // 这里可以集成实际的报价服务
    // 解析用户输入的报价信息
    
    return {
      msgType: WeChatMsgType.TEXT,
      content: '📋 报价请求已收到\n\n' +
              '为了给您准确的报价，请提供以下信息：\n' +
              '1. 起运国家/城市：\n' +
              '2. 目的国家/城市：\n' +
              '3. 货物信息（重量、尺寸、数量）：\n' +
              '4. 货物类型：\n' +
              '5. 期望时效：\n\n' +
              '您也可以直接访问我们的报价页面：\n' +
              'https://your-logistics-site.com/quote'
    };
  }
  
  /**
   * 处理订单查询
   */
  private async handleOrderQuery(content: string): Promise<WeChatResponse> {
    // 这里可以集成实际的订单查询服务
    
    // 尝试提取订单号
    const orderNumberMatch = content.match(/([A-Z]{3}\d{6})|(\d{10})/);
    
    if (orderNumberMatch) {
      const orderNumber = orderNumberMatch[0];
      
      return {
        msgType: WeChatMsgType.TEXT,
        content: `📦 订单 ${orderNumber} 状态\n\n` +
                '状态：运输中\n' +
                '起运地：上海\n' +
                '目的地：纽约\n' +
                '预计送达：2024-12-20\n' +
                '最新轨迹：已从上海浦东机场起飞\n\n' +
                '详细轨迹：https://your-logistics-site.com/tracking/' + orderNumber
      };
    }
    
    return {
      msgType: WeChatMsgType.TEXT,
      content: '请输入订单号查询状态，例如："查询订单 ABC123456"\n\n' +
              '如需查看所有订单，请登录网站：\n' +
              'https://your-logistics-site.com/orders'
    };
  }
  
  /**
   * 获取用户信息
   */
  async getUserInfo(userId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      const url = `https://qyapi.weixin.qq.com/cgi-bin/user/get`;
      
      const response = await axios.get(url, {
        params: {
          access_token: accessToken,
          userid: userId
        }
      });
      
      if (response.data.errcode !== 0) {
        this.logger.error(`Failed to get user info: ${response.data.errmsg}`);
        return null;
      }
      
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get user info: ${error.message}`, error.stack);
      return null;
    }
  }
  
  /**
   * 获取部门用户列表
   */
  async getDepartmentUsers(departmentId: number = 1): Promise<any[]> {
    try {
      const accessToken = await this.getAccessToken();
      const url = `https://qyapi.weixin.qq.com/cgi-bin/user/simplelist`;
      
      const response = await axios.get(url, {
        params: {
          access_token: accessToken,
          department_id: departmentId,
          fetch_child: 1
        }
      });
      
      if (response.data.errcode !== 0) {
        this.logger.error(`Failed to get department users: ${response.data.errmsg}`);
        return [];
      }
      
      return response.data.userlist || [];
    } catch (error) {
      this.logger.error(`Failed to get department users: ${error.message}`, error.stack);
      return [];
    }
  }
  
  /**
   * 创建自定义菜单
   */
  async createMenu(menuData: any): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();
      const url = `https://qyapi.weixin.qq.com/cgi-bin/menu/create`;
      
      const response = await axios.post(
        `${url}?access_token=${accessToken}&agentid=${this.config.agentId}`,
        menuData
      );
      
      if (response.data.errcode !== 0) {
        this.logger.error(`Failed to create menu: ${response.data.errmsg}`);
        return false;
      }
      
      this.logger.debug('Menu created successfully');
      return true;
    } catch (error) {
      this.logger.error(`Failed to create menu: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * 创建默认菜单
   */
  async createDefaultMenu(): Promise<boolean> {
    const menuData = {
      button: [
        {
          name: '物流查询',
          sub_button: [
            {
              type: 'click',
              name: '查询产品',
              key: 'QUERY_PRODUCTS'
            },
            {
              type: 'view',
              name: '在线报价',
              url: 'https://your-logistics-site.com/quote'
            },
            {
              type: 'view',
              name: '轨迹查询',
              url: 'https://your-logistics-site.com/tracking'
            }
          ]
        },
        {
          name: '订单管理',
          sub_button: [
            {
              type: 'click',
              name: '订单状态',
              key: 'ORDER_STATUS'
            },
            {
              type: 'view',
              name: '我的订单',
              url: 'https://your-logistics-site.com/orders'
            },
            {
              type: 'view',
              name: '创建订单',
              url: 'https://your-logistics-site.com/create-order'
            }
          ]
        },
        {
          name: '客服支持',
          sub_button: [
            {
              type: 'click',
              name: '联系客服',
              key: 'CONTACT_SUPPORT'
            },
            {
              type: 'view',
              name: '帮助中心',
              url: 'https://your-logistics-site.com/help'
            },
            {
              type: 'view',
              name: '关于我们',
              url: 'https://your-logistics-site.com/about'
            }
          ]
        }
      ]
    };
    
    return this.createMenu(menuData);
  }
}