import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 使用 Shyft API 解析交易
 * @param {string} signature - 交易签名
 */
export async function solParser(signature) {
  console.log(`开始解析交易签名: ${signature}`);
  
  try {
    // 记录实际请求的 URL (不包含 API 密钥)
    const baseUrl = `https://api.shyft.to/sol/v1/transaction/parsed?network=mainnet-beta&txn_signature=${signature}`;
    console.log(`请求 Shyft API: ${baseUrl}`);
    
    // 尝试通过 Header 方式传递 API 密钥
    const response = await axios({
      method: 'get',
      url: baseUrl,
      headers: {
        'x-api-key': process.env.SHYFT_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10秒超时
    });
    
    // 检查响应
    if (!response.data || response.data.success === false) {
      console.error(`Shyft API 返回错误: ${JSON.stringify(response.data)}`);
      return null;
    }
    
    console.log(`Shyft API 返回成功，处理数据...`);
    
    // 解析交易数据
    const txData = response.data.result;
    if (!txData || !txData.meta || !txData.transaction) {
      console.error(`Shyft 返回数据格式异常: ${JSON.stringify(response.data).substring(0, 500)}...`);
      return null;
    }
    
    // Check if successful and is a SWAP type transaction
    if (txData.success && txData.result) {
      const result = txData.result;   
      console.log(JSON.stringify(result, null, 2));
      // Find action containing tokens_swapped
      const swapAction = result.actions.find(action => 
        action.info && action.info.tokens_swapped
      );
      
      if (swapAction) {
        // Convert ISO timestamp to seconds timestamp
        const timestamp = Math.floor(new Date(result.timestamp).getTime() / 1000);
        
        return {
          account: swapAction.info.swapper,
          token_in_address: swapAction.info.tokens_swapped.in.token_address,
          token_in_amount: swapAction.info.tokens_swapped.in.amount,
          token_out_address: swapAction.info.tokens_swapped.out.token_address,
          token_out_amount: swapAction.info.tokens_swapped.out.amount,
          timestamp: timestamp,
          description: null
        };
      }
    }
    
    // 返回处理后的数据
    return txData;
  } catch (error) {
    console.error(`解析交易时发生错误: ${error.message}`);
    
    // 错误详情记录
    if (error.response) {
      // 服务器响应了，但状态码不是 2xx
      console.error(`错误状态码: ${error.response.status}`);
      console.error(`错误响应数据: ${JSON.stringify(error.response.data)}`);
      console.error(`错误响应头: ${JSON.stringify(error.response.headers)}`);
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      console.error(`没有收到响应: ${error.request}`);
    } else {
      // 其他错误
      console.error(`请求配置错误: ${error.config}`);
    }
    
    // 实现一个后备解析方法 - 使用 Helius RPC
    return await heliusBackupParser(signature);
  }
}

/**
 * 使用 Helius RPC 作为后备解析方法
 * @param {string} signature - 交易签名
 */
async function heliusBackupParser(signature) {
  console.log(`尝试使用 Helius 作为后备解析方法: ${signature}`);
  
  try {
    const response = await axios({
      method: 'post',
      url: process.env.HELIUS_RPC_URL || `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`,
      data: {
        jsonrpc: "2.0",
        id: "helius-backup",
        method: "getTransaction",
        params: [
          signature,
          { encoding: "json", maxSupportedTransactionVersion: 0 }
        ]
      },
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10秒超时
    });
    
    if (response.data.error) {
      console.error(`Helius RPC 错误: ${JSON.stringify(response.data.error)}`);
      return null;
    }
    
    const txData = response.data.result;
    if (!txData) {
      console.error(`Helius 无返回数据`);
      return null;
    }
    
    console.log(`Helius 返回成功，处理数据...`);
    
    // 处理 Helius 返回的数据 - 这里需要根据你的实际需求提取字段
    // ... 
    
    // 返回处理后的数据
    return {
      account: txData.transaction?.message?.accountKeys?.[0] || "unknown",
      signature: signature,
      timestamp: Math.floor(Date.now() / 1000),
      description: "通过 Helius RPC 解析的交易"
      // 其他必要字段
    };
  } catch (error) {
    console.error(`Helius 后备解析失败: ${error.message}`);
    return null;
  }
}