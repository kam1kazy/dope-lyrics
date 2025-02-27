export { auth as middleware } from '@/lib/auth'

export const config = {
    matcher: ["/profile"],
    // matcher: ["/((?!register|api|login).*)"],
};