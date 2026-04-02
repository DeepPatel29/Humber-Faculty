import {
  DayOfWeek,
  PreferredSlot,
  RequestStatus,
  RequestType,
  NotificationType,
  ScheduleItemType,
  type Faculty,
  type FacultyProfile,
  type FacultyScheduleItem,
  type FacultyAvailability,
  type FacultyRequest,
  type FacultyNotification,
  type ClassOption,
  type ColleagueOption,
  type DashboardResponse,
  type Course,
  type Room,
  type Department,
  type User,
} from "@/lib/types/faculty";

// ============================================================================
// Mock User & Department
// ============================================================================

const mockUser: User = {
  id: "user-1",
  email: "john.smith@university.edu",
  name: "Dr. John Smith",
  role: "STAFF",
  avatarUrl: null,
  createdAt: new Date("2020-01-15"),
  updatedAt: new Date("2024-01-01"),
};

const mockDepartment: Department = {
  id: "dept-1",
  name: "Computer Science",
  code: "CS",
  description: "Department of Computer Science and Engineering",
};

// ============================================================================
// Mock Faculty
// ============================================================================

export const mockFaculty: Faculty = {
  id: "faculty-1",
  userId: "user-1",
  departmentId: "dept-1",
  employeeId: "EMP-CS-001",
  designation: "Associate Professor",
  joiningDate: new Date("2018-08-01"),
  user: mockUser,
  department: mockDepartment,
};

// ============================================================================
// Mock Profile
// ============================================================================

export const mockProfile: FacultyProfile = {
  id: "profile-1",
  facultyId: "faculty-1",
  bio: "Dr. John Smith is an Associate Professor specializing in Machine Learning and Artificial Intelligence. With over 15 years of research experience, he has published extensively in top-tier conferences and journals.",
  phone: "+1-555-123-4567",
  officeLocation: "Engineering Building, Room 405",
  officeHours: "Mon & Wed: 2:00 PM - 4:00 PM, Fri: 10:00 AM - 12:00 PM",
  researchInterests: [
    "Machine Learning",
    "Deep Learning",
    "Natural Language Processing",
    "Computer Vision",
  ],
  qualifications: [
    "Ph.D. in Computer Science, MIT (2010)",
    "M.S. in Computer Science, Stanford (2006)",
    "B.Tech in Computer Engineering, IIT Delhi (2004)",
  ],
  publications: [
    "Smith, J. et al. (2023). 'Advances in Neural Architecture Search'. NeurIPS.",
    "Smith, J. & Doe, A. (2022). 'Efficient Transformers for Edge Devices'. ICML.",
    "Smith, J. (2021). 'Survey of Modern Deep Learning Techniques'. IEEE TPAMI.",
  ],
  socialLinks: {
    linkedin: "https://linkedin.com/in/drjohnsmith",
    github: "https://github.com/jsmith",
    googleScholar: "https://scholar.google.com/citations?user=jsmith",
  },
};

// ============================================================================
// Mock Courses & Rooms
// ============================================================================

const mockCourses: Course[] = [
  { id: "course-1", name: "Machine Learning", code: "CS501", description: null, credits: 4, departmentId: "dept-1" },
  { id: "course-2", name: "Deep Learning", code: "CS601", description: null, credits: 3, departmentId: "dept-1" },
  { id: "course-3", name: "Data Structures", code: "CS201", description: null, credits: 4, departmentId: "dept-1" },
  { id: "course-4", name: "Algorithms", code: "CS301", description: null, credits: 4, departmentId: "dept-1" },
];

const mockRooms: Room[] = [
  { id: "room-1", name: "LH-101", building: "Engineering", floor: 1, capacity: 100, type: "lecture_hall" },
  { id: "room-2", name: "Lab-201", building: "Engineering", floor: 2, capacity: 40, type: "computer_lab" },
  { id: "room-3", name: "CR-301", building: "Engineering", floor: 3, capacity: 50, type: "classroom" },
  { id: "room-4", name: "Seminar-401", building: "Engineering", floor: 4, capacity: 30, type: "seminar_room" },
];

// ============================================================================
// Mock Schedule
// ============================================================================

export const mockSchedule: FacultyScheduleItem[] = [
  {
    id: "schedule-1",
    facultyId: "faculty-1",
    courseId: "course-1",
    roomId: "room-1",
    dayOfWeek: DayOfWeek.MONDAY,
    startTime: "09:00",
    endTime: "10:30",
    type: ScheduleItemType.LECTURE,
    section: "A",
    program: "B.Tech",
    semester: 5,
    academicYear: "2024-25",
    isActive: true,
    course: mockCourses[0],
    room: mockRooms[0],
  },
  {
    id: "schedule-2",
    facultyId: "faculty-1",
    courseId: "course-2",
    roomId: "room-2",
    dayOfWeek: DayOfWeek.MONDAY,
    startTime: "14:00",
    endTime: "15:30",
    type: ScheduleItemType.LAB,
    section: "A",
    program: "M.Tech",
    semester: 1,
    academicYear: "2024-25",
    isActive: true,
    course: mockCourses[1],
    room: mockRooms[1],
  },
  {
    id: "schedule-3",
    facultyId: "faculty-1",
    courseId: "course-1",
    roomId: "room-1",
    dayOfWeek: DayOfWeek.TUESDAY,
    startTime: "11:00",
    endTime: "12:30",
    type: ScheduleItemType.LECTURE,
    section: "B",
    program: "B.Tech",
    semester: 5,
    academicYear: "2024-25",
    isActive: true,
    course: mockCourses[0],
    room: mockRooms[0],
  },
  {
    id: "schedule-4",
    facultyId: "faculty-1",
    courseId: "course-3",
    roomId: "room-3",
    dayOfWeek: DayOfWeek.WEDNESDAY,
    startTime: "09:00",
    endTime: "10:30",
    type: ScheduleItemType.LECTURE,
    section: "A",
    program: "B.Tech",
    semester: 3,
    academicYear: "2024-25",
    isActive: true,
    course: mockCourses[2],
    room: mockRooms[2],
  },
  {
    id: "schedule-5",
    facultyId: "faculty-1",
    courseId: "course-4",
    roomId: "room-4",
    dayOfWeek: DayOfWeek.THURSDAY,
    startTime: "14:00",
    endTime: "15:30",
    type: ScheduleItemType.SEMINAR,
    section: null,
    program: "Ph.D",
    semester: null,
    academicYear: "2024-25",
    isActive: true,
    course: mockCourses[3],
    room: mockRooms[3],
  },
  {
    id: "schedule-6",
    facultyId: "faculty-1",
    courseId: "course-2",
    roomId: "room-1",
    dayOfWeek: DayOfWeek.FRIDAY,
    startTime: "10:00",
    endTime: "11:30",
    type: ScheduleItemType.LECTURE,
    section: "A",
    program: "M.Tech",
    semester: 1,
    academicYear: "2024-25",
    isActive: true,
    course: mockCourses[1],
    room: mockRooms[0],
  },
];

// ============================================================================
// Mock Availability
// ============================================================================

export const mockAvailability: FacultyAvailability = {
  id: "availability-1",
  facultyId: "faculty-1",
  preferredSlot: PreferredSlot.MORNING,
  customStartTime: "08:00",
  customEndTime: "16:00",
  unavailableStart: "12:00",
  unavailableEnd: "13:00",
  notes: "Lunch break: 12:00-13:00. Research meetings on Wednesday afternoons.",
  days: [
    { id: "day-1", availabilityId: "availability-1", dayOfWeek: DayOfWeek.MONDAY, isAvailable: true },
    { id: "day-2", availabilityId: "availability-1", dayOfWeek: DayOfWeek.TUESDAY, isAvailable: true },
    { id: "day-3", availabilityId: "availability-1", dayOfWeek: DayOfWeek.WEDNESDAY, isAvailable: true },
    { id: "day-4", availabilityId: "availability-1", dayOfWeek: DayOfWeek.THURSDAY, isAvailable: true },
    { id: "day-5", availabilityId: "availability-1", dayOfWeek: DayOfWeek.FRIDAY, isAvailable: true },
    { id: "day-6", availabilityId: "availability-1", dayOfWeek: DayOfWeek.SATURDAY, isAvailable: false },
    { id: "day-7", availabilityId: "availability-1", dayOfWeek: DayOfWeek.SUNDAY, isAvailable: false },
  ],
};

// ============================================================================
// Mock Requests
// ============================================================================

export const mockRequests: FacultyRequest[] = [
  {
    id: "request-1",
    facultyId: "faculty-1",
    type: RequestType.SWAP,
    status: RequestStatus.PENDING,
    title: "Swap CS501 Monday class with Dr. Jane Doe",
    description: "Requesting to swap Monday 9:00 AM class due to research meeting conflict.",
    requestDate: new Date("2024-01-10"),
    effectiveDate: new Date("2024-01-22"),
    endDate: null,
    targetFacultyId: "faculty-2",
    targetScheduleId: "schedule-10",
    newDate: null,
    newStartTime: null,
    newEndTime: null,
    reason: "I have an important research collaboration meeting that conflicts with this time slot.",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
    timeline: [
      {
        id: "timeline-1",
        requestId: "request-1",
        status: RequestStatus.PENDING,
        comment: "Request submitted",
        createdBy: "faculty-1",
        createdAt: new Date("2024-01-10"),
      },
    ],
  },
  {
    id: "request-2",
    facultyId: "faculty-1",
    type: RequestType.RESCHEDULE,
    status: RequestStatus.APPROVED,
    title: "Reschedule CS601 Lab to Thursday",
    description: "Move Monday lab session to Thursday due to equipment maintenance.",
    requestDate: new Date("2024-01-05"),
    effectiveDate: new Date("2024-01-15"),
    endDate: null,
    targetFacultyId: null,
    targetScheduleId: "schedule-2",
    newDate: new Date("2024-01-18"),
    newStartTime: "14:00",
    newEndTime: "15:30",
    reason: "Lab equipment scheduled for maintenance on Monday. Thursday slot is available.",
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-08"),
    timeline: [
      {
        id: "timeline-2",
        requestId: "request-2",
        status: RequestStatus.PENDING,
        comment: "Request submitted",
        createdBy: "faculty-1",
        createdAt: new Date("2024-01-05"),
      },
      {
        id: "timeline-3",
        requestId: "request-2",
        status: RequestStatus.APPROVED,
        comment: "Approved by department head",
        createdBy: "admin-1",
        createdAt: new Date("2024-01-08"),
      },
    ],
  },
  {
    id: "request-3",
    facultyId: "faculty-1",
    type: RequestType.LEAVE,
    status: RequestStatus.REJECTED,
    title: "Medical Leave Request",
    description: "Requesting leave for medical appointment.",
    requestDate: new Date("2024-01-02"),
    effectiveDate: new Date("2024-01-12"),
    endDate: new Date("2024-01-12"),
    targetFacultyId: null,
    targetScheduleId: null,
    newDate: null,
    newStartTime: null,
    newEndTime: null,
    reason: "Medical appointment that cannot be rescheduled.",
    createdAt: new Date("2024-01-02"),
    updatedAt: new Date("2024-01-04"),
    timeline: [
      {
        id: "timeline-4",
        requestId: "request-3",
        status: RequestStatus.PENDING,
        comment: "Request submitted",
        createdBy: "faculty-1",
        createdAt: new Date("2024-01-02"),
      },
      {
        id: "timeline-5",
        requestId: "request-3",
        status: RequestStatus.REJECTED,
        comment: "Please reschedule - important exam scheduled for that day",
        createdBy: "admin-1",
        createdAt: new Date("2024-01-04"),
      },
    ],
  },
];

// ============================================================================
// Mock Notifications
// ============================================================================

export const mockNotifications: FacultyNotification[] = [
  {
    id: "notif-1",
    facultyId: "faculty-1",
    type: NotificationType.REQUEST_UPDATE,
    title: "Request Approved",
    message: "Your reschedule request for CS601 Lab has been approved.",
    isRead: false,
    link: "/faculty/requests?id=request-2",
    createdAt: new Date("2024-01-08T10:30:00"),
  },
  {
    id: "notif-2",
    facultyId: "faculty-1",
    type: NotificationType.SCHEDULE_CHANGE,
    title: "Room Change",
    message: "CS501 Monday class has been moved to LH-102 due to maintenance.",
    isRead: false,
    link: "/faculty/timetable",
    createdAt: new Date("2024-01-07T14:00:00"),
  },
  {
    id: "notif-3",
    facultyId: "faculty-1",
    type: NotificationType.ANNOUNCEMENT,
    title: "Department Meeting",
    message: "Reminder: Faculty meeting scheduled for Friday at 3:00 PM.",
    isRead: true,
    link: null,
    createdAt: new Date("2024-01-06T09:00:00"),
  },
  {
    id: "notif-4",
    facultyId: "faculty-1",
    type: NotificationType.REQUEST_UPDATE,
    title: "Request Rejected",
    message: "Your leave request for January 12 has been rejected. Please check comments.",
    isRead: true,
    link: "/faculty/requests?id=request-3",
    createdAt: new Date("2024-01-04T11:00:00"),
  },
  {
    id: "notif-5",
    facultyId: "faculty-1",
    type: NotificationType.REMINDER,
    title: "Attendance Submission",
    message: "Please submit attendance records for last week before Wednesday.",
    isRead: true,
    link: null,
    createdAt: new Date("2024-01-03T08:00:00"),
  },
];

// ============================================================================
// Mock Class & Colleague Options
// ============================================================================

export const mockClassOptions: ClassOption[] = mockSchedule.map((s) => ({
  id: s.id,
  courseId: s.courseId,
  courseName: s.course.name,
  courseCode: s.course.code,
  dayOfWeek: s.dayOfWeek,
  startTime: s.startTime,
  endTime: s.endTime,
  room: `${s.room.building} ${s.room.name}`,
}));

export const mockColleagues: ColleagueOption[] = [
  {
    id: "faculty-2",
    name: "Dr. Jane Doe",
    email: "jane.doe@university.edu",
    designation: "Professor",
    department: "Computer Science",
    avatarUrl: null,
  },
  {
    id: "faculty-3",
    name: "Dr. Robert Johnson",
    email: "r.johnson@university.edu",
    designation: "Assistant Professor",
    department: "Computer Science",
    avatarUrl: null,
  },
  {
    id: "faculty-4",
    name: "Dr. Emily Chen",
    email: "e.chen@university.edu",
    designation: "Associate Professor",
    department: "Computer Science",
    avatarUrl: null,
  },
  {
    id: "faculty-5",
    name: "Dr. Michael Brown",
    email: "m.brown@university.edu",
    designation: "Professor",
    department: "Mathematics",
    avatarUrl: null,
  },
];

// ============================================================================
// Mock Dashboard Response
// ============================================================================

const today = new Date();
const dayOfWeek = today.getDay();
const dayNames: DayOfWeek[] = [
  DayOfWeek.SUNDAY,
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
];

export const mockDashboardData: DashboardResponse = {
  faculty: {
    id: mockFaculty.id,
    designation: mockFaculty.designation,
    user: {
      name: mockFaculty.user.name,
      email: mockFaculty.user.email,
      avatarUrl: mockFaculty.user.avatarUrl,
    },
    department: {
      name: mockFaculty.department.name,
    },
  },
  summaryCards: [
    { label: "Classes This Week", value: 6, change: 0, changeLabel: "vs last week", icon: "calendar" },
    { label: "Total Students", value: 245, change: 12, changeLabel: "new this semester", icon: "users" },
    { label: "Pending Requests", value: 1, change: -2, changeLabel: "vs last week", icon: "clock" },
    { label: "Office Hours", value: "6h", changeLabel: "this week", icon: "briefcase" },
  ],
  todaySchedule: mockSchedule.filter((s) => s.dayOfWeek === dayNames[dayOfWeek]),
  upcomingSchedule: mockSchedule.slice(0, 3),
  recentNotifications: mockNotifications.slice(0, 3),
  pendingRequests: 1,
};
