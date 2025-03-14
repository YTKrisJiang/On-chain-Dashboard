import { NextResponse } from 'next/server';

export function middleware(request) {
  // 获取请求的路径
  const { pathname } = request.nextUrl;

  // 如果路径是 /dashboard，重定向到根路径
  if (pathname === '/dashboard') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 对于其他路径，继续正常处理
  return NextResponse.next();
}

// 配置中间件应用的路径
export const config = {
  matcher: ['/dashboard'],
}; 