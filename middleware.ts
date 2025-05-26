import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('access_token')?.value;

  // 如果用户尝试访问 /core/* 路径但未登录，则重定向到登录页面
  if (pathname.startsWith('/core') && !accessToken) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 如果用户已登录但尝试访问登录页面，则重定向到 /core
  if (pathname === '/login' && accessToken) {
    const coreUrl = new URL('/core', request.url);
    return NextResponse.redirect(coreUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};