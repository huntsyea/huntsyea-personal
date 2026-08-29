const headers = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=3600",
  "Content-Type": "application/json",
};

export function GET() {
  return Response.json(
    {
      "m.homeserver": {
        base_url: "https://matrix.huntsyea.com",
      },
      "org.matrix.msc4143.rtc_foci": [
        {
          type: "livekit",
          livekit_service_url: "https://mrtc.huntsyea.com",
        },
      ],
    },
    { headers },
  );
}
