/**
 * Minimal Faculty API smoke checks (no auth).
 * Run with dev server up: node api-tests/smoke-faculty.mjs
 * Expects 401 JSON with success:false and data:null for protected GET /api/faculty.
 */
const base = process.env.TEST_BASE_URL || "http://localhost:3000";

async function main() {
	const url = `${base}/api/faculty`;
	const res = await fetch(url);
	const json = await res.json().catch(() => ({}));

	const okShape =
		res.status === 401 &&
		json.success === false &&
		json.data === null &&
		json.error &&
		typeof json.error.message === "string";

	if (!okShape) {
		console.error("FAIL: expected 401 + { success:false, data:null, error:{...} }", res.status, json);
		process.exit(1);
	}

	console.log("OK: unauthenticated /api/faculty returns structured 401");
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
