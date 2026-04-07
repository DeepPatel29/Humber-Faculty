import { PrismaClient, AppRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	console.log("🌱 Seeding database...");

	const dept = await prisma.department.upsert({
		where: { code: "CS" },
		update: {},
		create: {
			name: "Computer Science",
			code: "CS",
			description: "Computer Science & Engineering",
		},
	});

	const generalDept = await prisma.department.upsert({
		where: { code: "GENERAL" },
		update: {},
		create: {
			name: "General",
			code: "GENERAL",
			description: "Default department",
		},
	});

	const courses = [
		{ name: "Machine Learning", code: "CS501", credits: 4, departmentId: dept.id },
		{ name: "Deep Learning", code: "CS601", credits: 3, departmentId: dept.id },
		{ name: "Data Structures", code: "CS201", credits: 3, departmentId: dept.id },
		{ name: "Algorithms", code: "CS401", credits: 3, departmentId: dept.id },
		{ name: "Database Systems", code: "CS301", credits: 3, departmentId: dept.id },
	];

	for (const c of courses) {
		await prisma.course.upsert({
			where: { code: c.code },
			update: {},
			create: c,
		});
	}

	let semester = await prisma.semester.findFirst();
	if (!semester) {
		semester = await prisma.semester.create({
			data: { name: "Default academic period (seed)" },
		});
	}

	const allCourses = await prisma.course.findMany();
	for (const courseRow of allCourses) {
		const existingTerm = await prisma.term.findFirst({
			where: { courseId: courseRow.id, semesterId: semester.id },
		});
		if (!existingTerm) {
			await prisma.term.create({
				data: { courseId: courseRow.id, semesterId: semester.id },
			});
		}
	}

	const rooms = [
		{ name: "LH-101", building: "Engineering", floor: 1, capacity: 120, type: "lecture_hall" },
		{ name: "Lab-201", building: "Engineering", floor: 2, capacity: 40, type: "lab" },
		{ name: "CR-301", building: "Engineering", floor: 3, capacity: 60, type: "classroom" },
		{ name: "LH-102", building: "Engineering", floor: 1, capacity: 100, type: "lecture_hall" },
	];

	for (const r of rooms) {
		const existing = await prisma.room.findFirst({ where: { name: r.name } });
		if (!existing) {
			await prisma.room.create({ data: r });
		}
	}

	const testUsers: Array<{
		email: string;
		name: string;
		role: AppRole;
		designation: string;
		skipFaculty?: boolean;
	}> = [
		{
			email: "admin@university.edu",
			name: "Admin User",
			role: AppRole.ADMIN,
			designation: "Department Head",
		},
		{
			email: "faculty@university.edu",
			name: "Dr. John Smith",
			role: AppRole.STAFF,
			designation: "Associate Professor",
		},
		{
			email: "scheduler@university.edu",
			name: "Scheduler User",
			role: AppRole.SCHEDULER,
			designation: "Schedule Coordinator",
		},
		{
			email: "student@university.edu",
			name: "Student User",
			role: AppRole.STUDENT,
			designation: "Student",
			skipFaculty: true,
		},
	];

	for (const testUser of testUsers) {
		const existingUser = await prisma.user.findUnique({
			where: { email: testUser.email },
		});

		if (existingUser) {
			console.log(`✓ User ${testUser.email} already exists (role: ${existingUser.role})`);
			continue;
		}

		const user = await prisma.user.create({
			data: {
				email: testUser.email,
				name: testUser.name,
				role: testUser.role,
				emailVerified: true,
			},
		});

		if (testUser.skipFaculty) {
			console.log(`✓ Created ${testUser.role} user (no faculty row): ${testUser.email}`);
			continue;
		}

		const faculty = await prisma.faculty.create({
			data: {
				userId: user.id,
				departmentId: dept.id,
				employeeId: `EMP-${user.id.slice(0, 8).toUpperCase()}`,
				designation: testUser.designation,
			},
		});

		await prisma.facultyProfile.create({
			data: {
				facultyId: faculty.id,
				bio: `${testUser.name} is a ${testUser.designation.toLowerCase()}.`,
				phone: "+1-555-000-0000",
				officeLocation: "Engineering Building, Room 100",
				officeHours: "Mon-Fri: 9:00 AM - 5:00 PM",
				researchInterests: [],
				qualifications: [],
				publications: [],
				socialLinks: {},
			},
		});

		console.log(`✓ Created ${testUser.role} user: ${testUser.email}`);
	}

	console.log("\n📋 Test Credentials:");
	console.log("─────────────────────────────────");
	console.log("Admin:     admin@university.edu");
	console.log("Staff:     faculty@university.edu");
	console.log("Scheduler: scheduler@university.edu");
	console.log("Student:   student@university.edu");
	console.log("─────────────────────────────────");
	console.log("\n⚠️  You need to SIGN UP first at /signup");
	console.log("   Or use the existing users if already registered.");
	console.log("\n✅ Seed complete!");
}

main()
	.then(() => prisma.$disconnect())
	.catch((e) => {
		console.error(e);
		prisma.$disconnect();
		process.exit(1);
	});
