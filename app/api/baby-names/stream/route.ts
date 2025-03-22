import { NextRequest } from 'next/server';
import { getPopularBabyNamesFromYearRange } from '@/lib/data-fetching/ssa-data';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const gender = searchParams.get('gender') as 'Male' | 'Female';
  const limit = parseInt(searchParams.get('limit') || '100', 10);
  const startYear = parseInt(searchParams.get('startYear') || '2013', 10);
  const endYear = parseInt(searchParams.get('endYear') || '2023', 10);

  // Validate parameters
  if (!gender || (gender !== 'Male' && gender !== 'Female')) {
    return new Response(JSON.stringify({ error: 'Invalid gender parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  console.log(`[${new Date().toISOString()}] Starting name stream for ${gender} names, limit: ${limit}`);
  console.log(`Streaming baby names from ${startYear} to ${endYear}, limit: ${limit}, gender: ${gender}`);

  // Create a readable stream
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 使用从最近年份开始的函数
        const names = await getPopularBabyNamesFromYearRange(startYear, endYear, limit, gender);

        // 分批发送名字
        const batchSize = 20;
        for (let i = 0; i < names.length; i += batchSize) {
          const batch = names.slice(i, i + batchSize);
          console.log(`[${new Date().toISOString()}] Streaming batch of ${batch.length} names`);

          // 发送数据
          const data = `data: ${JSON.stringify(batch)}\n\n`;
          controller.enqueue(new TextEncoder().encode(data));

          // 添加小延迟以避免客户端过载
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // 发送完成消息
        console.log(`[${new Date().toISOString()}] Name streaming complete, sending completion message`);
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ complete: true })}\n\n`));
        controller.close();
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error streaming names:`, error);
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ error: 'Failed to stream names' })}\n\n`));
        controller.close();
      }
    }
  });

  // Return the stream as a Server-Sent Events response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}