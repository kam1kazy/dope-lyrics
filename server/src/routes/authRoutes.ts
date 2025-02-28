import { prisma } from '~/lib/prisma'; // Убедитесь, что prisma импортирован правильно
import { App } from '~/index';

export const authRoutes = (app: App) => {
    app.post("/register", async ({ body, set, jwt }: { body: any; set: any; jwt: { sign: (payload: any) => Promise<string> } }) => {
        const { email, password, name } = body as {
            email: string;
            password: string;
            name: string;
        };

        // Проверка, существует ли пользователь
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            set.status = 400;
            return { error: "User already exists" };
        }

        // Хеширование пароля
        const hashedPassword = await Bun.password.hash(password, {
            algorithm: "bcrypt",
        });

        // Создание пользователя
        const user = await prisma.user.create({
            data: { email, password: hashedPassword, name, role: 'user' },
        });

        // Генерация JWT
        const token = await jwt.sign({ id: user.id, email: user.email });

        // Установка куки с токеном
        set.cookie = {
            auth: {
                value: token,
                httpOnly: true,
                maxAge: 7 * 86400, // 7 дней
                path: "/",
            },
        };

        return { message: "User registered", user: { id: user.id, email, name } };
    });

    app.post("/login", async ({ body, set, jwt }: { body: any; set: any; jwt: { sign: (payload: any) => Promise<string> } }) => {
        const { email, password } = body as { email: string; password: string };

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            set.status = 401;
            return { error: "Invalid credentials" };
        }

        const isValid = await Bun.password.verify(password, user.password as string);
        if (!isValid) {
            set.status = 401;
            return { error: "Invalid credentials" };
        }

        const token = await jwt.sign({ id: user.id, email: user.email });
        set.cookie = {
            auth: {
                value: token,
                httpOnly: true,
                maxAge: 7 * 86400,
                path: "/",
            },
        };

        return { message: "Logged in", user: { id: user.id, email: user.email } };
    });

    app.post("/logout", ({ set }) => {
        set.cookie = {
            auth: {
                value: "",
                httpOnly: true,
                maxAge: 0,
                path: "/",
            },
        };
        return { message: "Logged out" };
    });

    app.get("/me", async ({ jwt, cookie: { auth }, set }: { jwt: { verify: (token: string) => Promise<any> }; cookie: { auth: { value: string } }; set: any }) => {
        const token = auth;
        if (!token) {
            set.status = 401;
            return { error: "Unauthorized" };
        }

        const payload = await jwt.verify(token.value);
        if (!payload) {
            set.status = 401;
            return { error: "Invalid token" };
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.id as number },
        });
        if (!user) {
            set.status = 404;
            return { error: "User not found" };
        }

        return { id: user.id, email: user.email, name: user.name };
    });
};
