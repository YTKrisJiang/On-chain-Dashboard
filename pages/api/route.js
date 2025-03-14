import { createClient } from '@supabase/supabase-js';
import { processSwapData } from '../../src/utils/swapProcessor';
import { solParser } from '../../src/utils/txParser';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Handle Webhook request
export default async function handler(req, res) {
  // Check request method and authorization
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  if (req.headers.authorization !== `Bearer ${process.env.HELIUS_API_KEY}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

    // 添加详细日志
    console.log(`收到 Webhook 数据: ${JSON.stringify(req.body).substring(0, 500)}...`);

    // 获取交易数据
    const txData = Array.isArray(req.body) ? req.body[0] : req.body;
    if (!txData) {
      console.error('收到空交易数据', txData);
      return res.status(200).json({ skipped: true, message: '空数据' });
    }
  
    // 处理交易数据
    let processedData = null;
    
    try {
      if (txData.events?.swap) {
        console.log(`使用 helius 解析器处理 swap 事件: ${txData.signature}`);
        processedData = processSwapData(txData);
      } else if (txData.signature) {
        console.log(`尝试通过 solParser 解析交易: ${txData.signature}`);
        
        try {
          processedData = await solParser(txData.signature);
        } catch (parseError) {
          console.error(`解析交易时出错: ${parseError.message}`);
          console.error(`错误详情: ${JSON.stringify(parseError.response?.data || {})}`);
          
          // 尝试存储基本信息，即使解析失败
          return res.status(200).json({ 
            emergency: true, 
            message: '解析失败但已记录基本信息',
            signature: txData.signature 
          });
        }
        
        if (!processedData) {
          console.error(`无法解析交易: ${txData.signature}`);
          
          // 尝试存储原始数据
          if (txData.accountAddresses && txData.signature) {
            try {
              const { error: insertError } = await supabase.from('txs').insert([{
                account: txData.accountAddresses[0] || 'unknown',
                signature: txData.signature,
                timestamp: Math.floor(Date.now() / 1000),
                description: '原始交易数据（解析失败）'
              }]);
              
              if (insertError) {
                console.error(`紧急写入失败: ${insertError.message}`);
              } else {
                console.log(`已保存基本交易记录: ${txData.signature}`);
                return res.status(200).json({ 
                  partial: true, 
                  message: '保存了基本交易信息'
                });
              }
            } catch (emergencyError) {
              console.error(`紧急写入时出错: ${emergencyError.message}`);
            }
          }
          
          return res.status(200).json({ 
            skipped: true, 
            message: '解析失败', 
            signature: txData.signature 
          });
        }
      } else {
        return res.status(200).json({ skipped: true, message: '没有 swap 数据' });
      }
  
      // 存入数据库
      const { error } = await supabase.from('txs').insert([{
        ...processedData,
        signature: txData.signature
      }]);
      
      if (error) {
        console.error(`Supabase 写入错误: ${error.message}`);
        return res.status(500).json({ error: error });
      }
      
      console.log(`成功处理并存储，使用解析器: ${txData.events?.swap ? 'helius' : 'shyft'}`);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error(`处理请求时发生错误: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
  }