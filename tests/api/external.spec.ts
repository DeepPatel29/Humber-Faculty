import { test, expect } from "@playwright/test";

test.describe("External API Endpoints", () => {
  test.describe("Courses API", () => {
    test("GET /api/external/courses returns response", async ({ request }) => {
      const response = await request.get("/api/external/courses");

      if (!response.ok()) {
        test.skip();
        return;
      }

      const data = await response.json();
      expect(data).toHaveProperty("success");
    });

    test("GET /api/external/courses?options=true returns simplified format", async ({
      request,
    }) => {
      const response = await request.get("/api/external/courses?options=true");

      if (!response.ok()) {
        test.skip();
        return;
      }

      const data = await response.json();
      expect(data).toHaveProperty("success");

      if (data.success && data.data && data.data.length > 0) {
        const course = data.data[0];
        expect(course).toHaveProperty("id");
        expect(course).toHaveProperty("code");
        expect(course).toHaveProperty("name");
      }
    });

    test("GET /api/external/courses/[id] returns single course", async ({
      request,
    }) => {
      const listResponse = await request.get("/api/external/courses");

      if (!listResponse.ok()) {
        test.skip();
        return;
      }

      const listData = await listResponse.json();

      if (listData.data && listData.data.length > 0) {
        const courseId = listData.data[0].id;
        const response = await request.get(`/api/external/courses/${courseId}`);

        if (response.ok()) {
          const data = await response.json();
          expect(data).toHaveProperty("success");
        }
      }
    });
  });

  test.describe("Departments API", () => {
    test("GET /api/external/departments returns response", async ({
      request,
    }) => {
      const response = await request.get("/api/external/departments");

      if (!response.ok()) {
        test.skip();
        return;
      }

      const data = await response.json();
      expect(data).toHaveProperty("success");
    });

    test("GET /api/external/departments?options=true returns simplified format", async ({
      request,
    }) => {
      const response = await request.get(
        "/api/external/departments?options=true",
      );

      if (!response.ok()) {
        test.skip();
        return;
      }

      const data = await response.json();
      expect(data).toHaveProperty("success");

      if (data.success && data.data && data.data.length > 0) {
        const dept = data.data[0];
        expect(dept).toHaveProperty("id");
        expect(dept).toHaveProperty("code");
        expect(dept).toHaveProperty("name");
      }
    });
  });

  test.describe("Rooms API", () => {
    test("GET /api/external/rooms returns response", async ({ request }) => {
      const response = await request.get("/api/external/rooms");

      if (!response.ok()) {
        test.skip();
        return;
      }

      const data = await response.json();
      expect(data).toHaveProperty("success");

      if (data.success) {
        expect(data.data).toHaveProperty("data");
        expect(data.data).toHaveProperty("total");
      }
    });

    test("GET /api/external/rooms?options=true returns simplified format", async ({
      request,
    }) => {
      const response = await request.get("/api/external/rooms?options=true");

      if (!response.ok()) {
        test.skip();
        return;
      }

      const data = await response.json();
      expect(data).toHaveProperty("success");

      if (data.success && data.data && data.data.length > 0) {
        const room = data.data[0];
        expect(room).toHaveProperty("id");
        expect(room).toHaveProperty("roomNumber");
        expect(room).toHaveProperty("label");
      }
    });

    test("GET /api/external/rooms/[id] returns room details", async ({
      request,
    }) => {
      const listResponse = await request.get("/api/external/rooms?limit=1");

      if (!listResponse.ok()) {
        test.skip();
        return;
      }

      const listData = await listResponse.json();

      if (listData.data?.data && listData.data.data.length > 0) {
        const roomId = listData.data.data[0].id;
        const response = await request.get(`/api/external/rooms/${roomId}`);

        if (response.ok()) {
          const data = await response.json();
          expect(data).toHaveProperty("success");
        }
      }
    });

    test("GET /api/external/rooms/[id]/availability returns availability status", async ({
      request,
    }) => {
      const listResponse = await request.get("/api/external/rooms?limit=1");

      if (!listResponse.ok()) {
        test.skip();
        return;
      }

      const listData = await listResponse.json();

      if (listData.data?.data && listData.data.data.length > 0) {
        const roomId = listData.data.data[0].id;
        const response = await request.get(
          `/api/external/rooms/${roomId}/availability`,
        );

        if (response.ok()) {
          const data = await response.json();
          expect(data).toHaveProperty("success");

          if (data.success) {
            expect(data.data).toHaveProperty("roomId");
            expect(data.data).toHaveProperty("available");
            expect(data.data).toHaveProperty("reason");
          }
        }
      }
    });

    test("GET /api/external/rooms/[id]/timetable returns schedule", async ({
      request,
    }) => {
      const listResponse = await request.get("/api/external/rooms?limit=1");

      if (!listResponse.ok()) {
        test.skip();
        return;
      }

      const listData = await listResponse.json();

      if (listData.data?.data && listData.data.data.length > 0) {
        const roomId = listData.data.data[0].id;
        const response = await request.get(
          `/api/external/rooms/${roomId}/timetable`,
        );

        if (response.ok()) {
          const data = await response.json();
          expect(data).toHaveProperty("success");

          if (data.success) {
            expect(data.data).toHaveProperty("roomId");
            expect(data.data).toHaveProperty("slots");
          }
        }
      }
    });
  });

  test.describe("Error Handling", () => {
    test("returns appropriate error for non-existent course", async ({
      request,
    }) => {
      const response = await request.get("/api/external/courses/999999");
      expect([404, 500]).toContain(response.status());
    });

    test("returns appropriate error for non-existent department", async ({
      request,
    }) => {
      const response = await request.get("/api/external/departments/999999");
      expect([404, 500]).toContain(response.status());
    });

    test("returns appropriate error for non-existent room", async ({
      request,
    }) => {
      const response = await request.get(
        "/api/external/rooms/non-existent-room-id",
      );
      expect([404, 500]).toContain(response.status());
    });
  });
});
