import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function testSupabaseConnection() {
  console.log('测试 Supabase 连接...');
  
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );
    
    // 简单获取一条记录来测试连接
    const { data, error } = await supabase
      .from('txs')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error(`Supabase 错误: ${error.message}`);
      return false;
    }
    
    if (data && data.length > 0) {
      console.log(`Supabase 连接成功! 读取到一条记录`);
    } else {
      console.log(`Supabase 连接成功! 但表可能是空的`);
    }
    
    // 尝试显示表的结构
    const { data: tables, error: tablesError } = await supabase
      .from('_tables')
      .select('*')
      .limit(5);
      
    if (!tablesError && tables) {
      console.log(`数据库表信息: ${JSON.stringify(tables)}`);
    }
    
    return true;
  } catch (err) {
    console.error(`意外错误: ${err.message}`);
    return false;
  }
}

// 执行测试并显示结果
testSupabaseConnection()
  .then(success => {
    console.log(`测试结果: ${success ? '成功' : '失败'}`);
    process.exit(success ? 0 : 1);
  });