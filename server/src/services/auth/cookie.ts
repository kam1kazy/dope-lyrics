export async function getCookie(name: string, prisma: any) {
	const cookie = await prisma.cookie.findUnique({ where: { name } })
	return cookie
}

export async function setCookie(name: string, value: string, prisma: any) {
	const cookie = await prisma.cookie.create({ data: { name, value } })
	return cookie
}
