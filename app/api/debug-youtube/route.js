export async function GET() {
  const apiKey = process.env.YOUTUBE_API_KEY

  if (!apiKey) {
    return Response.json({ error: 'YOUTUBE_API_KEY env var is not set' })
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=UCu4ftCdHwu6imYFbjIUAbhg&maxResults=1&order=date&type=video&key=${apiKey}`
    )
    const data = await res.json()
    return Response.json({
      status: res.status,
      hasItems: !!data.items,
      itemCount: data.items?.length ?? 0,
      firstVideoId: data.items?.[0]?.id?.videoId ?? null,
      error: data.error ?? null
    })
  } catch (e) {
    return Response.json({ error: e.message })
  }
}
