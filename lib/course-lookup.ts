import { db } from "@/lib/db";

export interface CourseLookup {
	name: string;
	code: string;
}

export async function resolveCourseMap(
	courseIds: (string | null)[]
): Promise<Map<string, CourseLookup>> {
	const map = new Map<string, CourseLookup>();
	const uniqueIds = [...new Set(courseIds.filter(Boolean))] as string[];

	if (uniqueIds.length === 0 || !db) return map;

	const intIds = uniqueIds
		.map((id) => parseInt(id, 10))
		.filter((id) => !isNaN(id));

	if (intIds.length === 0) {
		uniqueIds.forEach((id) => map.set(id, { name: "Unknown", code: "" }));
		return map;
	}

	const courses = await db.sharedCourse.findMany({
		where: { id: { in: intIds } },
		select: { id: true, name: true, code: true },
	});

	courses.forEach((c) => {
		map.set(String(c.id), { name: c.name, code: c.code });
	});

	uniqueIds.forEach((id) => {
		if (!map.has(id)) {
			map.set(id, { name: "Unknown", code: "" });
		}
	});

	return map;
}
