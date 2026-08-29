const headers = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=3600",
  "Content-Type": "application/json",
};

export function GET() {
  return Response.json(
    {
      "m.server": "matrix.huntsyea.com:443",
    },
    { headers },
  );
}
